import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Share2, Copy, Check, Users, DollarSign, ArrowRight, Save, LogOut } from 'lucide-react';

const Affiliate = () => {
    const [status, setStatus] = useState('loading');
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [isAffiliate, setIsAffiliate] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [wallets, setWallets] = useState({ btc: '', eth: '', sol: '', sui: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        // Check auth status
        fetch('/api/user/status')
            .then(r => {
                if (r.status === 401) { navigate('/login?redirect=/affiliate'); return null; }
                return r.json();
            })
            .then(data => {
                if (!data || !data.email) {
                    navigate('/login?redirect=/affiliate');
                    return;
                }
                setUser(data);
                fetchAffiliateData();
            })
            .catch(() => navigate('/login?redirect=/affiliate'));
    }, []);

    const fetchAffiliateData = async () => {
        try {
            const res = await fetch('/api/affiliate');
            const data = await res.json();
            if (data.is_affiliate) {
                setIsAffiliate(true);
                setProfile(data.profile);
                setStats(data.stats);
                setWallets({
                    btc: data.profile.wallet_btc || '',
                    eth: data.profile.wallet_eth || '',
                    sol: data.profile.wallet_sol || '',
                    sui: data.profile.wallet_sui || ''
                });
                setStatus('ready');
            } else {
                setIsAffiliate(false);
                setStatus('ready');
            }
        } catch (err) {
            setStatus('error');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const res = await fetch('/api/affiliate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, referral_code: referralCode, wallets })
            });
            const data = await res.json();
            if (data.ok) {
                fetchAffiliateData();
            } else {
                setError(data.error || 'Failed to save profile');
            }
        } catch (err) {
            setError('Network error');
        }
        setSaving(false);
    };

    const copyLink = () => {
        if (!profile) return;
        const link = `${window.location.protocol}//${window.location.host}/?ref=${profile.referral_code}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (status === 'loading') return (
        <div className="dash-loading">
            <div className="spinner" />
            <p>Loading Affiliate Dashboard…</p>
            <Styles />
        </div>
    );

    if (!isAffiliate) return (
        <div className="wall-wrap">
            <motion.div className="wall-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="wall-icon">🤝</div>
                <h2>Join our Referral Program</h2>
                <p>Earn crypto by referring friends to Turnip VPN. Manage your referral code and payouts directly from this dashboard.</p>
                
                {error && <div className="err-box">{error}</div>}
                
                <form onSubmit={handleSave} className="affiliate-form">
                    <div className="form-group">
                        <label>Your Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Satoshi" required />
                    </div>
                    <div className="form-group">
                        <label>Custom Code (Optional)</label>
                        <input type="text" value={referralCode} onChange={e => setReferralCode(e.target.value)} placeholder="e.g. SATOSHI24" pattern="[a-zA-Z0-9_-]{3,20}" title="3-20 letters/numbers" />
                    </div>
                    <div className="wallet-signup-grid">
                        {['btc', 'eth', 'sol', 'sui'].map(c => (
                            <div key={c} className="form-group">
                                <label>{c.toUpperCase()} Address</label>
                                <input
                                    type="text"
                                    value={wallets[c]}
                                    onChange={e => setWallets({ ...wallets, [c]: e.target.value })}
                                    placeholder={`${c.toUpperCase()} payout address`}
                                />
                            </div>
                        ))}
                    </div>
                    <button type="submit" className="btn-primary-full" disabled={saving}>
                        {saving ? 'Joining...' : 'Become an Affiliate'} <ArrowRight size={16} />
                    </button>
                </form>
                <button className="btn-ghost-full" style={{ marginTop: '10px' }} onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
            </motion.div>
            <Styles />
        </div>
    );

    return (
        <div className="dashboard container">
            <motion.div className="brand-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Link to="/" className="wordmark">Tur<span>nip</span></Link>
                <span className="brand-tag">// affiliate</span>
            </motion.div>

            <motion.div className="dash-header" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div>
                    <h1>Affiliate Dashboard</h1>
                    <p>Welcome back, {profile?.name}</p>
                </div>
                <div className="header-right">
                    <button className="btn-logout" onClick={() => navigate('/dashboard')}>Dashboard</button>
                </div>
            </motion.div>

            <div className="grid">
                <div>
                    <motion.section className="card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <div className="card-head">
                            <h3>Your Referral Link</h3>
                            <span className="card-sub">Share this to earn</span>
                        </div>
                        
                        <div className="link-box">
                            <code>{`${window.location.protocol}//${window.location.host}/?ref=${profile?.referral_code}`}</code>
                            <button className="copy-btn" onClick={copyLink}>
                                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                            </button>
                        </div>
                    </motion.section>

                    <motion.section className="card mt-16" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <div className="card-head">
                            <h3>Referrals ({stats?.total_referrals || 0})</h3>
                            <span className="card-sub">20% earned: ${stats?.total_amount?.toFixed(2) || '0.00'}</span>
                        </div>
                        
                        {stats?.referrals?.length > 0 ? (
                            <div className="referral-list">
                                {stats.referrals.map((r, i) => (
                                    <div key={i} className="ref-item">
                                        <div className="ref-left">
                                            <div className="ref-plan">{r.plan_name}</div>
                                            <div className="ref-date">{r.created_at?.split('T')[0]}</div>
                                        </div>
                                        <div className="ref-amt">${r.amount?.toFixed(2)}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-data">No referrals yet. Share your link to get started!</p>
                        )}
                    </motion.section>
                </div>

                <div>
                    <motion.section className="card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <div className="card-head">
                            <h3>Payout Wallets</h3>
                            <span className="card-sub">Where we send your earnings</span>
                        </div>
                        
                        {error && <div className="err-box" style={{ marginBottom: '15px' }}>{error}</div>}

                        <form onSubmit={handleSave} className="wallet-form">
                            {['btc', 'eth', 'sol', 'sui'].map(c => (
                                <div key={c} className="form-group">
                                    <label>{c.toUpperCase()} Address</label>
                                    <input 
                                        type="text" 
                                        value={wallets[c]} 
                                        onChange={e => setWallets({...wallets, [c]: e.target.value})} 
                                        placeholder={`Enter ${c.toUpperCase()} wallet address`}
                                    />
                                </div>
                            ))}
                            <button type="submit" className="btn-primary-full mt-10" disabled={saving}>
                                {saving ? 'Saving...' : <><Save size={16} /> Save Wallets</>}
                            </button>
                        </form>
                    </motion.section>
                </div>
            </div>

            <Styles />
        </div>
    );
};

const Styles = () => (
    <style jsx>{`
        /* Reuse styles from Dashboard */
        .dash-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;gap:1rem;color:var(--text3);font-size:14px;font-family:var(--sans)}
        .spinner{width:30px;height:30px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}

        .wall-wrap{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem;background:var(--bg);font-family:var(--sans)}
        .wall-card{background:var(--bg2);border:1px solid var(--border);border-radius:24px;padding:3rem 2.5rem;max-width:440px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.4)}
        .wall-icon{font-size:48px;margin:1.5rem 0}
        .wall-card h2{font-size:22px;font-weight:800;color:var(--text);margin-bottom:.75rem}
        .wall-card p{color:var(--text2);font-size:14px;line-height:1.7;margin-bottom:2rem}

        .dashboard{padding-top:6rem;padding-bottom:5rem;font-family:var(--sans)}
        .brand-row{display:flex;align-items:center;gap:12px;margin-bottom:1.5rem}
        .brand-tag{font-size:11px;font-family:var(--mono);color:var(--text3);background:var(--adim);border:1px solid var(--border);padding:3px 10px;border-radius:100px}
        .dash-header{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:2rem}
        .dash-header h1{font-size:28px;font-weight:800;letter-spacing:-1px;color:var(--text);margin-bottom:4px}
        .dash-header p{color:var(--text3);font-size:13px}
        .header-right{display:flex;align-items:center;gap:10px;flex-wrap:wrap}

        .wordmark{display:inline-block;font-size:20px;font-weight:800;letter-spacing:-.5px;color:var(--text);text-decoration:none}
        .wordmark span{color:var(--accent)}

        .btn-logout{display:flex;align-items:center;gap:6px;background:transparent;border:1px solid var(--border);color:var(--text3);padding:6px 13px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .2s}
        .btn-logout:hover{border-color:var(--accent);color:var(--accent)}
        
        .btn-primary-full{width:100%;background:var(--accent);color:#050810;border:none;border-radius:12px;padding:13px 20px;font-size:14px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-family:var(--sans);transition:background .2s,transform .1s}
        .btn-primary-full:hover{background:var(--accent2);transform:translateY(-1px)}
        .btn-ghost-full{width:100%;background:transparent;border:1px solid var(--border);color:var(--text3);border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans);transition:all .2s}
        .btn-ghost-full:hover{border-color:var(--accent);color:var(--accent)}

        .grid{display:grid;grid-template-columns:1.6fr 1fr;gap:18px}
        @media(max-width:900px){.grid{grid-template-columns:1fr}}

        .card{background:var(--bg2);border:1px solid var(--border);border-radius:18px;padding:1.6rem;box-shadow:0 6px 20px rgba(0,0,0,.18)}
        .card-head{margin-bottom:1.25rem}
        .card-head h3{font-size:14px;font-weight:700;color:var(--text);margin:0 0 2px}
        .card-sub{font-size:11px;color:var(--text3);font-family:var(--mono)}

        .link-box{background:var(--bg);border:1px solid var(--border);border-radius:9px;padding:9px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px}
        .link-box code{color:var(--text);font-size:13px;font-family:var(--mono);word-break:break-all}
        .copy-btn{display:flex;align-items:center;gap:4px;background:var(--surf);border:1px solid var(--border);color:var(--text3);border-radius:6px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;font-family:var(--sans);transition:all .2s}
        .copy-btn:hover{border-color:var(--accent);color:var(--accent);background:var(--adim)}

        .form-group{margin-bottom:15px;text-align:left}
        .form-group label{display:block;font-size:12px;font-weight:600;color:var(--text2);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em}
        .form-group input{width:100%;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;color:var(--text);font-family:var(--mono);font-size:13px}
        .form-group input:focus{outline:none;border-color:var(--accent)}
        .wallet-signup-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 10px}
        @media(max-width:520px){.wallet-signup-grid{grid-template-columns:1fr}}
        
        .mt-16{margin-top:16px}
        .mt-10{margin-top:10px}
        
        .err-box{background:rgba(244,63,94,.07);border:1px solid rgba(244,63,94,.25);color:var(--red);padding:10px;border-radius:8px;font-size:13px;margin-bottom:15px}

        .referral-list{display:flex;flex-direction:column;gap:10px}
        .ref-item{display:flex;align-items:center;justify-content:space-between;padding:12px;background:var(--bg3);border:1px solid var(--border);border-radius:10px}
        .ref-plan{font-size:13px;font-weight:700;color:var(--text)}
        .ref-date{font-size:11px;color:var(--text3);margin-top:2px;font-family:var(--mono)}
        .ref-amt{font-size:14px;font-weight:800;color:var(--accent)}
        .no-data{font-size:13px;color:var(--text3);font-style:italic}
    `}</style>
);

export default Affiliate;
