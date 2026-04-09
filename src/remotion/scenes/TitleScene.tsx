/**
 * TitleScene — text anchored to the BOTTOM THIRD.
 * Top 60% of the frame shows the video unobstructed.
 */
import React from 'react';
import { useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SceneWithFrames, ColorPalette } from '@/types';

interface Props { scene: SceneWithFrames; palette: ColorPalette }

export const TitleScene: React.FC<Props> = ({ scene, palette }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ fps, frame, config: { damping: 16, stiffness: 120 }, from: 60, to: 0, durationInFrames: 20 });
  const opacity = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Bottom gradient — only covers bottom 55% */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '55%',
          background: 'linear-gradient(0deg, rgba(5,5,8,0.92) 0%, rgba(5,5,8,0.70) 45%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Text block — bottom third */}
      <div
        style={{
          position: 'absolute',
          bottom: 320,
          left: 0,
          right: 0,
          paddingLeft: 60,
          paddingRight: 60,
          opacity,
          transform: `translateY(${enter}px)`,
        }}
      >
        {/* Accent line */}
        <div
          style={{
            width: 56,
            height: 4,
            borderRadius: 2,
            background: `linear-gradient(90deg, ${palette.primary}, ${palette.secondary ?? palette.accent})`,
            marginBottom: 24,
            boxShadow: `0 0 16px ${palette.primary}80`,
          }}
        />

        <h1
          style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 800,
            fontSize: 86,
            color: '#FFFFFF',
            lineHeight: 1.1,
            letterSpacing: '-2px',
            marginBottom: scene.body ? 20 : 0,
            textShadow: '0 4px 24px rgba(0,0,0,0.6)',
          }}
        >
          {scene.title}
        </h1>

        {scene.body && (
          <p
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 400,
              fontSize: 40,
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.5,
            }}
          >
            {scene.body}
          </p>
        )}
      </div>
    </div>
  );
};
