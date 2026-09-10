'use client';

import React from 'react';
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
}

export function TopBar({ repo, user, onSwitch }: TopBarProps) {
  const initials = user?.name?.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} style={{ width: 30, height: 30, borderRadius: 99, objectFit: 'cover' }} />
            ) : (
              <span style={{ width: 30, height: 30, borderRadius: 99, background: 'linear-gradient(135deg, var(--accent-bright), var(--viz-blue))', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-display)' }}>
                {initials}
              </span>
            )}
            <div style={{ lineHeight: 1.15, whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{user.name}</div>
              {user.login && <div className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>@{user.login}</div>}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
