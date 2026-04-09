'use client';

import { useCallback, useRef } from 'react';
import { Scene, SRTEntry } from '@/types';
import { convertScenesFromLegendaIndex } from '@/lib/timing';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const SCENE_COLORS: Record<Scene['type'], string> = {
  title: '#FFB800', content: '#4A9EFF', highlight: '#FF6B4A', outro: '#9B59B6',
};

interface Props {
  scenes: Scene[];
  srtEntries: SRTEntry[];
  totalFrames: number;
  currentFrame: number;
  onFrameChange: (frame: number) => void;
  onSelectScene: (id: string) => void;
}

export default function Timeline({ scenes, srtEntries, totalFrames, currentFrame, onFrameChange, onSelectScene }: Props) {
  const { tr } = useLanguage();
  const trackRef = useRef<HTMLDivElement>(null);

  const scenesWithFrames = srtEntries.length > 0
    ? convertScenesFromLegendaIndex(scenes, srtEntries)
    : [];

  const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    onFrameChange(Math.round(((e.clientX - rect.left) / rect.width) * totalFrames));
  }, [totalFrames, onFrameChange]);

  const playheadPercent = totalFrames > 0 ? (currentFrame / totalFrames) * 100 : 0;

  return (
    <div className="flex flex-col h-full px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="section-label">{tr.timeline.heading}</span>
        <span className="text-xs text-text-muted">{(totalFrames / 30).toFixed(1)}s total</span>
      </div>

      <div
        ref={trackRef}
        className="relative flex-1 rounded-xl overflow-hidden bg-card border border-border cursor-pointer"
        onClick={handleTrackClick}
      >
        {scenesWithFrames.map((scene) => {
          const left = (scene.startFrame / totalFrames) * 100;
          const width = (scene.durationFrames / totalFrames) * 100;
          const color = SCENE_COLORS[scene.type];
          return (
            <div
              key={scene.id}
              className="absolute top-0 bottom-0 flex items-center px-2 overflow-hidden cursor-pointer border-r border-bg/50 hover:opacity-90"
              style={{ left: `${left}%`, width: `${width}%`, backgroundColor: `${color}25`, borderLeft: `3px solid ${color}` }}
              onClick={(e) => { e.stopPropagation(); onSelectScene(scene.id); }}
            >
              <span className="text-[10px] font-bold truncate" style={{ color }}>{scene.title}</span>
            </div>
          );
        })}

        {srtEntries.slice(0, 50).map((entry) => (
          <div key={entry.index} className="absolute top-0 bottom-0 w-px bg-white/5"
            style={{ left: `${(entry.startFrame / totalFrames) * 100}%` }} />
        ))}

        <div className="absolute top-0 bottom-0 w-0.5 bg-accent pointer-events-none z-10"
          style={{ left: `${playheadPercent}%`, boxShadow: '0 0 6px rgba(255,184,0,0.5)' }}>
          <div className="absolute -top-0 -translate-x-1/2 w-3 h-3 bg-accent rounded-sm rotate-45 shadow-gold" />
        </div>
      </div>

      <div className="relative h-4 mt-1">
        {Array.from({ length: 11 }).map((_, i) => (
          <span key={i} className="absolute text-[9px] text-text-muted -translate-x-1/2"
            style={{ left: `${i * 10}%` }}>
            {((totalFrames / 30) * (i / 10)).toFixed(1)}s
          </span>
        ))}
      </div>
    </div>
  );
}
