'use client';

import { useMemo, useState } from 'react';
import { Scene, ColorPalette, SceneType, Sentiment, SRTEntry } from '@/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { convertScenesFromLegendaIndex } from '@/lib/timing';

interface Props {
  scene: Scene | null;
  scenes: Scene[];
  palette?: ColorPalette;
  srtEntries?: SRTEntry[];
  onUpdate: (scene: Scene) => void;
  onNavigate: (id: string) => void;
  onJumpToScene?: (frame: number) => void;
  onDelete?: (id: string) => void;
}

const SCENE_TYPES: SceneType[] = ['title', 'content', 'highlight', 'outro'];
const SENTIMENTS: Sentiment[] = ['positive', 'negative', 'neutral', 'exciting'];
const VISUAL_STYLES = ['minimal', 'bold', 'cinematic'] as const;

const SCENE_TYPE_META: Record<SceneType, { icon: string; color: string }> = {
  title:     { icon: '🎯', color: '#FFB800' },
  content:   { icon: '📝', color: '#4A9EFF' },
  highlight: { icon: '⚡', color: '#FF6B4A' },
  outro:     { icon: '🎬', color: '#9B59B6' },
};

const SENTIMENT_META: Record<Sentiment, { color: string; emoji: string }> = {
  positive: { color: '#22C55E', emoji: '😊' },
  negative: { color: '#EF4444', emoji: '😔' },
  neutral:  { color: '#6B7280', emoji: '😐' },
  exciting: { color: '#F59E0B', emoji: '🔥' },
};

const VISUAL_STYLE_ICONS: Record<string, string> = {
  minimal:   '○',
  bold:      '◼',
  cinematic: '▶',
};

function formatTimeSec(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec) % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function SceneEditor({
  scene,
  scenes,
  palette,
  srtEntries = [],
  onUpdate,
  onNavigate,
  onJumpToScene,
  onDelete,
}: Props) {
  const { tr, lang } = useLanguage();
  const t = tr.sceneEditor;
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Compute frames for all scenes
  const scenesWithFrames = useMemo(() =>
    srtEntries.length > 0
      ? convertScenesFromLegendaIndex(scenes, srtEntries)
      : scenes.map((s) => ({ ...s, startFrame: 0, endFrame: 0, durationFrames: 0 })),
    [scenes, srtEntries]
  );

  const selectedIndex = scene ? scenes.findIndex((s) => s.id === scene.id) : -1;
  const sceneWithFrames = scenesWithFrames[selectedIndex] ?? null;
  const startTimeSec = sceneWithFrames ? sceneWithFrames.startFrame / 30 : 0;
  const endTimeSec   = sceneWithFrames ? sceneWithFrames.endFrame   / 30 : 0;
  const durationSec  = sceneWithFrames ? sceneWithFrames.durationFrames / 30 : 0;

  // Empty state
  if (!scene) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-text-muted">
        <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-3 text-2xl">
          🎬
        </div>
        <p className="text-sm font-medium text-text-secondary mb-1">
          {lang === 'pt' ? 'Nenhuma cena selecionada' : 'No scene selected'}
        </p>
        <p className="text-xs">{t.empty}</p>
      </div>
    );
  }

  const update = async (changes: Partial<Scene>) => {
    setSaving(true);
    await onUpdate({ ...scene, ...changes });
    setSaving(false);
  };

  const typeMeta = SCENE_TYPE_META[scene.type];

  return (
    <div className="flex flex-col h-full animate-fade-in">

      {/* ── Navigation header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-surface-2/60 flex-shrink-0">
        <button
          onClick={() => selectedIndex > 0 && onNavigate(scenes[selectedIndex - 1].id)}
          disabled={selectedIndex <= 0}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface disabled:opacity-25 disabled:cursor-not-allowed transition-all"
          title={lang === 'pt' ? 'Cena anterior' : 'Previous scene'}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-bold text-text-primary">
            {lang === 'pt' ? 'Cena' : 'Scene'} {selectedIndex + 1}
            <span className="text-text-muted font-normal"> / {scenes.length}</span>
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: `${typeMeta.color}20`, color: typeMeta.color }}
          >
            {typeMeta.icon} {t.sceneTypes[scene.type]}
          </span>
        </div>

        <button
          onClick={() => selectedIndex < scenes.length - 1 && onNavigate(scenes[selectedIndex + 1].id)}
          disabled={selectedIndex >= scenes.length - 1}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface disabled:opacity-25 disabled:cursor-not-allowed transition-all"
          title={lang === 'pt' ? 'Próxima cena' : 'Next scene'}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* ── Scrollable content ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ── Mini phone mockup ──────────────────────────────────────────── */}
        <div className="flex justify-center">
          <div
            className="relative rounded-xl overflow-hidden border border-border/60 shadow-lg flex-shrink-0"
            style={{
              width: 96,
              aspectRatio: '9/16',
              background: 'linear-gradient(135deg, #0d0d18 0%, #12121f 50%, #0a0a14 100%)',
            }}
          >
            {/* Top accent bar */}
            <div
              className="absolute top-0 left-0 right-0 h-0.5"
              style={{ background: `linear-gradient(90deg, transparent, ${typeMeta.color}, transparent)` }}
            />
            {/* Subtle pattern / noise hint */}
            <div
              className="absolute inset-0 opacity-5"
              style={{ backgroundImage: 'radial-gradient(circle at 50% 30%, #fff 1px, transparent 1px)', backgroundSize: '12px 12px' }}
            />
            {/* Bottom gradient */}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(5,5,8,0.95) 100%)' }}
            />
            {/* Palette color accent stripe */}
            {palette && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 opacity-60"
                style={{ background: `linear-gradient(90deg, ${palette.primary}, ${palette.secondary ?? palette.primary})` }}
              />
            )}
            {/* Content overlay at bottom */}
            <div className="absolute left-0 right-0 bottom-2 px-2">
              <div
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 mb-1"
                style={{ background: `${typeMeta.color}28`, border: `1px solid ${typeMeta.color}50` }}
              >
                <span style={{ fontSize: 6, fontWeight: 800, color: typeMeta.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {t.sceneTypes[scene.type]}
                </span>
              </div>
              <p
                className="line-clamp-3"
                style={{ fontSize: 7.5, fontWeight: 800, color: '#fff', lineHeight: 1.25, textShadow: '0 1px 4px rgba(0,0,0,0.9)', marginBottom: 2 }}
              >
                {scene.title || (lang === 'pt' ? 'Sem título' : 'No title')}
              </p>
              {scene.body && (
                <p
                  className="line-clamp-2"
                  style={{ fontSize: 6, color: 'rgba(255,255,255,0.65)', lineHeight: 1.3 }}
                >
                  {scene.body}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Timing + Jump ─────────────────────────────────────────────── */}
        {sceneWithFrames && durationSec > 0 ? (
          <div className="flex items-stretch gap-2">
            <button
              onClick={() => onJumpToScene?.(sceneWithFrames.startFrame)}
              className="flex items-center gap-2 flex-1 bg-card border border-border rounded-xl px-3 py-2 hover:border-accent/50 hover:bg-surface transition-all group text-left"
              title={lang === 'pt' ? 'Ir para esta cena no player' : 'Jump to this scene in player'}
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                style={{ background: `${typeMeta.color}20` }}
              >
                <svg className="w-3.5 h-3.5" style={{ color: typeMeta.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-text-muted mb-0.5">{lang === 'pt' ? 'Ir para cena' : 'Jump to scene'}</p>
                <p className="text-xs font-bold font-mono text-text-primary">
                  {formatTimeSec(startTimeSec)}
                  <span className="text-text-muted font-normal mx-1">→</span>
                  {formatTimeSec(endTimeSec)}
                </p>
              </div>
            </button>
            <div className="flex flex-col items-center justify-center bg-card border border-border rounded-xl px-3 py-2 min-w-[56px]">
              <span className="text-[9px] text-text-muted mb-0.5">{lang === 'pt' ? 'Duração' : 'Duration'}</span>
              <span className="text-sm font-bold" style={{ color: typeMeta.color }}>{durationSec.toFixed(1)}s</span>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl px-3 py-2">
            <p className="text-xs text-text-muted">{t.startPos(scene.startLeg)}</p>
          </div>
        )}

        {/* ── Scene type ────────────────────────────────────────────────── */}
        <div>
          <label className="section-label block mb-2">{t.typeLabel}</label>
          <div className="grid grid-cols-4 gap-1.5">
            {SCENE_TYPES.map((type) => {
              const meta = SCENE_TYPE_META[type];
              const active = scene.type === type;
              return (
                <button
                  key={type}
                  onClick={() => update({ type })}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all
                    ${active ? 'border-2 bg-card shadow-sm' : 'bg-card border border-border hover:border-border/60 hover:bg-surface'}`}
                  style={active ? { borderColor: meta.color } : {}}
                >
                  <span style={{ fontSize: 17 }}>{meta.icon}</span>
                  <span
                    style={{ fontSize: 8, fontWeight: 700, color: active ? meta.color : undefined }}
                    className={active ? '' : 'text-text-muted'}
                  >
                    {t.sceneTypes[type]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Title ─────────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="section-label">{t.titleLabel}</label>
            <span className={`text-[10px] font-mono transition-colors ${scene.title.length > 80 ? 'text-orange-400' : scene.title.length > 95 ? 'text-danger' : 'text-text-muted'}`}>
              {scene.title.length}<span className="opacity-50">/100</span>
            </span>
          </div>
          <input
            type="text"
            className="input-field w-full text-sm"
            value={scene.title}
            maxLength={100}
            onChange={(e) => update({ title: e.target.value })}
            placeholder={t.titlePlaceholder}
          />
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="section-label">{t.bodyLabel}</label>
            <span className={`text-[10px] font-mono transition-colors ${(scene.body?.length ?? 0) > 160 ? 'text-orange-400' : 'text-text-muted'}`}>
              {scene.body?.length ?? 0}<span className="opacity-50">/200</span>
            </span>
          </div>
          <textarea
            className="input-field w-full text-sm resize-none"
            rows={2}
            value={scene.body ?? ''}
            maxLength={200}
            onChange={(e) => update({ body: e.target.value || undefined })}
            placeholder={t.bodyPlaceholder}
          />
        </div>

        {/* ── Sentiment ─────────────────────────────────────────────────── */}
        <div>
          <label className="section-label block mb-2">{t.sentimentLabel}</label>
          <div className="flex gap-1.5">
            {SENTIMENTS.map((s) => {
              const meta = SENTIMENT_META[s];
              const active = scene.sentiment === s;
              return (
                <button
                  key={s}
                  onClick={() => update({ sentiment: s })}
                  title={t.sentiments[s]}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all
                    ${active ? 'border-2 bg-card' : 'bg-card border border-border hover:border-border/60 hover:bg-surface'}`}
                  style={active ? { borderColor: meta.color } : {}}
                >
                  <span style={{ fontSize: 15 }}>{meta.emoji}</span>
                  <span
                    style={{ fontSize: 8, fontWeight: 700, color: active ? meta.color : undefined }}
                    className={active ? '' : 'text-text-muted'}
                  >
                    {t.sentiments[s].slice(0, 4)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Visual style ──────────────────────────────────────────────── */}
        <div>
          <label className="section-label block mb-2">{t.visualStyleLabel}</label>
          <div className="flex gap-1.5">
            {VISUAL_STYLES.map((style) => (
              <button
                key={style}
                onClick={() => update({ visualStyle: style })}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all
                  ${scene.visualStyle === style
                    ? 'bg-accent text-bg shadow'
                    : 'bg-card border border-border text-text-secondary hover:border-accent/40 hover:bg-surface'
                  }`}
              >
                <span className="mr-1 opacity-70">{VISUAL_STYLE_ICONS[style]}</span>
                {t.visualStyles[style]}
              </button>
            ))}
          </div>
        </div>

        {/* ── Palette ───────────────────────────────────────────────────── */}
        {palette && (
          <div>
            <label className="section-label block mb-2">{t.paletteLabel}</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(palette).map(([key, value]) => (
                <div key={key} className="flex flex-col items-center gap-1" title={`${key}: ${value}`}>
                  <div
                    className="w-8 h-8 rounded-lg border border-border/60 shadow-sm ring-1 ring-black/20"
                    style={{ backgroundColor: value }}
                  />
                  <span className="text-[9px] text-text-muted">{key.slice(0, 3)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer: saving + delete ────────────────────────────────────── */}
        <div className="flex items-center gap-2 pt-2 pb-1 border-t border-border/50">
          {saving ? (
            <div className="flex items-center gap-1.5 text-xs text-accent">
              <div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
              {t.saving}…
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-success opacity-0 transition-opacity">
              ✓ {lang === 'pt' ? 'Salvo' : 'Saved'}
            </div>
          )}
          <div className="flex-1" />

          {onDelete && (
            confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-text-muted">{lang === 'pt' ? 'Confirmar?' : 'Confirm?'}</span>
                <button
                  onClick={() => { setConfirmDelete(false); onDelete(scene.id); }}
                  className="text-xs text-danger font-bold hover:opacity-80 transition-opacity px-2 py-1 bg-danger/10 rounded-lg"
                >
                  {lang === 'pt' ? 'Apagar' : 'Delete'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  {lang === 'pt' ? 'Cancelar' : 'Cancel'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1 text-xs text-text-muted hover:text-danger transition-colors py-1 px-2 rounded-lg hover:bg-danger/8"
                title={lang === 'pt' ? 'Apagar cena' : 'Delete scene'}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {lang === 'pt' ? 'Apagar' : 'Delete'}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
