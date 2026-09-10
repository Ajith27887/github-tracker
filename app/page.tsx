'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LoginView } from './components/LoginView';
import { RepoPalette } from './components/RepoPalette';
import { TopBar } from './components/TopBar';
import { GeneratingPanel, SummaryView } from './components/SummaryView';
import type { Repo } from './components/RepoPalette';
import type { SummaryData } from './components/SummaryView';

interface User {
  id: number;
  name: string;
  login: string;
  avatarUrl?: string;
}

type Stage = 'loading' | 'login' | 'app';
type Phase = 'empty' | 'generating' | 'done' | 'error';

function Hero({ repos, onPick }: { repos: Repo[]; onPick: (r: Repo) => void }) {
  return (
    <div className="fade-up" style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, paddingTop: 18 }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, letterSpacing: '-.02em', margin: '0 0 8px' }}>
          Which repo should I summarize?
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15.5, margin: 0 }}>
          Pick a repository and Gemini will recap its recent activity.
        </p>
      </div>
      <RepoPalette repos={repos} onPick={onPick} />
    </div>
  );
}

export default function App() {
  const [stage, setStage] = useState<Stage>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [phase, setPhase] = useState<Phase>('empty');
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [tf, setTf] = useState<'7d' | '30d'>('7d');

  const loadRepos = useCallback(async () => {
    try {
      const res = await fetch('/api/repo/', { credentials: 'include' });
      if (!res.ok) return;
      const data: Array<{ id: number; repoId: number; repo: string }> = await res.json();
      setRepos(data.map(r => ({
        ...r,
        owner: r.repo.split('/')[0] || '',
        name: r.repo.split('/')[1] || r.repo,
        isPrivate: false,
      })));
    } catch {}
  }, []);

  useEffect(() => {
    fetch('/api/user/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then((data: User | null) => {
        if (data) {
          setUser(data);
          setStage('app');
          loadRepos();
        } else {
          setStage('login');
        }
      })
      .catch(() => setStage('login'));
  }, [loadRepos]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && stage === 'app') {
        e.preventDefault();
        setPaletteOpen(p => !p);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stage]);

  async function fetchSummary(repo: Repo, timeframe: '7d' | '30d') {
    setPhase('generating');
    setSummaryData(null);
    try {
      const res = await fetch(`/api/summary/?repoId=${repo.id}&tf=${timeframe}`, { credentials: 'include' });
      if (!res.ok) {
        setPhase('error');
        return;
      }
      const data: SummaryData = await res.json();
      setSummaryData(data);
      setPhase('done');
    } catch {
      setPhase('error');
    }
  }

  function pickRepo(r: Repo) {
    setSelectedRepo(r);
    setPaletteOpen(false);
    fetchSummary(r, tf);
  }

  function regenerate() {
    if (selectedRepo) fetchSummary(selectedRepo, tf);
  }

  function handleTfChange(newTf: '7d' | '30d') {
    setTf(newTf);
    if (selectedRepo && phase === 'done') fetchSummary(selectedRepo, newTf);
  }

  if (stage === 'loading') {
    return (
      <>
        <div className="app-bg" />
        <div style={{ position: 'relative', zIndex: 1, height: '100vh', display: 'grid', placeItems: 'center' }}>
          <span className="spin" style={{ width: 24, height: 24, borderRadius: 99, border: '2px solid var(--surface-3)', borderTopColor: 'var(--accent)' }} />
        </div>
      </>
    );
  }

  if (stage === 'login') {
    return (
      <>
        <div className="app-bg" />
        <LoginView onAuth={() => { window.location.href = '/api/auth/'; }} />
      </>
    );
  }

  return (
    <>
      <div className="app-bg" />
      <div style={{ position: 'relative', zIndex: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <TopBar repo={selectedRepo} user={user} onSwitch={() => setPaletteOpen(true)} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '30px 24px 60px' }}>
          {!selectedRepo && <Hero repos={repos} onPick={pickRepo} />}
          {selectedRepo && phase === 'generating' && <GeneratingPanel repo={selectedRepo} />}
          {selectedRepo && phase === 'done' && summaryData && (
            <SummaryView
              repo={selectedRepo}
              data={summaryData}
              tf={tf}
              setTf={handleTfChange}
              onRegenerate={regenerate}
            />
          )}
          {selectedRepo && phase === 'error' && (
            <div className="fade-up" style={{ maxWidth: 760, margin: '0 auto' }}>
              <div className="card" style={{ padding: 28 }}>
                <p style={{ color: 'var(--muted)', margin: '0 0 16px' }}>Failed to generate summary. Gemini may be busy.</p>
                <button className="btn" onClick={regenerate}>Retry</button>
              </div>
            </div>
          )}
        </main>
      </div>

      {paletteOpen && stage === 'app' && (
        <RepoPalette modal repos={repos} onPick={pickRepo} onClose={() => setPaletteOpen(false)} />
      )}
    </>
  );
}
