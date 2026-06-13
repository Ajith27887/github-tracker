'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from './Icons';
import { StatCard, BarChart, Donut, Sparkline } from './Charts';
import type { Repo } from './RepoPalette';

export interface SummaryData {
  narrative: string;
  themes: string[];
  next: string[];
  stats: { commits: number; prs: number; issues: number; contributors: number };
  deltas: { commits: number; prs: number; issues: number; contributors: number };
  commitDays: number[];
  breakdown: { merged: number; opened: number; reviewing: number };
  issueSplit: { closed: number; opened: number; stale: number };
  contributors: Array<{ h: string; c: number }>;
}

function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) {
      parts.push(<strong key={m.index} style={{ color: 'var(--text)', fontWeight: 700 }}>{tok.slice(2, -2)}</strong>);
    } else {
      parts.push(
        <code key={m.index} className="mono" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 5, padding: '1px 6px', fontSize: '0.88em', color: 'var(--accent-bright)' }}>
          {tok.slice(1, -1)}
        </code>
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export function GeneratingPanel({ repo }: { repo: Repo }) {
  const steps = [
    `Fetching ${repo.name} activity from GitHub…`,
    'Parsing recent commits…',
    'Clustering changes into themes…',
    'Asking Gemini to write the summary…',
    'Computing trends vs. previous period…',
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (i >= steps.length) return;
    const id = setTimeout(() => setI(i + 1), 520);
    return () => clearTimeout(id);
  }, [i]);
  return (
    <div className="fade-up" style={{ maxWidth: 760, margin: '0 auto', padding: '8px 0' }}>
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <span className="gem-badge">
            <span style={{ color: 'var(--viz-blue)' }}>{Icon.spark}</span> Gemini is analyzing
          </span>
          <span className="spin" style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: 99, border: '2px solid var(--surface-3)', borderTopColor: 'var(--accent)' }} />
        </div>
        <div className="mono" style={{ fontSize: 13, lineHeight: 2.2, marginBottom: 20 }}>
          {steps.slice(0, i).map((s, k) => (
            <div key={k} style={{ color: k === i - 1 ? 'var(--text)' : 'var(--accent-bright)', animation: 'fadeUp .25s both' }}>
              <span style={{ color: k === i - 1 ? 'var(--accent)' : 'var(--accent-bright)', marginRight: 8 }}>{k === i - 1 ? '▸' : '✓'}</span>{s}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {[100, 94, 88].map((w, k) => (
            <div key={k} style={{ height: 12, width: w + '%', borderRadius: 6, background: 'linear-gradient(90deg, var(--surface-2), var(--surface-3), var(--surface-2))', backgroundSize: '200% 100%', animation: `shimmer 1.3s linear ${k * 0.12}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '2px 0 14px' }}>
      <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>{children}</h3>
      {hint && <span className="mono" style={{ fontSize: 11.5, color: 'var(--faintest)' }}>{hint}</span>}
    </div>
  );
}

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CONTRIB_COLORS = ['var(--viz-green)', 'var(--viz-purple)', 'var(--viz-blue)', 'var(--viz-amber)', 'var(--viz-pink)'];

interface SummaryViewProps {
  repo: Repo;
  data: SummaryData;
  tf: '7d' | '30d';
  setTf: (tf: '7d' | '30d') => void;
  onRegenerate: () => void;
}

export function SummaryView({ repo, data, tf, setTf, onRegenerate }: SummaryViewProps) {
  const gap = 18;
  const pad = 24;

  const [shown, setShown] = useState(0);
  useEffect(() => { setShown(0); }, [data]);
  useEffect(() => {
    if (shown >= data.narrative.length) return;
    const step = Math.max(2, Math.round(data.narrative.length / 90));
    const id = setTimeout(() => setShown(s => Math.min(data.narrative.length, s + step)), 16);
    return () => clearTimeout(id);
  }, [shown, data]);
  const narr = data.narrative.slice(0, shown);
  const typing = shown < data.narrative.length;

  const hasContributors = data.contributors && data.contributors.length > 0;
  const hasPRs = data.stats.prs > 0 || data.breakdown.merged > 0;
  const hasIssues = data.stats.issues > 0;

  return (
    <div className="fade-up" style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--accent)', display: 'inline-flex' }}>
              {repo.isPrivate ? Icon.lock : Icon.globe}
            </span>
            <h1 className="mono" style={{ margin: 0, fontSize: 25, fontWeight: 700, letterSpacing: '-.01em', whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--faint)', fontWeight: 400 }}>{repo.owner}/</span>{repo.name}
            </h1>
          </div>
          <div className="mono" style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12.5, color: 'var(--faint)', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              {repo.isPrivate ? 'private' : 'public'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', padding: 3, gap: 3, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 9 }}>
            {([['7d', '7 days'], ['30d', '30 days']] as const).map(([k, l]) => (
              <button key={k} onClick={() => setTf(k)} className="mono"
                style={{ all: 'unset', cursor: 'pointer', padding: '7px 13px', borderRadius: 7, fontSize: 12.5, fontWeight: 600,
                  color: tf === k ? 'var(--accent-ink)' : 'var(--muted)',
                  background: tf === k ? 'linear-gradient(180deg, var(--accent-bright), var(--accent))' : 'transparent' }}>
                {l}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost" onClick={onRegenerate} title="Regenerate" style={{ width: 42, padding: 0 }}>{Icon.refresh}</button>
        </div>
      </div>

      {/* narrative */}
      <div className="card" style={{ padding: pad, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span className="gem-badge"><span style={{ color: 'var(--viz-blue)' }}>{Icon.spark}</span> Gemini summary</span>
          <span className="mono" style={{ fontSize: 11.5, color: 'var(--faintest)' }}>{tf === '30d' ? 'last 30 days' : 'last 7 days'}</span>
          <button className="btn btn-ghost" style={{ marginLeft: 'auto', height: 32, fontSize: 12.5, padding: '0 12px' }}
            onClick={() => navigator.clipboard?.writeText(data.narrative)}>
            {Icon.copy} Copy
          </button>
        </div>
        <p className={typing ? 'cursor-blink' : ''} style={{ margin: 0, fontSize: 17, lineHeight: 1.72, color: 'var(--muted)', maxWidth: '72ch' }}>
          <RichText text={narr} />
        </p>
      </div>

      {/* stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap }}>
        <StatCard label="Commits" value={data.stats.commits} delta={data.deltas.commits} color="var(--viz-green)" icon={Icon.commit}
          spark={data.commitDays} />
        <StatCard label="PRs merged" value={data.stats.prs} delta={data.deltas.prs} color="var(--viz-purple)" icon={Icon.pr}
          spark={[1,2,2,3,3,4,data.stats.prs || 0]} />
        <StatCard label="Issues closed" value={data.stats.issues} delta={data.deltas.issues} color="var(--viz-blue)" icon={Icon.issue}
          spark={[2,3,3,2,2,1,data.stats.issues || 0]} />
        <StatCard label="Contributors" value={data.stats.contributors} delta={data.deltas.contributors} color="var(--viz-amber)" icon={Icon.people}
          spark={[1,1,2,2,3,3,data.stats.contributors || 0]} />
      </div>

      {/* charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: hasPRs ? '1.7fr 1fr' : '1fr', gap }}>
        <div className="card" style={{ padding: pad }}>
          <SectionTitle hint={tf === '30d' ? 'commits / week' : 'commits / day'}>Commit activity</SectionTitle>
          <BarChart data={data.commitDays} labels={tf === '30d' ? ['W1','W2','W3','W4','W5','W6','W7'] : WEEK} color="var(--accent)" />
        </div>
        {hasPRs && (
          <div className="card" style={{ padding: pad }}>
            <SectionTitle>Pull requests</SectionTitle>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <Donut segments={[
                { value: data.breakdown.merged, color: 'var(--viz-purple)' },
                { value: data.breakdown.opened - data.breakdown.merged, color: 'var(--accent)' },
                { value: data.breakdown.reviewing, color: 'var(--viz-amber)' },
              ]} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                {([['Merged', data.breakdown.merged, 'var(--viz-purple)'], ['Opened', data.breakdown.opened, 'var(--accent)'], ['In review', data.breakdown.reviewing, 'var(--viz-amber)']] as const).map(([l, v, c]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: c, flex: 'none' }} />
                    <span style={{ color: 'var(--muted)' }}>{l}</span>
                    <span className="mono" style={{ marginLeft: 'auto', fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* contributors + themes */}
      <div style={{ display: 'grid', gridTemplateColumns: hasContributors ? '1fr 1.4fr' : '1fr', gap }}>
        {hasContributors && (
          <div className="card" style={{ padding: pad }}>
            <SectionTitle hint="by commits">Top contributors</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {data.contributors.map((c, i) => {
                const max = data.contributors[0]?.c || 1;
                const col = CONTRIB_COLORS[i % 5];
                return (
                  <div key={c.h} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, flex: 'none', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, color: '#fff', background: `linear-gradient(135deg, ${col}, color-mix(in srgb, ${col} 50%, #000))` }}>
                      {c.h[0].toUpperCase()}
                    </span>
                    <span className="mono" style={{ fontSize: 13, width: 60, color: 'var(--text)' }}>@{c.h}</span>
                    <div style={{ flex: 1, height: 8, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(c.c / max) * 100}%`, borderRadius: 99, background: col, animation: 'barGrow .6s ease both' }} />
                    </div>
                    <span className="mono" style={{ fontSize: 12.5, color: 'var(--faint)', width: 32, textAlign: 'right' }}>{c.c}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {data.themes && data.themes.length > 0 && (
          <div className="card" style={{ padding: pad }}>
            <SectionTitle>Key changes &amp; themes</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.themes.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--accent)', marginTop: 2, flex: 'none' }}>{Icon.check}</span>
                  <span style={{ fontSize: 14.5, lineHeight: 1.5, color: 'var(--muted)' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* next actions */}
      {data.next && data.next.length > 0 && (
        <div className="card" style={{ padding: pad, background: 'linear-gradient(120deg, var(--accent-dim), transparent 55%), var(--surface)' }}>
          <SectionTitle hint="from Gemini">Suggested next actions</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap }}>
            {data.next.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 16px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <span style={{ width: 26, height: 26, flex: 'none', borderRadius: 7, display: 'grid', placeItems: 'center', background: 'var(--accent-dim)', color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
                <span style={{ fontSize: 14, lineHeight: 1.45, color: 'var(--text)' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', padding: '4px 0 8px', color: 'var(--faintest)', fontSize: 12 }} className="mono">
        Generated by Gemini · {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · Read-only
      </div>
    </div>
  );
}
