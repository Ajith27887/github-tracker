'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Wordmark } from './LoginView';
import { Icon } from './Icons';
import type { Repo } from './RepoPalette';

interface User {
  id: number;
  name: string;
  login: string;
  avatarUrl?: string;
}

interface TopBarProps {
  repo: Repo | null;
  user: User | null;
  onSwitch: () => void;
  onLogout: () => void;
  loggingOut?: boolean;
}

export function TopBar({ repo, user, onSwitch, onLogout, loggingOut = false }: TopBarProps) {
  const initials = user?.name?.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const avatar = user?.avatarUrl ? (
    <img src={user.avatarUrl} alt={user.name} style={{ width: 30, height: 30, borderRadius: 99, objectFit: 'cover' }} />
  ) : (
    <span style={{ width: 30, height: 30, borderRadius: 99, background: 'linear-gradient(135deg, var(--accent-bright), var(--viz-blue))', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-display)' }}>
      {initials}
    </span>
  );

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 20,
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '0 24px', height: 60,
      borderBottom: '1px solid var(--border-soft)',
      background: 'color-mix(in srgb, var(--bg) 82%, transparent)',
      backdropFilter: 'blur(12px)',
    }}>
      <Wordmark size={28} type={18} />
      <span style={{ color: 'var(--faintest)', margin: '0 2px' }}>/</span>

      {/* repo switcher */}
      <button onClick={onSwitch} className="btn" style={{ height: 38, background: 'var(--surface)', borderColor: 'var(--border)', paddingLeft: 12, paddingRight: 10, gap: 10, maxWidth: 320 }}>
        {repo ? (
          <>
            <span style={{ display: 'inline-flex', color: 'var(--accent)' }}>
              {repo.isPrivate ? Icon.lock : Icon.globe}
            </span>
            <span className="mono" style={{ fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--faint)' }}>{repo.owner}/</span>{repo.name}
            </span>
          </>
        ) : (
          <span style={{ color: 'var(--muted)', fontSize: 13.5 }}>Select repository…</span>
        )}
        <span style={{ color: 'var(--faint)', marginLeft: 4 }}>{Icon.chevronDown}</span>
      </button>
      <span className="kbd" style={{ marginLeft: -6 }}>⌘K</span>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
        <span className="chip" style={{ color: 'var(--muted)' }}>
          <span style={{ color: 'var(--accent)' }}>{Icon.spark}</span> Gemini
        </span>
        {user && (
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Open profile menu"
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                height: 44, padding: '0 6px 0 8px',
                background: menuOpen ? 'var(--surface-2)' : 'transparent',
                border: '1px solid', borderColor: menuOpen ? 'var(--border)' : 'transparent',
                borderRadius: 10, cursor: 'pointer', color: 'var(--text)',
                transition: 'background .15s ease, border-color .15s ease',
              }}
            >
              {avatar}
              <div style={{ lineHeight: 1.15, whiteSpace: 'nowrap', textAlign: 'left' }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{user.name}</div>
                {user.login && <div className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>@{user.login}</div>}
              </div>
              <span style={{ color: 'var(--faint)', marginLeft: 2, display: 'inline-flex' }}>{Icon.chevronDown}</span>
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="menu-pop fade-up"
                style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 190, zIndex: 40 }}
              >
                <button
                  type="button"
                  role="menuitem"
                  className="menu-item danger"
                  disabled={loggingOut}
                  onClick={() => { if (!loggingOut) onLogout(); }}
                >
                  <span style={{ display: 'inline-flex' }}>{Icon.logout}</span>
                  {loggingOut ? 'Logging out…' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
