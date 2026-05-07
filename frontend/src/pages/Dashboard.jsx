import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    User, Mail, Calendar, Download, RefreshCw,
    ShieldCheck, AlertCircle, Copy, Check,
    Globe, Cpu, Info, LogOut, Clock
} from 'lucide-react';

const Dashboard = () => {
    const [sub, setSub] = useState(null);
    const [copied, setCopied] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch('/api/user/status');
                if (res.status === 401) { navigate('/login'); return; }
                const data = await res.json();
                if (data.status === 'registered') {
                    navigate('/pricing');
                } else if (data.status === 'expired' || data.status === 'disabled') {
                    setSub(data);
                } else if (data.email) {
                    setSub(data);
                } else {
                    navigate('/login');
                }
            } catch (err) {
                console.error('Failed to fetch user status:', err);
                navigate('/login');
            }
        };
        fetchStatus();
    }, []);

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const daysRemaining = (expiresAt) => {
        if (!expiresAt) return null;
        const diff = new Date(expiresAt) - new Date();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    const handleLogout = async () => {
        try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (_) {}
        window.location.href = '/login';
    };

    if (!sub) return (
        <div className="dash-loading">
            <div className="dash-spinner" />
            <p>Loading your account…</p>
            <style jsx>{`
                .dash-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:80vh; gap:1rem; color:var(--text3); font-size:14px; }
                .dash-spinner { width:32px; height:32px; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin .8s linear infinite; }
                @keyframes spin { to { transform:rotate(360deg); } }
            `}</style>
        </div>
    );

    if (sub.status === 'expired' || sub.status === 'disabled') {
        return (
            <div className="dash-expired-wrap">
                <motion.div className="expired-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="exp-icon">⏱</div>
                    <h2>Subscription Expired</h2>
                    <p>Your VPN access ended on <strong>{sub.expires_at?.split('T')[0]}</strong>.<br />Renew to restore your encrypted connection.</p>
                    <button className="btn-renew" onClick={() => navigate('/pricing')}>Renew Subscription →</button>
                    <button className="btn-logout-exp" onClick={handleLogout}>Sign out</button>
                </motion.div>
                <style jsx>{`
                    .dash-expired-wrap { display:flex; align-items:center; justify-content:center; min-height:100vh; padding:2rem; background:var(--bg); }
                    .expired-card { background:var(--bg2); border:1px solid rgba(255,71,87,0.2); border-radius:24px; padding:3rem 2.5rem; max-width:440px; width:100%; text-align:center; box-shadow:0 20px 60px rgba(0,0,0,0.3); }
                    .exp-icon { font-size:48px; margin-bottom:1.5rem; }
                    h2 { font-size:24px; font-weight:800; color:var(--text); margin:0 0 1rem; }
                    p { color:var(--text2); font-size:14px; line-height:1.7; margin-bottom:2rem; }
                    strong { color:var(--text); }
                    .btn-renew { background:var(--accent); color:#050810; font-size:15px; font-weight:800; padding:14px 32px; border-radius:12px; border:none; cursor:pointer; width:100%; margin-bottom:12px; transition:opacity .2s; }
                    .btn-renew:hover { opacity:.85; }
                    .btn-logout-exp { background:transparent; border:1px solid var(--border); color:var(--text3); font-size:13px; font-weight:600; padding:10px 20px; border-radius:10px; cursor:pointer; width:100%; transition:all .2s; }
                    .btn-logout-exp:hover { border-color:var(--text2); color:var(--text2); }
                `}</style>
            </div>
        );
    }

    const days = daysRemaining(sub.expires_at);
    const isUrgent = days !== null && days <= 5;

    return (
        <div className="dashboard container">
            {/* Session notice */}
            <motion.div className="session-notice" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Info size={13} />
                <span>Your session is stored in a secure HTTP-only cookie and expires automatically. <a href="/privacy">Privacy Policy</a></span>
            </motion.div>

            {/* Header */}
            <motion.div className="dashboard-header" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div>
                    <h1>My Dashboard</h1>
                    <p>Manage your VPN credentials and subscription.</p>
                </div>
                <div className="header-right">
                    <div className={`status-badge ${sub.status}`}>
                        <div className="dot" /> {sub.status.toUpperCase()}
                    </div>
                    <button className="btn-logout" onClick={handleLogout}>
                        <LogOut size={14} /> Sign out
                    </button>
                </div>
            </motion.div>

            {/* Stats row */}
            <motion.div className="stats-row" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <div className="stat-tile">
                    <div className="stat-icon"><Cpu size={18} /></div>
                    <div>
                        <div className="stat-label">Plan</div>
                        <div className="stat-val">{sub.plan_name || 'Basic'}</div>
                    </div>
                </div>
                <div className="stat-tile">
                    <div className="stat-icon"><Globe size={18} /></div>
                    <div>
                        <div className="stat-label">Server Region</div>
                        <div className="stat-val">{(sub.server_region || 'EU').toUpperCase()}</div>
                    </div>
                </div>
                <div className={`stat-tile ${isUrgent ? 'urgent' : ''}`}>
                    <div className="stat-icon"><Clock size={18} /></div>
                    <div>
                        <div className="stat-label">Days Remaining</div>
                        <div className="stat-val">{days !== null ? `${days} days` : '—'}</div>
                    </div>
                </div>
                <div className="stat-tile">
                    <div className="stat-icon"><Mail size={18} /></div>
                    <div>
                        <div className="stat-label">Account</div>
                        <div className="stat-val" style={{ fontSize: '13px' }}>{sub.email}</div>
                    </div>
                </div>
            </motion.div>

            {isUrgent && (
                <motion.div className="expiry-warning" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <AlertCircle size={15} />
                    Your subscription expires in <strong>{days} day{days !== 1 ? 's' : ''}</strong>. <button onClick={() => navigate('/pricing')}>Renew now →</button>
                </motion.div>
            )}

            <div className="dash-grid">
                <div className="dash-left">
                    {/* Credentials */}
                    <motion.section className="dash-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <div className="card-header">
                            <h3>VPN Credentials</h3>
                            <span className="card-sub">Each device gets its own unique profile</span>
                        </div>
                        {(sub.devices || [{ device_number: 1, username: sub.username, password: sub.password }]).map(dev => (
                            <div key={dev.device_number} className="device-block">
                                <div className="device-block-header">
                                    <span>Device {dev.device_number}</span>
                                    <a href={`/download/profile?device=${dev.device_number}`} className="dl-inline-btn">
                                        <Download size={12} /> Download Profile
                                    </a>
                                </div>
                                <div className="cred-item">
                                    <div className="cred-lbl">IKEv2 Username</div>
                                    <div className="cred-box">
                                        <code className="mono">{dev.username}</code>
                                        <button className="copy-btn" onClick={() => copyToClipboard(dev.username, `user_${dev.device_number}`)}>
                                            {copied === `user_${dev.device_number}` ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                                        </button>
                                    </div>
                                </div>
                                <div className="cred-item">
                                    <div className="cred-lbl">IKEv2 Password</div>
                                    <div className="cred-box">
                                        <code className="mono">{dev.password}</code>
                                        <button className="copy-btn" onClick={() => copyToClipboard(dev.password, `pass_${dev.device_number}`)}>
                                            {copied === `pass_${dev.device_number}` ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.section>
                </div>

                <div className="dash-right">
                    {/* Downloads */}
                    <motion.section className="dash-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <div className="card-header">
                            <h3>Downloads</h3>
                            <span className="card-sub">Install CA cert once per device</span>
                        </div>
                        <div className="action-buttons">
                            <button className="btn btn-action">
                                <ShieldCheck size={16} /> Download CA Certificate
                            </button>
                        </div>
                    </motion.section>

                    {/* Account */}
                    <motion.section className="dash-card" style={{ marginTop: '20px' }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <div className="card-header">
                            <h3>Account</h3>
                        </div>
                        <div className="account-info">
                            <div className="acc-row"><User size={13} /> <span>{sub.name || 'Account holder'}</span></div>
                            <div className="acc-row"><Mail size={13} /> <span>{sub.email}</span></div>
                            <div className="acc-row"><Calendar size={13} /> <span>Expires {sub.expires_at?.split('T')[0]}</span></div>
                        </div>
                        <div className="action-buttons" style={{ marginTop: '1.25rem' }}>
                            <button className="btn btn-action-outline">
                                <RefreshCw size={14} /> Regenerate Password
                            </button>
                            <button className="btn btn-action-danger">
                                Terminate Subscription
                            </button>
                        </div>
                    </motion.section>

                    {/* Session info */}
                    <motion.section className="dash-card session-card" style={{ marginTop: '20px' }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                        <div className="card-header">
                            <h3>Session & Privacy</h3>
                        </div>
                        <ul className="session-list">
                            <li><Check size={12} /> Session secured via HTTP-only cookie</li>
                            <li><Check size={12} /> No activity logs stored on our servers</li>
                            <li><Check size={12} /> Credentials encrypted in transit (TLS 1.3)</li>
                            <li><Check size={12} /> Session auto-expires after inactivity</li>
                        </ul>
                        <a href="/privacy" className="privacy-link">View full Privacy Policy →</a>
                    </motion.section>
                </div>
            </div>

            <style jsx>{`
                .dashboard { padding-top: 7rem; padding-bottom: 5rem; }

                .session-notice {
                    display: flex; align-items: center; gap: 8px;
                    background: rgba(0,200,150,0.06); border: 1px solid rgba(0,200,150,0.18);
                    border-radius: 10px; padding: 9px 14px;
                    font-size: 12px; color: var(--text2); margin-bottom: 2rem;
                }
                .session-notice a { color: var(--accent); text-decoration: none; font-weight: 600; }
                .session-notice a:hover { text-decoration: underline; }

                .dashboard-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
                .dashboard-header h1 { font-size: 30px; font-weight: 800; letter-spacing: -1px; margin-bottom: 4px; }
                .dashboard-header p { color: var(--text3); font-size: 14px; }
                .header-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

                .status-badge { display: flex; align-items: center; gap: 8px; font-family: var(--mono); font-size: 11px; font-weight: 700; background: var(--bg2); border: 1px solid var(--border); padding: 6px 14px; border-radius: 100px; }
                .status-badge.active { color: var(--accent); border-color: rgba(0,200,150,0.3); }
                .status-badge .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; box-shadow: 0 0 6px currentColor; }

                .btn-logout { display: flex; align-items: center; gap: 6px; background: transparent; border: 1px solid var(--border); color: var(--text3); padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .2s; font-family: var(--sans); }
                .btn-logout:hover { border-color: var(--text2); color: var(--text2); }

                /* Stats row */
                .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 1.5rem; }
                .stat-tile { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem; display: flex; align-items: center; gap: 14px; transition: border-color .2s; }
                .stat-tile:hover { border-color: rgba(0,200,150,0.25); }
                .stat-tile.urgent { border-color: rgba(255,71,87,0.35); background: rgba(255,71,87,0.05); }
                .stat-tile.urgent .stat-val { color: #f87171; }
                .stat-icon { width: 38px; height: 38px; background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--accent); flex-shrink: 0; }
                .stat-label { font-size: 11px; color: var(--text3); font-weight: 700; text-transform: uppercase; letter-spacing: .07em; margin-bottom: 3px; }
                .stat-val { font-size: 16px; font-weight: 700; color: var(--text); }

                /* Expiry warning */
                .expiry-warning { display: flex; align-items: center; gap: 8px; background: rgba(255,71,87,0.08); border: 1px solid rgba(255,71,87,0.25); border-radius: 10px; padding: 10px 16px; font-size: 13px; color: #fca5a5; margin-bottom: 1.5rem; }
                .expiry-warning strong { color: #f87171; }
                .expiry-warning button { background: none; border: none; color: var(--accent); font-weight: 700; cursor: pointer; font-size: 13px; padding: 0; margin-left: 4px; }

                .dash-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 20px; }
                .dash-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 20px; padding: 1.75rem; box-shadow: 0 8px 24px rgba(0,0,0,0.18); }

                .card-header { margin-bottom: 1.5rem; }
                .card-header h3 { font-size: 15px; font-weight: 700; color: var(--text); margin: 0 0 3px; }
                .card-sub { font-size: 12px; color: var(--text3); }

                .device-block { background: var(--bg3); border: 1px solid var(--border); border-radius: 14px; padding: 1.25rem; margin-bottom: 1rem; }
                .device-block:last-child { margin-bottom: 0; }
                .device-block-header { display: flex; align-items: center; justify-content: space-between; font-size: 11px; font-weight: 800; color: var(--accent); text-transform: uppercase; letter-spacing: .1em; font-family: var(--mono); margin-bottom: 1rem; }
                .dl-inline-btn { display: flex; align-items: center; gap: 5px; color: var(--text3); font-size: 11px; font-weight: 600; text-decoration: none; background: var(--bg2); border: 1px solid var(--border); padding: 4px 10px; border-radius: 6px; transition: all .2s; font-family: var(--sans); }
                .dl-inline-btn:hover { border-color: var(--accent); color: var(--accent); }

                .cred-item { margin-bottom: 1rem; }
                .cred-item:last-child { margin-bottom: 0; }
                .cred-lbl { font-size: 11px; color: var(--text3); margin-bottom: 6px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
                .cred-box { background: var(--bg); border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
                code { color: var(--text); font-size: 13px; word-break: break-all; font-family: var(--mono); }
                .copy-btn { display: flex; align-items: center; gap: 5px; background: var(--bg2); border: 1px solid var(--border); color: var(--text3); cursor: pointer; transition: all .2s; border-radius: 6px; padding: 5px 10px; font-size: 12px; font-weight: 600; white-space: nowrap; }
                .copy-btn:hover { color: var(--accent); border-color: var(--accent); }

                /* Account */
                .account-info { display: flex; flex-direction: column; gap: 10px; margin-bottom: 0; }
                .acc-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text2); }
                .acc-row svg { color: var(--text3); flex-shrink: 0; }

                .small-text { font-size: 13px; color: var(--text2); margin-top: -1rem; margin-bottom: 1.5rem; }
                .action-buttons { display: flex; flex-direction: column; gap: 10px; }
                .btn-action { background: var(--bg3); border: 1px solid var(--border); color: var(--text2); padding: 11px 14px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 10px; border-radius: 10px; transition: all .2s; cursor: pointer; font-family: var(--sans); }
                .btn-action:hover { border-color: var(--accent); color: var(--text); }
                .btn-action-outline { background: transparent; border: 1px solid var(--border); color: var(--text2); padding: 11px; font-size: 13px; font-weight: 600; border-radius: 10px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; font-family: var(--sans); transition: all .2s; }
                .btn-action-outline:hover { border-color: var(--blue, #4fa3e0); color: var(--blue, #4fa3e0); }
                .btn-action-danger { background: rgba(255,71,87,0.05); border: 1px solid rgba(255,71,87,0.2); color: #f87171; padding: 11px; font-size: 13px; font-weight: 700; border-radius: 10px; cursor: pointer; font-family: var(--sans); transition: all .2s; }
                .btn-action-danger:hover { background: rgba(255,71,87,0.1); border-color: #f87171; }

                /* Session card */
                .session-card { background: rgba(0,200,150,0.04); border-color: rgba(0,200,150,0.15); }
                .session-list { list-style: none; padding: 0; margin: 0 0 1rem; display: flex; flex-direction: column; gap: 10px; }
                .session-list li { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--text2); }
                .session-list li svg { color: var(--accent); flex-shrink: 0; }
                .privacy-link { font-size: 12px; color: var(--accent); text-decoration: none; font-weight: 600; }
                .privacy-link:hover { text-decoration: underline; }

                @media (max-width: 1100px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
                @media (max-width: 900px) { .dash-grid { grid-template-columns: 1fr; } .stats-row { grid-template-columns: 1fr 1fr; } }
                @media (max-width: 500px) { .stats-row { grid-template-columns: 1fr; } .dashboard { padding-top: 5rem; } }
            `}</style>
        </div>
    );
};

export default Dashboard;
