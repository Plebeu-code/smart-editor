import React from 'react';
import { AbsoluteFill, OffthreadVideo, Video, Sequence, getRemotionEnvironment } from 'remotion';
import { RenderProps, SceneWithFrames } from '@/types';
import { TitleScene } from '../scenes/TitleScene';
import { ContentScene } from '../scenes/ContentScene';
import { HighlightScene } from '../scenes/HighlightScene';
import { OutroScene } from '../scenes/OutroScene';
import { SubtitleLayer } from '../scenes/SubtitleLayer';

function SceneRenderer({ scene, palette }: { scene: SceneWithFrames; palette: RenderProps['palette'] }) {
  switch (scene.type) {
    case 'title':     return <TitleScene scene={scene} palette={palette} />;
    case 'highlight': return <HighlightScene scene={scene} palette={palette} />;
    case 'outro':     return <OutroScene scene={scene} palette={palette} />;
    default:          return <ContentScene scene={scene} palette={palette} />;
  }
}

export const MainVideo: React.FC<RenderProps> = ({
  scenes,
  srtEntries,
  videoSrc,
  palette,
  totalFrames,
}) => {
  // OffthreadVideo = frame-by-frame canvas (render only).
  // Video = native <video> element (browser Player preview).
  const { isRendering } = getRemotionEnvironment();

  return (
    <AbsoluteFill style={{ backgroundColor: palette.background }}>

      {/* ── Background video — full visibility ─────────────────────── */}
      <AbsoluteFill>
        {isRendering ? (
          <OffthreadVideo
            src={videoSrc}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Video
            src={videoSrc}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        {/* Very subtle top darkening so text at bottom stays readable */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(5,5,8,0.12) 0%, transparent 25%, transparent 55%, rgba(5,5,8,0.25) 75%)',
            pointerEvents: 'none',
          }}
        />
      </AbsoluteFill>

      {/* ── Scene text overlays (each owns its own gradient) ────────── */}
      {scenes.map((scene) => (
        <Sequence
          key={scene.id}
          from={scene.startFrame}
          durationInFrames={Math.max(scene.durationFrames, 1)}
        >
          <AbsoluteFill style={{ pointerEvents: 'none' }}>
            <SceneRenderer scene={scene} palette={palette} />
          </AbsoluteFill>
        </Sequence>
      ))}

      {/* ── Subtitles — always on top ────────────────────────────────── */}
      <SubtitleLayer srtEntries={srtEntries} />

      {/* ── Edge vignette ───────────────────────────────────────────── */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.25) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
