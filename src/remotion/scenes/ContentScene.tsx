/**
 * ContentScene — compact bottom card, video fully visible above.
 */
import React from 'react';
import { useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SceneWithFrames, ColorPalette } from '@/types';

interface Props { scene: SceneWithFrames; palette: ColorPalette }

export const ContentScene: React.FC<Props> = ({ scene, palette }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideUp = spring({ fps, frame, config: { damping: 18, stiffness: 130 }, from: 80, to: 0, durationInFrames: 22 });
  const opacity = interpolate(frame, [0, 5], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Bottom gradient */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(0deg, rgba(5,5,8,0.95) 0%, rgba(5,5,8,0.65) 50%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content card at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 310,
          left: 48,
          right: 48,
          opacity,
          transform: `translateY(${slideUp}px)`,
        }}
      >
        {/* Category pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: `${palette.primary}25`,
            border: `1px solid ${palette.primary}50`,
            borderRadius: 100,
            paddingTop: 6,
            paddingBottom: 6,
            paddingLeft: 18,
            paddingRight: 18,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: palette.primary,
              boxShadow: `0 0 8px ${palette.primary}`,
            }}
          />
          <span
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 700,
              fontSize: 24,
              color: palette.primary,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            {scene.type}
          </span>
        </div>

        <h2
          style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 700,
            fontSize: 72,
            color: '#FFFFFF',
            lineHeight: 1.15,
            letterSpacing: '-1px',
            marginBottom: scene.body ? 16 : 0,
            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          {scene.title}
        </h2>

        {scene.body && (
          <>
            <div
              style={{
                width: 48,
                height: 3,
                borderRadius: 2,
                background: `linear-gradient(90deg, ${palette.primary}, transparent)`,
                marginBottom: 16,
              }}
            />
            <p
              style={{
                fontFamily: 'Sora, sans-serif',
                fontWeight: 400,
                fontSize: 36,
                color: 'rgba(255,255,255,0.72)',
                lineHeight: 1.55,
              }}
            >
              {scene.body}
            </p>
          </>
        )}
      </div>
    </div>
  );
};
