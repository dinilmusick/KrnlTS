'use client';

import { useEffect, useRef, useState } from 'react';
import { TilesMenu } from '@ultrst-armada/floks/ui';
import { luthFetch } from '../../../../../libraries/client/luthAuthClient.js';
import { PerformanceWorkspace } from '../../../../components/performance/PerformanceWorkspace.js';
import { SectionGraphWorkspace } from '../../../../components/performance/SectionGraphWorkspace.js';
import { SongGraphWorkspace } from '../../../../components/performance/SongGraphWorkspace.js';
import {
  createPerformanceDefinition,
  type PerformanceDefinition,
} from '../../../../components/performance/performanceDomain.js';
import { calculateSectionDuration } from '../../../../components/performance/performanceTiming.js';

type View =
  | { kind: 'list' }
  | { kind: 'performance' }
  | { kind: 'song' }
  | { kind: 'section'; sectionId: string };

async function loadPerformance(workspaceId: string): Promise<PerformanceDefinition | null> {
  const response = await luthFetch(
    `/api/performance?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String(payload?.error ?? `Performance load failed (${response.status})`));
  return payload.performance ?? null;
}

async function savePerformance(workspaceId: string, performance: PerformanceDefinition): Promise<void> {
  const response = await luthFetch(
    `/api/performance?workspaceId=${encodeURIComponent(workspaceId)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ performance }),
    },
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String(payload?.error ?? `Performance save failed (${response.status})`));
}

export default function PerformancesTab({ workspaceId = 'default' }: { workspaceId?: string }) {
  const [view, setView] = useState<View>({ kind: 'list' });
  const [performance, setPerformance] = useState<PerformanceDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hydrated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    hydrated.current = false;
    setLoading(true);
    setError(null);
    void loadPerformance(workspaceId)
      .then((stored) => {
        if (!active) return;
        setPerformance(stored ?? createPerformanceDefinition('performance-1', 'Performance One'));
        hydrated.current = true;
      })
      .catch((cause) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : String(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [workspaceId]);

  useEffect(() => {
    if (!hydrated.current || !performance) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void savePerformance(workspaceId, performance).catch((cause) => {
        setError(cause instanceof Error ? cause.message : String(cause));
      });
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [workspaceId, performance]);

  if (loading) return <section style={{ padding: 24 }}>Loading performances…</section>;
  if (!performance) return <section role="alert" style={{ padding: 24 }}>{error ?? 'Performance unavailable.'}</section>;

  const song = performance.songs[0];
  const selectedSection = song?.sections.find(
    (section) => view.kind === 'section' && section.id === view.sectionId,
  );

  const updatePerformance = (next: PerformanceDefinition) => {
    setPerformance(next);
    setError(null);
  };

  if (view.kind === 'list') {
    return (
      <section style={{ height: '100%', overflow: 'auto', padding: 24 }}>
        {error && <p role="alert">{error}</p>}
        <TilesMenu
          id="kone.performances.menu"
          title="Performances"
          subtitle="Select a performance"
          tiles={[{ id: performance.id, title: performance.name, description: 'Saved in workspace storage' }]}
          onSelect={() => setView({ kind: 'performance' })}
          emptyText="No performances found."
        />
      </section>
    );
  }

  if (!song) return <section role="alert" style={{ padding: 24 }}>Performance has no songs.</section>;

  if (view.kind === 'section' && selectedSection) {
    return (
      <SectionGraphWorkspace
        performance={performance}
        song={song}
        songId={song.id}
        section={selectedSection}
        instruments={song.instruments}
        onBack={() => setView({ kind: 'song' })}
        onSectionChange={(section) => updatePerformance({
          ...performance,
          songs: performance.songs.map((item) => item.id === song.id
            ? { ...item, sections: item.sections.map((current) => current.id === section.id ? section : current) }
            : item),
        })}
        onGraphChange={(nodes, edges) => {
          const duration = calculateSectionDuration(nodes, edges).duration;
          updatePerformance({
            ...performance,
            songs: performance.songs.map((item) => item.id === song.id
              ? {
                  ...item,
                  sections: item.sections.map((current) => current.id === selectedSection.id
                    ? { ...current, graph: { nodes, edges }, duration }
                    : current),
                }
              : item),
          });
        }}
      />
    );
  }

  if (view.kind === 'song') {
    return (
      <SongGraphWorkspace
        performance={performance}
        song={song}
        onBack={() => setView({ kind: 'performance' })}
        onSectionDoubleClick={(sectionId) => setView({ kind: 'section', sectionId })}
        onSongChange={(next) => updatePerformance({
          ...performance,
          songs: performance.songs.map((item) => item.id === next.id ? next : item),
        })}
      />
    );
  }

  return (
    <PerformanceWorkspace
      performance={performance}
      onPerformanceChange={updatePerformance}
      onSongDoubleClick={() => setView({ kind: 'song' })}
      onBack={() => setView({ kind: 'list' })}
    />
  );
}
