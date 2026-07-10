// ═══════════════════════════════════════════════════════════════════════
//  QAVIX GLOBAL — server.js  (single file, everything inside)
// ═══════════════════════════════════════════════════════════════════════
require('dotenv').config();

const express      = require('express');
const crypto       = require('crypto');
const { Pool }     = require('pg');
const bcrypt       = require('bcryptjs');
const jwt          = require('jsonwebtoken');
const cors         = require('cors');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const { ethers }   = require('ethers'); // HD wallet address derivation + on-chain deposit scanning

const app  = express();
const PORT = process.env.PORT || 5000;

// Trust Render's proxy
app.set('trust proxy', 1);

// ── Neon PostgreSQL pool ─────────────────────────────────────────────────
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;

const db = (text, params) => pool.query(text, params);

// ═══════════════════════════════════════════════════════════════════════
//  HD WALLET — one master seed → a unique, permanent BEP20 deposit address
//  per user (BIP-44, same derivation as Ethereum since BSC is EVM-compatible).
//  The mnemonic lives ONLY in an environment variable — never in the database,
//  never in a response, never logged. Only this process derives addresses/keys.
// ═══════════════════════════════════════════════════════════════════════
const HD_MNEMONIC         = process.env.HD_MASTER_MNEMONIC || null; // set in Render env vars ONLY — never commit this
const BSC_RPC_URL         = process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org';
const USDT_BEP20_CONTRACT = process.env.USDT_BEP20_CONTRACT || '0x55d398326f99059fF775485246999027B3197955';
const USDT_DECIMALS       = 18; // Binance-Peg BSC-USD (BEP20) uses 18 decimals — NOT 6 like TRC20/ERC20 USDT
const DEPOSIT_CONFIRMATIONS = parseInt(process.env.DEPOSIT_CONFIRMATIONS) || 15; // ~45s on BSC — protects against reorgs
const HD_DERIVATION_BASE  = "m/44'/60'/0'/0/"; // Ethereum coin-type path — valid for any EVM chain, including BSC

// ── Auto-sweep — moves each user's deposited USDT out of their own child
// address into one real wallet you control, fully automatically. Index 0 of
// the SAME HD tree is reserved as the "gas tank": it never gets assigned to
// a user (hd_deposit_index_seq starts at 1), and admin keeps it topped up
// with a small BNB balance so the sweep bot can pay gas on users' behalf.
const MAIN_COLLECTION_WALLET = process.env.MAIN_COLLECTION_WALLET || null; // address only — where swept funds end up
const GAS_TOPUP_BNB          = process.env.GAS_TOPUP_BNB || '0.0008';       // BNB sent to a child address before sweeping it
const GAS_RESERVE_INDEX      = 0;
const GAS_RESERVE_LOW_THRESHOLD = parseFloat(process.env.GAS_RESERVE_LOW_THRESHOLD) || 0.01; // BNB — below this, alert admin
const GAS_ALERT_COOLDOWN_HOURS  = 6; // don't re-alert more often than this while still low

let hdMaster = null;     // ethers.HDNodeWallet — used only to derive addresses/keys, never persisted
let bscProvider = null;  // ethers.JsonRpcProvider — used only by the background scanner
if (HD_MNEMONIC) {
  try {
    hdMaster = ethers.HDNodeWallet.fromPhrase(HD_MNEMONIC.trim());
    bscProvider = new ethers.JsonRpcProvider(BSC_RPC_URL);
    console.log('✅ HD wallet master loaded — auto-deposit scanning available');
  } catch (e) {
    console.error('❌ HD_MASTER_MNEMONIC is invalid — auto-deposit disabled:', e.message);
  }
} else {
  console.log('ℹ️  HD_MASTER_MNEMONIC not set — per-user deposit addresses disabled (manual deposit flow still works)');
}

// Deterministic — no DB lookup needed to compute an address for a given index.
function deriveDepositAddress(index) {
  if (!hdMaster) return null;
  return hdMaster.derivePath(HD_DERIVATION_BASE + index).address;
}
// Only called when actually sweeping funds out of a child address — derives
// the private key for that one index on demand; never stored anywhere.
function deriveDepositWallet(index) {
  if (!hdMaster) return null;
  return hdMaster.derivePath(HD_DERIVATION_BASE + index);
}

const USDT_ABI = ['event Transfer(address indexed from, address indexed to, uint256 value)'];
let _scannerRunning = false;

// Scans confirmed blocks since the last check for USDT (BEP20) Transfer
// events landing in ANY known user deposit address, and auto-credits the
// matching user the instant one is found — no admin approval needed, since
// the blockchain confirmation itself is the verification. After crediting,
// it also attempts to auto-sweep that deposit into MAIN_COLLECTION_WALLET —
// sweep success/failure never affects the user's already-credited balance.
async function scanOnchainDeposits() {
  if (!hdMaster || !bscProvider || _scannerRunning) return;
  _scannerRunning = true;
  try {
    const { rows: addrRows } = await db(`SELECT id, deposit_address, deposit_address_index FROM users WHERE deposit_address IS NOT NULL`);
    if (!addrRows.length) return; // nobody has a generated address yet — nothing to watch
    const addrToUser = {};
    addrRows.forEach(r => { addrToUser[r.deposit_address.toLowerCase()] = { userId: r.id, index: r.deposit_address_index }; });
    const knownAddresses = addrRows.map(r => r.deposit_address);

    const { rows: settingsRows } = await db(`SELECT value FROM settings WHERE key='onchain_scanner'`);
    let lastCheckedBlock = settingsRows[0]?.value?.lastCheckedBlock;
    const latestBlock = await bscProvider.getBlockNumber();
    const toBlock = latestBlock - DEPOSIT_CONFIRMATIONS;
    if (!lastCheckedBlock) lastCheckedBlock = toBlock - 1; // first run ever — start from "now", don't scan all history
    if (toBlock <= lastCheckedBlock) { await retryFailedSweeps(addrToUser); return; }

    const contract = new ethers.Contract(USDT_BEP20_CONTRACT, USDT_ABI, bscProvider);
    const filter = contract.filters.Transfer(null, knownAddresses);
    // Large gaps (e.g. after downtime) are scanned in chunks so one RPC call
    // never spans an unreasonable block range.
    const CHUNK = 4500;
    let cursor = lastCheckedBlock + 1;
    while (cursor <= toBlock) {
      const end = Math.min(cursor + CHUNK - 1, toBlock);
      const logs = await contract.queryFilter(filter, cursor, end);
      for (const log of logs) {
        const toAddr = (log.args.to || '').toLowerCase();
        const match = addrToUser[toAddr];
        if (!match) continue;
        const amount = parseFloat(ethers.formatUnits(log.args.value, USDT_DECIMALS));
        if (!amount || amount <= 0) continue;
        const logIndex = log.index ?? log.logIndex ?? 0;
        try {
          const { rows: inserted } = await db(
            `INSERT INTO onchain_deposits(user_id, tx_hash, log_index, from_address, to_address, amount, block_number, amount_wei)
             VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (tx_hash, log_index) DO NOTHING RETURNING id`,
            [match.userId, log.transactionHash, logIndex, log.args.from, toAddr, amount, log.blockNumber, log.args.value.toString()]);
          if (!inserted.length) continue; // already processed this exact log before — skip, never double-credit
          await db('UPDATE users SET balance=balance+$1, total_deposited=total_deposited+$1 WHERE id=$2', [amount, match.userId]);
          await db(`INSERT INTO transactions(user_id,type,amount,status,description,meta) VALUES($1,'deposit',$2,'completed',$3,$4)`,
            [match.userId, amount, `Auto-detected deposit (${LIVE_PAYMENT.network||'BEP20'})`, JSON.stringify({network:LIVE_PAYMENT.network||'BEP20', txHash:log.transactionHash, auto:true})]);
          await notif(match.userId, 'deposit', 'Deposit Received', `$${amount.toFixed(2)} USDT detected on-chain and credited to your balance automatically.`);
          // Best-effort — a sweep failure (e.g. gas reserve empty) is logged
          // and retried automatically on later cycles; it never blocks or
          // reverses the balance credit above.
          await attemptSweep(inserted[0].id, match.index, toAddr);
        } catch (e) {
          console.error('Onchain deposit credit error:', e.message);
        }
      }
      cursor = end + 1;
    }
    await saveSetting('onchain_scanner', { lastCheckedBlock: toBlock }, null);
    await retryFailedSweeps(addrToUser);
  } catch (e) {
    console.error('Onchain scanner error:', e.message);
  } finally {
    _scannerRunning = false;
  }
}

// Moves one deposit's USDT out of the user's child address into
// MAIN_COLLECTION_WALLET, using the EXACT on-chain amount (amount_wei) — never
// a value re-derived from a rounded display float, so the transfer can never
// overshoot the child address's real token balance. Tops up gas (BNB) from the
// reserved index-0 wallet first if the child address doesn't already have
// enough. Never throws — failures are recorded on the row and retried next cycle.
async function attemptSweep(depositId, index, childAddress) {
  if (!MAIN_COLLECTION_WALLET || index==null) return;
  try {
    const { rows:[dep] } = await db(`SELECT amount_wei, swept FROM onchain_deposits WHERE id=$1`, [depositId]);
    if (!dep || dep.swept || !dep.amount_wei) return;
    const amountWei = BigInt(dep.amount_wei);
    if (amountWei <= 0n) return;

    const gasReserve  = deriveDepositWallet(GAS_RESERVE_INDEX).connect(bscProvider);
    const childWallet = deriveDepositWallet(index).connect(bscProvider);
    const topupAmount = ethers.parseEther(GAS_TOPUP_BNB);

    const childBnbBalance = await bscProvider.getBalance(childAddress);
    if (childBnbBalance < topupAmount / 2n) {
      const topupTx = await gasReserve.sendTransaction({ to: childAddress, value: topupAmount });
      await topupTx.wait(1);
    }

    const usdt = new ethers.Contract(USDT_BEP20_CONTRACT, ['function transfer(address,uint256) returns (bool)'], childWallet);
    const sweepTx = await usdt.transfer(MAIN_COLLECTION_WALLET, amountWei);
    await sweepTx.wait(1);
    await db(`UPDATE onchain_deposits SET swept=TRUE, sweep_tx_hash=$1, sweep_error=NULL WHERE id=$2`, [sweepTx.hash, depositId]);
  } catch (e) {
    console.error(`Sweep failed for deposit ${depositId}:`, e.message);
    await db(`UPDATE onchain_deposits SET sweep_error=$1 WHERE id=$2`, [String(e.message||'').slice(0,500), depositId]).catch(()=>{});
  }
}

// Each cycle, retries any deposit that was credited to a user but never
// successfully swept yet (e.g. the gas reserve ran dry last time) — so admin
// only ever needs to top up the gas reserve address; everything else recovers
// on its own without manual intervention.
async function retryFailedSweeps(addrToUserFallback) {
  if (!MAIN_COLLECTION_WALLET) return;
  try {
    const { rows } = await db(`SELECT id, to_address, user_id FROM onchain_deposits WHERE swept=FALSE ORDER BY created_at ASC LIMIT 20`);
    if (!rows.length) return;
    for (const r of rows) {
      let index = addrToUserFallback?.[r.to_address.toLowerCase()]?.index;
      if (index == null) {
        const { rows:[u] } = await db(`SELECT deposit_address_index FROM users WHERE id=$1`, [r.user_id]);
        index = u?.deposit_address_index;
      }
      if (index == null) continue;
      await attemptSweep(r.id, index, r.to_address);
    }
  } catch (e) {
    console.error('retryFailedSweeps error:', e.message);
  }
}

// Checks the Gas Reserve's BNB balance and pushes a Telegram alert to the
// admin (same bot used for support/backups) the moment it drops below
// threshold — throttled so it fires once, not every cycle, while it stays
// low. Re-alerts again after the cooldown if nobody has topped it up yet.
async function checkGasReserveAlert() {
  if (!hdMaster || !bscProvider || !MAIN_COLLECTION_WALLET) return;
  try {
    const gasReserveAddress = deriveDepositAddress(GAS_RESERVE_INDEX);
    const balance = parseFloat(ethers.formatEther(await bscProvider.getBalance(gasReserveAddress)));
    if (balance >= GAS_RESERVE_LOW_THRESHOLD) return; // healthy — nothing to do

    const { rows } = await db(`SELECT value FROM settings WHERE key='gas_reserve_alert'`);
    const lastAlertAt = rows[0]?.value?.lastAlertAt;
    const hoursSinceLastAlert = lastAlertAt ? (Date.now() - new Date(lastAlertAt).getTime()) / 3600000 : Infinity;
    if (hoursSinceLastAlert < GAS_ALERT_COOLDOWN_HOURS) return; // already alerted recently — don't spam

    await tgSend(
      `⚠️ <b>Gas Reserve Running Low</b>\n\n` +
      `Balance: <b>${balance.toFixed(5)} BNB</b> (threshold: ${GAS_RESERVE_LOW_THRESHOLD} BNB)\n` +
      `Address: <code>${gasReserveAddress}</code>\n\n` +
      `Auto-sweep to your main wallet will start failing once this runs out. Send some BNB (e.g. 0.05–0.1) to the address above.\n\n` +
      `Deposits are still credited to users normally either way — this only affects moving funds to your main wallet.`
    );
    await saveSetting('gas_reserve_alert', { lastAlertAt: new Date().toISOString(), balanceAtAlert: balance }, null);
  } catch (e) {
    console.error('checkGasReserveAlert error:', e.message);
  }
}



// ── Create all tables on first run ───────────────────────────────────────
const initDB = async () => {
  if (!pool) { console.log('⚠️  No DATABASE_URL'); return; }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name             VARCHAR(100)  NOT NULL,
      email            VARCHAR(150)  NOT NULL UNIQUE,
      phone            VARCHAR(20)   DEFAULT '',
      password         TEXT          NOT NULL,
      uid              VARCHAR(20)   NOT NULL UNIQUE,
      referral_code    VARCHAR(20)   NOT NULL UNIQUE,
      referred_by      UUID          REFERENCES users(id) ON DELETE SET NULL,
      balance          NUMERIC(14,2) DEFAULT 0,
      pending_earnings NUMERIC(14,2) DEFAULT 0,
      total_deposited  NUMERIC(14,2) DEFAULT 0,
      total_withdrawn  NUMERIC(14,2) DEFAULT 0,
      membership_level VARCHAR(20)   DEFAULT 'starter',
      is_verified      BOOLEAN       DEFAULT FALSE,
      kyc_status       VARCHAR(20)   DEFAULT 'none',
      wallet_address   VARCHAR(100)  DEFAULT '',
      wallet_network   VARCHAR(20)   DEFAULT 'BEP20',
      last_login       TIMESTAMPTZ   DEFAULT NOW(),
      created_at       TIMESTAMPTZ   DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS investments (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id       VARCHAR(30) NOT NULL,
      plan_name     VARCHAR(100) NOT NULL,
      amount        NUMERIC(14,2) NOT NULL,
      daily_income  NUMERIC(14,2) NOT NULL,
      total_return  NUMERIC(14,2) NOT NULL,
      days_total    INTEGER NOT NULL,
      days_elapsed  INTEGER DEFAULT 0,
      earned_so_far NUMERIC(14,2) DEFAULT 0,
      status        VARCHAR(20) DEFAULT 'active',
      start_date    TIMESTAMPTZ DEFAULT NOW(),
      end_date      TIMESTAMPTZ NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type        VARCHAR(20) NOT NULL,
      amount      NUMERIC(14,2) NOT NULL,
      status      VARCHAR(20) DEFAULT 'completed',
      description TEXT DEFAULT '',
      meta        JSONB DEFAULT '{}',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
    -- Speeds up the deposit txHash duplicate-submission check.
    CREATE INDEX IF NOT EXISTS idx_transactions_deposit_txhash ON transactions((meta->>'txHash')) WHERE type='deposit';
    CREATE TABLE IF NOT EXISTS notifications (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type       VARCHAR(30) DEFAULT 'system',
      title      VARCHAR(200) NOT NULL,
      body       TEXT DEFAULT '',
      read       BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS reward_claims (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reward_id  VARCHAR(30) NOT NULL,
      claimed_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, reward_id)
    );

    -- ── Tasks (earn-by-completing-actions system) ─────────────────────────
    CREATE TABLE IF NOT EXISTS tasks (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title           VARCHAR(150) NOT NULL,
      description     TEXT DEFAULT '',
      type            VARCHAR(30) NOT NULL, -- telegram_channel | telegram_group | whatsapp_group | invite_count | active_members
      reward_amount   NUMERIC(10,2) NOT NULL,
      target_url      TEXT DEFAULT '',
      required_count  INT,
      requires_review BOOLEAN DEFAULT FALSE,
      is_active       BOOLEAN DEFAULT TRUE,
      sort_order      INT DEFAULT 0,
      created_by      UUID REFERENCES admins(id) ON DELETE SET NULL,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS task_claims (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      task_id       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      status        VARCHAR(20) DEFAULT 'pending', -- pending | approved | rejected
      reward_amount NUMERIC(10,2),
      reviewed_by   UUID REFERENCES admins(id) ON DELETE SET NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      reviewed_at   TIMESTAMPTZ,
      UNIQUE(user_id, task_id)
    );

    -- ── Lottery System (daily free spin → win locks a claim-task → complete task to receive money) ───
    CREATE TABLE IF NOT EXISTS lottery_prizes (
      id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      label                   VARCHAR(60) NOT NULL,
      amount                  NUMERIC(10,2) NOT NULL DEFAULT 0,  -- USDT paid out once the claim-task is completed (0 = "Try Again", no task needed)
      probability             NUMERIC(6,2) NOT NULL DEFAULT 0,   -- admin-set weight; normalized across active prizes at draw time
      color                   VARCHAR(20) DEFAULT '#C9A227',     -- wheel segment color
      icon                    VARCHAR(10) DEFAULT '🎁',
      task_title              VARCHAR(150),                       -- the task the user must complete to claim this prize (null/empty for amount=0 tiers)
      task_description        TEXT DEFAULT '',
      task_requirement_type   VARCHAR(30),  -- deposit_amount | team_deposit_amount | invite_count | active_members | invite_tier_count
      task_requirement_value  NUMERIC(10,2),
      task_requirement_meta   VARCHAR(30),  -- e.g. plan tier id ('bronze'|'silver'|'gold'|'elite') when type=invite_tier_count
      is_active               BOOLEAN DEFAULT TRUE,
      sort_order              INT DEFAULT 0,
      created_at              TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS lottery_spin_state (
      user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      last_free_claim  DATE,   -- date the daily free spin was last used
      updated_at       TIMESTAMPTZ DEFAULT NOW()
    );
    -- Each spin that wins a real prize creates a row here — a "claim slot" the user
    -- must complete the attached task for before the money is credited. Max 3 pending
    -- slots per user; slots older than the current week (since last Sunday) are
    -- treated as forfeited and no longer count toward the cap or remain claimable.
    CREATE TABLE IF NOT EXISTS lottery_history (
      id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      prize_id                UUID REFERENCES lottery_prizes(id) ON DELETE SET NULL,
      prize_label             VARCHAR(60),
      amount                  NUMERIC(10,2) NOT NULL DEFAULT 0,
      task_title              VARCHAR(150),
      task_description        TEXT DEFAULT '',
      task_requirement_type   VARCHAR(30),
      task_requirement_value  NUMERIC(10,2),
      task_requirement_meta   VARCHAR(30),
      baseline_progress       NUMERIC(10,2) DEFAULT 0, -- metric value snapshot at win time; only growth past this counts toward this claim
      status                  VARCHAR(20) DEFAULT 'no_task', -- no_task (amount=0 spins) | pending | claimed | forfeited
      claimed_at              TIMESTAMPTZ,
      created_at              TIMESTAMPTZ DEFAULT NOW()
    );
    -- Safe migrations in case these tables already exist from an earlier deploy —
    -- must run BEFORE any CREATE INDEX that references these columns.
    ALTER TABLE lottery_prizes ADD COLUMN IF NOT EXISTS task_title VARCHAR(150);
    ALTER TABLE lottery_prizes ADD COLUMN IF NOT EXISTS task_description TEXT DEFAULT '';
    ALTER TABLE lottery_prizes ADD COLUMN IF NOT EXISTS task_requirement_type VARCHAR(30);
    ALTER TABLE lottery_prizes ADD COLUMN IF NOT EXISTS task_requirement_value NUMERIC(10,2);
    ALTER TABLE lottery_prizes ADD COLUMN IF NOT EXISTS task_requirement_meta VARCHAR(30);
    ALTER TABLE lottery_history ADD COLUMN IF NOT EXISTS task_title VARCHAR(150);
    ALTER TABLE lottery_history ADD COLUMN IF NOT EXISTS task_description TEXT DEFAULT '';
    ALTER TABLE lottery_history ADD COLUMN IF NOT EXISTS task_requirement_type VARCHAR(30);
    ALTER TABLE lottery_history ADD COLUMN IF NOT EXISTS task_requirement_value NUMERIC(10,2);
    ALTER TABLE lottery_history ADD COLUMN IF NOT EXISTS task_requirement_meta VARCHAR(30);
    ALTER TABLE lottery_history ADD COLUMN IF NOT EXISTS baseline_progress NUMERIC(10,2) DEFAULT 0;
    ALTER TABLE lottery_history ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'no_task';
    ALTER TABLE lottery_history ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
    CREATE INDEX IF NOT EXISTS idx_lothist_user ON lottery_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_lothist_time ON lottery_history(created_at);
    CREATE INDEX IF NOT EXISTS idx_lothist_status ON lottery_history(user_id,status);
    -- Old bonus-spin task system — retired in favor of per-prize claim-tasks above.
    DROP TABLE IF EXISTS lottery_task_claims;
    DROP TABLE IF EXISTS lottery_tasks;

    -- ── Salary / Ambassador Rank System ────────────────────────────────────
    -- Rank definitions themselves live in settings (key 'salary_ranks'), same
    -- pattern as plans/commission — fully admin-editable, no redeploy needed.
    -- Each APPROVED claim permanently "spends" the specific L1 downline members
    -- counted toward it (member_ids_used): those member ids can never be
    -- recounted toward a future claim for this user, so climbing again next
    -- month always requires fresh growth, never the same team re-counted.
    -- A row starts 'pending' when the user applies themselves; an admin then
    -- approves (credits balance) or rejects (row is deleted, freeing the period
    -- up for a fresh application). Admins can also approve directly with no
    -- prior application — that path inserts straight into 'approved'.
    CREATE TABLE IF NOT EXISTS salary_claims (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rank_key         VARCHAR(40) NOT NULL,
      rank_name        VARCHAR(100) NOT NULL,
      rank_order       INT NOT NULL,
      amount           NUMERIC(10,2) NOT NULL,
      period           VARCHAR(7) NOT NULL, -- 'YYYY-MM' — one application/claim per user per calendar month
      member_ids_used  JSONB NOT NULL DEFAULT '[]',
      status           VARCHAR(20) NOT NULL DEFAULT 'approved', -- pending | approved
      approved_by      UUID REFERENCES admins(id) ON DELETE SET NULL,
      approved_at      TIMESTAMPTZ,
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, period)
    );
    ALTER TABLE salary_claims ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'approved';
    ALTER TABLE salary_claims ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
    CREATE INDEX IF NOT EXISTS idx_salary_claims_user ON salary_claims(user_id);
    CREATE INDEX IF NOT EXISTS idx_salary_claims_status ON salary_claims(status);


    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      token TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
      refresh_token TEXT NOT NULL UNIQUE,
      device        VARCHAR(300),
      ip            VARCHAR(60),
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      last_active   TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_sess_user ON user_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sess_token ON user_sessions(refresh_token);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram        VARCHAR(100);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth   DATE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone           VARCHAR(30);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS withdrawal_pass VARCHAR(255);
    -- HD wallet: each user's own permanent BEP20 deposit address + the child
    -- derivation index it came from (index is what lets us re-derive the
    -- private key later for sweeping — the key itself is never stored).
    ALTER TABLE users ADD COLUMN IF NOT EXISTS deposit_address       VARCHAR(42);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS deposit_address_index INT;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_deposit_address ON users(deposit_address) WHERE deposit_address IS NOT NULL;

    -- Atomic, concurrency-safe counter for "next HD derivation index to hand
    -- out" — a DB sequence guarantees two simultaneous signups can never be
    -- assigned the same index (which would mean the same deposit address).
    CREATE SEQUENCE IF NOT EXISTS hd_deposit_index_seq START 1;

    -- Every on-chain USDT (BEP20) transfer the scanner detects into a known
    -- deposit address gets one row here — UNIQUE(tx_hash, log_index) means a
    -- transfer can only ever be credited once, no matter how many times the
    -- scanner re-checks the same block range.
    CREATE TABLE IF NOT EXISTS onchain_deposits (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tx_hash      VARCHAR(80) NOT NULL,
      log_index    INT NOT NULL,
      from_address VARCHAR(42),
      to_address   VARCHAR(42) NOT NULL,
      amount       NUMERIC(20,6) NOT NULL,
      block_number BIGINT NOT NULL,
      swept        BOOLEAN DEFAULT FALSE,   -- has this user's deposited USDT been moved to the main collection wallet yet?
      sweep_tx_hash VARCHAR(80),
      sweep_error   TEXT,                   -- last sweep failure reason (e.g. gas reserve empty) — retried automatically next cycle
      amount_wei    TEXT,                    -- exact on-chain amount (base units, as a string) — the sweep moves this exact value, never a re-derived float
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(tx_hash, log_index)
    );
    ALTER TABLE onchain_deposits ADD COLUMN IF NOT EXISTS swept BOOLEAN DEFAULT FALSE;
    ALTER TABLE onchain_deposits ADD COLUMN IF NOT EXISTS sweep_tx_hash VARCHAR(80);
    ALTER TABLE onchain_deposits ADD COLUMN IF NOT EXISTS sweep_error TEXT;
    ALTER TABLE onchain_deposits ADD COLUMN IF NOT EXISTS amount_wei TEXT;
    CREATE INDEX IF NOT EXISTS idx_onchain_deposits_user ON onchain_deposits(user_id);
    CREATE INDEX IF NOT EXISTS idx_onchain_deposits_unswept ON onchain_deposits(swept) WHERE swept=FALSE;

    CREATE TABLE IF NOT EXISTS login_history (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
      ip         VARCHAR(60),
      device     VARCHAR(200),
      status     VARCHAR(20) DEFAULT 'success',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_lh_user ON login_history(user_id);

    CREATE TABLE IF NOT EXISTS checkin_log (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
      checkin_date DATE NOT NULL,
      amount       DECIMAL(10,4) NOT NULL,
      is_bonus     BOOLEAN DEFAULT FALSE,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, checkin_date)
    );
    CREATE INDEX IF NOT EXISTS idx_cl_user ON checkin_log(user_id);

    CREATE TABLE IF NOT EXISTS otp_codes (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
      email       VARCHAR(150) NOT NULL,
      code_hash   VARCHAR(255) NOT NULL,
      purpose     VARCHAR(30)  NOT NULL,
      meta        JSONB DEFAULT '{}',
      used        BOOLEAN DEFAULT FALSE,
      attempts    INTEGER DEFAULT 0,
      expires_at  TIMESTAMPTZ NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS id         UUID DEFAULT gen_random_uuid();
    ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS code_hash  VARCHAR(255);
    ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS attempts   INTEGER DEFAULT 0;
    ALTER TABLE otp_codes ALTER COLUMN code DROP NOT NULL;
    ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS email      VARCHAR(150);
    UPDATE otp_codes SET email='' WHERE email IS NULL;

    CREATE TABLE IF NOT EXISTS otp_rate_limit (
      id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email     VARCHAR(150) NOT NULL,
      purpose   VARCHAR(30)  NOT NULL,
      sent_at   TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_otp_email   ON otp_codes(email);
    CREATE INDEX IF NOT EXISTS idx_otp_purpose ON otp_codes(purpose);
    CREATE INDEX IF NOT EXISTS idx_orl_email   ON otp_rate_limit(email);

    CREATE TABLE IF NOT EXISTS support_messages (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
      direction  VARCHAR(10) NOT NULL CHECK (direction IN ('user','admin')),
      message    TEXT NOT NULL,
      tg_msg_id  BIGINT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_sm_user ON support_messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_sm_time ON support_messages(created_at);
    ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS read_by_admin BOOLEAN DEFAULT FALSE;

    -- ── Admin Panel: accounts + access control ──────────────────────────
    CREATE TABLE IF NOT EXISTS admins (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      role         VARCHAR(30)   DEFAULT 'Moderator',
      status       VARCHAR(20)   DEFAULT 'pending',
      last_login   TIMESTAMPTZ,
      created_at   TIMESTAMPTZ   DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS admin_logs (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_id   UUID REFERENCES admins(id) ON DELETE SET NULL,
      action     VARCHAR(200) NOT NULL,
      meta       JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_alog_time ON admin_logs(created_at);

    CREATE TABLE IF NOT EXISTS settings (
      key        VARCHAR(50) PRIMARY KEY,
      value      JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      updated_by UUID REFERENCES admins(id) ON DELETE SET NULL
    );

    -- ── Phase 3: Security essentials ─────────────────────────────────────
    CREATE TABLE IF NOT EXISTS admin_login_attempts (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email      VARCHAR(150) NOT NULL,
      ip         VARCHAR(64)  NOT NULL,
      success    BOOLEAN      NOT NULL,
      reason     VARCHAR(100) DEFAULT '',
      created_at TIMESTAMPTZ  DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_alogin_email ON admin_login_attempts(email, created_at);
    CREATE INDEX IF NOT EXISTS idx_alogin_time  ON admin_login_attempts(created_at);

    CREATE TABLE IF NOT EXISTS admin_ip_whitelist (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ip_address VARCHAR(64) NOT NULL UNIQUE,
      label      VARCHAR(100) DEFAULT '',
      added_by   UUID REFERENCES admins(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- ── Phase 5: Announcements (popup/banner shown on index.html) ───────
    CREATE TABLE IF NOT EXISTS announcements (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title       VARCHAR(150) NOT NULL,
      message     TEXT NOT NULL,
      type        VARCHAR(20)  DEFAULT 'banner', -- 'banner' or 'popup'
      style       VARCHAR(20)  DEFAULT 'info',   -- 'info','success','warning','urgent'
      is_active   BOOLEAN      DEFAULT TRUE,
      starts_at   TIMESTAMPTZ  DEFAULT NOW(),
      ends_at     TIMESTAMPTZ,
      created_by  UUID REFERENCES admins(id) ON DELETE SET NULL,
      created_at  TIMESTAMPTZ  DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_ann_active ON announcements(is_active, starts_at, ends_at);
    ALTER TABLE announcements ADD COLUMN IF NOT EXISTS slide_theme VARCHAR(20) DEFAULT 'gold'; -- 'gold','blue','green','purple','red','indigo' — colour used when shown in the home slider

    -- ── Phase 6: Content Management (FAQ / Banners / News / Terms / Privacy) ──
    CREATE TABLE IF NOT EXISTS content_faq (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      question    VARCHAR(300) NOT NULL,
      answer      TEXT NOT NULL,
      category    VARCHAR(60)  DEFAULT 'General',
      sort_order  INTEGER      DEFAULT 0,
      is_active   BOOLEAN      DEFAULT TRUE,
      created_at  TIMESTAMPTZ  DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS content_banners (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title       VARCHAR(150) NOT NULL,
      subtitle    VARCHAR(250) DEFAULT '',
      image_url   TEXT         DEFAULT '',
      link_url    TEXT         DEFAULT '',
      sort_order  INTEGER      DEFAULT 0,
      is_active   BOOLEAN      DEFAULT TRUE,
      created_at  TIMESTAMPTZ  DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS content_news (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title         VARCHAR(200) NOT NULL,
      excerpt       VARCHAR(300) DEFAULT '',
      body          TEXT NOT NULL,
      image_url     TEXT DEFAULT '',
      is_published  BOOLEAN DEFAULT TRUE,
      published_at  TIMESTAMPTZ DEFAULT NOW(),
      created_by    UUID REFERENCES admins(id) ON DELETE SET NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );

    -- Long-form static pages: Terms of Service, Privacy Policy, About, etc.
    CREATE TABLE IF NOT EXISTS content_pages (
      slug        VARCHAR(50) PRIMARY KEY,
      title       VARCHAR(150) NOT NULL,
      body        TEXT NOT NULL DEFAULT '',
      updated_by  UUID REFERENCES admins(id) ON DELETE SET NULL,
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    );

    -- ── Reports gap-fill: manual loss/bad-debt entries (Loss Report) ────────
    CREATE TABLE IF NOT EXISTS loss_entries (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      amount      NUMERIC(14,2) NOT NULL,
      category    VARCHAR(60)   DEFAULT 'Bad Debt',
      reason      TEXT          NOT NULL,
      created_by  UUID REFERENCES admins(id) ON DELETE SET NULL,
      created_at  TIMESTAMPTZ   DEFAULT NOW()
    );

    -- ── Admin 2FA / device verification ──────────────────────────────────
    CREATE TABLE IF NOT EXISTS admin_known_devices (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_id    UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
      device_hash VARCHAR(64) NOT NULL,
      label       VARCHAR(150) DEFAULT '',
      first_seen  TIMESTAMPTZ DEFAULT NOW(),
      last_seen   TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(admin_id, device_hash)
    );

    -- Add permissions column to admins if it doesn't exist yet
    ALTER TABLE admins ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;
    -- Add admin column to admin_logs for filtering
    CREATE INDEX IF NOT EXISTS idx_alog_admin ON admin_logs(admin_id);
    CREATE INDEX IF NOT EXISTS idx_alog_action ON admin_logs USING gin(to_tsvector('english', action));

    -- ── User/transaction columns needed for admin moderation ────────────
    ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES admins(id) ON DELETE SET NULL;
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reject_reason TEXT;
  `);

  // Link the Super Admin to their existing QAVIX GLOBAL user account.
  // Admin login uses the SAME password as their regular platform account — there is no separate admin password.
  const seedEmail = (process.env.SEED_ADMIN_EMAIL || 'rafishasan273@gmail.com').toLowerCase();
  const { rows: seedUser } = await pool.query('SELECT id FROM users WHERE email=$1', [seedEmail]);
  if (seedUser[0]) {
    const { rows: existingAdmin } = await pool.query('SELECT id FROM admins WHERE user_id=$1', [seedUser[0].id]);
    if (!existingAdmin[0]) {
      await pool.query(`INSERT INTO admins(user_id,role,status) VALUES($1,'Super Admin','active')`, [seedUser[0].id]);
      console.log(`✅ Linked Super Admin access to existing account: ${seedEmail} (log in with that account's password)`);
    }
  } else {
    console.log(`⚠️  No QAVIX GLOBAL account found for ${seedEmail} yet — register that email on the platform first, then restart the server to link Super Admin access.`);
  }

  // Seed a default set of lottery prizes (each with its own claim-task) on first run.
  const { rows: prizeCount } = await pool.query('SELECT COUNT(*)::int AS c FROM lottery_prizes');
  if (prizeCount[0].c === 0) {
    const defaultPrizes = [
      { label:'Try Again', amount:0,    probability:25, color:'#1A1712', icon:'🔁' },
      { label:'$0.10', amount:0.10, probability:22, color:'#C9A227', icon:'🪙',
        taskTitle:'Deposit $5', taskDescription:'Deposit at least $5 USDT to claim this prize',
        taskType:'deposit_amount', taskValue:5 },
      { label:'$0.20', amount:0.20, probability:17, color:'#1A1712', icon:'💰',
        taskTitle:'Invite 1 Silver User', taskDescription:'Refer 1 member who reaches the Silver plan to claim this prize',
        taskType:'invite_tier_count', taskValue:1, taskMeta:'silver' },
      { label:'$0.30', amount:0.30, probability:12, color:'#C9A227', icon:'💵',
        taskTitle:'Deposit $20', taskDescription:'Deposit at least $20 USDT to claim this prize',
        taskType:'deposit_amount', taskValue:20 },
      { label:'$0.40', amount:0.40, probability:8,  color:'#1A1712', icon:'🎁',
        taskTitle:'3 Active Team Members', taskDescription:'Have at least 3 team members with an active plan',
        taskType:'active_members', taskValue:3 },
      { label:'$0.50', amount:0.50, probability:6, color:'#C9A227', icon:'⭐',
        taskTitle:'Team Deposit $2000', taskDescription:'Get your team to deposit a combined $2000 USDT to claim this prize',
        taskType:'team_deposit_amount', taskValue:2000 },
      { label:'$0.75', amount:0.75, probability:6, color:'#1A1712', icon:'🏆',
        taskTitle:'Invite 1 Gold User', taskDescription:'Refer 1 member who reaches the Gold plan to claim this prize',
        taskType:'invite_tier_count', taskValue:1, taskMeta:'gold' },
      { label:'$1.00 JACKPOT', amount:1.00, probability:4, color:'#FFD66E', icon:'👑',
        taskTitle:'Invite 1 Elite User', taskDescription:'Refer 1 member who reaches the Elite plan to claim this prize',
        taskType:'invite_tier_count', taskValue:1, taskMeta:'elite' },
    ];
    for (let i=0;i<defaultPrizes.length;i++) {
      const p = defaultPrizes[i];
      await pool.query(
        `INSERT INTO lottery_prizes(label,amount,probability,color,icon,task_title,task_description,task_requirement_type,task_requirement_value,task_requirement_meta,sort_order)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [p.label,p.amount,p.probability,p.color,p.icon,p.taskTitle||null,p.taskDescription||'',p.taskType||null,p.taskValue||null,p.taskMeta||null,i]);
    }
    console.log('✅ Seeded default lottery prizes');
  }

  console.log('✅ Neon DB tables ready');
  await loadSettingsCache();
};

// ── Helpers ──────────────────────────────────────────────────────────────
// snake_case row → camelCase object
const cc = (row) => {
  if (!row) return null;
  const o = {};
  for (const [k,v] of Object.entries(row))
    o[k.replace(/_([a-z])/g,(_,l)=>l.toUpperCase())] = v;
  o.id = row.id;
  return o;
};
const ccAll  = (rows) => rows.map(cc);
const safe   = (u) => { const r={...u}; delete r.password; r.hasWithdrawalPass = !!r.withdrawalPass; delete r.withdrawalPass; return r; };
const notif  = (uid,type,title,body='') =>
  db('INSERT INTO notifications(user_id,type,title,body) VALUES($1,$2,$3,$4)',[uid,type,title,body]).catch(()=>{});

// ── Brevo HTTP API Email Service ─────────────────────────────────────────
// NOTE: Render free plan blocks outbound SMTP — HTTP API only
const sendEmail = async (toEmail, toName, subject, htmlBody) => {
  const body = {
    sender     : { name: LIVE_EMAIL_SENDER.fromName || 'QAVIX GLOBAL', email: LIVE_EMAIL_SENDER.fromEmail || process.env.BREVO_SENDER_EMAIL },
    to         : [{ email: toEmail, name: toName || toEmail }],
    subject    : subject,
    htmlContent: htmlBody,
  };
  if (LIVE_GENERAL.supportEmail) body.replyTo = { email: LIVE_GENERAL.supportEmail };
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method  : 'POST',
    headers : {
      'Content-Type' : 'application/json',
      'api-key'      : process.env.BREVO_API_KEY,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Brevo API error ${response.status}: ${errText}`);
  }
  console.log(`✅ Email sent via Brevo HTTP → ${toEmail}`);
  return true;
};

// ── OTP Config ───────────────────────────────────────────────────────────
const OTP_CONFIG = {
  register          : { expiry: 5,  subject: '📧 Verify Your QAVIX Account',       action: 'verify your registration'     },
  login             : { expiry: 5,  subject: '🔑 QAVIX Login Verification',         action: 'complete your login'           },
  withdraw          : { expiry: 3,  subject: '💸 QAVIX Withdrawal Confirmation',    action: 'confirm your withdrawal'       },
  password_reset    : { expiry: 10, subject: '🔓 QAVIX Password Reset',             action: 'reset your password'           },
  withdraw_password : { expiry: 5,  subject: '🔐 QAVIX Withdrawal Password Change', action: 'change your withdrawal password'},
  change_email      : { expiry: 5,  subject: '📧 QAVIX Email Change Verification',  action: 'change your email'             },
  change_password   : { expiry: 5,  subject: '🔑 QAVIX Password Change',            action: 'change your login password'    },
  admin_login       : { expiry: 5,  subject: '🛡️ QAVIX Admin Panel — New Sign-in',  action: 'verify this admin sign-in'     },
};

const MAX_RESENDS   = 3;   // max resend attempts in 10 minutes
const MAX_ATTEMPTS  = 5;   // max wrong OTP attempts before invalidation

// ── Email Template ───────────────────────────────────────────────────────
const buildOTPEmail = (otp, purpose, expiryMin) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:20px;background:#0a0a0a;font-family:Arial,sans-serif">
  <div style="max-width:480px;margin:0 auto;background:#111;border-radius:20px;overflow:hidden;border:1px solid rgba(201,162,39,0.15)">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0d0d0d 0%,#1a1208 100%);padding:28px 32px;text-align:center;border-bottom:1px solid rgba(201,162,39,0.2)">
      <div style="display:inline-flex;align-items:center;gap:10px">
        <div style="width:36px;height:36px;background:rgba(201,162,39,0.15);border-radius:10px;display:flex;align-items:center;justify-content:center">
          <span style="font-size:18px">⚡</span>
        </div>
        <div>
          <div style="font-size:18px;font-weight:900;color:#fff;letter-spacing:.12em">QAVIX <span style="color:#C9A227">GLOBAL</span></div>
          <div style="font-size:9px;color:rgba(255,255,255,0.35);letter-spacing:.15em;margin-top:1px">PREMIUM INVESTMENT PLATFORM</div>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:36px 32px;text-align:center">
      <div style="font-size:13px;color:#888;margin-bottom:6px;letter-spacing:.05em;text-transform:uppercase">Your verification code to</div>
      <div style="font-size:15px;color:#bbb;margin-bottom:24px">${OTP_CONFIG[purpose]?.action||'verify your action'}</div>

      <!-- OTP Box -->
      <div style="background:rgba(201,162,39,0.06);border:1.5px solid rgba(201,162,39,0.25);border-radius:16px;padding:24px 32px;margin:0 auto 24px;display:inline-block">
        <div style="font-size:44px;font-weight:900;color:#C9A227;letter-spacing:.22em;font-family:monospace">${otp}</div>
      </div>

      <!-- Expiry -->
      <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:999px;padding:8px 18px;margin-bottom:24px">
        <span style="font-size:14px">⏱</span>
        <span style="font-size:12px;color:#999">Expires in <strong style="color:#C9A227">${expiryMin} minutes</strong></span>
      </div>

      <!-- Warning -->
      <div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:12px;padding:14px 18px;text-align:left">
        <div style="font-size:12px;color:#f87171;font-weight:700;margin-bottom:4px">⚠️ Security Notice</div>
        <div style="font-size:11px;color:#888;line-height:1.6">
          Never share this OTP with anyone, including QAVIX support.<br>
          If you did not request this, please ignore this email.
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center">
      <div style="font-size:10px;color:#444">© 2025 QAVIX GLOBAL · All rights reserved</div>
      <div style="font-size:10px;color:#333;margin-top:3px">This is an automated message. Do not reply.</div>
    </div>
  </div>
</body>
</html>`;

// ── OTP Service ──────────────────────────────────────────────────────────

// Generate secure 6-digit OTP
const genOTP = () => {
  const len = LIVE_OTP?.codeLength || 6;
  const min = Math.pow(10, len-1), max = Math.pow(10, len)-1;
  return String(Math.floor(min + Math.random() * (max-min)));
};

// Rate limit check — max 3 sends per email+purpose in 10 minutes
const checkOTPRateLimit = async (email, purpose) => {
  const { rows } = await db(
    `SELECT COUNT(*) AS cnt FROM otp_rate_limit
     WHERE email=$1 AND purpose=$2 AND sent_at > NOW() - INTERVAL '10 minutes'`,
    [email, purpose]
  );
  if (parseInt(rows[0].cnt) >= MAX_RESENDS)
    throw new Error(`Too many OTP requests. Please wait 10 minutes before trying again.`);
};

// Save OTP (hashed) and record rate limit
const saveOTP = async (userId, email, otp, purpose, meta={}, expiryMin) => {
  const liveOverride = purpose==='login' ? LIVE_OTP.loginExpiryMin : purpose==='withdraw' ? LIVE_OTP.withdrawExpiryMin : purpose==='register' ? LIVE_OTP.registerExpiryMin : null;
  const min = expiryMin || liveOverride || OTP_CONFIG[purpose]?.expiry || 5;
  // Invalidate previous OTPs for same email+purpose
  await db(
    `UPDATE otp_codes SET used=TRUE WHERE email=$1 AND purpose=$2 AND used=FALSE`,
    [email, purpose]
  );
  const codeHash = await bcrypt.hash(otp, 8);
  const { rows } = await db(
    `INSERT INTO otp_codes(user_id,email,code_hash,purpose,meta,expires_at)
     VALUES($1,$2,$3,$4,$5,NOW()+INTERVAL '${min} minutes') RETURNING id`,
    [userId||null, email, codeHash, purpose, JSON.stringify(meta)]
  );
  // Record rate limit
  await db(
    `INSERT INTO otp_rate_limit(email,purpose) VALUES($1,$2)`,
    [email, purpose]
  );
  return rows[0].id;
};

// Verify OTP — check hash, expiry, attempts
const verifyOTP = async (email, code, purpose) => {
  const { rows } = await db(
    `SELECT * FROM otp_codes
     WHERE email=$1 AND purpose=$2 AND used=FALSE AND expires_at>NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [email, purpose]
  );
  if (!rows[0]) throw new Error('OTP expired or not found. Please request a new one.');
  if (rows[0].attempts >= MAX_ATTEMPTS) {
    await db(`UPDATE otp_codes SET used=TRUE WHERE id=$1`, [rows[0].id]);
    throw new Error('Too many wrong attempts. Please request a new OTP.');
  }
  const match = await bcrypt.compare(code, rows[0].code_hash);
  if (!match) {
    await db(`UPDATE otp_codes SET attempts=attempts+1 WHERE id=$1`, [rows[0].id]);
    const left = MAX_ATTEMPTS - rows[0].attempts - 1;
    throw new Error(`Invalid OTP. ${left} attempt${left===1?'':'s'} remaining.`);
  }
  await db(`UPDATE otp_codes SET used=TRUE WHERE id=$1`, [rows[0].id]);
  return rows[0];
};

// Send OTP email via Brevo HTTP API
const sendOTPMail = async (toEmail, otp, purpose) => {
  const cfg = OTP_CONFIG[purpose] || { subject:'🔐 QAVIX Verification', expiry:5 };
  await sendEmail(toEmail, toEmail, cfg.subject, buildOTPEmail(otp, purpose, cfg.expiry));
  console.log(`✅ OTP sent [${purpose}] → ${toEmail}`);
};

// Combined: generate + save + send
const issueOTP = async (userId, email, purpose, meta={}) => {
  await checkOTPRateLimit(email, purpose);
  const otp = genOTP();
  await saveOTP(userId, email, otp, purpose, meta);
  sendOTPMail(email, otp, purpose).catch(e => console.error('Mail error:', e.message));
  return otp; // only for internal use, never expose to client
};

// Auto-cleanup expired OTPs + stale refresh tokens (runs every hour)
setInterval(async () => {
  try {
    await db(`DELETE FROM otp_codes WHERE expires_at < NOW() OR (used=TRUE AND created_at < NOW()-INTERVAL '1 day')`);
    await db(`DELETE FROM otp_rate_limit WHERE sent_at < NOW()-INTERVAL '10 minutes'`);
    await db(`DELETE FROM refresh_tokens WHERE created_at < NOW()-INTERVAL '31 days'`);
  } catch(e){}
}, 60 * 60 * 1000);

// ── JWT ───────────────────────────────────────────────────────────────────
const signA = (id) => jwt.sign({id}, process.env.JWT_SECRET,         {expiresIn: process.env.JWT_EXPIRES_IN  ||'7d'});
const signR = (id) => jwt.sign({id}, process.env.JWT_REFRESH_SECRET, {expiresIn: process.env.JWT_REFRESH_EXPIRES_IN||'30d'});

// ── Auth middleware ───────────────────────────────────────────────────────
const auth = async (req, res, next) => {
  try {
    const h = req.headers.authorization;
    if (!h?.startsWith('Bearer ')) return res.status(401).json({success:false,message:'No token'});
    const d = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
    const {rows} = await db('SELECT * FROM users WHERE id=$1',[d.id]);
    if (!rows[0]) return res.status(401).json({success:false,message:'User not found'});
    req.user = safe(cc(rows[0]));
    next();
  } catch(e) {
    res.status(401).json({success:false,message: e.name==='TokenExpiredError'?'Token expired':'Invalid token'});
  }
};

// ── Admin JWT + middleware ─────────────────────────────────────────────────
const signAdmin = (id, remember=false) => jwt.sign({id, isAdmin:true}, process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET, {expiresIn: remember ? '30d' : '12h'});
const adminAuth = async (req, res, next) => {
  try {
    const h = req.headers.authorization;
    if (!h?.startsWith('Bearer ')) return res.status(401).json({success:false,message:'No token'});
    const d = jwt.verify(h.split(' ')[1], process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET);
    if (!d.isAdmin) return res.status(403).json({success:false,message:'Not an admin token'});
    const {rows} = await db(
      `SELECT a.id, a.role, a.status, a.permissions, u.id as user_id, u.name, u.email FROM admins a
       JOIN users u ON u.id=a.user_id WHERE a.id=$1`, [d.id]);
    if (!rows[0]) return res.status(401).json({success:false,message:'Admin not found'});
    if (rows[0].status !== 'active') return res.status(403).json({success:false,message:'This admin account is suspended'});
    req.admin = cc(rows[0]);
    next();
  } catch(e) {
    res.status(401).json({success:false,message: e.name==='TokenExpiredError'?'Token expired':'Invalid token'});
  }
};
// Restrict to specific roles, e.g. requireRole('Super Admin')
// Owner always bypasses this check — it's the single top-level account and is
// never subject to role restrictions imposed on anyone else.
const requireRole = (...roles) => (req, res, next) => {
  if (req.admin.role === 'Owner') return next();
  if (!roles.includes(req.admin.role)) return res.status(403).json({success:false,message:'Insufficient permissions for this action'});
  next();
};

// Default permission matrix per role — what each role can do out of the box.
// Owner and Super Admin always get everything and cannot be restricted.
// These are used when an admin has no custom permissions saved yet.
const DEFAULT_ROLE_PERMISSIONS = {
  'Owner':       { dashboard:true, users:true, deposits:true, withdrawals:true, plans:true, investments:true, referral:true, reports:true, settings:true, security:true, support:true, announcements:true, content:true, admins:true, logs:true, backup:true, tasks:true, lottery:true, salary:true },
  'Super Admin': { dashboard:true, users:true, deposits:true, withdrawals:true, plans:true, investments:true, referral:true, reports:true, settings:true, security:true, support:true, announcements:true, content:true, admins:true, logs:true, backup:true, tasks:true, lottery:true, salary:true },
  'Moderator':   { dashboard:true, users:true, deposits:true, withdrawals:false, plans:false, investments:true, referral:true, reports:true, settings:false, security:false, support:true, announcements:true, content:true, admins:false, logs:false, backup:false, tasks:true, lottery:false, salary:false },
};

// Check if an admin has permission for a given module key.
// Owner and Super Admin always pass; others check custom permissions, falling back to role defaults.
const hasPermission = (admin, module) => {
  if (admin.role === 'Owner' || admin.role === 'Super Admin') return true;
  const perms = admin.permissions && Object.keys(admin.permissions).length > 0
    ? admin.permissions
    : (DEFAULT_ROLE_PERMISSIONS[admin.role] || {});
  return !!perms[module];
};

// requirePermission middleware — used on page-level routes to enforce module access
const requirePermission = (module) => async (req, res, next) => {
  if (!req.admin) return res.status(401).json({success:false,message:'Not authenticated'});
  if (!hasPermission(req.admin, module)) return res.status(403).json({success:false,message:`Your role does not have access to: ${module}`});
  next();
};
const logAdmin = (adminId, action, meta={}) =>
  db(`INSERT INTO admin_logs(admin_id,action,meta) VALUES($1,$2,$3)`,[adminId,action,JSON.stringify(meta)]).catch(()=>{});

// ── Constants ────────────────────────────────────────────────────────────
const DEFAULT_PLANS = [
  { id:'bronze', name:'QAVIX BRONZE', tier:'Bronze', emoji:'🥉',
    rate:0.055, days:20, min:5,   max:20,   recommended:false,
    color:'#CD7F32', description:'Entry-level plan for new investors' },
  { id:'silver', name:'QAVIX SILVER', tier:'Silver', emoji:'🥈',
    rate:0.060, days:20, min:21,  max:100,  recommended:false,
    color:'#C0C0C0', description:'Steady growth for growing portfolios' },
  { id:'gold',   name:'QAVIX GOLD',   tier:'Gold',   emoji:'🥇',
    rate:0.065, days:20, min:101, max:300,  recommended:true,
    color:'#C9A227', description:'Our most popular premium tier' },
  { id:'elite',  name:'QAVIX ELITE',  tier:'Elite',  emoji:'💎',
    rate:0.075, days:20, min:301, max:1000, recommended:false,
    color:'#9B7AE8', description:'Maximum returns for serious investors' },
];
const DEFAULT_COMM = {1:10, 2:5, 3:2, 4:1, 5:1, 6:1, 7:1, 8:1, 9:1, 10:1};
// Rank used to decide whether a new plan purchase upgrades a user's displayed membership level.
const TIER_RANK = { starter:0, bronze:1, silver:2, gold:3, elite:4 }; // fallback only; getTierRank() below is authoritative
// Derives tier rank dynamically from LIVE_PLANS (sorted by min investment), so
// any plan admin adds later is correctly ranked without needing a code change.
function getTierRank(planId){
  if (!planId || planId === 'starter') return 0;
  const sorted = [...LIVE_PLANS].sort((a,b)=>a.min-b.min);
  const idx = sorted.findIndex(p=>p.id===planId);
  return idx === -1 ? (TIER_RANK[planId] ?? 0) : idx + 1;
}

// ── Salary / Ambassador Rank engine ─────────────────────────────────────
// Sorted, active-only rank ladder.
const getSalaryRanks = () => [...LIVE_SALARY_RANKS].filter(r => r.active !== false).sort((a,b) => a.order - b.order);

// Counts a list of {membership_level} rows by tier.
function tierBreakdown(rows){
  const b = {};
  rows.forEach(r => { b[r.membership_level] = (b[r.membership_level]||0) + 1; });
  return b;
}

// Computes one user's full salary standing: their last APPROVED rank, which
// rank they must be evaluated against this calendar month, their currently
// unused/available active L1 members, whether they personally hold the
// required plan tier, and whether they meet the team requirement right now.
//
// Progression rule: the first-ever approved claim may target the highest rank
// the user already fully qualifies for. Every claim after that must target
// exactly the next rank up (never a repeat, never a skip) — and only members
// not already "spent" on a prior APPROVED claim count toward it, so growth
// must keep compounding. A 'pending' application (submitted by the user,
// awaiting admin review) does not yet spend members or advance the rank —
// only an 'approved' row does that.
async function computeSalaryProgress(userId){
  const ranks = getSalaryRanks();
  if (!ranks.length) return null;

  const [{ rows: pastClaims }, { rows: selfRows }] = await Promise.all([
    db(`SELECT rank_order, period, member_ids_used, status FROM salary_claims WHERE user_id=$1`, [userId]),
    db(`SELECT membership_level FROM users WHERE id=$1`, [userId]),
  ]);
  const self = selfRows[0] || {};
  const approvedClaims = pastClaims.filter(c => c.status === 'approved');
  const usedIds = new Set();
  approvedClaims.forEach(c => (c.member_ids_used||[]).forEach(id => usedIds.add(id)));
  const lastOrder = approvedClaims.length ? Math.max(...approvedClaims.map(c=>c.rank_order)) : 0;
  const currentPeriod = new Date().toISOString().slice(0,7); // 'YYYY-MM'
  const alreadyClaimedThisPeriod = approvedClaims.some(c => c.period === currentPeriod);
  const alreadyAppliedThisPeriod = pastClaims.some(c => c.status === 'pending' && c.period === currentPeriod);

  const personalPlanMin = LIVE_SALARY_SETTINGS.personalPlanMin;
  // Fail-safe: if the configured plan was deleted/renamed since, getTierRank()
  // would fall back to 0 and the gate would silently pass for everyone
  // (including 'starter'). Require the plan to actually still exist instead.
  const personalPlanExists = LIVE_PLANS.some(p => p.id === personalPlanMin);
  const personalPlanOk = personalPlanExists && getTierRank(self.membership_level) >= getTierRank(personalPlanMin);

  const { rows: l1 } = await db(
    `SELECT id, name, uid, membership_level, created_at FROM users WHERE referred_by=$1 ORDER BY created_at ASC`,
    [userId]);
  let activeSet = new Set();
  if (l1.length){
    const ids = l1.map(r=>r.id);
    const ph = ids.map((_,i)=>`$${i+1}`).join(',');
    const { rows: ar } = await db(`SELECT DISTINCT user_id FROM investments WHERE status='active' AND user_id IN (${ph})`, ids);
    ar.forEach(r=>activeSet.add(r.user_id));
  }
  const activeMembers = l1.filter(m => activeSet.has(m.id) && m.membership_level && m.membership_level !== 'starter');
  const availableMembers = activeMembers.filter(m => !usedIds.has(m.id));

  // Looked up from the full (not just active) rank list, so a rank a user
  // already legitimately earned still shows its real name even if an admin
  // later deactivates it — a display concern only, doesn't affect eligibility.
  const currentRankName = lastOrder > 0 ? (LIVE_SALARY_RANKS.find(r=>r.order===lastOrder)?.name || null) : null;

  const maxOrder = ranks[ranks.length-1].order;
  const targetOrder = lastOrder === 0 ? null : Math.min(lastOrder + 1, maxOrder);

  const evaluate = (rank) => {
    const avail = tierBreakdown(availableMembers);
    const tierMins = rank.tierMins || {};
    const tierProgress = Object.keys(tierMins).map(t => ({
      tier: t, required: tierMins[t], have: avail[t]||0, met: (avail[t]||0) >= tierMins[t]
    }));
    const l1Met = availableMembers.length >= rank.l1Min;
    return { rank, l1Have: availableMembers.length, l1Min: rank.l1Min, l1Met, tierProgress, met: l1Met && tierProgress.every(t=>t.met) };
  };

  let evaluation;
  if (targetOrder === null){
    const evals = ranks.map(evaluate);
    evaluation = [...evals].reverse().find(e=>e.met) || evals[0];
  } else {
    // ranks is sorted ascending, so this finds the smallest order at or above
    // targetOrder — an exact match normally, or the next available rank if the
    // targeted order was deactivated/deleted since (a gap), so evaluation is
    // never left null as long as at least one active rank exists.
    const rank = ranks.find(r=>r.order>=targetOrder);
    evaluation = rank ? evaluate(rank) : null;
  }

  const canApply = !!(evaluation && evaluation.met && personalPlanOk && !alreadyClaimedThisPeriod && !alreadyAppliedThisPeriod);

  return {
    userId, lastOrder, currentRankName, currentPeriod, alreadyClaimedThisPeriod, alreadyAppliedThisPeriod,
    personalPlanOk, personalPlanMin, availableMembers, activeMembers, evaluation, canApply
  };
}

// Deterministically picks which available members get "spent" on a claim:
// fills each tier bucket (earliest-joined first) up to its minimum, then tops
// up with any remaining earliest members until l1Min total is reached.
function selectMembersForClaim(availableMembers, rank){
  const tierMins = rank.tierMins || {};
  const picked = new Set();
  const byTier = {};
  availableMembers.forEach(m => { (byTier[m.membership_level] ||= []).push(m); });
  Object.keys(tierMins).forEach(t => {
    (byTier[t]||[]).slice(0, tierMins[t]).forEach(m => picked.add(m.id));
  });
  for (const m of availableMembers){
    if (picked.size >= rank.l1Min) break;
    if (!picked.has(m.id)) picked.add(m.id);
  }
  return [...picked];
}
const DEFAULT_PAYMENT = {
  depositMin: parseFloat(process.env.DEPOSIT_MIN)||10,
  withdrawalMin: parseFloat(process.env.WITHDRAWAL_MIN)||2,
  withdrawalMax: parseFloat(process.env.WITHDRAWAL_MAX)||10000,
  withdrawalFeePercent: 5,
  network: 'BEP20',
  depositAddress: process.env.DEPOSIT_ADDRESS || '0x742d35Cc6634C0532925a3b8D4C9C0a6bEf4267',
};
const DEFAULT_REFERRAL = { enabled: true };
const DEFAULT_MAINTENANCE = { enabled: false, message: 'We are performing scheduled maintenance and will be back shortly.' };
const DEFAULT_SECURITY = { ipWhitelistEnabled: false, adminTwoFactorEnabled: false };
const DEFAULT_GENERAL = { siteName: 'QAVIX GLOBAL', supportEmail: 'support@qavixglobal.com', timezone: 'UTC', language: 'en' };
// Email delivery actually runs on the Brevo HTTP API (see sendEmail) — there is no
// raw SMTP host/port/user/password in this stack, so this only exposes the two
// fields that genuinely change Brevo's outgoing emails. The Brevo API key itself
// stays in .env since it's a secret, not something to expose through the panel.
const DEFAULT_EMAIL_SENDER = { fromName: 'QAVIX GLOBAL', fromEmail: '' };
const DEFAULT_OTP = { codeLength: 6, loginExpiryMin: 5, withdrawExpiryMin: 3, registerExpiryMin: 5, loginOtpEnabled: true, withdrawOtpEnabled: true };

// Ambassador salary ranks. tierMins keys are plan ids (from LIVE_PLANS) — e.g. an
// 'ultra' key works fine as data even before an 'ultra' plan exists; that rank simply
// stays unreachable until the plan is created, which is exactly the intended gate.
// order defines the required climb sequence (see computeSalaryProgress / getSalaryRanks).
const DEFAULT_SALARY_RANKS = [
  { key:'associate_ambassador', name:'Associate Ambassador', order:1, l1Min:5,   tierMins:{ silver:5 },                              amount:20,  active:true },
  { key:'senior_ambassador',    name:'Senior Ambassador',    order:2, l1Min:10,  tierMins:{ silver:7, gold:3 },                       amount:40,  active:true },
  { key:'elite_ambassador',     name:'Elite Ambassador',     order:3, l1Min:25,  tierMins:{ silver:15, gold:7, elite:3 },             amount:100, active:true },
  { key:'regional_ambassador',  name:'Regional Ambassador',  order:4, l1Min:50,  tierMins:{ silver:30, gold:10, elite:10 },           amount:200, active:true },
  { key:'global_ambassador',    name:'Global Ambassador',    order:5, l1Min:100, tierMins:{ silver:50, gold:25, elite:20, ultra:5 },  amount:500, active:true },
];
// Personal gate: a user must personally hold at least this plan tier (by rank,
// via getTierRank — so Elite also satisfies a Gold requirement) before they can
// apply for ANY salary rank, regardless of how strong their team is. Admin-editable.
const DEFAULT_SALARY_SETTINGS = { personalPlanMin: 'gold' };

// Live, DB-backed config — admins can edit these via /api/admin/settings/*.
// Falls back to the DEFAULT_* values above until the settings table has rows.
let LIVE_PLANS = DEFAULT_PLANS.map(p=>({...p}));
let LIVE_COMM = {...DEFAULT_COMM};
let LIVE_PAYMENT = {...DEFAULT_PAYMENT};
let LIVE_REFERRAL = {...DEFAULT_REFERRAL};
let LIVE_MAINTENANCE = {...DEFAULT_MAINTENANCE};
let LIVE_SECURITY = {...DEFAULT_SECURITY};
let LIVE_GENERAL = {...DEFAULT_GENERAL};
let LIVE_EMAIL_SENDER = {...DEFAULT_EMAIL_SENDER};
let LIVE_OTP = {...DEFAULT_OTP};
let LIVE_SALARY_RANKS = DEFAULT_SALARY_RANKS.map(r=>({...r, tierMins:{...r.tierMins}}));
let LIVE_SALARY_SETTINGS = {...DEFAULT_SALARY_SETTINGS};

// Extract the real client IP, accounting for Render's reverse proxy.
const getClientIp = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress || 'unknown';

const loadSettingsCache = async () => {
  try {
    const {rows} = await pool.query('SELECT key,value FROM settings');
    rows.forEach(r => {
      if (r.key === 'plans') LIVE_PLANS = r.value;
      if (r.key === 'commission') LIVE_COMM = r.value;
      if (r.key === 'payment') LIVE_PAYMENT = {...DEFAULT_PAYMENT, ...r.value};
      if (r.key === 'referral') LIVE_REFERRAL = {...DEFAULT_REFERRAL, ...r.value};
      if (r.key === 'maintenance') LIVE_MAINTENANCE = {...DEFAULT_MAINTENANCE, ...r.value};
      if (r.key === 'security') LIVE_SECURITY = {...DEFAULT_SECURITY, ...r.value};
      if (r.key === 'general') LIVE_GENERAL = {...DEFAULT_GENERAL, ...r.value};
      if (r.key === 'smtp') LIVE_EMAIL_SENDER = {...DEFAULT_EMAIL_SENDER, ...r.value};
      if (r.key === 'otp') LIVE_OTP = {...DEFAULT_OTP, ...r.value};
      if (r.key === 'salary_ranks') LIVE_SALARY_RANKS = r.value;
      if (r.key === 'salary_settings') LIVE_SALARY_SETTINGS = {...DEFAULT_SALARY_SETTINGS, ...r.value};
    });
    console.log('✅ Settings cache loaded from DB');
  } catch(e){ console.log('⚠️  Could not load settings cache, using defaults:', e.message); }
};

const REWARDS = [
  {id:'daily',  name:'Daily Check-in',      amount:0.50,  cd:24  },
  {id:'weekly', name:'Weekly Reward',       amount:5.00,  cd:168 },
  {id:'monthly',name:'Monthly Reward',      amount:25.00, cd:720 },
  {id:'ref1',   name:'First Referral Bonus',amount:5.00,  cd:null},
  {id:'ref10',  name:'10 Member Milestone', amount:15.00, cd:null},
];

// Pay referral commissions up the chain
const payComm = async (investorId, amount) => {
  if (!LIVE_REFERRAL.enabled) return;
  let cur = investorId;
  for (let lvl=1; lvl<=10; lvl++) {
    const {rows} = await db('SELECT id,name,referred_by FROM users WHERE id=$1',[cur]);
    if (!rows[0]?.referred_by) break;
    const earned = +((amount*(LIVE_COMM[lvl]||0))/100).toFixed(2);
    await db('UPDATE users SET pending_earnings=pending_earnings+$1 WHERE id=$2',[earned, rows[0].referred_by]);
    await db(`INSERT INTO transactions(user_id,type,amount,description,meta) VALUES($1,'commission',$2,$3,$4)`,
      [rows[0].referred_by, earned, `Level ${lvl} commission from ${rows[0].name}`, JSON.stringify({from:investorId,lvl})]);
    await notif(rows[0].referred_by,'commission',`Level ${lvl} commission received`,`$${earned} from ${rows[0].name}`);
    cur = rows[0].referred_by;
  }
};

// ═══════════════════════════════════════════════════════════════════════
//  EXPRESS MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════
app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'}}));

const origins = () => ['http://localhost:3000','http://localhost:5500','http://127.0.0.1:5500',
  ...(process.env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean)];

app.use(cors({
  origin: (o,cb) => (!o||origins().includes(o)) ? cb(null,true) : cb(new Error('CORS blocked')),
  credentials:true, methods:['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders:['Content-Type','Authorization'],
}));
app.options('*', cors());
app.use(express.json({limit:'10kb'}));
app.use(rateLimit({windowMs:15*60000, max:300, skip:r=>r.path==='/api/health'}));

// ── Maintenance mode (admins and health checks always pass through) ────────
app.use((req,res,next) => {
  if (!LIVE_MAINTENANCE.enabled) return next();
  if (req.path.startsWith('/api/admin') || req.path === '/api/health') return next();
  res.status(503).json({success:false, maintenance:true, message: LIVE_MAINTENANCE.message});
});

// ── Admin IP whitelist (only enforced when toggled on in Security settings) ─
app.use(async (req,res,next) => {
  if (!req.path.startsWith('/api/admin')) return next();
  if (!LIVE_SECURITY.ipWhitelistEnabled) return next();
  // Exempt only the toggle endpoint: an admin who already holds a valid token from
  // before their IP changed can still reach it to turn the restriction off, even
  // though every other admin route is blocked for them. Login itself is NOT
  // exempted — exempting it would let anyone with valid credentials (but a
  // non-whitelisted IP) log in and then immediately call this same toggle to
  // disable the whole protection, which would defeat the point of the feature.
  if (req.path === '/api/admin/security/ip-whitelist/toggle') return next();
  const ip = getClientIp(req);
  try {
    const {rows:countRows} = await db('SELECT COUNT(*) c FROM admin_ip_whitelist');
    // Safety net: an enabled whitelist with zero entries would lock out every
    // admin with no way back in (including via the toggle, since reaching it
    // requires logging in first). Treat that as misconfigured and fail open.
    if (parseInt(countRows[0].c) === 0) return next();
    const {rows} = await db('SELECT 1 FROM admin_ip_whitelist WHERE ip_address=$1',[ip]);
    if (!rows[0]) return res.status(403).json({success:false,message:`Access denied: IP ${ip} is not whitelisted for admin access`});
    next();
  } catch(e){ next(); } // fail open on DB errors so a transient issue doesn't lock everyone out
});

const limit10 = rateLimit({windowMs:15*60000, max:10});

// ═══════════════════════════════════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════════════════════════════════

// Health
app.get('/',           (_,res)=>res.json({success:true,message:'🏦 QAVIX GLOBAL API',db:pool?'Neon ✅':'No DB ⚠️'}));
app.get('/api/health', (_,res)=>res.json({success:true,status:'healthy',uptime:process.uptime()}));

// ── Public: active announcements (used by index.html banner/popup) ─────────
app.get('/api/announcements/active', async (_,res) => {
  try {
    const {rows} = await db(
      `SELECT id,title,message,type,style,slide_theme FROM announcements
       WHERE is_active=true AND starts_at<=NOW() AND (ends_at IS NULL OR ends_at>NOW())
       ORDER BY created_at DESC`);
    res.json({success:true,data:{announcements:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Public: Content Management read endpoints (used by index.html) ────────

// ── Public: payment limits & fee (used by index.html withdrawal form) ────
app.get('/api/content/payment-info', async (_,res) => {
  res.json({success:true,data:{
    depositMin: LIVE_PAYMENT.depositMin,
    withdrawalMin: LIVE_PAYMENT.withdrawalMin,
    withdrawalMax: LIVE_PAYMENT.withdrawalMax,
    withdrawalFeePercent: LIVE_PAYMENT.withdrawalFeePercent,
    depositAddress: LIVE_PAYMENT.depositAddress,
    network: LIVE_PAYMENT.network,
  }});
});

// Only siteName and supportEmail are exposed here — timezone/language are stored
// for future use but nothing in the app consumes them yet (no i18n or per-region
// date conversion exists), so they're intentionally left out of this public payload.
app.get('/api/content/general-info', async (_,res) => {
  res.json({success:true,data:{
    siteName: LIVE_GENERAL.siteName,
    supportEmail: LIVE_GENERAL.supportEmail,
  }});
});

app.get('/api/content/faq', async (_,res) => {
  try {
    const {rows} = await db(`SELECT id,question,answer,category FROM content_faq WHERE is_active=true ORDER BY sort_order ASC, created_at ASC`);
    res.json({success:true,data:{faqs:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/content/banners', async (_,res) => {
  try {
    const {rows} = await db(`SELECT id,title,subtitle,image_url,link_url FROM content_banners WHERE is_active=true ORDER BY sort_order ASC, created_at ASC`);
    res.json({success:true,data:{banners:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/content/news', async (req,res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit)||20, 50);
    const {rows} = await db(
      `SELECT id,title,excerpt,body,image_url,published_at FROM content_news
       WHERE is_published=true ORDER BY published_at DESC LIMIT $1`,[limit]);
    res.json({success:true,data:{news:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/content/pages/:slug', async (req,res) => {
  try {
    const {rows} = await db('SELECT slug,title,body,updated_at FROM content_pages WHERE slug=$1',[req.params.slug]);
    if (!rows[0]) return res.status(404).json({success:false,message:'Page not found'});
    res.json({success:true,data:{page:cc(rows[0])}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Auth ─────────────────────────────────────────────────────────────────
// ── Registration — Step 1: Send OTP ──────────────────────────────────────
app.post('/api/auth/register/send-otp', limit10, async (req,res) => {
  try {
    const {name,email,password,phone,referralCode} = req.body;
    if (!name||!email||!password) return res.status(400).json({success:false,message:'Name, email and password required'});
    if (!referralCode) return res.status(400).json({success:false,message:'Referral code is required'});
    if (password.length < 8) return res.status(400).json({success:false,message:'Password must be at least 8 characters'});

    const {rows:ex} = await db('SELECT id FROM users WHERE email=$1',[email.toLowerCase()]);
    if (ex[0]) return res.status(409).json({success:false,message:'Email already registered'});

    const {rows:r} = await db('SELECT id FROM users WHERE referral_code=$1',[referralCode.toUpperCase()]);
    if (!r[0]) return res.status(400).json({success:false,message:'Invalid referral code'});

    await issueOTP(null, email.toLowerCase(), 'register', {name,email:email.toLowerCase(),password,phone,referralCode:referralCode.toUpperCase(),referredBy:r[0].id});
    res.json({success:true,requireOtp:true,message:'OTP sent to your email. Valid for 5 minutes.'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Registration — Step 2: Verify OTP + Create Account ───────────────────
app.post('/api/auth/register', limit10, async (req,res) => {
  try {
    const {email, otp} = req.body;
    if (!email||!otp) return res.status(400).json({success:false,message:'Email and OTP required'});

    const record = await verifyOTP(email.toLowerCase(), otp, 'register');
    const meta   = record.meta || {};

    const hash  = await bcrypt.hash(meta.password, 12);
    const uid   = 'QVX-' + Math.floor(100000+Math.random()*900000);
    const code  = meta.name.replace(/\s+/g,'').substring(0,2).toUpperCase() + Math.floor(100000+Math.random()*900000);

    const {rows:[newUser]} = await db(
      `INSERT INTO users(name,email,phone,password,uid,referral_code,referred_by,is_verified)
       VALUES($1,$2,$3,$4,$5,$6,$7,TRUE) RETURNING *`,
      [meta.name, meta.email, meta.phone||'', hash, uid, code, meta.referredBy||null]
    );

    // Commission tracking setup
    if (meta.referredBy) {
      await db(`INSERT INTO transactions(user_id,type,amount,description,meta)
        VALUES($1,'commission',0,'New referral joined','{}')`,[meta.referredBy]);
    }

    await notif(newUser.id,'system','Welcome to QAVIX GLOBAL 🎉','Your account is ready. Start investing today!');
    const aT=signA(newUser.id), rT=signR(newUser.id);
    await db('INSERT INTO refresh_tokens(token) VALUES($1)',[rT]);
    res.status(201).json({success:true,message:'Account created successfully!',data:{user:safe(cc(newUser)),accessToken:aT,refreshToken:rT}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Forgot Password ───────────────────────────────────────────────────────
app.post('/api/auth/forgot-password', limit10, async (req,res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({success:false,message:'Email required'});
    const { rows } = await db('SELECT id FROM users WHERE email=$1',[email.toLowerCase()]);
    if (!rows[0]) return res.json({success:true,requireOtp:true,message:'If this email exists, an OTP has been sent'});
    await issueOTP(rows[0].id, email.toLowerCase(), 'password_reset');
    res.json({success:true,requireOtp:true,message:'OTP sent to your email. Valid for 10 minutes.'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/auth/reset-password', limit10, async (req,res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email||!otp||!newPassword) return res.status(400).json({success:false,message:'All fields required'});
    if (newPassword.length < 8) return res.status(400).json({success:false,message:'Min 8 characters'});
    await verifyOTP(email.toLowerCase(), otp, 'password_reset');
    const {rows} = await db('SELECT id FROM users WHERE email=$1',[email.toLowerCase()]);
    if (!rows[0]) return res.status(400).json({success:false,message:'User not found'});
    await db('UPDATE users SET password=$1 WHERE id=$2',[await bcrypt.hash(newPassword,12),rows[0].id]);
    await notif(rows[0].id,'security','Password Reset','Your password was reset successfully.');
    res.json({success:true,message:'Password reset successful. Please login.'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/auth/login', limit10, async (req,res) => {
  try {
    const {email,password,otp} = req.body;
    if (!email||!password) return res.status(400).json({success:false,message:'Email and password required'});
    const {rows} = await db('SELECT * FROM users WHERE email=$1',[email.toLowerCase()]);
    if (!rows[0]||!await bcrypt.compare(password,rows[0].password))
      return res.status(401).json({success:false,message:'Invalid email or password'});

    const user = rows[0];
    if (user.status === 'suspended') return res.status(403).json({success:false,message:'Your account has been suspended. Contact support for help.'});
    if (user.status === 'banned')    return res.status(403).json({success:false,message:'Your account has been banned.'});

    // Step 1: credentials OK → send OTP (unless login OTP has been turned off in Settings)
    if (!otp && LIVE_OTP.loginOtpEnabled) {
      await issueOTP(user.id, user.email, 'login');
      return res.json({success:true,requireOtp:true,message:`OTP sent to your email. Valid for ${LIVE_OTP.loginExpiryMin} minutes.`});
    }

    // Step 2: verify OTP → issue tokens (skipped entirely when login OTP is disabled)
    if (otp) await verifyOTP(user.email, otp, 'login');
    await db('UPDATE users SET last_login=NOW() WHERE id=$1',[user.id]);
    const ip  = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress || 'unknown';
    const dev = req.headers['user-agent'] || 'Unknown device';
    // Skip logging internal/Render IPs
    const isInternal = ip.startsWith('10.') || ip.startsWith('127.') || ip.startsWith('172.1') || ip.startsWith('192.168.');
    if (!isInternal) {
      await db('INSERT INTO login_history(user_id,ip,device) VALUES($1,$2,$3)',[user.id,ip,dev.slice(0,200)]).catch(()=>{});
    }
    const aT=signA(user.id), rT=signR(user.id);
    await db('INSERT INTO refresh_tokens(token) VALUES($1)',[rT]);
    // Save active session
    if (!isInternal) {
      await db(
        'INSERT INTO user_sessions(user_id,refresh_token,device,ip) VALUES($1,$2,$3,$4)',
        [user.id, rT, dev.slice(0,300), ip]
      ).catch(()=>{});
    }
    res.json({success:true,message:'Login successful',data:{user:safe(cc(user)),accessToken:aT,refreshToken:rT}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/auth/refresh', async (req,res) => {
  try {
    const {refreshToken} = req.body;
    const {rows} = await db('SELECT 1 FROM refresh_tokens WHERE token=$1',[refreshToken]);
    if (!rows[0]) return res.status(401).json({success:false,message:'Invalid refresh token'});
    const d = jwt.verify(refreshToken,process.env.JWT_REFRESH_SECRET);
    res.json({success:true,data:{accessToken:signA(d.id)}});
  } catch(e){res.status(401).json({success:false,message:'Refresh token expired'});}
});

app.post('/api/auth/logout', async (req,res) => {
  const rT = req.body.refreshToken;
  if (rT) {
    await db('DELETE FROM refresh_tokens WHERE token=$1',[rT]).catch(()=>{});
    await db('DELETE FROM user_sessions WHERE refresh_token=$1',[rT]).catch(()=>{});
  }
  res.json({success:true,message:'Logged out'});
});

// ── Active Sessions ───────────────────────────────────────────────────────
app.get('/api/user/sessions', auth, async (req,res) => {
  try {
    const {rows} = await db(
      `SELECT id, device, ip, created_at, last_active
       FROM user_sessions WHERE user_id=$1
       ORDER BY last_active DESC`,
      [req.user.id]
    );
    res.json({success:true, data:{sessions: rows.map(cc)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.delete('/api/user/sessions/:id', auth, async (req,res) => {
  try {
    await db('DELETE FROM user_sessions WHERE id=$1 AND user_id=$2',[req.params.id, req.user.id]);
    res.json({success:true, message:'Session removed'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/auth/me', auth, (req,res) => res.json({success:true,data:{user:req.user}}));

// ── User ──────────────────────────────────────────────────────────────────
app.get('/api/user/dashboard', auth, async (req,res) => {
  try {
    const [{rows:[u]},{rows:inv},{rows:tx}] = await Promise.all([
      db('SELECT * FROM users WHERE id=$1',[req.user.id]),
      db("SELECT * FROM investments WHERE user_id=$1 AND status='active'",[req.user.id]),
      db('SELECT * FROM transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 5',[req.user.id]),
    ]);
    const user=cc(u);
    res.json({success:true,data:{user:safe(user),balance:user.balance,pendingEarnings:user.pendingEarnings,totalDeposited:user.totalDeposited,totalWithdrawn:user.totalWithdrawn,activeInvestments:ccAll(inv),recentTransactions:ccAll(tx)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/user/profile', auth, async (req,res) => {
  const {rows}=await db('SELECT * FROM users WHERE id=$1',[req.user.id]);
  res.json({success:true,data:{user:safe(cc(rows[0]))}});
});

app.put('/api/user/profile', auth, async (req,res) => {
  try {
    const {name,phone}=req.body; const sets=[],vals=[];
    if (name)  {sets.push(`name=$${vals.length+1}`); vals.push(name.trim());}
    if (phone) {sets.push(`phone=$${vals.length+1}`);vals.push(phone.trim());}
    if (!sets.length) return res.status(400).json({success:false,message:'Nothing to update'});
    vals.push(req.user.id);
    const {rows}=await db(`UPDATE users SET ${sets.join(',')} WHERE id=$${vals.length} RETURNING *`,vals);
    res.json({success:true,message:'Profile updated',data:{user:safe(cc(rows[0]))}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Update Personal Info ──────────────────────────────────────────────────
app.put('/api/user/personal-info', auth, async (req,res) => {
  try {
    const {name, telegram, dateOfBirth, phone} = req.body;
    await db(
      `UPDATE users SET
        name=COALESCE($1,name),
        telegram=COALESCE($2,telegram),
        date_of_birth=COALESCE($3,date_of_birth),
        phone=COALESCE($4,phone)
       WHERE id=$5`,
      [name||null, telegram||null, dateOfBirth||null, phone||null, req.user.id]
    );
    const {rows:[u]} = await db('SELECT * FROM users WHERE id=$1',[req.user.id]);
    res.json({success:true,message:'Profile updated',data:{user:safe(cc(u))}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Withdrawal Password ───────────────────────────────────────────────────
app.post('/api/user/set-withdrawal-password', auth, async (req,res) => {
  try {
    const {password} = req.body;
    if (!password||password.length<6) return res.status(400).json({success:false,message:'Min 6 characters'});
    const {rows:[u]} = await db('SELECT withdrawal_pass FROM users WHERE id=$1',[req.user.id]);
    if (u.withdrawal_pass) return res.status(400).json({success:false,message:'Withdrawal password already set. Use change option.'});
    await db('UPDATE users SET withdrawal_pass=$1 WHERE id=$2',[await bcrypt.hash(password,10),req.user.id]);
    res.json({success:true,message:'Withdrawal password set successfully'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/user/change-withdrawal-password', auth, async (req,res) => {
  try {
    const {oldPassword, newPassword, otp, forgotMode} = req.body;
    const {rows:[u]} = await db('SELECT withdrawal_pass,email FROM users WHERE id=$1',[req.user.id]);
    if (!u.withdrawal_pass) return res.status(400).json({success:false,message:'No withdrawal password set'});

    // ── Forgot mode: send OTP ──
    if (forgotMode && !otp && !newPassword) {
      await issueOTP(req.user.id, u.email, 'withdraw_password');
      return res.json({success:true,requireOtp:true,message:'OTP sent to your email. Valid for 5 minutes.'});
    }

    // ── Forgot mode: verify OTP → change ──
    if (otp && newPassword) {
      if (newPassword.length<6) return res.status(400).json({success:false,message:'Min 6 characters'});
      await verifyOTP(u.email, otp, 'withdraw_password');
      await db('UPDATE users SET withdrawal_pass=$1 WHERE id=$2',[await bcrypt.hash(newPassword,10),req.user.id]);
      await notif(req.user.id,'security','Withdrawal password changed','Your withdrawal password was reset via OTP.');
      return res.json({success:true,message:'Withdrawal password changed successfully'});
    }

    // ── Normal mode: old password → change directly (no OTP) ──
    if (oldPassword && newPassword) {
      if (newPassword.length<6) return res.status(400).json({success:false,message:'Min 6 characters'});
      if (!await bcrypt.compare(oldPassword,u.withdrawal_pass))
        return res.status(400).json({success:false,message:'Old password is incorrect'});
      await db('UPDATE users SET withdrawal_pass=$1 WHERE id=$2',[await bcrypt.hash(newPassword,10),req.user.id]);
      await notif(req.user.id,'security','Withdrawal password changed','Your withdrawal password was updated.');
      return res.json({success:true,message:'Withdrawal password changed successfully'});
    }

    return res.status(400).json({success:false,message:'Invalid request'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Login History ─────────────────────────────────────────────────────────
app.get('/api/user/login-history', auth, async (req,res) => {
  try {
    const {rows} = await db(
      `SELECT * FROM login_history WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json({success:true,data:{history:rows.map(cc)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/user/change-password', auth, async (req,res) => {
  try {
    const {oldPassword, newPassword, otp, forgotMode} = req.body;

    // ── Forgot mode: send OTP ──
    if (forgotMode && !otp && !newPassword) {
      await issueOTP(req.user.id, req.user.email, 'change_password');
      return res.json({success:true,requireOtp:true,message:'OTP sent to your email. Valid for 5 minutes.'});
    }

    // ── Forgot mode: verify OTP → change ──
    if (otp && newPassword) {
      if (newPassword.length<8) return res.status(400).json({success:false,message:'Min 8 characters'});
      await verifyOTP(req.user.email, otp, 'change_password');
      await db('UPDATE users SET password=$1 WHERE id=$2',[await bcrypt.hash(newPassword,12),req.user.id]);
      await notif(req.user.id,'security','Password changed','Your login password was reset via OTP.');
      return res.json({success:true,message:'Password changed successfully'});
    }

    // ── Normal mode: old password → change directly (no OTP) ──
    if (oldPassword && newPassword) {
      if (newPassword.length<8) return res.status(400).json({success:false,message:'Min 8 characters'});
      const {rows:[u]} = await db('SELECT password FROM users WHERE id=$1',[req.user.id]);
      if (!await bcrypt.compare(oldPassword,u.password))
        return res.status(400).json({success:false,message:'Old password is incorrect'});
      await db('UPDATE users SET password=$1 WHERE id=$2',[await bcrypt.hash(newPassword,12),req.user.id]);
      await notif(req.user.id,'security','Password changed','Your login password was updated.');
      return res.json({success:true,message:'Password changed successfully'});
    }

    return res.status(400).json({success:false,message:'Invalid request'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/user/change-email', auth, async (req,res) => {
  try {
    const {newEmail, otp} = req.body;
    if (!newEmail) return res.status(400).json({success:false,message:'New email required'});

    // ── Step 1: send OTP to NEW email ──
    if (!otp) {
      const {rows:ex} = await db('SELECT id FROM users WHERE email=$1',[newEmail.toLowerCase()]);
      if (ex[0]) return res.status(409).json({success:false,message:'Email already in use'});
      const code = genOTP();
      await saveOTP(req.user.id, newEmail.toLowerCase(), code, 'change_email', {newEmail:newEmail.toLowerCase()});
      sendOTPMail(newEmail.toLowerCase(), code, 'change_email').catch(e=>console.error("Mail error:",e.message));
      return res.json({success:true, requireOtp:true, message:'OTP sent to new email address'});
    }

    // ── Step 2: verify OTP → change email ──
    const valid = await verifyOTP(newEmail.toLowerCase(), otp, 'change_email');
    if (!valid) return res.status(400).json({success:false,message:'Invalid or expired OTP'});
    const newEmailVal = valid.meta?.newEmail;
    if (!newEmailVal) return res.status(400).json({success:false,message:'Session expired, try again'});
    await db('UPDATE users SET email=$1 WHERE id=$2',[newEmailVal, req.user.id]);
    await notif(req.user.id,'security','Email changed successfully',`Your email is now ${newEmailVal}`);
    res.json({success:true,message:'Email updated successfully'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/user/wallet-address', auth, async (req,res) => {
  try {
    const {walletAddress,network}=req.body;
    if (!walletAddress) return res.status(400).json({success:false,message:'Wallet address required'});
    await db('UPDATE users SET wallet_address=$1,wallet_network=$2 WHERE id=$3',[walletAddress,network||'BEP20',req.user.id]);
    res.json({success:true,message:'Wallet address updated'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Plans ─────────────────────────────────────────────────────────────────
app.get('/api/plans', auth, async (req,res) => {
  try {
    const {rows} = await db("SELECT plan_id FROM investments WHERE user_id=$1 AND status='active'",[req.user.id]);
    const active = rows.map(r=>r.plan_id);
    res.json({success:true, data:{plans: LIVE_PLANS.map(p=>({
      ...p,
      isActive      : active.includes(p.id),
      dailyExample  : +(p.min * p.rate).toFixed(2),
      dailyExampleMax: +(p.max * p.rate).toFixed(2),
      totalExample  : +(p.min * p.rate * p.days).toFixed(2),
      totalExampleMax: +(p.max * p.rate * p.days).toFixed(2),
    }))}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/plans/purchase', auth, async (req,res) => {
  try {
    const {planId,amount}=req.body;
    const plan=LIVE_PLANS.find(p=>p.id===planId);
    if (!plan) return res.status(404).json({success:false,message:'Plan not found'});
    if (plan.status === 'paused') return res.status(400).json({success:false,message:`${plan.tier} is temporarily unavailable`});
    const {rows:[u]}=await db('SELECT balance,membership_level FROM users WHERE id=$1',[req.user.id]);
    const amt = parseFloat(amount);
    if (!amt || isNaN(amt))       return res.status(400).json({success:false,message:'Invalid amount'});
    if (amt < plan.min)           return res.status(400).json({success:false,message:`Minimum for ${plan.tier} is $${plan.min}`});
    if (amt > plan.max)           return res.status(400).json({success:false,message:`Maximum for ${plan.tier} is $${plan.max}`});
    if (amt < 5)                  return res.status(400).json({success:false,message:'Minimum investment is $5'});
    if (parseFloat(u.balance)<amt) return res.status(400).json({success:false,message:'Insufficient balance'});
    const end   = new Date(Date.now() + plan.days * 86400000);
    const daily = +(amt * plan.rate).toFixed(4);
    const totalProfit = +(daily * plan.days).toFixed(2);
    // Capital is locked — total_return stores only total profit (not capital)
    const {rows} = await db(
      `INSERT INTO investments(user_id,plan_id,plan_name,amount,daily_income,total_return,days_total,end_date)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, planId, plan.name, amt, daily, totalProfit, plan.days, end]
    );
    // Deduct from balance — capital is locked permanently
    await db('UPDATE users SET balance=balance-$1,total_deposited=total_deposited+$1 WHERE id=$2',[amt,req.user.id]);
    // Reflect the highest plan tier ever reached as the user's membership level
    // (e.g. team tree badges, admin Users list "Plan" column, leaderboards).
    if (getTierRank(planId) > getTierRank(u.membership_level)) {
      await db('UPDATE users SET membership_level=$1 WHERE id=$2',[planId, req.user.id]);
    }
    await payComm(req.user.id, amt);
    await notif(req.user.id,'investment',`${plan.name} activated!`,
      `Daily profit: $${daily.toFixed(2)} for ${plan.days} days. Capital is locked.`);
    res.status(201).json({success:true,
      message:`${plan.name} activated! Daily profit: $${daily.toFixed(2)}`,
      data:{investment:cc(rows[0]), dailyProfit:daily, totalProfit, daysTotal:plan.days}
    });
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/plans/mine', auth, async (req,res) => {
  try {
    const {rows}=await db('SELECT * FROM investments WHERE user_id=$1 ORDER BY created_at DESC',[req.user.id]);
    res.json({success:true,data:{investments:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Wallet ────────────────────────────────────────────────────────────────
app.get('/api/wallet/balance', auth, async (req,res) => {
  try {
    const {rows}=await db('SELECT balance,pending_earnings,total_deposited,total_withdrawn,wallet_address,wallet_network FROM users WHERE id=$1',[req.user.id]);
    res.json({success:true,data:cc(rows[0])});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/wallet/transactions', auth, async (req,res) => {
  try {
    const lim=parseInt(req.query.limit)||50, type=req.query.type;
    const q=type ? 'SELECT * FROM transactions WHERE user_id=$1 AND type=$2 ORDER BY created_at DESC LIMIT $3'
                 : 'SELECT * FROM transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2';
    const p=type ? [req.user.id,type,lim] : [req.user.id,lim];
    const {rows}=await db(q,p);
    res.json({success:true,data:{transactions:ccAll(rows),count:rows.length}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// Returns the user's own permanent BEP20 deposit address, generating one on
// first call (atomic via a DB sequence, so no two users can ever collide).
// Falls back to the shared platform address if HD wallet isn't configured.
app.get('/api/wallet/deposit-address', auth, async (req,res) => {
  try {
    const { rows:[u] } = await db('SELECT deposit_address FROM users WHERE id=$1', [req.user.id]);
    if (u.deposit_address) {
      return res.json({success:true,data:{ address:u.deposit_address, network:LIVE_PAYMENT.network||'BEP20', autoDetect:true }});
    }
    if (!hdMaster) {
      return res.json({success:true,data:{ address:LIVE_PAYMENT.depositAddress, network:LIVE_PAYMENT.network||'BEP20', autoDetect:false }});
    }
    const { rows:[seq] } = await db(`SELECT nextval('hd_deposit_index_seq') AS idx`);
    const idx = parseInt(seq.idx);
    const address = deriveDepositAddress(idx);
    await db('UPDATE users SET deposit_address=$1, deposit_address_index=$2 WHERE id=$3', [address, idx, req.user.id]);
    res.json({success:true,data:{ address, network:LIVE_PAYMENT.network||'BEP20', autoDetect:true }});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/wallet/deposit', auth, async (req,res) => {
  try {
    const {amount,network,txHash}=req.body;
    const MIN=LIVE_PAYMENT.depositMin, amt=parseFloat(amount);
    if (!amt||amt<MIN) return res.status(400).json({success:false,message:`Min deposit $${MIN}`});
    if (!txHash||!txHash.trim()) return res.status(400).json({success:false,message:'Transaction hash required'});
    // A transaction hash is a one-time reference to a real on-chain transfer —
    // block resubmitting the same hash (whether by the same user or a
    // different one) so it can never be counted/approved twice.
    const { rows: dupe } = await db(
      `SELECT id FROM transactions WHERE type='deposit' AND meta->>'txHash' = $1 LIMIT 1`,
      [txHash.trim()]);
    if (dupe.length) return res.status(400).json({success:false,message:'This transaction hash has already been submitted'});
    // Deposits are held as 'pending' until an admin approves them in the admin console.
    // Balance is only credited on approval — see PUT /api/admin/deposits/:id/approve
    const {rows}=await db(`INSERT INTO transactions(user_id,type,amount,status,description,meta) VALUES($1,'deposit',$2,'pending',$3,$4) RETURNING *`,
      [req.user.id,amt,`Deposit via ${network||'BEP20'}`,JSON.stringify({network,txHash:txHash.trim()})]);
    await notif(req.user.id,'deposit','Deposit Submitted',`$${amt} USDT submitted, awaiting confirmation`);
    res.status(201).json({success:true,message:`$${amt} deposit submitted and is pending confirmation`,data:{transaction:cc(rows[0])}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/wallet/withdraw', auth, async (req,res) => {
  try {
    const {amount,walletAddress,network,withdrawalPassword,otp} = req.body;
    const MIN = LIVE_PAYMENT.withdrawalMin;
    const MAX = LIVE_PAYMENT.withdrawalMax;
    const amt = parseFloat(amount);
    if (!amt||amt<MIN) return res.status(400).json({success:false,message:`Minimum withdrawal is $${MIN} USDT`});
    if (amt>MAX)       return res.status(400).json({success:false,message:`Max withdrawal $${MAX}`});
    if (!walletAddress)return res.status(400).json({success:false,message:'Wallet address required'});
    const {rows:[u]}=await db('SELECT balance,email,withdrawal_pass,wallet_address FROM users WHERE id=$1',[req.user.id]);
    if (parseFloat(u.balance)<amt) return res.status(400).json({success:false,message:'Insufficient balance'});

    // ── Must have at least one active investment plan to withdraw ──
    const {rows:activePlans}=await db("SELECT id FROM investments WHERE user_id=$1 AND status='active' LIMIT 1",[req.user.id]);
    if (!activePlans.length) return res.status(400).json({success:false,message:'You must have an active investment plan to withdraw. Please purchase a plan first.'});

    if (!u.withdrawal_pass) return res.status(400).json({success:false,message:'Please set a withdrawal password first in Profile → Security'});
    if (!withdrawalPassword) return res.status(400).json({success:false,message:'Withdrawal password required'});
    if (!await bcrypt.compare(withdrawalPassword,u.withdrawal_pass)) return res.status(400).json({success:false,message:'Incorrect withdrawal password'});

    const fee = +(amt * (LIVE_PAYMENT.withdrawalFeePercent/100)).toFixed(2);
    const net = +(amt - fee).toFixed(2);

    // OTP step (skipped entirely when withdrawal OTP has been turned off in Settings)
    if (!otp && LIVE_OTP.withdrawOtpEnabled) {
      await issueOTP(req.user.id, u.email, 'withdraw', {amount:amt, walletAddress, network, fee, net});
      return res.json({success:true,requireOtp:true,message:`OTP sent to confirm withdrawal. Valid for ${LIVE_OTP.withdrawExpiryMin} minutes.`,data:{fee,netAmount:net}});
    }
    if (otp) await verifyOTP(u.email, otp, 'withdraw');
    // Atomic check-and-deduct in one statement: if two requests race (e.g. a
    // double-submit), only one can succeed since the WHERE clause re-checks
    // balance at the moment of the UPDATE itself, not from the earlier SELECT.
    const { rowCount } = await db(
      'UPDATE users SET balance=balance-$1,total_withdrawn=total_withdrawn+$2 WHERE id=$3 AND balance>=$1',
      [amt,net,req.user.id]);
    if (rowCount === 0) return res.status(400).json({success:false,message:'Insufficient balance'});
    const {rows}=await db(
      `INSERT INTO transactions(user_id,type,amount,status,description,meta)
       VALUES($1,'withdrawal',$2,'pending',$3,$4) RETURNING *`,
      [req.user.id,net,`Withdrawal to ${walletAddress}`,JSON.stringify({walletAddress,network,fee})]
    );
    await notif(req.user.id,'withdrawal','Withdrawal Submitted',`$${net} USDT withdrawal submitted for review`);
    res.status(201).json({success:true,message:`$${net} withdrawal submitted for admin review`,data:{transaction:cc(rows[0]),fee,netAmount:net}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Referral ──────────────────────────────────────────────────────────────
app.get('/api/referral/info', auth, async (req,res) => {
  try {
    const {rows}=await db('SELECT referral_code FROM users WHERE id=$1',[req.user.id]);
    const code=rows[0].referral_code;
    res.json({success:true,data:{referralCode:code,referralLink:`https://qavixglobal.pages.dev/?ref=${code}`,commissionRates:LIVE_COMM}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Team Financials ───────────────────────────────────────────────────────
app.get('/api/referral/team-financials', auth, async (req,res) => {
  try {
    const {rows:team} = await db(
      `WITH RECURSIVE team AS (
        SELECT id,name FROM users WHERE referred_by=$1
        UNION ALL
        SELECT u.id,u.name FROM users u INNER JOIN team t ON u.referred_by=t.id
      ) SELECT id,name FROM team LIMIT 200`,
      [req.user.id]
    );
    if (!team.length) return res.json({success:true,data:{totalDeposited:0,totalWithdrawn:0,deposits:[],withdrawals:[]}});
    const ids = team.map(m=>m.id);
    const nm  = {};  team.forEach(m=>{ nm[m.id]=m.name; });
    const {rows:deps} = await db(
      `SELECT user_id,amount,created_at FROM transactions WHERE user_id=ANY($1::uuid[]) AND type='deposit' ORDER BY created_at DESC LIMIT 100`,
      [ids]
    );
    const {rows:wds} = await db(
      `SELECT user_id,amount,created_at FROM transactions WHERE user_id=ANY($1::uuid[]) AND type='withdrawal' ORDER BY created_at DESC LIMIT 100`,
      [ids]
    );
    res.json({success:true,data:{
      totalDeposited: +deps.reduce((s,r)=>s+parseFloat(r.amount),0).toFixed(2),
      totalWithdrawn: +wds.reduce((s,r)=>s+parseFloat(r.amount),0).toFixed(2),
      deposits:    deps.map(r=>({name:nm[r.user_id]||'Member',amount:parseFloat(r.amount),date:r.created_at})),
      withdrawals: wds.map(r=>({name:nm[r.user_id]||'Member',amount:parseFloat(r.amount),date:r.created_at})),
    }});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/referral/team', auth, async (req,res) => {
  try {
    const {rows}=await db(`
      WITH RECURSIVE t AS (
        SELECT id,name,uid,membership_level,is_verified,created_at,1 AS lvl FROM users WHERE referred_by=$1
        UNION ALL
        SELECT u.id,u.name,u.uid,u.membership_level,u.is_verified,u.created_at,t.lvl+1
        FROM users u JOIN t ON u.referred_by=t.id WHERE t.lvl<10
      ) SELECT * FROM t ORDER BY lvl,created_at
    `,[req.user.id]);
    // Check which members have an active investment plan
    const memberIds = rows.map(r => r.id);
    let activeSet = new Set();
    if (memberIds.length > 0) {
      const placeholders = memberIds.map((_,i)=>`$${i+1}`).join(',');
      const {rows: activeRows} = await db(
        `SELECT DISTINCT user_id FROM investments WHERE status='active' AND user_id IN (${placeholders})`,
        memberIds
      );
      activeRows.forEach(r => activeSet.add(r.user_id));
    }
    const byLvl={};
    rows.forEach(r=>{
      if(!byLvl[r.lvl]) byLvl[r.lvl]=[];
      byLvl[r.lvl].push({
        id:r.id, name:r.name, uid:r.uid,
        status: activeSet.has(r.id) ? 'active' : 'inactive',
        level:r.membership_level, joinDate:r.created_at
      });
    });
    res.json({success:true,data:{totalMembers:rows.length,levels:Object.entries(byLvl).map(([l,m])=>({level:parseInt(l),count:m.length,commission:LIVE_COMM[l]||0,members:m}))}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/referral/earnings', auth, async (req,res) => {
  try {
    const [{rows:[u]},{rows:tx},{rows:[agg]},{rows:lvlRows}]=await Promise.all([
      db('SELECT pending_earnings FROM users WHERE id=$1',[req.user.id]),
      db("SELECT * FROM transactions WHERE user_id=$1 AND type='commission' ORDER BY created_at DESC LIMIT 20",[req.user.id]),
      db("SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id=$1 AND type='commission'",[req.user.id]),
      db(`SELECT meta->>'lvl' AS lvl, COALESCE(SUM(amount),0) AS earned
          FROM transactions WHERE user_id=$1 AND type='commission' AND meta->>'lvl' IS NOT NULL
          GROUP BY meta->>'lvl' ORDER BY lvl`,[req.user.id]),
    ]);
    const total=parseFloat(agg.total), avail=parseFloat(u.pending_earnings);
    const byLevel={};
    lvlRows.forEach(r=>{ byLevel[r.lvl]=parseFloat(r.earned); });
    res.json({success:true,data:{
      totalEarned:+total.toFixed(2),
      available:+avail.toFixed(2),
      pendingEarnings:+avail.toFixed(2),
      availableEarnings:+avail.toFixed(2),
      totalCollected:+(total-avail).toFixed(2),
      collected:+(total-avail).toFixed(2),
      byLevel,
      recentCommissions:ccAll(tx)
    }});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/referral/collect', auth, async (req,res) => {
  try {
    const {rows:[u]}=await db('SELECT pending_earnings,balance FROM users WHERE id=$1',[req.user.id]);
    const amount=parseFloat(u.pending_earnings);
    if (amount<=0) return res.status(400).json({success:false,message:'No earnings to collect'});
    await db('UPDATE users SET balance=balance+$1,pending_earnings=0 WHERE id=$2',[amount,req.user.id]);
    await db(`INSERT INTO transactions(user_id,type,amount,description) VALUES($1,'commission',$2,'Referral commission collected')`,[req.user.id,amount]);
    res.json({success:true,message:`$${amount.toFixed(2)} collected!`,data:{collected:amount,newBalance:parseFloat(u.balance)+amount}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Salary / Ambassador Rank (user-facing: check own progress, apply) ──────
app.get('/api/salary/progress', auth, async (req,res) => {
  try {
    const progress = await computeSalaryProgress(req.user.id);
    if (!progress || !progress.evaluation) return res.json({success:true,data:{noRanksConfigured:true}});
    const { rows: history } = await db(
      `SELECT rank_name, period, amount, created_at FROM salary_claims WHERE user_id=$1 AND status='approved' ORDER BY created_at DESC`,
      [req.user.id]);
    const personalPlan = LIVE_PLANS.find(p=>p.id===progress.personalPlanMin);
    res.json({success:true,data:{
      evaluation: progress.evaluation,
      personalPlanOk: progress.personalPlanOk,
      personalPlanMin: progress.personalPlanMin,
      personalPlanMinName: personalPlan ? personalPlan.name : progress.personalPlanMin,
      alreadyClaimedThisPeriod: progress.alreadyClaimedThisPeriod,
      alreadyAppliedThisPeriod: progress.alreadyAppliedThisPeriod,
      canApply: progress.canApply,
      currentRankOrder: progress.lastOrder,
      currentRankName: progress.currentRankName,
      history: ccAll(history),
    }});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/salary/apply', auth, async (req,res) => {
  try {
    const progress = await computeSalaryProgress(req.user.id);
    if (!progress || !progress.evaluation) return res.status(400).json({success:false,message:'Salary system is not configured yet'});
    if (!progress.personalPlanOk) {
      const p = LIVE_PLANS.find(pl=>pl.id===progress.personalPlanMin);
      return res.status(400).json({success:false,message:`You need to be on the ${p?p.name:progress.personalPlanMin} plan or higher yourself to apply for salary`});
    }
    if (progress.alreadyClaimedThisPeriod) return res.status(400).json({success:false,message:'You already received a salary payout this month'});
    if (progress.alreadyAppliedThisPeriod) return res.status(400).json({success:false,message:'You already applied this month — please wait for admin review'});
    if (!progress.evaluation.met) return res.status(400).json({success:false,message:'You do not currently meet the requirements for this rank yet'});
    const rank = progress.evaluation.rank;
    const memberIds = selectMembersForClaim(progress.availableMembers, rank);
    const { rows:[claim] } = await db(
      `INSERT INTO salary_claims(user_id, rank_key, rank_name, rank_order, amount, period, member_ids_used, status)
       VALUES($1,$2,$3,$4,$5,$6,$7,'pending') RETURNING *`,
      [req.user.id, rank.key, rank.name, rank.order, rank.amount, progress.currentPeriod, JSON.stringify(memberIds)]);
    await notif(req.user.id, 'system', 'Salary application submitted', `Your ${rank.name} salary application ($${rank.amount}) is pending admin review.`);
    res.json({success:true,message:`Application submitted for ${rank.name}. Awaiting admin approval.`,data:{claim:cc(claim)}});
  } catch(e){
    if (e.code === '23505') return res.status(400).json({success:false,message:'You already have a salary application for this month'});
    res.status(500).json({success:false,message:e.message});
  }
});


// ── Notifications ─────────────────────────────────────────────────────────
app.get('/api/notifications', auth, async (req,res) => {
  try {
    const {rows}=await db('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30',[req.user.id]);
    res.json({success:true,data:{notifications:ccAll(rows),unread:rows.filter(n=>!n.read).length}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});
app.patch('/api/notifications/:id/read', auth, async (req,res) => {
  await db('UPDATE notifications SET read=TRUE WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);
  res.json({success:true});
});
app.patch('/api/notifications/read-all', auth, async (req,res) => {
  await db('UPDATE notifications SET read=TRUE WHERE user_id=$1',[req.user.id]);
  res.json({success:true});
});

// ── Rewards ───────────────────────────────────────────────────────────────
app.get('/api/rewards/status', auth, async (req,res) => {
  try {
    const {rows}=await db('SELECT reward_id,claimed_at FROM reward_claims WHERE user_id=$1',[req.user.id]);
    const map={}; rows.forEach(r=>{map[r.reward_id]=r.claimed_at;});
    res.json({success:true,data:{rewards:REWARDS.map(cfg=>{
      const ca=map[cfg.id]; let ok=!ca,ni=null;
      if (ca&&cfg.cd){ const el=(Date.now()-new Date(ca))/3600000; ok=el>=cfg.cd; if(!ok) ni=Math.ceil(cfg.cd-el); }
      return {...cfg,available:ok,nextIn:ni,lastClaimed:ca||null};
    })}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

const claimReward = async (req,res,rewardId) => {
  try {
    const cfg=REWARDS.find(r=>r.id===rewardId);
    if (!cfg) return res.status(400).json({success:false,message:'Invalid reward'});
    const {rows}=await db('SELECT claimed_at FROM reward_claims WHERE user_id=$1 AND reward_id=$2',[req.user.id,rewardId]);
    const ex=rows[0];
    if (ex&&cfg.cd){ const el=(Date.now()-new Date(ex.claimed_at))/3600000; if(el<cfg.cd) return res.status(400).json({success:false,message:`Available in ${Math.ceil(cfg.cd-el)}h`}); await db('UPDATE reward_claims SET claimed_at=NOW() WHERE user_id=$1 AND reward_id=$2',[req.user.id,rewardId]); }
    else if (ex&&!cfg.cd) return res.status(400).json({success:false,message:'Already claimed'});
    else await db('INSERT INTO reward_claims(user_id,reward_id) VALUES($1,$2)',[req.user.id,rewardId]);
    await db('UPDATE users SET balance=balance+$1 WHERE id=$2',[cfg.amount,req.user.id]);
    await db(`INSERT INTO transactions(user_id,type,amount,description) VALUES($1,'bonus',$2,$3)`,[req.user.id,cfg.amount,cfg.name]);
    res.json({success:true,message:`${cfg.name} claimed! +$${cfg.amount}`,data:{reward:cfg,amount:cfg.amount}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
};

app.post('/api/rewards/checkin', auth, async (req,res) => {
  try {
    const today = new Date().toISOString().slice(0,10); // YYYY-MM-DD
    const dayOfWeek = new Date().getDay(); // 0=Sunday
    const isSunday  = dayOfWeek === 0;
    const amount    = isSunday ? 0.05 : 0.01;

    // Check already checked in today
    const {rows:ex} = await db(
      'SELECT id FROM checkin_log WHERE user_id=$1 AND checkin_date=$2',
      [req.user.id, today]
    );
    if (ex[0]) return res.status(400).json({success:false,message:'Already checked in today! Come back tomorrow.'});

    // Record check-in
    await db(
      'INSERT INTO checkin_log(user_id,checkin_date,amount,is_bonus) VALUES($1,$2,$3,$4)',
      [req.user.id, today, amount, isSunday]
    );
    // Credit balance
    await db('UPDATE users SET balance=balance+$1 WHERE id=$2',[amount,req.user.id]);
    await db(`INSERT INTO transactions(user_id,type,amount,description) VALUES($1,'bonus',$2,$3)`,
      [req.user.id, amount, isSunday ? 'Sunday Bonus Check-in 🎉' : 'Daily Check-in']);
    await notif(req.user.id,'bonus', isSunday ? 'Sunday Bonus! 🎉' : 'Daily Check-in',
      `+$${amount.toFixed(2)} credited to your balance`);

    res.json({success:true,
      message: isSunday ? `🎉 Sunday Bonus! +$${amount.toFixed(2)} credited!` : `✅ Check-in done! +$${amount.toFixed(2)} credited!`,
      data:{ amount, isSunday }
    });
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// Check-in weekly status
app.get('/api/rewards/checkin-status', auth, async (req,res) => {
  try {
    // Get last 7 days of check-ins
    const {rows} = await db(
      `SELECT checkin_date, amount, is_bonus FROM checkin_log
       WHERE user_id=$1 AND checkin_date >= CURRENT_DATE - INTERVAL '6 days'
       ORDER BY checkin_date ASC`,
      [req.user.id]
    );
    const today    = new Date().toISOString().slice(0,10);
    const checkedToday = rows.some(r => r.checkin_date?.toISOString?.()?.slice(0,10) === today ||
                                        String(r.checkin_date).slice(0,10) === today);
    // Build week data (Mon to Sun)
    const week = [];
    for (let i=6; i>=0; i--) {
      const d = new Date(); d.setDate(d.getDate()-i);
      const ds = d.toISOString().slice(0,10);
      const rec = rows.find(r=>String(r.checkin_date).slice(0,10)===ds);
      week.push({
        date: ds,
        day: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()],
        dayNum: d.getDate(),
        isToday: ds===today,
        isSunday: d.getDay()===0,
        checked: !!rec,
        amount: rec ? parseFloat(rec.amount) : (d.getDay()===0 ? 0.05 : 0.01),
        isBonus: rec ? rec.is_bonus : d.getDay()===0,
      });
    }
    // Streak
    let streak=0;
    const sorted=[...rows].sort((a,b)=>String(b.checkin_date).localeCompare(String(a.checkin_date)));
    for(let i=0;i<sorted.length;i++){
      const exp=new Date(); exp.setDate(exp.getDate()-i);
      if(String(sorted[i]?.checkin_date).slice(0,10)===exp.toISOString().slice(0,10)) streak++;
      else break;
    }
    res.json({success:true,data:{week,streak,checkedToday,totalEarned:rows.reduce((s,r)=>s+parseFloat(r.amount),0)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});
app.post('/api/rewards/claim', auth, (req,res) => claimReward(req,res,req.body.rewardId));

app.post('/api/rewards/lucky', auth, async (req,res) => {
  try {
    const prizes=[{l:'🎉 $1.00 USDT',a:1},{l:'🎊 $0.50 USDT',a:0.5},{l:'😢 Try Again',a:0},{l:'💰 $2.00 USDT',a:2},{l:'✨ $0.25 USDT',a:0.25}];
    const p=prizes[Math.floor(Math.random()*prizes.length)];
    if (p.a>0) {
      await db('UPDATE users SET balance=balance+$1 WHERE id=$2',[p.a,req.user.id]);
      await db(`INSERT INTO transactions(user_id,type,amount,description) VALUES($1,'bonus',$2,$3)`,[req.user.id,p.a,p.l]);
    }
    res.json({success:true,message:p.l,data:{prize:p}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Tasks (earn-by-completing-actions) ──────────────────────────────────────
// Two families of task, verified very differently:
//  - 'invite_count' / 'active_members': fully automatic — checked live against
//    this platform's own referral data, credited instantly, no review needed.
//  - 'telegram_channel' / 'telegram_group' / 'whatsapp_group': there is no way
//    to verify a specific user actually joined an external channel/group from
//    here (that would require them linking a Telegram account and the bot
//    checking membership, which doesn't exist in this app). These are
//    self-reported by the user and go into a review queue for an admin to
//    manually approve or reject before anything is credited.
const AUTO_TASK_TYPES   = ['invite_count','active_members'];
const REVIEW_TASK_TYPES = ['telegram_channel','telegram_group','whatsapp_group','external_link'];

app.get('/api/tasks', auth, async (req,res) => {
  try {
    const {rows:tasks} = await db(`SELECT * FROM tasks WHERE is_active=true ORDER BY sort_order ASC, created_at ASC`);
    const {rows:claims} = await db(`SELECT task_id,status FROM task_claims WHERE user_id=$1`,[req.user.id]);
    const claimMap = {}; claims.forEach(c=>{claimMap[c.task_id]=c.status;});

    // For auto-verifiable tasks, also compute live progress so the UI can show
    // e.g. "6 / 10 invited" even before the user has claimed it.
    const {rows:[inviteRow]} = await db(`SELECT COUNT(*)::int AS c FROM users WHERE referred_by=$1`,[req.user.id]);
    const {rows:[activeRow]} = await db(
      `SELECT COUNT(DISTINCT u.id)::int AS c FROM users u
       JOIN investments i ON i.user_id=u.id AND i.status='active'
       WHERE u.referred_by=$1`,[req.user.id]);
    const progress = { invite_count: inviteRow.c, active_members: activeRow.c };

    res.json({success:true,data:{tasks: tasks.map(t=>{
      const tc = cc(t);
      return { ...tc,
        status: claimMap[t.id] || 'available',
        currentCount: AUTO_TASK_TYPES.includes(t.type) ? progress[t.type] : null,
      };
    })}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/tasks/:id/claim', auth, async (req,res) => {
  try {
    const {rows:[task]} = await db('SELECT * FROM tasks WHERE id=$1 AND is_active=true',[req.params.id]);
    if (!task) return res.status(404).json({success:false,message:'Task not found or no longer available'});
    const {rows:[existing]} = await db('SELECT status FROM task_claims WHERE user_id=$1 AND task_id=$2',[req.user.id,task.id]);
    if (existing) {
      const msg = existing.status==='pending' ? 'This task is already awaiting review' :
                  existing.status==='approved' ? 'You already completed this task' :
                  'This task claim was rejected — contact support if you think that\'s wrong';
      return res.status(400).json({success:false,message:msg});
    }

    if (AUTO_TASK_TYPES.includes(task.type)) {
      let count = 0;
      if (task.type === 'invite_count') {
        const {rows:[r]} = await db(`SELECT COUNT(*)::int AS c FROM users WHERE referred_by=$1`,[req.user.id]);
        count = r.c;
      } else if (task.type === 'active_members') {
        const {rows:[r]} = await db(
          `SELECT COUNT(DISTINCT u.id)::int AS c FROM users u
           JOIN investments i ON i.user_id=u.id AND i.status='active'
           WHERE u.referred_by=$1`,[req.user.id]);
        count = r.c;
      }
      if (count < task.required_count) {
        return res.status(400).json({success:false,message:`Not yet — you're at ${count} / ${task.required_count}`});
      }
      await db(`INSERT INTO task_claims(user_id,task_id,status,reward_amount,reviewed_at) VALUES($1,$2,'approved',$3,NOW())`,
        [req.user.id, task.id, task.reward_amount]);
      await db('UPDATE users SET balance=balance+$1 WHERE id=$2',[task.reward_amount,req.user.id]);
      await db(`INSERT INTO transactions(user_id,type,amount,description) VALUES($1,'bonus',$2,$3)`,
        [req.user.id, task.reward_amount, `Task reward: ${task.title}`]);
      return res.json({success:true,message:`Task complete! +$${task.reward_amount}`,data:{status:'approved',amount:task.reward_amount}});
    }

    // Review-required task: self-reported, admin approves before anything is credited.
    await db(`INSERT INTO task_claims(user_id,task_id,status,reward_amount) VALUES($1,$2,'pending',$3)`,
      [req.user.id, task.id, task.reward_amount]);
    res.json({success:true,message:'Submitted — an admin will review and credit your reward shortly.',data:{status:'pending'}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Lottery: helpers ─────────────────────────────────────────────────────
const LOTTERY_TASK_TYPES = ['deposit_amount','team_deposit_amount','invite_count','active_members','invite_tier_count'];
const LOTTERY_MAX_PENDING = 3;

// Live progress for a lottery claim-task's requirement, for a given user.
// `meta` is used by invite_tier_count to specify which plan tier to count (bronze|silver|gold|elite).
async function lotteryTaskProgress(userId, reqType, meta) {
  if (reqType === 'deposit_amount') {
    const {rows:[r]} = await db(
      `SELECT COALESCE(SUM(amount),0)::float AS v FROM transactions WHERE user_id=$1 AND type='deposit'`,[userId]);
    return r.v;
  }
  if (reqType === 'team_deposit_amount') {
    const {rows:team} = await db(
      `WITH RECURSIVE t AS (
        SELECT id FROM users WHERE referred_by=$1
        UNION ALL
        SELECT u.id FROM users u INNER JOIN t ON u.referred_by=t.id
      ) SELECT id FROM t LIMIT 500`,[userId]);
    if (!team.length) return 0;
    const {rows:[r]} = await db(
      `SELECT COALESCE(SUM(amount),0)::float AS v FROM transactions WHERE user_id=ANY($1::uuid[]) AND type='deposit'`,
      [team.map(t=>t.id)]);
    return r.v;
  }
  if (reqType === 'invite_count') {
    const {rows:[r]} = await db(`SELECT COUNT(*)::int AS c FROM users WHERE referred_by=$1`,[userId]);
    return r.c;
  }
  if (reqType === 'active_members') {
    const {rows:[r]} = await db(
      `SELECT COUNT(DISTINCT u.id)::int AS c FROM users u
       JOIN investments i ON i.user_id=u.id AND i.status='active'
       WHERE u.referred_by=$1`,[userId]);
    return r.c;
  }
  if (reqType === 'invite_tier_count') {
    const {rows:[r]} = await db(
      `SELECT COUNT(*)::int AS c FROM users WHERE referred_by=$1 AND membership_level=$2`,[userId, meta||'silver']);
    return r.c;
  }
  return 0;
}

// Computes the "starting point" a new claim's progress should count from, so that:
// (1) a freshly-won claim never gets satisfied by activity that already existed
//     before the win (only new growth counts), and
// (2) if the user already holds other pending/claimed claims of the same
//     requirement type, this new claim starts counting only AFTER those claims'
//     targets are fully used up — no sharing/double-counting the same progress
//     across multiple claims of the same type.
async function computeLotteryClaimBaseline(userId, reqType, reqMeta) {
  const currentMetric = await lotteryTaskProgress(userId, reqType, reqMeta);
  const {rows} = await db(
    `SELECT baseline_progress, task_requirement_value FROM lottery_history
     WHERE user_id=$1 AND task_requirement_type=$2
       AND (($3::text IS NULL AND task_requirement_meta IS NULL) OR task_requirement_meta=$3)
       AND status IN ('pending','claimed')`,
    [userId, reqType, reqMeta||null]);
  let ceiling = 0;
  for (const r of rows) {
    const consumedUpTo = parseFloat(r.baseline_progress||0) + parseFloat(r.task_requirement_value||0);
    if (consumedUpTo > ceiling) ceiling = consumedUpTo;
  }
  return Math.max(currentMetric, ceiling);
}

// Weighted-random prize draw. Normalizes probabilities across active prizes
// so admin-entered weights don't need to sum to exactly 100.
function drawLotteryPrize(prizes) {
  const totalWeight = prizes.reduce((s,p)=>s+parseFloat(p.probability||0),0);
  if (totalWeight <= 0) return prizes[Math.floor(Math.random()*prizes.length)];
  let r = Math.random() * totalWeight;
  for (const p of prizes) {
    r -= parseFloat(p.probability||0);
    if (r <= 0) return p;
  }
  return prizes[prizes.length-1];
}

// Forfeit any of the user's pending claims from before the current week (weeks
// run Sunday→Saturday), so old unclaimed slots don't block them forever.
// Returns the still-pending (current-week) claims after cleanup.
async function cleanupAndGetPendingClaims(userId) {
  await db(
    `UPDATE lottery_history SET status='forfeited'
     WHERE user_id=$1 AND status='pending'
       AND created_at < (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int)`,
    [userId]);
  const {rows} = await db(
    `SELECT * FROM lottery_history WHERE user_id=$1 AND status='pending' ORDER BY created_at ASC`,
    [userId]);
  return rows;
}

// ── Lottery: user status (spin availability + pending claim slots + wheel prizes) ──
app.get('/api/lottery/status', auth, async (req,res) => {
  try {
    const today = new Date().toISOString().slice(0,10);
    let {rows:[state]} = await db('SELECT * FROM lottery_spin_state WHERE user_id=$1',[req.user.id]);
    if (!state) {
      const ins = await db('INSERT INTO lottery_spin_state(user_id) VALUES($1) RETURNING *',[req.user.id]);
      state = ins.rows[0];
    }
    const freeSpinAvailable = String(state.last_free_claim||'') !== today;
    const pending = await cleanupAndGetPendingClaims(req.user.id);
    const pendingWithProgress = await Promise.all(pending.map(async c=>{
      const rawMetric = await lotteryTaskProgress(req.user.id, c.task_requirement_type, c.task_requirement_meta);
      const progress = Math.max(0, rawMetric - parseFloat(c.baseline_progress||0));
      return { ...cc(c), progress, target: parseFloat(c.task_requirement_value) };
    }));
    const {rows:prizes} = await db(
      `SELECT id,label,amount,color,icon FROM lottery_prizes WHERE is_active=true ORDER BY sort_order ASC`);
    res.json({success:true,data:{
      freeSpinAvailable,
      pendingClaims: pendingWithProgress,
      pendingSlotsUsed: pending.length,
      pendingSlotsMax: LOTTERY_MAX_PENDING,
      canSpin: freeSpinAvailable && pending.length < LOTTERY_MAX_PENDING,
      prizes: ccAll(prizes),
    }});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Lottery: spin the wheel — a win locks a claim-task, it does NOT credit balance yet ──
app.post('/api/lottery/spin', auth, async (req,res) => {
  try {
    const today = new Date().toISOString().slice(0,10);
    let {rows:[state]} = await db('SELECT * FROM lottery_spin_state WHERE user_id=$1',[req.user.id]);
    if (!state) {
      const ins = await db('INSERT INTO lottery_spin_state(user_id) VALUES($1) RETURNING *',[req.user.id]);
      state = ins.rows[0];
    }
    const freeSpinAvailable = String(state.last_free_claim||'') !== today;
    if (!freeSpinAvailable) {
      return res.status(400).json({success:false,message:'No spin left today — come back tomorrow!'});
    }
    const pending = await cleanupAndGetPendingClaims(req.user.id);
    if (pending.length >= LOTTERY_MAX_PENDING) {
      return res.status(400).json({success:false,message:`Your ${LOTTERY_MAX_PENDING} claim slots are full — complete a pending task to free one up before spinning again.`});
    }

    const {rows:prizes} = await db(`SELECT * FROM lottery_prizes WHERE is_active=true`);
    if (!prizes.length) return res.status(400).json({success:false,message:'The lottery is temporarily unavailable — no prizes configured.'});
    const won = drawLotteryPrize(prizes);
    const amount = parseFloat(won.amount)||0;
    const hasTask = amount > 0 && won.task_requirement_type;
    const baseline = hasTask ? await computeLotteryClaimBaseline(req.user.id, won.task_requirement_type, won.task_requirement_meta) : 0;

    await db('UPDATE lottery_spin_state SET last_free_claim=$1, updated_at=NOW() WHERE user_id=$2',[today,req.user.id]);

    const {rows:[histRow]} = await db(
      `INSERT INTO lottery_history(user_id,prize_id,prize_label,amount,task_title,task_description,task_requirement_type,task_requirement_value,task_requirement_meta,baseline_progress,status)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.user.id, won.id, won.label, amount,
       hasTask?won.task_title:null, hasTask?won.task_description:'', hasTask?won.task_requirement_type:null, hasTask?won.task_requirement_value:null, hasTask?won.task_requirement_meta:null, baseline,
       hasTask ? 'pending' : 'no_task']);

    if (hasTask) {
      await notif(req.user.id,'bonus','🎰 You won a prize!',`You won ${won.label} — complete "${won.task_title}" to claim it. Check your Lottery page!`);
    }

    res.json({success:true,
      message: hasTask ? `🎉 You won ${won.label}! Complete the task to claim it.` : (amount>0 ? `🎉 You won ${won.label}!` : `${won.label} — better luck next spin!`),
      data:{
        prize: {id:won.id, label:won.label, amount, color:won.color, icon:won.icon},
        claim: hasTask ? cc(histRow) : null,
      }});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Lottery: claim a pending prize by completing its attached task ─────────
app.post('/api/lottery/claims/:id/claim', auth, async (req,res) => {
  try {
    const {rows:[claim]} = await db(`SELECT * FROM lottery_history WHERE id=$1 AND user_id=$2 AND status='pending'`,[req.params.id, req.user.id]);
    if (!claim) return res.status(404).json({success:false,message:'Claim not found, already claimed, or expired'});

    // Guard against a claim that's aged into a previous week (lazy forfeiture)
    const weekStart = new Date();
    weekStart.setUTCHours(0,0,0,0);
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
    if (new Date(claim.created_at) < weekStart) {
      await db(`UPDATE lottery_history SET status='forfeited' WHERE id=$1`,[claim.id]);
      return res.status(400).json({success:false,message:'This claim expired at the weekly reset — spin again for a new chance!'});
    }

    const rawMetric = await lotteryTaskProgress(req.user.id, claim.task_requirement_type, claim.task_requirement_meta);
    const progress = Math.max(0, rawMetric - parseFloat(claim.baseline_progress||0));
    if (progress < parseFloat(claim.task_requirement_value)) {
      return res.status(400).json({success:false,message:`Not yet — you're at ${progress} / ${claim.task_requirement_value}`});
    }

    const amount = parseFloat(claim.amount);
    await db(`UPDATE lottery_history SET status='claimed', claimed_at=NOW() WHERE id=$1`,[claim.id]);
    await db('UPDATE users SET balance=balance+$1 WHERE id=$2',[amount,req.user.id]);
    await db(`INSERT INTO transactions(user_id,type,amount,description) VALUES($1,'bonus',$2,$3)`,
      [req.user.id, amount, `Lottery claim: ${claim.prize_label}`]);
    await notif(req.user.id,'bonus','🎉 Lottery Prize Claimed!',`+$${amount.toFixed(2)} credited to your balance`);

    res.json({success:true,message:`🎉 +$${amount.toFixed(2)} credited to your balance!`,data:{amount}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Admin: Task management ──────────────────────────────────────────────────
app.get('/api/admin/tasks', adminAuth, requirePermission('tasks'), async (_,res) => {
  try {
    const {rows} = await db(`SELECT * FROM tasks ORDER BY sort_order ASC, created_at DESC`);
    res.json({success:true,data:{tasks:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/admin/tasks', adminAuth, requireRole('Owner','Super Admin'), async (req,res) => {
  try {
    const {title, description, type, rewardAmount, targetUrl, requiredCount, sortOrder} = req.body;
    if (!title || !type || rewardAmount===undefined) return res.status(400).json({success:false,message:'Title, type and reward amount are required'});
    if (![...AUTO_TASK_TYPES,...REVIEW_TASK_TYPES].includes(type)) return res.status(400).json({success:false,message:'Invalid task type'});
    if (AUTO_TASK_TYPES.includes(type) && !requiredCount) return res.status(400).json({success:false,message:'This task type needs a required count (e.g. invite 10 members)'});
    const {rows} = await db(
      `INSERT INTO tasks(title,description,type,reward_amount,target_url,required_count,requires_review,created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, description||'', type, rewardAmount, targetUrl||'', requiredCount||null, REVIEW_TASK_TYPES.includes(type), req.admin.id]);
    await logAdmin(req.admin.id, `Created task "${title}"`, {type, rewardAmount});
    res.status(201).json({success:true,message:'Task created — live immediately, no redeploy needed.',data:{task:cc(rows[0])}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/admin/tasks/:id', adminAuth, requireRole('Owner','Super Admin'), async (req,res) => {
  try {
    const {title, description, rewardAmount, targetUrl, requiredCount, isActive, sortOrder} = req.body;
    const {rows} = await db(
      `UPDATE tasks SET
        title=COALESCE($1,title), description=COALESCE($2,description),
        reward_amount=COALESCE($3,reward_amount), target_url=COALESCE($4,target_url),
        required_count=COALESCE($5,required_count), is_active=COALESCE($6,is_active),
        sort_order=COALESCE($7,sort_order)
       WHERE id=$8 RETURNING *`,
      [title,description,rewardAmount,targetUrl,requiredCount,isActive,sortOrder,req.params.id]);
    if (!rows[0]) return res.status(404).json({success:false,message:'Task not found'});
    await logAdmin(req.admin.id, `Updated task "${rows[0].title}"`);
    res.json({success:true,message:'Task updated',data:{task:cc(rows[0])}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.delete('/api/admin/tasks/:id', adminAuth, requireRole('Owner','Super Admin'), async (req,res) => {
  try {
    const {rows} = await db('DELETE FROM tasks WHERE id=$1 RETURNING title',[req.params.id]);
    if (!rows[0]) return res.status(404).json({success:false,message:'Task not found'});
    await logAdmin(req.admin.id, `Deleted task "${rows[0].title}"`);
    res.json({success:true,message:'Task deleted'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Admin: Task claim review queue (for self-reported join tasks) ──────────
app.get('/api/admin/task-claims', adminAuth, requirePermission('tasks'), async (req,res) => {
  try {
    const status = req.query.status || 'pending';
    const {rows} = await db(
      `SELECT tc.*, t.title AS task_title, t.type AS task_type, u.name AS user_name, u.email AS user_email
       FROM task_claims tc
       JOIN tasks t ON t.id=tc.task_id
       JOIN users u ON u.id=tc.user_id
       WHERE tc.status=$1 ORDER BY tc.created_at ASC`, [status]);
    res.json({success:true,data:{claims:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/admin/task-claims/:id/approve', adminAuth, requireRole('Owner','Super Admin'), async (req,res) => {
  try {
    const {rows:[claim]} = await db(`SELECT * FROM task_claims WHERE id=$1 AND status='pending'`,[req.params.id]);
    if (!claim) return res.status(404).json({success:false,message:'Pending claim not found'});
    await db(`UPDATE task_claims SET status='approved', reviewed_by=$1, reviewed_at=NOW() WHERE id=$2`,[req.admin.id, claim.id]);
    await db('UPDATE users SET balance=balance+$1 WHERE id=$2',[claim.reward_amount, claim.user_id]);
    const {rows:[task]} = await db('SELECT title FROM tasks WHERE id=$1',[claim.task_id]);
    await db(`INSERT INTO transactions(user_id,type,amount,description) VALUES($1,'bonus',$2,$3)`,
      [claim.user_id, claim.reward_amount, `Task reward: ${task?.title||'Task'}`]);
    await notif(claim.user_id,'task',`Task approved: ${task?.title||'Task'}`,`+$${claim.reward_amount} credited to your balance`);
    await logAdmin(req.admin.id, `Approved task claim for "${task?.title}"`, {claimId:claim.id});
    res.json({success:true,message:`Approved — $${claim.reward_amount} credited to the user.`});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/admin/task-claims/:id/reject', adminAuth, requireRole('Owner','Super Admin'), async (req,res) => {
  try {
    const {rows:[claim]} = await db(`SELECT * FROM task_claims WHERE id=$1 AND status='pending'`,[req.params.id]);
    if (!claim) return res.status(404).json({success:false,message:'Pending claim not found'});
    await db(`UPDATE task_claims SET status='rejected', reviewed_by=$1, reviewed_at=NOW() WHERE id=$2`,[req.admin.id, claim.id]);
    const {rows:[task]} = await db('SELECT title FROM tasks WHERE id=$1',[claim.task_id]);
    await notif(claim.user_id,'task',`Task not approved: ${task?.title||'Task'}`,`We couldn't verify this — you can try again or contact support.`);
    await logAdmin(req.admin.id, `Rejected task claim for "${task?.title}"`, {claimId:claim.id});
    res.json({success:true,message:'Claim rejected'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Admin: Lottery — Prizes (wheel segments, odds, and each one's claim-task) ──
app.get('/api/admin/lottery/prizes', adminAuth, requirePermission('lottery'), async (_,res) => {
  try {
    const {rows} = await db(`SELECT * FROM lottery_prizes ORDER BY sort_order ASC, created_at ASC`);
    const totalWeight = rows.filter(r=>r.is_active).reduce((s,r)=>s+parseFloat(r.probability||0),0);
    res.json({success:true,data:{prizes:ccAll(rows), totalActiveWeight: +totalWeight.toFixed(2)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/admin/lottery/prizes', adminAuth, requireRole('Owner','Super Admin'), async (req,res) => {
  try {
    const {label, amount, probability, color, icon, sortOrder,
           taskTitle, taskDescription, taskRequirementType, taskRequirementValue, taskRequirementMeta} = req.body;
    if (!label || amount===undefined || probability===undefined) return res.status(400).json({success:false,message:'Label, amount and probability are required'});
    if (parseFloat(amount) > 0) {
      if (!taskTitle || !taskRequirementType || taskRequirementValue===undefined)
        return res.status(400).json({success:false,message:'Prizes with an amount > 0 need a claim-task: title, requirement type and value'});
      if (!LOTTERY_TASK_TYPES.includes(taskRequirementType)) return res.status(400).json({success:false,message:'Invalid task requirement type'});
      if (taskRequirementType==='invite_tier_count' && !taskRequirementMeta) return res.status(400).json({success:false,message:'Pick which plan tier the invited user must reach'});
    }
    const {rows} = await db(
      `INSERT INTO lottery_prizes(label,amount,probability,color,icon,sort_order,task_title,task_description,task_requirement_type,task_requirement_value,task_requirement_meta)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [label, amount, probability, color||'#C9A227', icon||'🎁', sortOrder||0,
       parseFloat(amount)>0?taskTitle:null, parseFloat(amount)>0?(taskDescription||''):'',
       parseFloat(amount)>0?taskRequirementType:null, parseFloat(amount)>0?taskRequirementValue:null,
       parseFloat(amount)>0?(taskRequirementMeta||null):null]);
    await logAdmin(req.admin.id, `Created lottery prize "${label}"`, {amount,probability,taskRequirementType});
    res.status(201).json({success:true,message:'Prize added to the wheel',data:{prize:cc(rows[0])}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/admin/lottery/prizes/:id', adminAuth, requireRole('Owner','Super Admin'), async (req,res) => {
  try {
    const {label, amount, probability, color, icon, isActive, sortOrder,
           taskTitle, taskDescription, taskRequirementType, taskRequirementValue, taskRequirementMeta} = req.body;
    if (taskRequirementType!==undefined && taskRequirementType!==null && !LOTTERY_TASK_TYPES.includes(taskRequirementType))
      return res.status(400).json({success:false,message:'Invalid task requirement type'});
    const {rows} = await db(
      `UPDATE lottery_prizes SET
        label=COALESCE($1,label), amount=COALESCE($2,amount), probability=COALESCE($3,probability),
        color=COALESCE($4,color), icon=COALESCE($5,icon), is_active=COALESCE($6,is_active), sort_order=COALESCE($7,sort_order),
        task_title=COALESCE($8,task_title), task_description=COALESCE($9,task_description),
        task_requirement_type=COALESCE($10,task_requirement_type), task_requirement_value=COALESCE($11,task_requirement_value),
        task_requirement_meta=COALESCE($12,task_requirement_meta)
       WHERE id=$13 RETURNING *`,
      [label,amount,probability,color,icon,isActive,sortOrder,taskTitle,taskDescription,taskRequirementType,taskRequirementValue,taskRequirementMeta,req.params.id]);
    if (!rows[0]) return res.status(404).json({success:false,message:'Prize not found'});
    await logAdmin(req.admin.id, `Updated lottery prize "${rows[0].label}"`);
    res.json({success:true,message:'Prize updated',data:{prize:cc(rows[0])}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.delete('/api/admin/lottery/prizes/:id', adminAuth, requireRole('Owner','Super Admin'), async (req,res) => {
  try {
    const {rows} = await db('DELETE FROM lottery_prizes WHERE id=$1 RETURNING label',[req.params.id]);
    if (!rows[0]) return res.status(404).json({success:false,message:'Prize not found'});
    await logAdmin(req.admin.id, `Deleted lottery prize "${rows[0].label}"`);
    res.json({success:true,message:'Prize removed from the wheel'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Admin: Lottery — History & stats ─────────────────────────────────────────
app.get('/api/admin/lottery/history', adminAuth, requirePermission('lottery'), async (req,res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)||1);
    const limit = 20;
    const {rows} = await db(
      `SELECT lh.*, u.name AS user_name, u.email AS user_email
       FROM lottery_history lh JOIN users u ON u.id=lh.user_id
       ORDER BY lh.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, (page-1)*limit]);
    const {rows:[countRow]} = await db('SELECT COUNT(*)::int AS c FROM lottery_history');
    res.json({success:true,data:{history:ccAll(rows), total:countRow.c, page, pages:Math.ceil(countRow.c/limit)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/admin/lottery/stats', adminAuth, requirePermission('lottery'), async (_,res) => {
  try {
    const [totalR, todayR, payoutR, pendingR, topR] = await Promise.all([
      db(`SELECT COUNT(*)::int AS c FROM lottery_history`),
      db(`SELECT COUNT(*)::int AS c FROM lottery_history WHERE created_at::date = CURRENT_DATE`),
      db(`SELECT COALESCE(SUM(amount),0)::float AS t FROM lottery_history WHERE status='claimed'`),
      db(`SELECT COUNT(*)::int AS c, COALESCE(SUM(amount),0)::float AS t FROM lottery_history WHERE status='pending'`),
      db(`SELECT u.name, SUM(lh.amount)::float AS won FROM lottery_history lh JOIN users u ON u.id=lh.user_id
          WHERE lh.status='claimed' GROUP BY u.id,u.name ORDER BY won DESC LIMIT 5`),
    ]);
    res.json({success:true,data:{
      totalSpins: totalR.rows[0].c,
      spinsToday: todayR.rows[0].c,
      totalPaidOut: +payoutR.rows[0].t.toFixed(2),
      pendingClaimsCount: pendingR.rows[0].c,
      pendingClaimsValue: +pendingR.rows[0].t.toFixed(2),
      topWinners: topR.rows,
    }});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Stats ─────────────────────────────────────────────────────────────────
app.get('/api/stats/platform', async (_,res) => {
  try {
    const [uR,dR,wR,aiR]=await Promise.all([
      db('SELECT COUNT(*) FROM users'),
      db("SELECT COALESCE(SUM(amount),0) AS t FROM transactions WHERE type='deposit'"),
      db("SELECT COALESCE(SUM(amount),0) AS t FROM transactions WHERE type='withdrawal'"),
      db("SELECT COUNT(DISTINCT user_id) AS c FROM investments WHERE status='active'"),
    ]);
    const totalDep = parseFloat(dR.rows[0].t);
    res.json({success:true,data:{
      totalUsers      : parseInt(uR.rows[0].count),
      activeInvestors : parseInt(aiR.rows[0].c),
      totalDeposits   : +totalDep.toFixed(2),
      totalWithdrawals: +parseFloat(wR.rows[0].t).toFixed(2),
      totalInvestments: +totalDep.toFixed(2),
      uptimePct       : 99.8,
    }});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/stats/leaderboard', async (_,res) => {
  try {
    const {rows}=await db('SELECT name,membership_level,total_deposited,total_withdrawn FROM users ORDER BY total_deposited DESC LIMIT 10');
    res.json({success:true,data:{investors:rows.map(r=>({name:r.name,level:r.membership_level,amount:parseFloat(r.total_deposited)})),earners:[...rows].sort((a,b)=>b.total_withdrawn-a.total_withdrawn).map(r=>({name:r.name,amount:parseFloat(r.total_withdrawn)}))}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});



// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LIVE CHAT SUPPORT — Telegram Bot Integration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const TG_TOKEN   = process.env.TELEGRAM_BOT_TOKEN || '8850489978:AAFvF7bpKrovFwwjpMgGxw4v8WmJclbMGWI';
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID   || '6874570336';
const TG_API     = `https://api.telegram.org/bot${TG_TOKEN}`;

// Backups use a separate bot/chat by default, so daily backup files and past
// backup history don't clutter the same chat used for live support replies.
// Falls back to the support bot/chat if these aren't set, so nothing breaks
// for anyone who hasn't configured a second bot yet.
const BACKUP_TG_TOKEN   = process.env.BACKUP_TELEGRAM_BOT_TOKEN || TG_TOKEN;
const BACKUP_TG_CHAT_ID = process.env.BACKUP_TELEGRAM_CHAT_ID   || TG_CHAT_ID;
const BACKUP_TG_API     = `https://api.telegram.org/bot${BACKUP_TG_TOKEN}`;

let LAST_AUTO_BACKUP = null; // ISO timestamp of the last automatic daily backup sent to Telegram

// Send message to admin Telegram
const tgSend = async (text, opts={}) => {
  try {
    const body = { chat_id: TG_CHAT_ID, text, parse_mode: 'HTML', ...opts };
    const r = await fetch(`${TG_API}/sendMessage`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    const data = await r.json();
    return data.ok ? data.result : null;
  } catch(e) { console.error('TG send error:', e.message); return null; }
};

// Send a file (e.g. backup .json) to the backup Telegram bot/chat — used since
// Render has no persistent disk; Telegram chat history becomes the off-site
// backup storage. Uses BACKUP_TG_* so this never lands in the support chat.
const tgSendDocument = async (buffer, filename, caption='') => {
  try {
    const form = new FormData();
    form.append('chat_id', BACKUP_TG_CHAT_ID);
    if (caption) form.append('caption', caption);
    form.append('document', new Blob([buffer], {type:'application/json'}), filename);
    const r = await fetch(`${BACKUP_TG_API}/sendDocument`, { method:'POST', body: form });
    const data = await r.json();
    return data.ok ? data.result : null;
  } catch(e) { console.error('TG document send error:', e.message); return null; }
};

// User sends a message → saved to DB + forwarded to Telegram
app.post('/api/support/send', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({success:false,message:'Message required'});
    const text = message.trim().slice(0, 2000);

    // Save to DB
    const {rows:[msg]} = await db(
      `INSERT INTO support_messages(user_id,direction,message) VALUES($1,'user',$2) RETURNING *`,
      [req.user.id, text]
    );

    // Forward to Telegram
    const {rows:[u]} = await db('SELECT name,email,uid FROM users WHERE id=$1',[req.user.id]);

    // Count this user's messages (thread context)
    const {rows:[cnt]} = await db(
      `SELECT COUNT(*) as c FROM support_messages WHERE user_id=$1 AND direction='user'`,
      [req.user.id]
    );
    const msgNum = parseInt(cnt.c);

    // Clear formatted message with user identity always visible
    const tgText = [
      `👤 <b>${u.name}</b>  |  🆔 <code>${u.uid}</code>`,
      `📧 ${u.email}`,
      `─────────────────────`,
      `💬 ${text}`,
      `─────────────────────`,
      `<i>Hit Reply ↩ to respond to this user</i>`,
      `#uid_${req.user.id}`
    ].join('\n');

    const result = await tgSend(tgText, {
      reply_markup: { force_reply: true, selective: false }
    });

    const tgMsgId = result ? result.message_id : null;
    if (tgMsgId) await db('UPDATE support_messages SET tg_msg_id=$1 WHERE id=$2',[tgMsgId, msg.id]);

    res.json({success:true, data:{message: cc(msg)}});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
});

// Get conversation history
app.get('/api/support/messages', auth, async (req, res) => {
  try {
    const since = req.query.since || '1970-01-01';
    const {rows} = await db(
      `SELECT id,direction,message,created_at FROM support_messages
       WHERE user_id=$1 AND created_at > $2 ORDER BY created_at ASC LIMIT 100`,
      [req.user.id, since]
    );
    res.json({success:true, data:{messages: ccAll(rows)}});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
});

// Telegram webhook — admin replies here
app.post('/api/support/webhook', async (req, res) => {
  try {
    res.sendStatus(200);
    const update = req.body;
    if (!update.message) return;

    const msg  = update.message;
    const text = msg.text || '';


    // Method 1: Admin used /reply USER_ID message (legacy)
    if (text.startsWith('/reply ')) {
      const parts  = text.split(' ');
      const userId = parts[1];
      const reply  = parts.slice(2).join(' ').trim();
      if (userId && reply) {
        await db(`INSERT INTO support_messages(user_id,direction,message) VALUES($1,'admin',$2)`,[userId, reply]);
        await tgSend(`✅ Sent!`);
      }
      return;
    }

    // Method 2: Admin just hit Reply on a user message (ForceReply)
    if (msg.reply_to_message) {
      const repliedText  = msg.reply_to_message.text || '';
      const repliedMsgId = msg.reply_to_message.message_id;
      let userId = null;

      // Extract #uid_ from the replied message body (always embedded)
      const uidMatch = repliedText.match(/#uid_([a-f0-9\-]{36})/);
      if (uidMatch) userId = uidMatch[1];

      // Fallback: look up by tg_msg_id in DB
      if (!userId) {
        const {rows} = await db(
          `SELECT user_id FROM support_messages WHERE tg_msg_id=$1 LIMIT 1`,
          [repliedMsgId]
        );
        userId = rows[0]?.user_id || null;
      }

      if (userId && text.trim()) {
        await db(
          `INSERT INTO support_messages(user_id,direction,message) VALUES($1,'admin',$2)`,
          [userId, text.trim()]
        );
        await tgSend(`✅ Replied to user successfully!`);
      } else if (!userId) {
        await tgSend(`❌ Could not identify user. Please use:\n/reply USER_ID your message`);
      }
      return;
    }

  } catch(e) { console.error('Webhook error:', e.message); }
});

// Register Telegram webhook on startup
const registerTgWebhook = async (appUrl) => {
  try {
    const webhookUrl = `${appUrl}/api/support/webhook`;
    console.log('📡 Registering webhook:', webhookUrl);
    const r = await fetch(`${TG_API}/setWebhook`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ url: webhookUrl, drop_pending_updates: true })
    });
    const data = await r.json();
    console.log('✅ Telegram webhook result:', JSON.stringify(data));
    // Send startup notification to admin
    await tgSend(`🟢 QAVIX Support Bot is ONLINE\nWebhook: ${webhookUrl}\n\nWaiting for user messages...`);
  } catch(e) { console.error('Webhook register error:', e.message); }
};

// Manual webhook test route
app.get('/api/support/test', async (req,res) => {
  try {
    const result = await tgSend('🔔 Test message from QAVIX server!');
    res.json({success: !!result, tg_message_id: result});
  } catch(e) { res.json({success:false, error:e.message}); }
});

// Check webhook status
app.get('/api/support/webhook-info', async (req,res) => {
  try {
    const r = await fetch(`${TG_API}/getWebhookInfo`);
    const data = await r.json();
    res.json(data);
  } catch(e) { res.json({error:e.message}); }
});


// ═══════════════════════════════════════════════════════════════════════
//  ADMIN PANEL API — powers admin.html
// ═══════════════════════════════════════════════════════════════════════
const adminLimit = rateLimit({windowMs:15*60000, max:30});

// ── Admin auth ──────────────────────────────────────────────────────────
app.post('/api/admin/login', adminLimit, async (req,res) => {
  const ip = getClientIp(req);
  const deviceHash = crypto.createHash('sha256').update(ip + '|' + (req.headers['user-agent']||'')).digest('hex');
  try {
    const {email,password,otp,remember} = req.body;
    if (!email||!password) return res.status(400).json({success:false,message:'Email and password required'});
    const lcEmail = email.toLowerCase();
    const {rows:recentFails} = await db(
      `SELECT COUNT(*) c FROM admin_login_attempts WHERE email=$1 AND success=false AND created_at > NOW() - INTERVAL '15 minutes'`,
      [lcEmail]);
    if (parseInt(recentFails[0].c) >= 5) {
      await db('INSERT INTO admin_login_attempts(email,ip,success,reason) VALUES($1,$2,false,$3)',[lcEmail,ip,'Locked out']).catch(()=>{});
      return res.status(429).json({success:false,message:'Too many failed login attempts. Try again in 15 minutes.'});
    }

    // Admin login uses the SAME account + password as the regular QAVIX GLOBAL platform — no separate admin password.
    const {rows:[user]} = await db('SELECT * FROM users WHERE email=$1',[lcEmail]);
    if (!user||!await bcrypt.compare(password,user.password)) {
      await db('INSERT INTO admin_login_attempts(email,ip,success,reason) VALUES($1,$2,false,$3)',[lcEmail,ip,'Invalid credentials']).catch(()=>{});
      return res.status(401).json({success:false,message:'Invalid email or password'});
    }
    const {rows:[admin]} = await db('SELECT * FROM admins WHERE user_id=$1',[user.id]);
    if (!admin) {
      await db('INSERT INTO admin_login_attempts(email,ip,success,reason) VALUES($1,$2,false,$3)',[lcEmail,ip,'Not an admin']).catch(()=>{});
      return res.status(403).json({success:false,message:'This email is not registered as an admin'});
    }
    if (admin.status === 'pending') {
      await db('INSERT INTO admin_login_attempts(email,ip,success,reason) VALUES($1,$2,false,$3)',[lcEmail,ip,'Pending approval']).catch(()=>{});
      return res.status(403).json({success:false,message:'Your admin account is awaiting approval from a Super Admin'});
    }
    if (admin.status !== 'active') {
      await db('INSERT INTO admin_login_attempts(email,ip,success,reason) VALUES($1,$2,false,$3)',[lcEmail,ip,'Suspended']).catch(()=>{});
      return res.status(403).json({success:false,message:'This admin account is suspended'});
    }

    // ── 2FA / new-device verification ──────────────────────────────────
    // Triggers an email OTP step when: Admin 2FA is turned ON in Security settings,
    // OR this admin has never signed in from this device+IP combination before.
    const {rows:knownDevice} = await db(
      'SELECT 1 FROM admin_known_devices WHERE admin_id=$1 AND device_hash=$2',[admin.id, deviceHash]);
    const needsOtp = LIVE_SECURITY.adminTwoFactorEnabled || !knownDevice[0];

    if (needsOtp && !otp) {
      await issueOTP(user.id, user.email, 'admin_login', {adminId:admin.id, deviceHash});
      return res.json({success:true, requireOtp:true,
        message: knownDevice[0] ? 'Verification code sent to your email.' : 'New device detected — verification code sent to your email.'});
    }
    if (needsOtp && otp) {
      await verifyOTP(user.email, otp, 'admin_login');
      await db(
        `INSERT INTO admin_known_devices(admin_id,device_hash,label) VALUES($1,$2,$3)
         ON CONFLICT (admin_id,device_hash) DO UPDATE SET last_seen=NOW()`,
        [admin.id, deviceHash, (req.headers['user-agent']||'Unknown device').slice(0,150)]);
    }

    await db('INSERT INTO admin_login_attempts(email,ip,success) VALUES($1,$2,true)',[lcEmail,ip]).catch(()=>{});
    await db('UPDATE admins SET last_login=NOW() WHERE id=$1',[admin.id]);
    await logAdmin(admin.id, 'Logged in', {ip});
    const token = signAdmin(admin.id, !!remember);
    res.json({success:true,message:'Welcome back',data:{admin:{id:admin.id,name:user.name,email:user.email,role:admin.role,status:admin.status},token}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/admin/me', adminAuth, (req,res) => res.json({success:true,data:{admin:req.admin}}));

// ── Dashboard stats ───────────────────────────────────────────────────────
app.get('/api/admin/stats', adminAuth, async (_,res) => {
  try {
    const [users, deposits, withdrawals, investments, today] = await Promise.all([
      db(`SELECT COUNT(*) total, COUNT(*) FILTER (WHERE status='active') active, COUNT(*) FILTER (WHERE status='banned') banned, COUNT(*) FILTER (WHERE created_at::date=CURRENT_DATE) today FROM users`),
      db(`SELECT COALESCE(SUM(amount) FILTER (WHERE status='approved'),0) total, COUNT(*) FILTER (WHERE status='pending') pending, COALESCE(SUM(amount) FILTER (WHERE created_at::date=CURRENT_DATE AND status='approved'),0) today FROM transactions WHERE type='deposit'`),
      db(`SELECT COALESCE(SUM(amount) FILTER (WHERE status='approved'),0) total, COUNT(*) FILTER (WHERE status='pending') pending, COALESCE(SUM(amount) FILTER (WHERE created_at::date=CURRENT_DATE AND status='approved'),0) today FROM transactions WHERE type='withdrawal'`),
      db(`SELECT COUNT(*) FILTER (WHERE status='active') active, COALESCE(SUM(amount) FILTER (WHERE status='active'),0) capital FROM investments`),
      db(`SELECT COALESCE(SUM(amount),0) profit FROM transactions WHERE type='deposit' AND status='approved' AND created_at::date=CURRENT_DATE`)
    ]);
    res.json({success:true,data:{
      totalUsers: parseInt(users.rows[0].total), activeUsers: parseInt(users.rows[0].active), bannedUsers: parseInt(users.rows[0].banned), newUsersToday: parseInt(users.rows[0].today),
      totalDeposits: parseFloat(deposits.rows[0].total), pendingDeposits: parseInt(deposits.rows[0].pending), depositsToday: parseFloat(deposits.rows[0].today),
      totalWithdrawals: parseFloat(withdrawals.rows[0].total), pendingWithdrawals: parseInt(withdrawals.rows[0].pending), withdrawalsToday: parseFloat(withdrawals.rows[0].today),
      activeInvestments: parseInt(investments.rows[0].active), capitalDeployed: parseFloat(investments.rows[0].capital),
      revenueToday: parseFloat(today.rows[0].profit)
    }});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Global search ─────────────────────────────────────────────────────────
app.get('/api/admin/search', adminAuth, async (req, res) => {
  try {
    const q = (req.query.q||'').trim();
    if (q.length < 2) return res.json({success:true, data:{users:[], deposits:[], withdrawals:[]}});
    const like = `%${q}%`;
    const [userRows, depRows, witRows] = await Promise.all([
      db(`SELECT u.id, u.name, u.email, u.uid, u.status, u.membership_level
          FROM users u
          WHERE u.name ILIKE $1 OR u.email ILIKE $1 OR u.uid::text ILIKE $1
          LIMIT 5`, [like]),
      db(`SELECT t.id, t.amount, t.status, t.created_at, u.name as user_name, u.email as user_email
          FROM transactions t JOIN users u ON u.id=t.user_id
          WHERE t.type='deposit' AND (u.name ILIKE $1 OR u.email ILIKE $1 OR t.amount::text ILIKE $1)
          ORDER BY t.created_at DESC LIMIT 5`, [like]),
      db(`SELECT t.id, t.amount, t.status, t.created_at, u.name as user_name, u.email as user_email
          FROM transactions t JOIN users u ON u.id=t.user_id
          WHERE t.type='withdrawal' AND (u.name ILIKE $1 OR u.email ILIKE $1 OR t.amount::text ILIKE $1)
          ORDER BY t.created_at DESC LIMIT 5`, [like]),
    ]);
    res.json({success:true, data:{
      users: ccAll(userRows.rows),
      deposits: ccAll(depRows.rows),
      withdrawals: ccAll(witRows.rows),
    }});
  } catch(e){ res.status(500).json({success:false, message:e.message}); }
});

// ── Notification bell — actionable items needing admin attention ──────────
app.get('/api/admin/notifications', adminAuth, async (req,res) => {
  try {
    const [depRows, witRows, pendingAdminRows, unreadChatRows] = await Promise.all([
      db(`SELECT t.id, t.amount, t.created_at, u.name FROM transactions t JOIN users u ON u.id=t.user_id
          WHERE t.type='deposit' AND t.status='pending' ORDER BY t.created_at DESC LIMIT 5`),
      db(`SELECT t.id, t.amount, t.created_at, u.name FROM transactions t JOIN users u ON u.id=t.user_id
          WHERE t.type='withdrawal' AND t.status='pending' ORDER BY t.created_at DESC LIMIT 5`),
      db(`SELECT a.id, a.created_at, u.name FROM admins a JOIN users u ON u.id=a.user_id
          WHERE a.status='pending' ORDER BY a.created_at DESC LIMIT 5`),
      db(`SELECT user_id, COUNT(*) c, MAX(created_at) last FROM support_messages
          WHERE direction='user' AND read_by_admin=false GROUP BY user_id ORDER BY last DESC LIMIT 5`),
    ]);
    const [{rows:depCount}, {rows:witCount}, {rows:apprCount}, {rows:chatCount}] = await Promise.all([
      db(`SELECT COUNT(*) c FROM transactions WHERE type='deposit' AND status='pending'`),
      db(`SELECT COUNT(*) c FROM transactions WHERE type='withdrawal' AND status='pending'`),
      db(`SELECT COUNT(*) c FROM admins WHERE status='pending'`),
      db(`SELECT COUNT(*) c FROM support_messages WHERE direction='user' AND read_by_admin=false`),
    ]);
    const items = [
      ...depRows.rows.map(r=>({type:'deposit', page:'deposits', label:`New deposit request from ${r.name}`, sub:`$${parseFloat(r.amount).toLocaleString()}`, time:r.created_at})),
      ...witRows.rows.map(r=>({type:'withdrawal', page:'withdrawals', label:`New withdrawal request from ${r.name}`, sub:`$${parseFloat(r.amount).toLocaleString()}`, time:r.created_at})),
      ...pendingAdminRows.rows.map(r=>({type:'admin', page:'admins', label:`${r.name} is awaiting admin approval`, sub:'', time:r.created_at})),
      ...unreadChatRows.rows.map(r=>({type:'chat', page:'support', label:`${r.c} unread message(s) in support chat`, sub:'', time:r.last})),
    ].sort((a,b)=> new Date(b.time)-new Date(a.time)).slice(0,15);
    res.json({success:true,data:{
      counts: {
        pendingDeposits: parseInt(depCount[0].c), pendingWithdrawals: parseInt(witCount[0].c),
        pendingApprovals: parseInt(apprCount[0].c), unreadChats: parseInt(chatCount[0].c),
      },
      items: items.map(i=>({...i, time:i.time})),
    }});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});


app.get('/api/admin/users', adminAuth, requirePermission('users'), async (req,res) => {
  try {
    const page = parseInt(req.query.page)||1, limit = parseInt(req.query.limit)||20;
    const search = (req.query.search||'').trim();
    const status = req.query.status||'';
    const plan = (req.query.plan||'').toLowerCase();
    const dateRange = req.query.dateRange||'';
    let where = [], params = [];
    if (search) { params.push(`%${search}%`); where.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length} OR uid ILIKE $${params.length})`); }
    if (status) { params.push(status); where.push(`status=$${params.length}`); }
    if (plan) { params.push(plan); where.push(`membership_level=$${params.length}`); }
    if (dateRange === '7d') where.push(`created_at > NOW() - INTERVAL '7 days'`);
    if (dateRange === '30d') where.push(`created_at > NOW() - INTERVAL '30 days'`);
    if (dateRange === 'year') where.push(`created_at > date_trunc('year', NOW())`);
    const whereSql = where.length ? 'WHERE '+where.join(' AND ') : '';
    const {rows:countRows} = await db(`SELECT COUNT(*) FROM users ${whereSql}`, params);
    params.push(limit, (page-1)*limit);
    const {rows} = await db(
      `SELECT u.id, u.name, u.email, u.uid, u.balance, u.total_deposited, u.total_withdrawn,
              u.membership_level, u.status, u.created_at,
              r.name AS referrer_name, r.uid AS referrer_uid
       FROM users u LEFT JOIN users r ON r.id=u.referred_by
       ${whereSql} ORDER BY u.created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params);
    const {rows:statusRows} = await db(`SELECT COUNT(*) total, COUNT(*) FILTER (WHERE status='active') active,
      COUNT(*) FILTER (WHERE status='suspended') suspended, COUNT(*) FILTER (WHERE status='banned') banned FROM users`);
    res.json({success:true,data:{users:ccAll(rows),total:parseInt(countRows[0].count),page,limit,statusCounts:cc(statusRows[0])}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/admin/users/export', adminAuth, requirePermission('users'), async (req,res) => {
  try {
    const search = (req.query.search||'').trim();
    const status = req.query.status||'';
    const plan = (req.query.plan||'').toLowerCase();
    const dateRange = req.query.dateRange||'';
    let where = [], params = [];
    if (search) { params.push(`%${search}%`); where.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length} OR uid ILIKE $${params.length})`); }
    if (status) { params.push(status); where.push(`status=$${params.length}`); }
    if (plan) { params.push(plan); where.push(`membership_level=$${params.length}`); }
    if (dateRange === '7d') where.push(`created_at > NOW() - INTERVAL '7 days'`);
    if (dateRange === '30d') where.push(`created_at > NOW() - INTERVAL '30 days'`);
    if (dateRange === 'year') where.push(`created_at > date_trunc('year', NOW())`);
    const whereSql = where.length ? 'WHERE '+where.join(' AND ') : '';
    const {rows} = await db(
      `SELECT name,email,uid,balance,total_deposited,total_withdrawn,membership_level,status,created_at
       FROM users ${whereSql} ORDER BY created_at DESC`, params);
    const csv = toCsv(ccAll(rows), [
      {key:'name',label:'Name'}, {key:'email',label:'Email'}, {key:'uid',label:'UID'},
      {key:'balance',label:'Balance'}, {key:'totalDeposited',label:'Total Deposited'},
      {key:'totalWithdrawn',label:'Total Withdrawn'}, {key:'membershipLevel',label:'Membership'},
      {key:'status',label:'Status'}, {key:'createdAt',label:'Joined'},
    ]);
    await logAdmin(req.admin.id, 'Exported users CSV', {count:rows.length});
    sendCsv(res, `qavix-users-${new Date().toISOString().slice(0,10)}.csv`, csv);
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/admin/users/:id', adminAuth, requirePermission('users'), async (req,res) => {
  try {
    const {rows} = await db('SELECT * FROM users WHERE id=$1',[req.params.id]);
    if (!rows[0]) return res.status(404).json({success:false,message:'User not found'});
    const [investments, transactions, referrals] = await Promise.all([
      db('SELECT * FROM investments WHERE user_id=$1 ORDER BY created_at DESC',[req.params.id]),
      db('SELECT * FROM transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50',[req.params.id]),
      db('SELECT id,name,uid,membership_level,created_at FROM users WHERE referred_by=$1',[req.params.id]),
    ]);
    res.json({success:true,data:{
      user: safe(cc(rows[0])),
      investments: ccAll(investments.rows),
      transactions: ccAll(transactions.rows),
      referrals: ccAll(referrals.rows)
    }});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/admin/users/:id/wallet', adminAuth, requirePermission('users'), async (req,res) => {
  try {
    const {walletAddress, network} = req.body;
    if(!walletAddress) return res.status(400).json({success:false,message:'Wallet address required'});
    await db('UPDATE users SET wallet_address=$1, wallet_network=$2 WHERE id=$3',[walletAddress, network||'BEP20', req.params.id]);
    await logAdmin(req.admin.id, `Updated wallet address for user ${req.params.id}`, {network});
    res.json({success:true,message:'Wallet address updated'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/admin/users/:id/login-history', adminAuth, requirePermission('users'), async (req,res) => {
  try {
    const {rows} = await db(
      `SELECT * FROM login_history WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30`,
      [req.params.id]);
    res.json({success:true,data:{history:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/admin/users/:id/devices', adminAuth, requirePermission('users'), async (req,res) => {
  try {
    const {rows} = await db(
      `SELECT id, device, ip, created_at, last_active FROM user_sessions WHERE user_id=$1 ORDER BY COALESCE(last_active,created_at) DESC LIMIT 20`,
      [req.params.id]);
    res.json({success:true,data:{devices:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/admin/users/:id/team', adminAuth, requirePermission('users'), async (req,res) => {
  try {
    const {rows} = await db(`
      WITH RECURSIVE t AS (
        SELECT id,name,uid,membership_level,created_at,1 AS lvl FROM users WHERE referred_by=$1
        UNION ALL
        SELECT u.id,u.name,u.uid,u.membership_level,u.created_at,t.lvl+1
        FROM users u JOIN t ON u.referred_by=t.id WHERE t.lvl<10
      ) SELECT * FROM t ORDER BY lvl,created_at
    `,[req.params.id]);
    let activeSet = new Set();
    if(rows.length){
      const ids = rows.map(r=>r.id);
      const ph = ids.map((_,i)=>`$${i+1}`).join(',');
      const {rows:ar} = await db(`SELECT DISTINCT user_id FROM investments WHERE status='active' AND user_id IN (${ph})`,ids);
      ar.forEach(r=>activeSet.add(r.user_id));
    }
    const byLvl={};
    rows.forEach(r=>{
      if(!byLvl[r.lvl]) byLvl[r.lvl]=[];
      byLvl[r.lvl].push({id:r.id,name:r.name,uid:r.uid,level:r.membership_level,status:activeSet.has(r.id)?'active':'inactive',joinDate:r.created_at});
    });
    const levels = Object.entries(byLvl).map(([l,m])=>({level:parseInt(l),count:m.length,commission:LIVE_COMM[l]||0,members:m}));
    res.json({success:true,data:{totalMembers:rows.length,levels,commissionRates:LIVE_COMM}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/admin/users/:id/history', adminAuth, requirePermission('users'), async (req,res) => {
  try {
    const {rows} = await db(
      `SELECT * FROM transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`,
      [req.params.id]);
    res.json({success:true,data:{history:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});


app.put('/api/admin/users/:id/status', adminAuth, requirePermission('users'), async (req,res) => {
  try {
    const {status} = req.body; // active | suspended | banned
    if (!['active','suspended','banned'].includes(status)) return res.status(400).json({success:false,message:'Invalid status'});
    const {rows} = await db('UPDATE users SET status=$1 WHERE id=$2 RETURNING id,name,email,status',[status,req.params.id]);
    if (!rows[0]) return res.status(404).json({success:false,message:'User not found'});
    await notif(req.params.id,'system','Account '+status, status==='active' ? 'Your account has been reactivated.' : 'Your account has been '+status+'. Contact support for help.');
    await logAdmin(req.admin.id, `Set user ${rows[0].email} to ${status}`, {userId:req.params.id,status});
    res.json({success:true,message:`User is now ${status}`,data:{user:cc(rows[0])}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/admin/users/:id/balance', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const {type, amount, ledger, reason} = req.body; // type: 'credit' | 'debit'
    const amt = parseFloat(amount);
    if (!amt||amt<=0) return res.status(400).json({success:false,message:'Enter a valid amount'});
    const column = ledger === 'Referral Income' ? 'pending_earnings' : 'balance';
    const delta = type === 'debit' ? -amt : amt;
    const {rows} = await db(`UPDATE users SET ${column}=${column}+$1 WHERE id=$2 RETURNING id,name,email,balance,pending_earnings`,[delta,req.params.id]);
    if (!rows[0]) return res.status(404).json({success:false,message:'User not found'});
    await db(`INSERT INTO transactions(user_id,type,amount,status,description,reviewed_by,reviewed_at) VALUES($1,'admin_adjustment',$2,'approved',$3,$4,NOW())`,
      [req.params.id, delta, reason||`Manual ${type} by admin`, req.admin.id]);
    await notif(req.params.id,'system','Balance Updated',`Your ${ledger||'Main Balance'} was ${type==='debit'?'debited':'credited'} by $${amt}.`);
    await logAdmin(req.admin.id, `${type==='debit'?'Debited':'Credited'} $${amt} for ${rows[0].email}`, {userId:req.params.id,amount:amt,type,reason});
    res.json({success:true,message:`$${amt} ${type==='debit'?'debited from':'credited to'} the account`,data:{user:cc(rows[0])}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/admin/users/:id/reset-password', adminAuth, requirePermission('users'), async (req,res) => {
  try {
    const tempPass = Math.random().toString(36).slice(-10);
    const hash = await bcrypt.hash(tempPass, 12);
    const {rows} = await db('UPDATE users SET password=$1 WHERE id=$2 RETURNING email',[hash,req.params.id]);
    if (!rows[0]) return res.status(404).json({success:false,message:'User not found'});
    await notif(req.params.id,'system','Password Reset','An admin has reset your password. Please change it after logging in.');
    await logAdmin(req.admin.id, `Reset password for ${rows[0].email}`, {userId:req.params.id});
    // In production, email tempPass to the user instead of returning it.
    res.json({success:true,message:'Password reset',data:{temporaryPassword:tempPass}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── On-chain auto-deposit scanner status ──────────────────────────────────
app.get('/api/admin/onchain/status', adminAuth, requirePermission('deposits'), async (req,res) => {
  try {
    const enabled = !!(hdMaster && bscProvider);
    let latestBlock = null, lastCheckedBlock = null, lag = null, gasReserveAddress = null, gasReserveBnbBalance = null;
    if (enabled) {
      try { latestBlock = await bscProvider.getBlockNumber(); } catch(e){}
      const { rows } = await db(`SELECT value FROM settings WHERE key='onchain_scanner'`);
      lastCheckedBlock = rows[0]?.value?.lastCheckedBlock ?? null;
      if (latestBlock!=null && lastCheckedBlock!=null) lag = latestBlock - lastCheckedBlock;
      gasReserveAddress = deriveDepositAddress(GAS_RESERVE_INDEX);
      try { gasReserveBnbBalance = ethers.formatEther(await bscProvider.getBalance(gasReserveAddress)); } catch(e){}
    }
    const { rows:[{count:addressesGenerated}] } = await db(`SELECT COUNT(*)::int AS count FROM users WHERE deposit_address IS NOT NULL`);
    const { rows:[{count:autoDepositsCount}] } = await db(`SELECT COUNT(*)::int AS count FROM onchain_deposits`);
    const { rows:[{count:sweptCount}] } = await db(`SELECT COUNT(*)::int AS count FROM onchain_deposits WHERE swept=TRUE`);
    const { rows:[{count:unsweptCount}] } = await db(`SELECT COUNT(*)::int AS count FROM onchain_deposits WHERE swept=FALSE`);
    res.json({success:true,data:{
      enabled, latestBlock, lastCheckedBlock, lag, confirmationsRequired:DEPOSIT_CONFIRMATIONS,
      addressesGenerated, autoDepositsCount, contract:USDT_BEP20_CONTRACT, rpcUrl:BSC_RPC_URL,
      sweepEnabled: !!MAIN_COLLECTION_WALLET, mainCollectionWallet: MAIN_COLLECTION_WALLET,
      gasReserveAddress, gasReserveBnbBalance, gasTopupBnb: GAS_TOPUP_BNB,
      gasReserveLowThreshold: GAS_RESERVE_LOW_THRESHOLD,
      gasReserveLow: gasReserveBnbBalance!=null ? parseFloat(gasReserveBnbBalance) < GAS_RESERVE_LOW_THRESHOLD : null,
      sweptCount, unsweptCount,
    }});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Deposit moderation ────────────────────────────────────────────────────
app.get('/api/admin/deposits', adminAuth, requirePermission('deposits'), async (req,res) => {
  try {
    const page = parseInt(req.query.page)||1, limit = Math.min(parseInt(req.query.limit)||20, 100);
    const status = req.query.status||'';
    const params = ['deposit']; let extra = '';
    if (status) { params.push(status); extra = `AND t.status=$${params.length}`; }
    const {rows:countRows} = await db(`SELECT COUNT(*) FROM transactions t WHERE t.type=$1 ${extra}`, params);
    params.push(limit, (page-1)*limit);
    const {rows} = await db(
      `SELECT t.*, u.name, u.uid, u.email FROM transactions t JOIN users u ON u.id=t.user_id
       WHERE t.type=$1 ${extra} ORDER BY t.created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params);
    const {rows:kpi} = await db(`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE created_at > NOW() - INTERVAL '30 days' AND status='approved'),0) total_30d,
        COUNT(*) FILTER (WHERE status='pending') pending,
        COUNT(*) FILTER (WHERE status='approved' AND reviewed_at::date=CURRENT_DATE) approved_today,
        COUNT(*) FILTER (WHERE status='rejected' AND created_at > NOW() - INTERVAL '30 days') rejected_30d
      FROM transactions WHERE type='deposit'`);
    res.json({success:true,data:{deposits:ccAll(rows), total:parseInt(countRows[0].count), page, limit, kpis:cc(kpi[0])}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/admin/deposits/export', adminAuth, requirePermission('deposits'), async (req,res) => {
  try {
    const status = req.query.status||'';
    const params = ['deposit']; let extra = '';
    if (status) { params.push(status); extra = `AND t.status=$${params.length}`; }
    const {rows} = await db(
      `SELECT t.created_at, u.name, u.uid, u.email, t.amount, t.status, t.description FROM transactions t
       JOIN users u ON u.id=t.user_id WHERE t.type=$1 ${extra} ORDER BY t.created_at DESC`, params);
    const csv = toCsv(ccAll(rows), [
      {key:'createdAt',label:'Date'}, {key:'name',label:'User'}, {key:'uid',label:'UID'},
      {key:'email',label:'Email'}, {key:'amount',label:'Amount'}, {key:'status',label:'Status'}, {key:'description',label:'Description'},
    ]);
    await logAdmin(req.admin.id, 'Exported deposits CSV', {count:rows.length});
    sendCsv(res, `qavix-deposits-${new Date().toISOString().slice(0,10)}.csv`, csv);
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/admin/deposits/:id/approve', adminAuth, requirePermission('deposits'), async (req,res) => {
  try {
    // Atomically claim the pending deposit first. Only one concurrent request
    // (two admins, or a double-click) can flip status pending→approved; the
    // loser gets 0 rows back and never touches the user's balance — closes a
    // double-credit race that existed in the old select-then-update version.
    const {rows:[tx]} = await db(
      `UPDATE transactions SET status='approved', reviewed_by=$1, reviewed_at=NOW()
       WHERE id=$2 AND type='deposit' AND status='pending' RETURNING *`,
      [req.admin.id, req.params.id]);
    if (!tx) {
      const {rows:[existing]} = await db(`SELECT id FROM transactions WHERE id=$1 AND type='deposit'`,[req.params.id]);
      if (!existing) return res.status(404).json({success:false,message:'Deposit not found'});
      return res.status(400).json({success:false,message:'Only pending deposits can be approved'});
    }
    await db('UPDATE users SET balance=balance+$1, total_deposited=total_deposited+$1 WHERE id=$2',[tx.amount,tx.user_id]);
    await notif(tx.user_id,'deposit','Deposit Approved',`$${tx.amount} has been credited to your balance.`);
    await logAdmin(req.admin.id, `Approved deposit $${tx.amount}`, {depositId:req.params.id,userId:tx.user_id});
    res.json({success:true,message:'Deposit approved and credited'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/admin/deposits/:id/reject', adminAuth, requirePermission('deposits'), async (req,res) => {
  try {
    const {reason} = req.body;
    const {rows:[tx]} = await db(
      `UPDATE transactions SET status='rejected', reviewed_by=$1, reviewed_at=NOW(), reject_reason=$2
       WHERE id=$3 AND type='deposit' AND status='pending' RETURNING *`,
      [req.admin.id, reason||'', req.params.id]);
    if (!tx) {
      const {rows:[existing]} = await db(`SELECT id FROM transactions WHERE id=$1 AND type='deposit'`,[req.params.id]);
      if (!existing) return res.status(404).json({success:false,message:'Deposit not found'});
      return res.status(400).json({success:false,message:'Only pending deposits can be rejected'});
    }
    await notif(tx.user_id,'deposit','Deposit Rejected',reason||'Your deposit could not be confirmed. Contact support if you believe this is a mistake.');
    await logAdmin(req.admin.id, `Rejected deposit $${tx.amount}`, {depositId:req.params.id,userId:tx.user_id,reason});
    res.json({success:true,message:'Deposit rejected'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/admin/deposits/bulk-approve', adminAuth, requirePermission('deposits'), async (req,res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({success:false,message:'No deposits selected'});
    let approved = 0, skipped = 0;
    for (const id of ids) {
      const {rows:[tx]} = await db(
        `UPDATE transactions SET status='approved', reviewed_by=$1, reviewed_at=NOW()
         WHERE id=$2 AND type='deposit' AND status='pending' RETURNING *`,
        [req.admin.id, id]);
      if (!tx) { skipped++; continue; }
      await db('UPDATE users SET balance=balance+$1, total_deposited=total_deposited+$1 WHERE id=$2',[tx.amount,tx.user_id]);
      await notif(tx.user_id,'deposit','Deposit Approved',`$${tx.amount} has been credited to your balance.`);
      approved++;
    }
    await logAdmin(req.admin.id, `Bulk-approved ${approved} deposit(s)`, {ids, skipped});
    res.json({success:true,message:`${approved} deposit(s) approved${skipped?`, ${skipped} skipped (not pending)`:''}`,data:{approved,skipped}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Withdrawal moderation (USDT BEP20 only) ───────────────────────────────
app.get('/api/admin/withdrawals', adminAuth, requirePermission('withdrawals'), async (req,res) => {
  try {
    const page = parseInt(req.query.page)||1, limit = Math.min(parseInt(req.query.limit)||20, 100);
    const status = req.query.status||'';
    const params = ['withdrawal']; let extra = '';
    if (status) { params.push(status); extra = `AND t.status=$${params.length}`; }
    const {rows:countRows} = await db(`SELECT COUNT(*) FROM transactions t WHERE t.type=$1 ${extra}`, params);
    params.push(limit, (page-1)*limit);
    const {rows} = await db(
      `SELECT t.*, u.name, u.uid, u.email FROM transactions t JOIN users u ON u.id=t.user_id
       WHERE t.type=$1 ${extra} ORDER BY t.created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params);
    const {rows:kpi} = await db(`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE status='paid' AND created_at > NOW() - INTERVAL '30 days'),0) total_paid_30d,
        COUNT(*) FILTER (WHERE status='pending') pending,
        COUNT(*) FILTER (WHERE status='approved') awaiting_pay,
        COUNT(*) FILTER (WHERE status='rejected' AND created_at > NOW() - INTERVAL '30 days') rejected_30d
      FROM transactions WHERE type='withdrawal'`);
    res.json({success:true,data:{withdrawals:ccAll(rows), total:parseInt(countRows[0].count), page, limit, kpis:cc(kpi[0])}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/admin/withdrawals/export', adminAuth, requirePermission('withdrawals'), async (req,res) => {
  try {
    const status = req.query.status||'';
    const params = ['withdrawal']; let extra = '';
    if (status) { params.push(status); extra = `AND t.status=$${params.length}`; }
    const {rows} = await db(
      `SELECT t.created_at, u.name, u.uid, u.email, t.amount, t.status, t.description, t.meta FROM transactions t
       JOIN users u ON u.id=t.user_id WHERE t.type=$1 ${extra} ORDER BY t.created_at DESC`, params);
    const csv = toCsv(ccAll(rows).map(r=>({...r, walletAddress:r.meta?.walletAddress||'', network:r.meta?.network||'', fee:r.meta?.fee||''})), [
      {key:'createdAt',label:'Date'}, {key:'name',label:'User'}, {key:'uid',label:'UID'},
      {key:'email',label:'Email'}, {key:'amount',label:'Net Amount'}, {key:'fee',label:'Fee'},
      {key:'walletAddress',label:'Wallet Address'}, {key:'network',label:'Network'}, {key:'status',label:'Status'},
    ]);
    await logAdmin(req.admin.id, 'Exported withdrawals CSV', {count:rows.length});
    sendCsv(res, `qavix-withdrawals-${new Date().toISOString().slice(0,10)}.csv`, csv);
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/admin/withdrawals/:id/approve', adminAuth, requirePermission('withdrawals'), async (req,res) => {
  try {
    const {rows:[tx]} = await db(
      `UPDATE transactions SET status='approved', reviewed_by=$1, reviewed_at=NOW()
       WHERE id=$2 AND type='withdrawal' AND status='pending' RETURNING *`,
      [req.admin.id, req.params.id]);
    if (!tx) {
      const {rows:[existing]} = await db(`SELECT id FROM transactions WHERE id=$1 AND type='withdrawal'`,[req.params.id]);
      if (!existing) return res.status(404).json({success:false,message:'Withdrawal not found'});
      return res.status(400).json({success:false,message:'Only pending withdrawals can be approved'});
    }
    await notif(tx.user_id,'withdrawal','Withdrawal Approved','Your withdrawal has been approved and will be paid out shortly.');
    await logAdmin(req.admin.id, `Approved withdrawal $${tx.amount}`, {withdrawalId:req.params.id,userId:tx.user_id});
    res.json({success:true,message:'Withdrawal approved'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/admin/withdrawals/:id/reject', adminAuth, requirePermission('withdrawals'), async (req,res) => {
  try {
    const {reason, refund} = req.body;
    // Atomic claim first — critical here because the refund path moves money
    // back to the user; without this guard a double-click could refund twice.
    const {rows:[tx]} = await db(
      `UPDATE transactions SET status='rejected', reviewed_by=$1, reviewed_at=NOW(), reject_reason=$2
       WHERE id=$3 AND type='withdrawal' AND status='pending' RETURNING *`,
      [req.admin.id, reason||'', req.params.id]);
    if (!tx) {
      const {rows:[existing]} = await db(`SELECT id FROM transactions WHERE id=$1 AND type='withdrawal'`,[req.params.id]);
      if (!existing) return res.status(404).json({success:false,message:'Withdrawal not found'});
      return res.status(400).json({success:false,message:'Only pending withdrawals can be rejected'});
    }
    if (refund) {
      const meta = tx.meta || {};
      const gross = parseFloat(tx.amount) + parseFloat(meta.fee||0);
      await db('UPDATE users SET balance=balance+$1, total_withdrawn=total_withdrawn-$2 WHERE id=$3',[gross,tx.amount,tx.user_id]);
    }
    await notif(tx.user_id,'withdrawal','Withdrawal Rejected',(reason||'Your withdrawal request was rejected.') + (refund?' The amount has been refunded to your balance.':''));
    await logAdmin(req.admin.id, `Rejected withdrawal $${tx.amount}`, {withdrawalId:req.params.id,userId:tx.user_id,reason,refund:!!refund});
    res.json({success:true,message:'Withdrawal rejected'+(refund?' and refunded':'')});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/admin/withdrawals/:id/paid', adminAuth, requirePermission('withdrawals'), async (req,res) => {
  try {
    const {payoutTxnId} = req.body;
    if (!payoutTxnId) return res.status(400).json({success:false,message:'Payout transaction ID required'});
    const {rows:[existingTx]} = await db(`SELECT * FROM transactions WHERE id=$1 AND type='withdrawal'`,[req.params.id]);
    if (!existingTx) return res.status(404).json({success:false,message:'Withdrawal not found'});
    if (existingTx.status !== 'approved') return res.status(400).json({success:false,message:'Only approved withdrawals can be marked paid'});
    const meta = { ...(existingTx.meta||{}), payoutTxnId };
    const {rows:[tx]} = await db(
      `UPDATE transactions SET status='paid', meta=$1, reviewed_by=$2, reviewed_at=NOW()
       WHERE id=$3 AND status='approved' RETURNING *`,
      [JSON.stringify(meta), req.admin.id, req.params.id]);
    if (!tx) return res.status(400).json({success:false,message:'Only approved withdrawals can be marked paid'});
    await notif(tx.user_id,'withdrawal','Withdrawal Paid',`$${tx.amount} USDT (BEP20) has been sent. TXN: ${payoutTxnId}`);
    await logAdmin(req.admin.id, `Marked withdrawal paid $${tx.amount}`, {withdrawalId:req.params.id,userId:tx.user_id,payoutTxnId});
    res.json({success:true,message:'Withdrawal marked as paid'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/admin/withdrawals/bulk-approve', adminAuth, requirePermission('withdrawals'), async (req,res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({success:false,message:'No withdrawals selected'});
    let approved = 0, skipped = 0;
    for (const id of ids) {
      const {rows:[tx]} = await db(
        `UPDATE transactions SET status='approved', reviewed_by=$1, reviewed_at=NOW()
         WHERE id=$2 AND type='withdrawal' AND status='pending' RETURNING *`,
        [req.admin.id, id]);
      if (!tx) { skipped++; continue; }
      await notif(tx.user_id,'withdrawal','Withdrawal Approved','Your withdrawal has been approved and will be paid out shortly.');
      approved++;
    }
    await logAdmin(req.admin.id, `Bulk-approved ${approved} withdrawal(s)`, {ids, skipped});
    res.json({success:true,message:`${approved} withdrawal(s) approved${skipped?`, ${skipped} skipped (not pending)`:''}`,data:{approved,skipped}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Admin accounts (Super Admin only) ──────────────────────────────────────
// Admins are just platform users granted console access — there is no separate
// admin password. They always log in with the same email + password they use
// on the main QAVIX GLOBAL site.
app.get('/api/admin/admins', adminAuth, requireRole('Super Admin'), async (_,res) => {
  try {
    const {rows} = await db(
      `SELECT a.id, a.role, a.status, a.last_login, a.created_at, a.permissions, u.name, u.email FROM admins a
       JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC`);
    res.json({success:true,data:{admins:ccAll(rows), defaultPermissions:DEFAULT_ROLE_PERMISSIONS}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// Update a single admin's custom permissions (Super Admin only)
app.put('/api/admin/admins/:id/permissions', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const {permissions} = req.body;
    if (!permissions || typeof permissions !== 'object') return res.status(400).json({success:false,message:'Permissions object required'});
    const {rows:[a]} = await db(`UPDATE admins SET permissions=$1 WHERE id=$2 RETURNING id`,[JSON.stringify(permissions), req.params.id]);
    if (!a) return res.status(404).json({success:false,message:'Admin not found'});
    await logAdmin(req.admin.id, 'Updated admin permissions', {targetAdminId:req.params.id});
    res.json({success:true,message:'Permissions updated — takes effect on next request by that admin'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/admin/admins', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const {email, role} = req.body;
    if (!email) return res.status(400).json({success:false,message:'Email is required'});
    if (role === 'Owner') return res.status(400).json({success:false,message:'There can only be one Owner account — it cannot be assigned here.'});
    const {rows:[user]} = await db('SELECT id,name,email FROM users WHERE email=$1',[email.toLowerCase()]);
    if (!user) return res.status(400).json({success:false,message:'This email does not have a QAVIX GLOBAL account yet. They must register on the platform first.'});
    const {rows:exists} = await db('SELECT id FROM admins WHERE user_id=$1',[user.id]);
    if (exists[0]) return res.status(400).json({success:false,message:'This user is already an admin'});
    // New admins start as 'pending' — they cannot use admin access until a Super Admin approves them.
    const {rows} = await db(
      `INSERT INTO admins(user_id,role,status) VALUES($1,$2,'pending') RETURNING id,role,status,created_at`,
      [user.id, role||'Moderator']);
    await logAdmin(req.admin.id, `Granted admin access to ${user.email} (pending approval)`, {role});
    res.status(201).json({success:true,message:`${user.name} added — pending your approval. They will log in with their existing QAVIX GLOBAL password.`,
      data:{admin:{...cc(rows[0]), name:user.name, email:user.email}}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/admin/admins/:id/approve', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const {rows} = await db(
      `UPDATE admins SET status='active' WHERE id=$1 AND status='pending' RETURNING id,user_id,role,status`,[req.params.id]);
    if (!rows[0]) return res.status(404).json({success:false,message:'No pending admin found with that ID'});
    const {rows:[user]} = await db('SELECT name,email FROM users WHERE id=$1',[rows[0].user_id]);
    await logAdmin(req.admin.id, `Approved admin ${user.email}`, {adminId:req.params.id});
    res.json({success:true,message:user.email+' can now log in to the console',data:{admin:{...cc(rows[0]), name:user.name, email:user.email}}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/admin/admins/:id', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const {role, status} = req.body;
    if (role === 'Owner') return res.status(400).json({success:false,message:'There can only be one Owner account — it cannot be assigned here.'});
    const {rows:[target]} = await db('SELECT role FROM admins WHERE id=$1',[req.params.id]);
    if (!target) return res.status(404).json({success:false,message:'Admin not found'});
    if (target.role === 'Owner') return res.status(403).json({success:false,message:'The Owner account cannot be modified.'});
    const {rows} = await db(
      `UPDATE admins SET role=COALESCE($1,role), status=COALESCE($2,status) WHERE id=$3
       RETURNING id,user_id,role,status`, [role,status,req.params.id]);
    if (!rows[0]) return res.status(404).json({success:false,message:'Admin not found'});
    const {rows:[user]} = await db('SELECT name,email FROM users WHERE id=$1',[rows[0].user_id]);
    await logAdmin(req.admin.id, `Updated admin ${user.email}`, {role,status});
    res.json({success:true,message:'Admin updated',data:{admin:{...cc(rows[0]), name:user.name, email:user.email}}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.delete('/api/admin/admins/:id', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    if (req.params.id === req.admin.id) return res.status(400).json({success:false,message:'You cannot remove your own account'});
    const {rows:[target]} = await db('SELECT role FROM admins WHERE id=$1',[req.params.id]);
    if (!target) return res.status(404).json({success:false,message:'Admin not found'});
    if (target.role === 'Owner') return res.status(403).json({success:false,message:'The Owner account cannot be removed.'});
    const {rows} = await db('DELETE FROM admins WHERE id=$1 RETURNING user_id',[req.params.id]);
    if (!rows[0]) return res.status(404).json({success:false,message:'Admin not found'});
    await logAdmin(req.admin.id, `Removed admin access from user ${rows[0].user_id}`);
    res.json({success:true,message:'Admin access removed'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Plans (config-based, with real aggregated stats) ───────────────────────
app.get('/api/admin/plans', adminAuth, requirePermission('plans'), async (_,res) => {
  try {
    const {rows} = await db(
      `SELECT plan_id, COUNT(*) FILTER (WHERE status='active') active_count,
              COALESCE(SUM(amount) FILTER (WHERE status='active'),0) capital,
              COALESCE(SUM(earned_so_far),0) roi_paid
       FROM investments GROUP BY plan_id`);
    const byPlan = {}; rows.forEach(r=> byPlan[r.plan_id] = r);
    const plans = LIVE_PLANS.map(p => ({
      id:p.id, name:p.tier, dailyRate:p.rate*100, days:p.days, min:p.min, max:p.max,
      activeCount: parseInt(byPlan[p.id]?.active_count||0),
      capital: parseFloat(byPlan[p.id]?.capital||0),
      roiPaid: parseFloat(byPlan[p.id]?.roi_paid||0),
    }));
    res.json({success:true,data:{plans}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Investments (real records from the investments table) ─────────────────
app.get('/api/admin/investments', adminAuth, requirePermission('investments'), async (req,res) => {
  try {
    const page = parseInt(req.query.page)||1, limit = Math.min(parseInt(req.query.limit)||20, 100);
    const status = req.query.status||'';
    const search = (req.query.search||'').trim();
    let where = [], params = [];
    if (status) { params.push(status); where.push(`i.status=$${params.length}`); }
    if (search) { params.push(`%${search}%`); where.push(`(u.name ILIKE $${params.length} OR u.uid ILIKE $${params.length})`); }
    const whereSql = where.length ? 'WHERE '+where.join(' AND ') : '';
    const {rows:countRows} = await db(`SELECT COUNT(*) FROM investments i JOIN users u ON u.id=i.user_id ${whereSql}`, params);
    const listParams = [...params, limit, (page-1)*limit];
    const {rows} = await db(
      `SELECT i.*, u.name, u.uid FROM investments i JOIN users u ON u.id=i.user_id
       ${whereSql} ORDER BY i.created_at DESC LIMIT $${listParams.length-1} OFFSET $${listParams.length}`, listParams);
    const [{rows:kpi}] = await Promise.all([
      db(`SELECT COUNT(*) FILTER (WHERE status='active') active, COALESCE(SUM(amount) FILTER (WHERE status='active'),0) capital,
                 COALESCE(SUM(earned_so_far),0) roi_paid, COUNT(*) FILTER (WHERE status='completed') completed FROM investments`)
    ]);
    res.json({success:true,data:{investments:ccAll(rows), stats:cc(kpi[0]), total:parseInt(countRows[0].count), page, limit}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/admin/investments/export', adminAuth, requirePermission('investments'), async (req,res) => {
  try {
    const status = req.query.status||'';
    const search = (req.query.search||'').trim();
    let where = [], params = [];
    if (status) { params.push(status); where.push(`i.status=$${params.length}`); }
    if (search) { params.push(`%${search}%`); where.push(`(u.name ILIKE $${params.length} OR u.uid ILIKE $${params.length})`); }
    const whereSql = where.length ? 'WHERE '+where.join(' AND ') : '';
    const {rows} = await db(
      `SELECT i.created_at, u.name, u.uid, i.plan_name, i.amount, i.daily_income, i.earned_so_far, i.status, i.end_date
       FROM investments i JOIN users u ON u.id=i.user_id ${whereSql} ORDER BY i.created_at DESC`, params);
    const csv = toCsv(ccAll(rows), [
      {key:'createdAt',label:'Started'}, {key:'name',label:'User'}, {key:'uid',label:'UID'},
      {key:'planName',label:'Plan'}, {key:'amount',label:'Amount'}, {key:'dailyIncome',label:'Daily Income'},
      {key:'earnedSoFar',label:'Earned So Far'}, {key:'status',label:'Status'}, {key:'endDate',label:'End Date'},
    ]);
    await logAdmin(req.admin.id, 'Exported investments CSV', {count:rows.length});
    sendCsv(res, `qavix-investments-${new Date().toISOString().slice(0,10)}.csv`, csv);
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Referral system (real commission data from transactions) ───────────────
app.get('/api/admin/referrals/stats', adminAuth, async (_,res) => {
  try {
    const [refRow, networkRow, paidRow, topRow] = await Promise.all([
      db(`SELECT COUNT(DISTINCT referred_by) FROM users WHERE referred_by IS NOT NULL`),
      db(`SELECT COUNT(*) FROM users WHERE referred_by IS NOT NULL`),
      db(`SELECT COALESCE(SUM(amount),0) paid FROM transactions WHERE type='commission' AND created_at > NOW()-INTERVAL '30 days'`),
      db(`SELECT u.name, u.uid, SUM(t.amount) amount FROM transactions t JOIN users u ON u.id=t.user_id
          WHERE t.type='commission' AND t.created_at > NOW()-INTERVAL '30 days'
          GROUP BY u.id,u.name,u.uid ORDER BY amount DESC LIMIT 1`),
    ]);
    res.json({success:true,data:{
      totalReferrers: parseInt(refRow.rows[0].count)||0,
      totalNetwork: parseInt(networkRow.rows[0].count)||0,
      rewardsPaid30d: parseFloat(paidRow.rows[0].paid)||0,
      topEarner: topRow.rows[0] ? cc(topRow.rows[0]) : null,
    }});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/admin/referrals/levels', adminAuth, requirePermission('referral'), async (_,res) => {
  try {
    const {rows:paid} = await db(
      `SELECT (meta->>'lvl')::int AS level, COUNT(*) referrers, COALESCE(SUM(amount),0) paid
       FROM transactions WHERE type='commission' AND created_at > NOW()-INTERVAL '30 days'
       GROUP BY (meta->>'lvl')::int ORDER BY level`);
    const paidMap = {};
    paid.forEach(r=>{ paidMap[r.level]={referrers:parseInt(r.referrers),paid:parseFloat(r.paid)}; });

    // Count total members at each level via recursive query
    const {rows:memberRows} = await db(`
      WITH RECURSIVE t AS (
        SELECT id, referred_by, 1 AS lvl FROM users WHERE referred_by IS NOT NULL
        UNION ALL
        SELECT u.id, u.referred_by, t.lvl+1 FROM users u JOIN t ON u.referred_by=t.id WHERE t.lvl<10
      )
      SELECT lvl, COUNT(*) cnt FROM t GROUP BY lvl ORDER BY lvl
    `);
    const memberMap={};
    memberRows.forEach(r=>{ memberMap[parseInt(r.lvl)]=parseInt(r.cnt); });

    const COMM = LIVE_COMM||{'1':10,'2':5,'3':2,'4':1,'5':1,'6':1,'7':1,'8':1,'9':1,'10':1};
    const levels = Array.from({length:10},(_,i)=>i+1).map(l=>({
      level:l, commissionPct:COMM[l]||0,
      totalMembers:memberMap[l]||0,
      referrers:paidMap[l]?.referrers||0,
      paid30d:paidMap[l]?.paid||0,
    }));
    res.json({success:true,data:{levels}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/admin/referrals/earnings', adminAuth, requirePermission('referral'), async (req,res) => {
  try {
    const {rows} = await db(
      `SELECT t.*, u.name AS referrer_name, u.uid AS referrer_uid,
              ru.name AS referred_name, ru.uid AS referred_uid
       FROM transactions t
       JOIN users u ON u.id=t.user_id
       LEFT JOIN users ru ON ru.id=(t.meta->>'from')::uuid
       WHERE t.type='commission' AND t.meta->>'lvl' IS NOT NULL
       ORDER BY t.created_at DESC LIMIT 100`);
    res.json({success:true,data:{earnings:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/admin/referrals/network', adminAuth, requirePermission('referral'), async (req,res) => {
  try {
    const q = (req.query.q||'').trim();
    if(!q) return res.status(400).json({success:false,message:'Query required'});
    // find user
    const {rows:found} = await db(
      `SELECT id,name,email,uid,membership_level,referred_by,status FROM users
       WHERE name ILIKE $1 OR email ILIKE $1 OR uid ILIKE $1 LIMIT 1`,['%'+q+'%']);
    if(!found.length) return res.json({success:true,data:{user:null}});
    const user = cc(found[0]);

    // upline — walk referred_by chain up to 10 hops
    const upline=[];
    let curId = found[0].referred_by;
    for(let i=0;i<10&&curId;i++){
      const {rows:up} = await db(`SELECT id,name,email,uid,membership_level,referred_by FROM users WHERE id=$1`,[curId]);
      if(!up.length) break;
      upline.push(cc(up[0]));
      curId = up[0].referred_by;
    }

    // downline — recursive
    const {rows:downRows} = await db(`
      WITH RECURSIVE t AS (
        SELECT id,name,uid,membership_level,1 AS lvl FROM users WHERE referred_by=$1
        UNION ALL
        SELECT u.id,u.name,u.uid,u.membership_level,t.lvl+1 FROM users u JOIN t ON u.referred_by=t.id WHERE t.lvl<10
      ) SELECT * FROM t ORDER BY lvl,name
    `,[found[0].id]);

    let activeSet=new Set();
    if(downRows.length){
      const ids=downRows.map(r=>r.id);
      const ph=ids.map((_,i)=>`$${i+1}`).join(',');
      const {rows:ar}=await db(`SELECT DISTINCT user_id FROM investments WHERE status='active' AND user_id IN (${ph})`,ids);
      ar.forEach(r=>activeSet.add(r.user_id));
    }
    const byLvl={};
    downRows.forEach(r=>{
      if(!byLvl[r.lvl]) byLvl[r.lvl]=[];
      byLvl[r.lvl].push({id:r.id,name:r.name,uid:r.uid,level:r.membership_level,status:activeSet.has(r.id)?'active':'inactive'});
    });
    const COMM=LIVE_COMM||{'1':10,'2':5,'3':2,'4':1,'5':1,'6':1,'7':1,'8':1,'9':1,'10':1};
    const downline=Array.from({length:10},(_,i)=>i+1).map(l=>({
      level:l, commission:COMM[l]||0, count:(byLvl[l]||[]).length, members:byLvl[l]||[]
    }));
    res.json({success:true,data:{user,upline,downline}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});


// ── Reports (real SQL aggregation, no fabricated numbers) ──────────────────
const fmtNum = (n) => parseFloat(n||0);

// ── CSV export helper ────────────────────────────────────────────────────
const toCsv = (rows, columns) => {
  // columns: [{ key, label }] — key supports dot-path (e.g. 'user.name')
  const esc = (v) => {
    if (v===null||v===undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
  };
  const get = (obj, path) => path.split('.').reduce((o,k)=> (o==null?o:o[k]), obj);
  const header = columns.map(c=>esc(c.label)).join(',');
  const body = rows.map(r => columns.map(c=>esc(get(r,c.key))).join(',')).join('\n');
  return header + '\n' + body;
};
const sendCsv = (res, filename, csv) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
};
// ── Loss tracking (manual bad-debt entries feed the Loss Report) ───────────
app.get('/api/admin/loss-entries', adminAuth, requirePermission('reports'), async (req,res) => {
  try {
    const {rows} = await db(`SELECT l.*, u.name as created_by_name FROM loss_entries l
      LEFT JOIN admins a ON a.id=l.created_by
      LEFT JOIN users u ON u.id=a.user_id
      ORDER BY l.created_at DESC LIMIT 100`);
    res.json({success:true,data:{entries:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});
app.post('/api/admin/loss-entries', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const { amount, category, reason } = req.body;
    if (!amount||!reason) return res.status(400).json({success:false,message:'Amount and reason are required'});
    const {rows:[l]} = await db(
      `INSERT INTO loss_entries(amount,category,reason,created_by) VALUES($1,$2,$3,$4) RETURNING *`,
      [parseFloat(amount), category||'Bad Debt', reason.trim(), req.admin.id]);
    await logAdmin(req.admin.id, 'Logged a loss/bad-debt entry', {amount, category});
    res.json({success:true,message:'Loss entry recorded',data:{entry:cc(l)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});
app.delete('/api/admin/loss-entries/:id', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    await db('DELETE FROM loss_entries WHERE id=$1',[req.params.id]);
    await logAdmin(req.admin.id, 'Deleted a loss entry', {id:req.params.id});
    res.json({success:true,message:'Loss entry deleted'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/admin/reports/:type', adminAuth, requirePermission('reports'), async (req,res) => {
  try {
    const type = req.params.type;
    let result;

    if (type === 'daily' || type === 'weekly' || type === 'monthly') {
      const cfg = { daily:{unit:'day', count:7}, weekly:{unit:'week', count:8}, monthly:{unit:'month', count:6} }[type];
      const {rows} = await db(`
        WITH days AS (
          SELECT generate_series(date_trunc('${cfg.unit}', NOW()) - INTERVAL '${cfg.count-1} ${cfg.unit}', date_trunc('${cfg.unit}', NOW()), INTERVAL '1 ${cfg.unit}') AS bucket
        )
        SELECT to_char(d.bucket, 'YYYY-MM-DD') AS bucket,
          COALESCE((SELECT SUM(amount) FROM transactions WHERE type='deposit' AND status='approved' AND date_trunc('${cfg.unit}',created_at)=d.bucket),0) AS deposits,
          COALESCE((SELECT SUM(amount) FROM transactions WHERE type='withdrawal' AND status='paid' AND date_trunc('${cfg.unit}',created_at)=d.bucket),0) AS withdrawals,
          COALESCE((SELECT COUNT(*) FROM users WHERE date_trunc('${cfg.unit}',created_at)=d.bucket),0) AS new_users
        FROM days d ORDER BY d.bucket`);
      const dep = rows.reduce((a,r)=>a+fmtNum(r.deposits),0);
      const wit = rows.reduce((a,r)=>a+fmtNum(r.withdrawals),0);
      const newU = rows.reduce((a,r)=>a+parseInt(r.new_users),0);
      result = {
        kpis: [
          {label:`Total Deposits`, value:`$${dep.toLocaleString()}`},
          {label:`Total Withdrawals`, value:`$${wit.toLocaleString()}`},
          {label:`Net`, value:`$${(dep-wit).toLocaleString()}`, color: dep-wit>=0?'green':'red'},
          {label:`New Users`, value:newU},
        ],
        columns:['Period','Deposits','Withdrawals','Net','New Users'],
        rows: rows.map(r=>[r.bucket, `$${fmtNum(r.deposits).toLocaleString()}`, `$${fmtNum(r.withdrawals).toLocaleString()}`, `$${(fmtNum(r.deposits)-fmtNum(r.withdrawals)).toLocaleString()}`, r.new_users]),
      };

    } else if (type === 'profit' || type === 'loss') {
      const {rows} = await db(`
        WITH days AS (SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day')::date AS d)
        SELECT to_char(d.d,'YYYY-MM-DD') AS day,
          COALESCE((SELECT SUM(amount) FROM transactions WHERE type='deposit' AND status='approved' AND created_at::date=d.d),0) AS revenue,
          COALESCE((SELECT SUM(amount) FROM transactions WHERE type='commission' AND created_at::date=d.d),0) AS commission_paid,
          COALESCE((SELECT SUM(amount) FROM transactions WHERE type='deposit' AND status='rejected' AND created_at::date=d.d),0) AS rejected_deposits,
          COALESCE((SELECT COUNT(*) FROM transactions WHERE type='withdrawal' AND status='rejected' AND created_at::date=d.d),0) AS rejected_withdrawals
        FROM days d ORDER BY d.d`);
      if (type === 'profit') {
        const rev = rows.reduce((a,r)=>a+fmtNum(r.revenue),0);
        const comm = rows.reduce((a,r)=>a+fmtNum(r.commission_paid),0);
        result = {
          kpis: [
            {label:'Revenue (7d)', value:`$${rev.toLocaleString()}`},
            {label:'Commission Paid (7d)', value:`$${comm.toLocaleString()}`, color:'red'},
            {label:'Net Profit (7d)', value:`$${(rev-comm).toLocaleString()}`, color:'green'},
          ],
          columns:['Date','Revenue','Commission Paid','Net'],
          rows: rows.map(r=>[r.day, `$${fmtNum(r.revenue).toLocaleString()}`, `$${fmtNum(r.commission_paid).toLocaleString()}`, `$${(fmtNum(r.revenue)-fmtNum(r.commission_paid)).toLocaleString()}`]),
        };
      } else {
        const rejDep = rows.reduce((a,r)=>a+fmtNum(r.rejected_deposits),0);
        const rejWit = rows.reduce((a,r)=>a+parseInt(r.rejected_withdrawals),0);
        const {rows:lossRows} = await db(
          `SELECT to_char(created_at,'YYYY-MM-DD') AS day, SUM(amount) amt, COUNT(*) cnt FROM loss_entries
           WHERE created_at > NOW() - INTERVAL '7 days' GROUP BY day ORDER BY day`);
        const manualLoss = lossRows.reduce((a,r)=>a+fmtNum(r.amt),0);
        const lossByDay = {}; lossRows.forEach(r=> lossByDay[r.day]=fmtNum(r.amt));
        result = {
          kpis: [
            {label:'Rejected Deposits (7d)', value:`$${rejDep.toLocaleString()}`, color:'red'},
            {label:'Rejected Withdrawals (7d)', value:rejWit, color:'red'},
            {label:'Manual Bad Debt Logged (7d)', value:`$${manualLoss.toLocaleString()}`, color:'red'},
            {label:'Total Recorded Loss (7d)', value:`$${(rejDep+manualLoss).toLocaleString()}`, color:'red'},
          ],
          columns:['Date','Rejected Deposit Amount','Rejected Withdrawal Count','Manual Bad Debt'],
          rows: rows.map(r=>[r.day, `$${fmtNum(r.rejected_deposits).toLocaleString()}`, r.rejected_withdrawals, `$${(lossByDay[r.day]||0).toLocaleString()}`]),
          note: 'Manual Bad Debt comes from admin-logged loss entries (Reports → Loss → Log Loss Entry). Rejected counts are not the same as confirmed financial loss — they only indicate moderation activity.',
        };
      }

    } else if (type === 'investment') {
      const {rows} = await db(
        `SELECT plan_id, COUNT(*) FILTER (WHERE status='active') active_count,
                COALESCE(SUM(amount) FILTER (WHERE status='active'),0) capital,
                COALESCE(SUM(earned_so_far),0) roi_paid FROM investments GROUP BY plan_id`);
      const byPlan = {}; rows.forEach(r=> byPlan[r.plan_id]=r);
      const planRows = LIVE_PLANS.map(p => [p.tier, byPlan[p.id]?.active_count||0, `$${fmtNum(byPlan[p.id]?.capital).toLocaleString()}`, `$${fmtNum(byPlan[p.id]?.roi_paid).toLocaleString()}`]);
      const totalCapital = rows.reduce((a,r)=>a+fmtNum(r.capital),0);
      const totalRoi = rows.reduce((a,r)=>a+fmtNum(r.roi_paid),0);
      result = {
        kpis: [
          {label:'Capital Deployed', value:`$${totalCapital.toLocaleString()}`},
          {label:'ROI Paid (all time)', value:`$${totalRoi.toLocaleString()}`, color:'green'},
        ],
        columns:['Plan','Active Count','Capital','ROI Paid'],
        rows: planRows,
      };

    } else if (type === 'deposit' || type === 'withdrawal') {
      const txType = type;
      const statusFilter = type==='deposit' ? "status='approved'" : "status='paid'";
      const {rows} = await db(`
        WITH days AS (SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day')::date AS d)
        SELECT to_char(d.d,'YYYY-MM-DD') AS day,
          COALESCE((SELECT COUNT(*) FROM transactions WHERE type='${txType}' AND ${statusFilter} AND created_at::date=d.d),0) AS cnt,
          COALESCE((SELECT SUM(amount) FROM transactions WHERE type='${txType}' AND ${statusFilter} AND created_at::date=d.d),0) AS total,
          COALESCE((SELECT SUM((meta->>'fee')::numeric) FROM transactions WHERE type='${txType}' AND ${statusFilter} AND created_at::date=d.d),0) AS fees
        FROM days d ORDER BY d.d`);
      const totalCount = rows.reduce((a,r)=>a+parseInt(r.cnt),0);
      const totalAmt = rows.reduce((a,r)=>a+fmtNum(r.total),0);
      const totalFees = rows.reduce((a,r)=>a+fmtNum(r.fees),0);
      result = type==='deposit' ? {
        kpis: [
          {label:'Total Deposits (7d)', value:totalCount},
          {label:'Total Volume (7d)', value:`$${totalAmt.toLocaleString()}`},
          {label:'Avg Deposit Size', value:`$${(totalCount?totalAmt/totalCount:0).toFixed(2)}`},
        ],
        columns:['Date','Count','Total Amount'],
        rows: rows.map(r=>[r.day, r.cnt, `$${fmtNum(r.total).toLocaleString()}`]),
      } : {
        kpis: [
          {label:'Total Withdrawals (7d)', value:totalCount},
          {label:'Total Paid (7d)', value:`$${totalAmt.toLocaleString()}`},
          {label:'Fees Collected (7d)', value:`$${totalFees.toLocaleString()}`, color:'green'},
        ],
        columns:['Date','Count','Total Amount','Fees Collected'],
        rows: rows.map(r=>[r.day, r.cnt, `$${fmtNum(r.total).toLocaleString()}`, `$${fmtNum(r.fees).toLocaleString()}`]),
      };

    } else if (type === 'user') {
      const {rows} = await db(`
        WITH days AS (SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day')::date AS d)
        SELECT to_char(d.d,'YYYY-MM-DD') AS day,
          COALESCE((SELECT COUNT(*) FROM users WHERE created_at::date=d.d),0) AS new_users,
          COALESCE((SELECT COUNT(*) FROM users WHERE status='banned' AND created_at::date<=d.d),0) AS banned_total
        FROM days d ORDER BY d.d`);
      const {rows:totalRows} = await db(`SELECT COUNT(*) total, COUNT(*) FILTER (WHERE status='active') active FROM users`);
      // Churn definition: account still 'active' status, hasn't logged in for 30+ days,
      // and has no currently-running investment plan (i.e. genuinely gone quiet, not just between plans).
      const {rows:churnRows} = await db(`
        SELECT COUNT(*) c FROM users u
        WHERE u.status='active' AND u.last_login < NOW() - INTERVAL '30 days'
        AND NOT EXISTS (SELECT 1 FROM investments i WHERE i.user_id=u.id AND i.status='active')`);
      const churned = parseInt(churnRows[0].c);
      const churnRate = totalRows[0].total>0 ? (churned/parseInt(totalRows[0].total)*100).toFixed(1) : '0.0';
      result = {
        kpis: [
          {label:'Total Users', value:parseInt(totalRows[0].total)},
          {label:'Active Users', value:parseInt(totalRows[0].active)},
          {label:'New Users (7d)', value: rows.reduce((a,r)=>a+parseInt(r.new_users),0), color:'green'},
          {label:'Churned Users', value: churned, color:'red'},
          {label:'Churn Rate', value: `${churnRate}%`, color:'red'},
        ],
        columns:['Date','New Users'],
        rows: rows.map(r=>[r.day, r.new_users]),
        note: 'Churned = account still active, no login in 30+ days, and no currently running investment plan.',
      };

    } else if (type === 'referral') {
      const {rows} = await db(
        `SELECT (meta->>'lvl')::int AS level, COUNT(*) referrers, COALESCE(SUM(amount),0) paid
         FROM transactions WHERE type='commission' AND created_at > NOW() - INTERVAL '30 days'
         GROUP BY (meta->>'lvl')::int ORDER BY level`);
      const byLevel = {}; rows.forEach(r=> byLevel[r.level]=r);
      const levelRows = Object.entries(LIVE_COMM).map(([lvl,pct]) => [`L${lvl}`, `${pct}%`, byLevel[lvl]?.referrers||0, `$${fmtNum(byLevel[lvl]?.paid).toLocaleString()}`]);
      const totalPaid = rows.reduce((a,r)=>a+fmtNum(r.paid),0);
      // Average network depth: walk the referred_by chain for every user with a referrer.
      const {rows:depthRows} = await db(`
        WITH RECURSIVE chain AS (
          SELECT id, referred_by, 1 AS depth FROM users WHERE referred_by IS NULL
          UNION ALL
          SELECT u.id, u.referred_by, c.depth+1 FROM users u JOIN chain c ON u.referred_by = c.id
        )
        SELECT COALESCE(AVG(depth),0) avg_depth, COALESCE(MAX(depth),0) max_depth FROM chain WHERE depth > 1`);
      result = {
        kpis: [
          {label:'Commission Paid (30d)', value:`$${totalPaid.toLocaleString()}`, color:'green'},
          {label:'Avg Network Depth', value: parseFloat(depthRows[0].avg_depth).toFixed(1)},
          {label:'Deepest Chain', value: depthRows[0].max_depth},
        ],
        columns:['Level','Commission %','Referrers (30d)','Paid (30d)'],
        rows: levelRows,
      };

    } else {
      return res.status(404).json({success:false,message:'Unknown report type'});
    }

    res.json({success:true,data:result});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Settings (real DB-backed config, drives live business logic) ───────────
const saveSetting = async (key, value, adminId) => {
  await db(`INSERT INTO settings(key,value,updated_by) VALUES($1,$2,$3)
            ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW(), updated_by=$3`, [key, JSON.stringify(value), adminId]);
};

app.get('/api/admin/settings', adminAuth, requirePermission('settings'), async (_,res) => {
  res.json({success:true,data:{
    plans: LIVE_PLANS, commission: LIVE_COMM, payment: LIVE_PAYMENT,
    referral: LIVE_REFERRAL, maintenance: LIVE_MAINTENANCE, security: LIVE_SECURITY,
    general: LIVE_GENERAL,
    emailSender: LIVE_EMAIL_SENDER,
    otp: LIVE_OTP,
    salaryRanks: LIVE_SALARY_RANKS,
    salarySettings: LIVE_SALARY_SETTINGS,
  }});
});

app.put('/api/admin/settings/plans', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const { planId, rate, days, min, max, status, color, emoji, description } = req.body;
    const plan = LIVE_PLANS.find(p=>p.id===planId);
    if (!plan) return res.status(404).json({success:false,message:'Plan not found'});
    if (rate!==undefined) plan.rate = parseFloat(rate);
    if (days!==undefined) plan.days = parseInt(days);
    if (min!==undefined)  plan.min = parseFloat(min);
    if (max!==undefined)  plan.max = parseFloat(max);
    if (status!==undefined) plan.status = status;
    if (color!==undefined) plan.color = color;
    if (emoji!==undefined) plan.emoji = emoji;
    if (description!==undefined) plan.description = description;
    await saveSetting('plans', LIVE_PLANS, req.admin.id);
    await logAdmin(req.admin.id, `Updated ${plan.tier} plan settings`, {planId, rate, days, min, max, status, color});
    res.json({success:true,message:`${plan.tier} plan updated`,data:{plans:LIVE_PLANS}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/admin/settings/plans', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const { tier, emoji, rate, days, min, max, description, color } = req.body;
    if (!tier || rate===undefined || days===undefined || min===undefined || max===undefined) {
      return res.status(400).json({success:false,message:'Tier, rate, days, min and max are required'});
    }
    let id = tier.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
    if (!id) return res.status(400).json({success:false,message:'Invalid tier name'});
    if (LIVE_PLANS.find(p=>p.id===id)) return res.status(400).json({success:false,message:'A plan with this name already exists'});
    const plan = {
      id, name:`QAVIX ${tier.toUpperCase()}`, tier, emoji: emoji||'⭐',
      rate: parseFloat(rate), days: parseInt(days), min: parseFloat(min), max: parseFloat(max),
      recommended:false, color: color||'#C9A227', description: description||'', status:'active',
    };
    LIVE_PLANS.push(plan);
    await saveSetting('plans', LIVE_PLANS, req.admin.id);
    await logAdmin(req.admin.id, `Created ${tier} plan`, {planId:id, rate, days, min, max, color});
    res.json({success:true,message:`${tier} plan created`,data:{plans:LIVE_PLANS}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.delete('/api/admin/settings/plans/:id', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const idx = LIVE_PLANS.findIndex(p=>p.id===req.params.id);
    if (idx===-1) return res.status(404).json({success:false,message:'Plan not found'});
    const [removed] = LIVE_PLANS.splice(idx,1);
    await saveSetting('plans', LIVE_PLANS, req.admin.id);
    await logAdmin(req.admin.id, `Deleted ${removed.tier} plan`, {planId:req.params.id});
    res.json({success:true,message:`${removed.tier} plan deleted`,data:{plans:LIVE_PLANS}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/admin/settings/salary-ranks', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const { name, order, l1Min, tierMins, amount } = req.body;
    if (!name || order===undefined || l1Min===undefined || amount===undefined) {
      return res.status(400).json({success:false,message:'Name, order, L1 minimum and amount are required'});
    }
    const orderNum = parseInt(order), l1MinNum = parseInt(l1Min), amountNum = parseFloat(amount);
    if (Number.isNaN(orderNum) || Number.isNaN(l1MinNum) || Number.isNaN(amountNum)) {
      return res.status(400).json({success:false,message:'Order, L1 minimum and amount must be valid numbers'});
    }
    let key = name.toLowerCase().trim().replace(/[^a-z0-9]+/g,'_').replace(/(^_|_$)/g,'');
    if (!key) return res.status(400).json({success:false,message:'Invalid rank name'});
    if (LIVE_SALARY_RANKS.find(r=>r.key===key)) return res.status(400).json({success:false,message:'A rank with this name already exists'});
    const rank = { key, name, order:orderNum, l1Min:l1MinNum, tierMins: tierMins||{}, amount:amountNum, active:true };
    LIVE_SALARY_RANKS.push(rank);
    await saveSetting('salary_ranks', LIVE_SALARY_RANKS, req.admin.id);
    await logAdmin(req.admin.id, `Created salary rank ${name}`, {key, order, l1Min, tierMins, amount});
    res.json({success:true,message:`${name} rank created`,data:{salaryRanks:LIVE_SALARY_RANKS}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/admin/settings/salary-ranks/:key', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const rank = LIVE_SALARY_RANKS.find(r=>r.key===req.params.key);
    if (!rank) return res.status(404).json({success:false,message:'Rank not found'});
    const { name, order, l1Min, tierMins, amount, active } = req.body;
    if (order!==undefined && Number.isNaN(parseInt(order))) return res.status(400).json({success:false,message:'Order must be a valid number'});
    if (l1Min!==undefined && Number.isNaN(parseInt(l1Min))) return res.status(400).json({success:false,message:'L1 minimum must be a valid number'});
    if (amount!==undefined && Number.isNaN(parseFloat(amount))) return res.status(400).json({success:false,message:'Amount must be a valid number'});
    if (name!==undefined) rank.name = name;
    if (order!==undefined) rank.order = parseInt(order);
    if (l1Min!==undefined) rank.l1Min = parseInt(l1Min);
    if (tierMins!==undefined) rank.tierMins = tierMins;
    if (amount!==undefined) rank.amount = parseFloat(amount);
    if (active!==undefined) rank.active = !!active;
    await saveSetting('salary_ranks', LIVE_SALARY_RANKS, req.admin.id);
    await logAdmin(req.admin.id, `Updated salary rank ${rank.name}`, {key:rank.key, name, order, l1Min, tierMins, amount, active});
    res.json({success:true,message:`${rank.name} updated`,data:{salaryRanks:LIVE_SALARY_RANKS}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.delete('/api/admin/settings/salary-ranks/:key', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const idx = LIVE_SALARY_RANKS.findIndex(r=>r.key===req.params.key);
    if (idx===-1) return res.status(404).json({success:false,message:'Rank not found'});
    const [removed] = LIVE_SALARY_RANKS.splice(idx,1);
    await saveSetting('salary_ranks', LIVE_SALARY_RANKS, req.admin.id);
    await logAdmin(req.admin.id, `Deleted salary rank ${removed.name}`, {key:removed.key});
    res.json({success:true,message:`${removed.name} deleted`,data:{salaryRanks:LIVE_SALARY_RANKS}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/admin/settings/salary', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const { personalPlanMin } = req.body;
    if (personalPlanMin !== undefined) {
      if (!LIVE_PLANS.some(p => p.id === personalPlanMin)) {
        return res.status(400).json({success:false,message:'That plan ID does not exist — pick one of the current plans'});
      }
      LIVE_SALARY_SETTINGS.personalPlanMin = personalPlanMin;
      await saveSetting('salary_settings', LIVE_SALARY_SETTINGS, req.admin.id);
    }
    await logAdmin(req.admin.id, 'Updated salary settings', {personalPlanMin});
    res.json({success:true,message:'Salary settings updated',data:{salarySettings:LIVE_SALARY_SETTINGS}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Salary Operations (candidate list, applications, breakdown, approve/reject, history) ─
app.get('/api/admin/salary/candidates', adminAuth, requirePermission('salary'), async (req,res) => {
  try {
    const { rows: referrers } = await db(`SELECT DISTINCT referred_by AS id FROM users WHERE referred_by IS NOT NULL`);
    const results = [];
    for (const r of referrers) {
      const progress = await computeSalaryProgress(r.id);
      // Anyone who already got paid or already has a pending application this
      // month belongs in the Applications tab / is done for the month, not here.
      if (!progress || !progress.evaluation || progress.alreadyClaimedThisPeriod || progress.alreadyAppliedThisPeriod) continue;
      const { evaluation } = progress;
      const pct = evaluation.l1Min ? Math.round((Math.min(evaluation.l1Have, evaluation.l1Min) / evaluation.l1Min) * 100) : 0;
      results.push({ userId:r.id, evaluation, eligible:progress.canApply, personalPlanOk:progress.personalPlanOk, completionPct:pct, lastOrder:progress.lastOrder });
    }
    const ids = results.map(r=>r.userId);
    let userMap = {};
    if (ids.length){
      const ph = ids.map((_,i)=>`$${i+1}`).join(',');
      const { rows:us } = await db(`SELECT id,name,uid,email FROM users WHERE id IN (${ph})`, ids);
      us.forEach(u=>userMap[u.id]=u);
    }
    const data = results
      .sort((a,b) => (b.eligible - a.eligible) || (b.completionPct - a.completionPct))
      .map(r => ({
        user: userMap[r.userId] ? cc(userMap[r.userId]) : null,
        targetRank: { key:r.evaluation.rank.key, name:r.evaluation.rank.name, order:r.evaluation.rank.order, amount:r.evaluation.rank.amount },
        l1Have: r.evaluation.l1Have, l1Min: r.evaluation.l1Min,
        tierProgress: r.evaluation.tierProgress,
        personalPlanOk: r.personalPlanOk,
        eligible: r.eligible, completionPct: r.completionPct, currentRankOrder: r.lastOrder,
      }));
    res.json({success:true,data:{candidates:data, personalPlanMin:LIVE_SALARY_SETTINGS.personalPlanMin}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/admin/salary/applications', adminAuth, requirePermission('salary'), async (req,res) => {
  try {
    const { rows } = await db(
      `SELECT sc.*, u.name AS user_name, u.uid AS user_uid FROM salary_claims sc
       JOIN users u ON u.id = sc.user_id WHERE sc.status='pending' ORDER BY sc.created_at ASC`);
    res.json({success:true,data:{applications:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/admin/salary/candidates/:userId', adminAuth, requirePermission('salary'), async (req,res) => {
  try {
    const progress = await computeSalaryProgress(req.params.userId);
    if (!progress || !progress.evaluation) return res.status(404).json({success:false,message:'No salary ranks configured'});
    const [{ rows: pastClaims }, { rows: pendingRows }] = await Promise.all([
      db(`SELECT rank_name, period, amount, member_ids_used, created_at FROM salary_claims WHERE user_id=$1 AND status='approved' ORDER BY created_at DESC`, [req.params.userId]),
      db(`SELECT id, rank_name, amount, created_at FROM salary_claims WHERE user_id=$1 AND period=$2 AND status='pending'`, [req.params.userId, progress.currentPeriod]),
    ]);
    const usedIds = new Set();
    pastClaims.forEach(c => (c.member_ids_used||[]).forEach(id=>usedIds.add(id)));
    const members = progress.activeMembers.map(m => ({
      id:m.id, name:m.name, uid:m.uid, tier:m.membership_level, joinDate:m.created_at, usedInPastClaim: usedIds.has(m.id)
    }));
    res.json({success:true,data:{
      evaluation: progress.evaluation, currentRankOrder: progress.lastOrder, currentRankName: progress.currentRankName,
      alreadyClaimedThisPeriod: progress.alreadyClaimedThisPeriod,
      alreadyAppliedThisPeriod: progress.alreadyAppliedThisPeriod,
      personalPlanOk: progress.personalPlanOk, personalPlanMin: progress.personalPlanMin,
      pendingApplication: pendingRows[0] ? cc(pendingRows[0]) : null,
      members, claimHistory: ccAll(pastClaims)
    }});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/admin/salary/claim/:userId', adminAuth, requirePermission('salary'), async (req,res) => {
  try {
    const progress = await computeSalaryProgress(req.params.userId);
    if (!progress || !progress.evaluation) return res.status(400).json({success:false,message:'No salary rank configured for this user'});
    if (progress.alreadyClaimedThisPeriod) return res.status(400).json({success:false,message:'This user has already received a salary payout this month'});
    if (!progress.personalPlanOk) return res.status(400).json({success:false,message:'User does not personally hold the required plan tier for salary eligibility'});
    if (!progress.evaluation.met) return res.status(400).json({success:false,message:'User does not currently meet the requirements for this rank'});
    const rank = progress.evaluation.rank;
    const memberIds = selectMembersForClaim(progress.availableMembers, rank);

    // Approve the user's own pending application if one exists for this month;
    // otherwise this is an admin-initiated approval with no prior application.
    const { rows: pending } = await db(
      `SELECT id FROM salary_claims WHERE user_id=$1 AND period=$2 AND status='pending'`,
      [req.params.userId, progress.currentPeriod]);

    let claim;
    if (pending.length){
      // Guarding with AND status='pending' + checking rowCount closes a real race:
      // without it, two concurrent approve clicks (or two admins) could both pass
      // the checks above, both update the same row, and both credit the balance —
      // a double payout. If someone else already processed it, rowCount is 0 and
      // we stop here before touching the user's balance.
      const { rows, rowCount } = await db(
        `UPDATE salary_claims SET status='approved', rank_key=$1, rank_name=$2, rank_order=$3, amount=$4,
           member_ids_used=$5, approved_by=$6, approved_at=NOW() WHERE id=$7 AND status='pending' RETURNING *`,
        [rank.key, rank.name, rank.order, rank.amount, JSON.stringify(memberIds), req.admin.id, pending[0].id]);
      if (rowCount === 0) return res.status(400).json({success:false,message:'This application was already processed (approved or rejected) by someone else'});
      claim = rows[0];
    } else {
      const { rows:[c] } = await db(
        `INSERT INTO salary_claims(user_id, rank_key, rank_name, rank_order, amount, period, member_ids_used, status, approved_by, approved_at)
         VALUES($1,$2,$3,$4,$5,$6,$7,'approved',$8,NOW()) RETURNING *`,
        [req.params.userId, rank.key, rank.name, rank.order, rank.amount, progress.currentPeriod, JSON.stringify(memberIds), req.admin.id]);
      claim = c;
    }
    await db('UPDATE users SET balance=balance+$1 WHERE id=$2', [rank.amount, req.params.userId]);
    await db(`INSERT INTO transactions(user_id,type,amount,status,description,meta) VALUES($1,'salary',$2,'completed',$3,$4)`,
      [req.params.userId, rank.amount, `${rank.name} salary — ${progress.currentPeriod}`, JSON.stringify({rankKey:rank.key, period:progress.currentPeriod})]);
    await notif(req.params.userId, 'bonus', `${rank.name} salary approved`, `Your $${rank.amount} ${rank.name} salary for ${progress.currentPeriod} has been credited to your balance.`);
    await logAdmin(req.admin.id, `Approved ${rank.name} salary for user ${req.params.userId}`, {amount:rank.amount, period:progress.currentPeriod, memberCount:memberIds.length});
    res.json({success:true,message:`${rank.name} salary of $${rank.amount} approved`,data:{claim:cc(claim)}});
  } catch(e){
    if (e.code === '23505') return res.status(400).json({success:false,message:'This user has already received a salary payout this month'});
    res.status(500).json({success:false,message:e.message});
  }
});

app.post('/api/admin/salary/reject/:userId', adminAuth, requirePermission('salary'), async (req,res) => {
  try {
    const currentPeriod = new Date().toISOString().slice(0,7);
    const { rows } = await db(
      `DELETE FROM salary_claims WHERE user_id=$1 AND period=$2 AND status='pending' RETURNING rank_name, amount`,
      [req.params.userId, currentPeriod]);
    if (!rows.length) return res.status(404).json({success:false,message:'No pending application found for this user this month'});
    await notif(req.params.userId, 'system', 'Salary application declined', `Your ${rows[0].rank_name} salary application for this month was not approved. You may re-apply once you meet the requirements.`);
    await logAdmin(req.admin.id, `Rejected salary application for user ${req.params.userId}`, {period:currentPeriod, rankName:rows[0].rank_name});
    res.json({success:true,message:'Application rejected — the user may re-apply this month'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/admin/salary/history', adminAuth, requirePermission('salary'), async (req,res) => {
  try {
    const page = parseInt(req.query.page)||1, limit=20, offset=(page-1)*limit;
    const { rows } = await db(
      `SELECT sc.*, u.name AS user_name, u.uid AS user_uid FROM salary_claims sc
       JOIN users u ON u.id = sc.user_id WHERE sc.status='approved' ORDER BY sc.created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
    const { rows:[{count}] } = await db(`SELECT COUNT(*)::int AS count FROM salary_claims WHERE status='approved'`);
    res.json({success:true,data:{history:ccAll(rows), total:count, page, pages:Math.ceil(count/limit)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/admin/settings/referral', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const { enabled, levels } = req.body; // levels: {1:10, 2:5, ...}
    if (enabled !== undefined) { LIVE_REFERRAL.enabled = !!enabled; await saveSetting('referral', LIVE_REFERRAL, req.admin.id); }
    if (levels) { LIVE_COMM = {...LIVE_COMM, ...levels}; await saveSetting('commission', LIVE_COMM, req.admin.id); }
    await logAdmin(req.admin.id, 'Updated referral settings', {enabled, levels});
    res.json({success:true,message:'Referral settings updated',data:{referral:LIVE_REFERRAL, commission:LIVE_COMM}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/admin/settings/payment', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const { depositMin, withdrawalMin, withdrawalMax, withdrawalFeePercent, depositAddress } = req.body;
    if (depositMin!==undefined) LIVE_PAYMENT.depositMin = parseFloat(depositMin);
    if (withdrawalMin!==undefined) LIVE_PAYMENT.withdrawalMin = parseFloat(withdrawalMin);
    if (withdrawalMax!==undefined) LIVE_PAYMENT.withdrawalMax = parseFloat(withdrawalMax);
    if (withdrawalFeePercent!==undefined) LIVE_PAYMENT.withdrawalFeePercent = parseFloat(withdrawalFeePercent);
    if (depositAddress!==undefined) LIVE_PAYMENT.depositAddress = String(depositAddress).trim();
    await saveSetting('payment', LIVE_PAYMENT, req.admin.id);
    await logAdmin(req.admin.id, 'Updated payment settings', req.body);
    res.json({success:true,message:'Payment settings updated',data:{payment:LIVE_PAYMENT}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/admin/settings/maintenance', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const { enabled, message } = req.body;
    if (enabled !== undefined) LIVE_MAINTENANCE.enabled = !!enabled;
    if (message) LIVE_MAINTENANCE.message = message;
    await saveSetting('maintenance', LIVE_MAINTENANCE, req.admin.id);
    await logAdmin(req.admin.id, `Maintenance mode ${LIVE_MAINTENANCE.enabled?'enabled':'disabled'}`);
    res.json({success:true,message:`Maintenance mode is now ${LIVE_MAINTENANCE.enabled?'ON':'OFF'}`,data:{maintenance:LIVE_MAINTENANCE}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Phase 2.5: General / SMTP / OTP settings ─────────────────────
app.put('/api/admin/settings/general', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const { siteName, supportEmail, timezone, language } = req.body;
    LIVE_GENERAL = { ...LIVE_GENERAL,
      ...(siteName!==undefined && {siteName}), ...(supportEmail!==undefined && {supportEmail}),
      ...(timezone!==undefined && {timezone}), ...(language!==undefined && {language}) };
    await saveSetting('general', LIVE_GENERAL, req.admin.id);
    await logAdmin(req.admin.id, 'Updated general settings');
    res.json({success:true,message:'General settings saved',data:{general:LIVE_GENERAL}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/admin/settings/email-sender', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const { fromName, fromEmail } = req.body;
    LIVE_EMAIL_SENDER = { ...LIVE_EMAIL_SENDER,
      ...(fromName!==undefined && {fromName}), ...(fromEmail!==undefined && {fromEmail}) };
    await saveSetting('smtp', LIVE_EMAIL_SENDER, req.admin.id);
    await logAdmin(req.admin.id, 'Updated email sender settings');
    res.json({success:true,message:'Email sender settings saved — applies to all future emails immediately',data:{emailSender:LIVE_EMAIL_SENDER}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/admin/settings/otp', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const { codeLength, loginExpiryMin, withdrawExpiryMin, registerExpiryMin, loginOtpEnabled, withdrawOtpEnabled } = req.body;
    LIVE_OTP = { ...LIVE_OTP,
      ...(codeLength!==undefined && {codeLength:Math.min(Math.max(parseInt(codeLength),4),8)}),
      ...(loginExpiryMin!==undefined && {loginExpiryMin:parseInt(loginExpiryMin)}),
      ...(withdrawExpiryMin!==undefined && {withdrawExpiryMin:parseInt(withdrawExpiryMin)}),
      ...(registerExpiryMin!==undefined && {registerExpiryMin:parseInt(registerExpiryMin)}),
      ...(loginOtpEnabled!==undefined && {loginOtpEnabled:!!loginOtpEnabled}),
      ...(withdrawOtpEnabled!==undefined && {withdrawOtpEnabled:!!withdrawOtpEnabled}) };
    await saveSetting('otp', LIVE_OTP, req.admin.id);
    await logAdmin(req.admin.id, 'Updated OTP settings');
    res.json({success:true,message:'OTP settings saved — takes effect immediately for new OTP requests',data:{otp:LIVE_OTP}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Admin activity logs ───────────────────────────────────────────────────
app.get('/api/admin/logs', adminAuth, requirePermission('logs'), async (req,res) => {
  try {
    const isExport = req.query.format === 'csv';
    const page = parseInt(req.query.page)||1;
    const limit = isExport ? 10000 : Math.min(parseInt(req.query.limit)||50, 200);
    const search = (req.query.search||'').trim();
    const adminId = req.query.adminId||'';
    let where = [], params = [];
    if (search) { params.push(`%${search}%`); where.push(`al.action ILIKE $${params.length}`); }
    if (adminId) { params.push(adminId); where.push(`al.admin_id=$${params.length}`); }
    const whereSql = where.length ? 'WHERE '+where.join(' AND ') : '';
    const {rows:countRows} = await db(`SELECT COUNT(*) FROM admin_logs al ${whereSql}`, params);
    params.push(limit, (page-1)*limit);
    const {rows} = await db(
      `SELECT al.*, u.name as admin_name, u.email as admin_email FROM admin_logs al
       LEFT JOIN admins a ON a.id=al.admin_id
       LEFT JOIN users u ON u.id=a.user_id
       ${whereSql} ORDER BY al.created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params);
    if (isExport) {
      const csv = toCsv(ccAll(rows), [
        {key:'adminName',label:'Admin'},{key:'adminEmail',label:'Email'},
        {key:'action',label:'Action'},{key:'createdAt',label:'Time'},
      ]);
      await logAdmin(req.admin.id, 'Exported activity logs CSV', {count:rows.length});
      return sendCsv(res, `qavix-activity-logs-${new Date().toISOString().slice(0,10)}.csv`, csv);
    }
    res.json({success:true,data:{logs:ccAll(rows), total:parseInt(countRows[0].count), page, limit}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Phase 3: Security — Failed login attempts ─────────────────────────────
app.get('/api/admin/security/failed-logins', adminAuth, requirePermission('security'), async (req,res) => {
  try {
    const {rows} = await db(
      `SELECT * FROM admin_login_attempts WHERE success=false ORDER BY created_at DESC LIMIT 100`);
    const {rows:summary} = await db(
      `SELECT email, COUNT(*) c, MAX(created_at) last FROM admin_login_attempts
       WHERE success=false AND created_at > NOW() - INTERVAL '24 hours' GROUP BY email ORDER BY c DESC LIMIT 10`);
    res.json({success:true,data:{attempts:ccAll(rows), topOffenders:ccAll(summary)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.delete('/api/admin/security/failed-logins', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    await db('DELETE FROM admin_login_attempts');
    await logAdmin(req.admin.id, 'Cleared failed login log');
    res.json({success:true,message:'Failed login log cleared'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Phase 3: Security — IP Whitelist ──────────────────────────────────────
app.get('/api/admin/security/ip-whitelist', adminAuth, requirePermission('security'), async (req,res) => {
  try {
    const {rows} = await db(
      `SELECT w.*, u.name as added_by_name FROM admin_ip_whitelist w
       LEFT JOIN admins a ON a.id=w.added_by
       LEFT JOIN users u ON u.id=a.user_id
       ORDER BY w.created_at DESC`);
    res.json({success:true,data:{
      enabled: LIVE_SECURITY.ipWhitelistEnabled,
      entries: ccAll(rows),
      yourIp: getClientIp(req),
    }});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/admin/security/ip-whitelist', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const { ip, label } = req.body;
    if (!ip) return res.status(400).json({success:false,message:'IP address is required'});
    const {rows} = await db(
      `INSERT INTO admin_ip_whitelist(ip_address,label,added_by) VALUES($1,$2,$3)
       ON CONFLICT (ip_address) DO UPDATE SET label=$2 RETURNING *`, [ip.trim(), label||'', req.admin.id]);
    await logAdmin(req.admin.id, 'Added IP to whitelist', {ip, label});
    res.json({success:true,message:'IP added to whitelist',data:{entry:cc(rows[0])}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.delete('/api/admin/security/ip-whitelist/:id', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    await db('DELETE FROM admin_ip_whitelist WHERE id=$1',[req.params.id]);
    await logAdmin(req.admin.id, 'Removed IP from whitelist', {id:req.params.id});
    res.json({success:true,message:'IP removed from whitelist'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/admin/security/ip-whitelist/toggle', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const { enabled } = req.body;
    // Safety net: when turning ON, auto-whitelist the requesting Super Admin's
    // current IP so they can never lock themselves out by mistake.
    if (enabled) {
      const myIp = getClientIp(req);
      await db(
        `INSERT INTO admin_ip_whitelist(ip_address,label,added_by) VALUES($1,'Auto-added (your IP at enable time)',$2)
         ON CONFLICT (ip_address) DO NOTHING`, [myIp, req.admin.id]);
    }
    LIVE_SECURITY.ipWhitelistEnabled = !!enabled;
    await saveSetting('security', LIVE_SECURITY, req.admin.id);
    await logAdmin(req.admin.id, `IP whitelist ${enabled?'enabled':'disabled'}`);
    res.json({success:true,message:`IP whitelist is now ${enabled?'ON':'OFF'}`,data:{security:LIVE_SECURITY}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── 2FA / Known Devices ─────────────────────────────────────────────────────
app.put('/api/admin/security/2fa/toggle', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const { enabled } = req.body;
    LIVE_SECURITY.adminTwoFactorEnabled = !!enabled;
    await saveSetting('security', LIVE_SECURITY, req.admin.id);
    await logAdmin(req.admin.id, `Admin 2FA ${enabled?'enabled':'disabled'}`);
    res.json({success:true,message:`Admin 2FA is now ${enabled?'ON':'OFF'}`,data:{security:LIVE_SECURITY}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/admin/security/devices', adminAuth, requirePermission('security'), async (req,res) => {
  try {
    const {rows} = await db(
      `SELECT d.*, u.name as admin_name, u.email as admin_email FROM admin_known_devices d
       JOIN admins a ON a.id=d.admin_id JOIN users u ON u.id=a.user_id
       ORDER BY d.last_seen DESC`);
    res.json({success:true,data:{devices:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.delete('/api/admin/security/devices/:id', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    await db('DELETE FROM admin_known_devices WHERE id=$1',[req.params.id]);
    await logAdmin(req.admin.id, 'Revoked a trusted device', {id:req.params.id});
    res.json({success:true,message:'Device revoked — that location will need to verify by email OTP again on next login'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Phase 4: Support Tickets / Live Chat (admin side) ─────────────────────
// One conversation per user — real aggregation off the existing support_messages table.
app.get('/api/admin/support/conversations', adminAuth, requirePermission('support'), async (req,res) => {
  try {
    const {rows} = await db(`
      SELECT u.id as user_id, u.name, u.email, u.uid,
             lm.message as last_message, lm.created_at as last_time, lm.direction as last_direction,
             COALESCE(uc.unread,0) as unread
      FROM (SELECT DISTINCT user_id FROM support_messages) du
      JOIN users u ON u.id = du.user_id
      JOIN LATERAL (
        SELECT message, created_at, direction FROM support_messages
        WHERE user_id = du.user_id ORDER BY created_at DESC LIMIT 1
      ) lm ON true
      LEFT JOIN (
        SELECT user_id, COUNT(*) as unread FROM support_messages
        WHERE direction='user' AND read_by_admin=false GROUP BY user_id
      ) uc ON uc.user_id = du.user_id
      ORDER BY lm.created_at DESC
    `);
    res.json({success:true,data:{conversations:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/admin/support/:userId/messages', adminAuth, async (req,res) => {
  try {
    const {rows} = await db(
      `SELECT id,direction,message,created_at FROM support_messages WHERE user_id=$1 ORDER BY created_at ASC LIMIT 300`,
      [req.params.userId]);
    await db(`UPDATE support_messages SET read_by_admin=true WHERE user_id=$1 AND direction='user' AND read_by_admin=false`,[req.params.userId]);
    res.json({success:true,data:{messages:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/admin/support/:userId/reply', adminAuth, requirePermission('support'), async (req,res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({success:false,message:'Message required'});
    const text = message.trim().slice(0, 2000);
    const {rows:[u]} = await db('SELECT name,uid FROM users WHERE id=$1',[req.params.userId]);
    if (!u) return res.status(404).json({success:false,message:'User not found'});

    const {rows:[msg]} = await db(
      `INSERT INTO support_messages(user_id,direction,message,read_by_admin) VALUES($1,'admin',$2,true) RETURNING *`,
      [req.params.userId, text]);

    // Mirror to Telegram so the admin's mobile thread stays in sync.
    tgSend(`💬 <b>Replied via Admin Panel</b>\n👤 ${u.name} (${u.uid})\n─────────────────────\n${text}`).catch(()=>{});

    await logAdmin(req.admin.id, `Replied to support chat`, {userId:req.params.userId, userName:u.name});
    res.json({success:true,message:'Reply sent',data:{message:cc(msg)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Phase 5: Announcements (admin CRUD) ────────────────────────────────────
app.get('/api/admin/announcements', adminAuth, requirePermission('announcements'), async (req,res) => {
  try {
    const {rows} = await db(`SELECT a.*, u2.name as created_by_name FROM announcements a
      LEFT JOIN admins ad ON ad.id=a.created_by
      LEFT JOIN users u2 ON u2.id=ad.user_id
      ORDER BY a.created_at DESC`);
    res.json({success:true,data:{announcements:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/admin/announcements', adminAuth, requireRole('Super Admin','Moderator'), async (req,res) => {
  try {
    const { title, message, type, style, slideTheme, startsAt, endsAt } = req.body;
    if (!title||!message) return res.status(400).json({success:false,message:'Title and message are required'});
    const {rows:[a]} = await db(
      `INSERT INTO announcements(title,message,type,style,slide_theme,starts_at,ends_at,created_by)
       VALUES($1,$2,$3,$4,$5,COALESCE($6,NOW()),$7,$8) RETURNING *`,
      [title.trim(), message.trim(), type||'banner', style||'info', slideTheme||'gold', startsAt||null, endsAt||null, req.admin.id]);
    // Notify every user in-app that a new announcement has gone up
    await db(`INSERT INTO notifications(user_id,type,title,body) SELECT id,'announcement',$1,$2 FROM users`,
      [title.trim(), message.trim()]).catch(()=>{});
    await logAdmin(req.admin.id, 'Created announcement', {title});
    res.json({success:true,message:'Announcement created',data:{announcement:cc(a)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/admin/announcements/:id', adminAuth, requireRole('Super Admin','Moderator'), async (req,res) => {
  try {
    const { title, message, type, style, slideTheme, isActive, startsAt, endsAt } = req.body;
    const {rows:[a]} = await db(
      `UPDATE announcements SET
         title=COALESCE($1,title), message=COALESCE($2,message), type=COALESCE($3,type),
         style=COALESCE($4,style), slide_theme=COALESCE($5,slide_theme), is_active=COALESCE($6,is_active),
         starts_at=COALESCE($7,starts_at), ends_at=$8
       WHERE id=$9 RETURNING *`,
      [title, message, type, style, slideTheme, isActive, startsAt, endsAt!==undefined?endsAt:null, req.params.id]);
    if (!a) return res.status(404).json({success:false,message:'Announcement not found'});
    await logAdmin(req.admin.id, 'Updated announcement', {id:req.params.id});
    res.json({success:true,message:'Announcement updated',data:{announcement:cc(a)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/admin/announcements/:id/toggle', adminAuth, requireRole('Super Admin','Moderator'), async (req,res) => {
  try {
    const {rows:[a]} = await db(
      `UPDATE announcements SET is_active = NOT is_active WHERE id=$1 RETURNING *`,[req.params.id]);
    if (!a) return res.status(404).json({success:false,message:'Announcement not found'});
    await logAdmin(req.admin.id, `Announcement ${a.is_active?'activated':'deactivated'}`, {id:req.params.id});
    res.json({success:true,message:`Announcement ${a.is_active?'activated':'deactivated'}`,data:{announcement:cc(a)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.delete('/api/admin/announcements/:id', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    await db('DELETE FROM announcements WHERE id=$1',[req.params.id]);
    await logAdmin(req.admin.id, 'Deleted announcement', {id:req.params.id});
    res.json({success:true,message:'Announcement deleted'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Phase 6: Content Management (admin CRUD) ───────────────────────────────
// FAQ
app.get('/api/admin/content/faq', adminAuth, requirePermission('content'), async (_,res) => {
  try {
    const {rows} = await db('SELECT * FROM content_faq ORDER BY sort_order ASC, created_at ASC');
    res.json({success:true,data:{faqs:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});
app.post('/api/admin/content/faq', adminAuth, requireRole('Super Admin','Moderator'), async (req,res) => {
  try {
    const { question, answer, category, sortOrder } = req.body;
    if (!question||!answer) return res.status(400).json({success:false,message:'Question and answer are required'});
    const {rows:[f]} = await db(
      `INSERT INTO content_faq(question,answer,category,sort_order) VALUES($1,$2,$3,$4) RETURNING *`,
      [question.trim(), answer.trim(), category||'General', sortOrder||0]);
    await logAdmin(req.admin.id, 'Added FAQ entry', {question});
    res.json({success:true,message:'FAQ added',data:{faq:cc(f)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});
app.put('/api/admin/content/faq/:id', adminAuth, requireRole('Super Admin','Moderator'), async (req,res) => {
  try {
    const { question, answer, category, sortOrder, isActive } = req.body;
    const {rows:[f]} = await db(
      `UPDATE content_faq SET question=COALESCE($1,question), answer=COALESCE($2,answer),
       category=COALESCE($3,category), sort_order=COALESCE($4,sort_order), is_active=COALESCE($5,is_active)
       WHERE id=$6 RETURNING *`, [question, answer, category, sortOrder, isActive, req.params.id]);
    if (!f) return res.status(404).json({success:false,message:'FAQ not found'});
    await logAdmin(req.admin.id, 'Updated FAQ entry', {id:req.params.id});
    res.json({success:true,message:'FAQ updated',data:{faq:cc(f)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});
app.delete('/api/admin/content/faq/:id', adminAuth, requireRole('Super Admin','Moderator'), async (req,res) => {
  try {
    await db('DELETE FROM content_faq WHERE id=$1',[req.params.id]);
    await logAdmin(req.admin.id, 'Deleted FAQ entry', {id:req.params.id});
    res.json({success:true,message:'FAQ deleted'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// Banners
app.get('/api/admin/content/banners', adminAuth, requirePermission('content'), async (_,res) => {
  try {
    const {rows} = await db('SELECT * FROM content_banners ORDER BY sort_order ASC, created_at ASC');
    res.json({success:true,data:{banners:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});
app.post('/api/admin/content/banners', adminAuth, requireRole('Super Admin','Moderator'), async (req,res) => {
  try {
    const { title, subtitle, imageUrl, linkUrl, sortOrder } = req.body;
    if (!title) return res.status(400).json({success:false,message:'Title is required'});
    const {rows:[b]} = await db(
      `INSERT INTO content_banners(title,subtitle,image_url,link_url,sort_order) VALUES($1,$2,$3,$4,$5) RETURNING *`,
      [title.trim(), subtitle||'', imageUrl||'', linkUrl||'', sortOrder||0]);
    await logAdmin(req.admin.id, 'Added banner', {title});
    res.json({success:true,message:'Banner added',data:{banner:cc(b)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});
app.put('/api/admin/content/banners/:id', adminAuth, requireRole('Super Admin','Moderator'), async (req,res) => {
  try {
    const { title, subtitle, imageUrl, linkUrl, sortOrder, isActive } = req.body;
    const {rows:[b]} = await db(
      `UPDATE content_banners SET title=COALESCE($1,title), subtitle=COALESCE($2,subtitle),
       image_url=COALESCE($3,image_url), link_url=COALESCE($4,link_url),
       sort_order=COALESCE($5,sort_order), is_active=COALESCE($6,is_active)
       WHERE id=$7 RETURNING *`, [title, subtitle, imageUrl, linkUrl, sortOrder, isActive, req.params.id]);
    if (!b) return res.status(404).json({success:false,message:'Banner not found'});
    await logAdmin(req.admin.id, 'Updated banner', {id:req.params.id});
    res.json({success:true,message:'Banner updated',data:{banner:cc(b)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});
app.delete('/api/admin/content/banners/:id', adminAuth, requireRole('Super Admin','Moderator'), async (req,res) => {
  try {
    await db('DELETE FROM content_banners WHERE id=$1',[req.params.id]);
    await logAdmin(req.admin.id, 'Deleted banner', {id:req.params.id});
    res.json({success:true,message:'Banner deleted'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// News
app.get('/api/admin/content/news', adminAuth, requirePermission('content'), async (_,res) => {
  try {
    const {rows} = await db(`SELECT n.*, u.name as created_by_name FROM content_news n
      LEFT JOIN admins a ON a.id=n.created_by
      LEFT JOIN users u ON u.id=a.user_id
      ORDER BY n.created_at DESC`);
    res.json({success:true,data:{news:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});
app.post('/api/admin/content/news', adminAuth, requireRole('Super Admin','Moderator'), async (req,res) => {
  try {
    const { title, excerpt, body, imageUrl, isPublished } = req.body;
    if (!title||!body) return res.status(400).json({success:false,message:'Title and body are required'});
    const {rows:[n]} = await db(
      `INSERT INTO content_news(title,excerpt,body,image_url,is_published,created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [title.trim(), excerpt||'', body.trim(), imageUrl||'', isPublished!==false, req.admin.id]);
    await logAdmin(req.admin.id, 'Created news post', {title});
    res.json({success:true,message:'News post created',data:{news:cc(n)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});
app.put('/api/admin/content/news/:id', adminAuth, requireRole('Super Admin','Moderator'), async (req,res) => {
  try {
    const { title, excerpt, body, imageUrl, isPublished } = req.body;
    const {rows:[n]} = await db(
      `UPDATE content_news SET title=COALESCE($1,title), excerpt=COALESCE($2,excerpt),
       body=COALESCE($3,body), image_url=COALESCE($4,image_url), is_published=COALESCE($5,is_published)
       WHERE id=$6 RETURNING *`, [title, excerpt, body, imageUrl, isPublished, req.params.id]);
    if (!n) return res.status(404).json({success:false,message:'News post not found'});
    await logAdmin(req.admin.id, 'Updated news post', {id:req.params.id});
    res.json({success:true,message:'News post updated',data:{news:cc(n)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});
app.delete('/api/admin/content/news/:id', adminAuth, requireRole('Super Admin','Moderator'), async (req,res) => {
  try {
    await db('DELETE FROM content_news WHERE id=$1',[req.params.id]);
    await logAdmin(req.admin.id, 'Deleted news post', {id:req.params.id});
    res.json({success:true,message:'News post deleted'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// Static pages (Terms, Privacy, About, etc.)
app.get('/api/admin/content/pages', adminAuth, requirePermission('content'), async (_,res) => {
  try {
    const {rows} = await db('SELECT * FROM content_pages ORDER BY slug ASC');
    res.json({success:true,data:{pages:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});
app.put('/api/admin/content/pages/:slug', adminAuth, requireRole('Super Admin','Moderator'), async (req,res) => {
  try {
    const { title, body } = req.body;
    if (!title||!body) return res.status(400).json({success:false,message:'Title and body are required'});
    const {rows:[p]} = await db(
      `INSERT INTO content_pages(slug,title,body,updated_by) VALUES($1,$2,$3,$4)
       ON CONFLICT (slug) DO UPDATE SET title=$2, body=$3, updated_by=$4, updated_at=NOW() RETURNING *`,
      [req.params.slug, title.trim(), body, req.admin.id]);
    await logAdmin(req.admin.id, `Updated content page: ${req.params.slug}`);
    res.json({success:true,message:'Page saved',data:{page:cc(p)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Phase 7: Backup ─────────────────────────────────────────────────────────
// Render's free/standard web service has no persistent disk, so backups are
// never written to local storage. Instead they're either streamed straight to
// the admin's browser as a download, or pushed to Telegram (which IS
// persistent storage) as a document the admin can grab anytime from their phone.
const generateBackupPayload = async () => {
  const tables = ['users','investments','transactions','admins','settings',
    'announcements','content_faq','content_banners','content_news','content_pages',
    'admin_ip_whitelist'];
  const data = {};
  for (const t of tables) {
    const {rows} = await db(`SELECT * FROM ${t}`);
    data[t] = rows;
  }
  return {
    generatedAt: new Date().toISOString(),
    platform: 'QAVIX GLOBAL',
    tables: Object.keys(data),
    rowCounts: Object.fromEntries(Object.entries(data).map(([k,v])=>[k,v.length])),
    data,
  };
};

app.get('/api/admin/backup/download', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const backup = await generateBackupPayload();
    const filename = `qavix-backup-${new Date().toISOString().slice(0,10)}.json`;
    await logAdmin(req.admin.id, 'Downloaded manual backup', {filename});
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(backup, null, 2));
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/admin/backup/send-telegram', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const backup = await generateBackupPayload();
    const buffer = Buffer.from(JSON.stringify(backup, null, 2));
    const filename = `qavix-backup-${new Date().toISOString().slice(0,10)}.json`;
    const totalRows = Object.values(backup.rowCounts).reduce((s,n)=>s+n,0);
    const caption = `📦 QAVIX GLOBAL Backup\n${new Date().toLocaleString('en-GB')}\nTables: ${backup.tables.length} · Rows: ${totalRows}\nRequested by: ${req.admin.name}`;
    const result = await tgSendDocument(buffer, filename, caption);
    if (!result) return res.status(502).json({success:false,message:'Could not send backup to Telegram. Check bot token/chat ID.'});
    await logAdmin(req.admin.id, 'Sent backup to Telegram', {filename});
    res.json({success:true,message:'Backup sent to Telegram successfully',data:{rowCounts:backup.rowCounts}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/admin/backup/status', adminAuth, requirePermission('backup'), async (_,res) => {
  try {
    const tables = ['users','investments','transactions','admins','settings',
      'announcements','content_faq','content_banners','content_news','content_pages','admin_ip_whitelist'];
    const counts = {};
    for (const t of tables) {
      const {rows} = await db(`SELECT COUNT(*) c FROM ${t}`);
      counts[t] = parseInt(rows[0].c);
    }
    res.json({success:true,data:{tables,counts,lastAutoBackup:LAST_AUTO_BACKUP}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});


app.use((_,res)=>res.status(404).json({success:false,message:'Route not found'}));
app.use((e,req,res,_)=>{console.error(e.message); res.status(500).json({success:false,message:e.message});});


// ── Daily Profit Cron ────────────────────────────────────────────────────
const runDailyProfits = async () => {
  if (!pool) return;
  try {
    // ── Auto-complete any investments past end_date ──────────────────────
    await db(
      `UPDATE investments SET status='completed'
       WHERE status='active' AND end_date <= NOW()`
    );

    const { rows } = await db(
      `SELECT * FROM investments WHERE status='active' AND end_date > NOW()`
    );
    let count = 0;
    for (const inv of rows) {
      // Credit daily income to user balance
      await db(
        `UPDATE users SET balance=balance+$1 WHERE id=$2`,
        [inv.daily_income, inv.user_id]
      );
      // Update investment progress
      await db(
        `UPDATE investments SET days_elapsed=days_elapsed+1, earned_so_far=earned_so_far+$1 WHERE id=$2`,
        [inv.daily_income, inv.id]
      );
      // Record transaction
      await db(
        `INSERT INTO transactions(user_id,type,amount,description,meta)
         VALUES($1,'profit',$2,$3,$4)`,
        [inv.user_id, inv.daily_income,
         `Daily profit — ${inv.plan_name}`,
         JSON.stringify({ investmentId: inv.id, planId: inv.plan_id })]
      );
      // Send notification
      await notif(inv.user_id, 'profit', 'Daily profit credited 💰',
        `$${parseFloat(inv.daily_income).toFixed(2)} from ${inv.plan_name}`);
      // Mark completed if all days done
      await db(
        `UPDATE investments SET status='completed'
         WHERE id=$1 AND days_elapsed >= days_total`,
        [inv.id]
      );
      count++;
    }
    console.log(`✅ Daily profits credited: ${count} investments`);
  } catch (e) {
    console.error('❌ Daily profit error:', e.message);
  }
};

// ── Start ─────────────────────────────────────────────────────────────────
initDB().then(async ()=>{
  // ── Fix expired investments on startup ──────────────────────────────────
  if (pool) {
    try {
      const {rowCount} = await pool.query(
        `UPDATE investments SET status='completed' WHERE status='active' AND end_date <= NOW()`
      );
      if (rowCount > 0) console.log(`✅ Marked ${rowCount} expired investments as completed`);
    } catch(e) { console.error('Startup cleanup error:', e.message); }

    // ── One-time backfill: membership_level was never updated on plan purchase
    // until this fix, so every existing user could be stuck showing "starter"
    // regardless of what they actually invested in. Recompute it for everyone
    // from their real investment history (highest tier ever purchased wins).
    try {
      const {rowCount:fixedCount} = await pool.query(`
        UPDATE users u SET membership_level = ranked.plan_id
        FROM (
          SELECT DISTINCT ON (user_id) user_id, plan_id
          FROM investments
          ORDER BY user_id,
            CASE plan_id WHEN 'elite' THEN 4 WHEN 'gold' THEN 3 WHEN 'silver' THEN 2 WHEN 'bronze' THEN 1 ELSE 0 END DESC
        ) ranked
        WHERE u.id = ranked.user_id
        AND (
          u.membership_level IS DISTINCT FROM ranked.plan_id
          AND CASE ranked.plan_id WHEN 'elite' THEN 4 WHEN 'gold' THEN 3 WHEN 'silver' THEN 2 WHEN 'bronze' THEN 1 ELSE 0 END
            > CASE u.membership_level WHEN 'elite' THEN 4 WHEN 'gold' THEN 3 WHEN 'silver' THEN 2 WHEN 'bronze' THEN 1 ELSE 0 END
        )
      `);
      if (fixedCount > 0) console.log(`✅ Backfilled membership_level for ${fixedCount} user(s) with stale "starter" tier`);
    } catch(e) { console.error('Membership level backfill error:', e.message); }

    // ── One-time migration: rafishasan273@gmail.com is the platform owner and
    // should hold the sole 'Owner' role (above Super Admin, cannot be removed
    // or modified by anyone through the admin UI). Also guards against ever
    // ending up with more than one Owner if this runs again.
    try {
      const {rowCount:ownerCount} = await pool.query(
        `UPDATE admins SET role='Owner'
         WHERE user_id=(SELECT id FROM users WHERE email='rafishasan273@gmail.com') AND role<>'Owner'`);
      if (ownerCount > 0) console.log('✅ Promoted rafishasan273@gmail.com to Owner');
      await pool.query(
        `UPDATE admins SET role='Super Admin'
         WHERE role='Owner' AND user_id<>(SELECT id FROM users WHERE email='rafishasan273@gmail.com')`);
    } catch(e) { console.error('Owner migration error:', e.message); }
  }

  app.listen(PORT,()=>{
    console.log(`
  ╔══════════════════════════════════════════╗
  ║  🏦  QAVIX GLOBAL API                   ║
  ║  Port : ${PORT}  |  DB: ${pool?'Neon ✅':'No DB ⚠️'}        ║
  ╚══════════════════════════════════════════╝`);
    // Register Telegram webhook
    const appUrl = process.env.APP_URL || 'https://qavix-global-axeo.onrender.com';
    registerTgWebhook(appUrl);
  });

  // Run daily profits every 24 hours
  // First run 10s after startup (catches up if server was down)
  setTimeout(runDailyProfits, 10_000);
  setInterval(runDailyProfits, 24 * 60 * 60 * 1000);

  // Daily automatic backup → sent to admin Telegram (no persistent disk needed on Render)
  const runDailyBackup = async () => {
    try {
      const backup = await generateBackupPayload();
      const buffer = Buffer.from(JSON.stringify(backup, null, 2));
      const filename = `qavix-backup-auto-${new Date().toISOString().slice(0,10)}.json`;
      const totalRows = Object.values(backup.rowCounts).reduce((s,n)=>s+n,0);
      const caption = `📦 QAVIX GLOBAL — Daily Auto-Backup\n${new Date().toLocaleString('en-GB')}\nTables: ${backup.tables.length} · Rows: ${totalRows}`;
      const result = await tgSendDocument(buffer, filename, caption);
      if (result) { LAST_AUTO_BACKUP = new Date().toISOString(); console.log('✅ Daily backup sent to Telegram'); }
      else console.log('⚠️  Daily backup failed to send to Telegram');
    } catch(e){ console.error('Daily backup error:', e.message); }
  };
  setTimeout(runDailyBackup, 30_000);
  setInterval(runDailyBackup, 24 * 60 * 60 * 1000);

  // On-chain auto-deposit scanner (only active when HD_MASTER_MNEMONIC is set).
  // First run 20s after startup, then every 30s.
  if (hdMaster && bscProvider) {
    setTimeout(scanOnchainDeposits, 20_000);
    setInterval(scanOnchainDeposits, 30_000);
    // Gas reserve balance check — independent, lighter-weight, every 10 min.
    setTimeout(checkGasReserveAlert, 25_000);
    setInterval(checkGasReserveAlert, 10 * 60 * 1000);
  }
});

module.exports = app;
