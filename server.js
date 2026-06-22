// ═══════════════════════════════════════════════════════════════════════
//  QAVIX GLOBAL — server.js  (single file, everything inside)
// ═══════════════════════════════════════════════════════════════════════
require('dotenv').config();

const express      = require('express');
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
      wallet_network   VARCHAR(20)   DEFAULT 'TRC20',
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

    CREATE TABLE IF NOT EXISTS otp_rate_limit (
      id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email     VARCHAR(150) NOT NULL,
      purpose   VARCHAR(30)  NOT NULL,
      sent_at   TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_otp_email   ON otp_codes(email);
    CREATE INDEX IF NOT EXISTS idx_otp_purpose ON otp_codes(purpose);
    CREATE INDEX IF NOT EXISTS idx_orl_email   ON otp_rate_limit(email);
  `);
  console.log('✅ Neon DB tables ready');
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
const safe   = (u) => { const r={...u}; delete r.password; return r; };
const notif  = (uid,type,title,body='') =>
  db('INSERT INTO notifications(user_id,type,title,body) VALUES($1,$2,$3,$4)',[uid,type,title,body]).catch(()=>{});

// ── Brevo SMTP Email Service ─────────────────────────────────────────────
const nodemailer = require('nodemailer');

const mailer = nodemailer.createTransport({
  host    : 'smtp-relay.brevo.com',
  port    : 587,
  secure  : false,
  auth    : {
    user  : process.env.BREVO_SMTP_USER,
    pass  : process.env.BREVO_SMTP_PASS,
  },
  tls: { rejectUnauthorized: false }
});

mailer.verify((err) => {
  if (err) console.error('❌ Brevo SMTP Error:', err.message);
  else     console.log('✅ Brevo SMTP Ready:', process.env.BREVO_SMTP_USER);
});

// ── OTP Config ───────────────────────────────────────────────────────────
const OTP_CONFIG = {
  register          : { expiry: 5,  subject: '📧 Verify Your QAVIX Account',       action: 'verify your registration'     },
  login             : { expiry: 5,  subject: '🔑 QAVIX Login Verification',         action: 'complete your login'           },
  withdraw          : { expiry: 3,  subject: '💸 QAVIX Withdrawal Confirmation',    action: 'confirm your withdrawal'       },
  password_reset    : { expiry: 10, subject: '🔓 QAVIX Password Reset',             action: 'reset your password'           },
  withdraw_password : { expiry: 5,  subject: '🔐 QAVIX Withdrawal Password Change', action: 'change your withdrawal password'},
  change_email      : { expiry: 5,  subject: '📧 QAVIX Email Change Verification',  action: 'change your email'             },
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
const genOTP = () => String(Math.floor(100000 + Math.random() * 900000));

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
  const min = expiryMin || OTP_CONFIG[purpose]?.expiry || 5;
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

// Send OTP email via Brevo SMTP
const sendOTPMail = async (toEmail, otp, purpose) => {
  const cfg = OTP_CONFIG[purpose] || { subject:'🔐 QAVIX Verification', expiry:5 };
  await mailer.sendMail({
    from    : `"QAVIX GLOBAL" <${process.env.BREVO_SMTP_USER}>`,
    to      : toEmail,
    subject : cfg.subject,
    html    : buildOTPEmail(otp, purpose, cfg.expiry),
  });
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

// Auto-cleanup expired OTPs (runs every hour)
setInterval(async () => {
  try {
    await db(`DELETE FROM otp_codes WHERE expires_at < NOW() OR (used=TRUE AND created_at < NOW()-INTERVAL '1 day')`);
    await db(`DELETE FROM otp_rate_limit WHERE sent_at < NOW()-INTERVAL '10 minutes'`);
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

// ── Constants ────────────────────────────────────────────────────────────
const PLANS = [
  {id:'starter', name:'Starter Plan',  price:25,   rate:0.04, days:30, roi:120, min:25,   max:99   },
  {id:'advanced',name:'Advanced Plan', price:100,  rate:0.05, days:45, roi:225, min:100,  max:499  },
  {id:'premium', name:'Premium Plan',  price:500,  rate:0.06, days:60, roi:360, min:500,  max:4999 },
  {id:'elite',   name:'Elite Plan',    price:5000, rate:0.06, days:80, roi:480, min:5000, max:99999},
];
const COMM = {1:10, 2:6, 3:4, 4:3, 5:2};
const REWARDS = [
  {id:'daily',  name:'Daily Check-in',      amount:0.50,  cd:24  },
  {id:'weekly', name:'Weekly Reward',       amount:5.00,  cd:168 },
  {id:'monthly',name:'Monthly Reward',      amount:25.00, cd:720 },
  {id:'ref1',   name:'First Referral Bonus',amount:5.00,  cd:null},
  {id:'ref10',  name:'10 Member Milestone', amount:15.00, cd:null},
];

// Pay referral commissions up the chain
const payComm = async (investorId, amount) => {
  let cur = investorId;
  for (let lvl=1; lvl<=5; lvl++) {
    const {rows} = await db('SELECT id,name,referred_by FROM users WHERE id=$1',[cur]);
    if (!rows[0]?.referred_by) break;
    const earned = +((amount*(COMM[lvl]||0))/100).toFixed(2);
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

const limit10 = rateLimit({windowMs:15*60000, max:10});

// ═══════════════════════════════════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════════════════════════════════

// Health
app.get('/',           (_,res)=>res.json({success:true,message:'🏦 QAVIX GLOBAL API',db:pool?'Neon ✅':'No DB ⚠️'}));
app.get('/api/health', (_,res)=>res.json({success:true,status:'healthy',uptime:process.uptime()}));

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

    // Step 1: credentials OK → send OTP
    if (!otp) {
      await issueOTP(user.id, user.email, 'login');
      return res.json({success:true,requireOtp:true,message:'OTP sent to your email. Valid for 5 minutes.'});
    }

    // Step 2: verify OTP → issue tokens
    await verifyOTP(user.email, otp, 'login');
    await db('UPDATE users SET last_login=NOW() WHERE id=$1',[user.id]);
    const ip  = req.ip || req.headers['x-forwarded-for'] || 'Unknown';
    const dev = req.headers['user-agent'] || 'Unknown device';
    await db('INSERT INTO login_history(user_id,ip,device) VALUES($1,$2,$3)',[user.id,ip,dev.slice(0,200)]).catch(()=>{});
    const aT=signA(user.id), rT=signR(user.id);
    await db('INSERT INTO refresh_tokens(token) VALUES($1)',[rT]);
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
  if (req.body.refreshToken) await db('DELETE FROM refresh_tokens WHERE token=$1',[req.body.refreshToken]).catch(()=>{});
  res.json({success:true,message:'Logged out'});
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
    const {oldPassword, newPassword, otp} = req.body;
    if (!newPassword||newPassword.length<6) return res.status(400).json({success:false,message:'Min 6 characters'});
    const {rows:[u]} = await db('SELECT withdrawal_pass,email FROM users WHERE id=$1',[req.user.id]);
    if (!u.withdrawal_pass) return res.status(400).json({success:false,message:'No withdrawal password set'});

    if (!otp) {
      if (!oldPassword||!await bcrypt.compare(oldPassword,u.withdrawal_pass))
        return res.status(400).json({success:false,message:'Old password incorrect'});
      await issueOTP(req.user.id, u.email, 'withdraw_password');
      return res.json({success:true,requireOtp:true,message:'OTP sent to verify withdrawal password change'});
    }
    await verifyOTP(req.user.email||u.email, otp, 'withdraw_password');
    await db('UPDATE users SET withdrawal_pass=$1 WHERE id=$2',[await bcrypt.hash(newPassword,10),req.user.id]);
    res.json({success:true,message:'Withdrawal password changed'});
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
    const {newPassword, otp} = req.body;
    if (!newPassword||newPassword.length<8) return res.status(400).json({success:false,message:'Min 8 characters'});
    if (!otp) {
      await issueOTP(req.user.id, req.user.email, 'password_reset');
      return res.json({success:true,requireOtp:true,message:'OTP sent to your email'});
    }
    await verifyOTP(req.user.email, otp, 'password_reset');
    await db('UPDATE users SET password=$1 WHERE id=$2',[await bcrypt.hash(newPassword,12),req.user.id]);
    await notif(req.user.id,'security','Password changed','Your login password was updated.');
    res.json({success:true,message:'Password changed successfully'});
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
    const valid = await verifyOTP(req.user.id, otp, 'change_email');
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
    await db('UPDATE users SET wallet_address=$1,wallet_network=$2 WHERE id=$3',[walletAddress,network||'TRC20',req.user.id]);
    res.json({success:true,message:'Wallet address updated'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Plans ─────────────────────────────────────────────────────────────────
app.get('/api/plans', auth, async (req,res) => {
  try {
    const {rows}=await db("SELECT plan_id FROM investments WHERE user_id=$1 AND status='active'",[req.user.id]);
    const active=rows.map(r=>r.plan_id);
    res.json({success:true,data:{plans:PLANS.map(p=>({...p,dailyExample:+(p.price*p.rate).toFixed(2),totalExample:+(p.price*p.roi/100).toFixed(2),isActive:active.includes(p.id)}))}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/plans/purchase', auth, async (req,res) => {
  try {
    const {planId,amount}=req.body;
    const plan=PLANS.find(p=>p.id===planId);
    if (!plan) return res.status(404).json({success:false,message:'Plan not found'});
    const {rows:[u]}=await db('SELECT balance FROM users WHERE id=$1',[req.user.id]);
    const amt=parseFloat(amount)||plan.price;
    if (amt<plan.min) return res.status(400).json({success:false,message:`Minimum is $${plan.min}`});
    if (parseFloat(u.balance)<amt) return res.status(400).json({success:false,message:'Insufficient balance'});
    const end=new Date(Date.now()+plan.days*86400000);
    const daily=+(amt*plan.rate).toFixed(2), total=+(amt*plan.roi/100).toFixed(2);
    const {rows}=await db(
      `INSERT INTO investments(user_id,plan_id,plan_name,amount,daily_income,total_return,days_total,end_date) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id,planId,plan.name,amt,daily,total,plan.days,end]
    );
    await db('UPDATE users SET balance=balance-$1,total_deposited=total_deposited+$1 WHERE id=$2',[amt,req.user.id]);
    await payComm(req.user.id,amt);
    await notif(req.user.id,'investment',`${plan.name} activated!`,`Daily: $${daily} for ${plan.days} days`);
    res.status(201).json({success:true,message:`${plan.name} activated! Daily: $${daily}`,data:{investment:cc(rows[0])}});
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
    const MIN=parseFloat(process.env.DEPOSIT_MIN)||10, amt=parseFloat(amount);
    if (!amt||amt<MIN) return res.status(400).json({success:false,message:`Min deposit $${MIN}`});
    if (!txHash)       return res.status(400).json({success:false,message:'Transaction hash required'});
    await db('UPDATE users SET balance=balance+$1 WHERE id=$2',[amt,req.user.id]);
    const {rows}=await db(`INSERT INTO transactions(user_id,type,amount,description,meta) VALUES($1,'deposit',$2,$3,$4) RETURNING *`,
      [req.user.id,amt,`Deposit via ${network||'TRC20'}`,JSON.stringify({network,txHash})]);
    await notif(req.user.id,'deposit','Deposit Confirmed',`$${amt} USDT received`);
    res.status(201).json({success:true,message:`$${amt} deposit received`,data:{transaction:cc(rows[0])}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.post('/api/wallet/withdraw', auth, async (req,res) => {
  try {
    const {amount,walletAddress,network,withdrawalPassword,otp} = req.body;
    const MIN=parseFloat(process.env.WITHDRAWAL_MIN)||10, MAX=parseFloat(process.env.WITHDRAWAL_MAX)||10000;
    const amt=parseFloat(amount);
    if (!amt||amt<MIN) return res.status(400).json({success:false,message:`Min withdrawal $${MIN}`});
    if (amt>MAX)       return res.status(400).json({success:false,message:`Max withdrawal $${MAX}`});
    if (!walletAddress)return res.status(400).json({success:false,message:'Wallet address required'});
    const {rows:[u]}=await db('SELECT balance,email,withdrawal_pass,wallet_address FROM users WHERE id=$1',[req.user.id]);
    if (parseFloat(u.balance)<amt) return res.status(400).json({success:false,message:'Insufficient balance'});
    if (!u.withdrawal_pass) return res.status(400).json({success:false,message:'Please set a withdrawal password first in Profile → Security'});
    if (!withdrawalPassword) return res.status(400).json({success:false,message:'Withdrawal password required'});
    if (!await bcrypt.compare(withdrawalPassword,u.withdrawal_pass)) return res.status(400).json({success:false,message:'Incorrect withdrawal password'});

    const fee=+(Math.max(1,amt*0.02)).toFixed(2), net=+(amt-fee).toFixed(2);

    // OTP step
    if (!otp) {
      await issueOTP(req.user.id, u.email, 'withdraw', {amount:amt, walletAddress, network, fee, net});
      return res.json({success:true,requireOtp:true,message:'OTP sent to confirm withdrawal. Valid for 3 minutes.',data:{fee,netAmount:net}});
    }
    await verifyOTP(u.email, otp, 'withdraw');
    await db('UPDATE users SET balance=balance-$1,total_withdrawn=total_withdrawn+$2 WHERE id=$3',[amt,net,req.user.id]);
    const {rows}=await db(
      `INSERT INTO transactions(user_id,type,amount,status,description,meta)
       VALUES($1,'withdrawal',$2,'processing',$3,$4) RETURNING *`,
      [req.user.id,net,`Withdrawal to ${walletAddress}`,JSON.stringify({walletAddress,network,fee})]
    );
    await notif(req.user.id,'withdrawal','Withdrawal Processing',`$${net} USDT sent. 1-24h processing.`);
    res.status(201).json({success:true,message:`$${net} withdrawal submitted`,data:{transaction:cc(rows[0]),fee,netAmount:net}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── Referral ──────────────────────────────────────────────────────────────
app.get('/api/referral/info', auth, async (req,res) => {
  try {
    const {rows}=await db('SELECT referral_code FROM users WHERE id=$1',[req.user.id]);
    const code=rows[0].referral_code;
    res.json({success:true,data:{referralCode:code,referralLink:`https://qavixglobal.pages.dev/?ref=${code}`,commissionRates:COMM}});
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
    const byLvl={};
    rows.forEach(r=>{ if(!byLvl[r.lvl]) byLvl[r.lvl]=[]; byLvl[r.lvl].push({id:r.id,name:r.name,uid:r.uid,status:r.is_verified?'active':'inactive',level:r.membership_level,joinDate:r.created_at}); });
    res.json({success:true,data:{totalMembers:rows.length,levels:Object.entries(byLvl).map(([l,m])=>({level:parseInt(l),count:m.length,commission:COMM[l]||0,members:m}))}});
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
    const [uR,dR,wR]=await Promise.all([
      db('SELECT COUNT(*) FROM users'),
      db("SELECT COALESCE(SUM(amount),0) AS t FROM transactions WHERE type='deposit'"),
      db("SELECT COALESCE(SUM(amount),0) AS t FROM transactions WHERE type='withdrawal'"),
    ]);
    res.json({success:true,data:{totalUsers:18340+parseInt(uR.rows[0].count),activeInvestors:11200,totalDeposits:4200000+parseFloat(dR.rows[0].t),totalWithdrawals:2900000+parseFloat(wR.rows[0].t),totalInvestments:6100000,uptimePct:99.8}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

app.get('/api/stats/leaderboard', async (_,res) => {
  try {
    const {rows}=await db('SELECT name,membership_level,total_deposited,total_withdrawn FROM users ORDER BY total_deposited DESC LIMIT 10');
    res.json({success:true,data:{investors:rows.map(r=>({name:r.name,level:r.membership_level,amount:parseFloat(r.total_deposited)})),earners:[...rows].sort((a,b)=>b.total_withdrawn-a.total_withdrawn).map(r=>({name:r.name,amount:parseFloat(r.total_withdrawn)}))}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

// ── 404 & error handler ───────────────────────────────────────────────────
app.use((_,res)=>res.status(404).json({success:false,message:'Route not found'}));
app.use((e,req,res,_)=>{console.error(e.message); res.status(500).json({success:false,message:e.message});});

// ── Daily Profit Cron ────────────────────────────────────────────────────
const runDailyProfits = async () => {
  if (!pool) return;
  try {
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
initDB().then(()=>{
  app.listen(PORT,()=>{
    console.log(`
  ╔══════════════════════════════════════════╗
  ║  🏦  QAVIX GLOBAL API                   ║
  ║  Port : ${PORT}  |  DB: ${pool?'Neon ✅':'No DB ⚠️'}        ║
  ╚══════════════════════════════════════════╝`);
  });

  // Run daily profits every 24 hours
  // First run 10s after startup (catches up if server was down)
  setTimeout(runDailyProfits, 10_000);
  setInterval(runDailyProfits, 24 * 60 * 60 * 1000);
});

module.exports = app;
