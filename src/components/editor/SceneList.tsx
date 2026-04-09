'use client';

import { Scene, SRTEntry } from '@/types';
import { convertScenesFromLegendaIndex } from '@/lib/timing';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const SCENE_COLORS: Record<Scene['type'], string> = {
  title:     '#FFB800',
  content:   '#4A9EFF',
  highlight: '#FF6B4A',
  outro:     '#9B59B6',
};

const SCENE_ICONS: Record<Scene['type'], string> = {
  title:     '🎯',
  content:   '📝',
  highlight: '⚡',
  outro:     '🎬',
};

const SENTIMENT_COLORS: Record<Scene['sentiment'], string> = {
  positive: '#22C55E',
  negative: '#EF4444',
  neutral:  '#6B7280',
  exciting: '#F59E0B',
};

interface Props {
  scenes: Scene[];
  srtEntries: SRTEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  currentFrame: number;
}

export default function SceneList({ scenes, srtEntries, selectedId, onSelect, currentFrame }: Props) {
  const { tr, lang } = useLanguage();

  const scenesWithFrames = srtEntries.length > 0
    ? convertScenesFromLegendaIndex(scenes, srtEntries)
    : scenes.map((s) => ({ ...s, startFrame: 0, endFrame: 0, durationFrames: 0 }));

  const activeScene = scenesWithFrames.find(
    (s) => currentFrame >= s.startFrame && currentFrame < s.endFrame
  );

  const sceneTypeLabels = tr.sceneEditor.sceneTypes;
  const sentimentLabels = tr.sceneEditor.sentiments;

  function formatSec(frames: number) {
    const s = frames / 30;
    if (s < 60) return `${s.toFixed(1)}s`;
    const m = Math.floor(s / 60);
    return `${m}m${Math.floor(s % 60)}s`;
  }

  return (
    <div className="p-2.5 space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 mb-1">
        <span className="section-label">{tr.sceneList.heading(scenes.length)}</span>
        {activeScene && (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[9px] text-accent font-bold uppercase tracking-wider">
              {lang === 'pt' ? 'ao vivo' : 'live'}
            </span>
          </div>
        )}
      </div>

      {scenesWithFrames.map((scene, i) => {
        const isSelected = scene.id === selectedId;
        const isActive   = activeScene?.id === scene.id;
        const color      = SCENE_COLORS[scene.type];
        const durationFrames = scene.durationFrames;
        const playedFrames   = isActive ? Math.max(0, currentFrame - scene.startFrame) : 0;
        const progressPct    = durationFrames > 0 ? (playedFrames / durationFrames) * 100 : 0;

        return (
          <button
            key={scene.id}
            onClick={() => onSelect(scene.id)}
            className={`
              w-full text-left rounded-xl transition-all duration-200 border overflow-hidden
              ${isSelected
                ? 'bg-accent/8 border-accent/35 shadow-gold'
                : isActive
                  ? 'bg-surface border-accent/15'
                  : 'bg-card border-transparent hover:border-border hover:bg-surface'
              }
            `}
          >
            {/* Active progress bar at the very top */}
            {isActive && durationFrames > 0 && (
              <div className="h-0.5 bg-surface-2 relative overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-none"
                  style={{ width: `${Math.min(100, progressPct)}%`, background: color }}
                />
              </div>
            )}

            <div className="p-2.5">
              {/* Top row: number + type badge + duration */}
              <div className="flex items-center gap-2 mb-1.5">
                {/* Scene number */}
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                  style={{
                    background: isSelected || isActive ? `${color}25` : 'transparent',
                    color: isSelected || isActive ? color : undefined,
                    border: `1px solid ${isSelected || isActive ? color + '40' : 'transparent'}`,
                  }}
                >
                  {i + 1}
                </div>

                {/* Type icon + label */}
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <span style={{ fontSize: 11 }}>{SCENE_ICONS[scene.type]}</span>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider truncate"
                    style={{ color: isSelected ? color : undefined }}
                  >
                    {sceneTypeLabels[scene.type]}
                  </span>
                </div>

                {/* Duration */}
                {durationFrames > 0 && (
                  <span className="text-[9px] text-text-muted font-mono flex-shrink-0">
                    {formatSec(durationFrames)}
                  </span>
                )}
              </div>

              {/* Title */}
              <p className={`font-semibold text-xs leading-snug line-clamp-2 mb-1 ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>
                {scene.title}
              </p>

              {/* Body preview */}
              {scene.body && (
                <p className="text-[10px] text-text-muted line-clamp-1 mb-1.5">{scene.body}</p>
              )}

              {/* Bottom row: sentiment */}
              <div className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: SENTIMENT_COLORS[scene.sentiment] }}
                />
                <span className="text-[9px] text-text-muted">
                  {sentimentLabels[scene.sentiment]}
                </span>
                {isActive && (
                  <div className="ml-auto flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-accent animate-pulse" />
                    <span className="text-[8px] text-accent font-bold">
                      {lang === 'pt' ? 'AGORA' : 'NOW'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}

      {scenes.length === 0 && (
        <div className="text-center py-8 text-text-muted">
          <div className="text-2xl mb-2">🎬</div>
          <p className="text-xs">{lang === 'pt' ? 'Nenhuma cena ainda' : 'No scenes yet'}</p>
        </div>
      )}
    </div>
  );
}
