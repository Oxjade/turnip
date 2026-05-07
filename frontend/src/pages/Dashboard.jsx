import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    User, Mail, Calendar, Download, RefreshCw,
    ShieldCheck, AlertCircle, Copy, Check,
    Globe, Cpu, Info, LogOut, Clock, ArrowRight
} from 'lucide-react';

const Dashboard = () => {
    const [sub, setSub] = useState(null);
    const [status, setStatus] = useState('loading'); // loading | registered | active | expired | disabled
    const [copied, setCopied] = useState(null);
    const [regenerating, setRegenerating] = useState(false);
    const [regenResult, setRegenResult] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('/api/user/status')
            .then(r => {
                if (r.status === 401) { navigate('/login'); return null; }
                return r.json();
            })
            .then(data => {
                if (!data) return;
                if (data.status === 'registered') {
                    setStatus('registered');
                    setSub({ email: data.email });
                } else if (data.email) {
                    setStatus(data.status || 'active');
                    setSub(data);
                } else {
                    navigate('/login');
                }
            })
            .catch(() => navigate('/login'));
    }, []);

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const daysRemaining = (expiresAt) => {
        if (!expiresAt) return null;
        return Math.max(0, Math.ceil((new Date(expiresAt) - new Date()) / 86400000));
    };

    const handleLogout = async () => {
        try { await fetch('/logout'); } catch (_) {}
        window.location.href = '/login';
    };

    const handleRegenerate = async () => {
        setRegenerating(true);
        setRegenResult(null);
        try {
            const res = await fetch('/api/regenerate', { method: 'POST' });
            const data = await res.json();
            if (data.ok) {
                setRegenResult({ ok: true, msg: 'Password regenerated. Check your email for the new credentials.' });
                setSub(prev => ({ ...prev, password: data.password }));
            } else {
                setRegenResult({ ok: false, msg: data.error || 'Failed to regenerate.' });
            }
        } catch {
            setRegenResult({ ok: false, msg: 'Network error. Please try again.' });
        }
        setRegenerating(false);
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (status === 'loading') return (
        <div className="dash-loading">
            <div className="spinner" />
            <p>Loading your account…</p>
            <style jsx>{`
                .dash-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;gap:1rem;color:var(--text3);font-size:14px;font-family:var(--sans)}
                .spinner{width:30px;height:30px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite}
                @keyframes spin{to{transform:rotate(360deg)}}
            `}</style>
        </div>
    );

    // ── Registered but no subscription ───────────────────────────────────────
    if (status === 'registered') return (
        <div className="wall-wrap">
            <motion.div className="wall-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Link to="/" className="wordmark">Tur<span>nip</span></Link>
                <div className="wall-icon">🔒</div>
                <h2>No Active Subscription</h2>
                <p>Hi <strong>{sub.email}</strong> — your account is registered but you don't have an active VPN plan yet.</p>
                <button className="btn-primary-full" onClick={() => navigate('/pricing')}>
                    Choose a Plan <ArrowRight size={16} />
                </button>
                <button className="btn-ghost-full" onClick={handleLogout}>Sign out</button>
            </motion.div>
            <Styles />
        </div>
    );

    // ── Expired / Disabled ───────────────────────────────────────────────────
    if (status === 'expired' || status === 'disabled') return (
        <div className="wall-wrap">
            <motion.div className="wall-card expired" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Link to="/" className="wordmark">Tur<span>nip</span></Link>
                <div className="wall-icon">⏱</div>
                <h2>Subscription {status === 'disabled' ? 'Disabled' : 'Expired'}</h2>
                <p>Your VPN access ended on <strong>{sub.expires_at?.split('T')[0]}</strong>. Renew to restore your encrypted connection.</p>
                <button className="btn-primary-full" onClick={() => navigate('/pricing')}>
                    Renew Subscription <ArrowRight size={16} />
                </button>
                <button className="btn-ghost-full" onClick={handleLogout}>Sign out</button>
            </motion.div>
            <Styles />
        </div>
    );

    // ── Active Dashboard ─────────────────────────────────────────────────────
    const days = daysRemaining(sub.expires_at);
    const isUrgent = days !== null && days <= 5;
    const devices = sub.devices || [{ device_number: 1, username: sub.username, password: sub.password }];

    return (
        <div className="dashboard container">
            {/* Brand */}
            <motion.div className="brand-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Link to="/" className="wordmark">Tur<span>nip</span></Link>
                <span className="brand-tag">// dashboard</span>
            </motion.div>

            {/* Session notice */}
            <motion.div className="notice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
                <Info size={13} />
                <span>Secured via HTTP-only session cookie · No traffic logs · <a href="/privacy">Privacy Policy</a></span>
            </motion.div>

            {/* Header */}
            <motion.div className="dash-header" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div>
                    <h1>My Dashboard</h1>
                    <p>{sub.email}</p>
                </div>
                <div className="header-right">
                    <span className={`status-pill ${sub.status}`}>
                        <span className="dot" /> {sub.status?.toUpperCase()}
                    </span>
                    <button className="btn-logout" onClick={handleLogout}><LogOut size={14} /> Sign out</button>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div className="stats-row" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                {[
                    { icon: <Cpu size={16} />, label: 'Plan', val: sub.plan_name || 'Basic' },
                    { icon: <Globe size={16} />, label: 'Region', val: (sub.server_region || 'EU').toUpperCase() },
                    { icon: <Clock size={16} />, label: 'Days Left', val: days !== null ? `${days}d` : '—', urgent: isUrgent },
                    { icon: <User size={16} />, label: 'Devices', val: devices.length },
                ].map((s, i) => (
                    <div key={i} className={`stat ${s.urgent ? 'urgent' : ''}`}>
                        <div className="stat-icon">{s.icon}</div>
                        <div>
                            <div className="stat-lbl">{s.label}</div>
                            <div className="stat-val">{s.val}</div>
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Urgency banner */}
            {isUrgent && (
                <motion.div className="banner-warn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <AlertCircle size={14} />
                    Your subscription expires in <strong>{days} day{days !== 1 ? 's' : ''}</strong>.
                    <button onClick={() => navigate('/pricing')}>Renew now →</button>
                </motion.div>
            )}

            <div className="grid">
                {/* Left: Credentials */}
                <div>
                    <motion.section className="card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <div className="card-head">
                            <h3>VPN Credentials</h3>
                            <span className="card-sub">Each device has its own profile</span>
                        </div>
                        {devices.map(dev => (
                            <div key={dev.device_number} className="device">
                                <div className="device-head">
                                    <span>Device {dev.device_number}</span>
                                    <a href={`/download/profile?device=${dev.device_number}`} className="dl-btn">
                                        <Download size={12} /> Profile
                                    </a>
                                </div>
                                {[
                                    { lbl: 'IKEv2 Username', val: dev.username, id: `u${dev.device_number}` },
                                    { lbl: 'IKEv2 Password', val: dev.password, id: `p${dev.device_number}` },
                                ].map(({ lbl, val, id }) => (
                                    <div key={id} className="cred">
                                        <div className="cred-lbl">{lbl}</div>
                                        <div className="cred-box">
                                            <code>{val}</code>
                                            <button className="copy" onClick={() => copyToClipboard(val, id)}>
                                                {copied === id ? <><Check size={12} /> Done</> : <><Copy size={12} /> Copy</>}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </motion.section>
                </div>

                {/* Right: Actions + Info */}
                <div>
                    {/* Downloads */}
                    <motion.section className="card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                        <div className="card-head"><h3>Downloads</h3></div>
                        <a href="/download/ca" className="action-btn">
                            <ShieldCheck size={15} /> Download CA Certificate
                        </a>
                    </motion.section>

                    {/* Account */}
                    <motion.section className="card" style={{ marginTop: 16 }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <div className="card-head"><h3>Account</h3></div>
                        <div className="acc-list">
                            <div className="acc-row"><Mail size={13} /><span>{sub.email}</span></div>
                            <div className="acc-row"><Calendar size={13} /><span>Expires {sub.expires_at?.split('T')[0]}</span></div>
                            <div className="acc-row"><Globe size={13} /><span>{sub.server_region?.toUpperCase() || 'EU'} server</span></div>
                        </div>
                        <div className="action-list">
                            <button className="action-btn outline" onClick={handleRegenerate} disabled={regenerating}>
                                <RefreshCw size={14} /> {regenerating ? 'Regenerating…' : 'Regenerate Password'}
                            </button>
                            <button className="action-btn danger">Terminate Subscription</button>
                        </div>
                        {regenResult && (
                            <div className={`regen-msg ${regenResult.ok ? 'ok' : 'err'}`}>{regenResult.msg}</div>
                        )}
                    </motion.section>

                    {/* Privacy */}
                    <motion.section className="card privacy-card" style={{ marginTop: 16 }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                        <div className="card-head"><h3>Session &amp; Privacy</h3></div>
                        <ul className="priv-list">
                            {['HTTP-only session cookie','Zero traffic logs','TLS 1.3 in transit','Auto-expiry on inactivity'].map(t => (
                                <li key={t}><Check size={12} />{t}</li>
                            ))}
                        </ul>
                        <a href="/privacy" className="priv-link">Full Privacy Policy →</a>
                    </motion.section>
                </div>
            </div>

            <Styles />
        </div>
    );
};

// Shared styles component
const Styles = () => (
    <style jsx>{`
        /* Wall screens */
        .wall-wrap{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem;background:var(--bg);font-family:var(--sans)}
        .wall-card{background:var(--bg2);border:1px solid var(--border);border-radius:24px;padding:3rem 2.5rem;max-width:440px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.4)}
        .wall-card.expired{border-color:rgba(244,63,94,0.2)}
        .wall-icon{font-size:48px;margin:1.5rem 0}
        .wall-card h2{font-size:22px;font-weight:800;color:var(--text);margin-bottom:.75rem}
        .wall-card p{color:var(--text2);font-size:14px;line-height:1.7;margin-bottom:2rem}
        .wall-card p strong{color:var(--text)}
        .btn-primary-full{width:100%;background:var(--accent);color:#050810;border:none;border-radius:12px;padding:13px 20px;font-size:14px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-family:var(--sans);transition:background .2s,transform .1s;margin-bottom:10px}
        .btn-primary-full:hover{background:var(--accent2);transform:translateY(-1px)}
        .btn-ghost-full{width:100%;background:transparent;border:1px solid var(--border);color:var(--text3);border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .2s}
        .btn-ghost-full:hover{border-color:var(--accent);color:var(--accent)}

        /* Wordmark */
        .wordmark{display:inline-block;font-size:20px;font-weight:800;letter-spacing:-.5px;color:var(--text);text-decoration:none;margin-bottom:1.5rem}
        .wordmark span{color:var(--accent)}

        /* Dashboard layout */
        .dashboard{padding-top:6rem;padding-bottom:5rem;font-family:var(--sans)}
        .brand-row{display:flex;align-items:center;gap:12px;margin-bottom:1.5rem}
        .brand-tag{font-size:11px;font-family:var(--mono);color:var(--text3);background:var(--adim);border:1px solid var(--border);padding:3px 10px;border-radius:100px}

        /* Session notice */
        .notice{display:flex;align-items:center;gap:8px;background:var(--adim);border:1px solid var(--border);border-radius:10px;padding:9px 14px;font-size:12px;color:var(--text2);margin-bottom:2rem}
        .notice svg{color:var(--accent);flex-shrink:0}
        .notice a{color:var(--accent);font-weight:600;text-decoration:none}
        .notice a:hover{text-decoration:underline}

        /* Header */
        .dash-header{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:2rem}
        .dash-header h1{font-size:28px;font-weight:800;letter-spacing:-1px;color:var(--text);margin-bottom:4px}
        .dash-header p{color:var(--text3);font-size:13px}
        .header-right{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .status-pill{display:flex;align-items:center;gap:7px;font-family:var(--mono);font-size:11px;font-weight:700;background:var(--bg2);border:1px solid var(--border);padding:5px 13px;border-radius:100px;color:var(--text3)}
        .status-pill.active{color:var(--accent);border-color:rgba(168,85,247,.3)}
        .status-pill.non_renewing{color:var(--amber);border-color:rgba(251,191,36,.3)}
        .dot{width:6px;height:6px;border-radius:50%;background:currentColor;box-shadow:0 0 5px currentColor}
        .btn-logout{display:flex;align-items:center;gap:6px;background:transparent;border:1px solid var(--border);color:var(--text3);padding:6px 13px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .2s}
        .btn-logout:hover{border-color:var(--accent);color:var(--accent)}

        /* Stats */
        .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:1.5rem}
        .stat{background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:1.1rem 1.25rem;display:flex;align-items:center;gap:12px;transition:border-color .2s}
        .stat:hover{border-color:rgba(168,85,247,.25)}
        .stat.urgent{border-color:rgba(244,63,94,.3);background:rgba(244,63,94,.04)}
        .stat.urgent .stat-val{color:var(--red)}
        .stat-icon{width:34px;height:34px;background:var(--adim);border:1px solid var(--border);border-radius:9px;display:flex;align-items:center;justify-content:center;color:var(--accent);flex-shrink:0}
        .stat-lbl{font-size:10px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.07em;font-family:var(--mono);margin-bottom:2px}
        .stat-val{font-size:17px;font-weight:700;color:var(--text)}

        /* Warning banner */
        .banner-warn{display:flex;align-items:center;gap:8px;background:rgba(244,63,94,.07);border:1px solid rgba(244,63,94,.22);border-radius:10px;padding:10px 15px;font-size:13px;color:var(--red);margin-bottom:1.5rem;flex-wrap:wrap}
        .banner-warn strong{color:var(--red)}
        .banner-warn button{background:none;border:none;color:var(--accent);font-weight:700;font-size:13px;cursor:pointer;margin-left:6px;font-family:var(--sans)}

        /* Grid */
        .grid{display:grid;grid-template-columns:1.6fr 1fr;gap:18px}

        /* Cards */
        .card{background:var(--bg2);border:1px solid var(--border);border-radius:18px;padding:1.6rem;box-shadow:0 6px 20px rgba(0,0,0,.18)}
        .card-head{margin-bottom:1.25rem}
        .card-head h3{font-size:14px;font-weight:700;color:var(--text);margin:0 0 2px}
        .card-sub{font-size:11px;color:var(--text3);font-family:var(--mono)}

        /* Devices */
        .device{background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:1.1rem;margin-bottom:.9rem}
        .device:last-child{margin-bottom:0}
        .device-head{display:flex;align-items:center;justify-content:space-between;font-size:11px;font-weight:800;color:var(--accent);text-transform:uppercase;letter-spacing:.1em;font-family:var(--mono);margin-bottom:.9rem}
        .dl-btn{display:flex;align-items:center;gap:5px;color:var(--text3);font-size:11px;font-weight:600;text-decoration:none;background:var(--bg2);border:1px solid var(--border);padding:3px 9px;border-radius:6px;transition:all .2s;font-family:var(--sans)}
        .dl-btn:hover{border-color:var(--accent);color:var(--accent)}
        .cred{margin-bottom:.85rem}
        .cred:last-child{margin-bottom:0}
        .cred-lbl{font-size:10px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.06em;font-family:var(--mono);margin-bottom:5px}
        .cred-box{background:var(--bg);border:1px solid var(--border);border-radius:9px;padding:9px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px}
        .cred-box code{color:var(--text);font-size:12px;font-family:var(--mono);word-break:break-all}
        .copy{display:flex;align-items:center;gap:4px;background:var(--surf);border:1px solid var(--border);color:var(--text3);border-radius:6px;padding:4px 9px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;font-family:var(--sans);transition:all .2s}
        .copy:hover{border-color:var(--accent);color:var(--accent);background:var(--adim)}

        /* Account */
        .acc-list{display:flex;flex-direction:column;gap:9px;margin-bottom:1.1rem}
        .acc-row{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text2)}
        .acc-row svg{color:var(--text3);flex-shrink:0}

        /* Action buttons */
        .action-list{display:flex;flex-direction:column;gap:9px}
        .action-btn{display:flex;align-items:center;gap:9px;background:var(--surf);border:1px solid var(--border);color:var(--text2);padding:10px 13px;font-size:13px;font-weight:600;border-radius:10px;cursor:pointer;font-family:var(--sans);transition:all .2s;width:100%;text-decoration:none}
        .action-btn:hover{border-color:var(--accent);color:var(--accent);background:var(--adim)}
        .action-btn.outline{background:transparent;justify-content:center}
        .action-btn.outline:hover{border-color:var(--blue);color:var(--blue)}
        .action-btn.danger{background:rgba(244,63,94,.05);border-color:rgba(244,63,94,.2);color:var(--red);justify-content:center}
        .action-btn.danger:hover{background:rgba(244,63,94,.1);border-color:var(--red)}
        .action-btn:disabled{opacity:.5;cursor:not-allowed}
        .regen-msg{margin-top:10px;font-size:12px;padding:8px 12px;border-radius:8px}
        .regen-msg.ok{background:var(--adim);border:1px solid var(--border);color:var(--accent)}
        .regen-msg.err{background:rgba(244,63,94,.07);border:1px solid rgba(244,63,94,.25);color:var(--red)}

        /* Privacy card */
        .privacy-card{background:var(--adim);border-color:rgba(168,85,247,.18)}
        .priv-list{list-style:none;padding:0;margin:0 0 .9rem;display:flex;flex-direction:column;gap:8px}
        .priv-list li{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text2)}
        .priv-list li svg{color:var(--accent);flex-shrink:0}
        .priv-link{font-size:12px;color:var(--accent);font-weight:600;text-decoration:none;font-family:var(--mono)}
        .priv-link:hover{text-decoration:underline}

        @media(max-width:1100px){.stats-row{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:900px){.grid{grid-template-columns:1fr}.stats-row{grid-template-columns:1fr 1fr}}
        @media(max-width:500px){.stats-row{grid-template-columns:1fr}.dashboard{padding-top:5rem}}
    `}</style>
);

export default Dashboard;
