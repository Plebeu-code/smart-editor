export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export type DubbingStatus =
  | 'idle'
  | 'diarizing'
  | 'translating'
  | 'generating_tts'
  | 'mixing'
  | 'done'
  | 'error';

/** One identified speaker */
export interface Speaker {
  id: string;      // "speaker_0", "speaker_1", ...
  label: string;   // "Speaker A", "John", ...
  voice: TTSVoice;
  color: string;   // hex for UI
}

/** A contiguous block of SRT entries assigned to one speaker */
export interface DiarizedSegment {
  speakerId: string;
  legIndexStart: number;  // 0-based, inclusive
  legIndexEnd: number;    // 0-based, inclusive
  originalText: string;
  startSeconds: number;
  endSeconds: number;
}

/** Same as above but with translation */
export interface TranslatedSegment extends DiarizedSegment {
  translatedText: string;
  targetLanguage: string;
}

/** A generated TTS audio clip stored on disk */
export interface TTSClip {
  segmentIndex: number;
  speakerId: string;
  filename: string;           // "tts_0.mp3"
  durationSeconds: number;
  startSeconds: number;       // when to place it in final video
}

/** Full dubbing job — stored on project */
export interface DubbingJob {
  status: DubbingStatus;
  errorMessage?: string;
  targetLanguage: string;     // "en", "es", "pt", "fr", "de", "ja", "zh"
  targetLanguageName: string; // "English", "Spanish", ...
  speakers: Speaker[];
  diarizedSegments: DiarizedSegment[];
  translatedSegments: TranslatedSegment[];
  ttsClips: TTSClip[];
  outputFilename?: string;    // "dubbed.mp4"
  createdAt: string;
  updatedAt: string;
}

export const TTS_VOICES: { id: TTSVoice; label: string; gender: string }[] = [
  { id: 'alloy',   label: 'Alloy',   gender: 'neutral' },
  { id: 'echo',    label: 'Echo',    gender: 'male'    },
  { id: 'fable',   label: 'Fable',   gender: 'male'    },
  { id: 'onyx',    label: 'Onyx',    gender: 'male'    },
  { id: 'nova',    label: 'Nova',    gender: 'female'  },
  { id: 'shimmer', label: 'Shimmer', gender: 'female'  },
];

export const SPEAKER_COLORS = [
  '#FFB800', '#4A9EFF', '#FF6B4A', '#9B59B6',
  '#2ECC71', '#E74C3C', '#1ABC9C', '#F39C12',
];

export const SUPPORTED_LANGUAGES: { code: string; name: string; flag: string }[] = [
  { code: 'en', name: 'English',    flag: '🇺🇸' },
  { code: 'es', name: 'Spanish',    flag: '🇪🇸' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'fr', name: 'French',     flag: '🇫🇷' },
  { code: 'de', name: 'German',     flag: '🇩🇪' },
  { code: 'it', name: 'Italian',    flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese',   flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese',    flag: '🇨🇳' },
  { code: 'ko', name: 'Korean',     flag: '🇰🇷' },
  { code: 'ru', name: 'Russian',    flag: '🇷🇺' },
  { code: 'ar', name: 'Arabic',     flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi',      flag: '🇮🇳' },
];
