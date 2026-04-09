import React from 'react';
import { Composition } from 'remotion';
import { MainVideo } from './compositions/MainVideo';
import { RenderProps } from '@/types';

const defaultProps: RenderProps = {
  scenes: [],
  srtEntries: [],
  videoSrc: '',
  palette: {
    primary: '#FFB800',
    secondary: '#FF6B00',
    accent: '#FFB800',
    background: '#050508',
    text: '#FFFFFF',
  },
  totalFrames: 900,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MainVideoComp = MainVideo as any;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MainVideo"
      component={MainVideoComp}
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
      calculateMetadata={async ({ props }: { props: unknown }) => {
        const p = props as unknown as RenderProps;
        return { durationInFrames: p.totalFrames > 0 ? p.totalFrames : 900 };
      }}
    />
  );
};
