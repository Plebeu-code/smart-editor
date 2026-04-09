'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadZone from '@/components/UploadZone';
import ProcessingStatus from '@/components/ProcessingStatus';
import FlagSwitcher from '@/components/FlagSwitcher';
import Logo from '@/components/Logo';
import DemoModal from '@/components/DemoModal';
import { useLanguage } from '@/lib/i18n/LanguageContext';

type PipelineStatus = 'idle' | 'uploading' | 'normalizing' | 'transcribing' | 'analyzing' | 'ready';

const STEPS = [
  { num: '01', icon: '📤', keyPt: 'Envie o Vídeo', keyEn: 'Upload Video', descPt: 'MP4, MOV, HEVC — até 2GB', descEn: 'MP4, MOV, HEVC — up to 2GB' },
  { num: '02', icon: '🎙️', keyPt: 'Transcrição IA', keyEn: 'AI Transcription', descPt: 'Whisper analisa o áudio e gera legendas sincronizadas', descEn: 'Whisper analyzes audio and generates synced captions' },
  { num: '03', icon: '🧠', keyPt: 'Análise Claude', keyEn: 'Claude Analysis', descPt: 'Claude estrutura cenas, paleta de cores e estilo visual', descEn: 'Claude structures scenes, color palette and visual style' },
  { num: '04', icon: '🎬', keyPt: 'Vídeo Pronto', keyEn: 'Video Ready', descPt: 'Remotion renderiza 1080×1920 @ 30fps com animações', descEn: 'Remotion renders 1080×1920 @ 30fps with animations' },
];

const FEATURES = [
  {
    icon: '⚡',
    titlePt: 'Processamento Ultra Rápido',
    titleEn: 'Ultra Fast Processing',
    descPt: 'Pipeline otimizado: normalização H.264, transcrição e análise em menos de 2 minutos.',
    descEn: 'Optimized pipeline: H.264 normalization, transcription and analysis in under 2 minutes.',
  },
  {
    icon: '🌐',
    titlePt: 'Dublagem Multilíngue',
    titleEn: 'Multilingual Dubbing',
    descPt: 'Detecte falantes, traduza para 12 idiomas e gere vozes únicas para cada personagem.',
    descEn: 'Detect speakers, translate to 12 languages and generate unique voices per character.',
  },
  {
    icon: '🎨',
    titlePt: 'Design Gerado por IA',
    titleEn: 'AI-Generated Design',
    descPt: 'Paleta de cores, tipografia e estilo visual criados pelo Claude para cada vídeo.',
    descEn: 'Color palette, typography and visual style created by Claude for each video.',
  },
  {
    icon: '📱',
    titlePt: 'Formato Vertical 9:16',
    titleEn: '9:16 Vertical Format',
    descPt: 'Otimizado para TikTok, Instagram Reels e YouTube Shorts. 1080×1920 nativo.',
    descEn: 'Optimized for TikTok, Instagram Reels and YouTube Shorts. Native 1080×1920.',
  },
  {
    icon: '✍️',
    titlePt: 'Legendas Estilo TikTok',
    titleEn: 'TikTok-Style Captions',
    descPt: 'Palavra por palavra, coloridas por sentimento, animadas com spring physics.',
    descEn: 'Word by word, colored by sentiment, animated with spring physics.',
  },
  {
    icon: '🎛️',
    titlePt: 'Editor Visual Completo',
    titleEn: 'Full Visual Editor',
    descPt: 'Edite cenas, ajuste paleta, preview em tempo real com player Remotion integrado.',
    descEn: 'Edit scenes, adjust palette, real-time preview with integrated Remotion player.',
  },
];

export default function HomePage() {
  const router = useRouter();
  const { tr, lang } = useLanguage();
  const [status, setStatus] = useState<PipelineStatus>('idle');
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  async function handleUpload(file: File) {
    setError(null);
    setStatus('uploading');
    try {
      const form = new FormData();
      form.append('video', file);
      form.append('prompt', prompt);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: form });
      if (!uploadRes.ok) throw new Error(tr.home.errorUpload);
      const { projectId } = await uploadRes.json();

      setStatus('normalizing');
      const transcribeRes = await fetch(`/api/transcribe/${projectId}`, { method: 'POST' });
      if (!transcribeRes.ok) throw new Error(tr.home.errorTranscribe);
      setStatus('transcribing');

      setStatus('analyzing');
      const analyzeRes = await fetch(`/api/analyze/${projectId}`, { method: 'POST' });
      if (!analyzeRes.ok) throw new Error(tr.home.errorAnalyze);

      setStatus('ready');
      router.push(`/editor/${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : tr.home.errorGeneric);
      setStatus('idle');
    }
  }

  const isIdle = status === 'idle';

  return (
    <div className="min-h-screen bg-bg text-text-primary">

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 md:px-10 glass border-b border-border">
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          <FlagSwitcher />
          <button
            onClick={() => setShowUpload(true)}
            className="btn-primary text-sm py-2 px-5"
          >
            {lang === 'pt' ? '🚀 Começar Agora' : '🚀 Get Started'}
          </button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 flex flex-col items-center text-center overflow-hidden">
        {/* Glow background */}
        <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-accent/5 blur-[80px] pointer-events-none" />

        {/* Badge */}
        <div className="badge-gold mb-6 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          {lang === 'pt' ? 'Powered by Claude AI + Whisper + Remotion' : 'Powered by Claude AI + Whisper + Remotion'}
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight max-w-4xl animate-slide-up mb-6">
          {lang === 'pt' ? (
            <>Transforme vídeos brutos em<br /><span className="text-shine">conteúdo viral</span> com IA</>
          ) : (
            <>Turn raw footage into<br /><span className="text-shine">viral content</span> with AI</>
          )}
        </h1>

        {/* Subtitle */}
        <p className="text-text-secondary text-lg md:text-xl max-w-2xl leading-relaxed animate-slide-up mb-10">
          {lang === 'pt'
            ? 'Pipeline completo de edição automática: transcrição, análise de cenas, animações e dublagem multilíngue em um só lugar.'
            : 'Complete automated editing pipeline: transcription, scene analysis, animations and multilingual dubbing in one place.'}
        </p>

        {/* CTA buttons */}
        <div className="flex items-center gap-4 animate-slide-up mb-16">
          <button
            onClick={() => setShowUpload(true)}
            className="btn-primary text-base py-4 px-8 shadow-gold-lg"
          >
            {lang === 'pt' ? '🎬 Criar Meu Vídeo' : '🎬 Create My Video'}
          </button>
          <button onClick={() => setShowDemo(true)} className="btn-ghost text-base py-4 px-8">
            {lang === 'pt' ? '▶ Ver Demo' : '▶ Watch Demo'}
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-8 md:gap-12 text-center animate-fade-in">
          {[
            { val: '< 2min', labelPt: 'Processamento', labelEn: 'Processing' },
            { val: '1080×1920', labelPt: 'Resolução', labelEn: 'Resolution' },
            { val: '12', labelPt: 'Idiomas', labelEn: 'Languages' },
            { val: '30fps', labelPt: 'Taxa de quadros', labelEn: 'Frame rate' },
          ].map((s) => (
            <div key={s.val}>
              <div className="text-2xl font-extrabold text-accent">{s.val}</div>
              <div className="text-xs text-text-muted mt-0.5">{lang === 'pt' ? s.labelPt : s.labelEn}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="divider-gold mx-auto max-w-4xl" />

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="section-label mb-3">{lang === 'pt' ? 'Como Funciona' : 'How it works'}</div>
            <h2 className="text-4xl font-extrabold tracking-tight">
              {lang === 'pt' ? '4 etapas. Resultado profissional.' : '4 steps. Professional result.'}
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative group">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-accent/20 to-transparent z-10" />
                )}
                <div className="card-interactive p-6 rounded-2xl h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{step.icon}</span>
                    <span className="text-xs font-bold text-accent/50">{step.num}</span>
                  </div>
                  <h3 className="font-bold text-text-primary mb-2">{lang === 'pt' ? step.keyPt : step.keyEn}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{lang === 'pt' ? step.descPt : step.descEn}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider-gold mx-auto max-w-4xl" />

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="section-label mb-3">{lang === 'pt' ? 'Funcionalidades' : 'Features'}</div>
            <h2 className="text-4xl font-extrabold tracking-tight">
              {lang === 'pt' ? 'Tudo que você precisa' : 'Everything you need'}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.titlePt} className="glass-strong p-6 group hover:shadow-gold transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center text-xl mb-4 group-hover:bg-accent/20 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-bold text-text-primary mb-2">{lang === 'pt' ? f.titlePt : f.titleEn}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{lang === 'pt' ? f.descPt : f.descEn}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider-gold mx-auto max-w-4xl" />

      {/* ── TECH STACK ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="section-label mb-6">{lang === 'pt' ? 'Stack Tecnológica' : 'Tech Stack'}</div>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: 'Claude AI', sub: 'Anthropic' },
              { label: 'Whisper', sub: 'OpenAI' },
              { label: 'Remotion', sub: '4.0.434' },
              { label: 'Next.js', sub: '14.2' },
              { label: 'ffmpeg', sub: 'Static' },
              { label: 'TypeScript', sub: '5.0' },
            ].map((t) => (
              <div key={t.label} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border">
                <span className="font-bold text-sm text-text-primary">{t.label}</span>
                <span className="text-xs text-text-muted">{t.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO MODAL ──────────────────────────────────────────────────────── */}
      {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}

      {/* ── UPLOAD CTA ──────────────────────────────────────────────────────── */}
      {showUpload && (
        <section className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-deep/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl glass-strong shadow-gold-xl p-8">
            {/* Close */}
            <div className="flex items-center justify-between mb-6">
              <Logo size="sm" />
              <button
                onClick={() => { setShowUpload(false); setStatus('idle'); setError(null); }}
                className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-border-strong transition-all"
              >
                ✕
              </button>
            </div>

            {status === 'idle' ? (
              <>
                <UploadZone onUpload={handleUpload} />
                <div className="mt-5">
                  <label className="section-label block mb-2">{tr.home.briefLabel}</label>
                  <textarea
                    className="input-field resize-none"
                    rows={3}
                    placeholder={tr.home.briefPlaceholder}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </div>
                {error && (
                  <div className="mt-4 p-3 rounded-xl border border-danger/30 bg-danger/10 text-danger text-sm">
                    {error}
                  </div>
                )}
              </>
            ) : (
              <ProcessingStatus status={status} />
            )}
          </div>
        </section>
      )}

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-text-muted text-sm">
            {lang === 'pt'
              ? '© 2025 SmartEditor. Feito com Claude AI.'
              : '© 2025 SmartEditor. Built with Claude AI.'}
          </p>
          <div className="flex items-center gap-2">
            <FlagSwitcher />
          </div>
        </div>
      </footer>
    </div>
  );
}
