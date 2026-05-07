import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Cookie } from 'lucide-react';

const STORAGE_KEY = 'turnip_cookie_consent';

const CookieBanner = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Small delay so it doesn't flash on first render
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
                    background: var(--bg2, #0f1629);
                    border: 1px solid rgba(0, 200, 150, 0.25);
                    border-radius: 16px;
                    padding: 16px 20px;
                    display: flex; align-items: center; justify-content: space-between; gap: 16px;
                    box-shadow: 0 12px 48px rgba(0,0,0,0.45);
                    z-index: 9999;
                    animation: slideUp 0.35s cubic-bezier(0.16,1,0.3,1);
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                .cb-left { display: flex; align-items: flex-start; gap: 14px; flex: 1; min-width: 0; }
                .cb-icon { width: 36px; height: 36px; background: rgba(0,200,150,0.1); border: 1px solid rgba(0,200,150,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #00c896; flex-shrink: 0; margin-top: 2px; }
                .cb-text strong { display: block; font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 4px; }
                .cb-text p { font-size: 12px; color: #8892a4; line-height: 1.6; margin: 0; }
                .cb-text p em { font-style: normal; color: #00c896; font-weight: 600; }
                .cb-text a { color: #00c896; text-decoration: none; font-weight: 600; }
                .cb-text a:hover { text-decoration: underline; }

                .cb-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
                .cb-accept {
                    display: flex; align-items: center; gap: 7px;
                    background: #00c896; color: #050810;
                    border: none; border-radius: 9px;
                    padding: 9px 18px; font-size: 13px; font-weight: 700;
                    cursor: pointer; white-space: nowrap; transition: opacity .2s;
                }
                .cb-accept:hover { opacity: .85; }
                .cb-dismiss {
                    background: transparent; border: 1px solid rgba(255,255,255,0.1);
                    color: #8892a4; border-radius: 8px; padding: 8px;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    transition: all .2s;
                }
                .cb-dismiss:hover { border-color: rgba(255,255,255,0.25); color: #e2e8f0; }

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
