'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Project, Scene } from '@/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import SceneList from './SceneList';
import SceneEditor from './SceneEditor';
import DubbingPanel from './DubbingPanel';
import VideoPreview from './VideoPreview';
import Timeline from './Timeline';
import ExportModal from './ExportModal';
import FlagSwitcher from '@/components/FlagSwitcher';
import Logo from '@/components/Logo';

type RightPanel = 'scene' | 'dubbing';

interface Props { projectId: string; }

const STATUS_STYLES: Record<string, string> = {
  ready:      'bg-success/15 text-success border-success/25',
  done:       'bg-accent/15 text-accent border-accent/25',
  error:      'bg-danger/15 text-danger border-danger/25',
  rendering:  'bg-blue-500/15 text-blue-400 border-blue-500/25',
};

export default function EditorLayout({ projectId }: Props) {
  const router = useRouter();
  const { tr, lang } = useLanguage();
  const [project, setProject]             = useState<Project | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [currentFrame, setCurrentFrame]   = useState(0);
  const [isRendering, setIsRendering]     = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderUrl, setRenderUrl]         = useState<string | null>(null);
  const [showExport, setShowExport]       = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [rightPanel, setRightPanel]       = useState<RightPanel>('scene');
  const [dubbingEnabled, setDubbingEnabled] = useState(false);

  // Load project
  useEffect(() => {
    fetch(`/api/project/${projectId}`)
      .then((r) => r.json())
      .then((data: Project) => {
        setProject(data);
        if (data.scenes?.length) setSelectedSceneId(data.scenes[0].id);
        // Resume if already rendering
        if (data.status === 'rendering') {
          setIsRendering(true);
          setShowExport(true);
        }
        // Restore render URL if already done
        if (data.status === 'done' && data.renderFilename) {
          setRenderUrl(`/api/video/${projectId}/render`);
        }
        // Re-enable dubbing tab if a job already exists
        if (data.dubbing) setDubbingEnabled(true);
      })
      .catch(() => setError(tr.editor.errorLoad));
  }, [projectId]);

  // Poll while rendering
  useEffect(() => {
    if (!isRendering) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/project/${projectId}`);
        const data: Project & { renderProgress?: number } = await res.json();
        setProject(data);
        if (typeof data.renderProgress === 'number') {
          setRenderProgress(data.renderProgress);
        }
        if (data.status === 'done') {
          setRenderUrl(`/api/video/${projectId}/render`);
          setRenderProgress(100);
          setIsRendering(false);
          clearInterval(interval);
        } else if (data.status === 'error') {
          setError(data.errorMessage ?? tr.editor.errorRender);
          setIsRendering(false);
          setShowExport(false);
          clearInterval(interval);
        }
      } catch { /* network blip, keep polling */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [isRendering, projectId]);

  const selectedScene = project?.scenes?.find((s) => s.id === selectedSceneId) ?? null;

  const updateScene = useCallback(async (updatedScene: Scene) => {
    if (!project) return;
    const newScenes = project.scenes!.map((s) =>
      s.id === updatedScene.id ? updatedScene : s
    );
    const res = await fetch(`/api/project/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenes: newScenes }),
    });
    setProject(await res.json());
  }, [project, projectId]);

  const deleteScene = useCallback(async (id: string) => {
    if (!project?.scenes) return;
    const newScenes = project.scenes.filter((s) => s.id !== id);
    const res = await fetch(`/api/project/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenes: newScenes }),
    });
    const updated = await res.json();
    setProject(updated);
    // Select an adjacent scene after deletion
    const remaining: Scene[] = updated.scenes ?? [];
    if (remaining.length > 0) {
      const deletedIndex = project.scenes.findIndex((s) => s.id === id);
      const newIndex = Math.min(deletedIndex, remaining.length - 1);
      setSelectedSceneId(remaining[newIndex].id);
    } else {
      setSelectedSceneId(null);
    }
  }, [project, projectId]);

  const handleRender = useCallback(async () => {
    setIsRendering(true);
    setRenderProgress(0);
    setError(null);
    try {
      const res = await fetch(`/api/render/${projectId}`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      // Render started in background — polling will pick up progress
    } catch (err) {
      setError(err instanceof Error ? err.message : tr.editor.errorRender);
      setIsRendering(false);
      setShowExport(false);
    }
  }, [projectId]);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center animate-fade-in">
          <div className="relative mx-auto mb-6 w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
            <div className="absolute inset-0 rounded-full border-2 border-t-accent animate-spin" />
          </div>
          <Logo size="sm" className="justify-center mb-3" />
          <p className="text-text-secondary text-sm">{tr.editor.loadingProject}</p>
        </div>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[project.status] ?? 'bg-surface text-text-muted border-border';
  const statusLabel =
    project.status === 'ready'     ? tr.editor.statusReady :
    project.status === 'done'      ? tr.editor.statusDone  :
    project.status === 'error'     ? tr.editor.statusError :
    project.status === 'rendering' ? (lang === 'pt' ? 'renderizando' : 'rendering') :
    project.status;

  const tabs: { id: RightPanel; label: string }[] = [
    { id: 'scene',   label: tr.editor.tabScene },
    { id: 'dubbing', label: tr.editor.tabDubbing },
  ];

  return (
    <div className="flex flex-col h-screen bg-bg overflow-hidden">

      {/* ── TOP BAR ───────────────────────────────────────────────────── */}
      <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-border glass shadow-inset-top z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push('/')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface border border-transparent hover:border-border transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <Logo size="sm" />
          <div className="h-5 w-px bg-border mx-1" />
          <p className="text-text-secondary text-sm truncate max-w-[180px] hidden sm:block">
            {project.originalFilename}
          </p>
          <span className={`badge border text-xs px-2 py-0.5 rounded-full font-semibold ${statusStyle}`}>
            {statusLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <FlagSwitcher compact />

          {/* Download button (shown after render) */}
          {renderUrl && (
            <a
              href={renderUrl}
              download={`${projectId}.mp4`}
              className="btn-surface text-sm py-2 px-4 hidden sm:flex gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {tr.editor.downloadMp4}
            </a>
          )}

          {/* Export button */}
          <button
            onClick={() => setShowExport(true)}
            disabled={project.status !== 'ready' && project.status !== 'done'}
            className="btn-primary text-sm py-2 px-5 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isRendering ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                {renderProgress > 0 ? `${renderProgress}%` : tr.editor.rendering}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {tr.editor.exportVideo}
              </>
            )}
          </button>
        </div>
      </header>

      {error && (
        <div className="px-5 py-2.5 bg-danger/8 border-b border-danger/20 text-danger text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-xs hover:text-danger-light">✕</button>
        </div>
      )}

      {/* ── MAIN LAYOUT ───────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Scene list */}
        <aside className="w-60 flex-shrink-0 border-r border-border bg-surface flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <SceneList
              scenes={project.scenes ?? []}
              srtEntries={project.transcription ?? []}
              selectedId={selectedSceneId}
              onSelect={setSelectedSceneId}
              currentFrame={currentFrame}
            />
          </div>
        </aside>

        {/* Center: Video preview */}
        <main className="flex-1 flex flex-col overflow-hidden bg-bg-deep">
          <VideoPreview
            projectId={projectId}
            project={project}
            currentFrame={currentFrame}
            onFrameChange={setCurrentFrame}
          />
        </main>

        {/* Right: Scene editor / Dubbing */}
        <aside className="w-72 flex-shrink-0 border-l border-border flex flex-col bg-surface">
          {/* Tab bar */}
          <div className="flex flex-shrink-0 bg-surface-2 border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRightPanel(tab.id)}
                className={`flex-1 py-3 text-xs font-bold transition-all duration-200 relative
                  ${rightPanel === tab.id ? 'text-accent' : 'text-text-muted hover:text-text-secondary'}
                `}
              >
                {tab.label}
                {tab.id === 'dubbing' && !dubbingEnabled && (
                  <span className="ml-1.5 text-[9px] text-text-muted border border-border/50 rounded px-1 py-px">
                    {lang === 'pt' ? 'opcional' : 'optional'}
                  </span>
                )}
                {rightPanel === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            {rightPanel === 'scene' ? (
              <SceneEditor
                scene={selectedScene}
                scenes={project.scenes ?? []}
                palette={project.palette}
                srtEntries={project.transcription ?? []}
                onUpdate={updateScene}
                onNavigate={setSelectedSceneId}
                onJumpToScene={setCurrentFrame}
                onDelete={deleteScene}
              />
            ) : dubbingEnabled ? (
              <DubbingPanel
                projectId={projectId}
                project={project}
                onProjectUpdate={setProject}
              />
            ) : (
              /* Dubbing gate screen */
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mb-4 text-2xl">
                  🎙️
                </div>
                <h3 className="font-bold text-text-primary mb-1">
                  {lang === 'pt' ? 'Dublagem com IA' : 'AI Dubbing'}
                </h3>
                <p className="text-xs text-text-muted mb-5 leading-relaxed">
                  {lang === 'pt'
                    ? 'Traduza e substitua vozes do vídeo com TTS para outro idioma. Consome créditos da API.'
                    : 'Translate and replace voices in the video with TTS in another language. Uses API credits.'}
                </p>
                <button
                  onClick={() => setDubbingEnabled(true)}
                  className="btn-primary text-sm py-2.5 px-5"
                >
                  {lang === 'pt' ? '✨ Ativar Dublagem' : '✨ Enable Dubbing'}
                </button>
                <p className="text-[10px] text-text-muted mt-3 opacity-60">
                  {lang === 'pt'
                    ? 'Usa Claude + OpenAI TTS'
                    : 'Powered by Claude + OpenAI TTS'}
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ── TIMELINE ──────────────────────────────────────────────────── */}
      <footer className="h-28 flex-shrink-0 border-t border-border bg-surface-2">
        <Timeline
          scenes={project.scenes ?? []}
          srtEntries={project.transcription ?? []}
          totalFrames={project.totalFrames ?? 900}
          currentFrame={currentFrame}
          onFrameChange={setCurrentFrame}
          onSelectScene={setSelectedSceneId}
        />
      </footer>

      {/* ── EXPORT MODAL ──────────────────────────────────────────────── */}
      {showExport && (
        <ExportModal
          isRendering={isRendering}
          renderProgress={renderProgress}
          renderUrl={renderUrl}
          projectId={projectId}
          onStart={handleRender}
          onClose={() => { if (!isRendering) setShowExport(false); }}
        />
      )}
    </div>
  );
}
