'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from './Icons';

export interface Repo {
  id: number;
  repoId: number;
  repo: string;
  owner: string;
  name: string;
  isPrivate?: boolean;
}

interface RepoRowProps {
  repo: Repo;
  active: boolean;
  onHover: () => void;
  onPick: () => void;
}

function RepoRow({ repo, active, onHover, onPick }: RepoRowProps) {
  return (
    <button
      onMouseEnter={onHover}
      onClick={onPick}
      style={{
        all: 'unset', boxSizing: 'border-box', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 14, width: '100%',
        padding: '12px 16px', borderRadius: 10,
        background: active ? 'var(--accent-dim)' : 'transparent',
        boxShadow: active ? 'inset 0 0 0 1px var(--accent-glow)' : 'inset 0 0 0 1px transparent',
        transition: 'background .12s ease',
      }}
    >
      <span style={{ color: active ? 'var(--accent)' : 'var(--faintest)', display: 'inline-flex', flex: 'none' }}>
        {repo.isPrivate ? Icon.lock : Icon.globe}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, minWidth: 0 }}>
          <span className="mono" style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--faint)', fontWeight: 400 }}>{repo.owner}/</span>{repo.name}
          </span>
        </div>
        <div className="mono" style={{ display: 'flex', gap: 14, marginTop: 4, fontSize: 11.5, color: 'var(--faintest)', whiteSpace: 'nowrap' }}>
          <span>{repo.isPrivate ? 'private' : 'public'}</span>
          <span>id: {repo.repoId}</span>
        </div>
      </div>
      {active && <span className="kbd" style={{ flex: 'none' }}>↵</span>}
    </button>
  );
}

interface RepoPaletteProps {
  repos: Repo[];
  onPick: (repo: Repo) => void;
  onClose?: () => void;
  modal?: boolean;
}

export function RepoPalette({ repos, onPick, onClose, modal }: RepoPaletteProps) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return repos;
    return repos.filter(r => (r.name + ' ' + r.owner + ' ' + r.repo).toLowerCase().includes(s));
  }, [q, repos]);

  useEffect(() => { setIdx(0); }, [q]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(filtered.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[idx]) onPick(filtered[idx]); }
    else if (e.key === 'Escape' && modal) { e.preventDefault(); onClose?.(); }
  }

  useEffect(() => {
    const el = listRef.current?.children[idx] as HTMLElement | undefined;
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [idx]);

  const inner = (
    <div className="card" style={{
      width: modal ? 'min(720px, 92vw)' : '100%', maxWidth: 760, overflow: 'hidden',
      boxShadow: modal ? 'var(--shadow-pop)' : 'var(--shadow-card)',
      display: 'flex', flexDirection: 'column',
      maxHeight: modal ? '76vh' : 'min(560px, 70vh)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: '1px solid var(--border-soft)' }}>
        <span style={{ color: 'var(--faint)', display: 'inline-flex' }}>{Icon.search}</span>
        <input
          ref={inputRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey}
          placeholder="Search repositories to summarize…"
          style={{ all: 'unset', flex: 1, fontSize: 16, color: 'var(--text)', fontFamily: 'var(--font-sans)' }}
        />
        {q && <button onClick={() => setQ('')} className="kbd" style={{ cursor: 'pointer' }}>clear</button>}
        {modal && <button onClick={onClose} className="kbd" style={{ cursor: 'pointer' }}>esc</button>}
      </div>
      <div ref={listRef} style={{ overflowY: 'auto', overflowX: 'hidden', padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filtered.length === 0 && (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--faint)' }}>
            <div className="mono" style={{ fontSize: 13 }}>No repositories match &ldquo;{q}&rdquo;.</div>
          </div>
        )}
        {filtered.map((r, i) => (
          <RepoRow key={r.id} repo={r} active={i === idx}
            onHover={() => setIdx(i)} onPick={() => onPick(r)} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 16px', borderTop: '1px solid var(--border-soft)', background: 'var(--surface-2)', color: 'var(--faint)', fontSize: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="kbd">↑</span><span className="kbd">↓</span> navigate</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="kbd">↵</span> select</span>
        <span style={{ marginLeft: 'auto' }} className="mono">{filtered.length} of {repos.length}</span>
      </div>
    </div>
  );

  if (!modal) return inner;
  return (
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(6,8,11,.7)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'start center', paddingTop: '11vh', animation: 'fadeIn .18s both' }}
    >
      <div style={{ animation: 'fadeUp .22s cubic-bezier(.2,.8,.2,1) both' }}>{inner}</div>
    </div>
  );
}
