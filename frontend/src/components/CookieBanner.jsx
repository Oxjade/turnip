import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Cookie } from 'lucide-react';

const STORAGE_KEY = 'turnip_cookie_consent';

const CookieBanner = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const accept = () => {
        localStorage.setItem(STORAGE_KEY, 'accepted');
        setVisible(false);
    };

    const dismiss = () => {
        localStorage.setItem(STORAGE_KEY, 'dismissed');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <>
            <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
                <div className="cb-left">
                    <span className="cb-icon"><Cookie size={18} /></span>
                    <div className="cb-text">
                        <strong>Cookies &amp; Session Notice</strong>
                        <p>
                            We use a secure, HTTP-only session cookie to keep you logged in. We do <em>not</em> use
                            analytics, advertising, or third-party tracking cookies. Your VPN traffic is never logged.{' '}
                            <a href="/privacy">Privacy Policy</a>
                        </p>
                    </div>
                </div>
                <div className="cb-actions">
                    <button className="cb-accept" onClick={accept}>
                        <ShieldCheck size={14} /> Accept &amp; Continue
                    </button>
                    <button className="cb-dismiss" onClick={dismiss} aria-label="Dismiss">
                        <X size={14} />
                    </button>
                </div>
            </div>

            <style jsx>{`
                .cookie-banner {
                    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
                    width: calc(100% - 40px); max-width: 860px;
                    background: var(--bg2);
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    padding: 16px 20px;
                    display: flex; align-items: center; justify-content: space-between; gap: 16px;
                    box-shadow: 0 12px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(168,85,247,0.08);
                    z-index: 9999;
                    animation: slideUp 0.35s cubic-bezier(0.16,1,0.3,1);
                    font-family: var(--sans);
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                .cb-left { display: flex; align-items: flex-start; gap: 14px; flex: 1; min-width: 0; }
                .cb-icon {
                    width: 36px; height: 36px;
                    background: var(--adim);
                    border: 1px solid var(--border);
                    border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                    color: var(--accent); flex-shrink: 0; margin-top: 2px;
                }
                .cb-text strong { display: block; font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
                .cb-text p { font-size: 12px; color: var(--text2); line-height: 1.6; margin: 0; }
                .cb-text p em { font-style: normal; color: var(--accent); font-weight: 600; }
                .cb-text a { color: var(--accent); text-decoration: none; font-weight: 600; }
                .cb-text a:hover { text-decoration: underline; }

                .cb-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
                .cb-accept {
                    display: flex; align-items: center; gap: 7px;
                    background: var(--accent); color: #050810;
                    border: none; border-radius: 9px;
                    padding: 9px 18px; font-size: 13px; font-weight: 700;
                    cursor: pointer; white-space: nowrap;
                    font-family: var(--sans);
                    transition: background 0.2s, transform 0.1s;
                }
                .cb-accept:hover { background: var(--accent2); transform: translateY(-1px); }
                .cb-dismiss {
                    background: transparent; border: 1px solid var(--border);
                    color: var(--text3); border-radius: 8px; padding: 8px;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    transition: all .2s;
                }
                .cb-dismiss:hover { border-color: var(--accent); color: var(--accent); }

                @media (max-width: 640px) {
                    .cookie-banner { flex-direction: column; align-items: flex-start; bottom: 12px; }
                    .cb-actions { width: 100%; }
                    .cb-accept { flex: 1; justify-content: center; }
                }
            `}</style>
        </>
    );
};

export default CookieBanner;
