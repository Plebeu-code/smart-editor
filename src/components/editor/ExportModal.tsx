'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Props {
  isRendering: boolean;
  renderProgress: number;
  renderUrl: string | null;
  projectId: string;
  onStart: () => void;
  onClose: () => void;
}

export default function ExportModal({
  isRendering,
  renderProgress,
  renderUrl,
  projectId,
  onStart,
  onClose,
}: Props) {
  const { lang } = useLanguage();
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');

  const qualityOptions = [
    {
      id: 'high' as const,
      label: lang === 'pt' ? 'Alta' : 'High',
      detail: lang === 'pt' ? 'CRF 18 · Maior arquivo' : 'CRF 18 · Larger file',
      badge: lang === 'pt' ? 'Recomendado' : 'Recommended',
    },
    {
      id: 'medium' as const,
      label: lang === 'pt' ? 'Média' : 'Medium',
      detail: lang === 'pt' ? 'CRF 23 · Balanceado' : 'CRF 23 · Balanced',
    },
    {
      id: 'low' as const,
      label: lang === 'pt' ? 'Baixa' : 'Low',
      detail: lang === 'pt' ? 'CRF 28 · Menor arquivo' : 'CRF 28 · Smaller file',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-deep/80 backdrop-blur-sm">
      <div className="w-full max-w-md glass-strong shadow-gold-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <h2 className="font-bold text-base">
              {lang === 'pt' ? 'Exportar Vídeo' : 'Export Video'}
            </h2>
          </div>
          {!isRendering && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="p-5 space-y-5">

          {/* Format info */}
          <div className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">MP4 · H.264 · AAC</p>
              <p className="text-xs text-text-muted">1080×1920 · 9:16 · 30fps</p>
            </div>
            <span className="ml-auto text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
              TikTok / Reels
            </span>
          </div>

          {/* Quality selector */}
          {!isRendering && !renderUrl && (
            <div>
              <p className="section-label mb-2.5">
                {lang === 'pt' ? 'Qualidade' : 'Quality'}
              </p>
              <div className="space-y-2">
                {qualityOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setQuality(opt.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      quality === opt.id
                        ? 'border-accent/40 bg-accent/8'
                        : 'border-border bg-surface hover:border-border-strong'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      quality === opt.id ? 'border-accent' : 'border-border'
                    }`}>
                      {quality === opt.id && (
                        <div className="w-2 h-2 rounded-full bg-accent" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text-primary">{opt.label}</p>
                      <p className="text-xs text-text-muted">{opt.detail}</p>
                    </div>
                    {opt.badge && (
                      <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full border border-accent/20">
                        {opt.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rendering progress */}
          {isRendering && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-text-primary flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  {lang === 'pt' ? 'Renderizando…' : 'Rendering…'}
                </span>
                <span className="font-mono text-accent font-bold">{renderProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-surface overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
              <p className="text-xs text-text-muted">
                {lang === 'pt'
                  ? 'Isso pode levar alguns minutos. Não feche esta janela.'
                  : 'This may take a few minutes. Do not close this window.'}
              </p>
            </div>
          )}

          {/* Done state */}
          {renderUrl && !isRendering && (
            <div className="text-center py-2 space-y-4">
              <div className="w-12 h-12 rounded-full bg-success/15 border border-success/25 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-text-primary">
                  {lang === 'pt' ? 'Vídeo pronto!' : 'Video ready!'}
                </p>
                <p className="text-sm text-text-muted mt-0.5">
                  {lang === 'pt' ? 'Seu vídeo foi renderizado com sucesso.' : 'Your video was rendered successfully.'}
                </p>
              </div>
              <a
                href={renderUrl}
                download={`${projectId}.mp4`}
                className="btn-primary w-full justify-center py-3"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {lang === 'pt' ? 'Baixar MP4' : 'Download MP4'}
              </a>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {!isRendering && !renderUrl && (
          <div className="px-5 pb-5 flex gap-2">
            <button onClick={onClose} className="btn-surface flex-1 py-2.5 text-sm">
              {lang === 'pt' ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              onClick={onStart}
              className="btn-primary flex-1 py-2.5 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {lang === 'pt' ? 'Iniciar Renderização' : 'Start Render'}
            </button>
          </div>
        )}

        {renderUrl && !isRendering && (
          <div className="px-5 pb-5">
            <button onClick={onClose} className="btn-surface w-full py-2.5 text-sm">
              {lang === 'pt' ? 'Fechar' : 'Close'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
