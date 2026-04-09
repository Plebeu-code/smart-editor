'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Project, SceneWithFrames, SRTEntry, Sentiment } from '@/types';
import { convertScenesFromLegendaIndex } from '@/lib/timing';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Props {
  projectId: string;
  project: Project;
  currentFrame: number;
  onFrameChange: (frame: number) => void;
}

const FPS = 30;

const SENTIMENT_COLOR: Record<Sentiment, string> = {
  positive: '#FFD166',
  negative: '#F87171',
  neutral: '#FFFFFF',
  exciting: '#FFB800',
};

const SCENE_TYPE_LABEL: Record<string, string> = {
  title: 'TÍTULO', content: 'CONTEÚDO', highlight: 'DESTAQUE', outro: 'ENCERRAMENTO',
};

const SPEEDS = [0.25, 0.5, 1, 1.5, 2];

type VideoMode = 'original' | 'dubbed';

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec) % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function VolumeIcon({ level, muted }: { level: number; muted: boolean }) {
  if (muted || level === 0) return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
    </svg>
  );
  if (level < 0.5) return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  );
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  );
}

export default function VideoPreview({ projectId, project, currentFrame, onFrameChange }: Props) {
  const { lang } = useLanguage();
  const videoRef      = useRef<HTMLVideoElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const hideTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekBarRef    = useRef<HTMLDivElement>(null);
  const frameFromVideo = useRef(false);
  const switchPendingTime = useRef<number | null>(null);

  const [isReady,       setIsReady]       = useState(false);
  const [isPlaying,     setIsPlaying]     = useState(false);
  const [duration,      setDuration]      = useState(0);
  const [volume,        setVolume]        = useState(1);
  const [muted,         setMuted]         = useState(false);
  const [speed,         setSpeed]         = useState(1);
  const [showControls,  setShowControls]  = useState(true);
  const [showSpeed,     setShowSpeed]     = useState(false);
  const [isFullscreen,  setIsFullscreen]  = useState(false);
  const [hoverTime,     setHoverTime]     = useState<{ x: number; time: number } | null>(null);
  const [sceneToast,    setSceneToast]    = useState<string | null>(null);
  const [videoMode,     setVideoMode]     = useState<VideoMode>('original');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scenes     = project.scenes     ?? [];
  const srtEntries = project.transcription ?? [];
  const totalFrames = Math.max(project.totalFrames ?? 900, 1);
  const palette    = project.palette ?? { primary: '#FFB800', secondary: '#FF6B00', accent: '#FFB800', background: '#050508', text: '#FFFFFF' };

  const hasDubbing = project.dubbing?.status === 'done';

  const videoSrc = videoMode === 'dubbed'
    ? `/api/video/${projectId}/dubbed`
    : `/api/video/${projectId}/normalized`;

  const scenesWithFrames = srtEntries.length > 0
    ? convertScenesFromLegendaIndex(scenes, srtEntries)
    : [];

  const currentScene = scenesWithFrames.find(s => currentFrame >= s.startFrame && currentFrame <= s.endFrame) ?? null;
  const currentEntry = srtEntries.find(e => currentFrame >= e.startFrame && currentFrame <= e.endFrame) ?? null;

  // Show scene toast on scene change
  const prevSceneId = useRef<string | null>(null);
  useEffect(() => {
    if (currentScene && currentScene.id !== prevSceneId.current) {
      prevSceneId.current = currentScene.id;
      setSceneToast(currentScene.title);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setSceneToast(null), 1800);
    }
  }, [currentScene?.id]);

  // Auto-hide controls
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (isPlaying) {
      hideTimer.current = setTimeout(() => setShowControls(false), 2800);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) setShowControls(true);
  }, [isPlaying]);

  // Sync external frame changes → video time
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isReady || frameFromVideo.current) {
      frameFromVideo.current = false;
      return;
    }
    const targetTime = currentFrame / FPS;
    if (Math.abs(video.currentTime - targetTime) > 0.15) {
      video.currentTime = targetTime;
    }
  }, [currentFrame, isReady]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          e.shiftKey
            ? (video.currentTime = Math.max(0, video.currentTime - 5))
            : onFrameChange(Math.max(0, currentFrame - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          e.shiftKey
            ? (video.currentTime = Math.min(video.duration, video.currentTime + 5))
            : onFrameChange(Math.min(totalFrames - 1, currentFrame + 1));
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case ',':
          e.preventDefault();
          onFrameChange(Math.max(0, currentFrame - 1));
          break;
        case '.':
          e.preventDefault();
          onFrameChange(Math.min(totalFrames - 1, currentFrame + 1));
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentFrame, totalFrames, isPlaying]);

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;
    frameFromVideo.current = true;
    onFrameChange(Math.round(video.currentTime * FPS));
  }

  function handleLoaded() {
    const video = videoRef.current;
    if (!video) return;
    setIsReady(true);
    setDuration(video.duration);
    // Restore time position after source switch
    if (switchPendingTime.current !== null) {
      video.currentTime = Math.min(switchPendingTime.current, video.duration);
      switchPendingTime.current = null;
    }
  }

  function switchMode(mode: VideoMode) {
    if (mode === videoMode) return;
    const video = videoRef.current;
    if (video) switchPendingTime.current = video.currentTime;
    setIsReady(false);
    setIsPlaying(false);
    setVideoMode(mode);
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
    showControlsTemporarily();
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  function handleVolumeChange(v: number) {
    const video = videoRef.current;
    if (!video) return;
    video.volume = v;
    video.muted = v === 0;
    setVolume(v);
    setMuted(v === 0);
  }

  function handleSpeedChange(s: number) {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = s;
    setSpeed(s);
    setShowSpeed(false);
  }

  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }

  function stepFrames(delta: number) {
    const f = Math.max(0, Math.min(totalFrames - 1, currentFrame + delta));
    onFrameChange(f);
    if (videoRef.current) videoRef.current.currentTime = f / FPS;
  }

  function handleSeekBarClick(e: React.MouseEvent<HTMLDivElement>) {
    const bar = seekBarRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetFrame = Math.round(pct * totalFrames);
    onFrameChange(targetFrame);
    if (videoRef.current) videoRef.current.currentTime = targetFrame / FPS;
  }

  function handleSeekBarHover(e: React.MouseEvent<HTMLDivElement>) {
    const bar = seekBarRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime({ x: e.clientX - rect.left, time: pct * duration });
  }

  const progressPct = totalFrames > 0 ? (currentFrame / totalFrames) * 100 : 0;
  const currentSeconds = currentFrame / FPS;

  return (
    <div className="flex-1 flex items-center justify-center bg-bg-deep overflow-hidden p-3">
      <div className="flex flex-col items-center gap-2 h-full">

        {/* ── Source toggle (Original / Dublado) ─────────────────────── */}
        {hasDubbing && (
          <div className="flex items-center gap-0 bg-surface border border-border rounded-full p-0.5 shadow-sm">
            {(['original', 'dubbed'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => switchMode(mode)}
                className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                  videoMode === mode
                    ? 'bg-accent text-bg shadow'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {mode === 'original' ? (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {lang === 'pt' ? 'Original' : 'Original'}
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                    {lang === 'pt' ? 'Dublado' : 'Dubbed'}
                  </>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Phone frame ─────────────────────────────────────────── */}
        <div
          ref={containerRef}
          className="relative rounded-2xl overflow-hidden border border-border shadow-gold-lg bg-black flex-shrink-0 group"
          style={{ height: 'min(calc(100vh - 230px), 550px)', aspectRatio: '9/16' }}
          onMouseMove={showControlsTemporarily}
          onMouseLeave={() => isPlaying && setShowControls(false)}
        >
          {/* Video */}
          <video
            key={videoSrc}
            ref={videoRef}
            src={videoSrc}
            className="absolute inset-0 w-full h-full object-cover"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoaded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => { setIsPlaying(false); setShowControls(true); }}
            playsInline
            preload="metadata"
            muted={muted}
          />

          {/* Dubbed badge */}
          {videoMode === 'dubbed' && isReady && (
            <div
              className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(5,5,8,0.75)',
                border: `1px solid ${palette.primary}50`,
                backdropFilter: 'blur(8px)',
                zIndex: 20,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-accent font-bold" style={{ fontSize: 8 }}>
                {lang === 'pt' ? 'DUBLADO' : 'DUBBED'}
              </span>
            </div>
          )}

          {/* Loading */}
          {!isReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg gap-3">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              {videoMode === 'dubbed' && (
                <span className="text-xs text-text-muted">
                  {lang === 'pt' ? 'Carregando vídeo dublado...' : 'Loading dubbed video...'}
                </span>
              )}
            </div>
          )}

          {/* Gradient for readability */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(5,5,8,0.15) 0%, transparent 35%, transparent 50%, rgba(5,5,8,0.55) 72%, rgba(5,5,8,0.92) 100%)',
            }}
          />

          {/* Scene toast */}
          {sceneToast && (
            <div
              className="absolute top-3 left-0 right-0 flex justify-center pointer-events-none animate-slide-up"
              style={{ zIndex: 20 }}
            >
              <div
                className="text-xs font-bold px-3 py-1.5 rounded-full"
                style={{
                  background: `${palette.primary}22`,
                  border: `1px solid ${palette.primary}50`,
                  color: palette.primary,
                  backdropFilter: 'blur(8px)',
                }}
              >
                {sceneToast}
              </div>
            </div>
          )}

          {/* Scene text overlay */}
          {currentScene && (
            <div
              className="absolute left-0 right-0 pointer-events-none"
              style={{ bottom: currentEntry ? 100 : 70, padding: '0 18px', zIndex: 10 }}
            >
              <div
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 mb-1"
                style={{ background: `${palette.primary}28`, border: `1px solid ${palette.primary}45` }}
              >
                <div className="w-1 h-1 rounded-full" style={{ background: palette.primary }} />
                <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 9, color: palette.primary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {SCENE_TYPE_LABEL[currentScene.type] ?? currentScene.type}
                </span>
              </div>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 16, color: '#fff', lineHeight: 1.2, textShadow: '0 2px 8px rgba(0,0,0,0.8)', marginBottom: 3 }}>
                {currentScene.title}
              </h2>
              {currentScene.body && (
                <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 400, fontSize: 10.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.45 }}>
                  {currentScene.body}
                </p>
              )}
            </div>
          )}

          {/* Subtitles */}
          {currentEntry && (
            <div
              className="absolute left-0 right-0 flex flex-wrap justify-center items-center pointer-events-none"
              style={{ bottom: 52, padding: '0 14px', gap: 3, zIndex: 10 }}
            >
              {currentEntry.words?.length ? currentEntry.words.map((word, i) => {
                const isActive = currentFrame >= word.startFrame && currentFrame <= word.endFrame;
                const isPast = currentFrame > word.endFrame;
                return (
                  <span key={i} style={{
                    fontFamily: 'Sora, sans-serif',
                    fontWeight: isActive ? 800 : 600,
                    fontSize: isActive ? 12.5 : 11.5,
                    color: isActive ? SENTIMENT_COLOR[word.sentiment] : isPast ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.18)',
                    textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                    transform: isActive ? 'scale(1.08)' : 'scale(1)',
                    display: 'inline-block',
                    lineHeight: 1.3,
                  }}>
                    {word.word}
                  </span>
                );
              }) : (
                <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 11.5, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.9)', textAlign: 'center' }}>
                  {currentEntry.text}
                </span>
              )}
            </div>
          )}

          {/* ── Glass controls bar ──────────────────────────────────── */}
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-300 pointer-events-auto"
            style={{
              opacity: showControls ? 1 : 0,
              transform: showControls ? 'translateY(0)' : 'translateY(6px)',
              zIndex: 30,
            }}
          >
            {/* Seek bar */}
            <div
              ref={seekBarRef}
              className="relative mx-2 mb-1.5 cursor-pointer group/seek"
              style={{ height: 20, display: 'flex', alignItems: 'center' }}
              onClick={handleSeekBarClick}
              onMouseMove={handleSeekBarHover}
              onMouseLeave={() => setHoverTime(null)}
            >
              {/* Track */}
              <div className="absolute left-0 right-0 rounded-full overflow-hidden" style={{ height: 3, top: '50%', transform: 'translateY(-50%)' }}>
                {/* Scene segments */}
                {scenesWithFrames.map((scene) => {
                  const SCENE_COLORS: Record<string, string> = {
                    title: palette.primary, content: '#60a5fa', highlight: '#f472b6', outro: '#a78bfa',
                  };
                  return (
                    <div
                      key={scene.id}
                      className="absolute top-0 bottom-0"
                      style={{
                        left: `${(scene.startFrame / totalFrames) * 100}%`,
                        width: `${(scene.durationFrames / totalFrames) * 100}%`,
                        background: SCENE_COLORS[scene.type] ?? palette.primary,
                        opacity: 0.35,
                      }}
                    />
                  );
                })}
                {/* Base */}
                <div className="absolute inset-0 bg-white/15 rounded-full" />
                {/* Progress */}
                <div
                  className="absolute top-0 left-0 bottom-0 rounded-full transition-none"
                  style={{ width: `${progressPct}%`, background: palette.primary }}
                />
              </div>

              {/* Thumb */}
              <div
                className="absolute w-3 h-3 rounded-full shadow-lg opacity-0 group-hover/seek:opacity-100 transition-opacity"
                style={{
                  left: `calc(${progressPct}% - 6px)`,
                  top: '50%', transform: 'translateY(-50%)',
                  background: palette.primary,
                  boxShadow: `0 0 6px ${palette.primary}`,
                }}
              />

              {/* Hover tooltip */}
              {hoverTime && (
                <div
                  className="absolute bottom-5 text-xs bg-bg border border-border rounded px-1.5 py-0.5 font-mono pointer-events-none"
                  style={{ left: hoverTime.x - 20, minWidth: 40, textAlign: 'center' }}
                >
                  {formatTime(hoverTime.time)}
                </div>
              )}
            </div>

            {/* Buttons row */}
            <div
              className="flex items-center gap-1 px-2 pb-2"
              style={{ backdropFilter: 'blur(12px)', background: 'linear-gradient(0deg, rgba(5,5,8,0.85) 0%, transparent 100%)' }}
            >
              {/* Step back */}
              <button onClick={() => stepFrames(-1)} className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white transition-colors rounded" title="← 1 frame (,)">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" /></svg>
              </button>

              {/* Rewind 5s */}
              <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5); }} className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white transition-colors rounded" title="←5s (Shift+←)">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" /></svg>
              </button>

              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105"
                style={{ background: palette.primary }}
                title="Play/Pause (Space)"
              >
                {isPlaying ? (
                  <svg className="w-3.5 h-3.5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>

              {/* Forward 5s */}
              <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 5); }} className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white transition-colors rounded" title="→5s (Shift+→)">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" /></svg>
              </button>

              {/* Step forward */}
              <button onClick={() => stepFrames(1)} className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white transition-colors rounded" title="→ 1 frame (.)">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 3.9V8.1L8.5 12zM16 6h2v12h-2z" /></svg>
              </button>

              {/* Time */}
              <span className="text-white/60 font-mono ml-1" style={{ fontSize: 9 }}>
                {formatTime(currentSeconds)} / {formatTime(duration)}
              </span>

              <div className="flex-1" />

              {/* Volume */}
              <button onClick={toggleMute} className="w-6 h-6 flex items-center justify-center text-white/70 hover:text-white transition-colors" title="Mute (M)">
                <VolumeIcon level={volume} muted={muted} />
              </button>
              <input
                type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-12 h-1 rounded cursor-pointer"
                style={{ accentColor: palette.primary }}
              />

              {/* Speed */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeed(!showSpeed)}
                  className="text-white/70 hover:text-white transition-colors font-bold rounded px-1.5"
                  style={{ fontSize: 10 }}
                  title="Velocidade"
                >
                  {speed}×
                </button>
                {showSpeed && (
                  <div className="absolute bottom-7 right-0 bg-bg border border-border rounded-lg overflow-hidden shadow-lg" style={{ zIndex: 50 }}>
                    {SPEEDS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSpeedChange(s)}
                        className={`block w-full px-4 py-1.5 text-right transition-colors hover:bg-surface ${s === speed ? 'text-accent font-bold' : 'text-text-secondary'}`}
                        style={{ fontSize: 11 }}
                      >
                        {s}×
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button onClick={toggleFullscreen} className="w-6 h-6 flex items-center justify-center text-white/70 hover:text-white transition-colors" title="Tela cheia (F)">
                {isFullscreen ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" /></svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Keyboard shortcuts hint ─────────────────────────────────── */}
        <div className="flex items-center gap-3 text-xs text-text-muted/50">
          {[
            ['Space', 'play/pause'],
            [', .', '±1 frame'],
            ['Shift+←→', '±5s'],
            ['M', lang === 'pt' ? 'mudo' : 'mute'],
            ['F', lang === 'pt' ? 'tela cheia' : 'fullscreen'],
          ].map(([key, label]) => (
            <span key={key} className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border border-border/40 bg-surface/50 font-mono" style={{ fontSize: 9 }}>{key}</kbd>
              <span style={{ fontSize: 9 }}>{label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
