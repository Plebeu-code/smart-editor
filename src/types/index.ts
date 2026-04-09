export type { DubbingJob } from './dubbing';

export type ProjectStatus =
  | 'uploading'
  | 'normalizing'
  | 'transcribing'
  | 'analyzing'
  | 'ready'
  | 'rendering'
  | 'done'
  | 'error';

export type SceneType = 'title' | 'content' | 'highlight' | 'outro';
export type Sentiment = 'positive' | 'negative' | 'neutral' | 'exciting';
export type NarrativeFormat =
  | 'educational'
  | 'storytelling'
  | 'tutorial'
  | 'highlight'
  | 'news'
  | 'entertainment';

export interface SRTEntry {
  index: number; // 1-based SRT index
  legIndex: number; // 0-based for startLeg reference
  startTime: string; // "00:00:01,234"
  endTime: string;
  text: string;
  startSeconds: number;
  endSeconds: number;
  startFrame: number; // at 30fps
  endFrame: number;
  words: WordTiming[];
}

export interface WordTiming {
  word: string;
  startFrame: number;
  endFrame: number;
  sentiment: Sentiment;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface Scene {
  id: string;
  type: SceneType;
  startLeg: number; // 0-based index of SRTEntry where scene starts
  title: string;
  body?: string;
  sentiment: Sentiment;
  visualStyle: 'minimal' | 'bold' | 'cinematic';
  illustration?: string; // URL or base64
}

export interface SceneWithFrames extends Scene {
  startFrame: number;
  endFrame: number;
  durationFrames: number;
}

export interface Project {
  id: string;
  status: ProjectStatus;
  errorMessage?: string;
  originalFilename: string;
  videoFilename?: string; // normalized filename
  rawFilename?: string; // original uploaded filename
  transcription?: SRTEntry[];
  totalFrames?: number;
  scenes?: Scene[];
  palette?: ColorPalette;
  narrativeFormat?: NarrativeFormat;
  renderFilename?: string;
  prompt?: string;
  dubbing?: import('./dubbing').DubbingJob;
  createdAt: string;
  updatedAt: string;
}

export interface RenderProps {
  scenes: SceneWithFrames[];
  srtEntries: SRTEntry[];
  videoSrc: string;
  palette: ColorPalette;
  totalFrames: number;
}
