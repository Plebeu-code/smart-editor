/**
 * HighlightScene — glowing quote card anchored to lower-center.
 * Video is visible above the card.
 */
import React from 'react';
import { useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SceneWithFrames, ColorPalette } from '@/types';

interface Props { scene: SceneWithFrames; palette: ColorPalette }

export const HighlightScene: React.FC<Props> = ({ scene, palette }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ fps, frame, config: { damping: 14, stiffness: 160, mass: 0.7 }, from: 0.8, to: 1, durationInFrames: 18 });
  const opacity = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Subtle ambient glow at card position */}
      <div
        style={{
          position: 'absolute',
          bottom: 200,
          left: 0,
          right: 0,
          height: 800,
          background: `radial-gradient(ellipse at 50% 70%, ${palette.primary}18 0%, transparent 65%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Bottom gradient */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '52%',
          background: 'linear-gradient(0deg, rgba(5,5,8,0.92) 0%, rgba(5,5,8,0.5) 50%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Card — centered vertically in bottom 50% */}
      <div
        style={{
          position: 'absolute',
          bottom: 300,
          left: 48,
          right: 48,
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        <div
          style={{
            background: 'rgba(10,10,20,0.82)',
            border: `1.5px solid ${palette.primary}45`,
            borderRadius: 28,
            padding: '48px 44px',
            backdropFilter: 'blur(16px)',
            boxShadow: `0 0 48px ${palette.primary}18, 0 8px 32px rgba(0,0,0,0.4)`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 44,
              right: 44,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${palette.primary}, transparent)`,
            }}
          />

          {/* Quote mark */}
          <div
            style={{
              fontFamily: 'serif',
              fontSize: 80,
              lineHeight: 0.6,
              color: palette.primary,
              opacity: 0.35,
              marginBottom: 12,
            }}
          >
            "
          </div>

          <p
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 800,
              fontSize: 68,
              color: '#FFFFFF',
              textAlign: 'center',
              lineHeight: 1.2,
              marginBottom: scene.body ? 20 : 0,
              letterSpacing: '-0.5px',
            }}
          >
            {scene.title}
          </p>

          {scene.body && (
            <p
              style={{
                fontFamily: 'Sora, sans-serif',
                fontWeight: 400,
                fontSize: 34,
                color: 'rgba(255,255,255,0.65)',
                textAlign: 'center',
                lineHeight: 1.5,
              }}
            >
              {scene.body}
            </p>
          )}

          {/* Bottom line */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 44,
              right: 44,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${palette.accent}, transparent)`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
