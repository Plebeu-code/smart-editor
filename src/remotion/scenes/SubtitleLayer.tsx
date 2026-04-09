import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { SRTEntry, Sentiment } from '@/types';

const SENTIMENT_COLOR: Record<Sentiment, string> = {
  positive: '#FFD166',
  negative: '#F87171',
  neutral: '#FFFFFF',
  exciting: '#FFB800',
};

interface Props { srtEntries: SRTEntry[] }

export const SubtitleLayer: React.FC<Props> = ({ srtEntries }) => {
  const frame = useCurrentFrame();

  const currentEntry = srtEntries.find(
    (e) => frame >= e.startFrame && frame <= e.endFrame
  );
  if (!currentEntry) return null;

  const entryDuration = Math.max(currentEntry.endFrame - currentEntry.startFrame, 1);
  const localFrame = frame - currentEntry.startFrame;

  // Gentle fade in/out — no spring for performance
  const opacity = interpolate(
    localFrame,
    [0, 3, entryDuration - 3, entryDuration],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const words = currentEntry.words;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 190,
        left: 0,
        right: 0,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 56,
        paddingRight: 56,
        gap: 10,
        opacity,
      }}
    >
      {words && words.length > 0 ? (
        words.map((word, i) => {
          const isActive = frame >= word.startFrame && frame <= word.endFrame;
          const isPast = frame > word.endFrame;
          const color = isActive
            ? SENTIMENT_COLOR[word.sentiment]
            : isPast ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)';

          return (
            <span
              key={i}
              style={{
                fontFamily: 'Sora, sans-serif',
                fontWeight: isActive ? 800 : 600,
                fontSize: isActive ? 52 : 46,
                color,
                display: 'inline-block',
                lineHeight: 1.3,
                textShadow: '0 2px 12px rgba(0,0,0,0.9)',
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              {word.word}
            </span>
          );
        })
      ) : (
        <span
          style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 700,
            fontSize: 46,
            color: '#FFFFFF',
            textAlign: 'center',
            lineHeight: 1.35,
            textShadow: '0 2px 16px rgba(0,0,0,0.9)',
          }}
        >
          {currentEntry.text}
        </span>
      )}
    </div>
  );
};
