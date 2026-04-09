'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Props { onClose: () => void; }

type DemoPhase = 'pipeline' | 'editor';

const PIPELINE_STEPS = [
  {
    id: 'upload',
    icon: '📤',
    labelPt: 'Enviando vídeo…',
    labelEn: 'Uploading video…',
    donePt: 'Vídeo recebido',
    doneEn: 'Video received',
    duration: 1800,
    color: '#FFB800',
  },
  {
    id: 'normalize',
    icon: '⚙️',
    labelPt: 'Normalizando H.264…',
    labelEn: 'Normalizing H.264…',
    donePt: 'Codec normalizado',
    doneEn: 'Codec normalized',
    duration: 2200,
    color: '#60a5fa',
  },
  {
    id: 'transcribe',
    icon: '🎙️',
    labelPt: 'Whisper transcrevendo áudio…',
    labelEn: 'Whisper transcribing audio…',
    donePt: '47 legendas geradas',
    doneEn: '47 captions generated',
    duration: 3000,
    color: '#a78bfa',
  },
  {
    id: 'analyze',
    icon: '🧠',
    labelPt: 'Claude analisando cenas…',
    labelEn: 'Claude analyzing scenes…',
    donePt: '8 cenas estruturadas',
    doneEn: '8 scenes structured',
    duration: 2800,
    color: '#f472b6',
  },
  {
    id: 'ready',
    icon: '🎬',
    labelPt: 'Projeto pronto!',
    labelEn: 'Project ready!',
    donePt: 'Editor aberto',
    doneEn: 'Editor opened',
    duration: 800,
    color: '#22c55e',
  },
];

const MOCK_SCENES = [
  { title: 'Intro', dur: '0:00 – 0:04', color: '#FFB800' },
  { title: 'Destaque', dur: '0:04 – 0:11', color: '#f472b6' },
  { title: 'Conteúdo', dur: '0:11 – 0:22', color: '#60a5fa' },
  { title: 'CTA', dur: '0:22 – 0:30', color: '#22c55e' },
];

const MOCK_WORDS = [
  { w: 'Transforme', s: 'positive' },
  { w: 'seus', s: 'neutral' },
  { w: 'vídeos', s: 'neutral' },
  { w: 'brutos', s: 'neutral' },
  { w: 'em', s: 'neutral' },
  { w: 'conteúdo', s: 'positive' },
  { w: 'viral', s: 'highlight' },
  { w: 'com', s: 'neutral' },
  { w: 'IA', s: 'positive' },
];

const WORD_COLORS: Record<string, string> = {
  positive: '#FFD166',
  neutral: '#ffffff',
  highlight: '#FFB800',
};

export default function DemoModal({ onClose }: Props) {
  const { lang } = useLanguage();
  const [phase, setPhase] = useState<DemoPhase>('pipeline');
  const [stepIndex, setStepIndex] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [activeScene, setActiveScene] = useState(0);
  const [timelinePos, setTimelinePos] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const phaseRef = useRef<DemoPhase>('pipeline');

  phaseRef.current = phase;

  // Pipeline animation
  useEffect(() => {
    if (phase !== 'pipeline') return;
    if (stepIndex >= PIPELINE_STEPS.length) {
      setTimeout(() => setPhase('editor'), 600);
      return;
    }
    const step = PIPELINE_STEPS[stepIndex];
    startRef.current = performance.now();

    function tick(now: number) {
      if (phaseRef.current !== 'pipeline') return;
      const elapsed = now - startRef.current;
      const pct = Math.min(elapsed / step.duration, 1);
      setStepProgress(pct);
      if (pct < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setCompletedSteps((prev) => [...prev, stepIndex]);
        setTimeout(() => {
          setStepIndex((i) => i + 1);
          setStepProgress(0);
        }, 300);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [stepIndex, phase]);

  // Editor animations
  useEffect(() => {
    if (phase !== 'editor') return;
    const wordInterval = setInterval(() => {
      setWordIndex((i) => (i + 1) % MOCK_WORDS.length);
    }, 500);
    const sceneInterval = setInterval(() => {
      setActiveScene((i) => (i + 1) % MOCK_SCENES.length);
    }, 2000);
    const timelineInterval = setInterval(() => {
      setTimelinePos((p) => (p + 1) % 100);
    }, 80);
    return () => {
      clearInterval(wordInterval);
      clearInterval(sceneInterval);
      clearInterval(timelineInterval);
    };
  }, [phase]);

  function restart() {
    setPhase('pipeline');
    setStepIndex(0);
    setStepProgress(0);
    setCompletedSteps([]);
    setWordIndex(0);
    setActiveScene(0);
    setTimelinePos(0);
  }

  const currentStep = PIPELINE_STEPS[stepIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-deep/85 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl glass-strong shadow-gold-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-bold text-accent uppercase tracking-widest">
              {lang === 'pt' ? 'Demo ao Vivo' : 'Live Demo'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={restart}
              className="btn-surface text-xs py-1.5 px-3 gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {lang === 'pt' ? 'Reiniciar' : 'Restart'}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {phase === 'pipeline' ? (
          /* ── PIPELINE PHASE ─────────────────────────────────── */
          <div className="p-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-extrabold mb-2">
                {lang === 'pt' ? 'Pipeline de Processamento' : 'Processing Pipeline'}
              </h2>
              <p className="text-text-secondary text-sm">
                {lang === 'pt'
                  ? 'Veja o vídeo sendo processado em tempo real'
                  : 'Watch the video being processed in real time'}
              </p>
            </div>

            {/* Fake file info */}
            <div className="flex items-center gap-3 mb-8 p-3 bg-surface rounded-xl border border-border">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-lg flex-shrink-0">🎥</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">demo_video_raw.mp4</p>
                <p className="text-xs text-text-muted">47.3 MB · 00:30 · 1920×1080</p>
              </div>
              <span className="text-xs font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
                {lang === 'pt' ? 'em processo' : 'processing'}
              </span>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {PIPELINE_STEPS.map((step, i) => {
                const isDone = completedSteps.includes(i);
                const isActive = stepIndex === i;
                const isPending = i > stepIndex;
                const pct = isActive ? stepProgress * 100 : isDone ? 100 : 0;

                return (
                  <div
                    key={step.id}
                    className={`rounded-xl border p-4 transition-all duration-500 ${
                      isActive
                        ? 'border-accent/40 bg-accent/5'
                        : isDone
                        ? 'border-border bg-surface/50'
                        : 'border-border/40 bg-transparent opacity-40'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl w-7 text-center">{step.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${isDone ? 'text-text-secondary' : 'text-text-primary'}`}>
                          {isDone
                            ? (lang === 'pt' ? step.donePt : step.doneEn)
                            : (lang === 'pt' ? step.labelPt : step.labelEn)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {isDone ? (
                          <span className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center text-xs">✓</span>
                        ) : isActive ? (
                          <span className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin block" />
                        ) : (
                          <span className="w-5 h-5 rounded-full border border-border/40" />
                        )}
                      </div>
                    </div>
                    {/* Progress bar */}
                    {!isPending && (
                      <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-100"
                          style={{
                            width: `${pct}%`,
                            background: isDone ? step.color + '80' : step.color,
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Overall progress */}
            <div className="mt-6 flex items-center gap-3 text-xs text-text-muted">
              <div className="flex-1 h-1 rounded-full bg-surface-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent/60 transition-all duration-500"
                  style={{ width: `${(completedSteps.length / PIPELINE_STEPS.length) * 100}%` }}
                />
              </div>
              <span className="font-mono">
                {completedSteps.length}/{PIPELINE_STEPS.length} {lang === 'pt' ? 'etapas' : 'steps'}
              </span>
            </div>
          </div>
        ) : (
          /* ── EDITOR PHASE ───────────────────────────────────── */
          <div className="flex flex-col">
            <div className="flex flex-1 overflow-hidden" style={{ height: 420 }}>

              {/* Scene list mock */}
              <div className="w-44 border-r border-border bg-surface flex flex-col flex-shrink-0">
                <div className="px-3 py-2.5 border-b border-border">
                  <span className="section-label">{lang === 'pt' ? 'Cenas' : 'Scenes'}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                  {MOCK_SCENES.map((scene, i) => (
                    <div
                      key={scene.title}
                      onClick={() => setActiveScene(i)}
                      className={`rounded-lg p-2.5 cursor-pointer transition-all duration-200 border ${
                        activeScene === i
                          ? 'border-accent/40 bg-accent/8'
                          : 'border-border/30 bg-surface-2/50 hover:border-border'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: scene.color }}
                        />
                        <span className="text-xs font-bold text-text-primary truncate">{scene.title}</span>
                      </div>
                      <span className="text-[10px] text-text-muted font-mono">{scene.dur}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Video preview mock */}
              <div className="flex-1 bg-bg-deep flex items-center justify-center relative overflow-hidden">
                {/* Mock phone frame */}
                <div
                  className="relative rounded-2xl overflow-hidden border-2 border-border"
                  style={{ width: 160, height: 284, background: '#020204' }}
                >
                  {/* Gradient bg */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(ellipse at 50% 30%, ${MOCK_SCENES[activeScene].color}22 0%, transparent 70%), #020204`,
                    }}
                  />

                  {/* Mock video content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mb-4 border-2"
                      style={{
                        borderColor: MOCK_SCENES[activeScene].color + '60',
                        background: MOCK_SCENES[activeScene].color + '15',
                      }}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={MOCK_SCENES[activeScene].color}>
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>

                    {/* Scene label */}
                    <span
                      className="text-[10px] font-extrabold uppercase tracking-wider mb-4"
                      style={{ color: MOCK_SCENES[activeScene].color }}
                    >
                      {MOCK_SCENES[activeScene].title}
                    </span>

                    {/* Animated words */}
                    <div className="flex flex-wrap justify-center gap-1">
                      {MOCK_WORDS.slice(wordIndex, wordIndex + 4).map((word, wi) => (
                        <span
                          key={`${wordIndex}-${wi}`}
                          className="text-[9px] font-bold px-1 py-0.5 rounded"
                          style={{
                            color: WORD_COLORS[word.s],
                            background: word.s === 'highlight' ? '#FFB80020' : 'transparent',
                            animation: 'fade-in 0.15s ease-out',
                          }}
                        >
                          {word.w}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Timeline bar at bottom of phone */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface">
                    <div
                      className="h-full bg-accent/70 transition-none"
                      style={{ width: `${timelinePos}%` }}
                    />
                  </div>
                </div>

                {/* Label */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                  <span className="text-xs text-text-muted">
                    {lang === 'pt' ? 'Preview 1080×1920 · 30fps' : '1080×1920 preview · 30fps'}
                  </span>
                </div>
              </div>

              {/* Right panel mock */}
              <div className="w-56 border-l border-border bg-surface flex flex-col flex-shrink-0">
                {/* Tab bar */}
                <div className="flex border-b border-border bg-surface-2">
                  <div className="flex-1 py-2.5 text-center text-xs font-bold text-accent relative">
                    {lang === 'pt' ? 'Cena' : 'Scene'}
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />
                  </div>
                  <div className="flex-1 py-2.5 text-center text-xs font-bold text-text-muted">
                    {lang === 'pt' ? 'Dublagem' : 'Dubbing'}
                  </div>
                </div>

                {/* Scene editor mock */}
                <div className="flex-1 p-3 space-y-3 overflow-hidden">
                  {/* Color palette */}
                  <div>
                    <p className="section-label mb-2">{lang === 'pt' ? 'Paleta' : 'Palette'}</p>
                    <div className="flex gap-1.5">
                      {['#FFB800', '#FF6B00', '#050508', '#FFFFFF', '#f472b6'].map((c) => (
                        <div
                          key={c}
                          className="w-7 h-7 rounded-lg border border-white/10 flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Title field mock */}
                  <div>
                    <p className="section-label mb-1.5">{lang === 'pt' ? 'Título' : 'Title'}</p>
                    <div className="bg-bg rounded-lg border border-border px-2.5 py-2 text-xs text-text-secondary font-mono">
                      {MOCK_SCENES[activeScene].title}
                    </div>
                  </div>

                  {/* Text content mock */}
                  <div>
                    <p className="section-label mb-1.5">{lang === 'pt' ? 'Conteúdo' : 'Content'}</p>
                    <div className="bg-bg rounded-lg border border-border px-2.5 py-2 text-xs text-text-muted leading-relaxed" style={{ minHeight: 52 }}>
                      {lang === 'pt'
                        ? 'Transforme seus vídeos brutos em conteúdo viral com IA…'
                        : 'Transform your raw footage into viral content with AI…'}
                    </div>
                  </div>

                  {/* Style tag mock */}
                  <div>
                    <p className="section-label mb-1.5">{lang === 'pt' ? 'Tipo de Cena' : 'Scene Type'}</p>
                    <div className="flex flex-wrap gap-1">
                      {['title', 'content', 'highlight'].map((t) => (
                        <span
                          key={t}
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                            t === 'title'
                              ? 'bg-accent/15 text-accent border-accent/30'
                              : 'bg-surface-2 text-text-muted border-border/50'
                          }`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline mock */}
            <div className="h-20 border-t border-border bg-surface-2 px-4 flex flex-col justify-center gap-2">
              <div className="flex items-center gap-2 text-[10px] text-text-muted">
                <span className="font-mono">00:00</span>
                <div className="flex-1 relative h-5">
                  {/* Tracks */}
                  <div className="absolute top-0 left-0 right-0 h-2 rounded bg-surface flex overflow-hidden gap-px">
                    {MOCK_SCENES.map((s, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm transition-opacity duration-300"
                        style={{
                          background: s.color,
                          opacity: activeScene === i ? 1 : 0.3,
                        }}
                      />
                    ))}
                  </div>
                  {/* SRT track */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 rounded bg-surface flex overflow-hidden gap-px">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm"
                        style={{ background: `rgba(148,163,184,${Math.random() > 0.3 ? 0.4 : 0.1})` }}
                      />
                    ))}
                  </div>
                  {/* Playhead */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-accent"
                    style={{ left: `${timelinePos}%` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-accent -translate-x-[3px] -translate-y-0.5" />
                  </div>
                </div>
                <span className="font-mono">00:30</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  {MOCK_SCENES.map((s) => (
                    <span key={s.title} className="flex items-center gap-1 text-[10px] text-text-muted">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      {s.title}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Success banner */}
            <div className="px-6 py-3 border-t border-border bg-success/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-success text-sm font-semibold">
                <span>✓</span>
                {lang === 'pt'
                  ? 'Vídeo processado com sucesso! 8 cenas, 47 legendas, paleta gerada por IA.'
                  : 'Video processed successfully! 8 scenes, 47 captions, AI-generated palette.'}
              </div>
              <button
                onClick={onClose}
                className="btn-primary text-sm py-2 px-4"
              >
                {lang === 'pt' ? '🚀 Experimentar' : '🚀 Try it'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
