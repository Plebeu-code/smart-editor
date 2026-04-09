/**
 * OutroScene — CTA at bottom, animated rings behind video.
 */
import React from 'react';
import { useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SceneWithFrames, ColorPalette } from '@/types';

interface Props { scene: SceneWithFrames; palette: ColorPalette }

export const OutroScene: React.FC<Props> = ({ scene, palette }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ fps, frame, config: { damping: 16, stiffness: 110 }, from: 70, to: 0, durationInFrames: 22 });
  const opacity = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: 'clamp' });

  const ring1 = spring({ fps, frame,                              config: { damping: 12, stiffness: 70 }, from: 0, to: 1, durationInFrames: 28 });
  const ring2 = spring({ fps, frame: Math.max(0, frame - 5),     config: { damping: 12, stiffness: 70 }, from: 0, to: 1, durationInFrames: 28 });
  const ring3 = spring({ fps, frame: Math.max(0, frame - 10),    config: { damping: 12, stiffness: 70 }, from: 0, to: 1, durationInFrames: 28 });

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Subtle top vignette so rings feel integrated */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(180deg, rgba(5,5,8,0.3) 0%, transparent 100%)',
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
          height: '55%',
          background: 'linear-gradient(0deg, rgba(5,5,8,0.95) 0%, rgba(5,5,8,0.6) 50%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Animated rings — decorative, centered in bottom 40% */}
      <div
        style={{
          position: 'absolute',
          bottom: 820,
          left: '50%',
          width: 0,
          height: 0,
        }}
      >
        {[ring1, ring2, ring3].map((r, i) => {
          const size = 80 + i * 52;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: '50%',
                border: `1.5px solid ${palette.primary}`,
                opacity: (0.5 - i * 0.12) * r,
                transform: `translate(-50%, -50%) scale(${r})`,
                boxShadow: i === 0 ? `0 0 20px ${palette.primary}40` : 'none',
              }}
            />
          );
        })}
        {/* Center dot */}
        <div
          style={{
            position: 'absolute',
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`,
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 20px ${palette.primary}`,
            opacity: ring1,
          }}
        />
      </div>

      {/* Text block */}
      <div
        style={{
          position: 'absolute',
          bottom: 330,
          left: 60,
          right: 60,
          opacity,
          transform: `translateY(${enter}px)`,
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 800,
            fontSize: 80,
            color: '#FFFFFF',
            lineHeight: 1.15,
            letterSpacing: '-1.5px',
            marginBottom: scene.body ? 18 : 0,
            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          {scene.title}
        </h2>

        {scene.body && (
          <p
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 600,
              fontSize: 38,
              color: palette.primary,
              lineHeight: 1.4,
              marginBottom: 28,
            }}
          >
            {scene.body}
          </p>
        )}

        {/* CTA line */}
        <div
          style={{
            width: 200,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${palette.primary}, transparent)`,
            borderRadius: 1,
            margin: '0 auto',
          }}
        />
      </div>
    </div>
  );
};
