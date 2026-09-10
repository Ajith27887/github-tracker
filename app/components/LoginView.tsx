'use client';

import React, { useState, useEffect } from 'react';

function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ display: 'block' }}>
      <rect x="1.2" y="1.2" width="29.6" height="29.6" rx="9" fill="var(--surface-2)" stroke="var(--border-strong)" />
      <path d="M11 9.5 6.5 16 11 22.5" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 9.5 25.5 16 21 22.5" stroke="var(--faint)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 21.5 18 10.5" stroke="var(--accent-bright)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ size = 30, type = 19 }: { size?: number; type?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Logo size={size} />
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: type, letterSpacing: '-.01em' }}>
        Recap<span style={{ color: 'var(--accent)' }}>.</span>
      </span>
    </div>
  );
}

function GoogleIcon({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 7.9-21l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.5z"/>
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.5 5A20 20 0 0 0 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C39.9 36.5 44 31 44 24c0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

function GitHubIcon({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1.5A10.5 10.5 0 0 0 8.7 22c.5.1.7-.2.7-.5v-2c-2.9.6-3.5-1.2-3.5-1.2-.5-1.2-1.2-1.5-1.2-1.5-.9-.6 0-.6 0-.6 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.3-.3-4.7-1.2-4.7-5.1 0-1.1.4-2 1-2.7 0-.3-.4-1.4.2-2.8 0 0 .9-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .6 1.4.2 2.5.1 2.8.7.7 1 1.6 1 2.7 0 3.9-2.3 4.8-4.6 5 .4.3.7 1 .7 2v3c0 .3.2.6.7.5A10.5 10.5 0 0 0 12 1.5Z"/>
    </svg>
  );
}

function TerminalPreview() {
  const lines = [
    { t: '$ recap analyze horizon-web --since 7d', c: 'var(--text)' },
    { t: '→ syncing 142 commits · 18 PRs · 23 issues', c: 'var(--faint)' },
    { t: '→ asking Gemini to summarize…', c: 'var(--faint)' },
    { t: '', c: '' },
    { t: '✓ Heavy week — shipped the billing dashboard', c: 'var(--accent-bright)' },
    { t: '  and cleared the Q3 accessibility backlog.', c: 'var(--muted)' },
    { t: '  Activity ▲38% · review latency < 4h', c: 'var(--muted)' },
    { t: '', c: '' },
    { t: '  commits  ▇▇▃▇█▅█  142   ▲38%', c: 'var(--accent)' },
    { t: '  PRs      ▃▅▇▅▇██   18   ▲12%', c: 'var(--viz-purple)' },
    { t: '  issues   █▇▅▃▃▂▁   23   ▼6%', c: 'var(--viz-blue)' },
  ];
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= lines.length) return;
    const id = setTimeout(() => setN(n + 1), n === 3 || n === 7 ? 120 : 360);
    return () => clearTimeout(id);
  }, [n]);
  return (
    <div className="card" style={{ width: 'min(440px, 100%)', boxShadow: 'var(--shadow-pop)', overflow: 'hidden', transform: 'rotate(.3deg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: '1px solid var(--border-soft)', background: 'var(--surface-2)' }}>
        <span style={{ width: 11, height: 11, borderRadius: 99, background: '#ff5f57' }} />
        <span style={{ width: 11, height: 11, borderRadius: 99, background: '#febc2e' }} />
        <span style={{ width: 11, height: 11, borderRadius: 99, background: '#28c840' }} />
        <span className="mono" style={{ marginLeft: 8, fontSize: 12, color: 'var(--faint)' }}>recap — zsh</span>
      </div>
      <div className="mono" style={{ padding: '16px 18px', fontSize: 12.5, lineHeight: 1.9, minHeight: 280 }}>
        {lines.slice(0, n).map((l, i) => (
          <div key={i} className={i === n - 1 && l.t ? 'cursor-blink' : ''} style={{ color: l.c, whiteSpace: 'pre', minHeight: l.t ? 'auto' : 10 }}>{l.t}</div>
        ))}
      </div>
    </div>
  );
}

interface LoginViewProps {
  onAuth: () => void;
}

export function LoginView({ onAuth }: LoginViewProps) {
  return (
    <div className="fade-up" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.05fr .95fr', alignItems: 'stretch' }}>
      {/* left: pitch + auth */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '44px clamp(40px, 6vw, 96px)' }}>
        <Wordmark size={34} type={22} />
        <div style={{ maxWidth: 470 }}>
          <div className="chip" style={{ marginBottom: 22 }}>
            <span style={{ color: 'var(--accent)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6z" opacity=".95"/>
                <path d="M19 14l.8 2.6L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.4z"/>
              </svg>
            </span> Powered by Gemini
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(34px, 4.4vw, 54px)', lineHeight: 1.04, letterSpacing: '-.02em', margin: '0 0 18px' }}>
            Know what your repos<br />did this week.
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 17, lineHeight: 1.6, margin: '0 0 34px', maxWidth: 420 }}>
            Connect GitHub and get a clear, plain-English summary of every commit, PR and issue — with the numbers that matter, on demand.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
            <button
              className="btn btn-accent"
              style={{ height: 50, fontSize: 15, background: '#fff', color: '#1a1a1a', boxShadow: '0 6px 22px rgba(0,0,0,.4)' }}
              onClick={onAuth}
            >
              <GoogleIcon /> Continue with Google
            </button>
            <button
              className="btn"
              style={{ height: 50, fontSize: 15, background: '#161b22', borderColor: 'var(--border-strong)' }}
              onClick={onAuth}
            >
              <GitHubIcon /> Continue with GitHub
            </button>
          </div>
          <p style={{ color: 'var(--faintest)', fontSize: 12.5, marginTop: 20, lineHeight: 1.6 }}>
            Read-only access. We never write to your repositories.<br />By continuing you agree to the Terms &amp; Privacy Policy.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 22, color: 'var(--faintest)', fontSize: 12.5 }} className="mono">
          <span>SOC 2 Type II</span><span>·</span><span>OAuth 2.0</span><span>·</span><span>No code stored</span>
        </div>
      </div>

      {/* right: terminal preview */}
      <div style={{ position: 'relative', display: 'grid', placeItems: 'center', padding: 40, borderLeft: '1px solid var(--border-soft)', background: 'linear-gradient(160deg, rgba(63,185,80,.05), transparent 40%)' }}>
        <TerminalPreview />
      </div>
    </div>
  );
}
