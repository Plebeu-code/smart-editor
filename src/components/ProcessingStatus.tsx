'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';

type Stage = 'uploading' | 'normalizing' | 'transcribing' | 'analyzing' | 'ready';
const ORDER: Stage[] = ['uploading', 'normalizing', 'transcribing', 'analyzing', 'ready'];

interface Props { status: Stage; }

export default function ProcessingStatus({ status }: Props) {
  const { tr } = useLanguage();
  const currentIdx = ORDER.indexOf(status);
  const stages = tr.processing.stages;

  return (
    <div className="glass-card p-8 shadow-card animate-fade-in">
      <h2 className="text-xl font-bold text-center mb-8">{tr.processing.title}</h2>

      <div className="space-y-4">
        {stages.map((stage, idx) => {
          const isDone = idx < currentIdx;
          const isActive = idx === currentIdx;
          const isPending = idx > currentIdx;

          return (
            <div
              key={idx}
              className={`
                flex items-center gap-4 p-4 rounded-xl transition-all duration-500
                ${isActive ? 'bg-accent/10 border border-accent/30' : ''}
                ${isDone ? 'opacity-60' : ''}
                ${isPending ? 'opacity-30' : ''}
              `}
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg
                transition-all duration-500
                ${isDone ? 'bg-green-500/20' : isActive ? 'bg-accent/20 animate-pulse-gold' : 'bg-surface'}
              `}>
                {isDone ? '✅' : isActive ? <span className="animate-spin text-sm">⏳</span> : stage.icon}
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${isActive ? 'text-accent' : 'text-text-primary'}`}>
                  {stage.label}
                </p>
                <p className="text-text-muted text-sm">{stage.desc}</p>
              </div>
              {isActive && (
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent"
                      style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 h-1 bg-surface rounded-full overflow-hidden">
        <div
          className="h-full bg-gold-gradient rounded-full transition-all duration-700"
          style={{ width: `${(currentIdx / (stages.length - 1)) * 100}%` }}
        />
      </div>
      <p className="text-center text-text-muted text-sm mt-2">
        {tr.processing.stepOf(currentIdx + 1, stages.length)}
      </p>
    </div>
  );
}
