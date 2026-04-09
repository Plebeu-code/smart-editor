'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Project } from '@/types';
import {
  DubbingJob,
  DubbingStatus,
  Speaker,
  TranslatedSegment,
  TTSVoice,
  TTS_VOICES,
  SUPPORTED_LANGUAGES,
} from '@/types/dubbing';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Props {
  projectId: string;
  project: Project;
  onProjectUpdate: (p: Project) => void;
}

type UIStep = 'config' | 'review-speakers' | 'review-translation' | 'mix' | 'done';

const ACTIVE_STATUSES: DubbingStatus[] = ['diarizing', 'translating', 'generating_tts', 'mixing'];

export default function DubbingPanel({ projectId, project, onProjectUpdate }: Props) {
  const { tr } = useLanguage();
  const td = tr.dubbing;
  const [targetLang, setTargetLang] = useState('en');
  const [uiStep, setUiStep] = useState<UIStep>('config');
  const [editableSpeakers, setEditableSpeakers] = useState<Speaker[]>([]);
  const [editableSegments, setEditableSegments] = useState<TranslatedSegment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dubbing = project.dubbing;

  // Sync editable state from project
  useEffect(() => {
    if (dubbing?.speakers?.length) setEditableSpeakers(dubbing.speakers);
    if (dubbing?.translatedSegments?.length) setEditableSegments(dubbing.translatedSegments);
    if (dubbing?.status === 'done') setUiStep('done');
  }, [dubbing]);

  // Poll during active steps
  useEffect(() => {
    const isActive = dubbing && ACTIVE_STATUSES.includes(dubbing.status);
    if (!isActive) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/dubbing/${projectId}/status`);
      if (!res.ok) return;
      const data = await res.json() as { dubbing: DubbingJob };
      if (data.dubbing) {
        onProjectUpdate({ ...project, dubbing: data.dubbing });
        if (!ACTIVE_STATUSES.includes(data.dubbing.status)) {
          clearInterval(pollRef.current!);
        }
      }
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [dubbing?.status, projectId]);

  const apiCall = useCallback(async (url: string, body?: object) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? td.errorGeneric);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : td.errorGeneric);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Step 1: Detect speakers
  const handleDetect = async () => {
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang);
    const data = await apiCall(`/api/dubbing/${projectId}/diarize`, {
      targetLanguage: targetLang,
      targetLanguageName: lang?.name ?? targetLang,
    });
    if (data?.dubbing) {
      onProjectUpdate({ ...project, dubbing: data.dubbing });
      setEditableSpeakers(data.dubbing.speakers ?? []);
      setUiStep('review-speakers');
    }
  };

  // Step 2: Translate
  const handleTranslate = async () => {
    const data = await apiCall(`/api/dubbing/${projectId}/translate`, {
      speakers: editableSpeakers,
    });
    if (data?.dubbing) {
      onProjectUpdate({ ...project, dubbing: data.dubbing });
      setEditableSegments(data.dubbing.translatedSegments ?? []);
      setUiStep('review-translation');
    }
  };

  // Step 3: Generate TTS
  const handleGenerateTTS = async () => {
    const data = await apiCall(`/api/dubbing/${projectId}/tts`, {
      translatedSegments: editableSegments,
    });
    if (data?.dubbing) {
      onProjectUpdate({ ...project, dubbing: data.dubbing });
      setUiStep('mix');
    }
  };

  // Step 4: Mix
  const handleMix = async () => {
    const data = await apiCall(`/api/dubbing/${projectId}/mix`);
    if (data?.dubbing) {
      onProjectUpdate({ ...project, dubbing: data.dubbing });
      setUiStep('done');
    }
  };

  const isActive = dubbing && ACTIVE_STATUSES.includes(dubbing.status);

  // ── Loading spinner overlay ───────────────────────────────────────────────
  if (isLoading || isActive) {
    return (
      <div className="p-4 flex flex-col items-center justify-center gap-4 animate-fade-in">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-accent font-semibold">
          {dubbing ? td.statusLabels[dubbing.status] : td.processing}
        </p>
        {dubbing?.status === 'generating_tts' && dubbing.ttsClips?.length > 0 && (
          <p className="text-xs text-text-muted">
            {dubbing.ttsClips.length} clips...
          </p>
        )}
      </div>
    );
  }

  // ── Step: Config ──────────────────────────────────────────────────────────
  if (uiStep === 'config' || !dubbing) {
    return (
      <div className="p-4 space-y-5 animate-fade-in">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌐</span>
          <span className="section-label">{td.heading}</span>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">{td.description}</p>

        <div>
          <label className="section-label block mb-2">{td.langLabel}</label>
          <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setTargetLang(lang.code)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left
                  transition-all border
                  ${targetLang === lang.code
                    ? 'bg-accent/10 border-accent text-accent font-semibold'
                    : 'bg-card border-border text-text-secondary hover:border-accent/50'
                  }
                `}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs">
            {error}
          </div>
        )}

        <button onClick={handleDetect} className="btn-primary w-full text-sm">
          {td.startBtn}
        </button>
      </div>
    );
  }

  // ── Step: Review Speakers ─────────────────────────────────────────────────
  if (uiStep === 'review-speakers') {
    return (
      <div className="p-4 space-y-4 animate-fade-in">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎭</span>
          <span className="section-label">{td.speakersHeading}</span>
        </div>
        <p className="text-xs text-text-muted">
          {td.speakersDesc(editableSpeakers.length, 0)}
        </p>

        <div className="space-y-3">
          {editableSpeakers.map((speaker, i) => (
            <SpeakerCard
              key={speaker.id}
              speaker={speaker}
              segmentCount={dubbing.diarizedSegments.filter((s) => s.speakerId === speaker.id).length}
              onChange={(updated) => {
                setEditableSpeakers((prev) => prev.map((s) => s.id === updated.id ? updated : s));
              }}
            />
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs">{error}</div>
        )}

        <div className="flex gap-2">
          <button onClick={() => { setUiStep('config'); }} className="btn-ghost flex-1 text-sm py-2">
            {td.backBtn}
          </button>
          <button onClick={handleTranslate} className="btn-primary flex-1 text-sm">
            {td.translateBtn}
          </button>
        </div>
      </div>
    );
  }

  // ── Step: Review Translation ──────────────────────────────────────────────
  if (uiStep === 'review-translation') {
    const speakerMap = new Map(editableSpeakers.map((s) => [s.id, s]));
    return (
      <div className="p-4 space-y-4 animate-fade-in flex flex-col h-full">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-lg">✍️</span>
          <span className="section-label">{td.reviewHeading}</span>
        </div>
        <p className="text-xs text-text-muted flex-shrink-0">{td.reviewDesc}</p>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {editableSegments.map((seg, i) => {
            const sp = speakerMap.get(seg.speakerId);
            return (
              <div key={i} className="bg-card rounded-xl p-3 border border-border space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${sp?.color ?? '#888'}20`,
                      color: sp?.color ?? '#888',
                    }}
                  >
                    {sp?.label ?? seg.speakerId}
                  </span>
                  <span className="text-xs text-text-muted ml-auto">
                    {seg.startSeconds.toFixed(1)}s
                  </span>
                </div>
                <p className="text-xs text-text-muted italic line-clamp-1">{seg.originalText}</p>
                <textarea
                  className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary resize-none focus:outline-none focus:border-accent"
                  rows={2}
                  value={seg.translatedText}
                  onChange={(e) => {
                    setEditableSegments((prev) =>
                      prev.map((s, j) => j === i ? { ...s, translatedText: e.target.value } : s)
                    );
                  }}
                />
              </div>
            );
          })}
        </div>

        {error && (
          <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex-shrink-0">{error}</div>
        )}

        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => setUiStep('review-speakers')} className="btn-ghost flex-1 text-sm py-2">
            {td.backBtn}
          </button>
          <button onClick={handleGenerateTTS} className="btn-primary flex-1 text-sm">
            {td.generateBtn}
          </button>
        </div>
      </div>
    );
  }

  // ── Step: Mix ─────────────────────────────────────────────────────────────
  if (uiStep === 'mix') {
    const clips = dubbing.ttsClips ?? [];
    return (
      <div className="p-4 space-y-4 animate-fade-in">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎛️</span>
          <span className="section-label">{td.mixHeading}</span>
        </div>
        <p className="text-xs text-text-muted">{td.mixDesc(clips.length)}</p>

        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {clips.slice(0, 20).map((clip, i) => {
            const sp = editableSpeakers.find((s) => s.id === clip.speakerId);
            return (
              <div key={i} className="flex items-center gap-2 text-xs text-text-muted bg-card p-2 rounded-lg border border-border">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: sp?.color ?? '#888' }}
                />
                <span className="truncate">{sp?.label}</span>
                <span className="ml-auto font-mono">{clip.durationSeconds.toFixed(1)}s</span>
                <span className="text-text-muted">{td.clipAt}{clip.startSeconds.toFixed(1)}s</span>
              </div>
            );
          })}
          {clips.length > 20 && (
            <p className="text-xs text-text-muted text-center">{td.mixMoreClips(clips.length - 20)}</p>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs">{error}</div>
        )}

        <button onClick={handleMix} className="btn-primary w-full text-sm">
          {td.mixBtn}
        </button>
      </div>
    );
  }

  // ── Step: Done ────────────────────────────────────────────────────────────
  if (uiStep === 'done') {
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === dubbing.targetLanguage);
    return (
      <div className="p-4 space-y-4 animate-slide-up">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3 text-2xl">
            🎉
          </div>
          <h3 className="font-bold text-text-primary">{td.doneTitle}</h3>
          <p className="text-text-muted text-xs mt-1">
            {lang?.flag} {lang?.name} · {td.doneSpeakers(dubbing.speakers.length)}
          </p>
        </div>

        <div className="space-y-2">
          {dubbing.speakers.map((sp) => {
            const voice = TTS_VOICES.find((v) => v.id === sp.voice);
            return (
              <div key={sp.id} className="flex items-center gap-2 p-2 bg-card rounded-xl border border-border">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sp.color }} />
                <span className="text-sm font-semibold text-text-primary">{sp.label}</span>
                <span className="ml-auto text-xs text-text-muted">{voice?.label}</span>
              </div>
            );
          })}
        </div>

        <a
          href={`/api/video/${projectId}/dubbed`}
          download={`${projectId}_dubbed.mp4`}
          className="btn-primary w-full text-sm text-center block"
        >
          {td.downloadBtn}
        </a>

        <button
          onClick={() => {
            setUiStep('config');
            onProjectUpdate({ ...project, dubbing: undefined });
          }}
          className="btn-ghost w-full text-sm"
        >
          {td.newDubBtn}
        </button>
      </div>
    );
  }

  return null;
}

// ── Speaker Card ──────────────────────────────────────────────────────────────
function SpeakerCard({
  speaker,
  segmentCount,
  onChange,
}: {
  speaker: Speaker;
  segmentCount: number;
  onChange: (s: Speaker) => void;
}) {
  return (
    <div
      className="p-3 rounded-xl border border-border bg-card space-y-3"
      style={{ borderColor: `${speaker.color}30` }}
    >
      {/* Name + badge */}
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: speaker.color }} />
        <input
          className="flex-1 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
          value={speaker.label}
          onChange={(e) => onChange({ ...speaker, label: e.target.value })}
          placeholder="Speaker name"
        />
        <span className="text-xs text-text-muted flex-shrink-0">{segmentCount} seg</span>
      </div>

      {/* Voice selector */}
      <div>
        <p className="text-xs text-text-muted mb-1.5">Voice</p>
        <div className="grid grid-cols-3 gap-1">
          {TTS_VOICES.map((v) => (
            <button
              key={v.id}
              onClick={() => onChange({ ...speaker, voice: v.id })}
              className={`
                py-1.5 px-2 rounded-lg text-xs font-semibold transition-all
                ${speaker.voice === v.id
                  ? 'text-bg font-bold'
                  : 'bg-surface border border-border text-text-muted hover:border-accent/40'
                }
              `}
              style={speaker.voice === v.id ? { backgroundColor: speaker.color } : {}}
            >
              {v.label}
              <span className="block text-[9px] opacity-70">{v.gender}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
