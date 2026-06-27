<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>QAVIX GLOBAL — Premium Crypto Investment Platform</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --bg: #F8F6F2; --bg2: #F1EEE8; --card: #FFFFFF;
      --gold: #C9A227; --gold-lt: #E8C84A; --gold-dk: #9B7A10;
      --black: #111111; --text: #222222; --muted: #777777; --border: #E5E2DC;
    }
    body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; overflow-x: hidden; padding-bottom: 80px; }

    /* ── PREMIUM HEADER ── */
    @keyframes ddIn { from{opacity:0;transform:scale(0.94) translateY(-4px)} to{opacity:1;transform:scale(1) translateY(0)} }
    @keyframes fadeSlide { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }

    .top-header {
      position: sticky; top: 0; left: 0; right: 0; z-index: 400;
      background: rgba(255,255,255,0.96);
      backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
      border-bottom: 1px solid rgba(229,226,220,0.8);
      box-shadow: 0 2px 20px rgba(17,17,17,0.07);
    }
    .hdr-inner {
      display: flex; align-items: center; gap: 10px;
      padding: 0 1.2rem; height: 64px;
    }
    /* Avatar */
    .hdr-avatar { position: relative; flex-shrink: 0; }
    .hdr-av-circle {
      width: 38px; height: 38px; border-radius: 50%;
      background: linear-gradient(135deg,#C9A227,#9B7A10);
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 13px; color: #111;
      border: 2.5px solid #fff;
      box-shadow: 0 2px 8px rgba(201,162,39,0.32);
      cursor: pointer; user-select: none; flex-shrink: 0;
    }
    .hdr-online {
      position: absolute; bottom: 1px; right: 1px;
      width: 10px; height: 10px; border-radius: 50%;
      background: #22c55e; border: 2px solid #fff;
    }
    .hdr-sep { width: 1px; height: 26px; background: rgba(17,17,17,0.1); flex-shrink: 0; }
    /* Logo */
    .hdr-logo { display: flex; align-items: center; gap: 9px; flex: 1; min-width: 0; }
    .hdr-emblem {
      width: 36px; height: 36px; border-radius: 10px; background: #111;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15); flex-shrink: 0;
    }
    .hdr-wordmark { line-height: 1; }
    .hdr-brand { display: flex; align-items: baseline; gap: 3px; }
    .hdr-brand-q { font-size: 16px; font-weight: 800; letter-spacing: 0.1em; color: #111111; }
    .hdr-brand-g { font-size: 16px; font-weight: 700; letter-spacing: 0.12em; color: #C9A227; }
    .hdr-tagline { font-size: 9px; letter-spacing: 0.2em; color: #aaa; font-weight: 500; text-transform: uppercase; margin-top: 2px; }
    /* Right icons */
    .hdr-right { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
    .hdr-ibtn {
      position: relative; width: 38px; height: 38px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: transparent; border: 1px solid transparent;
      color: #555; cursor: pointer; outline: none; transition: all 0.18s;
    }
    .hdr-ibtn:hover { background: rgba(17,17,17,0.05); }
    .hdr-ibtn.active { background: rgba(201,162,39,0.1); border-color: rgba(201,162,39,0.3); color: #C9A227; }
    .hdr-badge {
      position: absolute; top: 5px; right: 5px;
      width: 16px; height: 16px; border-radius: 50%;
      background: #ef4444; color: #fff;
      font-size: 8px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #F8F6F2;
    }
    .hdr-pill {
      display: flex; align-items: center; gap: 3px;
      background: none; border: none; cursor: pointer;
      font-size: 12px; font-weight: 600; color: #555;
      letter-spacing: 0.04em; padding: 0 3px;
      font-family: inherit; transition: color 0.18s; white-space: nowrap;
    }
    .hdr-pill.active { color: #C9A227; }
    .hdr-chev { transition: transform 0.2s; display: inline-block; vertical-align: middle; }
    .hdr-chev.open { transform: rotate(180deg); }
    .hdr-vsep { width: 1px; height: 22px; background: rgba(17,17,17,0.1); margin: 0 5px; }
    .hdr-cta {
      padding: 8px 16px; border-radius: 9px;
      background: #111; color: #C9A227;
      border: none; cursor: pointer;
      font-size: 12px; font-weight: 700; letter-spacing: 0.04em;
      font-family: inherit; transition: all 0.2s; white-space: nowrap;
    }
    .hdr-cta:hover { background: #C9A227; color: #111; }
    /* Dropdowns */
    .hdr-wrap { position: relative; }
    .hdr-dd {
      position: absolute; top: calc(100% + 10px); right: 0;
      background: #fff; border-radius: 14px;
      box-shadow: 0 8px 32px rgba(17,17,17,0.12), 0 2px 8px rgba(17,17,17,0.05);
      border: 1px solid rgba(229,226,220,0.9);
      z-index: 9999; overflow: hidden;
      animation: ddIn 0.16s cubic-bezier(0.16,1,0.3,1);
      transform-origin: top right; display: none;
    }
    .hdr-dd-label { font-size: 10px; font-weight: 700; color: #bbb; letter-spacing: 0.12em; text-transform: uppercase; padding: 8px 14px 4px; }
    .hdr-dd-row {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 14px; cursor: pointer; transition: background 0.12s;
      border: none; background: none; width: 100%; text-align: left; font-family: inherit;
    }
    .hdr-dd-row:hover { background: rgba(17,17,17,0.04); }
    .hdr-dd-row.sel { background: rgba(201,162,39,0.07); }
    .hdr-dd-icon { width: 32px; height: 32px; border-radius: 8px; background: #F8F6F2; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
    .hdr-dd-title { font-size: 13px; font-weight: 600; color: #222; }
    .hdr-dd-sub { font-size: 11px; color: #999; margin-top: 1px; }
    .hdr-dd-check { margin-left: auto; color: #C9A227; font-size: 13px; }
    .hdr-dd-head { padding: 12px 14px 8px; border-bottom: 1px solid #F0EDE7; display: flex; align-items: center; justify-content: space-between; }
    .hdr-notif-row { display: flex; gap: 10px; padding: 11px 14px; cursor: pointer; border-bottom: 1px solid #F8F6F2; transition: background 0.12s; position: relative; }
    .hdr-notif-row:hover { background: rgba(17,17,17,0.03); }
    .hdr-notif-row.unread { background: rgba(201,162,39,0.04); }
    .hdr-notif-icon { width: 36px; height: 36px; border-radius: 10px; background: #F8F6F2; display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; }
    .hdr-notif-dot { position: absolute; top: 13px; right: 13px; width: 6px; height: 6px; border-radius: 50%; background: #C9A227; }
    .hdr-mrall { background: none; border: none; cursor: pointer; font-size: 11px; font-weight: 600; color: #C9A227; font-family: inherit; display: flex; align-items: center; gap: 4px; }
    .hdr-dd-foot { padding: 9px 14px; border-top: 1px solid #F0EDE7; text-align: center; }
    .hdr-dd-foot-btn { background: none; border: none; cursor: pointer; font-size: 12px; font-weight: 600; color: #C9A227; font-family: inherit; }
    .hdr-status-row { display: flex; align-items: center; gap: 6px; padding: 9px 14px; border-top: 1px solid #F0EDE7; }
    /* Mobile burger */
    .hdr-burger {
      display: none; align-items: center; justify-content: center;
      width: 38px; height: 38px; border-radius: 10px;
      background: none; border: 1px solid rgba(229,226,220,0.9);
      cursor: pointer; color: #111; flex-shrink: 0;
    }
    .hdr-mobile-menu {
      display: none; background: #fff;
      border-top: 1px solid #F0EDE7;
      padding: 12px 1.2rem 18px;
      animation: fadeSlide 0.18s ease;
    }
    .hdr-mobile-menu.open { display: block; }
    .hdr-mob-label { font-size: 10px; font-weight: 700; color: #bbb; letter-spacing: 0.12em; text-transform: uppercase; padding: 8px 0 6px; }
    .hdr-mob-langs { display: flex; gap: 8px; flex-wrap: wrap; }
    .hdr-mob-lang-btn {
      padding: 7px 12px; border-radius: 8px; cursor: pointer;
      background: #F8F6F2; border: 1px solid #EEE;
      font-size: 12px; font-weight: 600; color: #444; font-family: inherit; transition: all 0.15s;
    }
    .hdr-mob-lang-btn.sel { background: rgba(201,162,39,0.1); border-color: rgba(201,162,39,0.4); color: #C9A227; }
    .hdr-mob-support { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
    .hdr-mob-sup-btn {
      padding: 9px 10px; border-radius: 10px; background: #F8F6F2;
      border: 1px solid #EEE; cursor: pointer; text-align: left;
      font-size: 12px; font-weight: 600; color: #333; font-family: inherit;
      display: flex; align-items: center; gap: 7px;
    }
    .hdr-mob-cta { margin-top: 12px; width: 100%; padding: 12px; border-radius: 10px; background: #111; color: #C9A227; border: none; cursor: pointer; font-size: 14px; font-weight: 700; font-family: inherit; }
    @media (max-width: 600px) {
      .hdr-right { display: none !important; }
      .hdr-burger { display: flex !important; }
      .hdr-tagline { display: none; }
    }

    /* BOTTOM NAV */
    /* ── LUXURY BOTTOM NAV ── */
    .bottom-nav {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 300;
      background: rgba(255,255,255,0.92);
      border-top: 1px solid rgba(229,226,220,0.8);
      backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
      display: flex; align-items: center; justify-content: space-around;
      padding: 10px 4px 18px;
      box-shadow:
        0 -8px 32px rgba(17,17,17,0.08),
        0 -1px 0 rgba(229,226,220,0.6),
        inset 0 1px 0 rgba(255,255,255,0.9);
    }
    .nav-item {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      cursor: pointer; text-decoration: none;
      font-size: 10px; font-weight: 600; color: var(--muted);
      transition: all .22s cubic-bezier(.16,1,.3,1);
      min-width: 52px; border: none; background: none; font-family: inherit;
      padding: 6px 8px; border-radius: 14px; letter-spacing: .01em;
      position: relative;
    }
    .nav-item i { font-size: 20px; transition: transform .22s cubic-bezier(.16,1,.3,1); }
    .nav-item:hover { color: var(--gold-dk); }
    .nav-item:hover i { transform: translateY(-2px); }
    .nav-item.active {
      color: var(--gold-dk);
    }
    .nav-item.active i {
      color: var(--gold);
      transform: translateY(-2px);
      filter: drop-shadow(0 2px 6px rgba(201,162,39,0.4));
    }
    .nav-item.active::before {
      content: '';
      position: absolute;
      top: 0; left: 50%; transform: translateX(-50%);
      width: 28px; height: 3px; border-radius: 0 0 3px 3px;
      background: linear-gradient(90deg, var(--gold-lt), var(--gold));
      box-shadow: 0 1px 8px rgba(201,162,39,0.4);
    }
    .nav-item:active i { transform: scale(0.9); }

    /* ── PAGES — regular (non-auth) ── */
    .page {
      display: block;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      position: absolute;
      top: 0; left: 0; right: 0;
      transition: opacity 0.28s ease, visibility 0.28s ease;
    }
    .page.active {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      position: relative;
    }

    /* ── AUTH PAGES — always fixed full-screen, slide via transform ── */
    #page-landing, #page-login, #page-register {
      position: fixed !important;
      inset: 0;
      z-index: 600;
      overflow-y: auto;
      opacity: 1 !important;
      visibility: hidden;
      pointer-events: none;
      transform: translateX(0);
    }
    #page-landing.active,
    #page-login.active,
    #page-register.active {
      visibility: visible !important;
      pointer-events: auto;
    }

    /* Auth slide keyframes — spring-like easing */
    @keyframes authInRight  { from { transform: translateX(100%); } to { transform: translateX(0); } }
    @keyframes authInLeft   { from { transform: translateX(-100%); } to { transform: translateX(0); } }
    @keyframes authOutLeft  { from { transform: translateX(0); } to { transform: translateX(-55%); } }
    @keyframes authOutRight { from { transform: translateX(0); } to { transform: translateX(55%); } }

    .auth-in-right  { animation: authInRight  0.28s cubic-bezier(0.22,1,0.36,1) forwards; }
    .auth-in-left   { animation: authInLeft   0.28s cubic-bezier(0.22,1,0.36,1) forwards; }
    .auth-out-left  { animation: authOutLeft  0.2s cubic-bezier(0.4,0,0.8,1) forwards; }
    .auth-out-right { animation: authOutRight 0.2s cubic-bezier(0.4,0,0.8,1) forwards; }

    /* SHARED */
    .section-eyebrow { font-size: 11px; letter-spacing: .12em; color: var(--gold); font-weight: 600; margin-bottom: 10px; }
    .section-title { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; color: var(--black); line-height: 1.2; margin-bottom: .8rem; }
    .section-sub { font-size: 15px; color: var(--muted); line-height: 1.75; }

    /* ── PAGE: HOME DASHBOARD ── */
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }
    @keyframes countUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes slideAnn { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
    @keyframes badgePop { 0%{transform:scale(0.7);opacity:0} 80%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }

    .hd { padding-bottom: 0; }

    /* ── Welcome Banner ── */
    .hd-welcome {
      background: var(--black); padding: 1.4rem 1.2rem 1.2rem;
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      position: relative; overflow: hidden;
    }
    .hd-welcome::before {
      content:''; position:absolute; top:-40px; right:-40px;
      width:200px; height:200px; border-radius:50%;
      background:radial-gradient(circle,rgba(201,162,39,0.1) 0%,transparent 70%);
      pointer-events:none;
    }
    .hd-welcome-left {}
    .hd-welcome-greeting { font-size:12px; color:#888; margin-bottom:3px; }
    .hd-welcome-name { font-size:20px; font-weight:800; color:#fff; letter-spacing:-.01em; }
    .hd-welcome-sub { font-size:11px; color:#666; margin-top:3px; }
    .hd-welcome-right { text-align:right; flex-shrink:0; }
    .hd-balance-lbl { font-size:10px; color:#666; letter-spacing:.08em; text-transform:uppercase; margin-bottom:3px; }
    .hd-balance-num { font-size:22px; font-weight:800; color:var(--gold); letter-spacing:-.01em; }
    .hd-balance-sub { font-size:10px; color:#888; margin-top:2px; }

    /* ── Quick Actions ── */
    .hd-section { padding: 1.2rem 1.2rem 0; }
    .hd-sec-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:.8rem; }
    .hd-sec-title { font-size:13px; font-weight:700; color:var(--black); letter-spacing:.02em; }
    .hd-sec-link { font-size:11px; font-weight:600; color:var(--gold); }
    .hd-qa-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
    .hd-qa-item {
      background:var(--card); border:1px solid var(--border); border-radius:16px;
      padding:.9rem .4rem; text-align:center; cursor:pointer;
      transition:all .2s; border:none; font-family:inherit;
      display:flex; flex-direction:column; align-items:center; gap:7px;
      box-shadow:0 1px 8px rgba(17,17,17,0.04);
    }
    .hd-qa-item:hover { transform:translateY(-2px); box-shadow:0 4px 16px rgba(201,162,39,0.15); }
    .hd-qa-icon {
      width:48px; height:48px; border-radius:50%;
      display:flex; align-items:center; justify-content:center; font-size:21px;
    }
    .hd-qa-lbl { font-size:11px; font-weight:600; color:var(--text); line-height:1.3; }
    .qa-dep   { background:linear-gradient(135deg,rgba(201,162,39,0.15),rgba(201,162,39,0.05)); }
    .qa-chk   { background:linear-gradient(135deg,rgba(34,197,94,0.15),rgba(34,197,94,0.05)); }
    .qa-luck  { background:linear-gradient(135deg,rgba(139,92,246,0.15),rgba(139,92,246,0.05)); }
    .qa-vip   { background:linear-gradient(135deg,rgba(239,68,68,0.15),rgba(239,68,68,0.05)); }

    /* ── Announcement Ticker ── */
    .hd-ticker {
      background:rgba(201,162,39,0.08); border:1px solid rgba(201,162,39,0.2);
      border-radius:10px; margin:1.2rem 1.2rem 0;
      display:flex; align-items:center; overflow:hidden; height:36px;
    }
    .hd-ticker-badge {
      background:var(--gold); color:var(--black); font-size:9px; font-weight:800;
      padding:0 10px; height:100%; display:flex; align-items:center;
      letter-spacing:.06em; flex-shrink:0;
    }
    .hd-ticker-track { flex:1; overflow:hidden; }
    .hd-ticker-inner {
      display:flex; gap:60px; white-space:nowrap;
      animation:slideAnn 20s linear infinite;
      font-size:12px; color:var(--gold-dk); font-weight:500;
    }

    /* ── Referral Banner ── */
    .hd-ref-banner {
      margin:1.2rem 1.2rem 0;
      background:linear-gradient(135deg,#111 0%,#1c1c1c 100%);
      border:1px solid rgba(201,162,39,0.3); border-radius:18px;
      padding:1.4rem; position:relative; overflow:hidden;
    }
    .hd-ref-banner::after {
      content:''; position:absolute; bottom:-20px; right:-20px;
      width:120px; height:120px; border-radius:50%;
      background:radial-gradient(circle,rgba(201,162,39,0.12) 0%,transparent 70%);
      pointer-events:none;
    }
    .hd-ref-top { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1rem; }
    .hd-ref-title { font-size:16px; font-weight:800; color:#fff; margin-bottom:3px; }
    .hd-ref-sub { font-size:11px; color:#777; }
    .hd-ref-invite-btn {
      background:linear-gradient(135deg,#C9A227,#FFD66E,#9B7A10);
      background-size:200% 100%; color:#111; border:none;
      padding:9px 18px; border-radius:12px; font-size:12px; font-weight:900;
      cursor:pointer; font-family:inherit; white-space:nowrap; flex-shrink:0;
      box-shadow:0 4px 18px rgba(201,162,39,.45);
      transition:all .2s;
    }
    .hd-ref-invite-btn:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(201,162,39,.6); }
    .hd-ref-link {
      background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
      border-radius:10px; padding:9px 12px;
      display:flex; align-items:center; gap:8px; margin-bottom:1rem;
    }
    .hd-ref-link-txt { font-size:12px; color:var(--gold); flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family:monospace; }
    .hd-ref-copy {
      background:rgba(201,162,39,0.15); border:1px solid rgba(201,162,39,0.3);
      color:var(--gold); font-size:11px; font-weight:700;
      padding:5px 12px; border-radius:7px; cursor:pointer; font-family:inherit;
      transition:all .2s; white-space:nowrap;
    }
    .hd-ref-copy:hover { background:var(--gold); color:var(--black); }
    .hd-ref-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
    .hd-ref-stat {
      background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.13);
      border-radius:13px; padding:.8rem .4rem; text-align:center;
      backdrop-filter:blur(4px);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.1);
    }
    .hd-ref-stat-num { font-size:17px; font-weight:800; color:var(--gold); }
    .hd-ref-stat-lbl { font-size:9px; color:#666; margin-top:2px; letter-spacing:.05em; text-transform:uppercase; }

    /* ── Team Income ── */
    .hd-team-card {
      background:#fff; border:1.5px solid rgba(201,162,39,.18); border-radius:22px;
      overflow:hidden;
      box-shadow:0 8px 36px rgba(17,17,17,.08),inset 0 1px 0 #fff;
      position:relative;
    }
    .hd-team-card::before {
      content:''; position:absolute; top:0; left:0; right:0; height:2px;
      background:linear-gradient(90deg,transparent,rgba(201,162,39,.5),transparent);
    }
    .hd-team-row {
      display:flex; align-items:center; padding:12px 16px;
      border-bottom:1px solid rgba(201,162,39,.08); gap:12px; cursor:pointer;
      transition:background .15s;
    }
    .hd-team-row:last-child { border-bottom:none; }
    .hd-team-row:hover { background:linear-gradient(135deg,#fffdf5,#fefcf0); }
    .hd-team-lvl {
      width:34px; height:34px; border-radius:11px;
      display:flex; align-items:center; justify-content:center;
      font-size:11px; font-weight:900; color:var(--gold-dk); flex-shrink:0;
      background:linear-gradient(145deg,#FFF3CC,#FFEAA0);
      border:1px solid rgba(201,162,39,.3);
      box-shadow:0 3px 10px rgba(201,162,39,.15),inset 0 1px 0 rgba(255,255,255,.7);
    }
    .hd-team-info { flex:1; }
    .hd-team-name { font-size:13px; font-weight:700; color:var(--black); }
    .hd-team-members { font-size:11px; color:var(--muted); margin-top:1px; }
    .hd-team-right { text-align:right; }
    .hd-team-pct { font-size:13px; font-weight:800; color:var(--gold); }
    .hd-team-earn { font-size:11px; color:var(--muted); margin-top:1px; }
    .hd-team-more {
      display:flex; align-items:center; justify-content:center; gap:6px;
      padding:10px; font-size:12px; font-weight:600; color:var(--gold);
      cursor:pointer; background:none; border:none; width:100%; font-family:inherit;
      border-top:1px solid var(--border); transition:background .15s;
    }
    .hd-team-more:hover { background:#FDFCF9; }
    .hd-team-hidden { display:none; }
    .hd-team-hidden.show { display:block; }

    /* ── Plans Horizontal Scroll ── */
    .hd-plans-scroll {
      display:flex; gap:12px; overflow-x:auto; padding:0 1.2rem;
      -webkit-overflow-scrolling:touch; scrollbar-width:none;
    }
    .hd-plans-scroll::-webkit-scrollbar { display:none; }
    .hd-plan-card {
      background:var(--card); border:1px solid var(--border); border-radius:18px;
      padding:1.3rem; min-width:175px; flex-shrink:0;
      box-shadow:0 2px 12px rgba(17,17,17,0.05); transition:all .2s;
      position:relative; overflow:hidden;
    }
    .hd-plan-card:hover { transform:translateY(-3px); box-shadow:0 6px 24px rgba(201,162,39,0.14); }
    .hd-plan-card.featured { background:var(--black); border-color:rgba(201,162,39,0.35); }
    .hd-plan-tier { font-size:9px; font-weight:800; letter-spacing:.12em; color:var(--muted); margin-bottom:6px; }
    .hd-plan-card.featured .hd-plan-tier { color:var(--gold); }
    .hd-plan-price { font-size:28px; font-weight:800; color:var(--black); letter-spacing:-.02em; line-height:1; margin-bottom:.6rem; }
    .hd-plan-card.featured .hd-plan-price { color:#fff; }
    .hd-plan-price sub { font-size:14px; font-weight:600; vertical-align:baseline; }
    .hd-plan-roi { display:inline-block; background:rgba(201,162,39,0.12); color:var(--gold-dk); font-size:10px; font-weight:800; padding:3px 9px; border-radius:999px; margin-bottom:.8rem; }
    .hd-plan-card.featured .hd-plan-roi { background:rgba(201,162,39,0.2); color:var(--gold); }
    .hd-plan-rows { display:flex; flex-direction:column; gap:6px; margin-bottom:.9rem; }
    .hd-plan-row { display:flex; justify-content:space-between; font-size:11px; }
    .hd-plan-row-lbl { color:var(--muted); }
    .hd-plan-row-val { font-weight:700; color:var(--black); }
    .hd-plan-card.featured .hd-plan-row-val { color:#fff; }
    .hd-plan-row-val.g { color:var(--gold) !important; }
    .hd-plan-buy {
      width:100%; padding:9px; border-radius:9px; font-size:12px; font-weight:700;
      cursor:pointer; font-family:inherit; transition:all .2s;
    }
    .hd-plan-buy-outline { background:transparent; border:1.5px solid var(--border); color:var(--text); }
    .hd-plan-buy-outline:hover { border-color:var(--gold); color:var(--gold-dk); }
    .hd-plan-buy-gold { background:var(--gold); color:var(--black); border:none; }
    .hd-plan-buy-gold:hover { background:var(--gold-lt); }
    .hd-plan-badge {
      position:absolute; top:-1px; right:14px;
      background:var(--gold); color:var(--black);
      font-size:9px; font-weight:800; padding:2px 10px; border-radius:0 0 8px 8px; letter-spacing:.04em;
    }

    /* ── PLATFORM STATS ── */
    .qx-stats-grid {
      display:grid; grid-template-columns:1fr 1fr; gap:10px;
      padding:0 1.2rem 1.2rem;
    }
    .qx-stat {
      background: linear-gradient(160deg, #fff 0%, #fdfbf5 100%);
      border: 1.5px solid rgba(201,162,39,.22);
      border-radius: 22px; padding: 1.2rem 1rem;
      position:relative; overflow:hidden;
      box-shadow: 0 8px 32px rgba(17,17,17,.08),
                  inset 0 1px 0 rgba(255,255,255,1),
                  inset 0 -1px 0 rgba(17,17,17,.03);
      transition: transform .25s, box-shadow .25s;
    }
    .qx-stat::before {
      content:''; position:absolute; top:0; left:0; right:0; height:2.5px;
      background:linear-gradient(90deg, transparent, rgba(201,162,39,.6), transparent);
    }
    .qx-stat::after {
      content:''; position:absolute; top:-30px; right:-30px;
      width:100px; height:100px; border-radius:50%;
      background:radial-gradient(circle, rgba(201,162,39,.07) 0%, transparent 70%);
      pointer-events:none;
    }
    .qx-stat:hover { transform:translateY(-4px); box-shadow:0 16px 44px rgba(17,17,17,.12), inset 0 1px 0 #fff; }
    .qx-stat-icon { font-size:24px; margin-bottom:.6rem; }
    .qx-stat-val { font-size:24px; font-weight:800; color:var(--gold-dk); letter-spacing:-.02em; margin-bottom:3px; animation:countUp .6s ease; }
    .qx-stat-lbl { font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:.07em; font-weight:700; }
    .qx-stat-delta { font-size:10px; color:#16a34a; font-weight:700; margin-top:3px; }

    /* ── Premium Plan Carousel ── */
    .hd-plan-carousel-wrap { position:relative; padding:0 1.2rem; overflow:hidden; }
    .hd-plan-carousel { display:flex; transition:transform .48s cubic-bezier(.25,.1,.25,1); }
    .hd-plan-slide { min-width:100%; box-sizing:border-box; padding:2px; }

    /* Metallic border outer wrapper */
    .hd-pc-outer {
      border-radius:22px; padding:2px; position:relative;
      transition:transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s;
      cursor:pointer;
    }
    .hd-pc-outer:active { transform:scale(0.975); }
    .hd-pc-bronze { background:linear-gradient(145deg,#E8A060,#CD7F32,#F0C080,#8B5E1A,#E0982E); box-shadow:0 10px 36px rgba(205,127,50,0.28),0 3px 10px rgba(0,0,0,0.08); }
    .hd-pc-silver { background:linear-gradient(145deg,#D8D8D8,#909090,#EFEFEF,#707070,#C8C8C8); box-shadow:0 10px 36px rgba(150,150,150,0.22),0 3px 10px rgba(0,0,0,0.07); }
    .hd-pc-gold   { background:linear-gradient(145deg,#F0C840,#C9A227,#FFE060,#9B7A10,#E8C030); box-shadow:0 14px 52px rgba(201,162,39,0.45),0 4px 18px rgba(0,0,0,0.1); padding:2.5px; }
    .hd-pc-elite  { background:linear-gradient(145deg,#9B7AE8,#C9A227,#7B5CC8,#E8C840,#5B3FA0); box-shadow:0 10px 42px rgba(155,122,232,0.3),0 4px 16px rgba(201,162,39,0.12); }

    /* Inner glass card */
    .hd-pc-card {
      border-radius:20px; padding:22px 20px 20px;
      position:relative; overflow:hidden;
    }
    .hd-pc-card::before { content:''; position:absolute; top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.95),transparent);z-index:1;pointer-events:none; }
    .hd-pc-bronze .hd-pc-card { background:linear-gradient(150deg,#FFF5E6,#FDECD4,#FAE0BC); }
    .hd-pc-silver .hd-pc-card { background:linear-gradient(150deg,#F5F5F7,#EBEBEE,#E2E2E8); }
    .hd-pc-gold   .hd-pc-card { background:linear-gradient(150deg,#FFFBE6,#FFF6CC,#FFF0A8); }
    .hd-pc-elite  .hd-pc-card { background:linear-gradient(150deg,#F5F0FF,#EDE5FF,#E2D6FF); }

    /* Watermark */
    .hd-pc-wm { position:absolute;right:-10px;bottom:-18px;font-size:100px;opacity:0.055;pointer-events:none;user-select:none;line-height:1;z-index:0; }
    /* Recommended ribbon */
    .hd-pc-ribbon { position:absolute;top:18px;right:-2px;background:linear-gradient(135deg,#C9A227,#9B7A10);color:#fff;font-size:9px;font-weight:800;padding:5px 14px 5px 12px;border-radius:20px 0 0 20px;letter-spacing:.1em;text-transform:uppercase;box-shadow:-2px 2px 10px rgba(201,162,39,.45);z-index:3; }
    /* Metallic badge */
    .hd-pc-pill { display:inline-flex;align-items:center;gap:5px;padding:5px 13px;border-radius:20px;font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin-bottom:14px;position:relative;z-index:1; }
    .hd-pc-pill-bronze { background:linear-gradient(135deg,#CD7F32,#E8A060,#9B6020);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,0.35),0 3px 10px rgba(205,127,50,.4); }
    .hd-pc-pill-silver { background:linear-gradient(135deg,#888,#D4D4D4,#666);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,0.5),0 3px 10px rgba(150,150,150,.35); }
    .hd-pc-pill-gold   { background:linear-gradient(135deg,#C9A227,#F0C840,#9B7A10);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,0.4),0 4px 14px rgba(201,162,39,.5); }
    .hd-pc-pill-elite  { background:linear-gradient(135deg,#7B5CC8,#9B7AE8,#C9A227);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,0.3),0 4px 14px rgba(155,122,232,.45); }
    /* Emblem */
    .hd-pc-em { width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;box-shadow:0 4px 16px rgba(0,0,0,.14),inset 0 -3px 8px rgba(0,0,0,.12),inset 0 1px 2px rgba(255,255,255,.6); }
    .hd-pc-em-bronze { background:radial-gradient(circle at 35% 30%,#F0B060,#CD7F32,#7A4A08); }
    .hd-pc-em-silver { background:radial-gradient(circle at 35% 30%,#F2F2F2,#A8A8A8,#585858); }
    .hd-pc-em-gold   { background:radial-gradient(circle at 35% 30%,#FFE868,#C9A227,#7A5600); }
    .hd-pc-em-elite  { background:radial-gradient(circle at 35% 30%,#D0B8FF,#9B7AE8,#3D2080); }
    /* Text */
    .hd-pc-name { font-size:18px;font-weight:900;letter-spacing:.03em;color:var(--black);line-height:1.2; }
    .hd-pc-desc { font-size:12px;color:var(--muted);margin-top:3px; }
    /* Stats */
    .hd-pc-stats { display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:16px 0;position:relative;z-index:1; }
    .hd-pc-stat { background:rgba(255,255,255,0.72);border:1px solid rgba(255,255,255,0.92);border-radius:13px;padding:11px 8px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.05),inset 0 1px 0 rgba(255,255,255,.9); }
    .hd-pc-sl { font-size:9px;color:#aaa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;display:block; }
    .hd-pc-sv { font-size:15px;font-weight:800;color:var(--black);display:block; }
    .hd-pc-sv-roi { font-size:19px; }
    /* Button */
    .hd-pc-btn { width:100%;padding:14px;border-radius:13px;font-size:14px;font-weight:800;border:none;cursor:pointer;font-family:inherit;letter-spacing:.06em;position:relative;overflow:hidden;z-index:1;transition:all .25s cubic-bezier(.34,1.56,.64,1); }
    .hd-pc-btn::before { content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent);transition:left .55s ease; }
    .hd-pc-btn:hover::before { left:110%; }
    .hd-pc-btn-bronze { background:linear-gradient(135deg,#CD7F32,#E8A060,#9B6020);color:#fff;box-shadow:0 5px 20px rgba(205,127,50,.45),inset 0 1px 0 rgba(255,255,255,.25); }
    .hd-pc-btn-silver { background:linear-gradient(135deg,#888,#C0C0C0,#686868);color:#fff;box-shadow:0 5px 20px rgba(150,150,150,.38),inset 0 1px 0 rgba(255,255,255,.35); }
    .hd-pc-btn-gold   { background:linear-gradient(135deg,#C9A227,#F0C840,#9B7A10);color:#fff;box-shadow:0 6px 26px rgba(201,162,39,.55),inset 0 1px 0 rgba(255,255,255,.3); }
    .hd-pc-btn-elite  { background:linear-gradient(135deg,#5B3FA0,#9B7AE8,#C9A227);color:#fff;box-shadow:0 5px 22px rgba(155,122,232,.45),inset 0 1px 0 rgba(255,255,255,.2); }
    /* Dots */
    .hd-plan-dots { display:flex;justify-content:center;gap:6px;margin-top:12px; }
    .hd-plan-dot { width:6px;height:6px;border-radius:50%;background:var(--border);cursor:pointer;transition:all .3s; }
    .hd-plan-dot.active { background:var(--gold);width:20px;border-radius:3px; }

    /* ── Announcement Slider ── */
    .hd-ann-wrap { position:relative; overflow:hidden; border-radius:16px; }
    .hd-ann-slides { display:flex; transition:transform .5s cubic-bezier(.25,.1,.25,1); }
    .hd-ann-slide {
      min-width:100%; border-radius:16px; overflow:hidden;
      padding:1.6rem 1.4rem; position:relative;
    }
    .hd-ann-slide-1 { background:linear-gradient(135deg,#111 0%,#1c1208 100%); }
    .hd-ann-slide-2 { background:linear-gradient(135deg,#0a1628 0%,#162244 100%); }
    .hd-ann-slide-3 { background:linear-gradient(135deg,#0d1f0d 0%,#143314 100%); }
    .hd-ann-eye { font-size:10px; font-weight:700; letter-spacing:.12em; color:var(--gold); text-transform:uppercase; margin-bottom:6px; }
    .hd-ann-title { font-family:'Playfair Display',serif; font-size:20px; font-weight:700; color:#fff; line-height:1.25; margin-bottom:6px; }
    .hd-ann-title em { color:var(--gold); font-style:italic; }
    .hd-ann-body { font-size:12px; color:#888; line-height:1.65; margin-bottom:1rem; }
    .hd-ann-btn {
      display:inline-flex; align-items:center; gap:6px;
      background:var(--gold); color:var(--black); border:none;
      padding:8px 18px; border-radius:9px; font-size:12px; font-weight:800;
      cursor:pointer; font-family:inherit; transition:opacity .2s;
    }
    .hd-ann-btn:hover { opacity:.85; }
    .hd-ann-dots { display:flex; gap:6px; justify-content:center; margin-top:10px; }
    .hd-ann-dot {
      width:6px; height:6px; border-radius:50%;
      background:var(--border); transition:all .3s; cursor:pointer;
    }
    .hd-ann-dot.active { background:var(--gold); width:18px; border-radius:3px; }

    /* ── Profit Calculator ── */
    .hd-calc-card {
      background:var(--card); border:1px solid var(--border); border-radius:18px;
      padding:1.4rem; box-shadow:0 2px 12px rgba(17,17,17,0.04);
    }
    .hd-calc-input {
      width:100%; padding:11px 14px; border-radius:10px;
      border:1.5px solid var(--border); font-size:15px; font-weight:700;
      color:var(--black); background:var(--bg); font-family:inherit;
      outline:none; transition:border-color .2s; margin-bottom:10px;
    }
    .hd-calc-input:focus { border-color:var(--gold); }
    .hd-calc-plans { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; margin-bottom:12px; }
    .hd-calc-plan-btn {
      padding:9px 8px; border-radius:9px; font-size:12px; font-weight:600;
      cursor:pointer; font-family:inherit; border:1.5px solid var(--border);
      background:transparent; color:var(--text); transition:all .18s;
    }
    .hd-calc-plan-btn.sel { border-color:var(--gold); background:rgba(201,162,39,0.08); color:var(--gold-dk); }
    .hd-calc-result {
      background:var(--black); border-radius:12px; padding:1rem;
      display:grid; grid-template-columns:1fr 1fr; gap:10px;
    }
    .hd-calc-res-item { text-align:center; }
    .hd-calc-res-num { font-size:20px; font-weight:800; color:var(--gold); letter-spacing:-.01em; }
    .hd-calc-res-lbl { font-size:10px; color:#666; margin-top:3px; letter-spacing:.06em; text-transform:uppercase; }

    /* ── Leaderboard ── */
    .hd-lb-tabs { display:flex; background:var(--bg2); border-radius:10px; padding:3px; margin-bottom:1rem; }
    .hd-lb-tab {
      flex:1; text-align:center; padding:8px 4px; border-radius:8px;
      font-size:12px; font-weight:600; color:var(--muted); cursor:pointer;
      border:none; background:none; font-family:inherit; transition:all .2s;
    }
    .hd-lb-tab.active { background:var(--card); color:var(--black); box-shadow:0 1px 4px rgba(0,0,0,0.08); }
    .hd-lb-list { display:flex; flex-direction:column; gap:8px; }
    .hd-lb-row {
      display:flex; align-items:center; gap:12px;
      background:linear-gradient(160deg,#fff,#fdfbf5);
      border:1.5px solid rgba(201,162,39,.15); border-radius:18px; padding:11px 14px;
      box-shadow:0 4px 18px rgba(17,17,17,.06),inset 0 1px 0 #fff;
      transition:all .2s;
    }
    .hd-lb-row:hover { border-color:rgba(201,162,39,.35); transform:translateX(3px); }
    .hd-lb-rank {
      width:28px; height:28px; border-radius:8px;
      display:flex; align-items:center; justify-content:center;
      font-size:13px; font-weight:800; flex-shrink:0;
    }
    .hd-lb-rank-1 { background:linear-gradient(135deg,#FFD700,#FFA500); color:#111; }
    .hd-lb-rank-2 { background:linear-gradient(135deg,#C0C0C0,#A0A0A0); color:#111; }
    .hd-lb-rank-3 { background:linear-gradient(135deg,#CD7F32,#A0522D); color:#fff; }
    .hd-lb-rank-n { background:var(--bg2); color:var(--muted); }
    .hd-lb-av {
      width:36px; height:36px; border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      font-size:13px; font-weight:800; color:#111; flex-shrink:0;
    }
    .hd-lb-info { flex:1; }
    .hd-lb-name { font-size:13px; font-weight:700; color:var(--black); }
    .hd-lb-sub  { font-size:11px; color:var(--muted); margin-top:1px; }
    .hd-lb-val  { font-size:14px; font-weight:800; color:var(--gold); }

    /* ── Rewards Center ── */
    .hd-rewards-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
    .hd-reward-card {
      background: linear-gradient(160deg,#ffffff,#fdfbf5);
      border: 1.5px solid rgba(201,162,39,.2);
      border-radius: 20px; padding: 1.1rem .8rem; text-align: center; cursor: pointer;
      position: relative; overflow: hidden;
      box-shadow: 0 6px 28px rgba(17,17,17,.08),
                  inset 0 1px 0 rgba(255,255,255,1),
                  inset 0 -2px 0 rgba(201,162,39,.08);
      transition: all .25s cubic-bezier(.34,1.56,.64,1);
    }
    .hd-reward-card::before {
      content:''; position:absolute; top:0; left:0; right:0; height:2px;
      background:linear-gradient(90deg,transparent,rgba(201,162,39,.5),transparent);
    }
    .hd-reward-card:hover { transform:translateY(-7px); box-shadow:0 18px 44px rgba(201,162,39,.18), inset 0 1px 0 #fff; border-color:rgba(201,162,39,.4); }
    .hd-reward-icon { font-size:28px; margin-bottom:8px; }
    .hd-reward-name { font-size:12px; font-weight:700; color:var(--black); margin-bottom:4px; }
    .hd-reward-amt  { font-size:14px; font-weight:800; color:var(--gold); }
    .hd-reward-status {
      display:inline-block; font-size:9px; font-weight:700;
      padding:2px 8px; border-radius:999px; margin-top:5px;
    }
    .rw-claim  { background:rgba(201,162,39,0.12); color:var(--gold-dk); }
    .rw-done   { background:rgba(34,197,94,0.1);   color:#16a34a; }
    .rw-locked { background:rgba(17,17,17,0.06);   color:var(--muted); }

    /* ── Achievement Badges ── */
    .hd-badges-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
    .hd-badge-card {
      background:var(--card); border:1px solid var(--border); border-radius:16px;
      padding:1rem; display:flex; align-items:center; gap:12px;
      box-shadow:0 1px 8px rgba(17,17,17,0.04);
      animation: badgePop .5s ease both;
    }
    .hd-badge-icon { font-size:30px; flex-shrink:0; }
    .hd-badge-name { font-size:13px; font-weight:700; color:var(--black); }
    .hd-badge-desc { font-size:10px; color:var(--muted); margin-top:2px; }
    .hd-badge-star { font-size:10px; color:var(--gold); margin-top:2px; }

    /* ── Educational ── */
    .hd-edu-list { display:flex; flex-direction:column; gap:8px; }
    .hd-edu-row {
      background:var(--card); border:1px solid var(--border); border-radius:14px;
      padding:12px 14px; display:flex; align-items:center; gap:12px; cursor:pointer; transition:background .15s;
    }
    .hd-edu-row:hover { background:#FDFCF9; }
    .hd-edu-icon { width:40px; height:40px; border-radius:11px; background:var(--bg2); display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
    .hd-edu-title { font-size:13px; font-weight:600; color:var(--black); }
    .hd-edu-sub   { font-size:11px; color:var(--muted); margin-top:2px; }
    .hd-edu-tag   { font-size:9px; font-weight:700; padding:2px 8px; border-radius:999px; margin-top:3px; display:inline-block; }
    .edu-new  { background:rgba(201,162,39,0.12); color:var(--gold-dk); }
    .edu-hot  { background:rgba(239,68,68,0.1);   color:#dc2626; }
    .edu-free { background:rgba(34,197,94,0.1);   color:#16a34a; }

    /* ── Support Banner ── */
    .hd-support-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
    .hd-sup-card {
      background: linear-gradient(160deg,#ffffff,#fdfbf5);
      border: 1.5px solid rgba(201,162,39,.18);
      border-radius: 20px; padding: 1.2rem .8rem; text-align: center; cursor: pointer;
      position: relative; overflow: hidden;
      box-shadow: 0 6px 28px rgba(17,17,17,.07),
                  inset 0 1px 0 #fff, inset 0 -2px 0 rgba(17,17,17,.04);
      transition: all .25s cubic-bezier(.34,1.56,.64,1);
    }
    .hd-sup-card::before {
      content:''; position:absolute; top:0; left:0; right:0; height:2px;
      background:linear-gradient(90deg,transparent,rgba(201,162,39,.45),transparent);
    }
    .hd-sup-card:hover { transform:translateY(-7px); border-color:rgba(201,162,39,.4); box-shadow:0 18px 44px rgba(201,162,39,.16), inset 0 1px 0 #fff; }
    .hd-sup-icon { font-size:26px; margin-bottom:6px; }
    .hd-sup-name { font-size:12px; font-weight:700; color:var(--black); }
    .hd-sup-sub  { font-size:10px; color:var(--muted); margin-top:2px; }

    /* ── Footer Spacing ── */
    .hd-spacer { height: 1.5rem; }

    @keyframes hd-shimmer-sweep { 0%{background-position:-400% center} 100%{background-position:400% center} }
    @keyframes hd-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }

    /* ═══════════════════════════════════════════════════════════════
       3D PREMIUM HOME — DEPTH & LUXURY SYSTEM
    ═══════════════════════════════════════════════════════════════ */

    .qx-sec-hdr { display:flex; align-items:center; justify-content:space-between; padding:1.4rem 1.2rem .6rem; }

    /* REWARD CARDS */
    .hd-reward-icon { font-size:30px; margin-bottom:.7rem; display:block; }
    .hd-reward-name { font-size:12px; font-weight:800; color:var(--black); margin-bottom:4px; }
    .hd-reward-amt  { font-size:16px; font-weight:900; color:var(--gold-dk); }
    .hd-reward-status { display:inline-block; font-size:9px; font-weight:800; padding:3px 10px; border-radius:999px; margin-top:5px; letter-spacing:.05em; }

    /* SUPPORT */
    .hd-sup-icon { font-size:28px; margin-bottom:8px; display:block; }
    .hd-sup-name { font-size:12px; font-weight:800; color:var(--black); }
    .hd-sup-sub  { font-size:10px; color:var(--muted); margin-top:3px; }

    /* CALC CARD */
    .hd-calc-card {
      background:linear-gradient(160deg,#fff,#fdfbf5);
      border:1.5px solid rgba(201,162,39,.2); border-radius:22px; padding:1.4rem;
      box-shadow:0 8px 36px rgba(17,17,17,.08),inset 0 1px 0 #fff;
      position:relative; overflow:hidden;
    }
    .hd-calc-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,rgba(201,162,39,.55),transparent); }
    .hd-calc-input {
      width:100%; padding:12px 14px; border-radius:13px;
      border:1.5px solid rgba(201,162,39,.25); font-size:15px; font-weight:700;
      color:var(--black); background:var(--bg); font-family:inherit;
      outline:none; transition:border-color .2s; margin-bottom:10px;
      box-shadow:inset 0 2px 6px rgba(0,0,0,.05);
    }
    .hd-calc-input:focus { border-color:var(--gold); box-shadow:0 0 0 3px rgba(201,162,39,.1),inset 0 2px 6px rgba(0,0,0,.05); }
    .hd-calc-plan-btn {
      padding:10px 8px; border-radius:12px; font-size:12px; font-weight:700;
      cursor:pointer; font-family:inherit; border:1.5px solid rgba(201,162,39,.2);
      background:linear-gradient(145deg,#fdfcf8,#fff); color:var(--text); transition:all .18s;
    }
    .hd-calc-plan-btn.sel { border-color:rgba(201,162,39,.5); background:linear-gradient(145deg,#fff9e6,#fffaed); color:var(--gold-dk); box-shadow:0 4px 14px rgba(201,162,39,.18); }
    .hd-calc-result {
      background:linear-gradient(135deg,#111,#1a1000); border-radius:16px; padding:1.1rem;
      display:grid; grid-template-columns:1fr 1fr; gap:10px;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.06);
    }
    .hd-calc-res-num { font-size:22px; font-weight:900; color:var(--gold); letter-spacing:-.01em; }
    .hd-calc-res-lbl { font-size:10px; color:#666; margin-top:3px; letter-spacing:.06em; text-transform:uppercase; }

    /* BADGE CARDS */
    .hd-badge-card {
      background:linear-gradient(160deg,#fff,#fdfbf5);
      border:1.5px solid rgba(201,162,39,.18); border-radius:20px;
      padding:1.1rem; display:flex; align-items:center; gap:12px;
      box-shadow:0 6px 26px rgba(17,17,17,.07),inset 0 1px 0 #fff;
      animation:badgePop .5s ease both; transition:all .25s;
    }
    .hd-badge-card:hover { transform:translateY(-4px); box-shadow:0 14px 40px rgba(201,162,39,.15); border-color:rgba(201,162,39,.35); }

    /* EDU ROWS */
    .hd-edu-row {
      background:linear-gradient(160deg,#fff,#fdfbf5);
      border:1.5px solid rgba(201,162,39,.12); border-radius:18px;
      padding:13px 15px; display:flex; align-items:center; gap:12px;
      cursor:pointer; transition:all .2s;
      box-shadow:0 4px 18px rgba(17,17,17,.06),inset 0 1px 0 #fff;
    }
    .hd-edu-row:hover { background:linear-gradient(160deg,#fffdf5,#fefbec); border-color:rgba(201,162,39,.3); transform:translateX(4px); }
    .hd-edu-icon {
      width:44px; height:44px; border-radius:14px;
      background:linear-gradient(145deg,#FFF3CC,#FFEAA0);
      border:1px solid rgba(201,162,39,.25);
      display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;
      box-shadow:0 3px 10px rgba(201,162,39,.15),inset 0 1px 0 rgba(255,255,255,.7);
    }

    /* LB TABS */
    .hd-lb-tabs { display:flex; background:rgba(201,162,39,.08); border:1px solid rgba(201,162,39,.15); border-radius:13px; padding:3px; margin-bottom:1rem; }
    .hd-lb-tab { flex:1; text-align:center; padding:9px 4px; border-radius:10px; font-size:12px; font-weight:700; color:var(--muted); cursor:pointer; border:none; background:none; font-family:inherit; transition:all .2s; }
    .hd-lb-tab.active { background:linear-gradient(135deg,#fff,#fdfbf5); color:var(--black); box-shadow:0 3px 12px rgba(17,17,17,.1),inset 0 1px 0 #fff; border:1px solid rgba(201,162,39,.2); }

    /* LB RANK BADGES */
    .hd-lb-rank { width:30px; height:30px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; flex-shrink:0; }
    .hd-lb-rank-1 { background:linear-gradient(145deg,#FFD700,#FFA500); color:#111; box-shadow:0 3px 10px rgba(255,165,0,.4); }
    .hd-lb-rank-2 { background:linear-gradient(145deg,#E8E8E8,#A0A0A0); color:#111; box-shadow:0 3px 10px rgba(160,160,160,.35); }
    .hd-lb-rank-3 { background:linear-gradient(145deg,#CD7F32,#A0522D); color:#fff; box-shadow:0 3px 10px rgba(160,82,45,.35); }
    .hd-lb-rank-n { background:rgba(17,17,17,.07); color:var(--muted); }

    /* ── Investment Plans Page ── */
    /* ═══ PREMIUM INVESTMENT CARDS ═══ */
    .plans-page { padding: 0 0 5rem; }
    /* Hero */
    .qxp-hero { padding: 1.6rem 1.2rem 1.4rem; }
    .qxp-hero-eye { font-size: 10px; font-weight: 700; letter-spacing: .2em; color: var(--gold); text-transform: uppercase; margin-bottom: 4px; }
    .qxp-hero-h { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: var(--black); line-height: 1.2; margin-bottom: 6px; }
    .qxp-hero-sub { font-size: 12px; color: var(--muted); line-height: 1.7; }
    /* Stack */
    .qxp-stack { padding: 0 1rem; display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }
    /* Outer metallic border wrapper */
    .qxp-outer {
      border-radius: 24px; padding: 2px;
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
      position: relative;
    }
    .qxp-outer:hover { transform: translateY(-5px) scale(1.008); }
    .qxp-outer:active { transform: scale(0.984); }
    /* Tier border gradients */
    .qxp-bronze { background: linear-gradient(145deg,#E8A060,#CD7F32,#F0C080,#8B5E1A,#E0982E); box-shadow: 0 8px 32px rgba(205,127,50,0.22),0 2px 8px rgba(0,0,0,0.08); }
    .qxp-silver { background: linear-gradient(145deg,#D8D8D8,#909090,#EFEFEF,#707070,#C8C8C8); box-shadow: 0 8px 32px rgba(150,150,150,0.2),0 2px 8px rgba(0,0,0,0.07); }
    .qxp-gold   { background: linear-gradient(145deg,#F0C840,#C9A227,#FFE060,#9B7A10,#E8C030); box-shadow: 0 14px 50px rgba(201,162,39,0.42),0 4px 18px rgba(0,0,0,0.1); padding: 2.5px; }
    .qxp-elite  { background: linear-gradient(145deg,#9B7AE8,#C9A227,#7B5CC8,#E8C840,#5B3FA0); box-shadow: 0 10px 42px rgba(155,122,232,0.28),0 4px 18px rgba(201,162,39,0.12); }
    /* Inner glass card */
    .qxp-card {
      border-radius: 22px; padding: 22px 20px 20px;
      position: relative; overflow: hidden;
    }
    .qxp-card::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.95),transparent); z-index:1; pointer-events:none; }
    /* Tier inner backgrounds */
    .qxp-bronze .qxp-card { background: linear-gradient(150deg,#FFF5E6 0%,#FDECD4 50%,#FAE0BC 100%); }
    .qxp-silver .qxp-card { background: linear-gradient(150deg,#F5F5F7 0%,#EBEBEE 50%,#E2E2E8 100%); }
    .qxp-gold   .qxp-card { background: linear-gradient(150deg,#FFFBE6 0%,#FFF6CC 50%,#FFF0A8 100%); }
    .qxp-elite  .qxp-card { background: linear-gradient(150deg,#F5F0FF 0%,#EDE5FF 50%,#E2D6FF 100%); }
    /* Watermark */
    .qxp-wm { position:absolute; right:-8px; bottom:-16px; font-size:96px; opacity:0.055; pointer-events:none; user-select:none; line-height:1; z-index:0; }
    /* Recommended ribbon */
    .qxp-ribbon { position:absolute; top:20px; right:-2px; background:linear-gradient(135deg,#C9A227,#9B7A10); color:#fff; font-size:9px; font-weight:800; padding:5px 14px 5px 12px; border-radius:20px 0 0 20px; letter-spacing:.1em; text-transform:uppercase; box-shadow:-2px 2px 10px rgba(201,162,39,0.45); z-index:3; }
    /* Metallic badge pill */
    .qxp-pill { display:inline-flex; align-items:center; gap:5px; padding:5px 13px; border-radius:20px; font-size:9px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; margin-bottom:16px; position:relative; z-index:1; }
    .qxp-pill-bronze { background:linear-gradient(135deg,#CD7F32,#E8A060,#9B6020); color:#fff; box-shadow:inset 0 1px 0 rgba(255,255,255,0.35),0 3px 10px rgba(205,127,50,0.4); }
    .qxp-pill-silver { background:linear-gradient(135deg,#888,#D4D4D4,#666); color:#fff; box-shadow:inset 0 1px 0 rgba(255,255,255,0.5),0 3px 10px rgba(150,150,150,0.35); }
    .qxp-pill-gold   { background:linear-gradient(135deg,#C9A227,#F0C840,#9B7A10); color:#fff; box-shadow:inset 0 1px 0 rgba(255,255,255,0.4),0 4px 14px rgba(201,162,39,0.5); }
    .qxp-pill-elite  { background:linear-gradient(135deg,#7B5CC8,#9B7AE8,#C9A227); color:#fff; box-shadow:inset 0 1px 0 rgba(255,255,255,0.3),0 4px 14px rgba(155,122,232,0.45); }
    /* Plan header */
    .qxp-head { display:flex; align-items:center; gap:14px; margin-bottom:18px; position:relative; z-index:1; }
    /* Emblem circle */
    .qxp-em {
      width:56px; height:56px; border-radius:50%; display:flex; align-items:center; justify-content:center;
      font-size:28px; flex-shrink:0;
      box-shadow: 0 4px 16px rgba(0,0,0,0.14), inset 0 -3px 8px rgba(0,0,0,0.12), inset 0 1px 2px rgba(255,255,255,0.6);
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
    }
    .qxp-outer:hover .qxp-em { transform: scale(1.1) rotate(-6deg); }
    .qxp-em-bronze { background: radial-gradient(circle at 35% 30%,#F0B060,#CD7F32,#7A4A08); }
    .qxp-em-silver { background: radial-gradient(circle at 35% 30%,#F2F2F2,#A8A8A8,#585858); }
    .qxp-em-gold   { background: radial-gradient(circle at 35% 30%,#FFE868,#C9A227,#7A5600); }
    .qxp-em-elite  { background: radial-gradient(circle at 35% 30%,#D0B8FF,#9B7AE8,#3D2080); }
    .qxp-name { font-size:17px; font-weight:900; letter-spacing:.03em; color:var(--black); line-height:1.2; }
    .qxp-desc { font-size:12px; color:var(--muted); margin-top:3px; }
    /* Stats 3-col */
    .qxp-stats { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:18px; position:relative; z-index:1; }
    .qxp-stat {
      background:rgba(255,255,255,0.72); border:1px solid rgba(255,255,255,0.92);
      border-radius:13px; padding:12px 8px; text-align:center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9);
    }
    .qxp-sl { font-size:9px; color:#aaa; text-transform:uppercase; letter-spacing:.06em; margin-bottom:5px; display:block; }
    .qxp-sv { font-size:15px; font-weight:800; color:var(--black); display:block; }
    .qxp-sv-roi { font-size:19px; }
    /* Premium button */
    .qxp-btn {
      width:100%; padding:15px; border-radius:14px; font-size:14px; font-weight:800;
      border:none; cursor:pointer; font-family:inherit; letter-spacing:.06em;
      position:relative; overflow:hidden; z-index:1;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s, filter 0.2s;
    }
    .qxp-btn::before {
      content:''; position:absolute; top:0; left:-100%; width:100%; height:100%;
      background:linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent);
      transition:left 0.55s ease;
    }
    .qxp-btn:hover::before { left:110%; }
    .qxp-btn:hover { transform:translateY(-2px); filter:brightness(1.07); }
    .qxp-btn:active { transform:translateY(0) scale(0.98); }
    .qxp-btn-bronze { background:linear-gradient(135deg,#CD7F32,#E8A060,#9B6020); color:#fff; box-shadow:0 5px 20px rgba(205,127,50,0.45),inset 0 1px 0 rgba(255,255,255,0.25); }
    .qxp-btn-silver { background:linear-gradient(135deg,#888,#C0C0C0,#686868); color:#fff; box-shadow:0 5px 20px rgba(150,150,150,0.38),inset 0 1px 0 rgba(255,255,255,0.35); }
    .qxp-btn-gold   { background:linear-gradient(135deg,#C9A227,#F0C840,#9B7A10); color:#fff; box-shadow:0 6px 26px rgba(201,162,39,0.55),inset 0 1px 0 rgba(255,255,255,0.3); }
    .qxp-btn-elite  { background:linear-gradient(135deg,#5B3FA0,#9B7AE8,#C9A227); color:#fff; box-shadow:0 5px 22px rgba(155,122,232,0.45),inset 0 1px 0 rgba(255,255,255,0.2); }
    /* Rules */
    .qxp-rules { margin:0 1rem; background:var(--card); border:1px solid var(--border); border-radius:20px; padding:20px; box-shadow:0 2px 12px rgba(0,0,0,0.05); }
    .qxp-rules-title { font-size:11px; font-weight:700; color:var(--gold); letter-spacing:.14em; text-transform:uppercase; margin-bottom:14px; }
    .qxp-rules-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .qxp-rule { background:var(--bg); border-radius:12px; padding:12px 14px; border:1px solid #EDEAE4; }
    .qxp-rule-l { font-size:10px; color:#bbb; margin-bottom:3px; }
    .qxp-rule-v { font-size:13px; font-weight:700; color:var(--text); }
    .qxp-rule-v.red { color:#dc2626; font-size:11px; }
    .plan-badge { position: absolute; top: -11px; right: 20px; background: var(--gold); color: var(--black); font-size: 10px; font-weight: 700; padding: 3px 14px; border-radius: 999px; letter-spacing: .06em; }
    .plan-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
    .plan-tier { font-size: 11px; letter-spacing: .1em; font-weight: 600; color: var(--muted); margin-bottom: 4px; }
    .plan-card.featured .plan-tier { color: var(--gold); }
    .plan-price { font-size: 38px; font-weight: 700; color: var(--black); line-height: 1; }
    .plan-card.featured .plan-price { color: #fff; }
    .plan-price sub { font-size: 16px; font-weight: 500; vertical-align: baseline; margin-right: 2px; }
    .plan-roi { background: rgba(201,162,39,.12); color: var(--gold-dk); font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 999px; white-space: nowrap; align-self: flex-start; margin-top: 4px; }
    .plan-card.featured .plan-roi { background: rgba(201,162,39,.2); color: var(--gold); }
    .plan-divider { height: 1px; background: var(--border); margin: 1rem 0; }
    .plan-card.featured .plan-divider { background: #2a2a2a; }
    .plan-rows { display: flex; flex-direction: column; gap: 9px; margin-bottom: 1.4rem; }
    .plan-row { display: flex; justify-content: space-between; font-size: 14px; }
    .plan-lbl { color: var(--muted); }
    .plan-card.featured .plan-lbl { color: #666; }
    .plan-val { font-weight: 600; color: var(--black); }
    .plan-card.featured .plan-val { color: #fff; }
    .plan-val.gold { color: var(--gold) !important; }
    .plan-btn { width: 100%; padding: 12px; border-radius: 9px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .2s; }
    .plan-btn-outline { background: transparent; color: var(--text); border: 1.5px solid var(--border); }
    .plan-btn-outline:hover { border-color: var(--gold); color: var(--gold-dk); }
    .plan-btn-gold { background: var(--gold); color: var(--black); border: none; }
    .plan-btn-gold:hover { background: var(--gold-lt); }

    /* ══ TEAM NETWORK PAGE ══ */
    /* ══════════════════════════════════════════════════════════════════
       PAGE: TEAM NETWORK — Premium Luxury Redesign
    ══════════════════════════════════════════════════════════════════ */
    @keyframes tmFadeUp    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes tmShimmer   { 0%{background-position:-300% center} 100%{background-position:300% center} }
    @keyframes tmFloat     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
    @keyframes tmGlow      { 0%,100%{opacity:.5} 50%{opacity:1} }
    @keyframes tmSweep     { 0%{left:-80%} 100%{left:120%} }
    @keyframes tmNodePulse { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.15);opacity:1} }

    /* ── SHARED ── */
    .tm-body { padding:0 0 2rem; background:var(--bg); }
    .tm-sec  { padding:1.4rem 1.2rem 0; }
    .tm-lbl  {
      font-size:10px; font-weight:800; color:var(--muted);
      letter-spacing:.16em; text-transform:uppercase; margin-bottom:1rem;
    }
    .tm-card {
      background:#fff; border:1.5px solid rgba(201,162,39,.2);
      border-radius:22px; overflow:hidden;
      box-shadow:0 8px 36px rgba(17,17,17,.08),inset 0 1px 0 #fff;
      position:relative;
    }
    .tm-card::before {
      content:''; position:absolute; top:0; left:0; right:0; height:2px;
      background:linear-gradient(90deg,transparent,rgba(201,162,39,.6),transparent);
      z-index:2;
    }

    /* ── S1: HERO ── */
    .tm-hero {
      background:linear-gradient(155deg,#0a0a0a 0%,#141008 45%,#1a1a00 75%,#0d0d0d 100%);
      padding:2rem 1.3rem 1.5rem; position:relative; overflow:hidden;
      display:flex; flex-direction:column; gap:1.4rem;
    }
    .tm-hero::after {
      content:''; position:absolute; bottom:0; left:0; right:0; height:2px;
      background:linear-gradient(90deg,transparent,rgba(201,162,39,.7),transparent);
    }
    .tm-hero-bg-glow {
      position:absolute; top:-80px; right:-80px; width:320px; height:320px;
      background:radial-gradient(circle,rgba(201,162,39,.2) 0%,rgba(201,162,39,.06) 40%,transparent 70%);
      pointer-events:none; animation:tmGlow 4s ease-in-out infinite;
    }
    .tm-hero-grid {
      position:absolute; inset:0; pointer-events:none; opacity:.035;
      background-image:linear-gradient(rgba(201,162,39,.5) 1px,transparent 1px),
                       linear-gradient(90deg,rgba(201,162,39,.5) 1px,transparent 1px);
      background-size:36px 36px;
    }
    .tm-hero-left { position:relative; z-index:2; }
    .tm-hero-eye  {
      display:inline-flex; align-items:center; gap:6px;
      font-size:9px; font-weight:800; letter-spacing:.16em; color:var(--gold);
      text-transform:uppercase; margin-bottom:.8rem;
      background:rgba(201,162,39,.1); border:1px solid rgba(201,162,39,.25);
      border-radius:999px; padding:4px 12px;
    }
    .tm-hero-eye-dot { width:5px; height:5px; border-radius:50%; background:var(--gold); animation:tmGlow 2s ease infinite; }
    .tm-hero-h    {
      font-family:'Playfair Display',serif;
      font-size:clamp(22px,6vw,32px); font-weight:700; color:#fff; line-height:1.2; margin-bottom:.7rem;
    }
    .tm-hero-h em { color:var(--gold); font-style:italic; }
    .tm-hero-p    { font-size:12px; color:#888; line-height:1.7; margin-bottom:1.2rem; max-width:280px; }
    .tm-hero-btn  {
      display:inline-flex; align-items:center; gap:8px;
      padding:12px 22px; border-radius:14px; border:none; cursor:pointer;
      font-family:inherit; font-size:13px; font-weight:800;
      background:linear-gradient(135deg,#C9A227,#FFD66E,#9B7A10,#C9A227);
      background-size:300% 100%; color:#111;
      box-shadow:0 6px 24px rgba(201,162,39,.45);
      animation:tmShimmer 3s linear infinite;
      transition:transform .2s,box-shadow .2s;
    }
    .tm-hero-btn:hover { transform:translateY(-2px); box-shadow:0 10px 32px rgba(201,162,39,.6); }

    /* ── HERO NETWORK ILLUSTRATION ── */
    .tm-hero-illu {
      position:relative; z-index:2;
      display:flex; align-items:center; justify-content:center;
      height:110px; pointer-events:none;
    }
    .tm-net-center {
      width:52px; height:52px; border-radius:50%;
      background:linear-gradient(135deg,#C9A227,#FFD66E,#9B7A10);
      display:flex; align-items:center; justify-content:center;
      font-size:22px; position:relative; z-index:3;
      box-shadow:0 0 0 8px rgba(201,162,39,.15),0 0 0 16px rgba(201,162,39,.07),0 8px 24px rgba(201,162,39,.4);
    }
    .tm-net-node {
      width:36px; height:36px; border-radius:50%;
      background:rgba(255,255,255,.08); border:1.5px solid rgba(201,162,39,.35);
      display:flex; align-items:center; justify-content:center; font-size:14px;
      position:absolute;
      box-shadow:0 0 12px rgba(201,162,39,.2);
      animation:tmFloat 3s ease-in-out infinite;
    }
    .tm-net-node-1 { top:0;    left:50%; transform:translateX(-50%); animation-delay:.0s; }
    .tm-net-node-2 { top:20%;  right:5%; animation-delay:.5s; }
    .tm-net-node-3 { bottom:5%;right:15%;animation-delay:1s; }
    .tm-net-node-4 { bottom:5%;left:15%; animation-delay:1.5s; }
    .tm-net-node-5 { top:20%;  left:5%;  animation-delay:.8s; }
    .tm-net-line {
      position:absolute; height:1px; background:linear-gradient(90deg,rgba(201,162,39,.4),rgba(201,162,39,.1));
      transform-origin:left center; pointer-events:none;
    }

    /* ── HERO STATS ── */
    .tm-hero-stats {
      display:grid; grid-template-columns:1fr 1fr 1fr;
      background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
      border-radius:18px; overflow:hidden; position:relative; z-index:2;
      backdrop-filter:blur(8px);
    }
    .tm-hs {
      padding:.9rem .5rem; text-align:center;
      border-right:1px solid rgba(255,255,255,.07); position:relative;
    }
    .tm-hs:last-child { border-right:none; }
    .tm-hs-n { font-size:20px; font-weight:800; color:#fff; letter-spacing:-.02em; }
    .tm-hs-n.gold  { color:var(--gold); text-shadow:0 0 16px rgba(201,162,39,.4); }
    .tm-hs-n.green { color:#4ade80; }
    .tm-hs-l { font-size:9px; color:#666; margin-top:3px; letter-spacing:.07em; text-transform:uppercase; font-weight:600; }

    /* ── S2: REFERRAL CARD ── */
    .tm-ref-card {
      background:linear-gradient(160deg,#fff,#fdfbf5);
      border:1.5px solid rgba(201,162,39,.22); border-radius:22px;
      padding:1.4rem; position:relative; overflow:hidden;
      box-shadow:0 8px 36px rgba(17,17,17,.08),inset 0 1px 0 #fff;
    }
    .tm-ref-card::before {
      content:''; position:absolute; top:0; left:0; right:0; height:2px;
      background:linear-gradient(90deg,transparent,rgba(201,162,39,.6),transparent);
    }
    .tm-ref-sweep {
      position:absolute; top:0; bottom:0; width:40%;
      background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent);
      pointer-events:none; animation:tmSweep 5s ease-in-out infinite;
    }
    .tm-ref-section { margin-bottom:1.1rem; }
    .tm-ref-section:last-of-type { margin-bottom:0; }
    .tm-ref-row  { display:flex; align-items:center; justify-content:space-between; margin-bottom:.5rem; }
    .tm-ref-label { font-size:9px; font-weight:800; color:var(--muted); letter-spacing:.12em; text-transform:uppercase; }
    .tm-ref-copy-btn {
      display:inline-flex; align-items:center; gap:5px;
      padding:5px 12px; border-radius:9px; border:none; cursor:pointer;
      font-family:inherit; font-size:10px; font-weight:800;
      background:var(--black); color:var(--gold);
      transition:all .2s;
    }
    .tm-ref-copy-btn:hover { background:var(--gold); color:#111; }
    .tm-ref-val-box {
      background:var(--bg); border:1.5px solid rgba(201,162,39,.2);
      border-radius:13px; padding:.85rem 1rem;
      box-shadow:inset 0 2px 6px rgba(0,0,0,.05);
    }
    .tm-ref-code-text {
      font-size:22px; font-weight:900; color:var(--black);
      letter-spacing:.15em; text-align:center; font-family:monospace;
    }
    .tm-ref-link-text {
      font-size:11px; font-weight:600; color:var(--gold-dk);
      font-family:monospace; word-break:break-all; line-height:1.5;
    }
    .tm-ref-share-row { display:flex; gap:8px; margin-top:1rem; }
    .tm-ref-share-btn {
      flex:1; padding:9px 4px; border-radius:11px;
      border:1.5px solid rgba(201,162,39,.2);
      background:linear-gradient(145deg,#fdfcf8,#fff);
      font-size:10px; font-weight:800; color:var(--black);
      cursor:pointer; font-family:inherit; transition:all .2s; text-align:center;
    }
    .tm-ref-share-btn:hover { border-color:rgba(201,162,39,.4); background:linear-gradient(145deg,#fff9e6,#fffaed); color:var(--gold-dk); transform:translateY(-2px); }

    /* ── S3: COMMISSION CARD ── */
    .tm-comm-card {
      background:linear-gradient(155deg,#0d0d0d 0%,#1a1200 60%,#0d0d0d 100%);
      border-radius:24px; padding:1.6rem 1.4rem;
      position:relative; overflow:hidden;
      box-shadow:0 12px 48px rgba(0,0,0,.25),0 4px 16px rgba(0,0,0,.15);
    }
    .tm-comm-card::before {
      content:''; position:absolute; top:0; left:0; right:0; height:2px;
      background:linear-gradient(90deg,transparent,rgba(201,162,39,.8),transparent);
    }
    .tm-comm-card::after {
      content:''; position:absolute; top:-60px; right:-60px;
      width:250px; height:250px; border-radius:50%;
      background:radial-gradient(circle,rgba(201,162,39,.18) 0%,transparent 65%);
      pointer-events:none;
    }
    .tm-comm-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem; position:relative; z-index:1; }
    .tm-comm-eye    { font-size:9px; font-weight:800; letter-spacing:.14em; color:var(--gold); text-transform:uppercase; }
    .tm-comm-total  { font-size:9px; color:#555; }
    .tm-comm-num    {
      font-size:36px; font-weight:900; color:var(--gold); letter-spacing:-.03em;
      margin-bottom:.2rem; position:relative; z-index:1;
      text-shadow:0 0 30px rgba(201,162,39,.4);
    }
    .tm-comm-sub    { font-size:11px; color:#666; margin-bottom:1.2rem; position:relative; z-index:1; }
    .tm-comm-grid   { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:1.2rem; position:relative; z-index:1; }
    .tm-comm-item   {
      background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.09);
      border-radius:15px; padding:.9rem;
      backdrop-filter:blur(4px);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.06);
    }
    .tm-comm-item-n { font-size:18px; font-weight:800; color:#fff; }
    .tm-comm-item-n.gold  { color:var(--gold); text-shadow:0 0 12px rgba(201,162,39,.3); }
    .tm-comm-item-n.green { color:#4ade80; }
    .tm-comm-item-l { font-size:9px; color:#555; margin-top:3px; letter-spacing:.06em; text-transform:uppercase; }
    #tm-collect-btn {
      position:relative; z-index:1;
      width:100%; padding:14px; border-radius:14px;
      background:linear-gradient(135deg,#C9A227,#FFD66E,#9B7A10,#C9A227) !important;
      background-size:300% 100% !important;
      color:#111 !important; border:none; font-size:14px; font-weight:900;
      cursor:pointer; font-family:inherit;
      animation:tmShimmer 3s linear infinite;
      box-shadow:0 6px 24px rgba(201,162,39,.4) !important;
      display:flex; align-items:center; justify-content:center; gap:8px;
      transition:transform .2s !important;
    }
    #tm-collect-btn:hover { transform:translateY(-2px) !important; }

    /* ── S4: TEAM TREE LEVELS ── */
    .tm-tree-card {
      background:#fff; border:1.5px solid rgba(201,162,39,.18);
      border-radius:22px; overflow:hidden;
      box-shadow:0 8px 36px rgba(17,17,17,.07),inset 0 1px 0 #fff;
    }
    .tm-tree-root {
      padding:1.2rem; border-bottom:1px solid rgba(201,162,39,.12);
      background:linear-gradient(135deg,#fdfcf8,#fffbf0);
      display:flex; align-items:center; justify-content:center;
    }
    .tm-tree-you {
      display:flex; flex-direction:column; align-items:center; gap:5px;
    }
    .tm-tree-av {
      width:52px; height:52px; border-radius:50%;
      background:linear-gradient(135deg,#C9A227,#FFD66E,#9B7A10);
      display:flex; align-items:center; justify-content:center;
      font-size:18px; font-weight:900; color:#111;
      box-shadow:0 0 0 4px rgba(201,162,39,.2),0 6px 20px rgba(201,162,39,.35);
    }
    .tm-tree-you-lbl { font-size:14px; font-weight:800; color:var(--black); }
    .tm-tree-you-sub { font-size:10px; color:var(--muted); }

    /* ── TEAM LEVEL ROWS — matches JS renderTeamTree output ── */
    .tm-level-row {
      display:flex; align-items:center; gap:12px;
      padding:13px 16px; cursor:pointer;
      border-bottom:1px solid rgba(201,162,39,.08);
      position:relative; overflow:hidden;
      transition:background .18s;
    }
    .tm-level-row:last-child { border-bottom:none; }
    .tm-level-row:hover { background:linear-gradient(135deg,#fffdf5,#fefbec); }
    .tm-level-row.expanded { background:linear-gradient(135deg,#fffaea,#fff8dc); }

    .tm-level-connector {
      position:absolute; left:0; top:0; bottom:0; width:3px;
      border-radius:0 2px 2px 0;
    }
    .tm-lv-badge {
      width:44px; height:44px; border-radius:50%; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
      font-size:13px; font-weight:900; color:#111;
      box-shadow:0 4px 14px rgba(201,162,39,.25),inset 0 1px 0 rgba(255,255,255,.5);
    }
    .tm-lv-info  { flex:1; min-width:0; }
    .tm-lv-name  { font-size:13px; font-weight:800; color:var(--black); margin-bottom:3px; }
    .tm-lv-avatars { display:flex; align-items:center; gap:3px; }
    .tm-lv-av {
      width:22px; height:22px; border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      font-size:9px; font-weight:800; border:1.5px solid #fff;
      margin-left:-4px;
    }
    .tm-lv-av:first-child { margin-left:0; }
    .tm-lv-av-more { font-size:9px; font-weight:700; color:var(--muted); margin-left:6px; }
    .tm-lv-right { display:flex; align-items:center; gap:8px; flex-shrink:0; }
    .tm-lv-pct {
      font-size:11px; font-weight:800; color:var(--gold-dk);
      background:rgba(201,162,39,.12); border:1px solid rgba(201,162,39,.25);
      border-radius:999px; padding:3px 10px;
    }
    .tm-lv-earn { font-size:11px; font-weight:700; color:var(--muted); }
    .tm-lv-chev {
      font-size:16px; color:var(--muted); line-height:1;
      transition:transform .3s, color .2s;
      display:flex; align-items:center; justify-content:center;
      width:26px; height:26px; border-radius:8px;
      background:var(--bg2); border:1px solid var(--border);
    }
    .tm-level-row.expanded .tm-lv-chev {
      transform:rotate(90deg);
      background:rgba(201,162,39,.1); border-color:rgba(201,162,39,.3); color:var(--gold);
    }

    /* JS renders .tm-level-detail.open — NOT .tm-lv-panel */
    .tm-level-detail {
      max-height:0; overflow:hidden;
      transition:max-height .4s cubic-bezier(.4,0,.2,1);
    }
    .tm-level-detail.open { max-height:2000px; }

    .tm-lv-detail-grid {
      display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;
      margin:12px 14px 10px;
    }
    .tm-lv-dg-item {
      text-align:center; padding:.7rem .4rem;
      background:#fff; border-radius:13px;
      border:1px solid rgba(201,162,39,.15);
      box-shadow:0 2px 8px rgba(17,17,17,.05),inset 0 1px 0 rgba(255,255,255,.9);
    }
    .tm-lv-dg-num { font-size:16px; font-weight:900; color:var(--gold-dk); }
    .tm-lv-dg-lbl { font-size:9px; color:var(--muted); letter-spacing:.06em; text-transform:uppercase; margin-top:2px; font-weight:600; }

    .tm-lv-members-list { display:flex; flex-direction:column; gap:7px; padding:0 14px 14px; }
    .tm-lv-member {
      display:flex; align-items:center; gap:10px;
      background:linear-gradient(160deg,#fff,#fdfbf5);
      border:1px solid rgba(201,162,39,.15); border-radius:14px;
      padding:10px 12px;
      box-shadow:0 3px 12px rgba(17,17,17,.05),inset 0 1px 0 #fff;
      transition:all .2s;
    }
    .tm-lv-member:hover { border-color:rgba(201,162,39,.3); transform:translateX(3px); }
    .tm-lv-mem-av {
      width:36px; height:36px; border-radius:50%; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
      font-size:12px; font-weight:800;
      box-shadow:0 3px 10px rgba(201,162,39,.2);
    }
    .tm-lv-mem-name { font-size:13px; font-weight:700; color:var(--black); flex:1; }
    .tm-lv-mem-status {
      font-size:9px; font-weight:800; padding:3px 9px; border-radius:999px; letter-spacing:.04em;
    }
    .tm-lv-mem-active   { background:rgba(34,197,94,.12); color:#16a34a; border:1px solid rgba(34,197,94,.2); }
    .tm-lv-mem-inactive { background:rgba(17,17,17,.07); color:var(--muted); }

    /* Empty state */
    .tm-lv-empty {
      text-align:center; padding:1.4rem 1rem;
      color:var(--muted); font-size:12px;
    }
    .tm-lv-empty-icon { font-size:28px; margin-bottom:.5rem; }
    .tm-lv-empty-title { font-size:13px; font-weight:700; color:var(--black); margin-bottom:3px; }
    .tm-lv-empty-btn {
      margin-top:.8rem; display:inline-flex; align-items:center; gap:6px;
      padding:8px 18px; border-radius:11px; border:none; cursor:pointer;
      font-family:inherit; font-size:12px; font-weight:800;
      background:var(--black); color:var(--gold); transition:all .2s;
    }
    .tm-lv-empty-btn:hover { background:var(--gold); color:#111; }

    /* ── TABS ── */
    .tm-tabs-wrap  {
      background:#fff; border-bottom:1px solid rgba(201,162,39,.15);
      position:sticky; top:64px; z-index:10;
      box-shadow:0 4px 16px rgba(17,17,17,.06);
    }
    .tm-tabs       { display:flex; overflow-x:auto; scrollbar-width:none; padding:0 1.2rem; }
    .tm-tabs::-webkit-scrollbar { display:none; }
    .tm-tab        {
      flex-shrink:0; padding:.85rem 1rem; border:none; background:none;
      font-family:inherit; font-size:13px; font-weight:700; color:var(--muted);
      cursor:pointer; border-bottom:2.5px solid transparent;
      transition:color .2s,border-color .2s;
    }
    .tm-tab.active { color:var(--black); border-bottom-color:var(--gold); }
    .tm-tab-pane   { display:none; }
    .tm-tab-pane.active { display:block; animation:tmFadeUp .22s ease; }

    /* ── STATS GRID ── */
    .tm-stats-6    { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
    .tm-stat-box   {
      background:linear-gradient(160deg,#fff,#fdfbf5);
      border:1.5px solid rgba(201,162,39,.18); border-radius:20px;
      padding:1.1rem 1rem; position:relative; overflow:hidden;
      box-shadow:0 6px 28px rgba(17,17,17,.07),inset 0 1px 0 #fff;
      transition:transform .25s,box-shadow .25s;
    }
    .tm-stat-box::before {
      content:''; position:absolute; top:0; left:0; right:0; height:2px;
      background:linear-gradient(90deg,transparent,rgba(201,162,39,.5),transparent);
    }
    .tm-stat-box:hover { transform:translateY(-4px); box-shadow:0 14px 40px rgba(17,17,17,.1); }
    .tm-stat-box.full { grid-column:span 2; }
    .tm-stat-box-icon { font-size:22px; margin-bottom:.5rem; }
    .tm-stat-box-num  { font-size:22px; font-weight:800; color:var(--gold-dk); letter-spacing:-.02em; }
    .tm-stat-box-lbl  { font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:.07em; font-weight:700; margin-top:3px; }
    .tm-stat-box-delta { font-size:10px; color:#16a34a; font-weight:700; margin-top:3px; }

    /* ── MEMBERS SEARCH & FILTER ── */
    .tm-search-wrap {
      position:relative; margin-bottom:.9rem;
      background:#fff; border:1.5px solid rgba(201,162,39,.2);
      border-radius:13px; display:flex; align-items:center; gap:10px;
      padding:0 14px;
      box-shadow:0 4px 16px rgba(17,17,17,.06),inset 0 1px 0 #fff;
    }
    .tm-search-icon { font-size:14px; color:var(--muted); flex-shrink:0; }
    .tm-search-inp  {
      flex:1; border:none; background:none; font-family:inherit;
      font-size:13px; color:var(--black); padding:.75rem 0; outline:none;
    }
    .tm-filter-row  { display:flex; gap:7px; overflow-x:auto; scrollbar-width:none; margin-bottom:.9rem; padding-bottom:2px; }
    .tm-filter-row::-webkit-scrollbar { display:none; }
    .tm-filter-btn  {
      flex-shrink:0; padding:6px 14px; border-radius:999px; font-size:11px; font-weight:700;
      border:1.5px solid rgba(201,162,39,.2); background:linear-gradient(145deg,#fff,#fdfbf5);
      color:var(--muted); cursor:pointer; font-family:inherit; transition:all .18s;
    }
    .tm-filter-btn.sel { background:var(--black); border-color:var(--black); color:var(--gold); box-shadow:0 4px 14px rgba(0,0,0,.15); }
    .tm-members-list { display:flex; flex-direction:column; gap:8px; }
    .tm-member-row  {
      display:flex; align-items:center; gap:11px;
      background:linear-gradient(160deg,#fff,#fdfbf5);
      border:1.5px solid rgba(201,162,39,.12); border-radius:18px;
      padding:11px 13px;
      box-shadow:0 4px 16px rgba(17,17,17,.06),inset 0 1px 0 #fff;
      transition:all .2s;
    }
    .tm-member-row:hover { border-color:rgba(201,162,39,.3); transform:translateX(3px); }
    .tm-mem-av  {
      width:40px; height:40px; border-radius:50%; flex-shrink:0;
      background:linear-gradient(135deg,#C9A227,#FFD66E);
      display:flex; align-items:center; justify-content:center;
      font-size:14px; font-weight:800; color:#111;
      box-shadow:0 3px 10px rgba(201,162,39,.3);
    }
    .tm-mem-name { font-size:13px; font-weight:700; color:var(--black); }
    .tm-mem-lv   { font-size:10px; color:var(--muted); font-weight:600; margin-top:1px; }
    .tm-mem-status {
      font-size:9px; font-weight:800; padding:3px 9px; border-radius:999px;
      margin-left:auto; letter-spacing:.04em;
    }
    .tm-mem-active   { background:rgba(34,197,94,.1); color:#16a34a; border:1px solid rgba(34,197,94,.25); }
    .tm-mem-inactive { background:rgba(17,17,17,.07); color:var(--muted); }

    /* ── FINANCIALS ── */
    .tm-fin-summary {
      display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:1.2rem;
    }
    .tm-fin-card {
      background:linear-gradient(160deg,#fff,#fdfbf5);
      border:1.5px solid rgba(201,162,39,.18); border-radius:20px;
      padding:1.1rem; text-align:center;
      box-shadow:0 6px 24px rgba(17,17,17,.07),inset 0 1px 0 #fff;
      position:relative; overflow:hidden;
    }
    .tm-fin-card::before {
      content:''; position:absolute; top:0; left:0; right:0; height:2px;
      background:linear-gradient(90deg,transparent,rgba(201,162,39,.5),transparent);
    }
    .tm-fin-lbl { font-size:9px; font-weight:800; color:var(--muted); letter-spacing:.08em; text-transform:uppercase; margin-bottom:.5rem; }
    .tm-fin-num { font-size:20px; font-weight:800; letter-spacing:-.02em; }
    .tm-fin-sub { font-size:9px; color:var(--muted); margin-top:3px; }
    .tm-fin-section-lbl {
      font-size:10px; font-weight:800; color:var(--muted);
      letter-spacing:.12em; text-transform:uppercase; margin-bottom:.6rem;
    }
    .tm-fin-list {
      background:#fff; border:1.5px solid rgba(201,162,39,.15);
      border-radius:18px; padding:0 14px; margin-bottom:1.2rem;
      box-shadow:0 4px 16px rgba(17,17,17,.06),inset 0 1px 0 #fff;
    }
    .tm-fin-row {
      display:flex; align-items:center; gap:12px;
      padding:11px 0; border-bottom:1px solid rgba(201,162,39,.08);
    }
    .tm-fin-row:last-child { border-bottom:none; }
    .tm-fin-row-icon { font-size:18px; }
    .tm-fin-row-name { font-size:13px; font-weight:600; color:var(--black); flex:1; }
    .tm-fin-row-amt  { font-size:13px; font-weight:800; }

    /* ── FINAL CTA ── */
    .tm-final-cta {
      margin:1.4rem 1.2rem 0;
      background:linear-gradient(155deg,#0a0a0a 0%,#141008 50%,#0d0d0d 100%);
      border-radius:24px; padding:2rem 1.4rem; text-align:center;
      position:relative; overflow:hidden;
      box-shadow:0 12px 48px rgba(0,0,0,.2);
    }
    .tm-final-cta::before {
      content:''; position:absolute; top:0; left:0; right:0; height:2px;
      background:linear-gradient(90deg,transparent,rgba(201,162,39,.7),transparent);
    }
    .tm-final-cta::after {
      content:''; position:absolute; top:-60px; left:50%; transform:translateX(-50%);
      width:280px; height:280px; border-radius:50%;
      background:radial-gradient(circle,rgba(201,162,39,.15) 0%,transparent 65%);
      pointer-events:none;
    }
    .tm-cta-h   {
      font-family:'Playfair Display',serif;
      font-size:26px; font-weight:700; color:#fff; margin-bottom:.6rem;
      position:relative; z-index:1;
    }
    .tm-cta-h em { color:var(--gold); font-style:italic; }
    .tm-cta-p   { font-size:12px; color:#777; line-height:1.7; margin-bottom:1.4rem; position:relative; z-index:1; }
    .tm-cta-big {
      display:inline-flex; align-items:center; gap:8px;
      padding:13px 28px; border-radius:14px; border:none; cursor:pointer;
      font-family:inherit; font-size:14px; font-weight:900;
      background:linear-gradient(135deg,#C9A227,#FFD66E,#9B7A10,#C9A227);
      background-size:300% 100%; color:#111;
      animation:tmShimmer 3s linear infinite;
      box-shadow:0 6px 24px rgba(201,162,39,.4);
      position:relative; z-index:1; margin-bottom:1rem;
      transition:transform .2s;
    }
    .tm-cta-big:hover { transform:translateY(-2px); box-shadow:0 10px 32px rgba(201,162,39,.55); }
    .tm-share-row  { display:flex; justify-content:center; gap:9px; position:relative; z-index:1; }
    .tm-share-sm   {
      padding:8px 14px; border-radius:11px; border:1.5px solid rgba(255,255,255,.12);
      background:rgba(255,255,255,.05); color:#888; font-size:11px; font-weight:700;
      cursor:pointer; font-family:inherit; transition:all .2s;
    }
    .tm-share-sm:hover { border-color:rgba(201,162,39,.4); color:var(--gold); background:rgba(201,162,39,.08); }

    /* ── PAGE: WALLET ── */
        /* ── PAGE: WALLET ── */
    .wallet-page { padding: 0 0 1.5rem; }

    /* Balance card — full-bleed premium */
    .wallet-hero {
      background:linear-gradient(160deg,#0d0d0d 0%,#161208 60%,#0d0d0d 100%);
      padding:1.8rem 1.4rem 2rem; position:relative; overflow:hidden;
    }
    .wallet-hero::after {
      content:''; position:absolute; bottom:0; left:0; right:0; height:1px;
      background:linear-gradient(90deg,transparent,rgba(201,162,39,.3),transparent);
    }
    .wallet-hero-glow {
      position:absolute; top:-50px; right:-50px; width:220px; height:220px;
      background:radial-gradient(circle,rgba(201,162,39,.13) 0%,transparent 70%);
      pointer-events:none;
    }
    .wallet-hero-label {
      position:relative; z-index:1;
      font-size:10px; font-weight:700; color:#555;
      letter-spacing:.14em; text-transform:uppercase; margin-bottom:.5rem;
    }
    .wallet-balance-num {
      position:relative; z-index:1;
      font-size:44px; font-weight:800; color:#fff; letter-spacing:-.03em; line-height:1;
      margin-bottom:.3rem;
    }
    .wallet-bal-usdt {
      position:relative; z-index:1;
      font-size:12px; color:var(--gold); font-weight:600;
    }
    .wallet-action-btns {
      display:grid; grid-template-columns:1fr 1fr; gap:10px;
      margin-top:1.4rem; position:relative; z-index:1;
    }
    .wallet-act-btn {
      padding:13px; border-radius:12px; font-size:13px; font-weight:700;
      cursor:pointer; font-family:inherit; border:none;
      display:flex; align-items:center; justify-content:center; gap:8px; transition:all .2s;
    }
    .wallet-act-deposit  { background:var(--gold); color:var(--black); }
    .wallet-act-deposit:hover  { background:var(--gold-lt); }
    .wallet-act-withdraw { background:rgba(255,255,255,.07); color:#ccc; border:1px solid rgba(255,255,255,.1); }
    .wallet-act-withdraw:hover { border-color:rgba(201,162,39,.4); color:var(--gold); }

    /* Wallet body sections */
    .wallet-body { padding:0 1.2rem; }
    .wallet-section-lbl {
      font-size:10px; font-weight:700; color:var(--muted);
      letter-spacing:.12em; text-transform:uppercase;
      padding:1.1rem 0 .6rem;
    }

    /* Networks */
    .wallet-networks { display:flex; flex-direction:column; gap:8px; }
    .wallet-net-card {
      background:var(--card); border:1px solid var(--border);
      border-radius:14px; padding:1rem 1.2rem;
      display:flex; align-items:center; gap:13px; cursor:pointer; transition:all .2s;
      box-shadow:0 1px 8px rgba(17,17,17,.04);
    }
    .wallet-net-card:hover { border-color:rgba(201,162,39,.35); transform:translateY(-1px); box-shadow:0 4px 16px rgba(201,162,39,.1); }
    .wallet-net-icon {
      width:42px; height:42px; border-radius:12px; background:var(--bg2);
      display:flex; align-items:center; justify-content:center;
      font-size:18px; flex-shrink:0;
    }
    .wallet-net-name { font-size:14px; font-weight:700; color:var(--black); }
    .wallet-net-sub  { font-size:11px; color:var(--muted); margin-top:2px; }
    .wallet-net-badge {
      margin-left:auto; font-size:9px; font-weight:700;
      padding:3px 9px; border-radius:999px; flex-shrink:0;
      letter-spacing:.04em;
    }
    .wnet-active  { background:rgba(34,197,94,.1);  color:#16a34a; }
    .wnet-fast    { background:rgba(59,130,246,.1);  color:#2563eb; }

    /* Transactions */
    .wallet-tx-list  { display:flex; flex-direction:column; gap:8px; }
    .wallet-tx {
      background:var(--card); border:1px solid var(--border); border-radius:14px;
      padding:1rem 1.2rem; display:flex; align-items:center; gap:12px;
      box-shadow:0 1px 6px rgba(17,17,17,.04); transition:background .15s;
    }
    .wallet-tx:hover { background:#FDFCF9; }
    .tx-icon {
      width:40px; height:40px; border-radius:12px;
      display:flex; align-items:center; justify-content:center;
      font-size:16px; flex-shrink:0;
    }
    .tx-icon.dep { background:rgba(34,197,94,.12);  color:#16a34a; }
    .tx-icon.wit { background:rgba(239,68,68,.1);   color:#dc2626; }
    .tx-icon.pro { background:rgba(201,162,39,.12); color:var(--gold-dk); }
    .tx-info { flex:1; min-width:0; }
    .tx-type { font-size:13px; font-weight:700; color:var(--black); }
    .tx-date { font-size:11px; color:var(--muted); margin-top:2px; }
    .tx-right { text-align:right; flex-shrink:0; }
    .tx-amt { font-size:14px; font-weight:800; }
    .tx-amt.pos { color:#16a34a; }
    .tx-amt.neg { color:#dc2626; }
    .tx-status {
      display:inline-block; font-size:9px; font-weight:700;
      padding:2px 8px; border-radius:999px; margin-top:3px; letter-spacing:.04em;
    }
    .tx-st-done    { background:rgba(34,197,94,.1);  color:#16a34a; }
    .tx-st-pending { background:rgba(201,162,39,.1); color:var(--gold-dk); }
    .tx-st-failed  { background:rgba(239,68,68,.1);  color:#dc2626; }

    /* ══════════════════════════════════════════════════════════════
       PAGE: ABOUT — Premium Luxury Redesign
    ══════════════════════════════════════════════════════════════ */
    @keyframes ab-float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes ab-glow     { 0%,100%{opacity:.5} 50%{opacity:1} }
    @keyframes ab-spin-slow{ to{transform:rotate(360deg)} }
    @keyframes ab-counter  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ab-shimmer  { 0%{background-position:-200% center} 100%{background-position:200% center} }
    @keyframes ab-connector{ 0%{width:0;opacity:0} 100%{width:100%;opacity:1} }
    @keyframes ab-fadeup   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ab-particle { 0%{transform:translate(0,0) scale(1);opacity:.8} 100%{transform:translate(var(--px),var(--py)) scale(0);opacity:0} }
    @keyframes ab-coin-spin{ 0%,100%{transform:rotateY(0deg) translateY(0)} 50%{transform:rotateY(180deg) translateY(-6px)} }

    .about-page { padding: 0 0 0; background: var(--bg); }

    /* ── HERO ── */
    .ab-hero {
      background: #0d0d0d;
      position: relative; overflow: hidden;
      padding: 3rem 1.4rem 2.5rem;
      min-height: 400px;
      display: flex; flex-direction: column; justify-content: center;
    }
    .ab-hero-bg {
      position: absolute; inset: 0; pointer-events: none;
      background: radial-gradient(ellipse 70% 60% at 50% 0%, rgba(201,162,39,.18) 0%, transparent 65%),
                  radial-gradient(ellipse 40% 40% at 90% 80%, rgba(201,162,39,.10) 0%, transparent 60%),
                  radial-gradient(ellipse 30% 30% at 10% 80%, rgba(201,162,39,.07) 0%, transparent 60%);
    }
    .ab-hero-line {
      position: absolute; top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(201,162,39,.6), transparent);
    }
    .ab-hero-grid {
      position: absolute; inset: 0; pointer-events: none; opacity: .04;
      background-image: linear-gradient(rgba(201,162,39,.5) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(201,162,39,.5) 1px, transparent 1px);
      background-size: 40px 40px;
    }
    .ab-hero-particles { position: absolute; inset: 0; pointer-events: none; }
    .ab-hero-ptcl {
      position: absolute; width: 4px; height: 4px; border-radius: 50%;
      background: var(--gold); animation: ab-particle 4s ease-out infinite;
    }
    .ab-hero-content { position: relative; z-index: 2; }
    .ab-hero-tag {
      display: inline-flex; align-items: center; gap: 7px;
      background: rgba(201,162,39,.12); border: 1px solid rgba(201,162,39,.3);
      border-radius: 999px; padding: 5px 14px;
      font-size: 10px; font-weight: 700; color: var(--gold); letter-spacing: .12em;
      text-transform: uppercase; margin-bottom: 1.2rem;
    }
    .ab-hero-tag-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); animation: ab-glow 2s ease infinite; }
    .ab-hero-h1 {
      font-family: 'Playfair Display', serif;
      font-size: clamp(26px, 7vw, 42px); font-weight: 700; color: #fff;
      line-height: 1.15; margin-bottom: .9rem;
    }
    .ab-hero-h1 em { color: var(--gold); font-style: italic; }
    .ab-hero-sub { font-size: 14px; color: #999; line-height: 1.75; max-width: 340px; margin-bottom: 1.8rem; }
    .ab-hero-btns { display: flex; gap: 12px; flex-wrap: wrap; }
    .ab-btn-primary {
      padding: 13px 26px; border-radius: 13px; border: none; cursor: pointer;
      font-family: inherit; font-size: 14px; font-weight: 800; letter-spacing: .03em;
      background: linear-gradient(135deg, #C9A227, #FFD66E, #9B7A10, #C9A227);
      background-size: 300% 100%; color: #111;
      box-shadow: 0 6px 24px rgba(201,162,39,.45);
      animation: ab-shimmer 3s linear infinite;
      transition: transform .2s, box-shadow .2s;
    }
    .ab-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(201,162,39,.6); }
    .ab-btn-ghost {
      padding: 13px 26px; border-radius: 13px; cursor: pointer;
      font-family: inherit; font-size: 14px; font-weight: 700;
      background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.15);
      color: #ddd; transition: all .2s;
    }
    .ab-btn-ghost:hover { background: rgba(255,255,255,.1); border-color: rgba(201,162,39,.4); color: var(--gold); }
    /* 3D shield illustration */
    .ab-hero-shield {
      position: absolute; right: -10px; top: 50%; transform: translateY(-50%);
      width: 160px; height: 160px; pointer-events: none;
      animation: ab-float 5s ease-in-out infinite;
      display: flex; align-items: center; justify-content: center;
    }
    .ab-shield-svg { filter: drop-shadow(0 0 30px rgba(201,162,39,.5)); }
    .ab-coin {
      position: absolute; width: 28px; height: 28px; border-radius: 50%;
      background: linear-gradient(135deg, #FFD66E, #C9A227, #9B7A10);
      border: 2px solid rgba(255,214,110,.5);
      box-shadow: 0 4px 12px rgba(201,162,39,.5), inset 0 1px 0 rgba(255,255,255,.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 900; color: #5a3d00;
    }
    .ab-coin-1 { top: 15%; right: 120px; animation: ab-float 4s ease-in-out infinite .5s; }
    .ab-coin-2 { top: 55%; right: 155px; animation: ab-float 3.5s ease-in-out infinite 1s; }
    .ab-coin-3 { top: 75%; right: 100px; animation: ab-float 5s ease-in-out infinite 1.5s; }
    .ab-hero-glow {
      position: absolute; right: 30px; top: 50%; transform: translateY(-50%);
      width: 200px; height: 200px; border-radius: 50%; pointer-events: none;
      background: radial-gradient(circle, rgba(201,162,39,.15) 0%, transparent 70%);
      filter: blur(40px);
    }

    /* ── SECTION WRAPPER ── */
    .ab-section { padding: 2.5rem 1.4rem; }
    .ab-section-tag {
      display: inline-block;
      font-size: 10px; font-weight: 700; letter-spacing: .14em; color: var(--gold-dk);
      text-transform: uppercase; margin-bottom: .5rem;
    }
    .ab-section-h {
      font-family: 'Playfair Display', serif;
      font-size: 24px; font-weight: 700; color: var(--black);
      line-height: 1.2; margin-bottom: 1.5rem;
    }
    .ab-section-h em { color: var(--gold); font-style: italic; }
    .ab-divider {
      height: 1px; margin: 0;
      background: linear-gradient(90deg, transparent, var(--border), transparent);
    }

    /* ── GOAL CARDS ── */
    .ab-goal-grid { display: grid; gap: 14px; }
    .ab-goal-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 20px; padding: 1.5rem;
      position: relative; overflow: hidden;
      box-shadow: 0 2px 20px rgba(17,17,17,.06), inset 0 1px 0 rgba(255,255,255,.8);
      transition: transform .25s, box-shadow .25s;
    }
    .ab-goal-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, transparent, rgba(201,162,39,.5), transparent);
    }
    .ab-goal-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(17,17,17,.1), inset 0 1px 0 rgba(255,255,255,.8); }
    .ab-goal-icon {
      width: 48px; height: 48px; border-radius: 14px;
      background: linear-gradient(135deg, #111, #2a2a2a);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; margin-bottom: 1rem;
      box-shadow: 0 4px 16px rgba(0,0,0,.15), inset 0 1px 0 rgba(255,255,255,.07);
    }
    .ab-goal-title { font-size: 15px; font-weight: 700; color: var(--black); margin-bottom: .5rem; }
    .ab-goal-text { font-size: 13px; color: var(--muted); line-height: 1.7; }
    .ab-goal-shine {
      position: absolute; top: -40px; right: -40px; width: 120px; height: 120px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(201,162,39,.08) 0%, transparent 70%);
      pointer-events: none;
    }

    /* ── WHY CHOOSE ── */
    .ab-why-bg { background: var(--bg2); }
    .ab-why-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .ab-why-card {
      background: var(--card);
      border: 1px solid rgba(229,226,220,.8);
      border-radius: 20px; padding: 1.3rem 1rem;
      text-align: center;
      position: relative; overflow: hidden;
      box-shadow: 0 4px 20px rgba(17,17,17,.05), 0 1px 0 rgba(255,255,255,.9),
                  inset 0 -1px 0 rgba(17,17,17,.04);
      transition: transform .25s, box-shadow .25s, border-color .25s;
    }
    .ab-why-card::after {
      content: ''; position: absolute; inset: 0; border-radius: 20px;
      border: 1px solid transparent;
      background: linear-gradient(135deg, rgba(201,162,39,.15), transparent, rgba(201,162,39,.1)) border-box;
      -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: destination-out; mask-composite: exclude;
      opacity: 0; transition: opacity .25s;
    }
    .ab-why-card:hover { transform: translateY(-6px); box-shadow: 0 16px 48px rgba(17,17,17,.1), inset 0 1px 0 rgba(255,255,255,.9); border-color: rgba(201,162,39,.3); }
    .ab-why-card:hover::after { opacity: 1; }
    .ab-why-icon-wrap {
      width: 56px; height: 56px; border-radius: 18px; margin: 0 auto .9rem;
      background: linear-gradient(135deg, #111 0%, #2a2a2a 100%);
      display: flex; align-items: center; justify-content: center; font-size: 22px;
      box-shadow: 0 6px 20px rgba(0,0,0,.2), 0 2px 4px rgba(0,0,0,.15),
                  inset 0 1px 0 rgba(255,255,255,.08);
    }
    .ab-why-title { font-size: 12px; font-weight: 700; color: var(--black); line-height: 1.35; }
    .ab-why-badge {
      display: inline-block; margin-top: .5rem;
      font-size: 9px; font-weight: 700; color: var(--gold-dk);
      background: rgba(201,162,39,.1); border: 1px solid rgba(201,162,39,.25);
      border-radius: 999px; padding: 2px 8px; letter-spacing: .05em;
    }

    /* ── HOW IT WORKS TIMELINE ── */
    .ab-hiw-bg { background: var(--black); }
    .ab-hiw-tag { color: var(--gold) !important; }
    .ab-hiw-h { color: #fff !important; }
    .ab-timeline { display: flex; flex-direction: column; gap: 0; position: relative; }
    .ab-tl-item {
      display: flex; gap: 16px; align-items: flex-start;
      padding-bottom: 20px; position: relative;
    }
    .ab-tl-item:last-child { padding-bottom: 0; }
    .ab-tl-left { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
    .ab-tl-circle {
      width: 52px; height: 52px; border-radius: 50%;
      background: linear-gradient(135deg, rgba(201,162,39,.15), rgba(201,162,39,.05));
      border: 1.5px solid rgba(201,162,39,.4);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; position: relative;
      box-shadow: 0 0 0 6px rgba(201,162,39,.06), 0 4px 16px rgba(0,0,0,.3);
      backdrop-filter: blur(8px);
      transition: all .3s;
    }
    .ab-tl-circle:hover { background: linear-gradient(135deg, rgba(201,162,39,.3), rgba(201,162,39,.1)); box-shadow: 0 0 0 8px rgba(201,162,39,.1), 0 0 24px rgba(201,162,39,.3); }
    .ab-tl-num { font-size: 16px; font-weight: 800; color: var(--gold); }
    .ab-tl-line {
      flex: 1; width: 2px; min-height: 24px;
      background: linear-gradient(to bottom, rgba(201,162,39,.5), rgba(201,162,39,.1));
      margin-top: 4px; position: relative; overflow: hidden;
    }
    .ab-tl-line::after {
      content: ''; position: absolute; top: -100%; left: 0; right: 0; height: 50%;
      background: linear-gradient(to bottom, transparent, rgba(201,162,39,.8), transparent);
      animation: ab-float 2s linear infinite;
    }
    .ab-tl-content {
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 16px; padding: 1.1rem 1.2rem; flex: 1;
      backdrop-filter: blur(4px);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
      transition: all .25s;
    }
    .ab-tl-content:hover { background: rgba(255,255,255,.07); border-color: rgba(201,162,39,.25); }
    .ab-tl-step-lbl { font-size: 9px; font-weight: 700; color: var(--gold); letter-spacing: .12em; margin-bottom: 4px; }
    .ab-tl-step-title { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 3px; }
    .ab-tl-step-desc { font-size: 12px; color: #888; line-height: 1.55; }

    /* ── STATISTICS ── */
    .ab-stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .ab-stat-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 20px; padding: 1.4rem 1rem; text-align: center;
      position: relative; overflow: hidden;
      box-shadow: 0 4px 24px rgba(17,17,17,.07),
                  inset 0 1px 0 rgba(255,255,255,.9),
                  inset 0 -1px 0 rgba(17,17,17,.03);
      transition: transform .25s, box-shadow .25s;
    }
    .ab-stat-card::before {
      content: ''; position: absolute; bottom: 0; left: 20%; right: 20%; height: 2px;
      background: linear-gradient(90deg, transparent, rgba(201,162,39,.5), transparent);
    }
    .ab-stat-card:hover { transform: translateY(-4px); box-shadow: 0 14px 40px rgba(17,17,17,.1), inset 0 1px 0 rgba(255,255,255,.9); }
    .ab-stat-icon { font-size: 22px; margin-bottom: .6rem; }
    .ab-stat-num {
      font-size: 26px; font-weight: 800; color: var(--gold);
      letter-spacing: -.02em; line-height: 1;
      font-variant-numeric: tabular-nums;
    }
    .ab-stat-lbl { font-size: 10px; color: var(--muted); margin-top: 5px; letter-spacing: .08em; font-weight: 600; text-transform: uppercase; }
    .ab-stat-shine {
      position: absolute; top: -30px; right: -30px; width: 100px; height: 100px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(201,162,39,.07) 0%, transparent 70%);
    }

    /* ── SECURITY ── */
    .ab-sec-bg { background: #0d0d0d; }
    .ab-sec-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .ab-sec-card {
      background: rgba(255,255,255,.03);
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 20px; padding: 1.3rem 1.1rem;
      position: relative; overflow: hidden;
      backdrop-filter: blur(8px);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.05), 0 4px 20px rgba(0,0,0,.2);
      transition: all .25s;
    }
    .ab-sec-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(201,162,39,.4), transparent);
    }
    .ab-sec-card:hover { background: rgba(255,255,255,.06); border-color: rgba(201,162,39,.25); transform: translateY(-4px); box-shadow: inset 0 1px 0 rgba(255,255,255,.07), 0 12px 36px rgba(0,0,0,.3), 0 0 20px rgba(201,162,39,.07); }
    .ab-sec-icon-wrap {
      width: 44px; height: 44px; border-radius: 13px;
      background: linear-gradient(135deg, rgba(201,162,39,.15), rgba(201,162,39,.05));
      border: 1px solid rgba(201,162,39,.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; margin-bottom: .9rem;
      box-shadow: 0 0 12px rgba(201,162,39,.1);
    }
    .ab-sec-title { font-size: 12px; font-weight: 700; color: #fff; margin-bottom: 4px; line-height: 1.35; }
    .ab-sec-desc { font-size: 11px; color: #777; line-height: 1.6; }
    .ab-sec-glow {
      position: absolute; bottom: -20px; right: -20px; width: 80px; height: 80px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(201,162,39,.08) 0%, transparent 70%);
    }

    /* ── NETWORKS ── */
    .ab-net-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .ab-net-card {
      background: var(--card);
      border: 1.5px solid var(--border);
      border-radius: 22px; padding: 1.8rem 1.2rem; text-align: center;
      position: relative; overflow: hidden;
      box-shadow: 0 6px 30px rgba(17,17,17,.07),
                  inset 0 1px 0 rgba(255,255,255,.9);
      transition: all .25s;
    }
    .ab-net-card:hover { border-color: rgba(201,162,39,.4); transform: translateY(-5px); box-shadow: 0 16px 48px rgba(17,17,17,.1), inset 0 1px 0 rgba(255,255,255,.9), 0 0 24px rgba(201,162,39,.08); }
    .ab-net-logo {
      width: 60px; height: 60px; border-radius: 18px; margin: 0 auto 1rem;
      display: flex; align-items: center; justify-content: center; font-size: 28px;
      box-shadow: 0 6px 20px rgba(0,0,0,.1);
    }
    .ab-net-name { font-size: 16px; font-weight: 800; color: var(--black); margin-bottom: 4px; }
    .ab-net-sub { font-size: 11px; color: var(--muted); margin-bottom: .8rem; }
    .ab-net-badge {
      display: inline-flex; align-items: center; gap: 5px;
      background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.3);
      border-radius: 999px; padding: 4px 12px;
      font-size: 10px; font-weight: 700; color: #16a34a; letter-spacing: .06em;
    }
    .ab-net-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; animation: ab-glow 1.5s ease infinite; }

    /* ── WHITEPAPER ── */
    .ab-wp-bg { background: var(--bg2); }
    .ab-wp-inner {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 24px; padding: 2rem 1.4rem; text-align: center;
      box-shadow: 0 8px 40px rgba(17,17,17,.08), inset 0 1px 0 rgba(255,255,255,.9);
      position: relative; overflow: hidden;
    }
    .ab-wp-inner::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, transparent, var(--gold), transparent);
    }
    .ab-book {
      width: 100px; height: 130px; margin: 0 auto 1.5rem;
      position: relative; animation: ab-float 4s ease-in-out infinite;
    }
    .ab-book-body {
      width: 100%; height: 100%; border-radius: 4px 12px 12px 4px;
      background: linear-gradient(135deg, #1a1208, #2a1e08, #3a2d10);
      border: 1px solid rgba(201,162,39,.4);
      box-shadow: -6px 6px 0 rgba(0,0,0,.2), -4px 4px 0 rgba(0,0,0,.15),
                  0 20px 40px rgba(0,0,0,.2), 0 0 30px rgba(201,162,39,.1);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 8px; padding: 16px;
      position: relative; overflow: hidden;
    }
    .ab-book-body::before {
      content: ''; position: absolute; top: 0; bottom: 0; left: 10px; width: 4px;
      background: rgba(201,162,39,.2); border-radius: 0;
    }
    .ab-book-body::after {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(201,162,39,.06) 0%, transparent 60%);
    }
    .ab-book-icon { font-size: 28px; position: relative; z-index: 1; }
    .ab-book-text { font-size: 9px; font-weight: 800; color: var(--gold); letter-spacing: .12em; text-align: center; position: relative; z-index: 1; line-height: 1.4; }
    .ab-wp-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: var(--black); margin-bottom: .6rem; }
    .ab-wp-title em { color: var(--gold); font-style: italic; }
    .ab-wp-desc { font-size: 13px; color: var(--muted); line-height: 1.7; margin-bottom: 1.4rem; }
    .ab-wp-btn {
      display: inline-flex; align-items: center; gap: 9px;
      padding: 13px 28px; border-radius: 13px; border: none; cursor: pointer;
      font-family: inherit; font-size: 14px; font-weight: 800;
      background: linear-gradient(135deg, #111, #2a2a2a); color: var(--gold);
      box-shadow: 0 6px 24px rgba(0,0,0,.2);
      transition: all .2s;
    }
    .ab-wp-btn:hover { background: linear-gradient(135deg, #C9A227, #9B7A10); color: #111; transform: translateY(-2px); box-shadow: 0 10px 32px rgba(201,162,39,.4); }

    /* ── FAQ ── */
    .ab-faq-list { display: flex; flex-direction: column; gap: 10px; }
    .ab-faq-item {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 16px; overflow: hidden;
      box-shadow: 0 2px 12px rgba(17,17,17,.04);
      transition: border-color .2s;
    }
    .ab-faq-item.open { border-color: rgba(201,162,39,.3); }
    .ab-faq-q {
      width: 100%; display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.2rem; background: none; border: none; cursor: pointer;
      font-family: inherit; text-align: left;
      transition: background .15s;
    }
    .ab-faq-q:hover { background: rgba(201,162,39,.03); }
    .ab-faq-q-text { font-size: 14px; font-weight: 600; color: var(--black); line-height: 1.4; }
    .ab-faq-chevron {
      width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
      background: var(--bg2); border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; color: var(--muted); margin-left: 12px;
      transition: transform .3s, background .2s, color .2s;
    }
    .ab-faq-item.open .ab-faq-chevron { transform: rotate(180deg); background: rgba(201,162,39,.1); border-color: rgba(201,162,39,.3); color: var(--gold); }
    .ab-faq-answer {
      max-height: 0; overflow: hidden;
      transition: max-height .35s cubic-bezier(.4,0,.2,1), padding .25s;
    }
    .ab-faq-item.open .ab-faq-answer { max-height: 300px; }
    .ab-faq-answer-inner {
      padding: 0 1.2rem 1.1rem;
      font-size: 13px; color: var(--muted); line-height: 1.7;
      border-top: 1px solid var(--border); padding-top: .9rem; margin-top: 0;
    }

    /* ── COMMUNITY ── */
    .ab-comm-bg { background: var(--bg2); }
    .ab-comm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .ab-comm-card {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 20px; padding: 1.3rem 1rem; text-align: center;
      box-shadow: 0 4px 20px rgba(17,17,17,.05), inset 0 1px 0 rgba(255,255,255,.9);
      transition: all .25s; cursor: pointer;
    }
    .ab-comm-card:hover { transform: translateY(-4px); border-color: rgba(201,162,39,.3); box-shadow: 0 12px 36px rgba(17,17,17,.1); }
    .ab-comm-icon { font-size: 26px; margin-bottom: .7rem; display: block; }
    .ab-comm-title { font-size: 13px; font-weight: 700; color: var(--black); margin-bottom: 3px; }
    .ab-comm-sub { font-size: 11px; color: var(--muted); }

    /* ── FOOTER ── */
    .ab-footer {
      background: #0d0d0d; padding: 2.5rem 1.4rem 1.5rem;
      position: relative; overflow: hidden;
    }
    .ab-footer::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(201,162,39,.4), transparent);
    }
    .ab-footer-brand { margin-bottom: 1.6rem; }
    .ab-footer-logo { display: flex; align-items: center; gap: 10px; margin-bottom: .5rem; }
    .ab-footer-logo-icon {
      width: 36px; height: 36px; border-radius: 10px;
      background: rgba(201,162,39,.1); border: 1px solid rgba(201,162,39,.3);
      display: flex; align-items: center; justify-content: center; font-size: 16px;
    }
    .ab-footer-brand-name { font-size: 16px; font-weight: 800; color: #fff; letter-spacing: .06em; }
    .ab-footer-tagline { font-size: 11px; color: #666; }
    .ab-footer-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.6rem; }
    .ab-footer-col-title { font-size: 10px; font-weight: 700; color: var(--gold); letter-spacing: .1em; text-transform: uppercase; margin-bottom: .8rem; }
    .ab-footer-link { display: block; font-size: 12px; color: #888; margin-bottom: .5rem; cursor: pointer; transition: color .15s; }
    .ab-footer-link:hover { color: #ddd; }
    .ab-footer-bottom {
      border-top: 1px solid rgba(255,255,255,.06); padding-top: 1.2rem;
      text-align: center; font-size: 11px; color: #555;
    }
    .ab-footer-copy em { color: var(--gold); font-style: normal; }

    /* Legacy fallback (unchanged pages that reference old classes) */
    .about-cta, .about-stats, .about-stat, .about-stat-num, .about-stat-lbl,
    .hiw-section, .sec-section, .sec-card, .sec-icon, .sec-title, .sec-desc,
    .btn-cta-gold { display: none !important; }

    /* ══ PROFILE & SETTINGS PAGE — FULL LUXURY REBUILD ══ */
    @keyframes pageSlideIn    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pf-glow-pulse  { 0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,0)} 60%{box-shadow:0 0 28px 4px rgba(212,175,55,.22)} }
    @keyframes pf-online-pulse{ 0%,100%{transform:scale(1);opacity:1}  50%{transform:scale(1.5);opacity:.5} }
    @keyframes pf-badge-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.5)} 60%{box-shadow:0 0 0 5px rgba(34,197,94,0)} }
    @keyframes pf-shimmer-card{ 0%{transform:translateX(-100%) skewX(-15deg)} 100%{transform:translateX(220%) skewX(-15deg)} }
    @keyframes pf-float-in    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

    .page.active#page-profile { animation: pageSlideIn .3s cubic-bezier(.16,1,.3,1); }
    #page-profile              { background:linear-gradient(180deg,#F5F0E8 0%,#FAF8F3 120px,#FAF8F3 100%); padding-bottom:110px; }

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       HERO — Clean Premium Profile Card
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    .pf-hero {
      background:linear-gradient(160deg,#0E0B04 0%,#1C1505 40%,#221806 70%,#0E0B04 100%);
      padding:1.6rem 1.4rem 5.6rem; position:relative; overflow:hidden;
      border-radius:0 0 36px 36px;
      box-shadow:0 14px 48px rgba(0,0,0,.2),0 4px 12px rgba(0,0,0,.1);
    }
    .pf-hero::before {
      content:''; position:absolute; inset:0;
      background:radial-gradient(ellipse 70% 60% at 60% 80%,rgba(212,175,55,.12) 0%,transparent 70%);
      pointer-events:none;
    }
    .pf-hero::after {
      content:''; position:absolute; bottom:0; left:8%; right:8%; height:1px;
      background:linear-gradient(90deg,transparent,rgba(212,175,55,.5),transparent);
    }
    .pf-hero-orb { display:none; }
    /* top bar */
    .pf-hero-top {
      display:flex; align-items:center; justify-content:space-between; margin-bottom:1.8rem;
    }
    .pf-back-btn {
      display:flex; align-items:center; gap:6px;
      background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.11);
      border-radius:12px; padding:8px 14px; color:rgba(255,255,255,.65); font-size:12px; font-weight:600;
      cursor:pointer; font-family:inherit; transition:all .2s;
    }
    .pf-back-btn:hover { background:rgba(255,255,255,.13); color:#fff; }
    .pf-page-title { font-size:12px; font-weight:700; color:rgba(255,255,255,.4); letter-spacing:.14em; text-transform:uppercase; }
    .pf-edit-btn {
      display:flex; align-items:center; gap:5px;
      background:rgba(212,175,55,.12); border:1px solid rgba(212,175,55,.28);
      border-radius:12px; padding:8px 14px; color:#D4AF37; font-size:12px; font-weight:700;
      cursor:pointer; font-family:inherit; transition:all .2s;
    }
    .pf-edit-btn:hover { background:rgba(212,175,55,.22); }

    /* user block — horizontal, avatar left */
    .pf-user-block { display:flex; align-items:center; gap:16px; }
    .pf-av-wrap    { position:relative; flex-shrink:0; }
    .pf-av-glow    { display:none; }
    .pf-av-ring1   { display:none; }
    .pf-av-ring2   { display:none; }
    .pf-av {
      width:70px; height:70px; border-radius:22px;
      background:linear-gradient(135deg,#E8C96B 0%,#D4AF37 50%,#9F7B16 100%);
      display:flex; align-items:center; justify-content:center;
      font-size:26px; font-weight:900; color:#3D2800;
      box-shadow:
        0 0 0 2px rgba(212,175,55,.5),
        0 8px 28px rgba(212,175,55,.3),
        0 2px 8px rgba(0,0,0,.4),
        inset 0 1px 0 rgba(255,255,255,.35);
      animation:pf-glow-pulse 3.5s ease-in-out infinite;
      letter-spacing:-.02em;
    }
    .pf-av-cam {
      position:absolute; bottom:-4px; right:-4px;
      width:22px; height:22px; border-radius:8px;
      background:linear-gradient(135deg,#E8C96B,#D4AF37);
      border:2px solid #0E0B04;
      display:flex; align-items:center; justify-content:center; font-size:11px; cursor:pointer;
    }
    .pf-online {
      position:absolute; top:-3px; right:-3px;
      width:12px; height:12px; border-radius:50%;
      background:#22c55e; border:2px solid #0E0B04;
      animation:pf-online-pulse 2.2s ease-in-out infinite;
    }
    .pf-user-info  { flex:1; min-width:0; }
    .pf-hero-eyebrow { display:none; }
    .pf-name {
      font-size:20px; font-weight:800; color:#fff; letter-spacing:-.02em; margin-bottom:3px;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    }
    .pf-email { font-size:11px; color:rgba(255,255,255,.4); margin-bottom:10px; letter-spacing:.01em; }
    .pf-uid {
      display:inline-flex; align-items:center; gap:6px;
      background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1);
      border-radius:999px; padding:4px 11px 4px 9px; margin-bottom:10px;
    }
    .pf-uid-lbl { font-size:9px; color:rgba(255,255,255,.3); letter-spacing:.1em; text-transform:uppercase; font-weight:700; }
    .pf-uid-val { font-size:11px; color:rgba(255,255,255,.6); font-family:monospace; letter-spacing:.06em; }
    .pf-uid-copy {
      display:flex; align-items:center; gap:3px;
      background:rgba(212,175,55,.15); border:1px solid rgba(212,175,55,.28);
      border-radius:999px; color:#D4AF37; cursor:pointer; font-size:10px; font-weight:700;
      padding:2px 8px; transition:all .18s; font-family:inherit;
    }
    .pf-uid-copy:hover { background:rgba(212,175,55,.28); }
    .pf-badge-row { display:flex; gap:6px; flex-wrap:wrap; }
    .pf-badge {
      display:inline-flex; align-items:center; gap:4px;
      padding:4px 11px; border-radius:999px; font-size:9px; font-weight:800; letter-spacing:.07em;
    }
    .pf-badge-verified { background:rgba(34,197,94,.14); color:#4ade80; border:1px solid rgba(34,197,94,.28); }
    .pf-badge-premium  { background:rgba(212,175,55,.14); color:#E8C96B; border:1px solid rgba(212,175,55,.28); }

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       MEMBERSHIP CARD — AmEx Centurion Style
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    .pf-mem-wrap {
      margin:-2.8rem 1.1rem 0; position:relative; z-index:2;
    }
    .pf-mem-card {
      background:linear-gradient(145deg,#1B1206 0%,#2A1C06 25%,#1B1206 50%,#2A1C06 75%,#1B1206 100%);
      border-radius:24px; padding:1.6rem; overflow:hidden; position:relative;
      box-shadow:
        0 0 0 1px rgba(212,175,55,.38),
        0 20px 60px rgba(0,0,0,.5),
        0 6px 20px rgba(0,0,0,.25),
        inset 0 1px 0 rgba(255,255,255,.09),
        inset 0 -1px 0 rgba(0,0,0,.35);
    }
    .pf-mem-card::before {
      content:''; position:absolute; top:-70px; right:-50px;
      width:240px; height:240px; border-radius:50%;
      background:radial-gradient(circle,rgba(212,175,55,.16) 0%,transparent 65%); pointer-events:none;
    }
    .pf-mem-card::after {
      content:''; position:absolute; top:0; left:0; right:0; height:1px;
      background:linear-gradient(90deg,transparent,rgba(212,175,55,.65),rgba(255,220,80,.9),rgba(212,175,55,.65),transparent);
    }
    .pf-mem-shine {
      position:absolute; top:0; left:0; right:0; bottom:0; pointer-events:none; overflow:hidden; border-radius:24px;
    }
    .pf-mem-shine::after {
      content:''; position:absolute; top:-50%; left:-30%; width:55%; height:200%;
      background:linear-gradient(105deg,transparent 35%,rgba(255,220,80,.06) 50%,transparent 65%);
      animation:pf-shimmer-card 4s ease-in-out infinite 1.5s;
    }
    .pf-mem-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.4rem; }
    .pf-mem-badge {
      display:inline-flex; align-items:center; gap:6px;
      background:rgba(212,175,55,.13); border:1px solid rgba(212,175,55,.3);
      border-radius:999px; padding:5px 14px; font-size:9px; font-weight:800; color:#D4AF37; letter-spacing:.12em;
    }
    .pf-mem-level { font-size:10px; color:rgba(255,255,255,.32); text-align:right; letter-spacing:.05em; }
    .pf-mem-level strong {
      display:block; font-size:22px; color:#E8C96B; font-weight:900;
      letter-spacing:-.02em; font-family:'Playfair Display',serif; line-height:1;
    }
    .pf-mem-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:1.4rem; }
    .pf-mem-stat {
      background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08);
      border-radius:16px; padding:.95rem .5rem; text-align:center;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 4px 14px rgba(0,0,0,.18);
      transition:transform .2s;
    }
    .pf-mem-stat:hover { transform:translateY(-2px); }
    .pf-mem-stat-num { font-size:19px; font-weight:900; color:#fff; letter-spacing:-.02em; font-family:'Playfair Display',serif; }
    .pf-mem-stat-lbl { font-size:8px; color:rgba(255,255,255,.32); margin-top:4px; letter-spacing:.1em; text-transform:uppercase; font-weight:700; }
    .pf-mem-expiry {
      display:flex; align-items:center; justify-content:space-between;
      margin-bottom:1.4rem; padding-bottom:1.2rem;
      border-bottom:1px solid rgba(212,175,55,.18);
    }
    .pf-mem-exp-lbl { font-size:10px; color:rgba(255,255,255,.32); letter-spacing:.06em; }
    .pf-mem-exp-val { font-size:12px; color:rgba(255,255,255,.65); font-weight:700; font-family:monospace; letter-spacing:.05em; }
    .pf-upgrade-btn {
      width:100%; padding:14px; border-radius:16px;
      background:linear-gradient(135deg,#E8C96B 0%,#D4AF37 40%,#A88823 70%,#D4AF37 100%);
      background-size:220% auto;
      color:#111; border:none; font-size:13px; font-weight:800;
      cursor:pointer; font-family:inherit; letter-spacing:.05em;
      transition:all .35s cubic-bezier(.16,1,.3,1);
      box-shadow:0 5px 22px rgba(212,175,55,.38),0 2px 7px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.38);
      position:relative; overflow:hidden;
    }
    .pf-upgrade-btn::after {
      content:''; position:absolute; top:0; left:-110%; width:65%; height:100%;
      background:linear-gradient(90deg,transparent,rgba(255,255,255,.28),transparent);
      transition:left .55s;
    }
    .pf-upgrade-btn:hover { background-position:right center; transform:translateY(-2px); box-shadow:0 10px 30px rgba(212,175,55,.48); }
    .pf-upgrade-btn:hover::after { left:145%; }
    .pf-upgrade-btn:active { transform:translateY(0) scale(.98); }

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       PAGE BODY — Off-white Luxury Sections
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    .pf-body { padding: 2rem 1.2rem 0; display:flex; flex-direction:column; gap:1.8rem; }
    .pf-group { display:flex; flex-direction:column; gap:0; }
    .pf-group-label {
      font-size:9px; font-weight:800; color:#9F7B16;
      letter-spacing:.2em; text-transform:uppercase;
      margin-bottom:.9rem; padding-left:4px;
    }
    .pf-group-cards { display:flex; flex-direction:column; gap:10px; }

    /* ── Individual Floating Card ── */
    .pf-fcard {
      background:#FFFFFF;
      border:1px solid rgba(229,226,220,.85);
      border-radius:20px;
      box-shadow:
        0 4px 20px rgba(17,17,17,.055),
        0 1px 4px rgba(17,17,17,.03),
        inset 0 1px 0 rgba(255,255,255,1);
      display:flex; align-items:center; gap:15px;
      padding:15px 16px;
      cursor:pointer; width:100%; text-align:left; font-family:inherit;
      border:none;
      background:#FFFFFF;
      border:1px solid rgba(229,226,220,.85);
      transition:all .25s cubic-bezier(.16,1,.3,1);
      position:relative; overflow:hidden;
    }
    .pf-fcard::before {
      content:''; position:absolute; left:0; top:0; bottom:0; width:3px;
      background:linear-gradient(180deg,rgba(212,175,55,0),rgba(212,175,55,.5),rgba(212,175,55,0));
      opacity:0; transition:opacity .25s;
    }
    .pf-fcard:hover {
      transform:translateY(-2px);
      box-shadow:0 10px 36px rgba(17,17,17,.09),0 3px 10px rgba(17,17,17,.05),inset 0 1px 0 #fff;
      border-color:rgba(212,175,55,.35);
    }
    .pf-fcard:hover::before { opacity:1; }
    .pf-fcard:active { transform:translateY(0) scale(.99); }

    /* icon container inside fcard */
    .pf-fcard-icon {
      width:46px; height:46px; border-radius:15px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center; font-size:20px;
      box-shadow:0 3px 12px rgba(0,0,0,.07),inset 0 1px 0 rgba(255,255,255,.9);
      transition:transform .22s;
    }
    .pf-fcard:hover .pf-fcard-icon { transform:scale(1.1) translateY(-1px); }

    .pf-fcard-body { flex:1; min-width:0; }
    .pf-fcard-title { font-size:14px; font-weight:700; color:#1A1A1A; letter-spacing:-.01em; }
    .pf-fcard-sub   { font-size:11px; color:#777; margin-top:2px; }
    .pf-fcard-right { display:flex; align-items:center; gap:8px; flex-shrink:0; }
    .pf-fcard-tag {
      font-size:9px; font-weight:800; padding:3px 10px;
      border-radius:999px; letter-spacing:.06em; white-space:nowrap;
    }
    .pf-tag-online  { background:rgba(34,197,94,.1);  color:#15803d; border:1px solid rgba(34,197,94,.22); animation:pf-badge-pulse 2.5s ease-in-out infinite; }
    .pf-tag-unset   { background:rgba(239,68,68,.08); color:#dc2626; border:1px solid rgba(239,68,68,.2); }
    .pf-tag-set     { background:rgba(34,197,94,.1);  color:#15803d; border:1px solid rgba(34,197,94,.22); }
    .pf-tag-speed   { background:rgba(212,175,55,.12); color:#9F7B16; border:1px solid rgba(212,175,55,.25); }
    .pf-fcard-arrow {
      width:28px; height:28px; border-radius:50%;
      background:rgba(212,175,55,.08); border:1px solid rgba(212,175,55,.2);
      display:flex; align-items:center; justify-content:center;
      color:#D4AF37; font-size:14px; font-weight:300;
      transition:all .22s;
    }
    .pf-fcard:hover .pf-fcard-arrow {
      background:rgba(212,175,55,.18); transform:translateX(2px);
    }

    /* no-hover static fcard (no cursor, no lift) */
    .pf-fcard-static { cursor:default; }
    .pf-fcard-static:hover { transform:none; box-shadow:0 4px 20px rgba(17,17,17,.055),0 1px 4px rgba(17,17,17,.03),inset 0 1px 0 #fff; border-color:rgba(229,226,220,.85); }
    .pf-fcard-static:hover::before { opacity:0; }
    .pf-fcard-static:hover .pf-fcard-icon { transform:none; }

    /* ── Quick Actions 2×2 grid ── */
    .pf-qa-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .pf-qa-card {
      background:#FFFFFF; border:1px solid rgba(229,226,220,.85);
      border-radius:22px; padding:1.3rem 1rem;
      display:flex; flex-direction:column; align-items:center; gap:10px; text-align:center;
      cursor:pointer; font-family:inherit; border:none;
      background:#FFFFFF; border:1px solid rgba(229,226,220,.85);
      box-shadow:0 4px 20px rgba(17,17,17,.055),0 1px 4px rgba(17,17,17,.03),inset 0 1px 0 #fff;
      transition:all .26s cubic-bezier(.16,1,.3,1); position:relative; overflow:hidden;
    }
    .pf-qa-card::after {
      content:''; position:absolute; inset:0;
      background:radial-gradient(circle at 50% 0%,rgba(212,175,55,.06),transparent 70%);
      opacity:0; transition:opacity .25s;
    }
    .pf-qa-card:hover { transform:translateY(-3px); box-shadow:0 12px 38px rgba(17,17,17,.1),0 4px 12px rgba(17,17,17,.05); border-color:rgba(212,175,55,.32); }
    .pf-qa-card:hover::after { opacity:1; }
    .pf-qa-card:active { transform:translateY(0) scale(.97); }
    .pf-qa-icon {
      width:52px; height:52px; border-radius:18px; font-size:22px;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 4px 16px rgba(0,0,0,.09),inset 0 1px 0 rgba(255,255,255,.95);
      transition:transform .22s;
    }
    .pf-qa-card:hover .pf-qa-icon { transform:scale(1.12) translateY(-2px); }
    .pf-qa-lbl { font-size:12px; font-weight:700; color:#1A1A1A; letter-spacing:-.01em; }
    .pf-qa-sub { font-size:10px; color:#999; margin-top:1px; }

    /* ── Language cards 2×2 ── */
    .pf-lang-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .pf-lang-card {
      background:#FFFFFF; border:1px solid rgba(229,226,220,.85);
      border-radius:18px; padding:14px 14px;
      display:flex; align-items:center; gap:12px;
      cursor:pointer; font-family:inherit; border:none;
      background:#FFFFFF; border:1px solid rgba(229,226,220,.85);
      box-shadow:0 3px 14px rgba(17,17,17,.048),inset 0 1px 0 #fff;
      transition:all .24s cubic-bezier(.16,1,.3,1); position:relative;
    }
    .pf-lang-card:hover { transform:translateY(-2px); border-color:rgba(212,175,55,.3); box-shadow:0 8px 28px rgba(17,17,17,.09); }
    .pf-lang-card.active {
      border-color:rgba(212,175,55,.5) !important;
      box-shadow:0 0 0 2px rgba(212,175,55,.18),0 6px 22px rgba(17,17,17,.08),inset 0 1px 0 #fff;
      background:linear-gradient(135deg,#FFFDF8,#FFFFFF);
    }
    .pf-lang-flag { font-size:26px; line-height:1; flex-shrink:0; }
    .pf-lang-info { flex:1; min-width:0; }
    .pf-lang-name { font-size:13px; font-weight:700; color:#1A1A1A; }
    .pf-lang-region { font-size:10px; color:#999; margin-top:1px; }
    .pf-lang-check {
      width:22px; height:22px; border-radius:50%;
      background:linear-gradient(135deg,#E8C96B,#D4AF37);
      color:#111; font-size:11px; font-weight:900;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 3px 10px rgba(212,175,55,.38); flex-shrink:0;
    }
    .pf-lang-check-empty { width:22px; height:22px; border-radius:50%; border:1.5px solid rgba(17,17,17,.15); flex-shrink:0; }

    /* ── Logout button ── */
    .pf-logout-wrap { padding:0 1.2rem; }
    .pf-logout-btn {
      width:100%; padding:15px; border-radius:20px;
      background:linear-gradient(135deg,rgba(255,241,241,.95),rgba(254,226,226,.95));
      border:1.5px solid rgba(239,68,68,.22); color:#dc2626;
      font-size:14px; font-weight:800; cursor:pointer; font-family:inherit;
      display:flex; align-items:center; justify-content:center; gap:10px;
      letter-spacing:.03em;
      box-shadow:0 5px 22px rgba(239,68,68,.08),inset 0 1px 0 rgba(255,255,255,.95);
      backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
      transition:all .28s cubic-bezier(.16,1,.3,1);
    }
    .pf-logout-btn:hover { background:linear-gradient(135deg,rgba(254,226,226,.98),rgba(252,165,165,.3)); border-color:rgba(239,68,68,.4); transform:translateY(-2px); box-shadow:0 10px 32px rgba(239,68,68,.14); }
    .pf-logout-btn:active { transform:translateY(0) scale(.98); }

    .pf-version { text-align:center; padding:1.6rem 0 .6rem; font-size:10px; color:rgba(17,17,17,.28); letter-spacing:.1em; font-weight:700; text-transform:uppercase; }

    /* ── Deprecated (kept for backward compat, hidden) ── */
    .pf-section { padding:0; }
    .pf-card { display:none; }
    .pf-section-label { display:none; }
    .pf-bottom-actions { padding:0; gap:0; }
    .pf-action-btn { display:none; }
    /* keep old row styles in case JS writes them */
    .pf-row { display:flex; align-items:center; gap:13px; padding:13px 15px; cursor:pointer; border:none; background:none; width:100%; text-align:left; font-family:inherit; }
    .pf-row-icon { width:40px; height:40px; border-radius:13px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
    .pf-row-body { flex:1; min-width:0; }
    .pf-row-title { font-size:14px; font-weight:700; color:#1A1A1A; }
    .pf-row-sub   { font-size:11px; color:#777; margin-top:2px; }
    .pf-row-right { display:flex; align-items:center; gap:7px; flex-shrink:0; }
    .pf-row-tag   { font-size:9px; font-weight:800; padding:3px 10px; border-radius:999px; letter-spacing:.06em; }
    .pf-tag-green { background:rgba(34,197,94,.1); color:#15803d; border:1px solid rgba(34,197,94,.2); }
    .pf-tag-red   { background:rgba(239,68,68,.1); color:#dc2626; border:1px solid rgba(239,68,68,.2); }
    .pf-tag-gold  { background:rgba(212,175,55,.12); color:#9F7B16; border:1px solid rgba(212,175,55,.25); }
    .pf-chevron   { color:rgba(212,175,55,.6); font-size:18px; }
    .pf-lang-active { width:22px; height:22px; border-radius:50%; background:linear-gradient(135deg,#E8C96B,#D4AF37); color:#111; font-size:11px; font-weight:900; display:flex; align-items:center; justify-content:center; }
    /* quick grid compat */
    .pf-quick-grid { display:grid; grid-template-columns:repeat(4,1fr); }
    .pf-quick-item { background:transparent; padding:.9rem .5rem; text-align:center; cursor:pointer; border:none; font-family:inherit; display:flex; flex-direction:column; align-items:center; gap:8px; }
    .pf-quick-icon { width:48px; height:48px; border-radius:15px; display:flex; align-items:center; justify-content:center; font-size:21px; }
    .pf-quick-lbl  { font-size:10px; font-weight:700; color:#1A1A1A; }
    .qi-yellow { background:linear-gradient(135deg,#FFF9E6,#FFF3CC); border:1px solid rgba(212,175,55,.2); }
    .qi-green  { background:linear-gradient(135deg,#F0FDF4,#DCFCE7); border:1px solid rgba(34,197,94,.2); }
    .qi-purple { background:linear-gradient(135deg,#F5F3FF,#EDE9FE); border:1px solid rgba(139,92,246,.2); }
    .qi-teal   { background:linear-gradient(135deg,#F0FDFA,#CCFBF1); border:1px solid rgba(20,184,166,.2); }
    /* mem stat compat */
    .pf-mem-wrap { margin:-3.2rem 1.1rem 0; position:relative; z-index:2; }

    @media(max-width:480px){
      .pf-qa-grid { grid-template-columns:1fr 1fr; gap:8px; }
      .pf-lang-grid { grid-template-columns:1fr 1fr; gap:8px; }
      .pf-body { padding:1.4rem 1rem 0; gap:1.6rem; }
      .pf-fcard { padding:13px 14px; border-radius:18px; }
      .pf-fcard-icon { width:42px; height:42px; border-radius:13px; font-size:18px; }
      .pf-fcard-title { font-size:13px; }
      .pf-qa-card { padding:1.1rem .8rem; border-radius:18px; }
      .pf-qa-icon { width:46px; height:46px; border-radius:15px; font-size:20px; }
      .pf-logout-wrap { padding:0 1rem; }
    }
    /* ══ AUTH PAGES — Landing + Login + Register ══ */
    @keyframes authFadeIn  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
    @keyframes floatUp     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    @keyframes glowPulse   { 0%,100%{box-shadow:0 0 30px rgba(201,162,39,.2)} 50%{box-shadow:0 0 60px rgba(201,162,39,.45)} }
    @keyframes starFloat   { 0%{transform:translate(0,0) scale(1);opacity:.6} 100%{transform:translate(var(--tx),var(--ty)) scale(0);opacity:0} }
    @keyframes countAnim   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes shimmerMove { 0%{background-position:-200% center} 100%{background-position:200% center} }
    @keyframes spin        { to{transform:rotate(360deg)} }
    @keyframes waveIn      { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }

    /* ── Shared auth body ────────────────────────────────────────────────── */
    body.auth-mode .top-header,
    body.auth-mode .bottom-nav { display:none !important; }
    body.auth-mode { background:#0a0a0a; }

    /* ══ LANDING PAGE ══════════════════════════════════════════════════════ */
    .lp-wrap {
      height:100vh; background:#F8F6F2;
      display:flex; flex-direction:column; position:relative; overflow:hidden;
    }

    /* Particle canvas bg */
    .lp-bg {
      position:fixed; inset:0; pointer-events:none; z-index:0;
      background:radial-gradient(ellipse 80% 50% at 50% 0%, rgba(201,162,39,.08) 0%, transparent 65%),
                 radial-gradient(ellipse 50% 40% at 90% 90%, rgba(201,162,39,.05) 0%, transparent 60%),
                 #F8F6F2;
    }
    /* Floating orbs */
    .lp-orb {
      position:absolute; border-radius:50%; pointer-events:none;
      background:radial-gradient(circle,rgba(201,162,39,.12) 0%,transparent 70%);
      filter:blur(60px);
    }
    .lp-orb-1 { width:300px; height:300px; top:-80px; left:-80px; animation:floatUp 8s ease-in-out infinite; }
    .lp-orb-2 { width:200px; height:200px; bottom:20%; right:-60px; animation:floatUp 6s ease-in-out infinite reverse; }
    .lp-orb-3 { width:150px; height:150px; top:40%; left:10%; animation:floatUp 10s ease-in-out infinite 2s; }

    /* Content */
    .lp-content { position:relative; z-index:1; flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; }

    /* Hero top */
    .lp-hero    { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:3rem 2rem; text-align:center; min-height:calc(100vh - 60px); }
    .lp-logo-wrap { margin-bottom:2rem; animation:floatUp 4s ease-in-out infinite; }
    .lp-logo-ring {
      width:90px; height:90px; border-radius:24px;
      background:linear-gradient(135deg,rgba(201,162,39,.15),rgba(201,162,39,.04));
      border:1px solid rgba(201,162,39,.4);
      display:flex; align-items:center; justify-content:center; margin:0 auto 16px;
      animation:glowPulse 3s ease-in-out infinite;
      position:relative;
    }
    .lp-logo-ring::before {
      content:''; position:absolute; inset:-6px; border-radius:28px;
      border:1px solid rgba(201,162,39,.12);
    }
    .lp-logo-ring::after {
      content:''; position:absolute; inset:-12px; border-radius:32px;
      border:1px solid rgba(201,162,39,.06);
    }
    .lp-brand-q   { font-size:22px; font-weight:800; color:var(--black); letter-spacing:.12em; }
    .lp-brand-g   { font-size:22px; font-weight:700; color:var(--gold); letter-spacing:.14em; }
    .lp-tagline   { font-size:10px; letter-spacing:.2em; color:var(--gold-dk); font-weight:600; text-transform:uppercase; margin-top:4px; }
    .lp-headline  { font-family:'Playfair Display',serif; font-size:32px; font-weight:700; color:var(--black); line-height:1.2; margin-bottom:.8rem; }
    .lp-headline em { color:var(--gold-dk); font-style:italic; }
    .lp-sub       { font-size:14px; color:var(--muted); line-height:1.7; max-width:300px; margin:0 auto 2.2rem; }

    /* Shimmer CTA */
    .lp-start-btn {
      display:inline-flex; align-items:center; gap:10px;
      padding:16px 44px; border-radius:16px; border:none; cursor:pointer;
      font-family:inherit; font-size:16px; font-weight:800; letter-spacing:.04em;
      background:linear-gradient(135deg,#C9A227,#FFD66E,#9B7A10,#C9A227);
      background-size:300% 100%;
      color:#111; transition:all .3s;
      box-shadow:0 8px 32px rgba(201,162,39,.4), 0 2px 8px rgba(0,0,0,.3);
      animation:shimmerMove 3s linear infinite;
    }
    .lp-start-btn:hover { transform:translateY(-3px); box-shadow:0 12px 40px rgba(201,162,39,.55); }
    .lp-start-btn svg   { flex-shrink:0; }

    /* Stats */
    .lp-stats { padding:0 1.2rem 1.2rem; }
    .lp-stats-card {
      background:var(--card);
      border:1px solid var(--border); border-radius:20px;
      padding:1.4rem 1rem; margin-bottom:1.2rem;
      box-shadow:0 2px 16px rgba(17,17,17,.06);
    }
    .lp-stats-title { font-size:10px; font-weight:700; letter-spacing:.14em; color:var(--gold-dk); text-transform:uppercase; text-align:center; margin-bottom:1.1rem; }
    .lp-stats-grid  { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
    .lp-stat        { text-align:center; padding:.7rem .4rem; background:var(--bg); border-radius:12px; border:1px solid var(--border); }
    .lp-stat-num    { font-size:20px; font-weight:800; color:var(--gold); letter-spacing:-.01em; animation:countAnim .6s ease; }
    .lp-stat-lbl    { font-size:9px; color:var(--muted); margin-top:3px; letter-spacing:.08em; text-transform:uppercase; font-weight:600; }

    /* Company intro */
    .lp-about       { margin:0 1.2rem 1.2rem; background:var(--card); border:1px solid var(--border); border-radius:20px; padding:1.4rem; box-shadow:0 2px 12px rgba(17,17,17,.05); }
    .lp-about-title { font-size:16px; font-weight:800; color:var(--black); margin-bottom:.6rem; }
    .lp-about-title span { color:var(--gold); }
    .lp-about-body  { font-size:12px; color:var(--muted); line-height:1.75; }
    .lp-about-tags  { display:flex; gap:8px; flex-wrap:wrap; margin-top:.9rem; }
    .lp-tag         { font-size:10px; font-weight:700; padding:4px 11px; border-radius:999px; background:rgba(201,162,39,.1); border:1px solid rgba(201,162,39,.25); color:var(--gold-dk); letter-spacing:.04em; }

    /* Action buttons */
    .lp-actions { padding:0 1.2rem 1.2rem; display:flex; flex-direction:column; gap:10px; }
    .lp-tg-btn {
      display:flex; align-items:center; justify-content:center; gap:10px;
      width:100%; padding:14px; border-radius:14px; border:none; cursor:pointer;
      font-family:inherit; font-size:14px; font-weight:700;
      background:rgba(37,162,224,.08); border:1px solid rgba(37,162,224,.25); color:#0284c7;
      transition:all .2s;
    }
    .lp-tg-btn:hover { background:rgba(37,162,224,.25); }
    .lp-app-btn {
      display:flex; align-items:center; justify-content:center; gap:10px;
      width:100%; padding:14px; border-radius:14px; border:none; cursor:pointer;
      font-family:inherit; font-size:14px; font-weight:700;
      background:var(--card); border:1px solid var(--border); color:var(--text);
      transition:all .2s;
    }
    .lp-app-btn:hover { background:var(--bg2); color:var(--black); }
    .lp-footer { text-align:center; padding:1rem; font-size:10px; color:var(--muted); letter-spacing:.06em; }

    /* Running days badge */
    .lp-running { display:inline-flex; align-items:center; gap:6px; background:rgba(34,197,94,.08); border:1px solid rgba(34,197,94,.2); border-radius:999px; padding:5px 14px; margin-bottom:1.4rem; }
    .lp-running-dot { width:7px; height:7px; border-radius:50%; background:#22c55e; animation:glowPulse 2s infinite; }
    .lp-running-txt { font-size:11px; font-weight:700; color:#22c55e; letter-spacing:.04em; }

    /* ══ GLASSMORPHISM AUTH (Login + Register) ══════════════════════════════ */
    .glass-wrap {
      min-height:100vh; background:#0a0a0a; display:flex; flex-direction:column;
      position:relative; overflow:hidden;
    }
    .glass-wrap.light {
      background:#F8F6F2;
    }
    .glass-bg {
      position:fixed; inset:0; pointer-events:none; z-index:0;
      background:radial-gradient(ellipse 90% 50% at 50% -5%, rgba(201,162,39,.12) 0%,transparent 65%),
                 radial-gradient(ellipse 50% 40% at 90% 90%, rgba(201,162,39,.07) 0%,transparent 60%),
                 #0a0a0a;
    }
    .glass-wrap.light .glass-bg {
      background:radial-gradient(ellipse 80% 50% at 50% 0%, rgba(201,162,39,.1) 0%,transparent 65%),
                 radial-gradient(ellipse 50% 40% at 90% 90%, rgba(201,162,39,.06) 0%,transparent 60%),
                 #F8F6F2;
    }
    /* light mode overrides */
    .glass-wrap.light .glass-top { }
    .glass-wrap.light .glass-title { color:var(--black); }
    .glass-wrap.light .glass-title em { color:var(--gold-dk); }
    .glass-wrap.light .glass-sub { color:var(--muted); }
    .glass-wrap.light .glass-logo-icon { background:rgba(201,162,39,.1); border-color:rgba(201,162,39,.3); }
    .glass-wrap.light .glass-card {
      background:var(--card);
      backdrop-filter:none; -webkit-backdrop-filter:none;
      border-top:1px solid var(--border);
      box-shadow:0 -4px 30px rgba(17,17,17,.06);
    }
    .glass-wrap.light .glass-tabs { background:var(--bg2); }
    .glass-wrap.light .glass-tab { color:var(--muted); }
    .glass-wrap.light .glass-tab.active { background:var(--card); color:var(--black); border:1px solid rgba(201,162,39,.2); box-shadow:0 1px 6px rgba(17,17,17,.08); }
    .glass-wrap.light .glass-label { color:var(--black); letter-spacing:.02em; text-transform:none; font-size:12px; }
    .glass-wrap.light .glass-input { background:var(--bg); border-color:var(--border); color:var(--black); }
    .glass-wrap.light .glass-input::placeholder { color:var(--muted); opacity:.7; }
    .glass-wrap.light .glass-input:focus { border-color:var(--gold); background:#fff; }
    .glass-wrap.light .glass-toggle { color:var(--muted); }
    .glass-wrap.light .glass-err { color:#dc2626; }
    .glass-wrap.light .glass-options .glass-remember { color:var(--muted); }
    .glass-wrap.light .glass-gen-err { background:rgba(239,68,68,.06); border-color:rgba(239,68,68,.2); color:#dc2626; }
    .glass-wrap.light .glass-switch { color:var(--muted); }
    .glass-wrap.light .glass-switch-btn { color:var(--gold-dk); }
    .glass-wrap.light .glass-trust { border-top-color:var(--border); }
    .glass-wrap.light .glass-trust-lbl { color:var(--muted); }
    .glass-wrap.light .glass-strength-track { background:var(--border); }
    .glass-wrap.light .glass-strength-lbl { color:var(--muted); }
    .glass-wrap.light [style*="color:rgba(255,255,255"] { color:var(--muted) !important; }
    .glass-content { position:relative; z-index:1; display:flex; flex-direction:column; min-height:100vh; }

    /* Top section */
    .glass-top { padding:3rem 1.5rem 1.8rem; text-align:center; }
    .glass-logo-wrap { display:inline-flex; align-items:center; gap:10px; margin-bottom:1.8rem; }
    .glass-logo-icon {
      width:46px; height:46px; border-radius:14px;
      background:rgba(201,162,39,.12); border:1px solid rgba(201,162,39,.3);
      display:flex; align-items:center; justify-content:center;
    }
    .glass-title    { font-family:'Playfair Display',serif; font-size:28px; font-weight:700; color:#fff; margin-bottom:.4rem; }
    .glass-title em { color:var(--gold); font-style:italic; }
    .glass-sub      { font-size:13px; color:rgba(255,255,255,.4); }

    /* Glass card */
    .glass-card {
      flex:1; margin:0; padding:1.8rem 1.4rem 2.4rem;
      background:rgba(255,255,255,.04);
      backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
      border-top:1px solid rgba(255,255,255,.08);
      border-radius:28px 28px 0 0;
      animation:waveIn .35s cubic-bezier(.16,1,.3,1);
    }

    /* Tabs */
    .glass-tabs { display:flex; background:rgba(255,255,255,.06); border-radius:14px; padding:4px; margin-bottom:1.8rem; }
    .glass-tab  {
      flex:1; text-align:center; padding:11px; border-radius:11px;
      font-size:13px; font-weight:700; cursor:pointer;
      border:none; background:none; font-family:inherit; transition:all .22s;
      color:rgba(255,255,255,.35);
    }
    .glass-tab.active {
      background:rgba(201,162,39,.15); color:var(--gold);
      border:1px solid rgba(201,162,39,.25);
    }

    /* Form fields */
    .glass-form  { display:flex; flex-direction:column; gap:14px; }
    .glass-field { display:flex; flex-direction:column; gap:6px; }
    .glass-label { font-size:11px; font-weight:700; color:rgba(255,255,255,.6); letter-spacing:.06em; text-transform:uppercase; }
    .glass-input-wrap { position:relative; }
    .glass-icon  { position:absolute; left:14px; top:50%; transform:translateY(-50%); font-size:15px; pointer-events:none; }
    .glass-input {
      width:100%; padding:13px 14px 13px 43px; box-sizing:border-box;
      background:rgba(255,255,255,.06); border:1.5px solid rgba(255,255,255,.1);
      border-radius:13px; font-size:14px; color:#fff;
      font-family:inherit; outline:none; transition:all .2s;
    }
    .glass-input::placeholder { color:rgba(255,255,255,.25); }
    .glass-input:focus  { border-color:rgba(201,162,39,.5); background:rgba(201,162,39,.06); }
    .glass-input.error  { border-color:rgba(239,68,68,.6); }
    .glass-toggle {
      position:absolute; right:14px; top:50%; transform:translateY(-50%);
      background:none; border:none; cursor:pointer; color:rgba(255,255,255,.35); font-size:14px; padding:0;
    }
    .glass-err  { font-size:11px; color:#f87171; font-weight:500; display:none; }
    .glass-err.show { display:block; }
    .glass-hint { font-size:11px; color:rgba(255,255,255,.3); }

    /* Options row */
    .glass-options { display:flex; align-items:center; justify-content:space-between; }
    .glass-remember { display:flex; align-items:center; gap:7px; font-size:12px; color:rgba(255,255,255,.4); cursor:pointer; }
    .glass-remember input { accent-color:var(--gold); width:14px; height:14px; }
    .glass-forgot { background:none; border:none; font-size:12px; color:var(--gold); font-weight:600; cursor:pointer; font-family:inherit; }

    /* Submit */
    .glass-submit {
      width:100%; padding:15px; border-radius:14px; border:none; cursor:pointer;
      font-family:inherit; font-size:15px; font-weight:800; letter-spacing:.04em;
      background:linear-gradient(135deg,#C9A227,#FFD66E,#9B7A10);
      background-size:200% 100%; color:#111; transition:all .25s;
      box-shadow:0 6px 28px rgba(201,162,39,.35);
      display:flex; align-items:center; justify-content:center; gap:8px;
      margin-top:4px;
    }
    .glass-submit:hover   { background-position:right; box-shadow:0 10px 36px rgba(201,162,39,.5); transform:translateY(-1px); }
    .glass-submit:disabled{ opacity:.55; cursor:not-allowed; transform:none; }
    .glass-submit.loading::after { content:''; width:16px; height:16px; border-radius:50%; border:2.5px solid rgba(17,17,17,.3); border-top-color:#111; animation:spin .7s linear infinite; display:inline-block; }

    /* Strength bar */
    .glass-strength-wrap { margin-top:5px; }
    .glass-strength-track { height:3px; background:rgba(255,255,255,.08); border-radius:999px; overflow:hidden; }
    .glass-strength-fill  { height:100%; border-radius:999px; transition:all .3s; width:0%; }
    .glass-strength-lbl   { font-size:10px; margin-top:3px; color:rgba(255,255,255,.35); }

    /* General error */
    .glass-gen-err {
      text-align:center; font-size:13px; padding:10px 14px;
      background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.2);
      border-radius:11px; color:#f87171; display:none;
    }
    .glass-gen-err.show { display:block; }

    /* Switch link */
    .glass-switch      { text-align:center; font-size:13px; color:rgba(255,255,255,.35); margin-top:1.2rem; }
    .glass-switch-btn  { background:none; border:none; color:var(--gold); font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; }

    /* Trust row */
    .glass-trust { display:flex; justify-content:center; gap:18px; padding-top:1.2rem; margin-top:1.2rem; border-top:1px solid rgba(255,255,255,.07); }
    .glass-trust-item { text-align:center; }
    .glass-trust-icon { font-size:17px; margin-bottom:3px; }
    .glass-trust-lbl  { font-size:9px; color:rgba(255,255,255,.25); font-weight:600; letter-spacing:.06em; text-transform:uppercase; }

    /* ── old auth-* aliases kept for compatibility ── */
    .auth-wrap  { min-height:100vh; display:flex; flex-direction:column; background:var(--bg); }
    .auth-error { font-size:11px; color:#ef4444; font-weight:500; display:none; }
    .auth-error.show { display:block; }

    /* ══ PAGE TRANSITIONS ══ */
    @keyframes pgEnter  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pgExit   { from{opacity:1;transform:translateY(0)}    to{opacity:0;transform:translateY(-8px)} }
    @keyframes pgSlideL { from{opacity:0;transform:translateX(22px)} to{opacity:1;transform:translateX(0)} }
    @keyframes pgSlideR { from{opacity:0;transform:translateX(-22px)}to{opacity:1;transform:translateX(0)} }

    .page            { display:none; }
    .page.active     { display:block; animation:pgEnter .28s cubic-bezier(.16,1,.3,1) both; }
    .page.exiting    { display:block; animation:pgExit  .18s ease forwards; pointer-events:none; }
    .page.slide-left { animation:pgSlideL .28s cubic-bezier(.16,1,.3,1) both !important; }
    .page.slide-right{ animation:pgSlideR .28s cubic-bezier(.16,1,.3,1) both !important; }

    /* ══ MODAL SYSTEM ══ */
    @keyframes mdIn  { from{opacity:0;transform:scale(.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
    @keyframes mdOut { from{opacity:1;transform:scale(1) translateY(0)}       to{opacity:0;transform:scale(.94) translateY(8px)} }
    @keyframes bdIn  { from{opacity:0} to{opacity:1} }

    .qx-overlay {
      position:fixed;inset:0;z-index:9000;
      background:rgba(17,17,17,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
      display:flex;align-items:flex-end;justify-content:center;
      animation:bdIn .2s ease;
      padding:0;
    }
    .qx-overlay.closing { animation:bdIn .18s ease reverse forwards; }
    .qx-modal {
      width:100%;max-width:480px;
      background:var(--card);border-radius:24px 24px 0 0;
      padding:0 0 max(1.5rem,env(safe-area-inset-bottom)) 0;
      animation:mdIn .28s cubic-bezier(.16,1,.3,1);
      box-shadow:0 -8px 40px rgba(17,17,17,.18);
      max-height:90vh;overflow-y:auto;
    }
    .qx-modal.closing { animation:mdOut .18s ease forwards; }
    /* Pill handle */
    .qx-modal-handle {
      width:36px;height:4px;border-radius:999px;
      background:var(--border);margin:10px auto 0;
    }
    .qx-modal-head {
      display:flex;align-items:center;justify-content:space-between;
      padding:1rem 1.2rem .6rem;
    }
    .qx-modal-icon-wrap {
      width:44px;height:44px;border-radius:13px;
      display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;
    }
    .qx-modal-title { font-size:17px;font-weight:800;color:var(--black);letter-spacing:-.01em; }
    .qx-modal-close {
      width:32px;height:32px;border-radius:50%;background:var(--bg2);border:none;
      display:flex;align-items:center;justify-content:center;cursor:pointer;
      font-size:16px;color:var(--muted);flex-shrink:0;transition:background .15s;
    }
    .qx-modal-close:hover { background:var(--border); }
    .qx-modal-body { padding:.2rem 1.2rem 1rem;font-size:13px;color:var(--muted);line-height:1.65; }
    .qx-modal-detail {
      background:var(--bg);border:1px solid var(--border);border-radius:14px;
      margin:0 1.2rem .9rem;overflow:hidden;
    }
    .qx-modal-row {
      display:flex;justify-content:space-between;align-items:center;
      padding:10px 14px;border-bottom:1px solid var(--border);font-size:13px;
    }
    .qx-modal-row:last-child { border-bottom:none; }
    .qx-modal-row-lbl { color:var(--muted);font-weight:500; }
    .qx-modal-row-val { font-weight:700;color:var(--black); }
    .qx-modal-row-val.gold { color:var(--gold); }
    .qx-modal-row-val.red  { color:#dc2626; }
    .qx-modal-row-val.green{ color:#16a34a; }
    .qx-modal-actions { display:flex;flex-direction:column;gap:8px;padding:0 1.2rem; }
    .qx-modal-confirm {
      width:100%;padding:13px;border-radius:12px;font-size:14px;font-weight:800;
      cursor:pointer;font-family:inherit;border:none;transition:all .2s;letter-spacing:.02em;
    }
    .qx-modal-cancel {
      width:100%;padding:12px;border-radius:12px;font-size:13px;font-weight:600;
      cursor:pointer;font-family:inherit;background:transparent;
      border:1.5px solid var(--border);color:var(--muted);transition:all .2s;
    }
    .qx-modal-cancel:hover { border-color:var(--black);color:var(--black); }
    .qx-btn-gold  { background:var(--gold);color:var(--black); }
    .qx-btn-gold:hover  { background:var(--gold-lt); }
    .qx-btn-black { background:var(--black);color:var(--gold); }
    .qx-btn-black:hover { background:#222; }
    .qx-btn-red   { background:#dc2626;color:#fff; }
    .qx-btn-red:hover   { background:#b91c1c; }
    .qx-btn-green { background:#16a34a;color:#fff; }
    .qx-btn-green:hover { background:#15803d; }
    /* warning strip */
    .qx-modal-warn {
      display:flex;align-items:flex-start;gap:10px;
      background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);
      border-radius:11px;padding:10px 12px;margin:0 1.2rem .9rem;
    }
    .qx-modal-warn-icon { font-size:16px;flex-shrink:0;margin-top:1px; }
    .qx-modal-warn-txt  { font-size:11px;color:#b91c1c;line-height:1.55; }

    /* ══ TOAST SYSTEM ══ */
    @keyframes toastIn  { from{opacity:0;transform:translateY(16px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes toastOut { from{opacity:1;transform:translateY(0) scale(1)} to{opacity:0;transform:translateY(8px) scale(.96)} }

    #qx-toasts { position:fixed;bottom:90px;left:0;right:0;z-index:9999;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:8px; }
    .qx-toast {
      display:inline-flex;align-items:center;gap:9px;
      background:var(--black);color:#fff;
      padding:10px 16px;border-radius:12px;
      font-size:13px;font-weight:600;font-family:'Inter',sans-serif;
      box-shadow:0 4px 20px rgba(17,17,17,.25);
      animation:toastIn .28s cubic-bezier(.16,1,.3,1);
      pointer-events:auto;max-width:90%;
    }
    .qx-toast.success { background:#16a34a; }
    .qx-toast.error   { background:#dc2626; }
    .qx-toast.warning { background:var(--gold);color:var(--black); }
    .qx-toast.out     { animation:toastOut .22s ease forwards; }


    /* ══ HOME DASHBOARD (qx-) ═══════════════════════════════════════════ */
    @keyframes qxShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
    @keyframes qxFadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes balancePop{ 0%{opacity:0;transform:scale(.96)} 100%{opacity:1;transform:scale(1)} }

    /* ── PORTFOLIO HERO ── */
    .qx-hero {
      background: linear-gradient(155deg, #0a0a0a 0%, #141008 40%, #1a1400 70%, #0d0d0d 100%);
      padding: 1.6rem 1.2rem 1.8rem;
      position: relative; overflow: hidden;
      box-shadow: 0 4px 0 rgba(201,162,39,.12);
    }
    .qx-hero::after {
      content:''; position:absolute; bottom:0; left:0; right:0; height:2px;
      background:linear-gradient(90deg,transparent,rgba(201,162,39,.6),transparent);
    }
    .qx-hero-glow {
      position:absolute; top:-80px; right:-80px; width:320px; height:320px;
      background:radial-gradient(circle, rgba(201,162,39,.18) 0%, rgba(201,162,39,.06) 40%, transparent 70%);
      pointer-events:none;
      animation: ab-glow 4s ease-in-out infinite;
    }
    .qx-hero-glow2 {
      position:absolute; bottom:-60px; left:-60px; width:240px; height:240px;
      background:radial-gradient(circle, rgba(201,162,39,.1) 0%, transparent 65%);
      pointer-events:none;
    }
    /* Top row: greet + membership badge */
    .qx-hero-toprow {
      position:relative; z-index:1;
      display:flex; align-items:center; justify-content:space-between;
      margin-bottom:1.4rem;
    }
    .qx-hero-greeting { font-size:12px; color:#666; font-weight:500; }
    .qx-hero-name     { font-size:17px; font-weight:700; color:#fff; margin-top:2px; letter-spacing:-.01em; }
    .qx-mem-chip {
      display:inline-flex; align-items:center; gap:5px;
      background:rgba(201,162,39,.1); border:1px solid rgba(201,162,39,.22);
      border-radius:999px; padding:5px 12px;
      font-size:10px; font-weight:700; color:var(--gold); letter-spacing:.06em;
      white-space:nowrap; text-transform:uppercase;
    }
    .qx-mem-dot { font-size:9px; }
    /* Balance card area */
    .qx-balance-area { position:relative; z-index:1; margin-bottom:1.4rem; }
    .qx-bal-label {
      font-size:10px; font-weight:700; color:#555;
      letter-spacing:.14em; text-transform:uppercase; margin-bottom:.5rem;
      display:flex; align-items:center; gap:8px;
    }
    .qx-bal-eye {
      background:none; border:none; cursor:pointer; padding:2px 4px;
      color:#555; font-size:14px; line-height:1; transition:color .2s;
    }
    .qx-bal-eye:hover { color:var(--gold); }
    .qx-bal-main {
      font-size: 44px; font-weight: 900; color: #fff; letter-spacing: -.04em;
      line-height: 1; margin-bottom: .3rem;
      animation: balancePop .4s cubic-bezier(.16,1,.3,1);
      text-shadow: 0 0 40px rgba(201,162,39,.25), 0 2px 20px rgba(0,0,0,.4);
    }
    .qx-bal-usdt { font-size:12px; color:#555; font-weight:500; }
    /* Profit row */
    .qx-hero-stats {
      position:relative; z-index:1;
      display:grid; grid-template-columns:1fr 1fr;
      gap:10px;
    }
    .qx-hstat {
      background: rgba(255,255,255,.07);
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 16px; padding: .9rem 1rem;
      backdrop-filter: blur(8px);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.1), 0 4px 20px rgba(0,0,0,.2);
      position: relative; overflow: hidden;
    }
    .qx-hstat::before {
      content:''; position:absolute; top:0; left:0; right:0; height:1px;
      background: linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent);
    }
    .qx-hstat-lbl { font-size:9px; font-weight:700; color:#888; letter-spacing:.1em; text-transform:uppercase; margin-bottom:.35rem; }
    .qx-hstat-val { font-size:20px; font-weight:800; color:#fff; letter-spacing:-.01em; }
    .qx-hstat-val.green { color:#4ade80; text-shadow:0 0 16px rgba(74,222,128,.4); }
    .qx-hstat-val.gold  { color:var(--gold); text-shadow:0 0 16px rgba(201,162,39,.4); }
    /* UID pill */
    .qx-uid-pill {
      display:inline-flex; align-items:center; gap:7px;
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(201,162,39,.25);
      border-radius:999px; padding:6px 14px; margin-top:1rem;
      font-size:11px; color:#888; font-family:monospace; letter-spacing:.08em;
      cursor:pointer; transition:all .25s; position:relative; z-index:1;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.08);
    }
    .qx-uid-pill:hover { border-color:rgba(201,162,39,.5); color:var(--gold); background:rgba(201,162,39,.08); }

    /* ── TICKER ── */
    .qx-ticker {
      display:flex; align-items:center; height:34px; overflow:hidden;
      background:rgba(201,162,39,.06); border-bottom:1px solid rgba(201,162,39,.12);
    }
    .qx-ticker-tag {
      flex-shrink:0; padding:0 12px; font-size:11px; height:100%;
      display:flex; align-items:center; gap:5px;
      border-right:1px solid rgba(201,162,39,.15);
      font-weight:700; color:var(--gold-dk); letter-spacing:.04em; white-space:nowrap;
    }
    .qx-ticker-scroll { flex:1; overflow:hidden; }
    .qx-ticker-text {
      display:inline-block; white-space:nowrap;
      font-size:11px; color:#888; font-weight:500;
      animation:slideAnn 28s linear infinite;
    }

    /* ── QUICK ACTIONS 4-COLUMN GRID ── */
    .qx-qa-wrap {
      display:grid; grid-template-columns:repeat(4,1fr);
      gap:10px; padding:0 1.2rem;
    }
    @media(min-width:480px) { .qx-qa-wrap { grid-template-columns:repeat(4,1fr); } }
    @media(min-width:720px) { .qx-qa-wrap { grid-template-columns:repeat(8,1fr); } }

    .qx-qa-item {
      display:flex; flex-direction:column; align-items:center;
      gap:8px; padding:1rem .3rem .85rem;
      background: linear-gradient(160deg, #ffffff 0%, #fdfbf6 100%);
      border: 1px solid rgba(201,162,39,.22);
      border-radius: 20px; cursor:pointer; font-family:inherit;
      box-shadow: 0 6px 24px rgba(17,17,17,.08),
                  0 1px 0 rgba(255,255,255,.95) inset,
                  0 -1px 0 rgba(17,17,17,.04) inset;
      transition: transform .25s cubic-bezier(.34,1.56,.64,1),
                  box-shadow .25s ease, border-color .25s;
      position:relative; overflow:hidden;
    }
    .qx-qa-item::before {
      content:''; position:absolute; top:0; left:0; right:0; height:2px;
      background: linear-gradient(90deg, transparent, rgba(201,162,39,.55), transparent);
      border-radius:20px 20px 0 0;
    }
    .qx-qa-item:hover {
      transform: translateY(-6px);
      box-shadow: 0 16px 40px rgba(201,162,39,.2), 0 4px 12px rgba(17,17,17,.08),
                  inset 0 1px 0 #fff;
      border-color: rgba(201,162,39,.45);
    }
    .qx-qa-item:active { transform:scale(.94) !important; }

    .qx-qa-circle {
      width:48px; height:48px; border-radius:16px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
      position:relative; z-index:1;
      box-shadow: 0 4px 14px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.6);
    }
    .qx-qa-lbl { font-size:11px; font-weight:700; color:var(--black); line-height:1.2; text-align:center; position:relative; z-index:1; }

    /* Icon colour tokens */
    .qx-qa-gold   { background: linear-gradient(145deg, #FFF3CC, #FFEAA0, #F5D060); }
    .qx-qa-blue   { background: linear-gradient(145deg, #DBEAFE, #BFDBFE, #93C5FD); }
    .qx-qa-purple { background: linear-gradient(145deg, #EDE9FE, #DDD6FE, #C4B5FD); }
    .qx-qa-green  { background: linear-gradient(145deg, #DCFCE7, #BBF7D0, #86EFAC); }
    .qx-qa-pink   { background: linear-gradient(145deg, #FCE7F3, #FBCFE8, #F9A8D4); }
    .qx-qa-cyan   { background: linear-gradient(145deg, #CFFAFE, #A5F3FC, #67E8F9); }
    .qx-qa-orange { background: linear-gradient(145deg, #FFEDD5, #FED7AA, #FDBA74); }
    .qx-qa-teal   { background: linear-gradient(145deg, #CCFBF1, #99F6E4, #5EEAD4); }

    /* ── INVITE MODAL extras ── */
    .qx-inv-modal-row {
      background:var(--bg); border:1.5px solid var(--border);
      border-radius:12px; padding:10px 13px;
      display:flex; align-items:center; gap:10px; margin-bottom:9px;
    }
    .qx-inv-modal-val {
      flex:1; font-size:12px; font-weight:600; color:var(--black);
      font-family:monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
    }
    .qx-inv-modal-val.gold { color:var(--gold); }
    .qx-inv-copy-btn {
      background:var(--black); color:var(--gold); border:none;
      padding:7px 14px; border-radius:9px; font-size:11px; font-weight:700;
      cursor:pointer; font-family:inherit; flex-shrink:0; transition:all .2s; white-space:nowrap;
    }
    .qx-inv-copy-btn:hover { background:var(--gold); color:var(--black); }
    .qx-inv-share-btn {
      width:100%; padding:13px; border-radius:12px; border:1.5px solid rgba(201,162,39,.35);
      background:rgba(201,162,39,.07); color:var(--gold-dk);
      font-size:13px; font-weight:700; cursor:pointer; font-family:inherit;
      display:flex; align-items:center; justify-content:center; gap:8px;
      transition:all .2s; margin-top:4px;
    }
    .qx-inv-share-btn:hover { background:var(--gold); color:var(--black); border-color:var(--gold); }

    /* ── MY INVESTMENTS CARD ── */
    .qx-inv-wrap { padding:1.2rem 1.2rem 0; }
    .qx-inv-card {
      background:#fff; border:1.5px solid rgba(201,162,39,.22); border-radius:22px;
      overflow:hidden; box-shadow:0 10px 40px rgba(17,17,17,.09), inset 0 1px 0 #fff;
      position:relative;
    }
    .qx-inv-card::before {
      content:''; position:absolute; top:0; left:0; right:0; height:2px;
      background:linear-gradient(90deg,transparent,rgba(201,162,39,.65),transparent); z-index:2;
    }
    .qx-inv-head {
      display:flex; align-items:center; justify-content:space-between;
      padding:1rem 1.2rem; border-bottom:1px solid var(--border);
      background:linear-gradient(135deg,#fdfcf8,#fff);
    }
    .qx-inv-head-title { font-size:14px; font-weight:800; color:var(--black); }
    .qx-inv-head-badge {
      font-size:9px; font-weight:800; letter-spacing:.07em;
      padding:4px 10px; border-radius:999px;
    }
    .qx-inv-badge-active { background:rgba(34,197,94,.1); color:#16a34a; border:1px solid rgba(34,197,94,.25); }
    .qx-inv-badge-none   { background:rgba(17,17,17,.07); color:var(--muted); }
    /* Active investment item */
    .qx-inv-item { padding:1rem 1.2rem; }
    .qx-inv-plan-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:.9rem; }
    .qx-inv-plan-name { font-size:17px; font-weight:900; color:var(--black); }
    .qx-inv-plan-roi {
      font-size:11px; font-weight:800; color:var(--gold-dk);
      background:linear-gradient(135deg,rgba(201,162,39,.18),rgba(201,162,39,.08));
      border:1px solid rgba(201,162,39,.3); border-radius:999px; padding:4px 12px;
    }
    .qx-inv-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:1rem; }
    .qx-inv-g-item {
      text-align:center; padding:.65rem .4rem;
      background:linear-gradient(145deg,#fdfbf5,#fff9ec);
      border-radius:14px; border:1px solid rgba(201,162,39,.15);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.8),0 2px 8px rgba(17,17,17,.04);
    }
    .qx-inv-g-num { font-size:15px; font-weight:800; color:var(--black); }
    .qx-inv-g-lbl { font-size:9px; color:var(--muted); margin-top:2px; letter-spacing:.06em; text-transform:uppercase; font-weight:600; }
    .qx-inv-g-num.gold  { color:var(--gold-dk); }
    .qx-inv-g-num.green { color:#16a34a; }
    /* Progress bar */
    .qx-inv-progress { }
    .qx-inv-prog-row { display:flex; justify-content:space-between; margin-bottom:.4rem; }
    .qx-inv-prog-lbl { font-size:10px; color:var(--muted); font-weight:600; }
    .qx-inv-prog-pct { font-size:10px; font-weight:800; color:var(--gold-dk); }
    .qx-inv-prog-track {
      height:7px; background:var(--bg2); border-radius:999px; overflow:hidden;
      box-shadow:inset 0 2px 4px rgba(0,0,0,.07);
    }
    .qx-inv-prog-fill {
      height:100%; border-radius:999px;
      background:linear-gradient(90deg,#9B7A10,#C9A227,#FFD66E,#C9A227);
      background-size:300% 100%;
      animation:hd-shimmer-sweep 2.5s linear infinite;
      box-shadow:0 0 10px rgba(201,162,39,.4);
      transition:width .8s cubic-bezier(.16,1,.3,1);
    }
    /* Empty state */
    .qx-inv-empty { padding:2rem 1.2rem; text-align:center; }
    .qx-inv-empty-icon { font-size:44px; margin-bottom:.9rem; }
    .qx-inv-empty-title { font-size:15px; font-weight:800; color:var(--black); margin-bottom:.4rem; }
    .qx-inv-empty-sub { font-size:12px; color:var(--muted); line-height:1.6; margin-bottom:1.4rem; }
    .qx-inv-empty-btn {
      display:inline-flex; align-items:center; gap:8px;
      padding:13px 28px; border-radius:14px; border:none; cursor:pointer;
      font-family:inherit; font-size:13px; font-weight:800;
      background:linear-gradient(135deg,#111,#2a2a2a); color:var(--gold);
      box-shadow:0 6px 20px rgba(0,0,0,.18); transition:all .2s;
    }
    .qx-inv-empty-btn:hover { background:linear-gradient(135deg,#C9A227,#9B7A10); color:#111; transform:translateY(-2px); }

    /* ── ANNOUNCEMENT SLIDER ── */
    @keyframes qxSliderGlow { 0%,100%{opacity:.6} 50%{opacity:1} }
    @keyframes qxSlideIn    { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:translateX(0)} }
    @keyframes qxSlideOut   { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(-28px)} }
    @keyframes qxFadeDot    { 0%{transform:scaleX(1)} 100%{transform:scaleX(1)} }

    /* ══ PREMIUM SLIDER — Off-white + Champagne Gold ══ */
    @keyframes qxSliderGlow { 0%,100%{opacity:.6} 50%{opacity:1} }
    @keyframes qxLightSweep { 0%{left:-120%} 100%{left:120%} }
    @keyframes qxFloatA { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
    @keyframes qxFloatB { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }

    .qx-slider-wrap {
      padding: .9rem 1.2rem 0;
      position: relative;
    }
    .qx-slider {
      border-radius: 24px; overflow: hidden;
      position: relative;
      box-shadow: 0 8px 40px rgba(17,17,17,.1), 0 2px 8px rgba(17,17,17,.06),
                  inset 0 1px 0 rgba(255,255,255,.95);
      user-select: none;
    }
    .qx-slider-track {
      position: relative; height: 168px;
      touch-action: pan-y;
    }
    .qx-slide {
      position: absolute; inset: 0;
      padding: 1.4rem 1.4rem 1.2rem;
      display: flex; flex-direction: column; justify-content: space-between;
      opacity: 0; pointer-events: none;
      transition: opacity .45s cubic-bezier(.4,0,.2,1), transform .45s cubic-bezier(.4,0,.2,1);
      transform: translateX(28px);
      overflow: hidden;
    }
    .qx-slide.active { opacity: 1; pointer-events: auto; transform: translateX(0); }
    .qx-slide.exit   { opacity: 0; transform: translateX(-28px); }

    /* Light sweep on each slide */
    .qx-slide::before {
      content: '';
      position: absolute; top: 0; bottom: 0; width: 60%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent);
      z-index: 10; pointer-events: none;
      animation: qxLightSweep 4s ease-in-out infinite;
      animation-play-state: paused;
    }
    .qx-slide.active::before { animation-play-state: running; }

    /* Gold top line on all slides */
    .qx-slide::after {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, transparent, rgba(201,162,39,.7), transparent);
      z-index: 5;
    }

    /* Slide backgrounds — 6 rich premium colors */
    .qx-sl-1 { background: linear-gradient(135deg, #0d0d0d 0%, #1a1200 50%, #111 100%); }
    .qx-sl-2 { background: linear-gradient(135deg, #0a1628 0%, #0d2044 50%, #091430 100%); }
    .qx-sl-3 { background: linear-gradient(135deg, #1a1000 0%, #2a1e00 50%, #1a1200 100%); }
    .qx-sl-4 { background: linear-gradient(135deg, #12082a 0%, #1e0e42 50%, #0e0620 100%); }
    .qx-sl-5 { background: linear-gradient(135deg, #051a10 0%, #08280f 50%, #041410 100%); }
    .qx-sl-6 { background: linear-gradient(135deg, #0f0a1a 0%, #1a1030 50%, #100828 100%); }

    /* Ambient glow per slide */
    .qx-sl-1 .qx-sl-glow { background: radial-gradient(circle, rgba(201,162,39,.22) 0%, transparent 70%); }
    .qx-sl-2 .qx-sl-glow { background: radial-gradient(circle, rgba(59,130,246,.22) 0%, transparent 70%); }
    .qx-sl-3 .qx-sl-glow { background: radial-gradient(circle, rgba(201,162,39,.25) 0%, transparent 70%); }
    .qx-sl-4 .qx-sl-glow { background: radial-gradient(circle, rgba(139,92,246,.22) 0%, transparent 70%); }
    .qx-sl-5 .qx-sl-glow { background: radial-gradient(circle, rgba(34,197,94,.20) 0%, transparent 70%); }
    .qx-sl-6 .qx-sl-glow { background: radial-gradient(circle, rgba(99,102,241,.22) 0%, transparent 70%); }
    .qx-sl-glow {
      position: absolute; top: -40px; right: -40px; width: 180px; height: 180px;
      border-radius: 50%; pointer-events: none;
    }

    /* Bottom border accent */
    .qx-sl-1 .qx-sl-bot-line { background: linear-gradient(90deg,transparent,rgba(201,162,39,.6),transparent); }
    .qx-sl-2 .qx-sl-bot-line { background: linear-gradient(90deg,transparent,rgba(59,130,246,.5),transparent); }
    .qx-sl-3 .qx-sl-bot-line { background: linear-gradient(90deg,transparent,rgba(201,162,39,.7),transparent); }
    .qx-sl-4 .qx-sl-bot-line { background: linear-gradient(90deg,transparent,rgba(139,92,246,.5),transparent); }
    .qx-sl-5 .qx-sl-bot-line { background: linear-gradient(90deg,transparent,rgba(34,197,94,.5),transparent); }
    .qx-sl-6 .qx-sl-bot-line { background: linear-gradient(90deg,transparent,rgba(99,102,241,.5),transparent); }
    .qx-sl-bot-line {
      position: absolute; bottom: 0; left: 0; right: 0; height: 1.5px; pointer-events: none;
    }

    .qx-sl-tag {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 9px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase;
      padding: 4px 10px; border-radius: 999px;
    }
    .qx-sl-tag-gold   { color: var(--gold);  background: rgba(201,162,39,.2);  border: 1px solid rgba(201,162,39,.4); }
    .qx-sl-tag-green  { color: #4ade80;       background: rgba(34,197,94,.15);  border: 1px solid rgba(34,197,94,.3); }
    .qx-sl-tag-purple { color: #c4b5fd;       background: rgba(139,92,246,.15); border: 1px solid rgba(139,92,246,.3); }
    .qx-sl-tag-red    { color: #fca5a5;       background: rgba(239,68,68,.15);  border: 1px solid rgba(239,68,68,.3); }
    .qx-sl-tag-blue   { color: #93c5fd;       background: rgba(59,130,246,.15); border: 1px solid rgba(59,130,246,.3); }
    .qx-sl-tag-indigo { color: #a5b4fc;       background: rgba(99,102,241,.15); border: 1px solid rgba(99,102,241,.3); }

    /* Top row */
    .qx-sl-top {
      display: flex; align-items: center; justify-content: space-between;
      position: relative; z-index: 2;
    }
    .qx-sl-num { font-size: 10px; font-weight: 600; color: rgba(255,255,255,.25); letter-spacing: .08em; }

    /* Headline — white on dark */
    .qx-sl-headline {
      font-family: 'Playfair Display', serif;
      font-size: 18px; font-weight: 700; color: #fff; line-height: 1.25;
      margin-bottom: .25rem; letter-spacing: -.01em;
      position: relative; z-index: 2;
    }
    .qx-sl-headline em { font-style: italic; }
    .qx-sl-1 .qx-sl-headline em { color: var(--gold); }
    .qx-sl-2 .qx-sl-headline em { color: #60a5fa; }
    .qx-sl-3 .qx-sl-headline em { color: #FFD66E; }
    .qx-sl-4 .qx-sl-headline em { color: #c4b5fd; }
    .qx-sl-5 .qx-sl-headline em { color: #4ade80; }
    .qx-sl-6 .qx-sl-headline em { color: #a5b4fc; }

    .qx-sl-body { position: relative; z-index: 2; }
    .qx-sl-sub {
      font-size: 11px; color: rgba(255,255,255,.5); line-height: 1.6;
      font-weight: 400; max-width: 68%;
    }

    /* CTA */
    .qx-sl-bottom {
      display: flex; align-items: center; justify-content: space-between;
      position: relative; z-index: 2;
    }
    .qx-sl-cta {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 11px; font-weight: 800; letter-spacing: .04em;
      padding: 7px 14px; border-radius: 9px; border: none; cursor: pointer;
      font-family: inherit; transition: all .2s;
    }
    .qx-sl-cta:hover { transform: translateX(2px); opacity: .9; }
    .qx-sl-cta-gold   { background: rgba(201,162,39,.9); color: #111; }
    .qx-sl-cta-green  { background: rgba(34,197,94,.85); color: #052e16; }
    .qx-sl-cta-purple { background: rgba(139,92,246,.85); color: #fff; }
    .qx-sl-cta-red    { background: rgba(239,68,68,.85); color: #fff; }
    .qx-sl-cta-blue   { background: rgba(59,130,246,.85); color: #fff; }
    .qx-sl-cta-indigo { background: rgba(99,102,241,.85); color: #fff; }

    /* 3D Illustration */
    .qx-sl-illu {
      position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
      font-size: 52px; pointer-events: none; z-index: 1;
      filter: drop-shadow(0 4px 16px rgba(0,0,0,.12));
      animation: qxFloatA 4s ease-in-out infinite;
    }

    /* Nav dots */
    .qx-slider-dots {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: .65rem 0 0;
    }
    .qx-sl-dot {
      height: 4px; border-radius: 999px;
      background: rgba(17,17,17,.12);
      cursor: pointer; transition: all .35s cubic-bezier(.4,0,.2,1);
      width: 18px;
    }
    .qx-sl-dot.active { background: var(--gold); width: 28px; }

    /* ── SECTION HEADER ── */
    .qx-sec-hdr {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.1rem 1.2rem .5rem;
    }
    .qx-sec-title { font-size: 13px; font-weight: 700; color: var(--black); letter-spacing: .02em; text-transform: uppercase; }
    .qx-sec-link { font-size: 12px; font-weight: 600; color: var(--gold); background: none; border: none; cursor: pointer; font-family: inherit; padding: 0; }

    /* ── PORTFOLIO PERFORMANCE CARD ── */
    .qx-portfolio-wrap { padding:0 1.2rem; }
    .qx-portfolio-card {
      background: #fff;
      border: 1.5px solid rgba(201,162,39,.3);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 12px 48px rgba(17,17,17,.1), 0 2px 8px rgba(17,17,17,.05),
                  inset 0 1px 0 rgba(255,255,255,1);
      position: relative;
    }
    .qx-portfolio-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, transparent, #C9A227, #FFD66E, #C9A227, transparent);
      pointer-events: none; z-index: 2;
    }
    .qx-pf-head {
      display:flex; align-items:center; justify-content:space-between;
      padding:1rem 1.2rem; border-bottom:1px solid var(--border);
      background: linear-gradient(135deg, #fdfcf8, #fff);
    }
    .qx-pf-head-title { font-size:13px; font-weight:800; color:var(--black); letter-spacing:.01em; }
    .qx-pf-head-tag {
      font-size:9px; font-weight:800; padding:4px 10px; border-radius:999px;
      background:rgba(34,197,94,.1); color:#16a34a; letter-spacing:.06em;
      border:1px solid rgba(34,197,94,.25);
    }
    .qx-pf-stats { display:grid; grid-template-columns:1fr 1fr; }
    .qx-pf-stat {
      padding:1.1rem 1.2rem; border-right:1px solid var(--border);
      border-bottom:1px solid var(--border);
      background: linear-gradient(160deg, #fff 60%, #fdf9ee 100%);
      transition: background .2s;
    }
    .qx-pf-stat:nth-child(2n) { border-right:none; }
    .qx-pf-stat:nth-child(n+3) { border-bottom:none; }
    .qx-pf-stat-icon { font-size:18px; margin-bottom:.4rem; }
    .qx-pf-stat-num { font-size:21px; font-weight:800; color:var(--black); letter-spacing:-.02em; }
    .qx-pf-stat-num.gold  { color:var(--gold-dk); }
    .qx-pf-stat-num.green { color:#16a34a; }
    .qx-pf-stat-lbl { font-size:9px; color:var(--muted); margin-top:2px; letter-spacing:.08em; text-transform:uppercase; font-weight:700; }
    .qx-pf-progress { padding:1rem 1.2rem; border-top:1px solid var(--border); background:#fdfbf6; }
    .qx-pf-prog-row { display:flex; justify-content:space-between; margin-bottom:.5rem; }
    .qx-pf-prog-lbl { font-size:11px; color:var(--muted); font-weight:600; }
    .qx-pf-prog-val { font-size:11px; font-weight:800; color:var(--gold-dk); }
    .qx-pf-prog-track {
      height:7px; background:var(--bg2); border-radius:999px; overflow:hidden;
      box-shadow:inset 0 2px 4px rgba(0,0,0,.08);
    }
    .qx-pf-prog-fill {
      height:100%; border-radius:999px;
      background:linear-gradient(90deg,#9B7A10,#C9A227,#FFD66E,#C9A227);
      background-size:300% 100%;
      animation:hd-shimmer-sweep 2.5s linear infinite;
      box-shadow:0 0 10px rgba(201,162,39,.45);
    }

    /* ── PLATFORM STATS ── */
    /* ══ SMOOTH PRESS FEEDBACK ═══════════════════════════════════════════ */
    * { -webkit-tap-highlight-color: transparent; }

    button, .hd-qa-item, .hd-plan-card, .hd-reward-card,
    .hd-sup-card, .hd-edu-row, .tm-level-row, .pf-row,
    .wallet-net-card, .nav-item, .hd-lb-row, .tm-member-row,
    .hd-badge-card, .tm-reward-row, .tm-comm-type-row, .hdr-ibtn,
    .hdr-pill, .hd-calc-plan-btn, .hd-lb-tab, .tm-tab, .tm-filter-btn,
    .glass-tab, .lp-start-btn, .pf-quick-item {
      transition: transform 0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                  opacity   0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                  box-shadow 0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }

    button:active, .hd-qa-item:active, .hd-reward-card:active,
    .hd-sup-card:active, .hd-edu-row:active, .pf-quick-item:active,
    .hd-calc-plan-btn:active, .glass-tab:active, .tm-filter-btn:active,
    .hd-lb-tab:active, .tm-tab:active, .hdr-ibtn:active, .hdr-pill:active {
      transform: scale(0.96) !important;
      opacity: 0.82 !important;
    }

    .hd-plan-card:active, .tm-level-row:active,
    .tm-member-row:active, .hd-lb-row:active,
    .tm-comm-type-row:active, .tm-reward-row:active {
      transform: scale(0.985) !important;
      opacity: 0.88 !important;
    }

    .pf-row:active, .wallet-net-card:active {
      transform: scale(0.992) !important;
      opacity: 0.88 !important;
    }

    .nav-item {
      transition: color 0.18s ease, transform 0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
    .nav-item:active {
      transform: scale(0.88) !important;
      opacity: 0.75 !important;
    }

    .lp-start-btn:active {
      transform: scale(0.97) translateY(0) !important;
      box-shadow: 0 4px 18px rgba(201,162,39,.3) !important;
      opacity: 0.92 !important;
    }

    /* ══════════════════════════════════════════════════════════════════════
       MOBILE COMPACT LAYOUT — max-width: 767px
       Desktop layout is completely untouched above this block.
    ══════════════════════════════════════════════════════════════════════ */
    @media (max-width: 767px) {

      /* ── HEADER ── */
      .hdr-bar { padding: 0 1rem; height: 52px; }
      .hdr-logo-text { font-size: 13px; letter-spacing: .08em; }
      .hdr-logo-sub  { display: none; }
      .hdr-logo-icon { width: 30px; height: 30px; }
      .hdr-pill  { padding: 6px 12px; font-size: 11px; gap: 5px; }
      .hdr-pill svg { width: 13px; height: 13px; }
      .hdr-ibtn  { width: 34px; height: 34px; font-size: 14px; }

      /* ── HERO WELCOME SECTION ── */
      .qx-hero { padding: 1rem 1rem 1.2rem; }
      .qx-hero-toprow { margin-bottom: 1rem; }
      .qx-hero-greeting { font-size: 10px; }
      .qx-hero-name  { font-size: 18px !important; font-weight: 800; }
      .qx-mem-chip   { padding: 4px 9px; font-size: 9px; }
      .qx-bal-main   { font-size: 32px; }
      .qx-bal-usdt   { font-size: 11px; }
      .qx-bal-label  { font-size: 9px; margin-bottom: .35rem; }
      .qx-balance-area { margin-bottom: 1rem; }
      .qx-uid-pill   { font-size: 10px; padding: 4px 10px; margin-top: .7rem; }

      /* Hero stats (Today's Profit / Total Earned) */
      .qx-hero-stats { gap: 7px; }
      .qx-hstat { padding: .6rem .8rem; border-radius: 11px; }
      .qx-hstat-lbl { font-size: 8px; margin-bottom: .2rem; }
      .qx-hstat-val { font-size: 15px; }

      /* ── TICKER ── */
      .qx-ticker { height: 28px; }
      .qx-ticker-tag { padding: 0 9px; font-size: 10px; }
      .qx-ticker-text { font-size: 10px; }

      /* ── SECTION HEADER ── */
      .qx-sec-hdr { padding: .7rem 1rem .35rem; }
      .qx-sec-title { font-size: 11px; letter-spacing: .04em; }
      .qx-sec-link  { font-size: 11px; }

      /* ── QUICK ACTIONS ── */
      .qx-qa-wrap {
        grid-template-columns: repeat(4, 1fr) !important;
        gap: 7px; padding: 0 1rem;
      }
      .qx-qa-item { padding: .65rem .2rem .55rem; gap: 5px; border-radius: 13px; }
      .qx-qa-circle { width: 36px; height: 36px; border-radius: 11px; }
      .qx-qa-circle svg { width: 16px; height: 16px; }
      .qx-qa-lbl { font-size: 9px; font-weight: 700; }

      /* ── ANNOUNCEMENT SLIDER ── */
      .qx-slider-wrap { padding: .6rem 1rem 0; }
      .qx-slider-track { height: 110px; }
      .qx-slide { padding: .9rem 1rem .8rem; }
      .qx-sl-title { font-size: 14px !important; }
      .qx-sl-body  { font-size: 11px !important; }
      .qx-sl-cta   { padding: 6px 14px; font-size: 11px; }
      .qx-sl-dots  { margin-top: .55rem; }

      /* ── ACTIVE INVESTMENT CARD ── */
      .qx-inv-wrap  { padding: .7rem 1rem 0; }
      .qx-inv-card  { border-radius: 14px; }
      .qx-inv-head  { padding: .7rem 1rem; }
      .qx-inv-head-title { font-size: 12px; }
      .qx-inv-item  { padding: .75rem 1rem; }
      .qx-inv-plan-name { font-size: 14px; }
      .qx-inv-plan-row  { margin-bottom: .65rem; }
      .qx-inv-grid  { gap: 6px; margin-bottom: .75rem; }
      .qx-inv-g-item { padding: .45rem .3rem; border-radius: 9px; }
      .qx-inv-g-num  { font-size: 13px; }
      .qx-inv-g-lbl  { font-size: 8px; }
      .qx-inv-empty  { padding: 1.2rem 1rem; }
      .qx-inv-empty-icon { font-size: 28px; margin-bottom: .6rem; }
      .qx-inv-empty-title { font-size: 13px; }
      .qx-inv-empty-sub   { font-size: 11px; }

      /* ── PORTFOLIO CARD ── */
      .qx-portfolio-wrap { padding: 0 1rem; }
      .qx-portfolio-card { border-radius: 14px; }
      .qx-pf-head  { padding: .75rem 1rem; }
      .qx-pf-head-title { font-size: 12px; }
      .qx-pf-stat  { padding: .75rem 1rem; }
      .qx-pf-stat-icon { font-size: 14px; margin-bottom: .25rem; }
      .qx-pf-stat-num  { font-size: 15px; }
      .qx-pf-stat-lbl  { font-size: 9px; }
      .qx-pf-progress  { padding: .75rem 1rem; }

      /* ── PLATFORM STATS ── */
      .qx-stats-grid { gap: 7px; padding: 0 1rem .9rem; }
      .qx-stat { padding: .8rem; border-radius: 13px; }
      .qx-stat-icon { font-size: 18px; margin-bottom: .3rem; }
      .qx-stat-val  { font-size: 18px; }
      .qx-stat-lbl  { font-size: 9px; }
      .qx-stat-delta { font-size: 9px; }

      /* ── INVESTMENT PLANS (horizontal scroll on mobile) ── */
      #home-plans-grid {
        display: flex !important;
        flex-direction: row !important;
        overflow-x: auto;
        gap: 10px;
        padding: 0 1rem 1rem;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
      }
      #home-plans-grid::-webkit-scrollbar { display: none; }
      #home-plans-grid .hd-plan-card {
        min-width: 220px;
        scroll-snap-align: start;
        flex-shrink: 0;
      }

      /* ── BOTTOM NAV ── */
      .bottom-nav { padding: 7px 4px 14px; }
      .nav-item { font-size: 9px; min-width: 44px; gap: 3px; padding: 5px 6px; }
      .nav-item i { font-size: 18px; }

      /* ── GENERAL PAGE PADDING ── */
      .page { padding-bottom: 72px; }

      /* ── WALLET PAGE COMPACT ── */
      .wallet-hero { padding: 1.2rem 1rem 1.5rem; }
      .wallet-hero-label { font-size: 9px; }
      .wallet-bal  { font-size: 30px !important; }
      .wallet-usdt { font-size: 11px !important; }
      .wallet-action-btns { gap: 8px; padding: 0 1rem; }
      .wallet-act-btn { padding: 11px; font-size: 12px; border-radius: 12px; gap: 6px; }
      .wallet-section-lbl { font-size: 10px; }
      .wallet-tx-list { padding: 0 1rem 1rem; }
      .wallet-tx { padding: .65rem 0; }
      .tx-type { font-size: 12px; }
      .tx-date  { font-size: 10px; }
      .tx-amt   { font-size: 13px; }
      .wallet-net-card { border-radius: 13px; }

      /* ── PROFILE PAGE COMPACT ── */
      .pf-hero { padding: 1.2rem 1rem 1.3rem; }
      .pf-av   { width: 56px; height: 56px; font-size: 18px; border-radius: 17px; }
      .pf-name { font-size: 16px; }
      .pf-uid  { font-size: 10px; }
      .pf-mem-wrap { margin: .8rem 1rem 0; }
      .pf-mem-card { border-radius: 14px; }
      .pf-section  { padding: 0 .9rem; }
      .pf-card { border-radius: 14px; }
      .pf-row  { padding: .75rem 1rem; }
      .pf-row-title { font-size: 13px; }
      .pf-row-sub   { font-size: 10px; }
      .pf-row-icon  { width: 34px; height: 34px; border-radius: 10px; font-size: 16px; }
      .pf-section-label { font-size: 8px; margin: 1rem 0 .5rem; letter-spacing:.15em; }
      .pf-quick-grid { grid-template-columns: repeat(4,1fr); gap: 8px; padding: .75rem .75rem; }
      .pf-quick-item { padding: .6rem .3rem .5rem; border-radius: 12px; }
      .pf-quick-icon { width: 34px; height: 34px; font-size: 16px; border-radius: 10px; }
      .pf-quick-lbl  { font-size: 9px; }

      /* ── REFERRAL/TEAM PAGE COMPACT ── */
      .tm-hero { padding: 1.1rem 1rem 1.2rem; }
      .tm-hero-badge { font-size: 9px; padding: 3px 9px; }
      .tm-hero-title { font-size: 20px; }
      .tm-hero-p     { font-size: 10px; }
      .tm-hero-stats { }
      .tm-hs  { padding: .6rem .3rem; }
      .tm-hs-n { font-size: 12px; }
      .tm-hs-l { font-size: 8px; }
      .tm-ref-card { margin: 0 1rem; border-radius: 14px; }
      .tm-sec  { padding: 0 1rem; }
      .tm-lbl  { font-size: 10px; }
      .tm-level-row { padding: .65rem .85rem; border-radius: 12px; }
      .tm-lv-info-name { font-size: 12px; }
      .tm-lv-info-sub  { font-size: 10px; }
      .tm-tabs-wrap { padding: .5rem 1rem; }
      .tm-tab  { font-size: 11px; padding: .45rem .9rem; }
      .tm-comm-card { border-radius: 14px; }
      .tm-comm-num  { font-size: 26px; }

      /* ── PLANS PAGE COMPACT ── */
      .plans-hero { padding: 1.2rem 1rem; }
      .plans-hero h1 { font-size: 20px; }
      .plans-grid {
        grid-template-columns: 1fr 1fr !important;
        gap: 10px; padding: 0 1rem 1rem;
      }
      .plan-card { border-radius: 14px; }

      /* ── MODALS COMPACT ── */
      .qx-modal { border-radius: 20px 20px 0 0; max-height: 90vh; overflow-y: auto; }
      .qx-modal-head { padding: .9rem 1.1rem .75rem; }
      .qx-modal-title { font-size: 14px; }

    }
  </style>
</head>
<body>

<!-- ══ PREMIUM HEADER ══ -->
<header class="top-header">
  <div class="hdr-inner">

    <!-- LEFT: Avatar + Logo -->
    <div class="hdr-avatar">
      <div class="hdr-av-circle" onclick="showPage('profile')" title="Profile &amp; Settings">AK</div>
      <span class="hdr-online"></span>
    </div>
    <div class="hdr-sep"></div>
    <div class="hdr-logo">
      <div class="hdr-emblem">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <polyline points="2 12 6 12 9 3 15 21 18 12 22 12" stroke="#C9A227" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="hdr-wordmark">
        <div class="hdr-brand">
          <span class="hdr-brand-q">QAVIX</span>
          <span class="hdr-brand-g">GLOBAL</span>
        </div>
        <div class="hdr-tagline">Premium Investment Platform</div>
      </div>
    </div>

    <!-- RIGHT: Icon buttons -->
    <div class="hdr-right">

      <!-- Notifications -->
      <div class="hdr-wrap" id="hdr-notif-wrap">
        <button class="hdr-ibtn" id="hdr-notif-icon" onclick="hdrToggle('notif')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span class="hdr-badge" id="hdr-notif-badge">3</span>
        </button>
        <div class="hdr-dd" id="hdr-notif-dd" style="width:305px;right:-8px">
          <div class="hdr-dd-head">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:13px;font-weight:700;color:#111">Notifications</span>
              <span id="hdr-new-badge" style="background:#C9A227;color:#111;font-size:9px;font-weight:800;padding:1px 7px;border-radius:999px;display:none">0 new</span>
            </div>
            <button class="hdr-mrall" onclick="markAllNotifsRead()">✓✓ Mark all read</button>
          </div>
          <div style="max-height:320px;overflow-y:auto" id="hdr-notif-list">
            <div style="text-align:center;padding:24px;color:#999;font-size:12px">Loading...</div>
          </div>
          <div class="hdr-dd-foot"><button class="hdr-dd-foot-btn" onclick="loadNotifications()">Refresh ↻</button></div>
        </div>
      </div>

      <div class="hdr-vsep"></div>
      <button class="hdr-cta" onclick="showPage('profile')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>Profile
      </button>
    </div>

    <!-- Mobile burger -->
    <button class="hdr-burger" id="hdr-burger" onclick="hdrMobileToggle()">
      <svg id="hdr-burger-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>

  </div>

  <!-- Mobile menu -->
  <div class="hdr-mobile-menu" id="hdr-mobile-menu">
    <div class="hdr-mob-label">Language</div>
    <div class="hdr-mob-langs">
      <button class="hdr-mob-lang-btn sel" onclick="hdrMobLang(this,'🇺🇸','EN')">🇺🇸 English</button>
      <button class="hdr-mob-lang-btn" onclick="hdrMobLang(this,'🇧🇩','BN')">🇧🇩 Bengali</button>
      <button class="hdr-mob-lang-btn" onclick="hdrMobLang(this,'🇮🇳','HI')">🇮🇳 Hindi</button>
      <button class="hdr-mob-lang-btn" onclick="hdrMobLang(this,'🇸🇦','AR')">🇸🇦 Arabic</button>
    </div>
    <div class="hdr-mob-label" style="margin-top:12px;border-top:1px solid #F0EDE7;padding-top:12px">Support</div>
    <div class="hdr-mob-support">
      <button class="hdr-mob-sup-btn" onclick="openLiveChat()">💬 Live Chat</button>
      <button class="hdr-mob-sup-btn">✈️ Telegram</button>
      <button class="hdr-mob-sup-btn">📧 Email</button>
      <button class="hdr-mob-sup-btn">📖 Help Center</button>
    </div>
    <button class="hdr-mob-cta" onclick="showPage('wallet');hdrMobileToggle()">Open Dashboard →</button>
  </div>
</header>

<!-- ══ PAGE: HOME DASHBOARD ══ -->
<div class="page active hd" id="page-home">

  <!-- PORTFOLIO HERO -->
  <div class="qx-hero">
    <div class="qx-hero-glow"></div>
    <div class="qx-hero-glow2"></div>

    <!-- Top row: greeting + membership -->
    <div class="qx-hero-toprow">
      <div>
        <div class="qx-hero-greeting">Welcome Back 👋</div>
        <div class="qx-hero-name" id="ph-username" style="font-size:26px;font-weight:800;letter-spacing:-.02em">Loading...</div>
      </div>
      <div class="qx-mem-chip" id="ph-mem-badge" style="padding:6px 13px;border-radius:999px;display:flex;align-items:center;gap:5px;background:rgba(201,162,39,.12);border:1px solid rgba(201,162,39,.25);font-size:11px;font-weight:700;color:var(--gold);flex-shrink:0;white-space:nowrap">
        <span class="qx-mem-dot" id="ph-mem-dot" style="font-size:8px;line-height:1">●</span>
        <span id="ph-mem-text">Free Member</span>
      </div>
    </div>

    <!-- Balance -->
    <div class="qx-balance-area">
      <div class="qx-bal-label">Portfolio Value</div>
      <div class="qx-bal-main" id="ph-balance">$0.00</div>
      <div class="qx-bal-usdt" id="ph-balance-usdt">≈ 0.00 USDT</div>
    </div>

    <!-- Stats row: today profit + total earned -->
    <div class="qx-hero-stats">
      <div class="qx-hstat">
        <div class="qx-hstat-lbl">Today's Profit</div>
        <div class="qx-hstat-val green" id="ph-today-profit">$0.00</div>
      </div>
      <div class="qx-hstat">
        <div class="qx-hstat-lbl">Total Earned</div>
        <div class="qx-hstat-val gold" id="ph-total-earned">$0.00</div>
      </div>
    </div>

    <!-- UID pill -->
    <button class="qx-uid-pill" id="qx-uid-pill" onclick="copyHeroUID()">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      <span id="ph-hero-uid">QVX-000000</span>
    </button>
  </div>

  <!-- ANNOUNCEMENT SLIDER -->
  <div class="qx-slider-wrap" id="qx-slider-wrap">
    <div class="qx-slider" id="qx-slider"
         onmouseenter="qxSliderPause()" onmouseleave="qxSliderResume()"
         ontouchstart="qxTouchStart(event)" ontouchmove="qxTouchMove(event)" ontouchend="qxTouchEnd(event)">

      <div class="qx-slider-track" id="qx-slider-track">

        <!-- Slide 1 — Limited Offer -->
        <div class="qx-slide qx-sl-1 active" data-idx="0">
          <div class="qx-sl-glow"></div>
          <div class="qx-sl-bot-line"></div>
          <div class="qx-sl-illu">💰</div>
          <div class="qx-sl-top">
            <span class="qx-sl-tag qx-sl-tag-gold">🔥 Limited Offer</span>
            <span class="qx-sl-num">01 / 06</span>
          </div>
          <div class="qx-sl-body">
            <div class="qx-sl-headline">Premium Plan<br><em>360% ROI</em></div>
            <div class="qx-sl-sub">Invest $500 · Earn $30 daily for 60 days · Maximum returns</div>
          </div>
          <div class="qx-sl-bottom">
            <button class="qx-sl-cta qx-sl-cta-gold" onclick="showPage('plans')">
              Explore Plans
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        </div>

        <!-- Slide 2 — Security Notice -->
        <div class="qx-slide qx-sl-4" data-idx="1">
          <div class="qx-sl-glow"></div>
          <div class="qx-sl-bot-line"></div>
          <div class="qx-sl-illu">🛡️</div>
          <div class="qx-sl-top">
            <span class="qx-sl-tag qx-sl-tag-red">🔒 Security Notice</span>
            <span class="qx-sl-num">02 / 06</span>
          </div>
          <div class="qx-sl-body">
            <div class="qx-sl-headline">Enhanced Wallet<br><em>Protection</em></div>
            <div class="qx-sl-sub">Email OTP · Withdrawal Password · Encrypted Wallet · SSL Security</div>
          </div>
          <div class="qx-sl-bottom">
            <button class="qx-sl-cta qx-sl-cta-red" onclick="showPage('profile')">
              Review Security
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        </div>

        <!-- Slide 3 — Platform Update -->
        <div class="qx-slide qx-sl-5" data-idx="2">
          <div class="qx-sl-glow"></div>
          <div class="qx-sl-bot-line"></div>
          <div class="qx-sl-illu">⚡</div>
          <div class="qx-sl-top">
            <span class="qx-sl-tag qx-sl-tag-blue">⚡ Platform Update</span>
            <span class="qx-sl-num">03 / 06</span>
          </div>
          <div class="qx-sl-body">
            <div class="qx-sl-headline">Faster Deposit<br><em>Verification</em></div>
            <div class="qx-sl-sub">USDT deposits are now processed automatically within seconds.</div>
          </div>
          <div class="qx-sl-bottom">
            <button class="qx-sl-cta qx-sl-cta-blue" onclick="goToWalletAction('deposit')">
              Deposit Now
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        </div>

        <!-- Slide 4 — Community -->
        <div class="qx-slide qx-sl-2" data-idx="3">
          <div class="qx-sl-glow"></div>
          <div class="qx-sl-bot-line"></div>
          <div class="qx-sl-illu">🌍</div>
          <div class="qx-sl-top">
            <span class="qx-sl-tag qx-sl-tag-green">🌍 Community</span>
            <span class="qx-sl-num">04 / 06</span>
          </div>
          <div class="qx-sl-body">
            <div class="qx-sl-headline">Join The QAVIX<br><em>Community</em></div>
            <div class="qx-sl-sub">Stay updated with announcements, rewards and events.</div>
          </div>
          <div class="qx-sl-bottom">
            <button class="qx-sl-cta qx-sl-cta-green" onclick="showPage('about')">
              Our Community
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        </div>

        <!-- Slide 5 — Mobile App -->
        <div class="qx-slide qx-sl-5" data-idx="4">
          <div class="qx-sl-glow"></div>
          <div class="qx-sl-bot-line"></div>
          <div class="qx-sl-illu">📱</div>
          <div class="qx-sl-top">
            <span class="qx-sl-tag qx-sl-tag-green">📱 Mobile App</span>
            <span class="qx-sl-num">05 / 06</span>
          </div>
          <div class="qx-sl-body">
            <div class="qx-sl-headline">QAVIX App<br><em>Coming Soon</em></div>
            <div class="qx-sl-sub">Manage investments, withdrawals and earnings from anywhere.</div>
          </div>
          <div class="qx-sl-bottom">
            <button class="qx-sl-cta qx-sl-cta-green" onclick="doCheckIn()">
              Pre-Register
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        </div>

        <!-- Slide 6 — Daily Rewards -->
        <div class="qx-slide qx-sl-6" data-idx="5">
          <div class="qx-sl-glow"></div>
          <div class="qx-sl-bot-line"></div>
          <div class="qx-sl-illu">🎁</div>
          <div class="qx-sl-top">
            <span class="qx-sl-tag qx-sl-tag-indigo">🎁 New Feature</span>
            <span class="qx-sl-num">06 / 06</span>
          </div>
          <div class="qx-sl-body">
            <div class="qx-sl-headline">Daily Check-In<br><em>Rewards</em></div>
            <div class="qx-sl-sub">Claim your daily bonus every 24 hours · Lucky draws · Milestone rewards.</div>
          </div>
          <div class="qx-sl-bottom">
            <button class="qx-sl-cta qx-sl-cta-indigo" onclick="doCheckIn()">
              Check In Now
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        </div>

      </div><!-- /track -->
    </div><!-- /slider -->

    <!-- Dots -->
    <div class="qx-slider-dots" id="qx-slider-dots">
      <div class="qx-sl-dot active" onclick="qxGoTo(0)"></div>
      <div class="qx-sl-dot" onclick="qxGoTo(1)"></div>
      <div class="qx-sl-dot" onclick="qxGoTo(2)"></div>
      <div class="qx-sl-dot" onclick="qxGoTo(3)"></div>
      <div class="qx-sl-dot" onclick="qxGoTo(4)"></div>
      <div class="qx-sl-dot" onclick="qxGoTo(5)"></div>
    </div>
  </div>

  <!-- QUICK ACTIONS 4-COLUMN GRID -->
  <div class="qx-sec-hdr" style="padding-top:1.2rem"><span class="qx-sec-title">Quick Actions</span></div>
  <div class="qx-qa-wrap">

    <!-- 1. Deposit -->
    <button class="qx-qa-item" onclick="goToWalletAction('deposit')">
      <div class="qx-qa-circle qx-qa-gold">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9B7A10" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
      </div>
      <span class="qx-qa-lbl">Deposit</span>
    </button>

    <!-- 2. Withdraw -->
    <button class="qx-qa-item" onclick="goToWalletAction('withdraw')">
      <div class="qx-qa-circle qx-qa-blue">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
      </div>
      <span class="qx-qa-lbl">Withdraw</span>
    </button>

    <!-- 3. Settings -->
    <button class="qx-qa-item" onclick="showPage('profile')">
      <div class="qx-qa-circle qx-qa-purple">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      </div>
      <span class="qx-qa-lbl">Settings</span>
    </button>

    <!-- 4. Check In -->
    <button class="qx-qa-item" id="checkin-btn" onclick="doCheckIn()">
      <div class="qx-qa-circle qx-qa-green" id="checkin-icon-wrap">
        <svg id="checkin-icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <span class="qx-qa-lbl" id="checkin-lbl">Check In</span>
    </button>

    <!-- 5. Invite -->
    <button class="qx-qa-item" onclick="openInviteModal()">
      <div class="qx-qa-circle qx-qa-pink">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#db2777" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
      </div>
      <span class="qx-qa-lbl">Invite</span>
    </button>

    <!-- 6. Community -->
    <button class="qx-qa-item" onclick="window.open('https://t.me/qavixglobal','_blank')">
      <div class="qx-qa-circle qx-qa-cyan">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </div>
      <span class="qx-qa-lbl">Community</span>
    </button>

    <!-- 7. Tutorial -->
    <button class="qx-qa-item" onclick="showToast('Video tutorials coming soon 🎬','warning')">
      <div class="qx-qa-circle qx-qa-orange">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
      </div>
      <span class="qx-qa-lbl">Tutorial</span>
    </button>

    <!-- 8. Support -->
    <button class="qx-qa-item" onclick="window.open('https://t.me/QavixGlobal_Support','_blank')">
      <div class="qx-qa-circle qx-qa-teal">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f766e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="12" y1="7" x2="12" y2="13"/></svg>
      </div>
      <span class="qx-qa-lbl">Support</span>
    </button>

  </div>

  <!-- MY INVESTMENTS -->
  <div class="qx-inv-wrap">
    <div class="qx-sec-hdr" style="padding:1.1rem 0 .5rem"><span class="qx-sec-title">My Investments</span><button class="qx-sec-link" onclick="showPage('plans')">View Plans →</button></div>
    <div class="qx-inv-card">
      <div class="qx-inv-head">
        <span class="qx-inv-head-title">Active Plan</span>
        <span class="qx-inv-head-badge qx-inv-badge-active" id="inv-status-badge" style="display:none">● Active</span>
      </div>
      <!-- Active state (shown when plan active, hidden by default) -->
      <div class="qx-inv-item" id="inv-active-state" style="display:none">
        <div class="qx-inv-plan-row">
          <div class="qx-inv-plan-name" id="inv-plan-name">Advanced Plan</div>
          <div class="qx-inv-plan-roi" id="inv-plan-roi">ROI 225%</div>
        </div>
        <div class="qx-inv-grid">
          <div class="qx-inv-g-item">
            <div class="qx-inv-g-num gold" id="inv-amount">$100</div>
            <div class="qx-inv-g-lbl">Invested</div>
          </div>
          <div class="qx-inv-g-item">
            <div class="qx-inv-g-num green" id="inv-daily">$5.00</div>
            <div class="qx-inv-g-lbl">Daily</div>
          </div>
          <div class="qx-inv-g-item">
            <div class="qx-inv-g-num" id="inv-days">32 days</div>
            <div class="qx-inv-g-lbl">Remaining</div>
          </div>
        </div>
        <div class="qx-inv-progress">
          <div class="qx-inv-prog-row">
            <span class="qx-inv-prog-lbl">Progress</span>
            <span class="qx-inv-prog-pct" id="inv-pct">0%</span>
          </div>
          <div class="qx-inv-prog-track">
            <div class="qx-inv-prog-fill" id="inv-prog-fill" style="width:0%"></div>
          </div>
        </div>
      </div>
      <!-- Empty state (shown when no plan) -->
      <div class="qx-inv-empty" id="inv-empty-state">
        <div class="qx-inv-empty-icon">📈</div>
        <div class="qx-inv-empty-title">No Active Investment</div>
        <div class="qx-inv-empty-sub">Start earning daily returns by activating an investment plan.</div>
        <button class="qx-inv-empty-btn" onclick="showPage('plans')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          View Investment Plans
        </button>
      </div>
    </div>
  </div>

  <!-- PORTFOLIO PERFORMANCE -->
  <div class="qx-sec-hdr"><span class="qx-sec-title">Portfolio Overview</span></div>
  <div class="qx-portfolio-wrap">
    <div class="qx-portfolio-card">
      <div class="qx-pf-head">
        <span class="qx-pf-head-title">Performance Summary</span>
        <span class="qx-pf-head-tag">LIVE</span>
      </div>
      <div class="qx-pf-stats">
        <div class="qx-pf-stat">
          <div class="qx-pf-stat-icon">💰</div>
          <div class="qx-pf-stat-num gold" id="pf-total-invested">$0.00</div>
          <div class="qx-pf-stat-lbl">Total Invested</div>
        </div>
        <div class="qx-pf-stat">
          <div class="qx-pf-stat-icon">📈</div>
          <div class="qx-pf-stat-num green" id="pf-total-earned">$0.00</div>
          <div class="qx-pf-stat-lbl">Total Earned</div>
        </div>
        <div class="qx-pf-stat">
          <div class="qx-pf-stat-icon">⚡</div>
          <div class="qx-pf-stat-num" id="pf-active-count">0</div>
          <div class="qx-pf-stat-lbl">Active Plans</div>
        </div>
        <div class="qx-pf-stat">
          <div class="qx-pf-stat-icon">🏆</div>
          <div class="qx-pf-stat-num gold" id="pf-roi">0%</div>
          <div class="qx-pf-stat-lbl">Current ROI</div>
        </div>
      </div>
      <div class="qx-pf-progress">
        <div class="qx-pf-prog-row">
          <span class="qx-pf-prog-lbl">Profit Progress</span>
          <span class="qx-pf-prog-val" id="pf-prog-label">0% earned</span>
        </div>
        <div class="qx-pf-prog-track">
          <div class="qx-pf-prog-fill" id="pf-prog-fill" style="width:0%"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- INVESTMENT PLANS CAROUSEL -->
  <div class="qx-sec-hdr"><span class="qx-sec-title">Investment Plans</span><button class="qx-sec-link" onclick="showPage('plans')">All Plans →</button></div>
  <div class="hd-plan-carousel-wrap" id="hd-plan-carousel-wrap">
    <div class="hd-plan-carousel" id="hd-plan-carousel">

      <!-- BRONZE -->
      <div class="hd-plan-slide" onclick="showPage('plans');setTimeout(()=>openInvestModal('bronze'),300)">
        <div class="hd-pc-outer hd-pc-bronze">
          <div class="hd-pc-card">
            <div class="hd-pc-wm">🥉</div>
            <div class="hd-pc-pill hd-pc-pill-bronze">🥉 &nbsp;Bronze Tier</div>
            <div style="display:flex;align-items:center;gap:13px;margin-bottom:16px;position:relative;z-index:1">
              <div class="hd-pc-em hd-pc-em-bronze">🥉</div>
              <div>
                <div class="hd-pc-name">QAVIX BRONZE</div>
                <div class="hd-pc-desc">Entry-level · $5–$20 USDT</div>
              </div>
            </div>
            <div class="hd-pc-stats">
              <div class="hd-pc-stat"><span class="hd-pc-sl">Daily ROI</span><span class="hd-pc-sv hd-pc-sv-roi" style="color:#9B6A1A">5.5%</span></div>
              <div class="hd-pc-stat"><span class="hd-pc-sl">Duration</span><span class="hd-pc-sv">20 Days</span></div>
              <div class="hd-pc-stat"><span class="hd-pc-sl">Range</span><span class="hd-pc-sv" style="font-size:13px">$5–$20</span></div>
            </div>
            <button class="hd-pc-btn hd-pc-btn-bronze" onclick="event.stopPropagation();showPage('plans');setTimeout(()=>openInvestModal('bronze'),300)">Invest Now →</button>
          </div>
        </div>
      </div>

      <!-- SILVER -->
      <div class="hd-plan-slide" onclick="showPage('plans');setTimeout(()=>openInvestModal('silver'),300)">
        <div class="hd-pc-outer hd-pc-silver">
          <div class="hd-pc-card">
            <div class="hd-pc-wm">🥈</div>
            <div class="hd-pc-pill hd-pc-pill-silver">🥈 &nbsp;Silver Tier</div>
            <div style="display:flex;align-items:center;gap:13px;margin-bottom:16px;position:relative;z-index:1">
              <div class="hd-pc-em hd-pc-em-silver">🥈</div>
              <div>
                <div class="hd-pc-name">QAVIX SILVER</div>
                <div class="hd-pc-desc">Steady growth · $21–$100 USDT</div>
              </div>
            </div>
            <div class="hd-pc-stats">
              <div class="hd-pc-stat"><span class="hd-pc-sl">Daily ROI</span><span class="hd-pc-sv hd-pc-sv-roi" style="color:#555">6.0%</span></div>
              <div class="hd-pc-stat"><span class="hd-pc-sl">Duration</span><span class="hd-pc-sv">20 Days</span></div>
              <div class="hd-pc-stat"><span class="hd-pc-sl">Range</span><span class="hd-pc-sv" style="font-size:13px">$21–$100</span></div>
            </div>
            <button class="hd-pc-btn hd-pc-btn-silver" onclick="event.stopPropagation();showPage('plans');setTimeout(()=>openInvestModal('silver'),300)">Invest Now →</button>
          </div>
        </div>
      </div>

      <!-- GOLD -->
      <div class="hd-plan-slide" onclick="showPage('plans');setTimeout(()=>openInvestModal('gold'),300)">
        <div class="hd-pc-outer hd-pc-gold">
          <div class="hd-pc-card">
            <div class="hd-pc-ribbon">★ Recommended</div>
            <div class="hd-pc-wm">🥇</div>
            <div class="hd-pc-pill hd-pc-pill-gold">🥇 &nbsp;Gold Tier</div>
            <div style="display:flex;align-items:center;gap:13px;margin-bottom:16px;position:relative;z-index:1">
              <div class="hd-pc-em hd-pc-em-gold">🥇</div>
              <div>
                <div class="hd-pc-name">QAVIX GOLD</div>
                <div class="hd-pc-desc">Most popular · $101–$300 USDT</div>
              </div>
            </div>
            <div class="hd-pc-stats">
              <div class="hd-pc-stat"><span class="hd-pc-sl">Daily ROI</span><span class="hd-pc-sv hd-pc-sv-roi" style="color:#9B7A10">6.5%</span></div>
              <div class="hd-pc-stat"><span class="hd-pc-sl">Duration</span><span class="hd-pc-sv">20 Days</span></div>
              <div class="hd-pc-stat"><span class="hd-pc-sl">Range</span><span class="hd-pc-sv" style="font-size:12px">$101–$300</span></div>
            </div>
            <button class="hd-pc-btn hd-pc-btn-gold" onclick="event.stopPropagation();showPage('plans');setTimeout(()=>openInvestModal('gold'),300)">Invest Now →</button>
          </div>
        </div>
      </div>

      <!-- ELITE -->
      <div class="hd-plan-slide" onclick="showPage('plans');setTimeout(()=>openInvestModal('elite'),300)">
        <div class="hd-pc-outer hd-pc-elite">
          <div class="hd-pc-card">
            <div class="hd-pc-wm">💎</div>
            <div class="hd-pc-pill hd-pc-pill-elite">💎 &nbsp;Elite Tier</div>
            <div style="display:flex;align-items:center;gap:13px;margin-bottom:16px;position:relative;z-index:1">
              <div class="hd-pc-em hd-pc-em-elite">💎</div>
              <div>
                <div class="hd-pc-name">QAVIX ELITE</div>
                <div class="hd-pc-desc">Max returns · $301–$1,000 USDT</div>
              </div>
            </div>
            <div class="hd-pc-stats">
              <div class="hd-pc-stat"><span class="hd-pc-sl">Daily ROI</span><span class="hd-pc-sv hd-pc-sv-roi" style="color:#5B3FA0">7.5%</span></div>
              <div class="hd-pc-stat"><span class="hd-pc-sl">Duration</span><span class="hd-pc-sv">20 Days</span></div>
              <div class="hd-pc-stat"><span class="hd-pc-sl">Range</span><span class="hd-pc-sv" style="font-size:12px">$301–$1K</span></div>
            </div>
            <button class="hd-pc-btn hd-pc-btn-elite" onclick="event.stopPropagation();showPage('plans');setTimeout(()=>openInvestModal('elite'),300)">Invest Now →</button>
          </div>
        </div>
      </div>

    </div>
    <!-- Dots -->
    <div class="hd-plan-dots" id="hd-plan-dots">
      <span class="hd-plan-dot active" onclick="hdPlanGoTo(0)"></span>
      <span class="hd-plan-dot" onclick="hdPlanGoTo(1)"></span>
      <span class="hd-plan-dot" onclick="hdPlanGoTo(2)"></span>
      <span class="hd-plan-dot" onclick="hdPlanGoTo(3)"></span>
    </div>
  </div>

  <div class="hd-spacer"></div>
</div>


<!-- ══ PAGE: PLANS ══ -->
<div class="page" id="page-plans">
  <div class="plans-page">

    <!-- Hero -->
    <div class="qxp-hero">
      <div class="qxp-hero-eye">Investment Plans</div>
      <h2 class="qxp-hero-h">Choose Your Tier</h2>
      
    </div>

    <!-- Premium Card Stack -->
    <div class="qxp-stack">

      <!-- ══ BRONZE ══ -->
      <div class="qxp-outer qxp-bronze">
        <div class="qxp-card">
          <div class="qxp-wm">🥉</div>
          <div class="qxp-pill qxp-pill-bronze">🥉 &nbsp;Bronze Tier</div>
          <div class="qxp-head">
            <div class="qxp-em qxp-em-bronze">🥉</div>
            <div>
              <div class="qxp-name">QAVIX BRONZE</div>
              <div class="qxp-desc">Entry-level investment plan</div>
            </div>
          </div>
          <div class="qxp-stats">
            <div class="qxp-stat">
              <span class="qxp-sl">Daily ROI</span>
              <span class="qxp-sv qxp-sv-roi" style="color:#9B6A1A">5.5%</span>
            </div>
            <div class="qxp-stat">
              <span class="qxp-sl">Duration</span>
              <span class="qxp-sv">20 Days</span>
            </div>
            <div class="qxp-stat">
              <span class="qxp-sl">Range</span>
              <span class="qxp-sv" style="font-size:13px">$5–$20</span>
            </div>
          </div>
          <button class="qxp-btn qxp-btn-bronze" onclick="openInvestModal('bronze')">Invest Now &nbsp;→</button>
        </div>
      </div>

      <!-- ══ SILVER ══ -->
      <div class="qxp-outer qxp-silver">
        <div class="qxp-card">
          <div class="qxp-wm">🥈</div>
          <div class="qxp-pill qxp-pill-silver">🥈 &nbsp;Silver Tier</div>
          <div class="qxp-head">
            <div class="qxp-em qxp-em-silver">🥈</div>
            <div>
              <div class="qxp-name">QAVIX SILVER</div>
              <div class="qxp-desc">Steady growth for growing portfolios</div>
            </div>
          </div>
          <div class="qxp-stats">
            <div class="qxp-stat">
              <span class="qxp-sl">Daily ROI</span>
              <span class="qxp-sv qxp-sv-roi" style="color:#555">6.0%</span>
            </div>
            <div class="qxp-stat">
              <span class="qxp-sl">Duration</span>
              <span class="qxp-sv">20 Days</span>
            </div>
            <div class="qxp-stat">
              <span class="qxp-sl">Range</span>
              <span class="qxp-sv" style="font-size:13px">$21–$100</span>
            </div>
          </div>
          <button class="qxp-btn qxp-btn-silver" onclick="openInvestModal('silver')">Invest Now &nbsp;→</button>
        </div>
      </div>

      <!-- ══ GOLD ★ Recommended ══ -->
      <div class="qxp-outer qxp-gold">
        <div class="qxp-card">
          <div class="qxp-ribbon">★ &nbsp;Recommended</div>
          <div class="qxp-wm">🥇</div>
          <div class="qxp-pill qxp-pill-gold">🥇 &nbsp;Gold Tier</div>
          <div class="qxp-head">
            <div class="qxp-em qxp-em-gold">🥇</div>
            <div>
              <div class="qxp-name">QAVIX GOLD</div>
              <div class="qxp-desc">Our most popular premium tier</div>
            </div>
          </div>
          <div class="qxp-stats">
            <div class="qxp-stat">
              <span class="qxp-sl">Daily ROI</span>
              <span class="qxp-sv qxp-sv-roi" style="color:#9B7A10">6.5%</span>
            </div>
            <div class="qxp-stat">
              <span class="qxp-sl">Duration</span>
              <span class="qxp-sv">20 Days</span>
            </div>
            <div class="qxp-stat">
              <span class="qxp-sl">Range</span>
              <span class="qxp-sv" style="font-size:12px">$101–$300</span>
            </div>
          </div>
          <button class="qxp-btn qxp-btn-gold" onclick="openInvestModal('gold')">Invest Now &nbsp;→</button>
        </div>
      </div>

      <!-- ══ ELITE ══ -->
      <div class="qxp-outer qxp-elite">
        <div class="qxp-card">
          <div class="qxp-wm">💎</div>
          <div class="qxp-pill qxp-pill-elite">💎 &nbsp;Elite Tier</div>
          <div class="qxp-head">
            <div class="qxp-em qxp-em-elite">💎</div>
            <div>
              <div class="qxp-name">QAVIX ELITE</div>
              <div class="qxp-desc">Maximum returns for serious investors</div>
            </div>
          </div>
          <div class="qxp-stats">
            <div class="qxp-stat">
              <span class="qxp-sl">Daily ROI</span>
              <span class="qxp-sv qxp-sv-roi" style="color:#5B3FA0">7.5%</span>
            </div>
            <div class="qxp-stat">
              <span class="qxp-sl">Duration</span>
              <span class="qxp-sv">20 Days</span>
            </div>
            <div class="qxp-stat">
              <span class="qxp-sl">Range</span>
              <span class="qxp-sv" style="font-size:12px">$301–$1K</span>
            </div>
          </div>
          <button class="qxp-btn qxp-btn-elite" onclick="openInvestModal('elite')">Invest Now &nbsp;→</button>
        </div>
      </div>

    </div><!-- /qxp-stack -->


  </div>
</div>

<!-- ── Investment Modal ── -->
<div class="qx-overlay" id="qx-invest-modal" style="display:none">
  <div class="qx-modal" style="max-width:440px">
    <div class="qx-modal-handle"></div>
    <div class="qx-modal-head">
      <div style="display:flex;align-items:center;gap:10px">
        <div class="qx-modal-icon-wrap" id="inv-modal-icon" style="background:rgba(201,162,39,.12);font-size:22px">💰</div>
        <div>
          <div class="qx-modal-title" id="inv-modal-title">Invest Now</div>
          <div style="font-size:11px;color:var(--muted);margin-top:1px" id="inv-modal-range">$5 – $1,000</div>
        </div>
      </div>
      <button class="qx-modal-close" onclick="document.getElementById('qx-invest-modal').style.display='none'">✕</button>
    </div>
    <div style="padding:0 1.2rem 1.4rem;display:flex;flex-direction:column;gap:10px">
      <div style="font-size:12px;color:var(--muted);line-height:1.7" id="inv-modal-desc">Enter your investment amount.</div>

      <!-- Amount input -->
      <div style="position:relative">
        <span style="position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--gold);font-weight:800;font-size:16px;pointer-events:none">$</span>
        <input id="inv-amount-input" type="number" min="5" max="1000" step="1" placeholder="Enter amount..."
          oninput="updateInvCalc()"
          style="width:100%;padding:13px 13px 13px 28px;border-radius:12px;border:1.5px solid var(--border);
          background:var(--bg);color:var(--black);font-size:18px;font-weight:700;outline:none;
          box-sizing:border-box;font-family:inherit;transition:border-color .2s"
          onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"/>
      </div>

      <!-- Error -->
      <div id="inv-modal-err" style="font-size:12px;color:#dc2626;background:#fff5f5;border:1px solid #fca5a5;border-radius:9px;padding:9px 12px;display:none"></div>

      <!-- Calc -->
      <div id="inv-modal-calc" style="display:none;flex-direction:column;gap:7px">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 12px;background:var(--bg);border-radius:10px;border:1px solid var(--border)">
          <span style="font-size:12px;color:var(--muted)">Daily Profit</span>
          <span style="font-size:14px;font-weight:700;color:#16a34a" id="inv-calc-daily">$0.00</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 12px;background:var(--bg);border-radius:10px;border:1px solid var(--border)">
          <span style="font-size:12px;color:var(--muted)">20-Day Earnings</span>
          <span style="font-size:14px;font-weight:700;color:var(--gold)" id="inv-calc-total">$0.00</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 12px;background:var(--bg);border-radius:10px;border:1px solid var(--border)">
          <span style="font-size:12px;color:var(--muted)">Withdrawal Fee (5%)</span>
          <span style="font-size:14px;font-weight:700;color:#dc2626" id="inv-calc-fee">-$0.00</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 12px;background:var(--bg);border-radius:10px;border:1px solid var(--border)">
          <span style="font-size:12px;color:var(--muted)">Net Earnings</span>
          <span style="font-size:14px;font-weight:700;color:#16a34a" id="inv-calc-net">$0.00</span>
        </div>
      </div>

      <!-- Warning -->
      <div style="background:#FFF8E1;border:1px solid #F0D070;border-radius:10px;padding:10px 13px;font-size:11px;color:#7A5C00;line-height:1.7">
        ⚠ Capital is permanently locked after investing. Only daily profits are credited to your withdrawable balance.
      </div>

      <button id="inv-confirm-btn" disabled onclick="submitInvestment()"
        style="width:100%;padding:14px;border-radius:13px;background:#F1EEE8;border:1.5px solid var(--border);
        color:#bbb;font-size:14px;font-weight:800;cursor:not-allowed;font-family:inherit;transition:all .2s;letter-spacing:.02em">
        Enter a Valid Amount
      </button>
    </div>
  </div>
</div>

<!-- ══ PAGE: TEAM NETWORK ══ -->
<div class="page" id="page-referral">
<div class="tm-body">

  <!-- ─── S1: HERO ──────────────────────────────────────── -->
  <div class="tm-hero">
    <div class="tm-hero-bg-glow"></div>
    <div class="tm-hero-grid"></div>

    <div class="tm-hero-left">
      <div class="tm-hero-eye"><div class="tm-hero-eye-dot"></div>TEAM NETWORK</div>
      <div class="tm-hero-h">Grow Your <em>Global</em><br>Team Network</div>
      <div class="tm-hero-p">Earn commission from 10 levels of your team. Every referral keeps compounding your income — daily, for as long as they invest.</div>
      <button class="tm-hero-btn" onclick="tmCopy('link')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        Invite Now
      </button>
    </div>

    

    <!-- Summary stats -->
    <div class="tm-hero-stats">
      <div class="tm-hs">
        <div class="tm-hs-n" id="tm-stat-team">—</div>
        <div class="tm-hs-l">Total Team</div>
      </div>
      <div class="tm-hs">
        <div class="tm-hs-n green" id="tm-stat-active">—</div>
        <div class="tm-hs-l">Active</div>
      </div>
      <div class="tm-hs">
        <div class="tm-hs-n gold" id="tm-stat-earned">$—</div>
        <div class="tm-hs-l">Commission</div>
      </div>
    </div>
  </div>

  <!-- ─── S2: REFERRAL INFO ──────────────────────────────── -->
  <div class="tm-sec">
    <div class="tm-lbl">Your Referral Info</div>
    <div class="tm-ref-card">
      <div class="tm-ref-sweep"></div>

      <!-- Referral Code -->
      <div class="tm-ref-section">
        <div class="tm-ref-row">
          <span class="tm-ref-label">Referral Code</span>
          <button class="tm-ref-copy-btn" onclick="tmCopy('code',this)">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy
          </button>
        </div>
        <div class="tm-ref-val-box">
          <div class="tm-ref-code-text" id="tm-ref-code">—</div>
        </div>
      </div>

      <!-- Referral Link -->
      <div class="tm-ref-section">
        <div class="tm-ref-row">
          <span class="tm-ref-label">Referral Link</span>
          <button class="tm-ref-copy-btn" onclick="tmCopy('link',this)">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy
          </button>
        </div>
        <div class="tm-ref-val-box">
          <div class="tm-ref-link-text" id="tm-ref-link">https://qavixglobal.pages.dev/?ref=—</div>
        </div>
      </div>

      <!-- Share -->
      <div class="tm-ref-share-row">
        <button class="tm-ref-share-btn">✈️ Telegram</button>
        <button class="tm-ref-share-btn">📱 WhatsApp</button>
        <button class="tm-ref-share-btn">🐦 Twitter</button>
      </div>
    </div>
  </div>

  <!-- ─── S3: COMMISSION OVERVIEW ───────────────────────── -->
  <div class="tm-sec">
    <div class="tm-lbl">Commission Overview</div>
    <div class="tm-comm-card">
      <div class="tm-comm-header">
        <span class="tm-comm-eye">COMMISSION EARNINGS</span>
        <span class="tm-comm-total">All time</span>
      </div>
      <div class="tm-comm-num" id="tm-comm-total">$0.00</div>
      <div class="tm-comm-sub">Across all commission levels</div>
      <div class="tm-comm-grid">
        <div class="tm-comm-item">
          <div class="tm-comm-item-n gold" id="tm-comm-pending">$0.00</div>
          <div class="tm-comm-item-l">Pending Commission</div>
        </div>
        <div class="tm-comm-item">
          <div class="tm-comm-item-n green" id="tm-comm-collected">$0.00</div>
          <div class="tm-comm-item-l">Total Commission</div>
        </div>
      </div>
      <button id="tm-collect-btn" onclick="collectCommission()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        Collect Commission
      </button>
    </div>
  </div>

  <!-- ─── S4: TEAM HIERARCHY ────────────────────────────── -->
  <div class="tm-sec">
    <div class="tm-lbl">Team Network Structure</div>
    <div class="tm-tree-card">
      <div class="tm-tree-root">
        <div class="tm-tree-you">
          <div class="tm-tree-av" id="tm-tree-initials">—</div>
          <div class="tm-tree-you-lbl">You</div>
          <div class="tm-tree-you-sub" id="tm-tree-level">Member</div>
        </div>
      </div>
      <div class="tm-tree-levels" id="tm-tree-levels">
        <div style="text-align:center;padding:24px;color:var(--muted);font-size:12px">Loading team structure...</div>
      </div>
    </div>
  </div>

</div>

  <!-- ─── TABS ─────────────────────────────────────────── -->
  <div class="tm-tabs-wrap">
    <div class="tm-tabs">
      <button class="tm-tab active" onclick="tmTab(this,'stat')">📊 Statistics</button>
      <button class="tm-tab" onclick="tmTab(this,'members')">👥 Members</button>
      <button class="tm-tab" onclick="tmTab(this,'financials')">💰 Financials</button>
    </div>
  </div>

  <!-- Tab: Statistics -->
  <div class="tm-sec tm-tab-pane active" id="tm-pane-stat">
    <div class="tm-lbl">Team Statistics</div>
    <div class="tm-stats-6">

      <div class="tm-stat-box">
        <div class="tm-stat-box-icon-wrap" style="width:44px;height:44px;border-radius:14px;background:linear-gradient(145deg,#111,#2a2a2a);display:flex;align-items:center;justify-content:center;margin-bottom:.8rem;box-shadow:0 4px 14px rgba(0,0,0,.15),inset 0 1px 0 rgba(255,255,255,.08);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div class="tm-stat-box-num" id="tstat-total">0</div>
        <div class="tm-stat-box-lbl">Total Team</div>
      </div>

      <div class="tm-stat-box">
        <div class="tm-stat-box-icon-wrap" style="width:44px;height:44px;border-radius:14px;background:linear-gradient(145deg,#052e16,#065f46);display:flex;align-items:center;justify-content:center;margin-bottom:.8rem;box-shadow:0 4px 14px rgba(5,46,22,.25),inset 0 1px 0 rgba(255,255,255,.08);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        </div>
        <div class="tm-stat-box-num" style="color:#16a34a" id="tstat-active">0</div>
        <div class="tm-stat-box-lbl">Active Members</div>
        <div class="tm-stat-box-delta" id="tstat-active-rate"></div>
      </div>

      <div class="tm-stat-box">
        <div class="tm-stat-box-icon-wrap" style="width:44px;height:44px;border-radius:14px;background:linear-gradient(145deg,#1e3a5f,#1a4080);display:flex;align-items:center;justify-content:center;margin-bottom:.8rem;box-shadow:0 4px 14px rgba(30,58,95,.3),inset 0 1px 0 rgba(255,255,255,.08);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        </div>
        <div class="tm-stat-box-num" id="tstat-l1">0</div>
        <div class="tm-stat-box-lbl">Level 1 Members</div>
      </div>

      <div class="tm-stat-box">
        <div class="tm-stat-box-icon-wrap" style="width:44px;height:44px;border-radius:14px;background:linear-gradient(145deg,#2e1065,#4c1d95);display:flex;align-items:center;justify-content:center;margin-bottom:.8rem;box-shadow:0 4px 14px rgba(46,16,101,.3),inset 0 1px 0 rgba(255,255,255,.08);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </div>
        <div class="tm-stat-box-num" id="tstat-l2plus">0</div>
        <div class="tm-stat-box-lbl">L2–L10 Members</div>
      </div>

      <div class="tm-stat-box full">
        <div style="display:flex;align-items:center;gap:14px">
          <div class="tm-stat-box-icon-wrap" style="width:48px;height:48px;border-radius:15px;background:linear-gradient(145deg,#1a1000,#2a1e00);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 16px rgba(0,0,0,.2),inset 0 1px 0 rgba(255,255,255,.06);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </div>
          <div>
            <div class="tm-stat-box-num" id="tstat-volume">$0.00</div>
            <div class="tm-stat-box-lbl">Team Volume (Total Deposits)</div>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- Tab: Members -->
  <div class="tm-sec tm-tab-pane" id="tm-pane-members">
    <div class="tm-lbl">Team Members</div>
    <div class="tm-search-wrap">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input class="tm-search-inp" type="text" placeholder="Search members..." oninput="tmSearchMembers(this.value)"/>
    </div>
    <div class="tm-filter-row" id="tm-filter-row">
      <button class="tm-filter-btn sel" onclick="tmFilter(this,'all')">All (0)</button>
      <button class="tm-filter-btn" onclick="tmFilter(this,'l1')">L1 (0)</button>
      <button class="tm-filter-btn" onclick="tmFilter(this,'l2')">L2 (0)</button>
      <button class="tm-filter-btn" onclick="tmFilter(this,'l3')">L3 (0)</button>
      <button class="tm-filter-btn" onclick="tmFilter(this,'l4')">L4 (0)</button>
      <button class="tm-filter-btn" onclick="tmFilter(this,'l5')">L5 (0)</button>
      <button class="tm-filter-btn" onclick="tmFilter(this,'l6')">L6 (0)</button>
      <button class="tm-filter-btn" onclick="tmFilter(this,'l7')">L7 (0)</button>
      <button class="tm-filter-btn" onclick="tmFilter(this,'l8')">L8 (0)</button>
      <button class="tm-filter-btn" onclick="tmFilter(this,'l9')">L9 (0)</button>
      <button class="tm-filter-btn" onclick="tmFilter(this,'l10')">L10 (0)</button>
      <button class="tm-filter-btn" onclick="tmFilter(this,'active')">Active</button>
    </div>
    <div class="tm-members-list" id="tm-members-list">
      <div style="text-align:center;padding:24px;color:var(--muted);font-size:12px">Loading members...</div>
    </div>
  </div>

  <!-- Tab: Financials -->
  <div class="tm-sec tm-tab-pane" id="tm-pane-financials">
    <div class="tm-lbl">Team Financials</div>
    <div class="tm-fin-summary">
      <div class="tm-fin-card">
        <div style="width:40px;height:40px;border-radius:13px;background:linear-gradient(145deg,#052e16,#065f46);display:flex;align-items:center;justify-content:center;margin:0 auto .8rem;box-shadow:0 4px 14px rgba(5,46,22,.25);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
        </div>
        <div class="tm-fin-lbl">Team Total Deposit</div>
        <div class="tm-fin-num" style="color:#16a34a" id="fin-total-deposit">$—</div>
        <div class="tm-fin-sub">All members · all time</div>
      </div>
      <div class="tm-fin-card">
        <div style="width:40px;height:40px;border-radius:13px;background:linear-gradient(145deg,#450a0a,#7f1d1d);display:flex;align-items:center;justify-content:center;margin:0 auto .8rem;box-shadow:0 4px 14px rgba(69,10,10,.25);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
        </div>
        <div class="tm-fin-lbl">Team Total Withdraw</div>
        <div class="tm-fin-num" style="color:#dc2626" id="fin-total-withdraw">$—</div>
        <div class="tm-fin-sub">All members · all time</div>
      </div>
    </div>
    <div class="tm-fin-section-lbl">⬇️ Team Deposits</div>
    <div class="tm-fin-list" id="fin-dep-list">
      <div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">Loading...</div>
    </div>
    <div class="tm-fin-section-lbl">💸 Team Withdrawals</div>
    <div class="tm-fin-list" id="fin-wd-list">
      <div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">Loading...</div>
    </div>
  </div>

  <!-- ─── S10: FINAL CTA ──────────────────────────────── -->
  <div style="padding:1.4rem 1.2rem 0">
    <div class="tm-final-cta">
      <div class="tm-cta-h">Grow Your <em>Team</em></div>
      <div class="tm-cta-p">Every friend you invite earns you commission daily — across 10 levels, for as long as they invest.</div>
      <button class="tm-cta-big" onclick="tmCopy('link',this)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
        Invite Friends
      </button>
      <div class="tm-share-row">
        <button class="tm-share-sm">✈️ Telegram</button>
        <button class="tm-share-sm">📱 WhatsApp</button>
        <button class="tm-share-sm">🐦 Twitter</button>
      </div>
    </div>
  </div>
  <div style="height:2rem"></div>

</div>

<!-- ══ PAGE: WALLET ══ -->
<div class="page" id="page-wallet">
  <div class="wallet-page">

    <!-- Balance hero -->
    <div class="wallet-hero">
      <div class="wallet-hero-glow"></div>
      <div class="wallet-hero-label">Total Balance</div>
      <div class="wallet-balance-num" id="wallet-bal-display">$0.00</div>
      <div class="wallet-bal-usdt" id="wallet-bal-usdt">≈ 0.00 USDT</div>
      <div class="wallet-action-btns" id="wallet-action-btns">
        <button class="wallet-act-btn wallet-act-deposit" id="wallet-deposit-btn" onclick="confirmDeposit()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
          Deposit
        </button>
        <button class="wallet-act-btn wallet-act-withdraw" id="wallet-withdraw-btn" onclick="confirmWithdraw()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
          Withdraw
        </button>
      </div>
      <!-- History pill top right -->
      <button onclick="openHistoryModal()" style="position:absolute;top:14px;right:14px;display:flex;align-items:center;gap:5px;padding:5px 12px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:#fff;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s;backdrop-filter:blur(6px)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        History
      </button>
    </div>

    <div class="wallet-body">

      <!-- Supported Networks -->
      <div class="wallet-section-lbl">Supported Networks</div>
      <div class="wallet-networks">
        <div class="wallet-net-card">
          <div class="wallet-net-icon">◈</div>
          <div>
            <div class="wallet-net-name">USDT BEP20</div>
            <div class="wallet-net-sub">TRON Network — Low fees</div>
          </div>
          <span class="wallet-net-badge wnet-active">Recommended</span>
        </div>
        <div class="wallet-net-card">
          <div class="wallet-net-icon">⬡</div>
          <div>
            <div class="wallet-net-name">USDT BEP20</div>
            <div class="wallet-net-sub">BNB Smart Chain — Fast</div>
          </div>
          <span class="wallet-net-badge wnet-fast">Fast</span>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div class="wallet-section-lbl" style="margin-bottom:0">Recent Transactions</div>
        <button onclick="openHistoryModal()" style="font-size:11px;color:var(--gold);background:none;border:none;cursor:pointer;font-family:inherit;font-weight:700">View All →</button>
      </div>
      <div class="wallet-tx-list" id="wallet-tx-list">
        <div style="text-align:center;padding:24px;color:var(--muted);font-size:13px">Loading...</div>
      </div>

    </div>
  </div>
</div>

<!-- ══ PAGE: ABOUT ══ -->
<div class="page" id="page-about">
  <div class="about-page">

    <!-- ─── S1: HERO ─────────────────────────────── -->
    <div class="ab-hero">
      <div class="ab-hero-bg"></div>
      <div class="ab-hero-line"></div>
      <div class="ab-hero-grid"></div>
      <div class="ab-hero-particles" id="ab-particles"></div>

      <div class="ab-hero-content">
        <div class="ab-hero-tag">
          <div class="ab-hero-tag-dot"></div>
          TRUSTED SINCE 2023
        </div>
        <h1 class="ab-hero-h1">Trusted <em>Premium</em><br>Investment Platform</h1>
        <p class="ab-hero-sub">Secure, transparent and designed for long-term digital wealth growth across the globe.</p>
        <div class="ab-hero-btns">
          <button class="ab-btn-primary" onclick="showPage('plans')">
            ✦ Start Investing
          </button>
          <button class="ab-btn-ghost" onclick="document.getElementById('ab-wp').scrollIntoView({behavior:'smooth'})">
            📄 Whitepaper
          </button>
        </div>
      </div>

      <!-- Shield + coins -->
      <div class="ab-hero-glow"></div>
      <div class="ab-hero-shield">
        <svg class="ab-shield-svg" width="130" height="150" viewBox="0 0 130 150" fill="none">
          <defs>
            <linearGradient id="sg1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFD66E"/>
              <stop offset="50%" stop-color="#C9A227"/>
              <stop offset="100%" stop-color="#7A5C00"/>
            </linearGradient>
            <linearGradient id="sg2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="rgba(255,214,110,0.2)"/>
              <stop offset="100%" stop-color="rgba(201,162,39,0)"/>
            </linearGradient>
            <filter id="sglow">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <path d="M65 8 L118 30 L118 75 C118 105 90 130 65 142 C40 130 12 105 12 75 L12 30 Z" fill="url(#sg1)" filter="url(#sglow)" opacity="0.9"/>
          <path d="M65 18 L108 36 L108 75 C108 100 84 122 65 132 C46 122 22 100 22 75 L22 36 Z" fill="url(#sg2)"/>
          <path d="M65 18 L108 36 L108 75 C108 100 84 122 65 132 C46 122 22 100 22 75 L22 36 Z" stroke="rgba(255,214,110,0.3)" stroke-width="1.5" fill="none"/>
          <text x="65" y="85" text-anchor="middle" font-size="36" font-weight="900" fill="#0d0d0d" font-family="Inter">Q</text>
        </svg>
      </div>
      <div class="ab-coin ab-coin-1">$</div>
      <div class="ab-coin ab-coin-2">₮</div>
      <div class="ab-coin ab-coin-3">$</div>
    </div>

    <!-- ─── S2: OUR GOAL ──────────────────────────── -->
    <div class="ab-section">
      <div class="ab-section-tag">OUR PHILOSOPHY</div>
      <div class="ab-section-h">Our <em>Goal</em></div>
      <div class="ab-goal-grid">
        <div class="ab-goal-card">
          <div class="ab-goal-shine"></div>
          <div class="ab-goal-icon">🎯</div>
          <div class="ab-goal-title">Mission</div>
          <div class="ab-goal-text">To democratize digital investment by providing every individual with a secure, transparent, and high-yield platform — making wealth-building accessible to all.</div>
        </div>
        <div class="ab-goal-card">
          <div class="ab-goal-shine"></div>
          <div class="ab-goal-icon">🔭</div>
          <div class="ab-goal-title">Vision</div>
          <div class="ab-goal-text">To become the world's most trusted decentralized investment ecosystem, empowering millions to achieve financial freedom through smart USDT-based growth strategies.</div>
        </div>
        <div class="ab-goal-card">
          <div class="ab-goal-shine"></div>
          <div class="ab-goal-icon">💎</div>
          <div class="ab-goal-title">Core Values</div>
          <div class="ab-goal-text">Transparency in every transaction. Security at every layer. Community-first growth. Consistent daily returns. Long-term trust over short-term gains.</div>
        </div>
      </div>
    </div>

    <div class="ab-divider"></div>

    <!-- ─── S3: WHY CHOOSE ───────────────────────── -->
    <div class="ab-section ab-why-bg">
      <div class="ab-section-tag">OUR ADVANTAGES</div>
      <div class="ab-section-h">Why Choose <em>QAVIX</em></div>
      <div class="ab-why-grid">
        <div class="ab-why-card">
          <div class="ab-why-icon-wrap">📈</div>
          <div class="ab-why-title">Daily Passive Earnings</div>
          <div class="ab-why-badge">AUTOMATED</div>
        </div>
        <div class="ab-why-card">
          <div class="ab-why-icon-wrap">🔒</div>
          <div class="ab-why-title">Secure USDT Transactions</div>
          <div class="ab-why-badge">SSL ENCRYPTED</div>
        </div>
        <div class="ab-why-card">
          <div class="ab-why-icon-wrap">🤝</div>
          <div class="ab-why-title">Multi-Level Referrals</div>
          <div class="ab-why-badge">10 LEVELS</div>
        </div>
        <div class="ab-why-card">
          <div class="ab-why-icon-wrap">⚡</div>
          <div class="ab-why-title">Instant Deposit Verify</div>
          <div class="ab-why-badge">REAL-TIME</div>
        </div>
        <div class="ab-why-card">
          <div class="ab-why-icon-wrap">💸</div>
          <div class="ab-why-title">Fast Withdrawals</div>
          <div class="ab-why-badge">24H PROCESS</div>
        </div>
        <div class="ab-why-card">
          <div class="ab-why-icon-wrap">🛡️</div>
          <div class="ab-why-title">Enterprise Security</div>
          <div class="ab-why-badge">BANK-GRADE</div>
        </div>
      </div>
    </div>

    <div class="ab-divider"></div>

    <!-- ─── S4: HOW IT WORKS ─────────────────────── -->
    <div class="ab-section ab-hiw-bg">
      <div class="ab-section-tag ab-hiw-tag">PROCESS</div>
      <div class="ab-section-h ab-hiw-h">How <em>QAVIX</em> Works</div>
      <div class="ab-timeline">
        <div class="ab-tl-item">
          <div class="ab-tl-left">
            <div class="ab-tl-circle"><span class="ab-tl-num">1</span></div>
            <div class="ab-tl-line"></div>
          </div>
          <div class="ab-tl-content">
            <div class="ab-tl-step-lbl">STEP 01</div>
            <div class="ab-tl-step-title">Create Account</div>
            <div class="ab-tl-step-desc">Register with your email and basic details in under 2 minutes.</div>
          </div>
        </div>
        <div class="ab-tl-item">
          <div class="ab-tl-left">
            <div class="ab-tl-circle"><span class="ab-tl-num">2</span></div>
            <div class="ab-tl-line"></div>
          </div>
          <div class="ab-tl-content">
            <div class="ab-tl-step-lbl">STEP 02</div>
            <div class="ab-tl-step-title">Verify Email</div>
            <div class="ab-tl-step-desc">Confirm your account via OTP for full access and security.</div>
          </div>
        </div>
        <div class="ab-tl-item">
          <div class="ab-tl-left">
            <div class="ab-tl-circle"><span class="ab-tl-num">3</span></div>
            <div class="ab-tl-line"></div>
          </div>
          <div class="ab-tl-content">
            <div class="ab-tl-step-lbl">STEP 03</div>
            <div class="ab-tl-step-title">Deposit USDT</div>
            <div class="ab-tl-step-desc">Send USDT via BEP20 (BNB Smart Chain) to your platform wallet.</div>
          </div>
        </div>
        <div class="ab-tl-item">
          <div class="ab-tl-left">
            <div class="ab-tl-circle"><span class="ab-tl-num">4</span></div>
            <div class="ab-tl-line"></div>
          </div>
          <div class="ab-tl-content">
            <div class="ab-tl-step-lbl">STEP 04</div>
            <div class="ab-tl-step-title">Choose Investment Plan</div>
            <div class="ab-tl-step-desc">Select from Starter, Silver, Gold, or Platinum plans.</div>
          </div>
        </div>
        <div class="ab-tl-item">
          <div class="ab-tl-left">
            <div class="ab-tl-circle"><span class="ab-tl-num">5</span></div>
            <div class="ab-tl-line"></div>
          </div>
          <div class="ab-tl-content">
            <div class="ab-tl-step-lbl">STEP 05</div>
            <div class="ab-tl-step-title">Receive Daily Profit</div>
            <div class="ab-tl-step-desc">Profits are automatically credited to your balance every 24 hours.</div>
          </div>
        </div>
        <div class="ab-tl-item">
          <div class="ab-tl-left">
            <div class="ab-tl-circle"><span class="ab-tl-num">6</span></div>
          </div>
          <div class="ab-tl-content">
            <div class="ab-tl-step-lbl">STEP 06</div>
            <div class="ab-tl-step-title">Withdraw Earnings</div>
            <div class="ab-tl-step-desc">Request withdrawal anytime — processed directly to your USDT wallet.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── S5: STATISTICS ───────────────────────── -->
    <div class="ab-section">
      <div class="ab-section-tag">LIVE DATA</div>
      <div class="ab-section-h">Platform <em>Statistics</em></div>
      <div class="ab-stat-grid">
        <div class="ab-stat-card">
          <div class="ab-stat-shine"></div>
          <div class="ab-stat-icon">👥</div>
          <div class="ab-stat-num" id="abst-members">—</div>
          <div class="ab-stat-lbl">Registered Members</div>
        </div>
        <div class="ab-stat-card">
          <div class="ab-stat-shine"></div>
          <div class="ab-stat-icon">💹</div>
          <div class="ab-stat-num" id="abst-active">—</div>
          <div class="ab-stat-lbl">Active Investors</div>
        </div>
        <div class="ab-stat-card">
          <div class="ab-stat-shine"></div>
          <div class="ab-stat-icon">📋</div>
          <div class="ab-stat-num" id="abst-plans">—</div>
          <div class="ab-stat-lbl">Running Plans</div>
        </div>
        <div class="ab-stat-card">
          <div class="ab-stat-shine"></div>
          <div class="ab-stat-icon">💰</div>
          <div class="ab-stat-num" id="abst-deposits">—</div>
          <div class="ab-stat-lbl">Total Deposits</div>
        </div>
        <div class="ab-stat-card">
          <div class="ab-stat-shine"></div>
          <div class="ab-stat-icon">🏧</div>
          <div class="ab-stat-num" id="abst-withdrawn">—</div>
          <div class="ab-stat-lbl">Total Withdrawals</div>
        </div>
        <div class="ab-stat-card">
          <div class="ab-stat-shine"></div>
          <div class="ab-stat-icon">⏱️</div>
          <div class="ab-stat-num" id="abst-uptime">—</div>
          <div class="ab-stat-lbl">Platform Uptime</div>
        </div>
      </div>
    </div>

    <div class="ab-divider"></div>

    <!-- ─── S6: SECURITY ────────────────────────── -->
    <div class="ab-section ab-sec-bg">
      <div class="ab-section-tag" style="color:var(--gold)">INFRASTRUCTURE</div>
      <div class="ab-section-h" style="color:#fff">Platform <em>Security</em></div>
      <div class="ab-sec-grid">
        <div class="ab-sec-card">
          <div class="ab-sec-glow"></div>
          <div class="ab-sec-icon-wrap">🔐</div>
          <div class="ab-sec-title">JWT Authentication</div>
          <div class="ab-sec-desc">Token-based login with auto session expiry for every device.</div>
        </div>
        <div class="ab-sec-card">
          <div class="ab-sec-glow"></div>
          <div class="ab-sec-icon-wrap">📧</div>
          <div class="ab-sec-title">Email OTP</div>
          <div class="ab-sec-desc">Every account verified by 6-digit OTP before access.</div>
        </div>
        <div class="ab-sec-card">
          <div class="ab-sec-glow"></div>
          <div class="ab-sec-icon-wrap">🔑</div>
          <div class="ab-sec-title">Withdrawal Password</div>
          <div class="ab-sec-desc">Separate 6-digit password required for all withdrawals.</div>
        </div>
        <div class="ab-sec-card">
          <div class="ab-sec-glow"></div>
          <div class="ab-sec-icon-wrap">🌐</div>
          <div class="ab-sec-title">SSL Encryption</div>
          <div class="ab-sec-desc">All data transmitted over secure HTTPS at all times.</div>
        </div>
        <div class="ab-sec-card">
          <div class="ab-sec-glow"></div>
          <div class="ab-sec-icon-wrap">🗄️</div>
          <div class="ab-sec-title">Encrypted Database</div>
          <div class="ab-sec-desc">PostgreSQL with bcrypt password hashing and daily backups.</div>
        </div>
        <div class="ab-sec-card">
          <div class="ab-sec-glow"></div>
          <div class="ab-sec-icon-wrap">🛡️</div>
          <div class="ab-sec-title">Anti-Fraud Protection</div>
          <div class="ab-sec-desc">Real-time monitoring detects and blocks suspicious activity.</div>
        </div>
        <div class="ab-sec-card" style="grid-column:1/-1">
          <div class="ab-sec-glow"></div>
          <div style="display:flex;align-items:center;gap:14px">
            <div class="ab-sec-icon-wrap" style="flex-shrink:0">⚙️</div>
            <div>
              <div class="ab-sec-title">Automatic Daily Backup</div>
              <div class="ab-sec-desc">Complete system and database backup runs automatically every night, ensuring zero data loss.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── S7: NETWORKS ────────────────────────── -->
    <div class="ab-section">
      <div class="ab-section-tag">DEPOSIT & WITHDRAW</div>
      <div class="ab-section-h">Supported <em>Networks</em></div>
      <div class="ab-net-grid">
        <div class="ab-net-card">
          <div class="ab-net-logo" style="background:linear-gradient(135deg,#26a17b22,#26a17b11)">
            <span style="font-size:30px">₮</span>
          </div>
          <div class="ab-net-name">BEP20</div>
          <div class="ab-net-sub">USDT — Tron Network</div>
          <div class="ab-net-badge">
            <div class="ab-net-dot"></div>
            ACTIVE
          </div>
        </div>
        <div class="ab-net-card">
          <div class="ab-net-logo" style="background:linear-gradient(135deg,#F0B90B22,#F0B90B11)">
            <span style="font-size:30px">⬡</span>
          </div>
          <div class="ab-net-name">BEP20</div>
          <div class="ab-net-sub">USDT — BNB Smart Chain</div>
          <div class="ab-net-badge">
            <div class="ab-net-dot"></div>
            ACTIVE
          </div>
        </div>
      </div>
    </div>

    <div class="ab-divider"></div>

    <!-- ─── S8: WHITEPAPER ──────────────────────── -->
    <div class="ab-section ab-wp-bg" id="ab-wp">
      <div class="ab-wp-inner">
        <div class="ab-book">
          <div class="ab-book-body">
            <div class="ab-book-icon">📘</div>
            <div class="ab-book-text">QAVIX<br>GLOBAL</div>
          </div>
        </div>
        <div class="ab-wp-title">QAVIX GLOBAL <em>Whitepaper</em></div>
        <div class="ab-wp-desc">Learn everything about our platform, investment system, roadmap, ecosystem, security architecture, and future vision for digital wealth.</div>
        <button class="ab-wp-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download Whitepaper
        </button>
      </div>
    </div>

    <!-- ─── S9: FAQ ──────────────────────────────── -->
    <div class="ab-section">
      <div class="ab-section-tag">HELP CENTER</div>
      <div class="ab-section-h">Frequently Asked <em>Questions</em></div>
      <div class="ab-faq-list">
        <div class="ab-faq-item">
          <button class="ab-faq-q" onclick="abFaq(this)">
            <span class="ab-faq-q-text">How do I start investing?</span>
            <div class="ab-faq-chevron">▾</div>
          </button>
          <div class="ab-faq-answer">
            <div class="ab-faq-answer-inner">Register an account, verify your email, deposit USDT via BEP20 (BNB Smart Chain), then choose an investment plan. Your daily profits begin within 24 hours of plan activation.</div>
          </div>
        </div>
        <div class="ab-faq-item">
          <button class="ab-faq-q" onclick="abFaq(this)">
            <span class="ab-faq-q-text">How is daily profit calculated?</span>
            <div class="ab-faq-chevron">▾</div>
          </button>
          <div class="ab-faq-answer">
            <div class="ab-faq-answer-inner">Each plan has a fixed daily return percentage. Your deposited amount is multiplied by this percentage daily and credited automatically to your balance every 24 hours.</div>
          </div>
        </div>
        <div class="ab-faq-item">
          <button class="ab-faq-q" onclick="abFaq(this)">
            <span class="ab-faq-q-text">What is the minimum withdrawal?</span>
            <div class="ab-faq-chevron">▾</div>
          </button>
          <div class="ab-faq-answer">
            <div class="ab-faq-answer-inner">The minimum withdrawal amount is $5 USDT. Withdrawals are processed within 24 hours directly to your registered USDT wallet address.</div>
          </div>
        </div>
        <div class="ab-faq-item">
          <button class="ab-faq-q" onclick="abFaq(this)">
            <span class="ab-faq-q-text">Which networks are supported?</span>
            <div class="ab-faq-chevron">▾</div>
          </button>
          <div class="ab-faq-answer">
            <div class="ab-faq-answer-inner">We currently support BEP20 (BNB Smart Chain) for both deposits and withdrawals. Please ensure you send only via BEP20 to avoid fund loss.</div>
          </div>
        </div>
        <div class="ab-faq-item">
          <button class="ab-faq-q" onclick="abFaq(this)">
            <span class="ab-faq-q-text">What is the plan duration?</span>
            <div class="ab-faq-chevron">▾</div>
          </button>
          <div class="ab-faq-answer">
            <div class="ab-faq-answer-inner">Plan durations vary by tier — typically ranging from 20 to 60 days. After the plan ends, your capital and earned profits are available for withdrawal or reinvestment.</div>
          </div>
        </div>
        <div class="ab-faq-item">
          <button class="ab-faq-q" onclick="abFaq(this)">
            <span class="ab-faq-q-text">How do I contact support?</span>
            <div class="ab-faq-chevron">▾</div>
          </button>
          <div class="ab-faq-answer">
            <div class="ab-faq-answer-inner">You can reach our support team via Telegram 24/7. For technical issues or account queries, join our official Telegram group or contact support directly through the app.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="ab-divider"></div>

    <!-- ─── S10: COMMUNITY ──────────────────────── -->
    <div class="ab-section ab-comm-bg">
      <div class="ab-section-tag">JOIN US</div>
      <div class="ab-section-h">Our <em>Community</em></div>
      <div class="ab-comm-grid">
        <div class="ab-comm-card" onclick="showToast('Opening Telegram…','info')">
          <span class="ab-comm-icon">✈️</span>
          <div class="ab-comm-title">Telegram</div>
          <div class="ab-comm-sub">Join our channel</div>
        </div>
        <div class="ab-comm-card" onclick="showToast('Support team will contact you','info')">
          <span class="ab-comm-icon">🎧</span>
          <div class="ab-comm-title">Support</div>
          <div class="ab-comm-sub">24/7 live help</div>
        </div>
        <div class="ab-comm-card" onclick="showToast('Tutorials coming soon 🎬','warning')">
          <span class="ab-comm-icon">🎬</span>
          <div class="ab-comm-title">Tutorial Center</div>
          <div class="ab-comm-sub">Video guides</div>
        </div>
        <div class="ab-comm-card" onclick="showToast('PDF guide downloading…','success')">
          <span class="ab-comm-icon">📚</span>
          <div class="ab-comm-title">PDF Guide</div>
          <div class="ab-comm-sub">Platform handbook</div>
        </div>
        <div class="ab-comm-card" style="grid-column:1/-1" onclick="showPage('referral')">
          <span class="ab-comm-icon">🤝</span>
          <div class="ab-comm-title">Referral Program</div>
          <div class="ab-comm-sub">Earn from 10 team levels — invite friends and grow together</div>
        </div>
      </div>
    </div>

    <!-- ─── S11: FOOTER ─────────────────────────── -->
    <div class="ab-footer">
      <div class="ab-footer-brand">
        <div class="ab-footer-logo">
          <div class="ab-footer-logo-icon">⚡</div>
          <div class="ab-footer-brand-name">QAVIX GLOBAL</div>
        </div>
        <div class="ab-footer-tagline">Premium Crypto Investment Platform</div>
      </div>
      <div class="ab-footer-cols">
        <div>
          <div class="ab-footer-col-title">Platform</div>
          <div class="ab-footer-link" onclick="document.getElementById('ab-wp').scrollIntoView({behavior:'smooth'})">Whitepaper</div>
          <div class="ab-footer-link" onclick="showPage('plans')">Our Plans</div>
          <div class="ab-footer-link" onclick="showPage('referral')">Referral Program</div>
          <div class="ab-footer-link">Risk Disclosure</div>
        </div>
        <div>
          <div class="ab-footer-col-title">Legal</div>
          <div class="ab-footer-link">Privacy Policy</div>
          <div class="ab-footer-link">Terms of Service</div>
          <div class="ab-footer-link">AML Policy</div>
          <div class="ab-footer-link" onclick="showToast('Support via Telegram','info')">Support</div>
        </div>
      </div>
      <div class="ab-footer-bottom">
        <div class="ab-footer-copy">© 2024 <em>QAVIX GLOBAL</em>. All rights reserved.</div>
      </div>
    </div>

  </div>
</div>

<!-- ══ PAGE: PROFILE & SETTINGS ══ -->
<div class="page" id="page-profile">

  <!-- ▓▓ HERO ▓▓ -->
  <div class="pf-hero">
    <div class="pf-hero-top">
      <button class="pf-back-btn" onclick="showPage('home')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>
      <span class="pf-page-title">My Account</span>
      <button class="pf-edit-btn">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Edit
      </button>
    </div>

    <div class="pf-user-block">
      <div class="pf-av-wrap">
        <div class="pf-av" id="pf-av-circle">--</div>
        <span class="pf-online"></span>
        <div class="pf-av-cam">📷</div>
      </div>
      <div class="pf-user-info">
        <div class="pf-name">—</div>
        <div class="pf-email">—</div>
        <div class="pf-uid">
          <span class="pf-uid-lbl">UID</span>
          <span class="pf-uid-val">—</span>
          <button class="pf-uid-copy" onclick="copyUID()" title="Copy UID">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy
          </button>
        </div>
        <div class="pf-badge-row">
          <span class="pf-badge pf-badge-verified">✦ Verified</span>
          <span class="pf-badge pf-badge-premium" id="pf-mem-level-badge">◈ Free Member</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ▓▓ MEMBERSHIP CARD ▓▓ -->
  <div class="pf-mem-wrap">
    <div class="pf-mem-card">
      <div class="pf-mem-shine"></div>
      <div class="pf-mem-top">
        <div class="pf-mem-badge" id="pf-mem-badge-label">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          FREE MEMBERSHIP
        </div>
        <div class="pf-mem-level">
          <span>Level</span>
          <strong id="pf-mem-level-text">FREE</strong>
        </div>
      </div>
      <div class="pf-mem-stats">
        <div class="pf-mem-stat">
          <div class="pf-mem-stat-num" id="pf-stat-days">—</div>
          <div class="pf-mem-stat-lbl">Member Days</div>
        </div>
        <div class="pf-mem-stat">
          <div class="pf-mem-stat-num" id="pf-stat-invested">$0</div>
          <div class="pf-mem-stat-lbl">Invested</div>
        </div>
        <div class="pf-mem-stat">
          <div class="pf-mem-stat-num" id="pf-stat-refs">0</div>
          <div class="pf-mem-stat-lbl">Referrals</div>
        </div>
      </div>
      <div class="pf-mem-expiry">
        <span class="pf-mem-exp-lbl">Member since</span>
        <span class="pf-mem-exp-val" id="pf-mem-since">—</span>
      </div>
      <button class="pf-upgrade-btn" onclick="confirmUpgrade()">✦ Upgrade Membership</button>
    </div>
  </div>

  <!-- ▓▓ PAGE BODY ▓▓ -->
  <div class="pf-body">

    <!-- ── Quick Actions ── -->
    <div class="pf-group">
      <div class="pf-group-label">Quick Actions</div>
      <div class="pf-qa-grid">

        <button class="pf-qa-card" onclick="showPage('referral')">
          <div class="pf-qa-icon" style="background:linear-gradient(135deg,#FFF9E6,#FEF3C7);border:1px solid rgba(212,175,55,.22)">🤝</div>
          <div class="pf-qa-lbl">Invite Friends</div>
          <div class="pf-qa-sub">Earn commissions</div>
        </button>

        <button class="pf-qa-card" onclick="showToast('Video tutorials coming soon 🎬','warning')">
          <div class="pf-qa-icon" style="background:linear-gradient(135deg,#F0FDF4,#DCFCE7);border:1px solid rgba(34,197,94,.22)">🎬</div>
          <div class="pf-qa-lbl">Tutorial</div>
          <div class="pf-qa-sub">Learn the platform</div>
        </button>

        <button class="pf-qa-card" onclick="showPage('about')">
          <div class="pf-qa-icon" style="background:linear-gradient(135deg,#F5F3FF,#EDE9FE);border:1px solid rgba(139,92,246,.22)">🏢</div>
          <div class="pf-qa-lbl">Company Profile</div>
          <div class="pf-qa-sub">About QAVIX</div>
        </button>

        <button class="pf-qa-card">
          <div class="pf-qa-icon" style="background:linear-gradient(135deg,#F0FDFA,#CCFBF1);border:1px solid rgba(20,184,166,.22)">📢</div>
          <div class="pf-qa-lbl">Announcements</div>
          <div class="pf-qa-sub">Latest updates</div>
        </button>

      </div>
    </div>

    <!-- ── Customer Support ── -->
    <div class="pf-group">
      <div class="pf-group-label">Customer Support</div>
      <div class="pf-group-cards">

        <button class="pf-fcard" onclick="openLiveChat()">
          <div class="pf-fcard-icon" style="background:linear-gradient(135deg,#F0FDF4,#DCFCE7);border:1px solid rgba(34,197,94,.18)">💬</div>
          <div class="pf-fcard-body">
            <div class="pf-fcard-title">Customer Service Center</div>
            <div class="pf-fcard-sub">Get help from our expert team</div>
          </div>
          <div class="pf-fcard-right">
            <span class="pf-fcard-tag pf-tag-online">● Online</span>
            <div class="pf-fcard-arrow">›</div>
          </div>
        </button>

        <button class="pf-fcard" onclick="window.open('https://t.me/QavixGlobal_Support','_blank')">
          <div class="pf-fcard-icon" style="background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border:1px solid rgba(59,130,246,.18)">✈️</div>
          <div class="pf-fcard-body">
            <div class="pf-fcard-title">Telegram Support</div>
            <div class="pf-fcard-sub">@QavixGlobal_Support · Direct help</div>
          </div>
          <div class="pf-fcard-right">
            <div class="pf-fcard-arrow">›</div>
          </div>
        </button>

        <button class="pf-fcard" onclick="openLiveChat()">
          <div class="pf-fcard-icon" style="background:linear-gradient(135deg,#FFFBEB,#FEF3C7);border:1px solid rgba(212,175,55,.22)">⚡</div>
          <div class="pf-fcard-body">
            <div class="pf-fcard-title">Live Chat Support</div>
            <div class="pf-fcard-sub">Avg. reply time · 2 min</div>
          </div>
          <div class="pf-fcard-right">
            <span class="pf-fcard-tag pf-tag-speed">⚡ 2 min</span>
            <div class="pf-fcard-arrow">›</div>
          </div>
        </button>

      </div>
    </div>

    <!-- ── Account Settings ── -->
    <div class="pf-group">
      <div class="pf-group-label">Account Settings</div>
      <div class="pf-group-cards">

        <button class="pf-fcard" onclick="openPersonalInfoModal()">
          <div class="pf-fcard-icon" style="background:linear-gradient(135deg,#F5F3FF,#EDE9FE);border:1px solid rgba(139,92,246,.18)">👤</div>
          <div class="pf-fcard-body">
            <div class="pf-fcard-title">Personal Information</div>
            <div class="pf-fcard-sub">Name, Telegram, date of birth</div>
          </div>
          <div class="pf-fcard-right"><div class="pf-fcard-arrow">›</div></div>
        </button>

        <button class="pf-fcard" onclick="openChangeEmailModal()">
          <div class="pf-fcard-icon" style="background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border:1px solid rgba(59,130,246,.18)">📧</div>
          <div class="pf-fcard-body">
            <div class="pf-fcard-title">Change Email</div>
            <div class="pf-fcard-sub" id="pf-email-sub">••••••@••••.com</div>
          </div>
          <div class="pf-fcard-right"><div class="pf-fcard-arrow">›</div></div>
        </button>

        <button class="pf-fcard" onclick="openWalletBindModal()">
          <div class="pf-fcard-icon" style="background:linear-gradient(135deg,#FFFBEB,#FEF3C7);border:1px solid rgba(212,175,55,.25)">💳</div>
          <div class="pf-fcard-body">
            <div class="pf-fcard-title">Withdrawal Wallet</div>
            <div class="pf-fcard-sub" id="pf-wallet-sub">USDT · BEP20 (BNB Smart Chain)</div>
          </div>
          <div class="pf-fcard-right">
            <span class="pf-fcard-tag pf-tag-unset" id="pf-wallet-tag">Unlinked</span>
            <div class="pf-fcard-arrow">›</div>
          </div>
        </button>

      </div>
    </div>

    <!-- ── Security ── -->
    <div class="pf-group">
      <div class="pf-group-label">Security</div>
      <div class="pf-group-cards">

        <button class="pf-fcard" onclick="openChangePassModal()">
          <div class="pf-fcard-icon" style="background:linear-gradient(135deg,#FFF1F2,#FFE4E6);border:1px solid rgba(239,68,68,.18)">🔒</div>
          <div class="pf-fcard-body">
            <div class="pf-fcard-title">Login Password</div>
            <div class="pf-fcard-sub">Update your account password</div>
          </div>
          <div class="pf-fcard-right"><div class="pf-fcard-arrow">›</div></div>
        </button>

        <button class="pf-fcard" id="pf-wdpass-row" onclick="openWithdrawalPassModal()">
          <div class="pf-fcard-icon" style="background:linear-gradient(135deg,#FFFBEB,#FEF3C7);border:1px solid rgba(212,175,55,.25)">🔑</div>
          <div class="pf-fcard-body">
            <div class="pf-fcard-title">Withdrawal Password</div>
            <div class="pf-fcard-sub" id="pf-wdpass-sub">Required for all withdrawals</div>
          </div>
          <div class="pf-fcard-right">
            <span class="pf-fcard-tag pf-tag-unset" id="pf-wdpass-tag">Not Set</span>
            <div class="pf-fcard-arrow">›</div>
          </div>
        </button>

      </div>
    </div>

    <!-- ── Device & Activity ── -->
    <div class="pf-group">
      <div class="pf-group-label">Device &amp; Activity</div>
      <div class="pf-group-cards">

        <button class="pf-fcard" onclick="openDeviceManagementModal()">
          <div class="pf-fcard-icon" style="background:linear-gradient(135deg,#F8F6F2,#F1EEE8);border:1px solid rgba(17,17,17,.1)">📱</div>
          <div class="pf-fcard-body">
            <div class="pf-fcard-title">Device Management</div>
            <div class="pf-fcard-sub">Manage active sessions</div>
          </div>
          <div class="pf-fcard-right"><div class="pf-fcard-arrow">›</div></div>
        </button>

        <button class="pf-fcard" onclick="openLoginHistoryModal()">
          <div class="pf-fcard-icon" style="background:linear-gradient(135deg,#F8F6F2,#F1EEE8);border:1px solid rgba(17,17,17,.1)">🕐</div>
          <div class="pf-fcard-body">
            <div class="pf-fcard-title">Login History</div>
            <div class="pf-fcard-sub">View recent sign-in activity</div>
          </div>
          <div class="pf-fcard-right"><div class="pf-fcard-arrow">›</div></div>
        </button>

      </div>
    </div>

    <!-- ── Language ── -->
    <div class="pf-group">
      <div class="pf-group-label">Language</div>
      <div class="pf-lang-grid">

        <button class="pf-lang-card active" onclick="pfSetLang('🇺🇸','English')" id="pf-lang-en">
          <div class="pf-lang-flag">🇺🇸</div>
          <div class="pf-lang-info">
            <div class="pf-lang-name">English</div>
            <div class="pf-lang-region">United States</div>
          </div>
          <div class="pf-lang-check" id="pf-lc-en">✓</div>
        </button>

        <button class="pf-lang-card" onclick="pfSetLang('🇧🇩','Bengali')" id="pf-lang-bn">
          <div class="pf-lang-flag">🇧🇩</div>
          <div class="pf-lang-info">
            <div class="pf-lang-name">Bengali</div>
            <div class="pf-lang-region">Bangladesh</div>
          </div>
          <div class="pf-lang-check-empty" id="pf-lc-bn"></div>
        </button>

        <button class="pf-lang-card" onclick="pfSetLang('🇮🇳','Hindi')" id="pf-lang-hi">
          <div class="pf-lang-flag">🇮🇳</div>
          <div class="pf-lang-info">
            <div class="pf-lang-name">Hindi</div>
            <div class="pf-lang-region">India</div>
          </div>
          <div class="pf-lang-check-empty" id="pf-lc-hi"></div>
        </button>

        <button class="pf-lang-card" onclick="pfSetLang('🇸🇦','Arabic')" id="pf-lang-ar">
          <div class="pf-lang-flag">🇸🇦</div>
          <div class="pf-lang-info">
            <div class="pf-lang-name">Arabic</div>
            <div class="pf-lang-region">Saudi Arabia</div>
          </div>
          <div class="pf-lang-check-empty" id="pf-lc-ar"></div>
        </button>

      </div>
    </div>

    <!-- ── Legal & Information ── -->
    <div class="pf-group">
      <div class="pf-group-label">Legal &amp; Information</div>
      <div class="pf-group-cards">

        <button class="pf-fcard">
          <div class="pf-fcard-icon" style="background:linear-gradient(135deg,#F8F6F2,#F1EEE8);border:1px solid rgba(17,17,17,.1)">📄</div>
          <div class="pf-fcard-body">
            <div class="pf-fcard-title">Terms &amp; Conditions</div>
            <div class="pf-fcard-sub">Platform usage agreement</div>
          </div>
          <div class="pf-fcard-right"><div class="pf-fcard-arrow">›</div></div>
        </button>

        <button class="pf-fcard">
          <div class="pf-fcard-icon" style="background:linear-gradient(135deg,#F8F6F2,#F1EEE8);border:1px solid rgba(17,17,17,.1)">🔏</div>
          <div class="pf-fcard-body">
            <div class="pf-fcard-title">Privacy Policy</div>
            <div class="pf-fcard-sub">Data protection &amp; your rights</div>
          </div>
          <div class="pf-fcard-right"><div class="pf-fcard-arrow">›</div></div>
        </button>

        <button class="pf-fcard" onclick="showPage('about')">
          <div class="pf-fcard-icon" style="background:linear-gradient(135deg,#FFFBEB,#FEF3C7);border:1px solid rgba(212,175,55,.25)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polyline points="2 12 6 12 9 3 15 21 18 12 22 12" stroke="#D4AF37" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="pf-fcard-body">
            <div class="pf-fcard-title">About QAVIX GLOBAL</div>
            <div class="pf-fcard-sub">Platform overview &amp; mission</div>
          </div>
          <div class="pf-fcard-right"><div class="pf-fcard-arrow">›</div></div>
        </button>

      </div>
    </div>

    <!-- ── Logout ── -->
    <div class="pf-logout-wrap">
      <button class="pf-logout-btn" onclick="confirmLogout()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Sign Out
      </button>
    </div>

  </div><!-- /pf-body -->

  <!-- hidden legacy stubs for JS compatibility -->
  <div class="pf-section" style="display:none">
    <div class="pf-section-label"></div>
    <div class="pf-card"></div>
  </div>
  <div class="pf-bottom-actions" style="display:none">
    <button class="pf-action-btn pf-btn-logout"></button>
  </div>

  <div class="pf-version">QAVIX GLOBAL v2.4.1 · © 2025</div>

</div>

<!-- ══ PAGE: LANDING ══ -->
<div class="page" id="page-landing">
  <div class="lp-wrap">
    <div class="lp-bg"></div>
    <div class="lp-orb lp-orb-1"></div>
    <div class="lp-orb lp-orb-2"></div>
    <div class="lp-content">
      <div style="text-align:center;padding:1.5rem;display:flex;flex-direction:column;align-items:center;gap:1.4rem">

        <!-- Logo -->
        <div class="lp-logo-wrap">
          <div class="lp-logo-ring">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
              <polyline points="2 12 6 12 9 3 15 21 18 12 22 12" stroke="#C9A227" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div>
            <div><span class="lp-brand-q">QAVIX </span><span class="lp-brand-g">GLOBAL</span></div>
            <div class="lp-tagline">Premium Investment Platform</div>
          </div>
        </div>

        <!-- Get Started -->
        <button class="lp-start-btn" onclick="showPage('login')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 8 16 12 12 16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          Get Started
        </button>

        <!-- Headline -->
        <div>
          <div class="lp-headline" style="font-size:24px;margin-bottom:.3rem">Invest Smart, Earn <em>Daily</em></div>
          <div class="lp-sub" style="font-size:12px;margin:0">Secure crypto investment platform trusted by thousands worldwide.</div>
        </div>

      </div>
    </div>
  </div>
</div>

<!-- ══ PAGE: LOGIN ══ -->
<div class="page" id="page-login">
  <div class="glass-wrap light">
    <div class="glass-bg"></div>
    <div class="glass-content">
      <div class="glass-top">
        <div class="glass-logo-wrap">
          <div class="glass-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <polyline points="2 12 6 12 9 3 15 21 18 12 22 12" stroke="#C9A227" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div>
            <div><span style="font-size:17px;font-weight:800;color:var(--black);letter-spacing:.1em">QAVIX </span><span style="font-size:17px;font-weight:700;color:var(--gold);letter-spacing:.12em">GLOBAL</span></div>
          </div>
        </div>
        <div class="glass-title">Welcome <em>back</em></div>
        <div class="glass-sub">Sign in to your investment account</div>
      </div>

      <div class="glass-card">
        <div class="glass-tabs">
          <button class="glass-tab active" onclick="showPage('login')">Sign In</button>
          <button class="glass-tab" onclick="showPage('register')">Sign Up</button>
        </div>

        <form class="glass-form" onsubmit="doLogin(event)">
          <div class="glass-field">
            <label class="glass-label">Email Address</label>
            <div class="glass-input-wrap">
              <span class="glass-icon">📧</span>
              <input class="glass-input" type="email" id="login-email" placeholder="your@email.com" required autocomplete="email"/>
            </div>
            <span class="glass-err" id="login-email-err"></span>
          </div>

          <div class="glass-field">
            <label class="glass-label">Password</label>
            <div class="glass-input-wrap">
              <span class="glass-icon">🔒</span>
              <input class="glass-input" type="password" id="login-pass" placeholder="Enter your password" required autocomplete="current-password"/>
              <button type="button" class="glass-toggle" onclick="togglePassGlass('login-pass',this)">👁</button>
            </div>
            <span class="glass-err" id="login-pass-err"></span>
          </div>

          <div class="glass-options">
            <label class="glass-remember">
              <input type="checkbox" id="login-remember"/> Remember me
            </label>
            <button type="button" class="glass-forgot" onclick="openForgotPassModal()">Forgot password?</button>
          </div>

          <button type="submit" class="glass-submit" id="login-btn">Sign In to Dashboard</button>
          <div class="glass-gen-err" id="login-general-err"></div>
        </form>

        <div class="glass-trust">
          <div class="glass-trust-item"><div class="glass-trust-icon">🔒</div><div class="glass-trust-lbl">SSL Secure</div></div>
          <div class="glass-trust-item"><div class="glass-trust-icon">✅</div><div class="glass-trust-lbl">Verified</div></div>
          <div class="glass-trust-item"><div class="glass-trust-icon">⚡</div><div class="glass-trust-lbl">Instant</div></div>
          <div class="glass-trust-item"><div class="glass-trust-icon">🛡️</div><div class="glass-trust-lbl">Protected</div></div>
        </div>

        <div class="glass-switch">
          New to QAVIX? <button class="glass-switch-btn" onclick="showPage('register')">Create Account →</button>
        </div>
        <div class="glass-switch" style="margin-top:.5rem">
          <button class="glass-switch-btn" style="color:rgba(255,255,255,.3);font-weight:500" onclick="showPage('landing')">← Back to Home</button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ══ PAGE: REGISTER ══ -->
<div class="page" id="page-register">
  <div class="glass-wrap light">
    <div class="glass-bg"></div>
    <div class="glass-content">
      <div class="glass-top">
        <div class="glass-logo-wrap">
          <div class="glass-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <polyline points="2 12 6 12 9 3 15 21 18 12 22 12" stroke="#C9A227" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div>
            <div><span style="font-size:17px;font-weight:800;color:var(--black);letter-spacing:.1em">QAVIX </span><span style="font-size:17px;font-weight:700;color:var(--gold);letter-spacing:.12em">GLOBAL</span></div>
          </div>
        </div>
        <div class="glass-title">Start <em>investing</em></div>
        <div class="glass-sub">Join 18,000+ investors earning daily</div>
      </div>

      <div class="glass-card">
        <div class="glass-tabs">
          <button class="glass-tab" onclick="showPage('login')">Sign In</button>
          <button class="glass-tab active" onclick="showPage('register')">Sign Up</button>
        </div>

        <form class="glass-form" onsubmit="doRegister(event)">
          <div class="glass-field">
            <label class="glass-label">Full Name</label>
            <div class="glass-input-wrap">
              <span class="glass-icon">👤</span>
              <input class="glass-input" type="text" id="reg-name" placeholder="Your full name" required autocomplete="name"/>
            </div>
            <span class="glass-err" id="reg-name-err"></span>
          </div>

          <div class="glass-field">
            <label class="glass-label">Email Address</label>
            <div class="glass-input-wrap">
              <span class="glass-icon">📧</span>
              <input class="glass-input" type="email" id="reg-email" placeholder="your@email.com" required autocomplete="email"/>
            </div>
            <span class="glass-err" id="reg-email-err"></span>
          </div>

          <div class="glass-field">
            <label class="glass-label">Phone <span style="color:var(--muted);font-weight:400;text-transform:none">(optional)</span></label>
            <div class="glass-input-wrap">
              <span class="glass-icon">📱</span>
              <input class="glass-input" type="tel" id="reg-phone" placeholder="+880 1XXXXXXXXX" autocomplete="tel"/>
            </div>
          </div>

          <div class="glass-field">
            <label class="glass-label">Password</label>
            <div class="glass-input-wrap">
              <span class="glass-icon">🔒</span>
              <input class="glass-input" type="password" id="reg-pass" placeholder="Min 8 characters" required autocomplete="new-password" oninput="checkGlassStrength(this.value)"/>
              <button type="button" class="glass-toggle" onclick="togglePassGlass('reg-pass',this)">👁</button>
            </div>
            <span class="glass-err" id="reg-pass-err"></span>
            <div id="glass-strength-wrap" style="display:none">
              <div class="glass-strength-track"><div id="glass-strength-bar" class="glass-strength-fill"></div></div>
              <div id="glass-strength-lbl" class="glass-strength-lbl"></div>
            </div>
          </div>

          <div class="glass-field">
            <label class="glass-label">Referral Code <span style="color:#ef4444;font-size:12px">*</span></label>
            <div class="glass-input-wrap">
              <span class="glass-icon">🎁</span>
              <input class="glass-input" type="text" id="reg-ref" placeholder="Enter referral code (required)" style="text-transform:uppercase" oninput="this.value=this.value.toUpperCase()" required/>
            </div>
            <span class="glass-hint" style="color:rgba(255,255,255,.4)">You must have a valid referral code to register</span>
            <span class="glass-err" id="reg-ref-err"></span>
          </div>

          <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer">
            <input type="checkbox" id="reg-terms" style="accent-color:var(--gold);width:15px;height:15px;margin-top:2px;flex-shrink:0" required/>
            <span style="font-size:12px;color:var(--muted);line-height:1.6">
              I agree to the
              <button type="button" onclick="showToast('Terms coming soon','warning')" style="background:none;border:none;color:var(--gold);font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;padding:0">Terms & Conditions</button>
              and
              <button type="button" onclick="showToast('Privacy policy coming soon','warning')" style="background:none;border:none;color:var(--gold);font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;padding:0">Privacy Policy</button>
            </span>
          </label>

          <button type="submit" class="glass-submit" id="reg-btn">Create My Account</button>
          <div class="glass-gen-err" id="reg-general-err"></div>
        </form>

        <div class="glass-trust">
          <div class="glass-trust-item"><div class="glass-trust-icon">💰</div><div class="glass-trust-lbl">Daily Profits</div></div>
          <div class="glass-trust-item"><div class="glass-trust-icon">👥</div><div class="glass-trust-lbl">18K+ Users</div></div>
          <div class="glass-trust-item"><div class="glass-trust-icon">💸</div><div class="glass-trust-lbl">$2.9M Paid</div></div>
          <div class="glass-trust-item"><div class="glass-trust-icon">⭐</div><div class="glass-trust-lbl">4.9 Rating</div></div>
        </div>

        <div class="glass-switch">
          Already have an account? <button class="glass-switch-btn" onclick="showPage('login')">Sign In →</button>
        </div>
        <div class="glass-switch" style="margin-top:.5rem">
          <button class="glass-switch-btn" style="font-weight:500;opacity:.5" onclick="showPage('landing')">← Back to Home</button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- BOTTOM NAV -->
<nav class="bottom-nav">
  <button class="nav-item active" onclick="showPage('home')" id="nav-home">
    <i class="fa-solid fa-house"></i>Home
  </button>
  <button class="nav-item" onclick="showPage('plans')" id="nav-plans">
    <i class="fa-solid fa-chart-line"></i>Plans
  </button>
  <button class="nav-item" onclick="showPage('referral')" id="nav-referral">
    <i class="fa-solid fa-users"></i>Team
  </button>
  <button class="nav-item" onclick="showPage('wallet')" id="nav-wallet">
    <i class="fa-solid fa-wallet"></i>Wallet
  </button>
  <button class="nav-item" onclick="showPage('about')" id="nav-about">
    <i class="fa-solid fa-circle-info"></i>About
  </button>
</nav>

<script>
  // showPage is defined later — forward declaration keeps early callers happy
  function showPage(name) {
    _showPageImpl(name);
    if(name==='referral') setTimeout(loadReferralData, 100);
    if(name==='wallet') setTimeout(loadWalletTransactions, 100);
    if(name==='about') setTimeout(loadAboutStats, 80);
    // Restore referral code when navigating to register
    if(name==='register') {
      var ref = sessionStorage.getItem('qvx_ref');
      if(ref) { var ri=document.getElementById('reg-ref'); if(ri&&!ri.value) ri.value=ref; }
    }
    // Refresh user data from server when opening profile
    if(name==='profile' && API.Auth.isLoggedIn()) {
      API.Auth.me().then(function(r){
        if(r && r.data && r.data.user){
          var fresh = {...API.getUser(), ...r.data.user};
          API.setUser(fresh);
          updateUIWithUser(fresh);
        }
      }).catch(function(){});
    }
  }

  // Navigate to wallet page and highlight deposit or withdraw button
  function goToWalletAction(action) {
    showPage('wallet');
    setTimeout(function() {
      var btnId = action === 'deposit' ? 'wallet-deposit-btn' : 'wallet-withdraw-btn';
      var btn = document.getElementById(btnId);
      if (!btn) return;
      btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Pulse highlight
      btn.style.transition = 'box-shadow 0.2s, transform 0.2s';
      btn.style.boxShadow = '0 0 0 4px rgba(201,162,39,0.45)';
      btn.style.transform = 'scale(1.06)';
      setTimeout(function() {
        btn.style.boxShadow = '';
        btn.style.transform = '';
      }, 1000);
    }, 320);
  }
  function _showPageImpl(name) {
    // Real implementation defined below — this stub is overridden at DOMContentLoaded
    var el = document.getElementById('page-'+name);
    if (el) { el.style.visibility = 'visible'; el.classList.add('active'); }
  }

  function copyUID() {
    var u = API.getUser();
    var uid = (u && u.uid) || '';
    navigator.clipboard && navigator.clipboard.writeText(uid);
    var btn = event.currentTarget;
    btn.textContent = '✓';
    setTimeout(function(){ btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'; }, 1500);
  }

  function copyHeroUID() {
    var u = API.getUser();
    var uid = (u && u.uid) || document.getElementById('ph-hero-uid')?.textContent || '';
    navigator.clipboard && navigator.clipboard.writeText(uid);
    var btn = event.currentTarget;
    var orig = btn.innerHTML;
    btn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C9A227" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    setTimeout(function(){ btn.innerHTML = orig; }, 1500);
  }

  var pfLangMap = { en:'pf-lc-en', bn:'pf-lc-bn', hi:'pf-lc-hi', ar:'pf-lc-ar' };
  var pfActiveLang = 'en';
  function pfSetLang(flag, label) {
    var code = flag === '🇺🇸' ? 'en' : flag === '🇧🇩' ? 'bn' : flag === '🇮🇳' ? 'hi' : 'ar';
    Object.values(pfLangMap).forEach(function(id){ var el=document.getElementById(id); if(el) el.style.display='none'; });
    var active = document.getElementById(pfLangMap[code]);
    if (active) active.style.display = 'inline';
    // New card-style language selector
    document.querySelectorAll('.pf-lang-card').forEach(function(c){ c.classList.remove('active'); });
    var ac = document.getElementById('pf-lang-' + code);
    if (ac) ac.classList.add('active');
    document.querySelectorAll('.pf-lang-check').forEach(function(el){ el.className='pf-lang-check-empty'; el.textContent=''; });
    var ck = document.getElementById('pf-lc-' + code);
    if (ck) { ck.className='pf-lang-check'; ck.textContent='✓'; }
    pfActiveLang = code;
    var flagEl = document.getElementById('hdr-lang-flag');
    var codeEl = document.getElementById('hdr-lang-code');
    if(flagEl) flagEl.textContent = flag;
    if(codeEl) codeEl.textContent = code.toUpperCase();
  }

  // ── HEADER LOGIC ──
  var hdrOpen = null;
  var hdrUnread = 3;
  var hdrUnreadIds = new Set(['hn1','hn2','hn3']);

  function hdrToggle(name) {
    if (hdrOpen === name) { hdrClose(name); return; }
    if (hdrOpen) hdrClose(hdrOpen);
    hdrOpen = name;
    document.getElementById('hdr-'+name+'-dd').style.display = 'block';
    var icon = document.getElementById('hdr-'+name+'-icon');
    var pill = document.getElementById('hdr-'+name+'-pill');
    var chev = document.getElementById('hdr-'+name+'-chev');
    if (icon) icon.classList.add('active');
    if (pill) pill.classList.add('active');
    if (chev) chev.classList.add('open');
  }

  function hdrClose(name) {
    var dd = document.getElementById('hdr-'+name+'-dd');
    if (dd) dd.style.display = 'none';
    var icon = document.getElementById('hdr-'+name+'-icon');
    var pill = document.getElementById('hdr-'+name+'-pill');
    var chev = document.getElementById('hdr-'+name+'-chev');
    if (icon) icon.classList.remove('active');
    if (pill) pill.classList.remove('active');
    if (chev) chev.classList.remove('open');
    if (hdrOpen === name) hdrOpen = null;
  }

  function hdrSetLang(btn, flag, code) {
    document.getElementById('hdr-lang-flag').textContent = flag;
    document.getElementById('hdr-lang-code').textContent = code;
    document.querySelectorAll('#hdr-lang-dd .hdr-dd-row').forEach(r => r.classList.remove('sel'));
    btn.classList.add('sel');
    ['EN','BN','HI','AR'].forEach(c => {
      var el = document.getElementById('hdr-ck-'+c);
      if (el) el.style.display = c === code ? 'inline' : 'none';
    });
    hdrClose('lang');
  }

  function hdrMarkRead(rowId, dotId) {
    var row = document.getElementById(rowId);
    var dot = document.getElementById(dotId);
    if (row) row.classList.remove('unread');
    if (dot) dot.style.display = 'none';
    if (hdrUnreadIds.has(rowId)) {
      hdrUnreadIds.delete(rowId);
      hdrUnread--;
      hdrUpdateBadge();
    }
  }

  function hdrMarkAll() {
    hdrUnreadIds.forEach(id => {
      var row = document.getElementById(id);
      var num = id.replace('hn','');
      var dot = document.getElementById('hnd'+num);
      if (row) row.classList.remove('unread');
      if (dot) dot.style.display = 'none';
    });
    hdrUnreadIds.clear();
    hdrUnread = 0;
    hdrUpdateBadge();
  }

  function hdrUpdateBadge() {
    var badge = document.getElementById('hdr-notif-badge');
    var newBadge = document.getElementById('hdr-new-badge');
    if (hdrUnread === 0) {
      if (badge) badge.style.display = 'none';
      if (newBadge) newBadge.style.display = 'none';
    } else {
      if (badge) { badge.style.display = 'flex'; badge.textContent = hdrUnread; }
      if (newBadge) { newBadge.style.display = 'inline'; newBadge.textContent = hdrUnread + ' new'; }
    }
  }

  function hdrMobileToggle() {
    var menu = document.getElementById('hdr-mobile-menu');
    menu.classList.toggle('open');
  }

  function hdrMobLang(btn, flag, code) {
    document.getElementById('hdr-lang-flag').textContent = flag;
    document.getElementById('hdr-lang-code').textContent = code;
    document.querySelectorAll('.hdr-mob-lang-btn').forEach(b => b.classList.remove('sel'));
    btn.classList.add('sel');
  }

  // Close dropdown on outside click
  document.addEventListener('mousedown', function(e) {
    if (!hdrOpen) return;
    var wrap = document.getElementById('hdr-'+hdrOpen+'-wrap');
    if (wrap && !wrap.contains(e.target)) hdrClose(hdrOpen);
  });

  // ── HOME DASHBOARD JS ──
  // Animated counters
  function animateCounter(id, target, prefix, duration) {
    var el = document.getElementById(id);
    if (!el) return;
    var steps = 60, step = 0;
    var timer = setInterval(function() {
      step++;
      var val = Math.round(target * (step / steps));
      el.textContent = prefix + val.toLocaleString();
      if (step >= steps) { clearInterval(timer); el.textContent = prefix + target.toLocaleString(); }
    }, duration / steps);
  }
  function initCounters() {
    animateCounter('stat-users',       18340, '',  1400);
    animateCounter('stat-investors',   11200, '',  1400);
    animateCounter('stat-deposits',    4200000, '$', 1600);
    animateCounter('stat-withdrawals', 2900000, '$', 1600);
    animateCounter('stat-investments', 6100000, '$', 1800);
    // My stats (placeholder until API loads)
    animateCounter('my-team',    15, '',  800);
    animateCounter('my-direct',   8, '',  800);
  }
  setTimeout(initCounters, 400);

  // Announcement slider
  var annIdx = 0, annTotal = 3;
  function annGo(idx) {
    annIdx = idx;
    var slides = document.getElementById('annSlides');
    if (slides) slides.style.transform = 'translateX(-' + (idx * 100) + '%)';
    document.querySelectorAll('.hd-ann-dot').forEach(function(d, i){ d.classList.toggle('active', i === idx); });
  }
  setInterval(function(){ annGo((annIdx + 1) % annTotal); }, 4200);

  // Team toggle
  var teamExpanded = false;
  function toggleTeam() {
    teamExpanded = !teamExpanded;
    var extra = document.getElementById('teamExtra');
    var btn   = document.getElementById('teamMoreBtn');
    if (extra) extra.classList.toggle('show', teamExpanded);
    if (btn) btn.innerHTML = teamExpanded
      ? '<svg style="transform:rotate(180deg)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg> Show less'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg> Show all 10 levels';
  }

  // Profit calculator
  var calcDailyRate = 1, calcDays = 30;
  function selCalcPlan(btn, daily, days) {
    document.querySelectorAll('.hd-calc-plan-btn').forEach(function(b){ b.classList.remove('sel'); });
    btn.classList.add('sel');
    calcDailyRate = daily; calcDays = days;
    calcProfit();
  }
  function calcProfit() {
    var amt = parseFloat(document.getElementById('calcAmt').value) || 0;
    var daily = amt > 0 ? (calcDailyRate).toFixed(2) : calcDailyRate.toFixed(2);
    var total = (parseFloat(daily) * calcDays).toFixed(2);
    document.getElementById('calcDaily').textContent = '$' + daily;
    document.getElementById('calcTotal').textContent = '$' + total;
  }

  // Leaderboard tabs
  function switchLb(btn, tab) {
    document.querySelectorAll('.hd-lb-tab').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    ['inv','ref','ear'].forEach(function(t){
      var el = document.getElementById('lb-'+t);
      if (!el) return;
      el.style.display = t === tab ? 'flex' : 'none';
      if (t === tab) el.style.flexDirection = 'column';
    });
  }

  // Referral copy (kept for compatibility)
  function rfCopyLink(btn) { tmCopy('link', btn); }
  function copyRefLink(btn) { tmCopy('link', btn); }

  // ── TEAM PAGE JS ──
  function tmCopy(type, btn) {
    var u = API.getUser();
    var code = window._tmCode || (u && (u.referralCode || u.referral_code)) || 'MYCODE';
    var link = window._tmLink || 'https://qavixglobal.pages.dev/?ref=' + code;
    var text = type === 'code' ? code : link;
    navigator.clipboard && navigator.clipboard.writeText(text);
    showToast(type==='code'?'Referral code copied!':'Referral link copied!','success');
    if (btn) {
      var orig = btn.innerHTML;
      btn.innerHTML = '✓ Copied!';
      btn.style.background = '#22c55e'; btn.style.color = '#fff';
      setTimeout(function(){ btn.innerHTML = orig; btn.style.background = ''; btn.style.color = ''; }, 2000);
    }
  }

  // Tree expand/collapse
  function tmToggleLevel(n) {
    var row    = document.getElementById('tm-lv-'+n);
    var detail = document.getElementById('tm-ld-'+n);
    if (!row || !detail) return;
    var isOpen = detail.classList.contains('open');
    detail.classList.toggle('open', !isOpen);
    row.classList.toggle('expanded', !isOpen);
    if (!isOpen) {
      detail.style.background = 'linear-gradient(135deg,#fffdf8,#fefbf0)';
      detail.style.borderTop = '1px solid rgba(201,162,39,.1)';
    } else {
      detail.style.borderTop = 'none';
    }
  }

  // Tab switcher
  function tmTab(btn, pane) {
    document.querySelectorAll('.tm-tab').forEach(function(b){ b.classList.remove('active'); });
    document.querySelectorAll('.tm-tab-pane').forEach(function(p){ p.classList.remove('active'); });
    btn.classList.add('active');
    var el = document.getElementById('tm-pane-'+pane);
    if (el) el.classList.add('active');
    if (pane==='financials') setTimeout(loadFinancialsData, 100);
  }

  // Member search
  function tmSearchMembers(q) {
    q = q.toLowerCase();
    document.querySelectorAll('.tm-member-row').forEach(function(row){
      var name = row.getAttribute('data-name') || '';
      row.style.display = name.includes(q) ? '' : 'none';
    });
  }

  // Member filter
  // Show more members inside a tree level
  window.tmShowMoreLv = function(lvl, members) {
    var listEl = document.getElementById('tm-lv-mlist-'+lvl);
    var btn    = document.getElementById('tm-lv-morebtn-'+lvl);
    if (!listEl || !members) return;
    // Render all remaining members
    members.slice(10).forEach(function(m) {
      var bg = avatarColor(m.name);
      var ini = initials(m.name);
      var textColor = bg === '#C9A227' ? '#111' : '#fff';
      var isActive = m.status === 'active';
      var div = document.createElement('div');
      div.className = 'tm-lv-member';
      div.innerHTML = '<div class="tm-lv-mem-av" style="background:'+bg+';color:'+textColor+'">'+ini+'</div>'
        +'<div class="tm-lv-mem-name">'+m.name+'</div>'
        +'<span class="tm-lv-mem-status '+(isActive?'tm-st-active':'tm-st-inactive')+'">'+(isActive?'Active':'Inactive')+'</span>';
      listEl.appendChild(div);
    });
    if (btn) btn.remove();
  };

  function tmFilter(btn, level) {
    document.querySelectorAll('.tm-filter-btn').forEach(function(b){ b.classList.remove('sel'); });
    btn.classList.add('sel');
    document.querySelectorAll('.tm-member-row').forEach(function(row){
      var lv  = row.getAttribute('data-level') || '';
      var st  = row.getAttribute('data-status') || '';
      var show = false;
      if (level === 'all')    show = true;
      else if (level === 'active') show = (st === 'active');
      else show = (lv === level);
      row.style.display = show ? '' : 'none';
    });
    // Also hide section dividers when filtering
    var listEl = document.getElementById('tm-members-list');
    if (listEl) {
      listEl.querySelectorAll('div[style*="text-transform:uppercase"]').forEach(function(d){
        d.style.display = (level === 'all') ? '' : 'none';
      });
    }
  }

  // ══ CHECK-IN SYSTEM ═══════════════════════════════════
  var checkedIn = false;

  async function doCheckIn() {
    // Open weekly modal first
    await openCheckInModal();
  }

  async function openCheckInModal() {
    var overlay = document.createElement('div');
    overlay.className = 'qx-overlay'; overlay.id = 'qx-checkin-modal';
    overlay.innerHTML = `
      <div class="qx-modal" style="max-width:440px">
        <div class="qx-modal-handle"></div>
        <div class="qx-modal-head">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="qx-modal-icon-wrap" style="background:rgba(34,197,94,.12);font-size:20px">✅</div>
            <div>
              <div class="qx-modal-title">Daily Check-In</div>
              <div style="font-size:11px;color:var(--muted);margin-top:1px">Check in every day to earn rewards</div>
            </div>
          </div>
          <button class="qx-modal-close" onclick="document.getElementById('qx-checkin-modal').remove()">✕</button>
        </div>
        <div style="padding:0 1.2rem 1.4rem" id="ci-body">
          <div style="text-align:center;padding:24px;color:var(--muted);font-size:13px">Loading...</div>
        </div>
      </div>`;
    overlay.addEventListener('click',e=>{ if(e.target===overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    await loadCheckInData();
  }

  async function loadCheckInData() {
    var body = document.getElementById('ci-body');
    if (!body) return;
    try {
      const r = await API.Rewards.checkinStatus();
      var {week, streak, checkedToday, totalEarned} = r.data;

      // Day labels Mon first
      const ordered = [...week].sort((a,b)=>a.date.localeCompare(b.date));
      // Reorder: Mon=1...Sun=0 → Mon first
      const days = [...ordered.filter(d=>d.day!=='Sun'), ...ordered.filter(d=>d.day==='Sun')];

      body.innerHTML = `
        <!-- Streak banner -->
        <div style="background:linear-gradient(135deg,rgba(201,162,39,.12),rgba(201,162,39,.04));border:1px solid rgba(201,162,39,.2);border-radius:14px;padding:14px 16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:11px;color:var(--muted);font-weight:600;letter-spacing:.06em">CURRENT STREAK</div>
            <div style="font-size:28px;font-weight:800;color:var(--gold);margin-top:2px">${streak} <span style="font-size:14px">days 🔥</span></div>
          </div>
          <div style="text-align:right">
            <div style="font-size:11px;color:var(--muted);font-weight:600;letter-spacing:.06em">TOTAL EARNED</div>
            <div style="font-size:20px;font-weight:800;color:var(--black);margin-top:2px">$${totalEarned.toFixed(2)}</div>
          </div>
        </div>

        <!-- Weekly grid -->
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:16px">
          ${days.map(d=>`
            <div style="text-align:center">
              <div style="font-size:9px;font-weight:700;color:${d.isSunday?'#9B7A10':'var(--muted)'};margin-bottom:4px;letter-spacing:.04em">${d.day.toUpperCase()}</div>
              <div style="position:relative;border-radius:12px;padding:8px 4px;
                background:${d.checked?'rgba(34,197,94,.12)':d.isToday?'rgba(201,162,39,.1)':'var(--bg)'};
                border:1.5px solid ${d.checked?'rgba(34,197,94,.3)':d.isToday?'rgba(201,162,39,.4)':d.isSunday?'rgba(201,162,39,.2)':'var(--border)'};
                transition:all .2s">
                ${d.isSunday?`<div style="position:absolute;top:-6px;left:50%;transform:translateX(-50%);background:#C9A227;color:#fff;font-size:7px;font-weight:800;padding:1px 4px;border-radius:4px;white-space:nowrap">BONUS</div>`:''}
                <div style="font-size:${d.checked?'16px':'12px'};margin-bottom:2px">${d.checked?'✅':d.isToday?'⭐':'○'}</div>
                <div style="font-size:9px;font-weight:800;color:${d.isSunday?'#9B7A10':d.checked?'#16a34a':'var(--muted)'}">$${d.amount.toFixed(2)}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Today's reward info -->
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:12px 14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:11px;color:var(--muted);font-weight:600">TODAY'S REWARD</div>
            <div style="font-size:18px;font-weight:800;color:var(--black);margin-top:2px">
              ${days.find(d=>d.isToday)?.isSunday ? '🎉 $0.05 Sunday Bonus' : '💰 $0.01 Daily Reward'}
            </div>
          </div>
          ${checkedToday ? `<span style="background:rgba(34,197,94,.1);color:#16a34a;font-size:11px;font-weight:800;padding:6px 12px;border-radius:8px">✓ Done</span>` : ''}
        </div>

        <!-- Check-in button -->
        ${checkedToday ?
          `<button disabled style="width:100%;padding:14px;border-radius:12px;background:rgba(34,197,94,.1);color:#16a34a;border:1.5px solid rgba(34,197,94,.2);font-size:14px;font-weight:800;font-family:inherit;cursor:default">
            ✅ Already Checked In Today
          </button>
          <div style="text-align:center;font-size:11px;color:var(--muted);margin-top:8px">Come back tomorrow for your next reward!</div>` :
          `<button onclick="performCheckIn()" id="ci-btn"
            style="width:100%;padding:14px;border-radius:12px;background:var(--black);color:var(--gold);border:none;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;transition:all .2s;letter-spacing:.02em">
            ✅ Check In Now · ${days.find(d=>d.isToday)?.isSunday ? '+$0.05 🎉' : '+$0.01'}
          </button>`
        }`;
    } catch(e) {
      if(body) body.innerHTML=`<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px">Failed to load. <button onclick="loadCheckInData()" style="color:var(--gold);background:none;border:none;cursor:pointer;font-family:inherit;font-weight:700">Retry</button></div>`;
    }
  }

  async function performCheckIn() {
    var btn = document.getElementById('ci-btn');
    if(btn){ btn.disabled=true; btn.textContent='Checking in...'; }
    try {
      const res = await API.Rewards.checkIn();
      checkedIn = true;
      // Update quick action button
      var lbl = document.getElementById('checkin-lbl');
      var iconWrap = document.getElementById('checkin-icon-wrap');
      var qBtn = document.getElementById('checkin-btn');
      if(lbl) lbl.textContent = 'Checked ✓';
      if(iconWrap){ iconWrap.style.background='linear-gradient(135deg,rgba(34,197,94,.3),rgba(34,197,94,.12))'; }
      if(qBtn){ qBtn.style.borderColor='rgba(34,197,94,.4)'; qBtn.style.boxShadow='0 4px 16px rgba(34,197,94,.18)'; }
      // Reload modal with updated data
      await loadCheckInData();
      showToast(res.message || '✅ Check-in successful!', 'success');
      // Refresh balance
      const dash = await API.User.dashboard().catch(()=>null);
      if(dash){ API.setUser({...API.getUser(),...dash.data.user}); updateUIWithUser(dash.data.user); }
    } catch(e) {
      if(btn){ btn.disabled=false; btn.textContent='Check In Now'; }
      showToast(e.message||'Check-in failed','error');
    }
  }

  // Invite modal — pulls real referral link from server
  async function openInviteModal() {
    var u = API.getUser ? API.getUser() : null;
    var code = (u && (u.referralCode || u.referral_code)) || 'QVX000000';
    var link = 'https://qavixglobal.pages.dev/?ref=' + code;

    // Try to get fresh referral info from server
    try {
      const r = await API.Referral.info();
      if (r && r.data) {
        code = r.data.referralCode || code;
        link = r.data.referralLink || link;
      }
    } catch(e) { /* use cached */ }

    var overlay = document.createElement('div');
    overlay.className = 'qx-overlay';
    overlay.id = 'qxInviteModal';

    overlay.innerHTML = `
      <div class="qx-modal" style="max-width:440px">
        <div class="qx-modal-handle"></div>
        <div class="qx-modal-head">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="qx-modal-icon-wrap" style="background:rgba(236,72,153,.1)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#db2777" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <div>
              <div class="qx-modal-title">Invite Friends</div>
              <div style="font-size:11px;color:var(--muted);margin-top:1px">Share & earn referral rewards</div>
            </div>
          </div>
          <button class="qx-modal-close" onclick="document.getElementById('qxInviteModal').remove()">✕</button>
        </div>

        <div style="padding:0 1.2rem 1.2rem">

          <!-- Referral Link -->
          <div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px">Referral Link</div>
          <div class="qx-inv-modal-row">
            <span class="qx-inv-modal-val gold" id="qx-inv-link-val">${link}</span>
            <button class="qx-inv-copy-btn" onclick="qxInvCopy('link','${link}',this)">Copy</button>
          </div>

          <!-- Referral Code -->
          <div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;margin-top:12px">Referral Code</div>
          <div class="qx-inv-modal-row">
            <span class="qx-inv-modal-val" style="font-size:18px;font-weight:800;color:var(--black);letter-spacing:.12em">${code}</span>
            <button class="qx-inv-copy-btn" onclick="qxInvCopy('code','${code}',this)">Copy</button>
          </div>

          <!-- Info row -->
          <div style="background:rgba(201,162,39,.06);border:1px solid rgba(201,162,39,.15);border-radius:11px;padding:10px 13px;margin:12px 0;display:flex;align-items:center;gap:9px">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C9A227" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span style="font-size:11px;color:var(--gold-dk);line-height:1.5">Earn commission when friends join & invest using your link</span>
          </div>

          <!-- Share button -->
          <button class="qx-inv-share-btn" onclick="qxInvShare('${link}','${code}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Share via Apps
          </button>

        </div>
      </div>`;

    overlay.addEventListener('click', function(e){
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
  }

  function qxInvCopy(type, text, btn) {
    navigator.clipboard && navigator.clipboard.writeText(text);
    var orig = btn.textContent;
    btn.textContent = '✓ Copied!';
    btn.style.background = '#16a34a'; btn.style.color = '#fff';
    setTimeout(function(){ btn.textContent = orig; btn.style.background=''; btn.style.color=''; }, 2000);
    showToast(type === 'code' ? 'Referral code copied!' : 'Referral link copied!', 'success');
  }

  function qxInvShare(link, code) {
    if (navigator.share) {
      navigator.share({
        title: 'Join QAVIX GLOBAL',
        text: 'Join me on QAVIX GLOBAL and earn daily crypto returns! Use my referral code: ' + code,
        url: link
      }).catch(function(){});
    } else {
      navigator.clipboard && navigator.clipboard.writeText(link);
      showToast('Link copied — paste it anywhere to share!', 'success');
    }
  }

  // Lucky draw — now uses modal
  function openLuckyDraw() {
    var prizes = [
      {r:'🎉 $1.00 USDT',  c:'green', a:'$1.00'},
      {r:'🎊 $0.50 USDT',  c:'green', a:'$0.50'},
      {r:'💫 Try Again',   c:'warn',  a:'$0.00'},
      {r:'💰 $2.00 USDT',  c:'green', a:'$2.00'},
      {r:'✨ $0.25 USDT',  c:'green', a:'$0.25'}
    ];
    var p = prizes[Math.floor(Math.random() * prizes.length)];
    openModal({
      icon:'🎰', iconBg:'rgba(139,92,246,.12)',
      title:'Lucky Draw Result',
      body:'The wheel has spoken! Your prize for today:',
      rows:[{l:'Result',v:p.r},{l:'Reward',v:p.a,cls:'gold'},{l:'Credited to','v':'Wallet balance',cls:'green'}],
      confirmText:'Claim Prize 🎁',
      confirmClass:'qx-btn-gold',
      onConfirm:function(){ showToast(p.r+' added to wallet!','success'); }
    });
  }

  /* ══════════════════════════════════════════
     PAGE TRANSITION SYSTEM
  ══════════════════════════════════════════ */
  var PAGE_ORDER = ['landing','login','register','home','plans','referral','wallet','about','profile'];
  var currentPage = 'home';
  var AUTH_PAGES  = ['landing', 'login', 'register'];
  var AUTH_ORDER  = { landing: 0, login: 1, register: 2 };
  var _authAnimating = false;

  // Override the stub with the full implementation
  function _showPageImpl(name) {
    if (name === currentPage) return;

    var fromAuth = AUTH_PAGES.includes(currentPage);
    var toAuth   = AUTH_PAGES.includes(name);

    // ── AUTH → AUTH: slide transition ──────────────────────────
    if (fromAuth && toAuth) {
      if (_authAnimating) return;
      _authAnimating = true;

      var dir    = AUTH_ORDER[name] > AUTH_ORDER[currentPage] ? 1 : -1;
      var oldEl  = document.getElementById('page-' + currentPage);
      var newEl  = document.getElementById('page-' + name);
      if (!newEl) { _authAnimating = false; return; }

      // Make incoming page visible but off-screen (no flash)
      newEl.style.visibility = 'visible';
      newEl.classList.add('active');
      newEl.classList.remove('auth-in-right','auth-in-left','auth-out-left','auth-out-right');

      // Force reflow so animation starts from correct position
      void newEl.offsetWidth;

      // Slide old page out
      if (oldEl) {
        oldEl.classList.add(dir > 0 ? 'auth-out-left' : 'auth-out-right');
      }
      // Slide new page in
      newEl.classList.add(dir > 0 ? 'auth-in-right' : 'auth-in-left');

      currentPage = name;

      setTimeout(function() {
        if (oldEl) {
          oldEl.classList.remove('active','auth-out-left','auth-out-right');
          oldEl.style.visibility = '';
        }
        newEl.classList.remove('auth-in-right','auth-in-left');
        _authAnimating = false;
      }, 320);

      return;
    }

    // ── AUTH → REGULAR: hide auth pages, show regular ──────────
    if (fromAuth && !toAuth) {
      var oldAuth = document.getElementById('page-' + currentPage);
      if (oldAuth) {
        oldAuth.classList.remove('active');
        oldAuth.style.visibility = '';
      }
      document.body.classList.remove('auth-mode');
    }

    // ── REGULAR → AUTH: show auth page over everything ──────────
    if (!fromAuth && toAuth) {
      document.body.classList.add('auth-mode');
      var authEl = document.getElementById('page-' + name);
      if (authEl) {
        authEl.style.visibility = 'visible';
        void authEl.offsetWidth;
        authEl.classList.add('active');
      }
      currentPage = name;
      return;
    }

    // ── REGULAR → REGULAR: opacity fade ──────────────────────────
    document.body.classList.remove('auth-mode');

    var oldEl = document.getElementById('page-' + currentPage);
    if (oldEl) oldEl.classList.remove('active');

    document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('active'); });
    var navEl = document.getElementById('nav-' + name);
    if (navEl) navEl.classList.add('active');

    var newEl = document.getElementById('page-' + name);
    if (!newEl) return;

    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        newEl.classList.add('active');
      });
    });

    currentPage = name;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (name === 'team' || name === 'referral') setTimeout(() => loadTeamPage(), 100);
  }

  /* ══════════════════════════════════════════
     MODAL ENGINE
  ══════════════════════════════════════════ */
  var _modalOnConfirm = null;

  function openModal(cfg) {
    // Build overlay
    var overlay = document.createElement('div');
    overlay.className = 'qx-overlay';
    overlay.id = 'qxModal';

    var iconBg = cfg.iconBg || 'rgba(201,162,39,.12)';
    var rows = '';
    (cfg.rows||[]).forEach(function(r){
      rows += '<div class="qx-modal-row"><span class="qx-modal-row-lbl">'+r.l+'</span><span class="qx-modal-row-val '+(r.cls||'')+'">'+r.v+'</span></div>';
    });
    var warn = cfg.warn ? '<div class="qx-modal-warn"><span class="qx-modal-warn-icon">⚠️</span><span class="qx-modal-warn-txt">'+cfg.warn+'</span></div>' : '';
    var detail = rows ? '<div class="qx-modal-detail">'+rows+'</div>' : '';

    overlay.innerHTML =
      '<div class="qx-modal" id="qxModalBox">'+
        '<div class="qx-modal-handle"></div>'+
        '<div class="qx-modal-head">'+
          '<div style="display:flex;align-items:center;gap:11px">'+
            '<div class="qx-modal-icon-wrap" style="background:'+iconBg+'">'+cfg.icon+'</div>'+
            '<span class="qx-modal-title">'+cfg.title+'</span>'+
          '</div>'+
          '<button class="qx-modal-close" onclick="closeModal()">✕</button>'+
        '</div>'+
        '<div class="qx-modal-body">'+cfg.body+'</div>'+
        detail+warn+
        '<div class="qx-modal-actions">'+
          '<button class="qx-modal-confirm '+(cfg.confirmClass||'qx-btn-gold')+'" onclick="confirmModal()">'+cfg.confirmText+'</button>'+
          '<button class="qx-modal-cancel" onclick="closeModal()">'+(cfg.cancelText||'Cancel')+'</button>'+
        '</div>'+
      '</div>';

    _modalOnConfirm = cfg.onConfirm || null;
    document.body.appendChild(overlay);
    // Close on backdrop tap
    overlay.addEventListener('click', function(e){ if(e.target===overlay) closeModal(); });
  }

  function closeModal() {
    var overlay = document.getElementById('qxModal');
    var box     = document.getElementById('qxModalBox');
    if (!overlay) return;
    overlay.classList.add('closing');
    if (box) box.classList.add('closing');
    setTimeout(function(){ overlay && overlay.remove(); }, 200);
  }

  function confirmModal() {
    closeModal();
    if (typeof _modalOnConfirm === 'function') {
      setTimeout(_modalOnConfirm, 220);
    }
  }

  /* ══════════════════════════════════════════
     TOAST ENGINE
  ══════════════════════════════════════════ */
  function showToast(msg, type, duration) {
    var container = document.getElementById('qx-toasts');
    if (!container) return;
    var t = document.createElement('div');
    var icons = {success:'✅',error:'❌',warning:'⚠️'};
    t.className = 'qx-toast '+(type||'');
    t.innerHTML = '<span>'+(icons[type]||'ℹ️')+'</span><span>'+msg+'</span>';
    container.appendChild(t);
    setTimeout(function(){
      t.classList.add('out');
      setTimeout(function(){ t.remove(); }, 230);
    }, duration || 2800);
  }

  /* ══════════════════════════════════════════
     CONFIRMATION ACTIONS
  ══════════════════════════════════════════ */

  // Plan purchase — new tier system
  var PLANS = {
    bronze: {id:'bronze', name:'QAVIX BRONZE', emoji:'🥉', rate:0.055, days:20, min:5,   max:20,   accent:'#9B6A1A'},
    silver: {id:'silver', name:'QAVIX SILVER', emoji:'🥈', rate:0.060, days:20, min:21,  max:100,  accent:'#555'},
    gold:   {id:'gold',   name:'QAVIX GOLD',   emoji:'🥇', rate:0.065, days:20, min:101, max:300,  accent:'#9B7A10'},
    elite:  {id:'elite',  name:'QAVIX ELITE',  emoji:'💎', rate:0.075, days:20, min:301, max:1000, accent:'#5B3FA0'},
  };

  // Current plan for invest modal
  var _investPlan = null;

  function openInvestModal(planKey) {
    var p = PLANS[planKey];
    if (!p) return;
    _investPlan = p;
    var modal = document.getElementById('qx-invest-modal');
    if (!modal) return;
    document.getElementById('inv-modal-icon').textContent = p.emoji;
    document.getElementById('inv-modal-title').textContent = p.name;
    document.getElementById('inv-modal-range').textContent = '$' + p.min + ' – $' + p.max;
    document.getElementById('inv-modal-desc').textContent = (p.rate*100).toFixed(1) + '% daily ROI · ' + p.days + ' days · Capital permanently locked';
    var inp = document.getElementById('inv-amount-input');
    inp.min = p.min; inp.max = p.max; inp.value = '';
    document.getElementById('inv-modal-err').style.display = 'none';
    document.getElementById('inv-modal-calc').style.display = 'none';
    document.getElementById('inv-confirm-btn').disabled = true;
    document.getElementById('inv-confirm-btn').style.background = '#F1EEE8';
    document.getElementById('inv-confirm-btn').style.color = '#bbb';
    document.getElementById('inv-confirm-btn').style.cursor = 'not-allowed';
    document.getElementById('inv-confirm-btn').textContent = 'Enter a Valid Amount';
    modal.style.display = 'flex';
    setTimeout(function(){ inp.focus(); }, 200);
  }

  function updateInvCalc() {
    var p = _investPlan; if (!p) return;
    var inp = document.getElementById('inv-amount-input');
    var amt = parseFloat(inp.value);
    var errEl = document.getElementById('inv-modal-err');
    var calcEl = document.getElementById('inv-modal-calc');
    var btn = document.getElementById('inv-confirm-btn');
    errEl.style.display = 'none';
    calcEl.style.display = 'none';
    btn.disabled = true;
    btn.style.background = '#F1EEE8'; btn.style.color = '#bbb'; btn.style.cursor = 'not-allowed';
    btn.textContent = 'Enter a Valid Amount';
    if (!inp.value || isNaN(amt)) return;
    if (amt < 5) { errEl.textContent = '⚠ Minimum investment is $5 USDT'; errEl.style.display = 'block'; return; }
    if (amt < p.min) { errEl.textContent = '⚠ Minimum for ' + p.name + ' is $' + p.min; errEl.style.display = 'block'; return; }
    if (amt > p.max) { errEl.textContent = '⚠ Maximum for ' + p.name + ' is $' + p.max; errEl.style.display = 'block'; return; }
    var daily = amt * p.rate;
    var total = daily * p.days;
    var fee   = total * 0.05;
    var net   = total - fee;
    document.getElementById('inv-calc-daily').textContent = '$' + daily.toFixed(2);
    document.getElementById('inv-calc-total').textContent = '$' + total.toFixed(2);
    document.getElementById('inv-calc-fee').textContent   = '-$' + fee.toFixed(2);
    document.getElementById('inv-calc-net').textContent   = '$' + net.toFixed(2);
    calcEl.style.display = 'flex';
    btn.disabled = false;
    btn.style.background = 'linear-gradient(135deg,#C9A227,#9B7A10)';
    btn.style.color = '#fff'; btn.style.cursor = 'pointer';
    btn.textContent = 'Invest $' + amt.toFixed(2) + ' Now';
  }

  async function submitInvestment() {
    var p = _investPlan; if (!p) return;
    var amt = parseFloat(document.getElementById('inv-amount-input').value);
    var btn = document.getElementById('inv-confirm-btn');
    btn.disabled = true; btn.textContent = 'Processing…';
    try {
      var res = await API.req('POST', '/plans/purchase', { planId: p.id, amount: amt });
      document.getElementById('qx-invest-modal').style.display = 'none';
      showToast('✅ ' + p.name + ' activated! Earning $' + (amt * p.rate).toFixed(2) + '/day', 'success');
      // Refresh balance
      var dash = await API.User.dashboard().catch(function(){return null;});
      if (dash) { API.setUser({...API.getUser(), ...dash.data.user}); updateUIWithUser(dash.data.user); }
    } catch(e) {
      var errEl = document.getElementById('inv-modal-err');
      errEl.textContent = '⚠ ' + (e.message || 'Investment failed');
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Invest $' + amt.toFixed(2) + ' Now';
    }
  }

  function confirmBuyPlan(planKey) {
    var p = PLANS[planKey] || PLANS.starter;
    openModal({
      icon:'💎', iconBg:'rgba(201,162,39,.12)',
      title:'Confirm Purchase',
      body:'You are about to activate the <strong>'+p.name+'</strong>. Please review the details below.',
      rows:[
        {l:'Plan',         v:p.name},
        {l:'Investment',   v:p.price, cls:'gold'},
        {l:'Daily Income', v:p.daily, cls:'green'},
        {l:'Duration',     v:p.days},
        {l:'Total ROI',    v:p.roi,   cls:'gold'}
      ],
      warn:'Ensure you have sufficient USDT balance before confirming.',
      confirmText:'✦ Activate Plan',
      confirmClass:'qx-btn-gold',
      onConfirm:function(){ showToast(p.name+' activated successfully! 🎉','success'); }
    });
  }

  // Withdraw
  // ══ TEAM PAGE DYNAMIC RENDERING ═══════════════════════
  const TEAM_COMM = {1:10,2:5,3:2,4:1,5:1,6:1,7:1,8:1,9:1,10:1};
  const LV_COLORS = ['#C9A227','#3B82F6','#22C55E','#8B5CF6','#EC4899','#F59E0B','#14B8A6','#EF4444','#6366F1','#10B981'];
  const LV_STYLES = [
    'background:linear-gradient(135deg,#C9A227,#9B7A10);color:#111',
    'background:linear-gradient(135deg,#888,#555);color:#fff',
    'background:linear-gradient(135deg,#CD7F32,#8B4513);color:#fff',
    'background:rgba(17,17,17,.09);color:#666',
    'background:rgba(17,17,17,.06);color:#888',
    'background:rgba(17,17,17,.07);color:#777',
    'background:rgba(17,17,17,.07);color:#777',
    'background:rgba(17,17,17,.07);color:#777',
    'background:rgba(17,17,17,.07);color:#777',
    'background:rgba(17,17,17,.07);color:#777',
  ];

  function avatarColor(name) {
    const colors = ['#C9A227','#3B82F6','#22C55E','#8B5CF6','#EC4899','#F59E0B','#14B8A6','#EF4444'];
    let h = 0; for (let c of (name||'')) h = c.charCodeAt(0) + ((h<<5)-h);
    return colors[Math.abs(h) % colors.length];
  }
  function initials(name) {
    return (name||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  }
  function fmtDate(d) {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  }

  var _teamLoaded = false;
  var _teamData   = null;

  async function loadTeamPage(force) {
    if (_teamLoaded && !force) return;
    const treeEl   = document.getElementById('tm-tree-levels');
    const listEl   = document.getElementById('tm-members-list');
    const incomeEl = document.getElementById('tm-income-list');

    try {
      const [teamR, earnR] = await Promise.all([
        API.Referral.team(),
        API.Referral.earnings(),
      ]);
      if (!teamR) throw new Error('No team data');
      _teamData = teamR.data;
      _teamLoaded = true;
      // Auto-refresh hero stats every 30s while team page is visible
      clearInterval(window._teamRefreshTimer);
      window._teamRefreshTimer = setInterval(function(){
        var pg = document.getElementById('page-referral') || document.getElementById('page-team');
        if(pg && pg.classList.contains('active')) { _teamLoaded=false; loadTeamPage(); }
        else clearInterval(window._teamRefreshTimer);
      }, 30000);

      const levels  = teamR.data.levels || [];
      const byLevel = earnR?.data?.byLevel || {};
      const commissions = earnR?.data?.recentCommissions || [];
      const totalMembers = teamR.data.totalMembers || 0;

      // ── Check if current user has an active investment ──
      const storedUser   = API.getUser() || {};
      const hasInvested  = (storedUser.totalDeposited && parseFloat(storedUser.totalDeposited) > 0);

      // ── Render tree ──
      if (treeEl) {
        // User has NOT invested yet → lock everything
        if (!hasInvested) {
          treeEl.innerHTML = `
            <div style="text-align:center;padding:32px 20px 24px;background:linear-gradient(135deg,#FFF8E1,#FEF6DC);border-radius:16px;border:1.5px dashed rgba(201,162,39,0.4)">
              <div style="font-size:40px;margin-bottom:10px">🔒</div>
              <div style="font-size:15px;font-weight:800;color:var(--black);margin-bottom:6px">Team Levels Locked</div>
              <div style="font-size:12px;color:var(--muted);line-height:1.7;margin-bottom:18px">
                You need to make an active investment to unlock<br>team commission levels and start earning.
              </div>
              <button onclick="showPage('plans')" style="background:linear-gradient(135deg,#C9A227,#9B7A10);color:#fff;border:none;padding:12px 28px;border-radius:12px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 4px 14px rgba(201,162,39,0.35)">
                ✦ Invest Now to Unlock
              </button>
            </div>`;
        }
        // No members at all — show empty state
        else if (totalMembers === 0) {
          treeEl.innerHTML = `<div style="text-align:center;padding:30px 20px;color:var(--muted)">
            <div style="font-size:32px;margin-bottom:8px">👥</div>
            <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px">No team members yet</div>
            <div style="font-size:11px">Share your referral link to grow your team and earn commissions.</div>
          </div>`;
        } else {
        let html = '';
        for (let i = 1; i <= 10; i++) {
          const lv = levels.find(l => l.level === i);
          const count   = lv?.count || 0;
          const members = lv?.members || [];
          const pct     = TEAM_COMM[i] || 0;
          const earned  = parseFloat(byLevel[i] || 0).toFixed(2);
          const lvStyle = LV_STYLES[i-1] || 'background:#eee;color:#333';
          const isL1    = i === 1;
          const isEmpty = count === 0;

          // avatars
          const MAX_AV = 5;
          let avHtml = '';
          if (isEmpty) {
            avHtml = `<span style="font-size:10px;color:var(--muted)">No members yet</span>`;
          } else {
            const shown = members.slice(0, MAX_AV);
            shown.forEach(m => {
              const bg = avatarColor(m.name);
              const ini = initials(m.name);
              const textColor = bg === '#C9A227' ? '#111' : '#fff';
              avHtml += `<div class="tm-lv-av" style="background:${bg};color:${textColor}">${ini}</div>`;
            });
            if (count > MAX_AV) avHtml += `<span class="tm-lv-av-more">+${count - MAX_AV} more</span>`;
          }

          // members detail — show 10 with Show More
          const MEM_PER_PAGE = 10;
          let memDetailHtml = '';
          if (members.length > 0) {
            const shown = members.slice(0, MEM_PER_PAGE);
            const hasMore = members.length > MEM_PER_PAGE;
            memDetailHtml = `<div class="tm-lv-members-list" id="tm-lv-mlist-${i}">`;
            shown.forEach(m => {
              const bg = avatarColor(m.name);
              const ini = initials(m.name);
              const textColor = bg === '#C9A227' ? '#111' : '#fff';
              const isActive = m.status === 'active';
              memDetailHtml += `<div class="tm-lv-member">
                <div class="tm-lv-mem-av" style="background:${bg};color:${textColor}">${ini}</div>
                <div class="tm-lv-mem-name">${m.name}</div>
                <span class="tm-lv-mem-status ${isActive?'tm-st-active':'tm-st-inactive'}">${isActive?'Active':'Inactive'}</span>
              </div>`;
            });
            memDetailHtml += `</div>`;
            if (hasMore) {
              memDetailHtml += `<button onclick="tmShowMoreLv(${i},${JSON.stringify(members).replace(/"/g,'&quot;')})" style="width:100%;margin-top:8px;padding:8px;border-radius:10px;background:var(--bg);border:1px solid var(--border);color:var(--gold-dk);font-size:12px;font-weight:700;cursor:pointer;font-family:inherit" id="tm-lv-morebtn-${i}">
                Show More (${members.length - MEM_PER_PAGE} more)
              </button>`;
            }
          } else {
            memDetailHtml = `<div style="text-align:center;padding:.5rem 0;font-size:12px;color:var(--muted)">No members at this level yet.</div>`;
          }

          const activeCount = members.filter(m => m.status === 'active').length;

          html += `
          <div class="tm-level-row${isL1?' expanded':''}" id="tm-lv-${i}" onclick="tmToggleLevel(${i})">
            <div class="tm-level-connector" style="background:${isL1?'var(--gold)':i<=3?'#888':i<=5?'#ccc':'#e5e2dc'}"></div>
            <div class="tm-lv-badge" style="${lvStyle}">L${i}</div>
            <div class="tm-lv-info">
              <div class="tm-lv-name">Level ${i}${isL1?' — Direct Team':' — Team'}</div>
              <div class="tm-lv-avatars">${avHtml}</div>
            </div>
            <div class="tm-lv-right">
              <div class="tm-lv-pct">${pct}%</div>
              <div class="tm-lv-earn">$${earned}</div>
            </div>
            <span class="tm-lv-chev">›</span>
          </div>
          <div class="tm-level-detail${isL1?' open':''}" id="tm-ld-${i}">
            <div class="tm-lv-detail-grid">
              <div class="tm-lv-dg-item"><div class="tm-lv-dg-num">${count}</div><div class="tm-lv-dg-lbl">Members</div></div>
              <div class="tm-lv-dg-item"><div class="tm-lv-dg-num">${activeCount}</div><div class="tm-lv-dg-lbl">Active</div></div>
              <div class="tm-lv-dg-item"><div class="tm-lv-dg-num">$${earned}</div><div class="tm-lv-dg-lbl">Earned</div></div>
            </div>
            ${memDetailHtml}
          </div>`;
        }

        treeEl.innerHTML = html;
        } // end else (has members)
      }

      // ── Render members list ──
      if (listEl) {
        const allMembers = levels.flatMap(lv => (lv.members||[]).map(m => ({...m, lvNum: lv.level})));

        // Sort: active first, then inactive; within each group sort by level
        const sorted = [...allMembers].sort((a, b) => {
          const aA = a.status === 'active' ? 0 : 1;
          const bA = b.status === 'active' ? 0 : 1;
          if (aA !== bA) return aA - bA;
          return a.lvNum - b.lvNum;
        });

        // Store all sorted members globally for pagination
        window._tmAllMembers = sorted;
        window._tmMemberPage = 1;
        const PAGE_SIZE = 20;

        function renderMemberPage(page) {
          const all = window._tmAllMembers;
          if (!all || all.length === 0) {
            listEl.innerHTML = `<div style="text-align:center;padding:30px;color:var(--muted);font-size:13px">No team members yet.<br>Share your referral link to grow your team!</div>`;
            return;
          }
          const start  = (page - 1) * PAGE_SIZE;
          const end    = start + PAGE_SIZE;
          const slice  = all.slice(start, end);
          const total  = all.length;
          const totalPages = Math.ceil(total / PAGE_SIZE);

          const activeCount   = all.filter(m => m.status === 'active').length;
          const inactiveCount = all.filter(m => m.status !== 'active').length;

          let html = '';
          // Section headers only on page 1
          if (page === 1 && activeCount > 0) {
            html += `<div style="font-size:10px;font-weight:700;color:#16a34a;letter-spacing:.1em;text-transform:uppercase;padding:10px 0 6px;border-bottom:1px solid #eee;margin-bottom:6px">● Active Members (${activeCount})</div>`;
          }
          let passedActive = false;
          slice.forEach(m => {
            if (!passedActive && m.status !== 'active' && inactiveCount > 0 && page === 1) {
              passedActive = true;
              html += `<div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;padding:10px 0 6px;border-bottom:1px solid #eee;margin-bottom:6px;margin-top:4px">○ Inactive Members (${inactiveCount})</div>`;
            }
            const bg        = avatarColor(m.name);
            const ini       = initials(m.name);
            const textColor = bg === '#C9A227' ? '#111' : '#fff';
            const isActive  = m.status === 'active';
            const dep       = parseFloat(m.deposit||0).toFixed(2);
            const comm      = parseFloat(m.commission||0).toFixed(2);
            html += `<div class="tm-member-row" data-level="l${m.lvNum}" data-name="${m.name.toLowerCase()}" data-status="${m.status}">
              <div class="tm-mem-av" style="background:${bg};color:${textColor}">${ini}</div>
              <div class="tm-mem-info" style="flex:1;min-width:0">
                <div class="tm-mem-name">${m.name}</div>
                <div class="tm-mem-meta">
                  <span class="tm-mem-date">${fmtDate(m.joinDate)}</span>
                  <span class="tm-mem-lvl-tag">L${m.lvNum}</span>
                </div>
                <div style="display:flex;gap:12px;margin-top:5px;flex-wrap:wrap">
                  <span style="font-size:10px;color:var(--muted)">Deposit: <strong style="color:var(--text);font-weight:700">$${dep}</strong></span>
                  <span style="font-size:10px;color:var(--muted)">Commission: <strong style="color:#16a34a;font-weight:700">$${comm}</strong></span>
                </div>
              </div>
              <div class="tm-mem-right" style="align-self:center;margin-left:8px;flex-shrink:0">
                <div class="tm-mem-status ${isActive?'tm-st-active':'tm-st-inactive'}">${isActive?'Active':'Inactive'}</div>
              </div>
            </div>`;
          });

          // Pagination controls
          if (totalPages > 1) {
            html += `<div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">
              <button onclick="tmMemberPage(${page-1})" ${page<=1?'disabled':''} style="padding:8px 16px;border-radius:10px;background:var(--bg);border:1px solid var(--border);color:${page<=1?'#ccc':'var(--text)'};font-size:12px;font-weight:700;cursor:${page<=1?'not-allowed':'pointer'};font-family:inherit">← Prev</button>
              <span style="font-size:11px;color:var(--muted);font-weight:600">Page ${page} of ${totalPages} · ${total} members</span>
              <button onclick="tmMemberPage(${page+1})" ${page>=totalPages?'disabled':''} style="padding:8px 16px;border-radius:10px;background:var(--bg);border:1px solid var(--border);color:${page>=totalPages?'#ccc':'var(--text)'};font-size:12px;font-weight:700;cursor:${page>=totalPages?'not-allowed':'pointer'};font-family:inherit">Next →</button>
            </div>`;
          }

          listEl.innerHTML = html;
        }

        window.tmMemberPage = function(page) {
          const totalPages = Math.ceil((window._tmAllMembers||[]).length / PAGE_SIZE);
          if (page < 1 || page > totalPages) return;
          window._tmMemberPage = page;
          renderMemberPage(page);
          // Scroll to top of list
          listEl.scrollIntoView({behavior:'smooth', block:'nearest'});
        };

        renderMemberPage(1);

        // Update filter counts — L1 to L10
        const filterRow = document.getElementById('tm-filter-row');
        if (filterRow) {
          const all = allMembers.length;
          const lc = {};
          for (let i=1; i<=10; i++) lc[i] = allMembers.filter(m => m.lvNum===i).length;
          filterRow.innerHTML = `
            <button class="tm-filter-btn sel" onclick="tmFilter(this,'all')">All (${all})</button>
            ${[1,2,3,4,5,6,7,8,9,10].map(i=>`<button class="tm-filter-btn" onclick="tmFilter(this,'l${i}')">L${i} (${lc[i]})</button>`).join('')}
            <button class="tm-filter-btn" onclick="tmFilter(this,'active')">Active</button>`;
        }
      }

      // ── Render income history ──
      if (incomeEl) {
        if (!commissions.length) {
          incomeEl.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">No commission history yet.</div>`;
        } else {
          incomeEl.innerHTML = commissions.map(tx => {
            const dt = new Date(tx.createdAt || tx.created_at);
            const dateStr = dt.toLocaleDateString('en-US',{month:'short',day:'numeric'});
            const lvl = tx.meta?.lvl || tx.meta?.level || '?';
            const desc = tx.description || 'Commission';
            const fromName = desc.replace(/Level \d+ commission from /,'') || '—';
            return `<div class="tm-income-row">
              <div><div class="tm-inc-src">${fromName}</div><div class="tm-inc-src-sub">${desc}</div></div>
              <div><span class="tm-inc-lvl-tag">L${lvl}</span></div>
              <div class="tm-inc-date">${dateStr}</div>
              <div class="tm-inc-amt" style="text-align:right">+$${parseFloat(tx.amount).toFixed(2)}</div>
            </div>`;
          }).join('');
        }
      }

    } catch(e) {
      console.warn('Team load error:', e.message);
      _teamLoaded = false; // allow retry
      if (treeEl) treeEl.innerHTML = `<div style="text-align:center;padding:30px 20px;color:var(--muted)">
        <div style="font-size:32px;margin-bottom:8px">👥</div>
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px">No team members yet</div>
        <div style="font-size:11px">Share your referral link to grow your team and earn commissions.</div>
      </div>`;
      if (listEl)   listEl.innerHTML   = '';
      if (incomeEl) incomeEl.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">No commission history yet.</div>`;
    }
  }

  // ══ FINANCIALS TAB DATA ═══════════════════════════════
  async function loadFinancialsData() {
    var depEl = document.getElementById('fin-dep-list');
    var wdEl  = document.getElementById('fin-wd-list');
    try {
      const r = await API.req('GET', '/referral/team-financials');
      var d = r?.data || {};
      var set = (id,v)=>{ var el=document.getElementById(id); if(el) el.textContent=v; };
      set('fin-total-deposit', '$'+(d.totalDeposited||0).toFixed(2));
      set('fin-total-withdraw','$'+(d.totalWithdrawn||0).toFixed(2));

      var renderList = (el, items, type, emptyMsg) => {
        if(!el) return;
        if(!items||!items.length){
          el.innerHTML=`<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">${emptyMsg}</div>`;
          return;
        }
        var color = type==='deposit'?'#16a34a':'#dc2626';
        var sign  = type==='deposit'?'+':'-';
        el.innerHTML = items.map((tx,i)=>`
          <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 0;${i<items.length-1?'border-bottom:1px solid var(--border)':''}">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:34px;height:34px;border-radius:10px;background:rgba(17,17,17,.06);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">${type==='deposit'?'⬇️':'💸'}</div>
              <div>
                <div style="font-size:13px;font-weight:700;color:var(--black)">${tx.name||'Member'}</div>
                <div style="font-size:10px;color:var(--muted);margin-top:1px">${new Date(tx.date).toLocaleDateString()}</div>
              </div>
            </div>
            <div style="font-size:14px;font-weight:800;color:${color}">${sign}$${parseFloat(tx.amount||0).toFixed(2)}</div>
          </div>`).join('');
      };

      renderList(depEl, d.deposits,    'deposit',    'No team deposits yet');
      renderList(wdEl,  d.withdrawals, 'withdrawal', 'No team withdrawals yet');
    } catch(e){
      if(depEl) depEl.innerHTML='<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">No data</div>';
      if(wdEl)  wdEl.innerHTML ='<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">No data</div>';
    }
  }

  // ══ NOTIFICATIONS ═════════════════════════════════════
  var _notifCache = [];
  const notifIcons = {profit:'💰',deposit:'⬇️',withdrawal:'💸',commission:'🤝',bonus:'🎁',security:'🔒',system:'🔔',default:'🔔'};
  const timeAgo = (d) => {
    var s = Math.floor((Date.now()-new Date(d))/1000);
    if(s<60) return 'Just now';
    if(s<3600) return Math.floor(s/60)+'m ago';
    if(s<86400) return Math.floor(s/3600)+'h ago';
    if(s<604800) return Math.floor(s/86400)+'d ago';
    return new Date(d).toLocaleDateString();
  };

  async function loadNotifications() {
    try {
      const r = await API.Notifs.getAll();
      _notifCache = r?.data?.notifications || [];
      renderNotifications();
      var unread = _notifCache.filter(n=>!n.read).length;
      var badge = document.getElementById('hdr-notif-badge');
      var newBadge = document.getElementById('hdr-new-badge');
      if(badge){ badge.textContent=unread; badge.style.display=unread>0?'':'none'; }
      if(newBadge){ newBadge.textContent=unread+' new'; newBadge.style.display=unread>0?'':'none'; }
    } catch(e) {
      var list = document.getElementById('hdr-notif-list');
      if(list) list.innerHTML='<div style="text-align:center;padding:16px;color:#999;font-size:12px">Failed to load</div>';
    }
  }

  function renderNotifications() {
    var list = document.getElementById('hdr-notif-list');
    if(!list) return;
    if(!_notifCache.length) {
      list.innerHTML='<div style="text-align:center;padding:24px;color:#999;font-size:12px">🔔<br>No notifications yet</div>';
      return;
    }
    list.innerHTML = _notifCache.slice(0,15).map(n=>`
      <div class="hdr-notif-row ${n.read?'':'unread'}" onclick="markNotifRead('${n.id}',this)">
        <div class="hdr-notif-icon">${notifIcons[n.type]||notifIcons.default}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;gap:6px">
            <span style="font-size:12px;font-weight:600;color:#111;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${n.title||'Notification'}</span>
            <span style="font-size:10px;color:#aaa;white-space:nowrap;flex-shrink:0">${timeAgo(n.createdAt||n.created_at)}</span>
          </div>
          ${n.body?`<div style="font-size:11px;color:#777;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${n.body}</div>`:''}
        </div>
        ${!n.read?'<span class="hdr-notif-dot"></span>':''}
      </div>`).join('');
  }

  async function markNotifRead(id, el) {
    if(!id) return;
    try {
      await API.Notifs.markRead(id);
      var n = _notifCache.find(x=>x.id===id);
      if(n){ n.read=true; }
      el.classList.remove('unread');
      var dot = el.querySelector('.hdr-notif-dot');
      if(dot) dot.remove();
      var unread = _notifCache.filter(x=>!x.read).length;
      var badge = document.getElementById('hdr-notif-badge');
      var newBadge = document.getElementById('hdr-new-badge');
      if(badge){ badge.textContent=unread; badge.style.display=unread>0?'':'none'; }
      if(newBadge){ newBadge.style.display=unread>0?'':'none'; }
    } catch(e){}
  }

  async function markAllNotifsRead() {
    try {
      await API.Notifs.markAllRead();
      _notifCache.forEach(n=>n.read=true);
      renderNotifications();
      var badge = document.getElementById('hdr-notif-badge');
      var newBadge = document.getElementById('hdr-new-badge');
      if(badge) badge.style.display='none';
      if(newBadge) newBadge.style.display='none';
    } catch(e){}
  }

  // ══ WALLET HISTORY MODAL ══════════════════════════════
  async function openHistoryModal() {
    var overlay = document.createElement('div');
    overlay.className='qx-overlay'; overlay.id='qx-hist-modal';
    overlay.innerHTML=`
      <div class="qx-modal" style="max-width:500px">
        <div class="qx-modal-handle"></div>
        <div class="qx-modal-head">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="qx-modal-icon-wrap" style="background:rgba(201,162,39,.12)">📋</div>
            <div class="qx-modal-title">Transaction History</div>
          </div>
          <button class="qx-modal-close" onclick="document.getElementById('qx-hist-modal').remove()">✕</button>
        </div>
        <!-- Tabs -->
        <div style="display:flex;gap:6px;padding:0 1.2rem 12px;overflow-x:auto">
          ${['All','Deposit','Withdrawal','Profit','Commission','Bonus'].map((t,i)=>`
            <button onclick="filterHistory('${t.toLowerCase()}')" id="htab-${t.toLowerCase()}"
              style="padding:6px 14px;border-radius:999px;border:1.5px solid ${i===0?'var(--gold)':'var(--border)'};
              background:${i===0?'var(--gold)':'transparent'};color:${i===0?'#111':'var(--muted)'};
              font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;flex-shrink:0;transition:all .2s">
              ${t}
            </button>`).join('')}
        </div>
        <div style="padding:0 1.2rem 1.4rem;max-height:60vh;overflow-y:auto" id="hist-body">
          <div style="text-align:center;padding:32px;color:var(--muted);font-size:13px">Loading...</div>
        </div>
      </div>`;
    overlay.addEventListener('click',e=>{ if(e.target===overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    await loadHistoryData('all');
  }

  var _histCache = [];
  async function loadHistoryData(type) {
    var body = document.getElementById('hist-body');
    if(!body) return;
    try {
      if(!_histCache.length) {
        const r = await API.Wallet.transactions('',100);
        _histCache = r?.data?.transactions || [];
      }
      filterHistory(type);
    } catch(e) {
      if(body) body.innerHTML='<div style="text-align:center;padding:32px;color:var(--muted);font-size:13px">Failed to load</div>';
    }
  }

  function filterHistory(type) {
    // Update tabs
    ['all','deposit','withdrawal','profit','commission','bonus'].forEach(t=>{
      var btn=document.getElementById('htab-'+t);
      if(!btn) return;
      var active=t===type;
      btn.style.background=active?'var(--gold)':'transparent';
      btn.style.color=active?'#111':'var(--muted)';
      btn.style.borderColor=active?'var(--gold)':'var(--border)';
    });
    var body=document.getElementById('hist-body');
    if(!body) return;
    var rows=type==='all'?_histCache:_histCache.filter(t=>(t.type||'').toLowerCase()===type);
    if(!rows.length){
      body.innerHTML='<div style="text-align:center;padding:32px"><div style="font-size:32px;margin-bottom:8px">📭</div><div style="color:var(--muted);font-size:13px">No '+type+' transactions yet</div></div>';
      return;
    }
    const txIcons={deposit:'⬇️',withdrawal:'💸',profit:'💰',commission:'🤝',bonus:'🎁'};
    const txColors={deposit:'#16a34a',withdrawal:'#dc2626',profit:'#16a34a',commission:'#9B7A10',bonus:'#9B7A10'};
    const txStatus={confirmed:'✅',processing:'⏳',pending:'🕐',completed:'✅',failed:'❌'};
    body.innerHTML=rows.map((tx,i)=>{
      var t=tx.type||'';
      var amt=parseFloat(tx.amount||0);
      var isPos=['deposit','profit','commission','bonus'].includes(t);
      return `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 0;${i<rows.length-1?'border-bottom:1px solid var(--border)':''}">
          <div style="width:40px;height:40px;border-radius:12px;background:rgba(17,17,17,.06);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${txIcons[t]||'💳'}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:var(--black);margin-bottom:2px">${tx.description||t.charAt(0).toUpperCase()+t.slice(1)}</div>
            <div style="font-size:11px;color:var(--muted)">${new Date(tx.createdAt||tx.created_at).toLocaleString()}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:14px;font-weight:800;color:${txColors[t]||'var(--black)'}">${isPos?'+':'-'}$${amt.toFixed(2)}</div>
            <div style="font-size:10px;color:var(--muted);margin-top:2px">${txStatus[tx.status]||''} ${tx.status||''}</div>
          </div>
        </div>`;
    }).join('');
  }

  // Load wallet recent transactions
  async function loadWalletTransactions() {
    var list=document.getElementById('wallet-tx-list');
    if(!list) return;
    try {
      const r=await API.Wallet.transactions('',5);
      var txs=r?.data?.transactions||[];
      if(!_histCache.length) _histCache=txs;
      if(!txs.length){ list.innerHTML='<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px">No transactions yet</div>'; return; }
      const icons={deposit:'⬇️',withdrawal:'💸',profit:'💰',commission:'🤝',bonus:'🎁'};
      const colors={deposit:'#16a34a',withdrawal:'#dc2626',profit:'#16a34a',commission:'#9B7A10',bonus:'#9B7A10'};
      list.innerHTML=txs.map(tx=>{
        var t=tx.type||'';
        var amt=parseFloat(tx.amount||0);
        var isPos=['deposit','profit','commission','bonus'].includes(t);
        return `<div class="wallet-tx">
          <div class="tx-icon" style="background:rgba(17,17,17,.06);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;width:40px;height:40px;flex-shrink:0">${icons[t]||'💳'}</div>
          <div class="tx-info">
            <div class="tx-type">${tx.description||t.charAt(0).toUpperCase()+t.slice(1)}</div>
            <div class="tx-date">${new Date(tx.createdAt||tx.created_at).toLocaleDateString()}</div>
          </div>
          <div class="tx-right">
            <div class="tx-amt ${isPos?'pos':'neg'}">${isPos?'+':'-'}$${amt.toFixed(2)}</div>
            <span class="tx-status tx-st-done">${tx.status||'done'}</span>
          </div>
        </div>`;
      }).join('');
    } catch(e){ if(list) list.innerHTML='<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px">Failed to load</div>'; }
  }

  // ══ REFERRAL DATA ══════════════════════════════════════
  async function loadReferralData() {
    try {
      const [infoR, earningsR] = await Promise.all([
        API.Referral.info().catch(()=>null),
        API.Referral.earnings().catch(()=>null)
      ]);
      // ── Referral code / link ──
      if(infoR?.data) {
        var d=infoR.data;
        var code=d.referralCode||'—';
        var link='https://qavixglobal.pages.dev/?ref='+code;
        var el=document.getElementById('tm-ref-code'); if(el) el.textContent=code;
        var ll=document.getElementById('tm-ref-link'); if(ll) ll.textContent=link;
        window._tmCode=code; window._tmLink=link;
      }

      // ── Hero stats: use live teamR data (already loaded above) ──
      {
        var allM   = (teamR?.data?.levels||[]).flatMap(lv=>(lv.members||[]));
        var teamSz = teamR?.data?.totalMembers || 0;
        var activeM= allM.filter(m=>m.status==='active').length;
        var set=(id,v)=>{var e=document.getElementById(id);if(e)e.textContent=v;};
        set('tm-stat-team',   teamSz);
        set('tm-stat-active', activeM);
        set('tstat-total',    teamSz);
        set('tstat-active',   activeM);
        var teamVol2 = allM.reduce((s,m)=>s+parseFloat(m.deposit||0),0);
        set('tstat-volume', '$'+teamVol2.toFixed(2));
        var refs = (teamR?.data?.levels?.find(l=>l.level===1)?.count)||0;
        set('tstat-l1',       refs);
        set('tstat-l2plus',   Math.max(0, teamSz - refs));
        if(activeM>0&&teamSz>0) set('tstat-active-rate','↑ '+Math.round(activeM/teamSz*100)+'% active rate');
        // Team Volume = sum of all members' total_deposited
        var teamVol = allM.reduce((s,m)=>s+parseFloat(m.deposit||0),0);
        set('tstat-volume', '$'+teamVol.toFixed(2));
      }

      // ── Earnings ──
      if(earningsR?.data) {
        var e=earningsR.data;
        var total=parseFloat(e.totalEarned||0);
        var pending=parseFloat(e.pendingEarnings||0);
        var set=(id,v)=>{var el=document.getElementById(id);if(el)el.textContent=v;};
        set('tm-stat-earned',   '$'+total.toFixed(2));
        set('tm-comm-total',    '$'+total.toFixed(2));
        set('tm-comm-pending',  '$'+pending.toFixed(2));
        set('tm-comm-collected','$'+total.toFixed(2));
        var byLevel=e.byLevel||{};
        var l1earn=parseFloat(byLevel['1']||0);
        var l2earn=[2,3,4,5,6,7,8,9,10].reduce((s,i)=>s+parseFloat(byLevel[i]||0),0);
        set('tcomm-l1','$'+l1earn.toFixed(2));
        set('tcomm-l2','$'+l2earn.toFixed(2));
        var cbtn=document.getElementById('tm-collect-btn');
        if(cbtn && pending<=0){ cbtn.disabled=true; cbtn.style.opacity='.5'; cbtn.textContent='No earnings to collect'; }
        else if(cbtn){ cbtn.disabled=false; cbtn.style.opacity='1'; cbtn.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Collect Commission'; }
      }
      // Load deposit/withdraw totals for hero stats
      API.Wallet.transactions('',200).then(r=>{
        var txs = r?.data?.transactions||[];
        if(!_histCache.length) _histCache=txs;
        var dep = txs.filter(t=>t.type==='deposit').reduce((s,t)=>s+parseFloat(t.amount||0),0);
        var wd  = txs.filter(t=>t.type==='withdrawal').reduce((s,t)=>s+parseFloat(t.amount||0),0);
        var sd=document.getElementById('tm-stat-deposit'); if(sd) sd.textContent='$'+dep.toFixed(2);
        var sw=document.getElementById('tm-stat-withdraw'); if(sw) sw.textContent='$'+wd.toFixed(2);
      }).catch(()=>{});
      var initials=(u.name||'U').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
      var ti=document.getElementById('tm-tree-initials'); if(ti) ti.textContent=initials;
      var tl=document.getElementById('tm-tree-level'); if(tl) tl.textContent=u.membershipLevel||'Free Member';
    } catch(e){ console.error('Referral load error:',e); }
  }

  // ══ COMMISSION COLLECT ════════════════════════════════
  async function collectCommission() {
    var btn=document.getElementById('tm-collect-btn');
    if(btn){ btn.disabled=true; btn.textContent='Collecting...'; }
    try {
      const r=await API.Referral.collect();
      showToast(r.message||'✅ Commission collected!','success');
      await loadReferralData();
      // Refresh balance
      const dash=await API.User.dashboard().catch(()=>null);
      if(dash){ API.setUser({...API.getUser(),...dash.data.user}); updateUIWithUser(dash.data.user); }
    } catch(e){
      showToast(e.message||'Nothing to collect','warning');
      if(btn){ btn.disabled=false; btn.textContent='Collect Commission'; }
    }
  }
  function openPersonalInfoModal() {
    var u = API.getUser() || {};
    var overlay = document.createElement('div');
    overlay.className = 'qx-overlay'; overlay.id = 'qx-pinfo-modal';
    overlay.innerHTML = `
      <div class="qx-modal" style="max-width:440px">
        <div class="qx-modal-handle"></div>
        <div class="qx-modal-head">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="qx-modal-icon-wrap" style="background:rgba(139,92,246,.12)">👤</div>
            <div class="qx-modal-title">Personal Information</div>
          </div>
          <button class="qx-modal-close" onclick="document.getElementById('qx-pinfo-modal').remove()">✕</button>
        </div>
        <div style="padding:0 1.2rem 1.4rem;display:flex;flex-direction:column;gap:10px">
          <div>
            <div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.08em;margin-bottom:5px">FULL NAME</div>
            <input id="pi-name" value="${u.name||''}" placeholder="Your full name"
              style="width:100%;padding:11px 13px;border-radius:11px;border:1.5px solid var(--border);background:var(--bg);color:var(--black);font-size:14px;font-family:inherit;outline:none;box-sizing:border-box"
              onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"/>
          </div>
          <div>
            <div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.08em;margin-bottom:5px">TELEGRAM USERNAME <span style="color:var(--muted);font-weight:400">(optional)</span></div>
            <input id="pi-telegram" value="${u.telegram||''}" placeholder="@username"
              style="width:100%;padding:11px 13px;border-radius:11px;border:1.5px solid var(--border);background:var(--bg);color:var(--black);font-size:14px;font-family:inherit;outline:none;box-sizing:border-box"
              onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"/>
          </div>
          <div>
            <div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.08em;margin-bottom:5px">DATE OF BIRTH <span style="color:var(--muted);font-weight:400">(optional)</span></div>
            <input id="pi-dob" type="date" value="${u.dateOfBirth||u.date_of_birth||''}"
              style="width:100%;padding:11px 13px;border-radius:11px;border:1.5px solid var(--border);background:var(--bg);color:var(--black);font-size:14px;font-family:inherit;outline:none;box-sizing:border-box"
              onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"/>
          </div>
          <div>
            <div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.08em;margin-bottom:5px">PHONE NUMBER <span style="color:var(--muted);font-weight:400">(optional)</span></div>
            <input id="pi-phone" value="${u.phone||''}" placeholder="+880 1XXXXXXXXX"
              style="width:100%;padding:11px 13px;border-radius:11px;border:1.5px solid var(--border);background:var(--bg);color:var(--black);font-size:14px;font-family:inherit;outline:none;box-sizing:border-box"
              onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"/>
          </div>
          <div id="pi-err" style="font-size:12px;color:#dc2626;display:none"></div>
          <button onclick="submitPersonalInfo()" style="width:100%;padding:13px;border-radius:12px;background:var(--black);color:var(--gold);border:none;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;transition:all .2s">Save Changes</button>
        </div>
      </div>`;
    overlay.addEventListener('click',e=>{ if(e.target===overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  async function submitPersonalInfo() {
    var name = document.getElementById('pi-name')?.value.trim();
    var telegram = document.getElementById('pi-telegram')?.value.trim();
    var dob = document.getElementById('pi-dob')?.value;
    var phone = document.getElementById('pi-phone')?.value.trim();
    var err = document.getElementById('pi-err');
    if (!name) { if(err){err.textContent='Name is required';err.style.display='block';} return; }
    try {
      const r = await API.req('PUT','/user/personal-info',{name,telegram,dateOfBirth:dob||null,phone:phone||null});
      if (r && r.data) { API.setUser({...API.getUser(),...r.data.user}); updateUIWithUser(r.data.user); }
      document.getElementById('qx-pinfo-modal')?.remove();
      showToast('✅ Profile updated!','success');
    } catch(e){ if(err){err.textContent=e.message;err.style.display='block';} }
  }

  // ══ WITHDRAWAL PASSWORD MODAL ═════════════════════
  function openWithdrawalPassModal() {
    var u = API.getUser() || {};
    var hasPass = u.hasWithdrawalPass || u.withdrawalPass || u.withdrawal_pass;
    var overlay = document.createElement('div');
    overlay.className = 'qx-overlay'; overlay.id = 'qx-wdpass-modal';
    overlay.innerHTML = `
      <div class="qx-modal" style="max-width:420px">
        <div class="qx-modal-handle"></div>
        <div class="qx-modal-head">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="qx-modal-icon-wrap" style="background:rgba(201,162,39,.12)">🔑</div>
            <div class="qx-modal-title">${hasPass?'Change':'Set'} Withdrawal Password</div>
          </div>
          <button class="qx-modal-close" onclick="document.getElementById('qx-wdpass-modal').remove()">✕</button>
        </div>
        <div style="padding:0 1.2rem 1.4rem;display:flex;flex-direction:column;gap:10px">
          <div style="font-size:12px;color:var(--muted);line-height:1.6">
            ${hasPass ? 'Enter your old withdrawal password and new one.' : 'Set a 6-digit PIN or password for withdrawals.'}
          </div>
          ${hasPass ? `<input id="wdp-old" type="password" placeholder="Old withdrawal password"
            style="width:100%;padding:11px 13px;border-radius:11px;border:1.5px solid var(--border);background:var(--bg);color:var(--black);font-size:14px;font-family:inherit;outline:none;box-sizing:border-box"
            onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"/>` : ''}
          <input id="wdp-new" type="password" placeholder="New withdrawal password (min 6)"
            style="width:100%;padding:11px 13px;border-radius:11px;border:1.5px solid var(--border);background:var(--bg);color:var(--black);font-size:14px;font-family:inherit;outline:none;box-sizing:border-box"
            onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"/>
          <input id="wdp-confirm" type="password" placeholder="Confirm password"
            style="width:100%;padding:11px 13px;border-radius:11px;border:1.5px solid var(--border);background:var(--bg);color:var(--black);font-size:14px;font-family:inherit;outline:none;box-sizing:border-box"
            onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"/>
          <div id="wdp-err" style="font-size:12px;color:#dc2626;display:none"></div>
          <button onclick="submitWithdrawalPass(${hasPass?true:false})"
            style="width:100%;padding:13px;border-radius:12px;background:var(--black);color:var(--gold);border:none;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit">
            ${hasPass ? 'Change Password' : 'Set Password'}
          </button>
        </div>
      </div>`;
    overlay.addEventListener('click',e=>{ if(e.target===overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  async function submitWithdrawalPass(isChange) {
    var oldP = document.getElementById('wdp-old')?.value;
    var newP = document.getElementById('wdp-new')?.value;
    var conf = document.getElementById('wdp-confirm')?.value;
    var err  = document.getElementById('wdp-err');
    if (!newP||newP.length<6) { if(err){err.textContent='Min 6 characters';err.style.display='block';} return; }
    if (newP !== conf) { if(err){err.textContent='Passwords do not match';err.style.display='block';} return; }
    try {
      if (isChange) {
        // Step 1: verify old password → get OTP sent
        const r = await API.req('POST','/user/change-withdrawal-password',{oldPassword:oldP,newPassword:newP});
        if (r && r.requireOtp) {
          document.getElementById('qx-wdpass-modal')?.remove();
          showOTPModal({
            title: 'Verify Withdrawal Password Change',
            subtitle: 'OTP sent to your email',
            onVerify: async (otp) => {
              // Step 2: submit with OTP
              await API.req('POST','/user/change-withdrawal-password',{oldPassword:oldP,newPassword:newP,otp});
              document.getElementById('qx-otp-modal')?.remove();
              showToast('✅ Withdrawal password changed successfully!','success');
            },
            onResend: async () => {
              await API.req('POST','/user/change-withdrawal-password',{oldPassword:oldP,newPassword:newP});
            }
          });
        }
      } else {
        await API.req('POST','/user/set-withdrawal-password',{password:newP});
        // Update local user state
        var u = API.getUser(); if(u){ u.hasWithdrawalPass=true; API.setUser(u); }
        // Update UI badge
        var tag = document.getElementById('pf-wdpass-tag');
        var sub = document.getElementById('pf-wdpass-sub');
        if(tag){ tag.textContent='Set'; tag.style.background='rgba(34,197,94,.1)'; tag.style.color='#16a34a'; }
        if(sub) sub.textContent='Tap to change withdrawal password';
        document.getElementById('qx-wdpass-modal')?.remove();
        showToast('✅ Withdrawal password set successfully!','success');
      }
    } catch(e){ if(err){err.textContent=e.message;err.style.display='block';} }
  }

  // ══ WALLET BIND MODAL ═════════════════════════════
  function openWalletBindModal() {
    var u = API.getUser() || {};
    var addr = u.walletAddress || u.wallet_address;
    var overlay = document.createElement('div');
    overlay.className = 'qx-overlay'; overlay.id = 'qx-wbind-modal';
    overlay.innerHTML = `
      <div class="qx-modal" style="max-width:440px">
        <div class="qx-modal-handle"></div>
        <div class="qx-modal-head">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="qx-modal-icon-wrap" style="background:rgba(201,162,39,.12)">💳</div>
            <div class="qx-modal-title">Withdrawal Wallet</div>
          </div>
          <button class="qx-modal-close" onclick="document.getElementById('qx-wbind-modal').remove()">✕</button>
        </div>
        <div style="padding:0 1.2rem 1.4rem">
          ${addr ? `
            <div style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.2);border-radius:12px;padding:14px;margin-bottom:14px">
              <div style="font-size:10px;font-weight:700;color:#16a34a;letter-spacing:.08em;margin-bottom:5px">✅ LINKED WALLET (BEP20)</div>
              <div style="font-size:13px;font-weight:700;color:var(--black);word-break:break-all;font-family:monospace">${addr}</div>
            </div>
            <div style="background:rgba(201,162,39,.06);border:1px solid rgba(201,162,39,.15);border-radius:11px;padding:11px 13px;display:flex;align-items:center;gap:8px">
              <span style="font-size:14px">⚠️</span>
              <span style="font-size:12px;color:var(--gold-dk);line-height:1.5">To change your wallet address, please contact our support team.</span>
            </div>
            <button onclick="window.open('https://t.me/QavixGlobal_Support','_blank')" style="width:100%;margin-top:12px;padding:12px;border-radius:12px;background:rgba(59,130,246,.1);color:#2563eb;border:1.5px solid rgba(59,130,246,.2);font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
              ✈️ Contact Support on Telegram
            </button>
          ` : `
            <div style="font-size:12px;color:var(--muted);line-height:1.6;margin-bottom:14px">Bind your BEP20 USDT wallet. This can only be changed by contacting support.</div>
            <input id="wb-addr" placeholder="BEP20 wallet address (starts with 0x)"
              style="width:100%;padding:11px 13px;border-radius:11px;border:1.5px solid var(--border);background:var(--bg);color:var(--black);font-size:13px;font-family:monospace;outline:none;box-sizing:border-box;margin-bottom:10px"
              onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"/>
            <div id="wb-err" style="font-size:12px;color:#dc2626;display:none;margin-bottom:8px"></div>
            <button onclick="submitWalletBind()" style="width:100%;padding:13px;border-radius:12px;background:var(--black);color:var(--gold);border:none;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit">
              Bind Wallet
            </button>
          `}
        </div>
      </div>`;
    overlay.addEventListener('click',e=>{ if(e.target===overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  async function submitWalletBind() {
    var addr = document.getElementById('wb-addr')?.value.trim();
    var err  = document.getElementById('wb-err');
    if (!addr||addr.length<20) { if(err){err.textContent='Enter a valid wallet address';err.style.display='block';} return; }
    try {
      await API.req('PUT','/user/wallet-address',{walletAddress:addr,network:'BEP20'});
      var u = API.getUser(); if(u){ u.walletAddress=addr; API.setUser(u); }
      document.getElementById('qx-wbind-modal')?.remove();
      // Update tag
      var tag=document.getElementById('pf-wallet-tag');
      var sub=document.getElementById('pf-wallet-sub');
      if(tag){ tag.textContent='Linked'; tag.style.background='rgba(34,197,94,.1)'; tag.style.color='#16a34a'; }
      if(sub) sub.textContent='BEP20 · '+addr.slice(0,6)+'…'+addr.slice(-4);
      showToast('✅ Wallet linked successfully!','success');
    } catch(e){ if(err){err.textContent=e.message;err.style.display='block';} }
  }

  // ══ LOGIN HISTORY MODAL ═══════════════════════════
  async function openLoginHistoryModal() {
    var overlay = document.createElement('div');
    overlay.className = 'qx-overlay'; overlay.id = 'qx-lhist-modal';
    overlay.innerHTML = `
      <div class="qx-modal" style="max-width:480px">
        <div class="qx-modal-handle"></div>
        <div class="qx-modal-head">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="qx-modal-icon-wrap" style="background:rgba(17,17,17,.08)">🕐</div>
            <div class="qx-modal-title">Login History</div>
          </div>
          <button class="qx-modal-close" onclick="document.getElementById('qx-lhist-modal').remove()">✕</button>
        </div>
        <div style="padding:0 1.2rem 1.4rem" id="lhist-body">
          <div style="text-align:center;padding:24px;color:var(--muted);font-size:13px">Loading...</div>
        </div>
      </div>`;
    overlay.addEventListener('click',e=>{ if(e.target===overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    try {
      const r = await API.req('GET','/user/login-history');
      var body = document.getElementById('lhist-body');
      if (!body) return;
      var rows = (r?.data?.history) || [];
      if (!rows.length) {
        body.innerHTML='<div style="text-align:center;padding:32px;color:var(--muted)"><div style="font-size:32px;margin-bottom:8px">🕐</div><div style="font-size:13px">No login history yet</div><div style="font-size:11px;margin-top:4px">History is recorded from your next login</div></div>';
        return;
      }
      body.innerHTML = rows.map((h,i)=>`
        <div style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;${i<rows.length-1?'border-bottom:1px solid var(--border)':''}">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(17,17,17,.06);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px">📱</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:700;color:var(--black);margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${(h.device||'Unknown device').slice(0,60)}</div>
            <div style="font-size:11px;color:var(--muted)">${new Date(h.createdAt||h.created_at).toLocaleString()}</div>
            <div style="font-size:10px;color:var(--muted);margin-top:1px">IP: ${h.ip||'Unknown'}</div>
          </div>
          <div style="flex-shrink:0">
            <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;background:rgba(34,197,94,.1);color:#16a34a">✓ Success</span>
          </div>
        </div>`).join('');
    } catch(e) {
      var body2 = document.getElementById('lhist-body');
      if(body2) body2.innerHTML='<div style="text-align:center;padding:32px;color:var(--muted)"><div style="font-size:32px;margin-bottom:8px">🕐</div><div style="font-size:13px">Login from this session onward will appear here</div></div>';
    }
  }

  // ══ DEVICE MANAGEMENT MODAL ═══════════════════════
  async function openDeviceManagementModal() {
    var overlay = document.createElement('div');
    overlay.className = 'qx-overlay'; overlay.id = 'qx-devm-modal';
    overlay.innerHTML = `
      <div class="qx-modal" style="max-width:460px">
        <div class="qx-modal-handle"></div>
        <div class="qx-modal-head">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="qx-modal-icon-wrap" style="background:rgba(17,17,17,.08)">📱</div>
            <div class="qx-modal-title">Active Devices</div>
          </div>
          <button class="qx-modal-close" onclick="document.getElementById('qx-devm-modal').remove()">✕</button>
        </div>
        <div style="padding:0 1.2rem 1.4rem" id="devm-body">
          <div style="text-align:center;padding:24px;color:var(--muted);font-size:12px">Loading active devices...</div>
        </div>
      </div>`;
    overlay.addEventListener('click',e=>{ if(e.target===overlay) overlay.remove(); });
    document.body.appendChild(overlay);

    try {
      const tok = localStorage.getItem('qvx_token');
      const r = await fetch('https://qavix-global-axeo.onrender.com/api/user/sessions',{
        headers:{ Authorization: 'Bearer ' + tok }
      }).then(x=>x.json());

      var body = document.getElementById('devm-body');
      if (!body) return;
      var sessions = (r?.data?.sessions) || [];

      if (!sessions.length) {
        body.innerHTML = `
          <div style="text-align:center;padding:32px;color:var(--muted)">
            <div style="font-size:36px;margin-bottom:10px">📱</div>
            <div style="font-size:13px;font-weight:700;color:var(--black);margin-bottom:4px">No active sessions</div>
            <div style="font-size:11px">Your active logged-in devices will appear here</div>
          </div>`;
        return;
      }

      function parseDevice(ua) {
        if (!ua) return { icon:'🖥️', name:'Unknown Device', type:'Unknown' };
        var u = ua.toLowerCase();
        if (/iphone/.test(u))          return { icon:'📱', name:'iPhone',          type:'iOS' };
        if (/ipad/.test(u))            return { icon:'📟', name:'iPad',            type:'iPadOS' };
        if (/android.*mobile/.test(u)) return { icon:'📱', name:'Android Phone',   type:'Android' };
        if (/android/.test(u))         return { icon:'📟', name:'Android Tablet',  type:'Android' };
        if (/windows/.test(u))         return { icon:'💻', name:'Windows PC',      type:'Windows' };
        if (/macintosh/.test(u))       return { icon:'🍎', name:'Mac',             type:'macOS' };
        if (/linux/.test(u))           return { icon:'🖥️', name:'Linux PC',        type:'Linux' };
        return { icon:'🌐', name:'Browser', type:'Unknown' };
      }

      const currentRToken = localStorage.getItem('qvx_refresh') || '';

      body.innerHTML = sessions.map((s,i) => {
        const dev  = parseDevice(s.device || '');
        const date = new Date(s.createdAt || s.created_at);
        const last = new Date(s.lastActive || s.last_active || s.createdAt || s.created_at);
        const isCurrent = i === 0; // most recent = current
        return `
        <div style="display:flex;align-items:flex-start;gap:12px;padding:13px 0;${i<sessions.length-1?'border-bottom:1px solid var(--border)':''}">
          <div style="width:42px;height:42px;border-radius:13px;
            background:${isCurrent?'rgba(34,197,94,.08)':'rgba(17,17,17,.04)'};
            border:1px solid ${isCurrent?'rgba(34,197,94,.2)':'var(--border)'};
            display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:20px">${dev.icon}</div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:3px">
              <div style="font-size:13px;font-weight:800;color:var(--black)">${dev.name}</div>
              ${isCurrent ? '<span style="font-size:9px;font-weight:800;padding:2px 8px;border-radius:999px;background:rgba(34,197,94,.12);color:#16a34a;border:1px solid rgba(34,197,94,.2)">This Device</span>' : ''}
            </div>
            <div style="font-size:11px;color:var(--muted)">Logged in: ${date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
            <div style="font-size:10px;color:var(--muted);margin-top:1px">IP: ${s.ip||'Unknown'} · ${dev.type}</div>
          </div>
          ${!isCurrent ? `<button onclick="revokeSession('${s.id}')" style="flex-shrink:0;padding:6px 12px;border-radius:9px;border:1px solid rgba(239,68,68,.2);background:rgba(239,68,68,.06);color:#dc2626;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">Remove</button>` : '<div style="width:8px;height:8px;border-radius:50%;background:#22c55e;flex-shrink:0;margin-top:6px;box-shadow:0 0 6px rgba(34,197,94,.5)"></div>'}
        </div>`;
      }).join('');

      body.innerHTML += `
        <div style="margin-top:14px;background:rgba(201,162,39,.06);border:1px solid rgba(201,162,39,.15);border-radius:11px;padding:11px 13px;display:flex;align-items:center;gap:8px">
          <span style="font-size:14px">ℹ️</span>
          <span style="font-size:12px;color:var(--gold-dk);line-height:1.5">Only OTP-verified login sessions are shown here.</span>
        </div>`;

    } catch(e) {
      var body2 = document.getElementById('devm-body');
      if(body2) body2.innerHTML = '<div style="text-align:center;padding:32px;color:var(--muted)"><div style="font-size:32px;margin-bottom:8px">⚠️</div><div style="font-size:13px">Could not load devices</div></div>';
    }
  }

  async function revokeSession(sessionId) {
    try {
      const tok = localStorage.getItem('qvx_token');
      await fetch('https://qavix-global-axeo.onrender.com/api/user/sessions/' + sessionId, {
        method:'DELETE', headers:{ Authorization:'Bearer '+tok }
      });
      showToast('Session removed','success');
      document.getElementById('qx-devm-modal')?.remove();
      setTimeout(openDeviceManagementModal, 300);
    } catch(e) { showToast('Failed to remove session','error'); }
  }
  function confirmWithdraw() {
    var u = API.getUser();
    var walletEl  = document.getElementById('withdraw-address');
    var amtEl     = document.getElementById('withdraw-amount');
    var networkEl = document.getElementById('withdraw-network');
    var addr    = walletEl  ? walletEl.value.trim()  : (u && (u.walletAddress||u.wallet_address)) || '';
    var amt     = amtEl     ? amtEl.value.trim()     : '';
    var network = networkEl ? networkEl.value        : 'BEP20';
    if (!amt || isNaN(amt) || parseFloat(amt) <= 0) { showToast('Enter a valid amount','error'); return; }
    if (!addr) { showToast('Enter wallet address','error'); return; }
    var fee = +(Math.max(1, parseFloat(amt)*0.02)).toFixed(2);
    var net = +(parseFloat(amt)-fee).toFixed(2);

    // Withdrawal password modal
    var overlay = document.createElement('div');
    overlay.className = 'qx-overlay'; overlay.id = 'qx-wd-confirm-modal';
    overlay.innerHTML = `
      <div class="qx-modal" style="max-width:420px">
        <div class="qx-modal-handle"></div>
        <div class="qx-modal-head">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="qx-modal-icon-wrap" style="background:rgba(239,68,68,.1);font-size:20px">💸</div>
            <div>
              <div class="qx-modal-title">Confirm Withdrawal</div>
              <div style="font-size:11px;color:var(--muted)">Enter withdrawal password</div>
            </div>
          </div>
          <button class="qx-modal-close" onclick="document.getElementById('qx-wd-confirm-modal').remove()">✕</button>
        </div>
        <div style="padding:0 1.2rem 1.4rem">
          <div style="background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:14px">
            ${[['Amount','$'+parseFloat(amt).toFixed(2)+' USDT','var(--gold)'],
               ['Network',network,'var(--black)'],
               ['Wallet',addr.slice(0,6)+'…'+addr.slice(-4),'var(--black)'],
               ['Fee','$'+fee,'#dc2626'],
               ['You Receive','$'+net+' USDT','#16a34a']].map(([l,v,c])=>`
              <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:12px">
                <span style="color:var(--muted)">${l}</span>
                <span style="font-weight:700;color:${c}">${v}</span>
              </div>`).join('')}
          </div>
          <input id="wd-pass-input" type="password" placeholder="Withdrawal password"
            style="width:100%;padding:12px 14px;border-radius:11px;border:1.5px solid var(--border);background:var(--bg);color:var(--black);font-size:14px;font-family:inherit;outline:none;box-sizing:border-box;margin-bottom:10px"
            onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"/>
          <div id="wd-pass-err" style="font-size:12px;color:#dc2626;display:none;margin-bottom:8px"></div>
          <div style="font-size:11px;color:var(--muted);margin-bottom:12px;line-height:1.5">⚠️ Withdrawals are irreversible. Double-check your wallet address.</div>
          <button onclick="submitWithdraw('${addr}',${parseFloat(amt)},'${network}')"
            style="width:100%;padding:13px;border-radius:12px;background:#dc2626;color:#fff;border:none;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit">
            Confirm Withdrawal
          </button>
        </div>
      </div>`;
    overlay.addEventListener('click',e=>{ if(e.target===overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  async function submitWithdraw(addr, amt, network) {
    var pass = document.getElementById('wd-pass-input')?.value;
    var err  = document.getElementById('wd-pass-err');
    if (!pass) { if(err){err.textContent='Enter withdrawal password';err.style.display='block';} return; }
    try {
      // Step 1 — password verify + server sends OTP
      const r = await API.req('POST','/wallet/withdraw',{amount:amt,walletAddress:addr,network,withdrawalPassword:pass});
      if (r && r.requireOtp) {
        document.getElementById('qx-wd-confirm-modal')?.remove();
        showOTPModal({
          title: 'Confirm Withdrawal',
          subtitle: 'OTP sent to your email. Valid 3 min.',
          onVerify: async (otp) => {
            await API.req('POST','/wallet/withdraw',{amount:amt,walletAddress:addr,network,withdrawalPassword:pass,otp});
            document.getElementById('qx-otp-modal')?.remove();
            showToast('✅ Withdrawal submitted! Processing in 1–24h.','success');
            _histCache=[];
            const dash = await API.User.dashboard().catch(()=>null);
            if(dash){ API.setUser({...API.getUser(),...dash.data.user}); updateUIWithUser(dash.data.user); }
          },
          onResend: async () => {
            await API.req('POST','/wallet/withdraw',{amount:amt,walletAddress:addr,network,withdrawalPassword:pass});
          }
        });
      }
    } catch(e) {
      if(err){err.textContent=e.message||'Failed';err.style.display='block';}
    }
  }

  // ── Password Change with OTP ─────────────────────────
  function openChangePassModal() {
    var overlay = document.createElement('div');
    overlay.className = 'qx-overlay';
    overlay.id = 'qx-chpass-modal';
    overlay.innerHTML = `
      <div class="qx-modal" style="max-width:420px">
        <div class="qx-modal-handle"></div>
        <div class="qx-modal-head">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="qx-modal-icon-wrap" style="background:rgba(201,162,39,.12)">🔒</div>
            <div class="qx-modal-title">Change Password</div>
          </div>
          <button class="qx-modal-close" onclick="document.getElementById('qx-chpass-modal').remove()">✕</button>
        </div>
        <div style="padding:0 1.2rem 1.4rem;display:flex;flex-direction:column;gap:10px">
          <div style="font-size:12px;color:var(--muted);line-height:1.6">Enter your new password. An OTP will be sent to your registered email to confirm.</div>
          <input id="cp-new" type="password" placeholder="New Password (min 8 chars)"
            style="width:100%;padding:12px 14px;border-radius:11px;border:1.5px solid var(--border);
            background:var(--bg);color:var(--black);font-size:14px;font-family:inherit;outline:none;
            transition:border-color .2s;box-sizing:border-box"
            onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"/>
          <input id="cp-confirm" type="password" placeholder="Confirm New Password"
            style="width:100%;padding:12px 14px;border-radius:11px;border:1.5px solid var(--border);
            background:var(--bg);color:var(--black);font-size:14px;font-family:inherit;outline:none;
            transition:border-color .2s;box-sizing:border-box"
            onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"/>
          <div id="cp-err" style="font-size:12px;color:#dc2626;display:none"></div>
          <button onclick="submitChangePass()" style="width:100%;padding:13px;border-radius:12px;
            background:var(--black);color:var(--gold);border:none;font-size:14px;font-weight:800;
            cursor:pointer;font-family:inherit;transition:all .2s">Send OTP</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e=>{ if(e.target===overlay) overlay.remove(); });
  }

  async function submitChangePass() {
    var np = document.getElementById('cp-new')?.value;
    var nc = document.getElementById('cp-confirm')?.value;
    var er = document.getElementById('cp-err');
    if (!np || np.length < 8) { if(er){er.textContent='Min 8 characters';er.style.display='block';} return; }
    if (np !== nc) { if(er){er.textContent='Passwords do not match';er.style.display='block';} return; }
    try {
      // Step 1: Request OTP
      const r = await API.req('POST', '/user/change-password', { newPassword: np });
      if (r && r.requireOtp) {
        document.getElementById('qx-chpass-modal')?.remove();
        showOTPModal({
          title: 'Verify Password Change',
          subtitle: 'OTP sent to your email',
          onVerify: async (otp) => {
            // Step 2: Submit with OTP
            await API.req('POST', '/user/change-password', { newPassword: np, otp });
            document.getElementById('qx-otp-modal')?.remove();
            showToast('\u2705 Password changed successfully!','success');
          },
          onResend: async () => {
            await API.req('POST', '/user/change-password', { newPassword: np });
          }
        });
      }
    } catch(err) { showToast(err.message||'Failed','error'); }
  }

  // ── Email Change with OTP ────────────────────────────
  function openChangeEmailModal() {
    var overlay = document.createElement('div');
    overlay.className = 'qx-overlay';
    overlay.id = 'qx-chemail-modal';
    overlay.innerHTML = `
      <div class="qx-modal" style="max-width:420px">
        <div class="qx-modal-handle"></div>
        <div class="qx-modal-head">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="qx-modal-icon-wrap" style="background:rgba(59,130,246,.12)">📧</div>
            <div class="qx-modal-title">Change Email</div>
          </div>
          <button class="qx-modal-close" onclick="document.getElementById('qx-chemail-modal').remove()">✕</button>
        </div>
        <div style="padding:0 1.2rem 1.4rem;display:flex;flex-direction:column;gap:10px">
          <div style="font-size:12px;color:var(--muted);line-height:1.6">Enter your new email. An OTP will be sent to the <strong>new email address</strong> to confirm.</div>
          <input id="ce-new" type="email" placeholder="New Email Address"
            style="width:100%;padding:12px 14px;border-radius:11px;border:1.5px solid var(--border);
            background:var(--bg);color:var(--black);font-size:14px;font-family:inherit;outline:none;
            transition:border-color .2s;box-sizing:border-box"
            onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"/>
          <div id="ce-err" style="font-size:12px;color:#dc2626;display:none"></div>
          <button onclick="submitChangeEmail()" style="width:100%;padding:13px;border-radius:12px;
            background:var(--black);color:var(--gold);border:none;font-size:14px;font-weight:800;
            cursor:pointer;font-family:inherit;transition:all .2s">Send OTP to New Email</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e=>{ if(e.target===overlay) overlay.remove(); });
  }

  async function submitChangeEmail() {
    var ne = document.getElementById('ce-new')?.value.trim();
    var er = document.getElementById('ce-err');
    if (!ne || !ne.includes('@')) { if(er){er.textContent='Enter a valid email';er.style.display='block';} return; }
    try {
      const r = await API.User.changeEmail({ newEmail: ne });
      if (r && r.requireOtp) {
        document.getElementById('qx-chemail-modal')?.remove();
        showOTPModal({
          title: 'Verify New Email',
          subtitle: 'OTP sent to '+ne,
          onVerify: async (otp) => {
            await API.req('POST', '/user/change-email', { newEmail: ne, otp });
            document.getElementById('qx-otp-modal')?.remove();
            showToast('✅ Email updated successfully!','success');
            // Update local user
            var u = API.getUser(); if(u){ u.email=ne; API.setUser(u); }
          },
          onResend: async () => { await API.User.changeEmail({ newEmail: ne }); }
        });
      }
    } catch(err) { showToast(err.message||'Failed','error'); }
  }

  // Deposit
  function confirmDeposit() {
    openModal({
      icon:'💰', iconBg:'rgba(34,197,94,.1)',
      title:'Deposit USDT',
      body:'Send USDT to the address below. Your balance will update after network confirmation.',
      rows:[
        {l:'Network',  v:'BEP20 (BSC)'},
        {l:'Min Deposit', v:'$10 USDT'},
        {l:'Confirm Time',v:'~3 minutes'},
        {l:'Address',  v:'TQn8i…Xk92',     cls:'gold'}
      ],
      confirmText:'I Have Sent — Confirm',
      confirmClass:'qx-btn-green',
      cancelText:'Cancel',
      onConfirm:function(){ showToast('Deposit submitted! Awaiting confirmation.','warning'); }
    });
  }

  // Collect earnings
  function confirmCollect() { collectCommission(); }
  function tmConfirmCollect() { collectCommission(); }

  // Logout
  function confirmLogout() {
    var u = API.getUser() || {};
    var name = u.name || 'User';
    var uid  = u.referralCode || u.uid || '—';
    openModal({
      icon:'🚪', iconBg:'rgba(239,68,68,.1)',
      title:'Logout',
      body:'Are you sure you want to logout from QAVIX GLOBAL?',
      rows:[{l:'Account',v:name},{l:'UID',v:uid}],
      warn:'You will need to login again to access your dashboard.',
      confirmText:'Yes, Logout',
      confirmClass:'qx-btn-red',
      onConfirm: async function(){
        try { await API.req('POST','/auth/logout',{refreshToken:localStorage.getItem('qvx_refresh')}); } catch(e){}
        localStorage.removeItem('qvx_token');
        localStorage.removeItem('qvx_refresh');
        localStorage.removeItem('qvx_user');
        showToast('Logged out successfully.','success');
        setTimeout(function(){ showPage('login'); location.reload(); },600);
      }
    });
  }

  // Switch account
  function confirmSwitch() {
    openModal({
      icon:'🔄', iconBg:'rgba(59,130,246,.1)',
      title:'Switch Account',
      body:'Switch to a different QAVIX GLOBAL account on this device.',
      rows:[{l:'Current',v:(API.getUser()||{}).name||'User'},{l:'Action',v:'Switch / Add account'}],
      confirmText:'Switch Account',
      confirmClass:'qx-btn-black',
      onConfirm:function(){ showToast('Redirecting to account selection…',''); }
    });
  }

  // Create account
  function confirmNewAccount() {
    openModal({
      icon:'✨', iconBg:'rgba(34,197,94,.1)',
      title:'Create New Account',
      body:'You will be redirected to the registration page to create a new QAVIX GLOBAL account.',
      rows:[{l:'Referral Code',v:'Optional'},{l:'Bonus',v:'+$5.00 welcome',cls:'gold'}],
      confirmText:'Continue to Register',
      confirmClass:'qx-btn-green',
      onConfirm:function(){ showToast('Opening registration page…',''); }
    });
  }

  // Upgrade membership — go directly to plans
  function confirmUpgrade() {
    showPage('plans');
  }

  // Reward claim
  function confirmClaimReward(name, amt) {
    openModal({
      icon:'🎁', iconBg:'rgba(201,162,39,.12)',
      title:'Claim Reward',
      body:'You are about to claim your <strong>'+name+'</strong> reward.',
      rows:[
        {l:'Reward', v:name},
        {l:'Amount', v:amt, cls:'gold'},
        {l:'Credited to', v:'Main Wallet', cls:'green'}
      ],
      confirmText:'Claim '+amt,
      confirmClass:'qx-btn-gold',
      onConfirm:function(){ showToast(amt+' reward claimed! Added to wallet.','success'); }
    });
  }

  // VIP unlock
  function confirmVIPUnlock() {
    openModal({
      icon:'🔓', iconBg:'rgba(139,92,246,.1)',
      title:'Unlock VIP Levels',
      body:'Upgrade to VIP plan to earn commission from 5 additional team levels (L6–L10).',
      rows:[
        {l:'Unlock',    v:'Levels 6–10'},
        {l:'Per Level', v:'1% commission',cls:'gold'},
        {l:'Required',  v:'VIP Plan ($500+)'}
      ],
      confirmText:'Activate VIP Plan',
      confirmClass:'qx-btn-black',
      onConfirm:function(){ showToast('Redirecting to VIP plan…',''); setTimeout(function(){showPage('plans');},500); }
    });
  }

  // Team collect (from Team page)
  function tmConfirmCollect() { confirmCollect(); }


</script>

<!-- ══ QAVIX API CLIENT ══════════════════════════════════════════════════ -->
<script>
const API = (() => {
  const BASE = 'https://qavix-global-axeo.onrender.com/api';

  const getToken   = () => localStorage.getItem('qvx_token');
  const setToken   = (t) => localStorage.setItem('qvx_token', t);
  const setRefresh = (t) => localStorage.setItem('qvx_refresh', t);
  const getRefresh = () => localStorage.getItem('qvx_refresh');
  const clearAuth  = () => {
    localStorage.removeItem('qvx_token');
    localStorage.removeItem('qvx_refresh');
    localStorage.removeItem('qvx_user');
  };
  const setUser    = (u) => localStorage.setItem('qvx_user', JSON.stringify(u));
  const getUser    = () => { try { return JSON.parse(localStorage.getItem('qvx_user')||'null'); } catch(e){return null;} };

  // Wake server on page load to avoid sleep delay
  fetch(BASE+'/health',{method:'GET'}).catch(()=>{});

  const req = async (method, path, body, retry=true) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 65000); // 65s — longer than Render's 50s wakeup

    const opts = { method, headers: {'Content-Type':'application/json'}, signal: controller.signal };
    const token = getToken();
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (body)  opts.body = JSON.stringify(body);

    try {
      let res = await fetch(BASE + path, opts);
      clearTimeout(timer);

      // Auto-refresh on 401
      if (res.status === 401 && retry && getRefresh()) {
        const ref = await fetch(BASE + '/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: getRefresh() })
        });
        if (ref.ok) {
          const d = await ref.json();
          setToken(d.data.accessToken);
          opts.headers['Authorization'] = 'Bearer ' + d.data.accessToken;
          delete opts.signal;
          res = await fetch(BASE + path, opts);
        } else {
          clearAuth();
          showToast('Session expired. Please login.', 'error');
          return null;
        }
      }
      const data = await res.json();
      if (!data.success && !data.requireOtp) throw new Error(data.message || 'Request failed');
      return data;
    } catch(e) {
      clearTimeout(timer);
      if (e.name === 'AbortError') throw new Error('Connection timeout. Please try again.');
      throw e;
    }
  };

  const get   = (p)    => req('GET',   p);
  const post  = (p, b) => req('POST',  p, b);
  const put   = (p, b) => req('PUT',   p, b);
  const patch = (p, b) => req('PATCH', p, b);

  const Auth = {
    register: (d)           => post('/auth/register', d),
    login: async (email, password) => {
      const r = await post('/auth/login', { email, password });
      if (r) { setToken(r.data.accessToken); setRefresh(r.data.refreshToken); setUser(r.data.user); }
      return r;
    },
    logout: async () => {
      await post('/auth/logout', { refreshToken: getRefresh() }).catch(()=>{});
      clearAuth();
    },
    me:        () => get('/auth/me'),
    isLoggedIn:() => !!getToken(),
  };

  const User = {
    dashboard:     ()  => get('/user/dashboard'),
    profile:       ()  => get('/user/profile'),
    updateProfile: (d) => put('/user/profile', d),
    changePass:    (d) => post('/user/change-password', d),
    changeEmail:   (d) => post('/user/change-email', d),
    updateWallet:  (d) => put('/user/wallet-address', d),
  };

  const Plans = {
    getAll:   ()          => get('/plans'),
    getMine:  ()          => get('/plans/mine'),
    purchase: (planId, amount) => post('/plans/purchase', { planId, amount }),
  };

  const Wallet = {
    balance:      ()                        => get('/wallet/balance'),
    transactions: (type, limit)             => get(`/wallet/transactions?type=${type||''}&limit=${limit||50}`),
    deposit:      (amount, network, txHash) => post('/wallet/deposit',  { amount, network, txHash }),
    withdraw:     (amount, addr, network)   => post('/wallet/withdraw', { amount, walletAddress: addr, network }),
  };

  const Referral = {
    info:    () => get('/referral/info'),
    team:    () => get('/referral/team'),
    earnings:() => get('/referral/earnings'),
    collect: () => post('/referral/collect'),
  };

  const Notifs = {
    getAll:     ()   => get('/notifications'),
    markRead:   (id) => patch(`/notifications/${id}/read`),
    markAllRead:()   => patch('/notifications/read-all'),
  };

  const Rewards = {
    status:        ()   => get('/rewards/status'),
    claim:         (id) => post('/rewards/claim', { rewardId: id }),
    checkIn:       ()   => post('/rewards/checkin'),
    checkinStatus: ()   => get('/rewards/checkin-status'),
    lucky:         ()   => post('/rewards/lucky'),
  };

  const Stats = {
    platform:    () => get('/stats/platform'),
    leaderboard: () => get('/stats/leaderboard'),
  };

  // Call wrapper — handles toast + error automatically
  const call = async (fn, successMsg) => {
    try {
      const res = await fn();
      if (res && successMsg) showToast(successMsg, 'success');
      return res;
    } catch (err) {
      showToast(err.message || 'Something went wrong', 'error');
      return null;
    }
  };

  return { Auth, User, Plans, Wallet, Referral, Notifs, Rewards, Stats, call, getUser, setUser, req };
})();

// ── Update all UI elements with real user data ───────────────────────────
function getMembershipInfo(user) {
  const hasActive = user.activeInvestments && user.activeInvestments.length > 0;

  // No active plan = Free Member regardless of deposit history
  if (!hasActive) return { dot:'🟢', text:'Free Member', vipPct:0, next:'Bronze', required:'$25 USDT', vipFill:0 };

  // Use current active investment amount
  const activeAmount = user.activeInvestments.reduce((s, inv) => s + parseFloat(inv.amount || 0), 0);

  if (activeAmount < 21)   return { dot:'🟡', text:'Premium Member · Bronze',  vipPct:Math.round((activeAmount/21)*100),   next:'Silver',  required:'$21 USDT',   vipFill:Math.round((activeAmount/21)*100) };
  if (activeAmount < 101)  return { dot:'🟠', text:'Premium Member · Silver',  vipPct:Math.round((activeAmount/101)*100),  next:'Gold',    required:'$101 USDT',  vipFill:Math.round((activeAmount/101)*100) };
  if (activeAmount < 301)  return { dot:'🟣', text:'Premium Member · Gold',    vipPct:Math.round((activeAmount/301)*100),  next:'Elite',   required:'$301 USDT',  vipFill:Math.round((activeAmount/301)*100) };
  return { dot:'🔴', text:'Premium Member · Elite', vipPct:100, next:'Elite', required:'Max Level', vipFill:100 };
}

function updateUIWithUser(u) {
  if (!u) return;
  const initials = u.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  const refCode  = u.referralCode || u.referral_code || '';
  const uid      = u.uid || '';
  const email    = u.email || '';
  const bal      = parseFloat(u.balance||0).toFixed(2);
  const mem      = getMembershipInfo(u);

  // Avatar initials — header, profile, team tree
  document.querySelectorAll('.hdr-av-circle, .pf-av, .tm-tree-av').forEach(el => { el.textContent = initials; });

  // ── NEW HERO elements ──
  const phName = document.getElementById('ph-username');
  if (phName) phName.textContent = u.name;

  // Hero UID
  const phHeroUID = document.getElementById('ph-hero-uid');
  if (phHeroUID) phHeroUID.textContent = uid || '—';

  // New portfolio hero balance
  const phBalance = document.getElementById('ph-balance');
  if (phBalance) phBalance.textContent = '$' + bal;
  const phBalUsdt2 = document.getElementById('ph-balance-usdt');
  if (phBalUsdt2) phBalUsdt2.textContent = '≈ ' + bal + ' USDT';

  // Legacy balance elements (keep for any leftover refs)
  const phBal = document.getElementById('ph-bal-num');
  if (phBal) phBal.textContent = '$' + bal;

  const phBalUsdt = document.getElementById('ph-bal-usdt');
  if (phBalUsdt) phBalUsdt.textContent = '≈ ' + bal + ' USDT';

  // Update wallet and withdrawal pass badges
  const walletTag = document.getElementById('pf-wallet-tag');
  const walletSub = document.getElementById('pf-wallet-sub');
  const wdPassTag = document.getElementById('pf-wdpass-tag');
  const wdPassSub = document.getElementById('pf-wdpass-sub');
  const emailSub  = document.getElementById('pf-email-sub');
  if (emailSub && u.email) emailSub.textContent = u.email;
  const addr = u.walletAddress || u.wallet_address;
  if (walletTag) {
    if (addr) {
      walletTag.textContent='Linked'; walletTag.style.background='rgba(34,197,94,.1)'; walletTag.style.color='#16a34a';
      if(walletSub) walletSub.textContent='BEP20 · '+addr.slice(0,6)+'…'+addr.slice(-4);
    } else {
      walletTag.textContent='Unlinked'; walletTag.style.background='rgba(239,68,68,.1)'; walletTag.style.color='#dc2626';
    }
  }
  if (wdPassTag) {
    if (u.hasWithdrawalPass||u.withdrawalPass||u.withdrawal_pass) {
      wdPassTag.textContent='Set'; wdPassTag.style.background='rgba(34,197,94,.1)'; wdPassTag.style.color='#16a34a';
      if(wdPassSub) wdPassSub.textContent='Tap to change withdrawal password';
    }
  }
  // Load dynamic data
  loadNotifications();
  loadWalletTransactions();
  const phMemDot  = document.getElementById('ph-mem-dot');
  const phMemText = document.getElementById('ph-mem-text');
  const phMemBadge = document.getElementById('ph-mem-badge');
  if (phMemDot)  phMemDot.textContent  = '●';
  if (phMemText) phMemText.textContent = mem.text;
  // Dynamic badge color based on level
  if (phMemBadge) {
    const isFree = mem.text === 'Free Member';
    phMemBadge.style.background = isFree ? 'rgba(119,119,119,.12)' : 'rgba(201,162,39,.12)';
    phMemBadge.style.borderColor = isFree ? 'rgba(119,119,119,.2)' : 'rgba(201,162,39,.25)';
    phMemBadge.style.color = isFree ? '#777' : 'var(--gold)';
    if (phMemDot) phMemDot.style.color = isFree ? '#777' : 'var(--gold)';
  }

  // VIP progress
  const vipFill = document.getElementById('ph-vip-fill');
  const vipPct  = document.getElementById('ph-vip-pct');
  if (vipFill) vipFill.style.width = mem.vipFill + '%';
  if (vipPct)  vipPct.textContent  = mem.vipFill + '%';

  // Balance sub-items
  const phTotalDep = document.getElementById('ph-total-dep');
  if (phTotalDep) phTotalDep.textContent = '$' + parseFloat(u.totalDeposited||u.total_deposited||0).toFixed(0);

  // OLD welcome name (kept for compatibility)
  const nameEl = document.querySelector('.hd-welcome-name');
  if (nameEl) nameEl.textContent = u.name;

  // Wallet page balance — new IDs
  const walBalDisplay = document.getElementById('wallet-bal-display');
  if (walBalDisplay) walBalDisplay.textContent = '$' + bal;
  const walBalUsdt = document.getElementById('wallet-bal-usdt');
  if (walBalUsdt) walBalUsdt.textContent = '≈ ' + bal + ' USDT';
  // Legacy selectors
  const walBal = document.querySelector('.wallet-bal-num');
  if (walBal) walBal.textContent = '$' + bal;
  const walUsdt = document.querySelector('.wallet-bal-usdt');
  if (walUsdt) walUsdt.textContent = '≈ ' + bal + ' USDT';

  // Profile page
  const pfName = document.querySelector('.pf-name');
  if (pfName) pfName.textContent = u.name;
  const pfEmail = document.querySelector('.pf-email');
  if (pfEmail) pfEmail.textContent = email;
  const pfUidVal = document.querySelector('.pf-uid-val');
  if (pfUidVal) pfUidVal.textContent = uid;

  // Profile membership badge & level
  const pfLevelBadge = document.getElementById('pf-mem-level-badge');
  if (pfLevelBadge) pfLevelBadge.textContent = mem.dot + ' ' + mem.text;
  const pfLevelText = document.getElementById('pf-mem-level-text');
  if (pfLevelText) pfLevelText.textContent = mem.text.split('·')[1]?.trim().toUpperCase() || 'FREE';

  // Update badge label
  const pfBadgeLabel = document.getElementById('pf-mem-badge-label');
  if (pfBadgeLabel) {
    const isFree = mem.text === 'Free Member';
    const svg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    pfBadgeLabel.innerHTML = svg + (isFree ? ' FREE MEMBERSHIP' : ' PREMIUM MEMBERSHIP');
  }

  // Profile stats — active investment amount only
  const activeInvs = u.activeInvestments || [];
  const activeAmount = activeInvs.reduce((s, inv) => s + parseFloat(inv.amount || 0), 0);
  const joinDate = u.createdAt || u.created_at;
  if (joinDate) {
    const days = Math.floor((Date.now() - new Date(joinDate)) / 86400000);
    const el = document.getElementById('pf-stat-days');
    if (el) el.textContent = days;
    const sinceEl = document.getElementById('pf-mem-since');
    if (sinceEl) sinceEl.textContent = new Date(joinDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  }
  const piEl = document.getElementById('pf-stat-invested');
  if (piEl) piEl.textContent = activeAmount > 0 ? '$' + activeAmount.toFixed(0) : '$0';
  const prEl = document.getElementById('pf-stat-refs');
  if (prEl) {
    const tok = localStorage.getItem('qvx_token');
    if (tok) {
      fetch('https://qavix-global-axeo.onrender.com/api/team/levels', {
        headers: { Authorization: 'Bearer ' + tok }
      }).then(r => r.json()).then(res => {
        try {
          const levels = (res && res.data && res.data.levels) ? res.data.levels : [];
          const l1 = levels.find(l => l.level === 1);
          prEl.textContent = l1 ? (l1.count || (l1.members||[]).length || 0) : '0';
        } catch(e) { prEl.textContent = '0'; }
      }).catch(() => { prEl.textContent = '0'; });
    } else { prEl.textContent = '0'; }
  }

  // Team tree
  const treeYouLbl = document.querySelector('.tm-tree-you-lbl');
  if (treeYouLbl) treeYouLbl.textContent = u.name.split(' ')[0] + ' (You)';

  // Referral code & link
  const refCodeEl = document.querySelector('.tm-ref-val:not(.mono)');
  if (refCodeEl && refCode) refCodeEl.textContent = refCode;
  const refLinkEl = document.querySelector('.tm-ref-val.mono');
  if (refLinkEl && refCode) refLinkEl.textContent = 'https://qavixglobal.pages.dev/?ref=' + refCode;

  // UID copy
  const uidCopyBtn = document.querySelector('.pf-uid-copy');
  if (uidCopyBtn) uidCopyBtn.onclick = function() {
    navigator.clipboard && navigator.clipboard.writeText(uid);
    this.textContent = '✓';
    setTimeout(()=>{ this.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'; }, 1500);
  };

  window._currentUserName = u.name;
  window._currentUserUID  = uid;
}

function togglePassGlass(id, btn) {
  var inp = document.getElementById(id);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? '👁' : '🙈';
}
function togglePass(id, btn) { togglePassGlass(id, btn); }

function showGlassErr(id, msg) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg; el.classList.add('show');
  var wrap = el.closest('.glass-field');
  var inp  = wrap ? wrap.querySelector('.glass-input') : null;
  if (inp) inp.classList.add('error');
}
function clearGlassErrs() {
  document.querySelectorAll('.glass-err,.auth-error').forEach(function(el){ el.textContent=''; el.classList.remove('show'); });
  document.querySelectorAll('.glass-gen-err').forEach(function(el){ el.textContent=''; el.classList.remove('show'); });
  document.querySelectorAll('.glass-input.error,.auth-input.error').forEach(function(el){ el.classList.remove('error'); });
}
function showFieldErr(id, msg) { showGlassErr(id, msg); }
function clearAllErrors()      { clearGlassErrs(); }

function checkGlassStrength(val) {
  var wrap = document.getElementById('glass-strength-wrap');
  var bar  = document.getElementById('glass-strength-bar');
  var lbl  = document.getElementById('glass-strength-lbl');
  if (!wrap) return;
  wrap.style.display = val.length > 0 ? 'block' : 'none';
  var s = 0;
  if (val.length >= 8)          s++;
  if (/[A-Z]/.test(val))        s++;
  if (/[0-9]/.test(val))        s++;
  if (/[^A-Za-z0-9]/.test(val)) s++;
  var cfg = [{w:'25%',c:'#ef4444',t:'Weak'},{w:'50%',c:'#f97316',t:'Fair'},{w:'75%',c:'#eab308',t:'Good'},{w:'100%',c:'#22c55e',t:'Strong'}];
  var c = cfg[s-1] || cfg[0];
  bar.style.width = c.w; bar.style.background = c.c;
  lbl.textContent = c.t; lbl.style.color = c.c;
}
function checkPassStrength(val) { checkGlassStrength(val); }

// ══════════════════════════════════════════
//  FORGOT PASSWORD FLOW
// ══════════════════════════════════════════
function openForgotPassModal() {
  var ex = document.getElementById('qx-forgot-modal');
  if (ex) ex.remove();
  var overlay = document.createElement('div');
  overlay.className = 'qx-overlay';
  overlay.id = 'qx-forgot-modal';
  overlay.innerHTML = `
    <div class="qx-modal" style="max-width:420px">
      <div class="qx-modal-handle"></div>
      <div class="qx-modal-head">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="qx-modal-icon-wrap" style="background:rgba(201,162,39,.12);font-size:20px">🔓</div>
          <div>
            <div class="qx-modal-title">Forgot Password</div>
            <div style="font-size:11px;color:var(--muted);margin-top:1px">Reset via email OTP</div>
          </div>
        </div>
        <button class="qx-modal-close" onclick="document.getElementById('qx-forgot-modal').remove()">✕</button>
      </div>
      <div style="padding:0 1.2rem 1.4rem;display:flex;flex-direction:column;gap:10px">
        <div style="font-size:12px;color:var(--muted);line-height:1.6">Enter your registered email. We'll send an OTP to reset your password.</div>
        <input id="fp-email" type="email" placeholder="Your registered email"
          style="width:100%;padding:12px 14px;border-radius:11px;border:1.5px solid var(--border);
          background:var(--bg);color:var(--black);font-size:14px;font-family:inherit;outline:none;
          transition:border-color .2s;box-sizing:border-box"
          onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"/>
        <div id="fp-err" style="font-size:12px;color:#dc2626;display:none"></div>
        <button onclick="submitForgotPass()" id="fp-btn"
          style="width:100%;padding:13px;border-radius:12px;background:var(--black);color:var(--gold);
          border:none;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;transition:all .2s">
          Send OTP
        </button>
      </div>
    </div>`;
  overlay.addEventListener('click', e=>{ if(e.target===overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  setTimeout(()=>{ var f=document.getElementById('fp-email'); if(f) f.focus(); }, 200);
}

async function submitForgotPass() {
  var email = document.getElementById('fp-email')?.value.trim();
  var err   = document.getElementById('fp-err');
  var btn   = document.getElementById('fp-btn');
  if (!email || !email.includes('@')) {
    if(err){err.textContent='Enter a valid email';err.style.display='block';} return;
  }
  if(btn){btn.disabled=true;btn.textContent='Sending...';}
  try {
    await fetch(BASE+'/auth/forgot-password',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email})
    });
    document.getElementById('qx-forgot-modal')?.remove();
    // Show OTP + new password modal
    showOTPModal({
      title: 'Reset Your Password',
      subtitle: 'OTP sent to '+email,
      onVerify: async (otp) => {
        // Ask for new password
        var np = prompt('Enter your new password (min 8 characters):');
        if (!np || np.length < 8) { throw new Error('Password must be at least 8 characters'); }
        var res = await fetch(BASE+'/auth/reset-password',{
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({email, otp, newPassword:np})
        });
        var data = await res.json();
        if (!data.success) throw new Error(data.message||'Reset failed');
        document.getElementById('qx-otp-modal')?.remove();
        showToast('✅ Password reset! Please login.','success');
      },
      onResend: async () => {
        await fetch(BASE+'/auth/forgot-password',{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({email})
        });
      }
    });
  } catch(e) {
    if(btn){btn.disabled=false;btn.textContent='Send OTP';}
    if(err){err.textContent=e.message||'Failed';err.style.display='block';}
  }
}
function showOTPModal({ title, subtitle, onVerify, onResend, expiryMin }) {
  // Remove existing
  var ex = document.getElementById('qx-otp-modal');
  if (ex) ex.remove();

  var overlay = document.createElement('div');
  overlay.className = 'qx-overlay';
  overlay.id = 'qx-otp-modal';
  overlay.innerHTML = `
    <div class="qx-modal" style="max-width:420px">
      <div class="qx-modal-handle"></div>
      <div class="qx-modal-head">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="qx-modal-icon-wrap" style="background:rgba(201,162,39,.12);font-size:22px">🔐</div>
          <div>
            <div class="qx-modal-title">${title}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:1px">${subtitle}</div>
          </div>
        </div>
        <button class="qx-modal-close" onclick="document.getElementById('qx-otp-modal').remove()">✕</button>
      </div>
      <div style="padding:0 1.2rem 1.4rem">
        <div style="font-size:12px;color:var(--muted);margin-bottom:14px;line-height:1.6">
          Enter the 6-digit OTP sent to your email. It expires in <strong style="color:var(--gold)">${expiryMin || 5} minutes</strong>.
        </div>
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:18px" id="otp-boxes">
          ${[0,1,2,3,4,5].map(i=>`<input id="otp-d${i}" maxlength="1" inputmode="numeric"
            style="width:44px;height:52px;text-align:center;font-size:22px;font-weight:800;
            border-radius:12px;border:2px solid var(--border);background:var(--bg);
            color:var(--black);font-family:inherit;outline:none;transition:border-color .2s"
            oninput="otpBoxInput(this,${i})" onkeydown="otpBoxKey(event,${i})"
            onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'"
          />`).join('')}
        </div>
        <div id="otp-err" style="font-size:12px;color:#dc2626;text-align:center;margin-bottom:10px;display:none"></div>
        <button id="otp-submit-btn" onclick="submitOTP()" style="width:100%;padding:13px;border-radius:12px;
          background:var(--black);color:var(--gold);border:none;font-size:14px;font-weight:800;
          cursor:pointer;font-family:inherit;transition:all .2s;letter-spacing:.02em">
          Verify OTP
        </button>
        <div style="text-align:center;margin-top:14px">
          <span style="font-size:12px;color:var(--muted)">Didn't receive? </span>
          <button onclick="resendOTP()" style="background:none;border:none;color:var(--gold);
            font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">Resend OTP</button>
        </div>
      </div>
    </div>`;

  window._otpOnVerify = onVerify;
  window._otpOnResend = onResend;
  document.body.appendChild(overlay);
  setTimeout(()=>{ var f=document.getElementById('otp-d0'); if(f) f.focus(); }, 200);
}

function otpBoxInput(el, idx) {
  el.value = el.value.replace(/\D/g,'').slice(-1);
  if (el.value && idx < 5) {
    var next = document.getElementById('otp-d'+(idx+1));
    if (next) next.focus();
  }
  if (idx === 5 && el.value) submitOTP();
}

function otpBoxKey(e, idx) {
  if (e.key === 'Backspace' && !e.target.value && idx > 0) {
    var prev = document.getElementById('otp-d'+(idx-1));
    if (prev) { prev.value=''; prev.focus(); }
  }
}

function getOTPValue() {
  return [0,1,2,3,4,5].map(i=>{ var el=document.getElementById('otp-d'+i); return el?el.value:''; }).join('');
}

async function submitOTP() {
  var code = getOTPValue();
  if (code.length !== 6) { showOTPErr('Please enter all 6 digits'); return; }
  var btn = document.getElementById('otp-submit-btn');
  if (btn) { btn.disabled=true; btn.textContent='Verifying...'; }
  try {
    await window._otpOnVerify(code);
  } catch(e) {
    showOTPErr(e.message || 'Invalid OTP');
    if (btn) { btn.disabled=false; btn.textContent='Verify OTP'; }
  }
}

function showOTPErr(msg) {
  var el = document.getElementById('otp-err');
  if (el) { el.textContent=msg; el.style.display='block'; }
  [0,1,2,3,4,5].forEach(i=>{ var b=document.getElementById('otp-d'+i); if(b) b.style.borderColor='#dc2626'; });
}

async function resendOTP() {
  try {
    await window._otpOnResend();
    showToast('OTP resent to your email','success');
    [0,1,2,3,4,5].forEach(i=>{ var b=document.getElementById('otp-d'+i); if(b){b.value='';b.style.borderColor='var(--border)';} });
    var e=document.getElementById('otp-err'); if(e) e.style.display='none';
    var f=document.getElementById('otp-d0'); if(f) f.focus();
  } catch(err) { showToast(err.message||'Failed to resend','error'); }
}

// ══════════════════════════════════════════
//  LOGIN WITH 2FA
// ══════════════════════════════════════════
var _loginEmail = '', _loginPass = '';

async function doLogin(e) {
  e.preventDefault(); clearGlassErrs();
  var email = document.getElementById('login-email').value.trim();
  var pass  = document.getElementById('login-pass').value;
  var btn   = document.getElementById('login-btn');
  var errEl = document.getElementById('login-general-err');
  if (!email) { showGlassErr('login-email-err','Email is required'); return; }
  if (!pass)  { showGlassErr('login-pass-err', 'Password is required'); return; }

  btn.disabled=true; btn.classList.add('loading'); btn.textContent='';
  const _wakeTimer = setTimeout(()=>{
    btn.classList.remove('loading');
    btn.textContent='⏳ Server starting up...';
  }, 15000);
  try {
    const res = await API.req('POST', '/auth/login', { email, password: pass });
    clearTimeout(_wakeTimer);
    btn.disabled=false; btn.classList.remove('loading'); btn.textContent='Sign In to Dashboard';

    if (res && res.requireOtp) {
      _loginEmail = email; _loginPass = pass;
      showOTPModal({
        title: 'Verify Your Login',
        subtitle: 'OTP sent to your registered email',
        onVerify: async (otp) => {
          const r = await API.req('POST', '/auth/login', { email: _loginEmail, password: _loginPass, otp });
          if (r && r.data) {
            localStorage.setItem('qvx_token', r.data.accessToken);
            localStorage.setItem('qvx_refresh', r.data.refreshToken);
            API.setUser(r.data.user);
            document.getElementById('qx-otp-modal')?.remove();
            updateUIWithUser(r.data.user);
            showToast('Welcome back, '+r.data.user.name+'! 👋','success');
            setTimeout(()=>showPage('home'), 400);
          }
        },
        onResend: async () => {
          await API.req('POST', '/auth/login', { email: _loginEmail, password: _loginPass });
        }
      });
    } else if (res && res.data) {
      localStorage.setItem('qvx_token', res.data.accessToken);
      localStorage.setItem('qvx_refresh', res.data.refreshToken);
      API.setUser(res.data.user);
      updateUIWithUser(res.data.user);
      showToast('Welcome back, '+res.data.user.name+'! 👋','success');
      setTimeout(()=>showPage('home'), 400);
    }
  } catch(err) {
    clearTimeout(_wakeTimer);
    btn.disabled=false; btn.classList.remove('loading'); btn.textContent='Sign In to Dashboard';
    if (err.message && err.message.includes('timeout')) {
      errEl.textContent='Server was sleeping. Retrying...'; errEl.classList.add('show');
      setTimeout(()=>doLogin({preventDefault:()=>{}}), 1500);
      return;
    }
    errEl.textContent=err.message||'Login failed'; errEl.classList.add('show');
  }
}

async function doRegister(e) {
  e.preventDefault(); clearGlassErrs();
  var name  = document.getElementById('reg-name').value.trim();
  var email = document.getElementById('reg-email').value.trim();
  var phone = document.getElementById('reg-phone').value.trim();
  var pass  = document.getElementById('reg-pass').value;
  var ref   = document.getElementById('reg-ref').value.trim();
  var terms = document.getElementById('reg-terms').checked;
  var btn   = document.getElementById('reg-btn');
  var errEl = document.getElementById('reg-general-err');
  var ok=true;
  if (!name)           { showGlassErr('reg-name-err','Full name required'); ok=false; }
  if (!email)          { showGlassErr('reg-email-err','Email required');    ok=false; }
  if (pass.length < 8) { showGlassErr('reg-pass-err','Min 8 characters');  ok=false; }
  if (!ref)            { showGlassErr('reg-ref-err','Referral code is required'); ok=false; }
  if (!terms)          { showToast('Please accept the terms','error');       ok=false; }
  if (!ok) return;

  btn.disabled=true; btn.classList.add('loading'); btn.textContent='';
  try {
    // Step 1 — send OTP
    const res = await API.req('POST', '/auth/register/send-otp', {name,email,password:pass,phone,referralCode:ref});
    btn.disabled=false; btn.classList.remove('loading'); btn.textContent='Create My Account';
    if (res && res.requireOtp) {
      showOTPModal({
        title: 'Verify Your Email',
        subtitle: 'OTP sent to ' + email,
        expiryMin: 5,
        onVerify: async (otp) => {
          const r = await API.req('POST', '/auth/register', {email, otp});
          if (r && r.data) {
            localStorage.setItem('qvx_token', r.data.accessToken);
            localStorage.setItem('qvx_refresh', r.data.refreshToken);
            API.setUser(r.data.user);
            sessionStorage.removeItem('qvx_ref');
            document.getElementById('qx-otp-modal')?.remove();
            updateUIWithUser(r.data.user);
            showToast('🎉 Welcome to QAVIX GLOBAL!','success');
            setTimeout(()=>showPage('home'), 400);
          }
        },
        onResend: async () => {
          await API.req('POST', '/auth/register/send-otp', {name,email,password:pass,phone,referralCode:ref});
        }
      });
    }
  } catch(err) {
    btn.disabled=false; btn.classList.remove('loading'); btn.textContent='Create My Account';
    errEl.textContent=err.message||'Registration failed'; errEl.classList.add('show');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Auto-fill referral code from URL — store it, show landing first
  var refCode = new URLSearchParams(window.location.search).get('ref');
  if (refCode) {
    sessionStorage.setItem('qvx_ref', refCode.toUpperCase());
    var ri = document.getElementById('reg-ref');
    if (ri) ri.value = refCode.toUpperCase();
  }
  // Also restore from session if user navigates back
  var storedRef = sessionStorage.getItem('qvx_ref');
  if (storedRef) {
    var ri2 = document.getElementById('reg-ref');
    if (ri2 && !ri2.value) ri2.value = storedRef;
  }

  // Hide all pages cleanly — auth pages need visibility:hidden (they're position:fixed)
  document.querySelectorAll('.page').forEach(function(p){
    p.classList.remove('active');
    if (['page-landing','page-login','page-register'].includes(p.id)) {
      p.style.visibility = 'hidden';
    }
  });

  if (API.Auth.isLoggedIn()) {
    document.body.classList.remove('auth-mode');
    var storedUser = API.getUser();
    if (storedUser) updateUIWithUser(storedUser);
    var hp=document.getElementById('page-home'); if(hp) hp.classList.add('active');
    currentPage='home';
    var nav=document.getElementById('nav-home');
    if (nav) { document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');}); nav.classList.add('active'); }
  } else {
    // Always show landing page first (ref code stored in session)
    document.body.classList.add('auth-mode');
    var lp=document.getElementById('page-landing');
    if (lp) { lp.style.visibility='visible'; lp.classList.add('active'); }
    currentPage='landing';
  }
});
document.addEventListener('DOMContentLoaded', async () => {
  if (!API.Auth.isLoggedIn()) return;
  try {
    const r = await API.User.dashboard();
    if (!r) return;
    const u = { ...r.data.user, balance: r.data.balance, activeInvestments: r.data.activeInvestments || [] };
    API.setUser(u);
    updateUIWithUser(u);

    // My stats section
    const myDeposit   = document.getElementById('my-deposit');
    const myWithdraw  = document.getElementById('my-withdraw');
    const myEarn      = document.getElementById('my-earn');
    const myActive    = document.getElementById('my-active');
    const phTodayP    = document.getElementById('ph-today-profit');
    const phTotalE    = document.getElementById('ph-total-earned');  // new ID
    const phTotalEOld = document.getElementById('ph-total-earn');    // old ID compat
    const ppToday     = document.getElementById('pp-today');
    const ppTotal     = document.getElementById('pp-total');

    if (myDeposit)  myDeposit.textContent  = '$' + parseFloat(u.totalDeposited||0).toFixed(0);
    if (myWithdraw) myWithdraw.textContent = '$' + parseFloat(u.totalWithdrawn||0).toFixed(0);
    if (myActive)   myActive.textContent   = (r.data.activeInvestments||[]).length;

    // Profit from active investments
    const dailyProfit = (r.data.activeInvestments||[]).reduce((s,i)=>s+parseFloat(i.dailyIncome||0),0);
    if (phTodayP) { phTodayP.textContent = '+$' + dailyProfit.toFixed(2); phTodayP.dataset.val = phTodayP.textContent; }
    if (ppToday)  ppToday.textContent  = '+$' + dailyProfit.toFixed(2);

    // Populate active investment card
    const activePlans = r.data.activeInvestments || [];
    if (activePlans.length > 0) {
      const ap = activePlans[0];
      updateActiveInvestmentUI({
        name:       ap.planName || ap.plan_name || 'Active Plan',
        amount:     ap.amount || 0,
        dailyIncome:ap.dailyIncome || ap.daily_income || 0,
        totalDays:  ap.totalDays || ap.total_days || 30,
        daysElapsed:ap.daysElapsed || ap.days_elapsed || 0,
        roi:        ap.roi || '—'
      });
    } else {
      updateActiveInvestmentUI(null);
    }

    // Portfolio performance card
    const pfInvested = document.getElementById('pf-total-invested');
    const pfActive   = document.getElementById('pf-active-count');
    // Show total actively invested (sum of active plan amounts)
    const totalActiveInvested = activePlans.reduce((s,p)=>s+parseFloat(p.amount||0),0);
    if (pfInvested) pfInvested.textContent = '$' + totalActiveInvested.toFixed(2);
    if (pfActive)   pfActive.textContent   = activePlans.length;

    // Portfolio summary — only show live data when there are active plans
    const pfEarned  = document.getElementById('pf-total-earned');
    const pfRoi     = document.getElementById('pf-roi');
    const progFill  = document.getElementById('pf-prog-fill');
    const progLabel = document.getElementById('pf-prog-label');

    if (activePlans.length === 0) {
      // No active plan → everything shows 0
      if (myEarn)     myEarn.textContent     = '$0';
      if (phTotalE)   { phTotalE.textContent  = '$0.00'; phTotalE.dataset.val = '$0.00'; }
      if (phTotalEOld) phTotalEOld.textContent = '$0.00';
      if (ppTotal)    ppTotal.textContent    = '$0.00';
      if (pfEarned)   pfEarned.textContent   = '$0.00';
      if (pfRoi)      pfRoi.textContent      = '0%';
      if (progFill)   progFill.style.width   = '0%';
      if (progLabel)  progLabel.textContent  = '0% earned';
    } else {
      // Has active plans → fetch real profit + commission
      try {
        const txR = await API.Wallet.transactions('profit', 500);
        const txC = await API.Wallet.transactions('commission', 200);
        let totalProfit = 0, totalComm = 0;
        if (txR?.data?.transactions)
          totalProfit = txR.data.transactions.reduce((s,t)=>s+parseFloat(t.amount||0),0);
        if (txC?.data?.transactions)
          totalComm = txC.data.transactions.reduce((s,t)=>s+parseFloat(t.amount||0),0);

        const totalEarned = totalProfit + totalComm;

        if (myEarn)     myEarn.textContent     = '$' + totalEarned.toFixed(0);
        if (phTotalE)   { phTotalE.textContent  = '$' + totalEarned.toFixed(2); phTotalE.dataset.val = phTotalE.textContent; }
        if (phTotalEOld) phTotalEOld.textContent = '$' + totalEarned.toFixed(2);
        if (ppTotal)    ppTotal.textContent    = '$' + totalEarned.toFixed(2);
        if (pfEarned)   pfEarned.textContent   = '$' + totalEarned.toFixed(2);

        // ROI = totalEarned / totalActiveInvested × 100
        if (totalActiveInvested > 0) {
          const roi    = ((totalEarned / totalActiveInvested) * 100).toFixed(1);
          const maxRoi = (activePlans[0]?.daysTotal || 20) * (activePlans[0]?.dailyIncome || 0) / Math.max(1, activePlans[0]?.amount || 1) * 100;
          const pct    = Math.min(100, (parseFloat(roi) / Math.max(maxRoi || 110, 1)) * 100).toFixed(1);
          if (pfRoi)     pfRoi.textContent     = roi + '%';
          if (progFill)  progFill.style.width  = pct + '%';
          if (progLabel) progLabel.textContent = roi + '% earned';
        }
      } catch(e) { console.error('Portfolio earn fetch:', e); }
    }

    // Referral info
    try {
      const refR = await API.Referral.info();
      if (refR) {
        const storedU = API.getUser();
        storedU.referralCode = refR.data.referralCode;
        API.setUser(storedU);
        updateUIWithUser(storedU);
      }
      const teamR = await API.Referral.team();
      if (teamR) {
        const myTeam   = document.getElementById('my-team');
        const myDirect = document.getElementById('my-direct');
        const toTotal  = document.getElementById('to-total');
        const toDirect = document.getElementById('to-direct');
        if (myTeam)   myTeam.textContent   = teamR.data.totalMembers;
        if (myDirect) myDirect.textContent = (teamR.data.levels[0]?.count || 0);
        if (toTotal)  toTotal.textContent  = teamR.data.totalMembers + ' members';
        if (toDirect) toDirect.textContent = (teamR.data.levels[0]?.count || 0) + ' members';
        // Update profile referrals stat
        const prEl = document.getElementById('pf-stat-refs');
        if (prEl) prEl.textContent = teamR.data.levels[0]?.count || 0;
      }
      const earnR = await API.Referral.earnings();
      if (earnR) {
        const toComm   = document.getElementById('to-comm');
        const toIncome = document.getElementById('to-income');
        if (toComm)   toComm.textContent   = '$' + parseFloat(earnR.data.available).toFixed(2);
        if (toIncome) toIncome.textContent = '$' + parseFloat(earnR.data.totalEarned).toFixed(2);
        // Collect button text update
        const collectBtn = document.querySelector('.ph-team-collect');
        if (collectBtn) collectBtn.textContent = '✦ Collect $' + parseFloat(earnR.data.available).toFixed(2) + ' Commission';
      }
    } catch(e) {}

    // Notification badge
    try {
      const notifR = await API.Notifs.getAll();
      if (notifR) {
        const unread = notifR.data.unread;
        const badge  = document.getElementById('hdr-notif-badge');
        const nbadge = document.getElementById('hdr-new-badge');
        if (badge)  { badge.textContent  = unread; badge.style.display  = unread > 0 ? 'flex' : 'none'; }
        if (nbadge) { nbadge.textContent = unread + ' new'; nbadge.style.display = unread > 0 ? 'inline' : 'none'; }
      }
    } catch(e) {}

  } catch(e) { console.warn('Dashboard load:', e.message); }
});

// ── Plan Carousel ────────────────────────────────────────────────────────
(function initPlanCarousel() {
  var carousel = document.getElementById('hd-plan-carousel');
  var wrap     = document.getElementById('hd-plan-carousel-wrap');
  var dots     = document.querySelectorAll('.hd-plan-dot');
  if (!carousel) return;

  var current  = 0;
  var total    = 4;
  var timer    = null;
  var startX   = 0;

  function goTo(idx) {
    current = (idx + total) % total;
    carousel.style.transform = 'translateX(-' + (current * 100) + '%)';
    dots.forEach(function(d,i){ d.classList.toggle('active', i===current); });
  }

  window.hdPlanGoTo = goTo;

  function next() { goTo(current + 1); }

  function startAuto() {
    clearInterval(timer);
    timer = setInterval(next, 3000);
  }

  // Touch swipe support
  carousel.addEventListener('touchstart', function(e){ startX = e.touches[0].clientX; clearInterval(timer); }, {passive:true});
  carousel.addEventListener('touchend', function(e){
    var diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? goTo(current+1) : goTo(current-1);
    startAuto();
  }, {passive:true});

  // Pause on hover (desktop)
  carousel.addEventListener('mouseenter', function(){ clearInterval(timer); });
  carousel.addEventListener('mouseleave', startAuto);

  startAuto();
  goTo(0);
})();

// ════════════════════════════════════════════════════════════════════════
//  GLOBAL SILENT AUTO-REFRESH SYSTEM
//  Refreshes all data in background — user sees nothing
// ════════════════════════════════════════════════════════════════════════
(function startAutoRefresh() {
  if (!API.Auth.isLoggedIn()) return;

  // ── Silent dashboard refresh ─────────────────────────────────────────
  async function silentRefreshDashboard() {
    try {
      const r = await API.User.dashboard().catch(()=>null);
      if (!r || !r.data) return;
      const u = {...r.data.user, balance:r.data.balance, activeInvestments:r.data.activeInvestments||[]};
      API.setUser(u);
      updateUIWithUser(u);

      // Balance elements
      const activePlans = r.data.activeInvestments || [];
      const totalActiveInvested = activePlans.reduce((s,p)=>s+parseFloat(p.amount||0),0);

      const pfInvested = document.getElementById('pf-total-invested');
      const pfActive   = document.getElementById('pf-active-count');
      if (pfInvested) pfInvested.textContent = '$' + totalActiveInvested.toFixed(2);
      if (pfActive)   pfActive.textContent   = activePlans.length;

      // Daily profit
      const dailyProfit = activePlans.reduce((s,i)=>s+parseFloat(i.dailyIncome||0),0);
      const phTodayP = document.getElementById('ph-today-profit');
      const ppToday  = document.getElementById('pp-today');
      if (phTodayP) { phTodayP.textContent = '+$'+dailyProfit.toFixed(2); phTodayP.dataset.val = phTodayP.textContent; }
      if (ppToday)  ppToday.textContent  = '+$'+dailyProfit.toFixed(2);

      // Portfolio earnings
      if (activePlans.length === 0) {
        ['pf-total-earned','ph-total-earned','ph-total-earn','pp-total'].forEach(id=>{
          var el=document.getElementById(id); if(el) el.textContent='$0.00';
        });
        var pfRoi=document.getElementById('pf-roi'); if(pfRoi) pfRoi.textContent='0%';
        var pf=document.getElementById('pf-prog-fill'); if(pf) pf.style.width='0%';
        var pl=document.getElementById('pf-prog-label'); if(pl) pl.textContent='0% earned';
      } else {
        try {
          const [txR, txC] = await Promise.all([
            API.Wallet.transactions('profit',500).catch(()=>null),
            API.Wallet.transactions('commission',200).catch(()=>null)
          ]);
          let totalProfit=0, totalComm=0;
          if(txR?.data?.transactions) totalProfit=txR.data.transactions.reduce((s,t)=>s+parseFloat(t.amount||0),0);
          if(txC?.data?.transactions) totalComm=txC.data.transactions.reduce((s,t)=>s+parseFloat(t.amount||0),0);
          const totalEarned = totalProfit + totalComm;
          const fmt = v => '$'+parseFloat(v).toFixed(2);
          ['ph-total-earned','ph-total-earn','pp-total'].forEach(id=>{
            var el=document.getElementById(id); if(el){ el.textContent=fmt(totalEarned); if(el.dataset) el.dataset.val=fmt(totalEarned); }
          });
          var pfEarned=document.getElementById('pf-total-earned'); if(pfEarned) pfEarned.textContent=fmt(totalEarned);
          if (totalActiveInvested > 0) {
            var roi=((totalEarned/totalActiveInvested)*100).toFixed(1);
            var pfRoi=document.getElementById('pf-roi'); if(pfRoi) pfRoi.textContent=roi+'%';
            var pf=document.getElementById('pf-prog-fill'); if(pf) pf.style.width=Math.min(100,parseFloat(roi))+'%';
            var pl=document.getElementById('pf-prog-label'); if(pl) pl.textContent=roi+'% earned';
          }
        } catch(e){}
      }
    } catch(e){}
  }

  // ── Silent team + commission refresh ────────────────────────────────
  async function silentRefreshTeam() {
    try {
      const [teamR, earnR] = await Promise.all([
        API.Referral.team().catch(()=>null),
        API.Referral.earnings().catch(()=>null)
      ]);

      // Hero stats
      if (teamR?.data) {
        var allM   = (teamR.data.levels||[]).flatMap(lv=>(lv.members||[]));
        var teamSz = teamR.data.totalMembers||0;
        var activeM= allM.filter(m=>m.status==='active').length;
        var set=(id,v)=>{var e=document.getElementById(id);if(e)e.textContent=v;};
        set('tm-stat-team',   teamSz);
        set('tm-stat-active', activeM);
        set('tstat-total',    teamSz);
        set('tstat-active',   activeM);
      }

      // Commission stats
      if (earnR?.data) {
        var e=earnR.data;
        var total=parseFloat(e.totalEarned||0);
        var pending=parseFloat(e.pendingEarnings||0);
        var set=(id,v)=>{var el=document.getElementById(id);if(el)el.textContent=v;};
        set('tm-stat-earned',   '$'+total.toFixed(2));
        set('tm-comm-total',    '$'+total.toFixed(2));
        set('tm-comm-pending',  '$'+pending.toFixed(2));
        set('tm-comm-collected','$'+total.toFixed(2));
        // Collect button
        var cbtn=document.getElementById('tm-collect-btn');
        if(cbtn){
          if(pending<=0){ cbtn.disabled=true; cbtn.style.opacity='.5'; cbtn.textContent='No earnings to collect'; }
          else { cbtn.disabled=false; cbtn.style.opacity='1'; }
        }
        // Home page commission display
        var toComm=document.getElementById('to-comm'); if(toComm) toComm.textContent='$'+parseFloat(e.available||0).toFixed(2);
        var toIncome=document.getElementById('to-income'); if(toIncome) toIncome.textContent='$'+total.toFixed(2);
      }

      // Re-render member list if team tab is active
      if (_teamLoaded) {
        _teamLoaded = false;
        var pg=document.getElementById('page-team');
        if(pg && pg.classList.contains('active')) loadTeamPage();
      }
    } catch(e){}
  }

  // ── Silent wallet refresh ────────────────────────────────────────────
  async function silentRefreshWallet() {
    try {
      const r = await API.Wallet.transactions('',200).catch(()=>null);
      if (!r?.data?.transactions) return;
      var txs = r.data.transactions;
      var dep = txs.filter(t=>t.type==='deposit').reduce((s,t)=>s+parseFloat(t.amount||0),0);
      var wd  = txs.filter(t=>t.type==='withdrawal').reduce((s,t)=>s+parseFloat(t.amount||0),0);
      var sd=document.getElementById('tm-stat-deposit'); if(sd) sd.textContent='$'+dep.toFixed(2);
      var sw=document.getElementById('tm-stat-withdraw'); if(sw) sw.textContent='$'+wd.toFixed(2);
    } catch(e){}
  }

  // ── Notification badge refresh ───────────────────────────────────────
  async function silentRefreshNotifs() {
    try {
      const r = await API.Notifs.getAll().catch(()=>null);
      if (!r?.data) return;
      var unread = r.data.unread;
      var badge  = document.getElementById('hdr-notif-badge');
      var nbadge = document.getElementById('hdr-new-badge');
      if (badge)  { badge.textContent  = unread; badge.style.display  = unread>0?'flex':'none'; }
      if (nbadge) { nbadge.textContent = unread+' new'; nbadge.style.display = unread>0?'inline':'none'; }
    } catch(e){}
  }

  // ── Master refresh orchestrator ──────────────────────────────────────
  async function masterRefresh() {
    if (!API.Auth.isLoggedIn()) { clearInterval(window._masterRefreshTimer); return; }
    await silentRefreshDashboard();
    await silentRefreshTeam();
    await silentRefreshWallet();
    await silentRefreshNotifs();
  }

  // Run immediately after init, then every 15 seconds
  setTimeout(masterRefresh, 3000);
  clearInterval(window._masterRefreshTimer);
  window._masterRefreshTimer = setInterval(masterRefresh, 15000);

  // Page-specific refresh when switching tabs
  var _origShowPage = window.showPage;
  if (_origShowPage) {
    window.showPage = function(name) {
      _origShowPage(name);
      // Trigger silent refresh on tab switch
      setTimeout(function(){
        silentRefreshDashboard();
        if (name==='team' || name==='referral') { _teamLoaded=false; silentRefreshTeam(); }
        if (name==='wallet') silentRefreshWallet();
      }, 300);
    };
  }
})();

// ── Wire confirmation actions to real API ────────────────────────────────
// These override the modal onConfirm callbacks with real API calls

// confirmBuyPlan now routes through openInvestModal
window.confirmBuyPlan = function(planKey) { openInvestModal(planKey); };

const _origWithdraw = window.confirmWithdraw;
window.confirmWithdraw = function() {
  openModal({
    icon:'💸', iconBg:'rgba(239,68,68,.1)',
    title:'Confirm Withdrawal',
    body:'Please confirm your withdrawal details.',
    rows:[{l:'Amount',v:'$50.00 USDT',cls:'gold'},{l:'Network',v:'BEP20'},{l:'Wallet',v:'0x8xQ…3kF2'},{l:'Fee',v:'$1.00',cls:'red'},{l:'You Receive',v:'$49.00 USDT',cls:'green'}],
    warn:'Withdrawals are irreversible. Double-check your wallet address.',
    confirmText:'Confirm Withdrawal', confirmClass:'qx-btn-black',
    onConfirm: async () => {
      const res = await API.call(() => API.Wallet.withdraw(50, '0x8xQ3kF2', 'BEP20'), null);
      if (res) showToast('Withdrawal submitted! Processing in 1–24h.', 'success');
    }
  });
};

const _origDeposit = window.confirmDeposit;
window.confirmDeposit = function() {
  openModal({
    icon:'💰', iconBg:'rgba(34,197,94,.1)',
    title:'Deposit USDT',
    body:'Send USDT to the address below. Balance updates after network confirmation.',
    rows:[{l:'Network',v:'BEP20 (BSC)'},{l:'Min Deposit',v:'$10 USDT'},{l:'Confirm Time',v:'~3 minutes'},{l:'Address',v:'TQn8i…Xk92',cls:'gold'}],
    confirmText:'I Have Sent — Confirm', confirmClass:'qx-btn-green',
    onConfirm: async () => {
      const res = await API.call(() => API.Wallet.deposit(100, 'BEP20', 'TX_HASH_HERE'), null);
      if (res) showToast('Deposit submitted! Awaiting confirmation.', 'warning');
    }
  });
};


// ── Premium Announcement Slider ──────────────────────────────────────────
(function() {
  const TOTAL    = 6;
  const INTERVAL = 4800; // ms between slides
  let current  = 0;
  let timer    = null;
  let paused   = false;
  // Touch tracking
  let touchStartX = 0;
  let touchStartY = 0;
  let touchDeltaX = 0;

  function getSlides() { return document.querySelectorAll('.qx-slide'); }
  function getDots()   { return document.querySelectorAll('.qx-sl-dot'); }

  function goTo(idx, dir) {
    const slides = getSlides();
    const dots   = getDots();
    if (!slides.length) return;

    const prev = current;
    current = ((idx % TOTAL) + TOTAL) % TOTAL;
    if (prev === current) return;

    // Exit old slide
    slides[prev].classList.add('exit');
    slides[prev].classList.remove('active');

    // Cleanup exit after transition
    setTimeout(() => { slides[prev].classList.remove('exit'); }, 500);

    // Determine direction for enter animation
    const isForward = dir === undefined ? true : dir;
    slides[current].style.transform = isForward ? 'translateX(28px)' : 'translateX(-28px)';
    // Force reflow
    void slides[current].offsetWidth;
    slides[current].classList.add('active');
    slides[current].style.transform = '';

    // Update dots
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function next() { goTo(current + 1, true);  }
  function prev() { goTo(current - 1, false); }

  function startTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(function() {
      if (!paused) next();
    }, INTERVAL);
  }

  // Exposed globals
  window.qxGoTo = function(idx) {
    const dir = idx > current;
    goTo(idx, dir);
    startTimer(); // reset timer on manual nav
  };
  window.qxSliderPause  = function() { paused = true; };
  window.qxSliderResume = function() { paused = false; };

  // Touch support
  window.qxTouchStart = function(e) {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
    touchDeltaX = 0;
    paused = true;
  };
  window.qxTouchMove = function(e) {
    touchDeltaX = e.changedTouches[0].clientX - touchStartX;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
    // Only prevent default if horizontal swipe dominant
    if (Math.abs(touchDeltaX) > dy && Math.abs(touchDeltaX) > 8) {
      e.preventDefault();
    }
  };
  window.qxTouchEnd = function(e) {
    paused = false;
    if (Math.abs(touchDeltaX) > 45) {
      if (touchDeltaX < 0) next(); else prev();
      startTimer();
    }
  };

  // Init after DOM ready
  function init() {
    const wrap = document.getElementById('qx-slider-wrap');
    if (!wrap) { setTimeout(init, 120); return; }
    startTimer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// ── Balance Visibility Toggle ─────────────────────────────────────────────
let _balVisible = true;
function toggleBalVis() {
  _balVisible = !_balVisible;
  const balEl   = document.getElementById('ph-balance');
  const usdtEl  = document.getElementById('ph-balance-usdt');
  const todayEl = document.getElementById('ph-today-profit');
  const earnEl  = document.getElementById('ph-total-earned');
  const eyeIcon = document.getElementById('bal-eye-icon');
  const mask = '••••••';
  if (_balVisible) {
    if (balEl)   balEl.textContent   = balEl.dataset.val   || '$0.00';
    if (usdtEl)  usdtEl.textContent  = usdtEl.dataset.val  || '≈ 0.00 USDT';
    if (todayEl) todayEl.textContent = todayEl.dataset.val || '$0.00';
    if (earnEl)  earnEl.textContent  = earnEl.dataset.val  || '$0.00';
    if (eyeIcon) eyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  } else {
    if (balEl)   { balEl.dataset.val   = balEl.textContent;   balEl.textContent   = mask; }
    if (usdtEl)  { usdtEl.dataset.val  = usdtEl.textContent;  usdtEl.textContent  = '≈ ' + mask; }
    if (todayEl) { todayEl.dataset.val = todayEl.textContent; todayEl.textContent = mask; }
    if (earnEl)  { earnEl.dataset.val  = earnEl.textContent;  earnEl.textContent  = mask; }
    if (eyeIcon) eyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>';
  }
}

// ── Active Investment UI ─────────────────────────────────────────────────
function updateActiveInvestmentUI(plan) {
  const activeState = document.getElementById('inv-active-state');
  const emptyState  = document.getElementById('inv-empty-state');
  const badge       = document.getElementById('inv-status-badge');
  if (!plan) {
    if (activeState) activeState.style.display = 'none';
    if (emptyState)  emptyState.style.display  = '';
    if (badge) badge.style.display = 'none';
    return;
  }
  if (activeState) activeState.style.display = '';
  if (emptyState)  emptyState.style.display  = 'none';
  if (badge) { badge.style.display = ''; badge.className = 'qx-inv-head-badge qx-inv-badge-active'; badge.textContent = '● Active'; }
  const remaining = Math.max(0, plan.totalDays - plan.daysElapsed);
  const pct = Math.min(100, Math.round((plan.daysElapsed / plan.totalDays) * 100));
  const el = id => document.getElementById(id);
  if (el('inv-plan-name')) el('inv-plan-name').textContent = plan.name;
  if (el('inv-plan-roi'))  el('inv-plan-roi').textContent  = 'ROI ' + plan.roi;
  if (el('inv-amount'))    el('inv-amount').textContent    = '$' + parseFloat(plan.amount).toFixed(0);
  if (el('inv-daily'))     el('inv-daily').textContent     = '$' + parseFloat(plan.dailyIncome).toFixed(2);
  if (el('inv-days'))      el('inv-days').textContent      = remaining + ' days';
  if (el('inv-pct'))       el('inv-pct').textContent       = pct + '%';
  if (el('inv-prog-fill')) el('inv-prog-fill').style.width = pct + '%';
}


// ── ABOUT PAGE ─────────────────────────────────────────────────────────
function abFaq(btn) {
  var item = btn.closest('.ab-faq-item');
  var isOpen = item.classList.contains('open');
  document.querySelectorAll('.ab-faq-item').forEach(function(i){ i.classList.remove('open'); });
  if (!isOpen) item.classList.add('open');
}

function abCountUp(el, target, prefix, suffix, decimals) {
  if (!el) return;
  var start = 0; var dur = 1400; var step = 16;
  var inc = target / (dur / step);
  var timer = setInterval(function() {
    start += inc;
    if (start >= target) { start = target; clearInterval(timer); }
    var val = decimals ? start.toFixed(decimals) : Math.floor(start).toLocaleString();
    el.textContent = (prefix||'') + val + (suffix||'');
  }, step);
}

async function loadAboutStats() {
  try {
    var r = await fetch('https://qavix-global-axeo.onrender.com/api/stats/platform');
    var data = await r.json();
    if (!data.success) return;
    var d = data.data;
    var s = function(id){ return document.getElementById(id); };
    abCountUp(s('abst-members'),  d.totalUsers,        '',  '+',  0);
    abCountUp(s('abst-active'),   d.activeInvestors,   '',  '+',  0);
    abCountUp(s('abst-plans'),    (d.activeInvestors||0) * 1.3 | 0, '', '+', 0);
    abCountUp(s('abst-deposits'), d.totalDeposits/1000000, '$', 'M', 2);
    abCountUp(s('abst-withdrawn'),d.totalWithdrawals/1000000,'$','M', 2);
    abCountUp(s('abst-uptime'),   d.uptimePct,         '',  '%',  1);
  } catch(e) {
    ['abst-members','abst-active','abst-plans','abst-deposits','abst-withdrawn','abst-uptime']
      .forEach(function(id){ var el=document.getElementById(id); if(el) el.textContent='-'; });
  }
}

(function() {
  function spawnParticles() {
    var container = document.getElementById('ab-particles');
    if (!container) return;
    for (var i = 0; i < 10; i++) {
      (function(idx) {
        setTimeout(function() {
          var p = document.createElement('div');
          p.className = 'ab-hero-ptcl';
          var x = Math.random() * 100;
          var y = Math.random() * 100;
          var tx = ((Math.random() - 0.5) * 80) + 'px';
          var ty = -(Math.random() * 60 + 20) + 'px';
          p.style.cssText = 'left:'+x+'%;top:'+y+'%;--px:'+tx+';--py:'+ty+';animation-duration:'+(3+Math.random()*3)+'s;animation-delay:'+(Math.random()*2)+'s;opacity:'+(0.4+Math.random()*0.6);
          container.appendChild(p);
          setTimeout(function(){ if(p.parentNode) p.parentNode.removeChild(p); }, 8000);
        }, idx * 400);
      })(i);
    }
  }
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(spawnParticles, 800); });
  setInterval(spawnParticles, 9000);
})();

window.openLuckyDraw = async function() {
  const res = await API.call(() => API.Rewards.lucky(), null);
  if (res) {
    const prize = res.data.prize;
    openModal({
      icon:'🎰', iconBg:'rgba(139,92,246,.12)',
      title:'Lucky Draw Result!',
      body:'The wheel has spoken! Your prize:',
      rows:[{l:'Result',v:prize.l},{l:'Amount',v:'$'+prize.a,cls:'gold'},{l:'Status',v:prize.a>0?'Added to wallet':'Better luck next time',cls:prize.a>0?'green':''}],
      confirmText:'OK!', confirmClass:'qx-btn-gold',
      cancelText:'Close',
      onConfirm: ()=>{}
    });
  }
};
</script>

<!-- Toast container -->
<div id="qx-toasts"></div>

<!-- ══ TAWK.TO LIVE CHAT ══ -->
<script>
  var Tawk_API = Tawk_API || {};
  var Tawk_LoadStart = new Date();

  // Hide default bubble — we use our own buttons
  Tawk_API.onLoad = function() {
    Tawk_API.hideWidget();
  };

  (function(){
    var s1 = document.createElement("script");
    var s0 = document.getElementsByTagName("script")[0];
    s1.async = true;
    s1.src = 'https://embed.tawk.to/6a40035343e9051d4585b008/default';
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin','*');
    s0.parentNode.insertBefore(s1,s0);
  })();

  function openLiveChat() {
    if (typeof Tawk_API !== 'undefined' && typeof Tawk_API.toggle === 'function') {
      Tawk_API.showWidget();
      Tawk_API.toggle();
    } else {
      showToast('Chat loading, please wait…', 'info');
    }
  }
</script>
</body>
</html>
