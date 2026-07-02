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

const app  = express();
const PORT = process.env.PORT || 5000;

// Trust Render's proxy
app.set('trust proxy', 1);

// ── Neon PostgreSQL pool ─────────────────────────────────────────────────
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;

const db = (text, params) => pool.query(text, params);

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
      role         VARCHAR(30)   DEFAULT 'Support',
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

    -- ── API Keys (Settings → API Keys) ───────────────────────────────────
    CREATE TABLE IF NOT EXISTS api_keys (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name        VARCHAR(100) NOT NULL,
      key_prefix  VARCHAR(12)  NOT NULL,
      key_hash    TEXT         NOT NULL,
      created_by  UUID REFERENCES admins(id) ON DELETE SET NULL,
      last_used_at TIMESTAMPTZ,
      revoked     BOOLEAN      DEFAULT FALSE,
      created_at  TIMESTAMPTZ  DEFAULT NOW()
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
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method  : 'POST',
    headers : {
      'Content-Type' : 'application/json',
      'api-key'      : process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender     : { name: LIVE_EMAIL_SENDER.fromName || 'QAVIX GLOBAL', email: LIVE_EMAIL_SENDER.fromEmail || process.env.BREVO_SENDER_EMAIL },
      to         : [{ email: toEmail, name: toName || toEmail }],
      subject    : subject,
      htmlContent: htmlBody,
    }),
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
// Restrict to specific roles, e.g. requireRole('Super Admin','Finance')
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.admin.role)) return res.status(403).json({success:false,message:'Insufficient permissions for this action'});
  next();
};

// Default permission matrix per role — what each role can do out of the box.
// Super Admin always gets everything and cannot be restricted.
// These are used when an admin has no custom permissions saved yet.
const DEFAULT_ROLE_PERMISSIONS = {
  'Super Admin': { dashboard:true, users:true, deposits:true, withdrawals:true, plans:true, investments:true, referral:true, reports:true, settings:true, security:true, support:true, announcements:true, content:true, admins:true, logs:true, backup:true },
  'Moderator':   { dashboard:true, users:true, deposits:true, withdrawals:false, plans:false, investments:true, referral:true, reports:true, settings:false, security:false, support:true, announcements:true, content:true, admins:false, logs:false, backup:false },
  'Finance':     { dashboard:true, users:false, deposits:true, withdrawals:true, plans:true, investments:true, referral:true, reports:true, settings:false, security:false, support:false, announcements:false, content:false, admins:false, logs:true, backup:true },
  'Support':     { dashboard:true, users:true, deposits:false, withdrawals:false, plans:false, investments:false, referral:false, reports:false, settings:false, security:false, support:true, announcements:false, content:false, admins:false, logs:false, backup:false },
};

// Check if an admin has permission for a given module key.
// Super Admin always passes; others check custom permissions, falling back to role defaults.
const hasPermission = (admin, module) => {
  if (admin.role === 'Super Admin') return true;
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
const TIER_RANK = { starter:0, bronze:1, silver:2, gold:3, elite:4 };
const DEFAULT_PAYMENT = {
  depositMin: parseFloat(process.env.DEPOSIT_MIN)||10,
  withdrawalMin: parseFloat(process.env.WITHDRAWAL_MIN)||2,
  withdrawalMax: parseFloat(process.env.WITHDRAWAL_MAX)||10000,
  withdrawalFeePercent: 5,
  network: 'BEP20',
};
const DEFAULT_REFERRAL = { enabled: true };
const DEFAULT_MAINTENANCE = { enabled: false, message: 'We are performing scheduled maintenance and will be back shortly.' };
const DEFAULT_SECURITY = { ipWhitelistEnabled: false, adminTwoFactorEnabled: false };
const DEFAULT_GENERAL = { siteName: 'QAVIX GLOBAL', supportEmail: 'support@qavixglobal.com', timezone: 'UTC', language: 'en' };
const DEFAULT_BRANDING = { logoUrl: '', primaryColor: '#C9A227', theme: 'light' };
// Email delivery actually runs on the Brevo HTTP API (see sendEmail) — there is no
// raw SMTP host/port/user/password in this stack, so this only exposes the two
// fields that genuinely change Brevo's outgoing emails. The Brevo API key itself
// stays in .env since it's a secret, not something to expose through the panel.
const DEFAULT_EMAIL_SENDER = { fromName: 'QAVIX GLOBAL', fromEmail: '' };
const DEFAULT_OTP = { codeLength: 6, loginExpiryMin: 5, withdrawExpiryMin: 3, registerExpiryMin: 5, loginOtpEnabled: true, withdrawOtpEnabled: true };

// Live, DB-backed config — admins can edit these via /api/admin/settings/*.
// Falls back to the DEFAULT_* values above until the settings table has rows.
let LIVE_PLANS = DEFAULT_PLANS.map(p=>({...p}));
let LIVE_COMM = {...DEFAULT_COMM};
let LIVE_PAYMENT = {...DEFAULT_PAYMENT};
let LIVE_REFERRAL = {...DEFAULT_REFERRAL};
let LIVE_MAINTENANCE = {...DEFAULT_MAINTENANCE};
let LIVE_SECURITY = {...DEFAULT_SECURITY};
let LIVE_GENERAL = {...DEFAULT_GENERAL};
let LIVE_BRANDING = {...DEFAULT_BRANDING};
let LIVE_EMAIL_SENDER = {...DEFAULT_EMAIL_SENDER};
let LIVE_OTP = {...DEFAULT_OTP};

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
      if (r.key === 'branding') LIVE_BRANDING = {...DEFAULT_BRANDING, ...r.value};
      if (r.key === 'smtp') LIVE_EMAIL_SENDER = {...DEFAULT_EMAIL_SENDER, ...r.value};
      if (r.key === 'otp') LIVE_OTP = {...DEFAULT_OTP, ...r.value};
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
      `SELECT id,title,message,type,style FROM announcements
       WHERE is_active=true AND starts_at<=NOW() AND (ends_at IS NULL OR ends_at>NOW())
       ORDER BY created_at DESC`);
    res.json({success:true,data:{announcements:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Public: Content Management read endpoints (used by index.html) ────────
// Also expose branding for CSS variable injection on page load
app.get('/api/content/branding', async (_,res) => {
  res.json({success:true,data:LIVE_BRANDING});
});

// ── Public: payment limits & fee (used by index.html withdrawal form) ────
app.get('/api/content/payment-info', async (_,res) => {
  res.json({success:true,data:{
    depositMin: LIVE_PAYMENT.depositMin,
    withdrawalMin: LIVE_PAYMENT.withdrawalMin,
    withdrawalMax: LIVE_PAYMENT.withdrawalMax,
    withdrawalFeePercent: LIVE_PAYMENT.withdrawalFeePercent,
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
    if (TIER_RANK[planId] > (TIER_RANK[u.membership_level] ?? 0)) {
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

app.post('/api/wallet/deposit', auth, async (req,res) => {
  try {
    const {amount,network,txHash}=req.body;
    const MIN=LIVE_PAYMENT.depositMin, amt=parseFloat(amount);
    if (!amt||amt<MIN) return res.status(400).json({success:false,message:`Min deposit $${MIN}`});
    if (!txHash)       return res.status(400).json({success:false,message:'Transaction hash required'});
    // Deposits are held as 'pending' until an admin approves them in the admin console.
    // Balance is only credited on approval — see PUT /api/admin/deposits/:id/approve
    const {rows}=await db(`INSERT INTO transactions(user_id,type,amount,status,description,meta) VALUES($1,'deposit',$2,'pending',$3,$4) RETURNING *`,
      [req.user.id,amt,`Deposit via ${network||'BEP20'}`,JSON.stringify({network,txHash})]);
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
    await db('UPDATE users SET balance=balance-$1,total_withdrawn=total_withdrawn+$2 WHERE id=$3',[amt,net,req.user.id]);
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

// Send a file (e.g. backup .json) to admin Telegram — used since Render has no
// persistent disk; Telegram chat history becomes the off-site backup storage.
const tgSendDocument = async (buffer, filename, caption='') => {
  try {
    const form = new FormData();
    form.append('chat_id', TG_CHAT_ID);
    if (caption) form.append('caption', caption);
    form.append('document', new Blob([buffer], {type:'application/json'}), filename);
    const r = await fetch(`${TG_API}/sendDocument`, { method:'POST', body: form });
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

app.post('/api/admin/users/:id/balance', adminAuth, requireRole('Super Admin','Finance'), async (req,res) => {
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
    const {rows:[tx]} = await db(`SELECT * FROM transactions WHERE id=$1 AND type='deposit'`,[req.params.id]);
    if (!tx) return res.status(404).json({success:false,message:'Deposit not found'});
    if (tx.status !== 'pending') return res.status(400).json({success:false,message:'Only pending deposits can be approved'});
    await db('UPDATE users SET balance=balance+$1, total_deposited=total_deposited+$1 WHERE id=$2',[tx.amount,tx.user_id]);
    await db(`UPDATE transactions SET status='approved', reviewed_by=$1, reviewed_at=NOW() WHERE id=$2`,[req.admin.id,req.params.id]);
    await notif(tx.user_id,'deposit','Deposit Approved',`$${tx.amount} has been credited to your balance.`);
    await logAdmin(req.admin.id, `Approved deposit $${tx.amount}`, {depositId:req.params.id,userId:tx.user_id});
    res.json({success:true,message:'Deposit approved and credited'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/admin/deposits/:id/reject', adminAuth, requirePermission('deposits'), async (req,res) => {
  try {
    const {reason} = req.body;
    const {rows:[tx]} = await db(`SELECT * FROM transactions WHERE id=$1 AND type='deposit'`,[req.params.id]);
    if (!tx) return res.status(404).json({success:false,message:'Deposit not found'});
    if (tx.status !== 'pending') return res.status(400).json({success:false,message:'Only pending deposits can be rejected'});
    await db(`UPDATE transactions SET status='rejected', reviewed_by=$1, reviewed_at=NOW(), reject_reason=$2 WHERE id=$3`,[req.admin.id,reason||'',req.params.id]);
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
      const {rows:[tx]} = await db(`SELECT * FROM transactions WHERE id=$1 AND type='deposit'`,[id]);
      if (!tx || tx.status !== 'pending') { skipped++; continue; }
      await db('UPDATE users SET balance=balance+$1, total_deposited=total_deposited+$1 WHERE id=$2',[tx.amount,tx.user_id]);
      await db(`UPDATE transactions SET status='approved', reviewed_by=$1, reviewed_at=NOW() WHERE id=$2`,[req.admin.id,id]);
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
    const {rows:[tx]} = await db(`SELECT * FROM transactions WHERE id=$1 AND type='withdrawal'`,[req.params.id]);
    if (!tx) return res.status(404).json({success:false,message:'Withdrawal not found'});
    if (tx.status !== 'pending') return res.status(400).json({success:false,message:'Only pending withdrawals can be approved'});
    await db(`UPDATE transactions SET status='approved', reviewed_by=$1, reviewed_at=NOW() WHERE id=$2`,[req.admin.id,req.params.id]);
    await notif(tx.user_id,'withdrawal','Withdrawal Approved','Your withdrawal has been approved and will be paid out shortly.');
    await logAdmin(req.admin.id, `Approved withdrawal $${tx.amount}`, {withdrawalId:req.params.id,userId:tx.user_id});
    res.json({success:true,message:'Withdrawal approved'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/admin/withdrawals/:id/reject', adminAuth, requirePermission('withdrawals'), async (req,res) => {
  try {
    const {reason, refund} = req.body;
    const {rows:[tx]} = await db(`SELECT * FROM transactions WHERE id=$1 AND type='withdrawal'`,[req.params.id]);
    if (!tx) return res.status(404).json({success:false,message:'Withdrawal not found'});
    if (tx.status !== 'pending') return res.status(400).json({success:false,message:'Only pending withdrawals can be rejected'});
    if (refund) {
      const meta = tx.meta || {};
      const gross = parseFloat(tx.amount) + parseFloat(meta.fee||0);
      await db('UPDATE users SET balance=balance+$1, total_withdrawn=total_withdrawn-$2 WHERE id=$3',[gross,tx.amount,tx.user_id]);
    }
    await db(`UPDATE transactions SET status='rejected', reviewed_by=$1, reviewed_at=NOW(), reject_reason=$2 WHERE id=$3`,[req.admin.id,reason||'',req.params.id]);
    await notif(tx.user_id,'withdrawal','Withdrawal Rejected',(reason||'Your withdrawal request was rejected.') + (refund?' The amount has been refunded to your balance.':''));
    await logAdmin(req.admin.id, `Rejected withdrawal $${tx.amount}`, {withdrawalId:req.params.id,userId:tx.user_id,reason,refund:!!refund});
    res.json({success:true,message:'Withdrawal rejected'+(refund?' and refunded':'')});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/admin/withdrawals/:id/paid', adminAuth, requirePermission('withdrawals'), async (req,res) => {
  try {
    const {payoutTxnId} = req.body;
    if (!payoutTxnId) return res.status(400).json({success:false,message:'Payout transaction ID required'});
    const {rows:[tx]} = await db(`SELECT * FROM transactions WHERE id=$1 AND type='withdrawal'`,[req.params.id]);
    if (!tx) return res.status(404).json({success:false,message:'Withdrawal not found'});
    if (tx.status !== 'approved') return res.status(400).json({success:false,message:'Only approved withdrawals can be marked paid'});
    const meta = { ...(tx.meta||{}), payoutTxnId };
    await db(`UPDATE transactions SET status='paid', meta=$1, reviewed_by=$2, reviewed_at=NOW() WHERE id=$3`,[JSON.stringify(meta),req.admin.id,req.params.id]);
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
      const {rows:[tx]} = await db(`SELECT * FROM transactions WHERE id=$1 AND type='withdrawal'`,[id]);
      if (!tx || tx.status !== 'pending') { skipped++; continue; }
      await db(`UPDATE transactions SET status='approved', reviewed_by=$1, reviewed_at=NOW() WHERE id=$2`,[req.admin.id,id]);
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
    const {rows:[user]} = await db('SELECT id,name,email FROM users WHERE email=$1',[email.toLowerCase()]);
    if (!user) return res.status(400).json({success:false,message:'This email does not have a QAVIX GLOBAL account yet. They must register on the platform first.'});
    const {rows:exists} = await db('SELECT id FROM admins WHERE user_id=$1',[user.id]);
    if (exists[0]) return res.status(400).json({success:false,message:'This user is already an admin'});
    // New admins start as 'pending' — they cannot use admin access until a Super Admin approves them.
    const {rows} = await db(
      `INSERT INTO admins(user_id,role,status) VALUES($1,$2,'pending') RETURNING id,role,status,created_at`,
      [user.id, role||'Support']);
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
       LEFT JOIN users ru ON ru.id=(t.meta->>'referredUserId')::uuid
       WHERE t.type='commission' ORDER BY t.created_at DESC LIMIT 100`);
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
    const {rows} = await db(`SELECT l.*, a.name as created_by_name FROM loss_entries l
      LEFT JOIN admins a ON a.id=l.created_by ORDER BY l.created_at DESC LIMIT 100`);
    res.json({success:true,data:{entries:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});
app.post('/api/admin/loss-entries', adminAuth, requireRole('Super Admin','Finance'), async (req,res) => {
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
    general: LIVE_GENERAL, branding: LIVE_BRANDING,
    emailSender: LIVE_EMAIL_SENDER,
    otp: LIVE_OTP,
  }});
});

app.put('/api/admin/settings/plans', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const { planId, rate, days, min, max, status } = req.body;
    const plan = LIVE_PLANS.find(p=>p.id===planId);
    if (!plan) return res.status(404).json({success:false,message:'Plan not found'});
    if (rate!==undefined) plan.rate = parseFloat(rate);
    if (days!==undefined) plan.days = parseInt(days);
    if (min!==undefined)  plan.min = parseFloat(min);
    if (max!==undefined)  plan.max = parseFloat(max);
    if (status!==undefined) plan.status = status;
    await saveSetting('plans', LIVE_PLANS, req.admin.id);
    await logAdmin(req.admin.id, `Updated ${plan.tier} plan settings`, {planId, rate, days, min, max, status});
    res.json({success:true,message:`${plan.tier} plan updated`,data:{plans:LIVE_PLANS}});
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
    const { depositMin, withdrawalMin, withdrawalMax, withdrawalFeePercent } = req.body;
    if (depositMin!==undefined) LIVE_PAYMENT.depositMin = parseFloat(depositMin);
    if (withdrawalMin!==undefined) LIVE_PAYMENT.withdrawalMin = parseFloat(withdrawalMin);
    if (withdrawalMax!==undefined) LIVE_PAYMENT.withdrawalMax = parseFloat(withdrawalMax);
    if (withdrawalFeePercent!==undefined) LIVE_PAYMENT.withdrawalFeePercent = parseFloat(withdrawalFeePercent);
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

// ── Phase 2.5: General / Branding / SMTP / OTP settings ─────────────────────
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

app.put('/api/admin/settings/branding', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const { logoUrl, primaryColor, theme } = req.body;
    LIVE_BRANDING = { ...LIVE_BRANDING,
      ...(logoUrl!==undefined && {logoUrl}), ...(primaryColor!==undefined && {primaryColor}), ...(theme!==undefined && {theme}) };
    await saveSetting('branding', LIVE_BRANDING, req.admin.id);
    await logAdmin(req.admin.id, 'Updated branding settings');
    res.json({success:true,message:'Branding settings saved',data:{branding:LIVE_BRANDING}});
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

// ── API Keys (Settings → API Keys) ───────────────────────────────────────
app.get('/api/admin/settings/api-keys', adminAuth, requireRole('Super Admin'), async (_,res) => {
  try {
    const {rows} = await db(`SELECT id,name,key_prefix,last_used_at,revoked,created_at FROM api_keys ORDER BY created_at DESC`);
    res.json({success:true,data:{keys:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/admin/settings/api-keys', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({success:false,message:'Key name is required'});
    const rawKey = 'qvx_' + crypto.randomBytes(24).toString('hex');
    const prefix = rawKey.slice(0,12);
    const hash = await bcrypt.hash(rawKey, 8);
    const {rows:[k]} = await db(
      `INSERT INTO api_keys(name,key_prefix,key_hash,created_by) VALUES($1,$2,$3,$4) RETURNING id,name,key_prefix,created_at`,
      [name.trim(), prefix, hash, req.admin.id]);
    await logAdmin(req.admin.id, 'Generated API key', {name});
    // The full key is only ever shown this one time — store only the hash from here on.
    res.json({success:true,message:'API key generated — copy it now, it will not be shown again.',data:{key:cc(k), fullKey:rawKey}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.delete('/api/admin/settings/api-keys/:id', adminAuth, requireRole('Super Admin'), async (req,res) => {
  try {
    await db('UPDATE api_keys SET revoked=true WHERE id=$1',[req.params.id]);
    await logAdmin(req.admin.id, 'Revoked API key', {id:req.params.id});
    res.json({success:true,message:'API key revoked'});
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
      `SELECT al.*, a.name as admin_name, a.email as admin_email FROM admin_logs al
       LEFT JOIN admins a ON a.id=al.admin_id ${whereSql} ORDER BY al.created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params);
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
      `SELECT w.*, a.name as added_by_name FROM admin_ip_whitelist w
       LEFT JOIN admins a ON a.id=w.added_by ORDER BY w.created_at DESC`);
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
    const {rows} = await db(`SELECT a.*, ad.name as created_by_name FROM announcements a
      LEFT JOIN admins ad ON ad.id=a.created_by ORDER BY a.created_at DESC`);
    res.json({success:true,data:{announcements:ccAll(rows)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/admin/announcements', adminAuth, requireRole('Super Admin','Moderator'), async (req,res) => {
  try {
    const { title, message, type, style, startsAt, endsAt } = req.body;
    if (!title||!message) return res.status(400).json({success:false,message:'Title and message are required'});
    const {rows:[a]} = await db(
      `INSERT INTO announcements(title,message,type,style,starts_at,ends_at,created_by)
       VALUES($1,$2,$3,$4,COALESCE($5,NOW()),$6,$7) RETURNING *`,
      [title.trim(), message.trim(), type||'banner', style||'info', startsAt||null, endsAt||null, req.admin.id]);
    await logAdmin(req.admin.id, 'Created announcement', {title});
    res.json({success:true,message:'Announcement created',data:{announcement:cc(a)}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.put('/api/admin/announcements/:id', adminAuth, requireRole('Super Admin','Moderator'), async (req,res) => {
  try {
    const { title, message, type, style, isActive, startsAt, endsAt } = req.body;
    const {rows:[a]} = await db(
      `UPDATE announcements SET
         title=COALESCE($1,title), message=COALESCE($2,message), type=COALESCE($3,type),
         style=COALESCE($4,style), is_active=COALESCE($5,is_active),
         starts_at=COALESCE($6,starts_at), ends_at=$7
       WHERE id=$8 RETURNING *`,
      [title, message, type, style, isActive, startsAt, endsAt!==undefined?endsAt:null, req.params.id]);
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
    const {rows} = await db(`SELECT n.*, a.name as created_by_name FROM content_news n
      LEFT JOIN admins a ON a.id=n.created_by ORDER BY n.created_at DESC`);
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
});

module.exports = app;
