export type Lang = 'pt' | 'en';

const t = {
  pt: {
    // ── Home ──────────────────────────────────────────────────────────────
    home: {
      badge: 'Editor de Vídeo com IA',
      title: 'Transforme Vídeos com',
      titleHighlight: 'IA',
      description:
        'Envie um vídeo bruto e receba um vídeo vertical pronto para produção com cenas geradas por IA, legendas animadas e edição inteligente.',
      briefLabel: 'Briefing Criativo (opcional)',
      briefPlaceholder:
        "Descreva o estilo, humor ou mensagem principal... (ex: 'Deixe energético e motivacional')",
      errorGeneric: 'Algo deu errado',
      errorUpload: 'Falha no envio do arquivo',
      errorTranscribe: 'Falha na transcrição',
      errorAnalyze: 'Falha na análise',
      features: [
        { icon: '🎙️', label: 'Whisper AI', desc: 'Transcrição automática' },
        { icon: '🧠', label: 'Claude AI', desc: 'Inteligência de cenas' },
        { icon: '🎬', label: 'Remotion', desc: 'Renderização profissional' },
      ],
    },

    // ── Processing ────────────────────────────────────────────────────────
    processing: {
      title: 'Processando seu vídeo',
      stepOf: (a: number, b: number) => `Etapa ${a} de ${b}`,
      stages: [
        { label: 'Enviando', desc: 'Transferindo vídeo para o servidor', icon: '📤' },
        { label: 'Normalizando', desc: 'Convertendo para H.264 @ 30fps', icon: '⚙️' },
        { label: 'Transcrevendo', desc: 'Whisper AI processando o áudio', icon: '🎙️' },
        { label: 'Analisando', desc: 'Claude criando estrutura de cenas', icon: '🧠' },
        { label: 'Pronto', desc: 'Abrindo editor...', icon: '✅' },
      ],
    },

    // ── Upload Zone ───────────────────────────────────────────────────────
    upload: {
      idle: 'Solte seu vídeo',
      dragging: 'Solte aqui',
      formats: 'MP4, MOV, AVI, HEVC — até 2GB',
      browse: 'Procurar arquivos',
    },

    // ── Editor Layout ─────────────────────────────────────────────────────
    editor: {
      loadingProject: 'Carregando projeto...',
      downloadMp4: 'Baixar MP4',
      exportVideo: 'Exportar Vídeo',
      rendering: 'Renderizando...',
      errorLoad: 'Falha ao carregar projeto',
      errorRender: 'Falha na renderização',
      tabScene: '🎬 Cena',
      tabDubbing: '🌐 Dublagem',
      statusReady: 'pronto',
      statusDone: 'concluído',
      statusError: 'erro',
    },

    // ── Scene List ────────────────────────────────────────────────────────
    sceneList: {
      heading: (n: number) => `Cenas (${n})`,
    },

    // ── Scene Editor ──────────────────────────────────────────────────────
    sceneEditor: {
      heading: 'Editor de Cena',
      saving: 'Salvando',
      empty: 'Selecione uma cena para editar',
      typeLabel: 'Tipo',
      titleLabel: 'Título',
      titlePlaceholder: 'Título da cena...',
      bodyLabel: 'Texto do Corpo',
      bodyPlaceholder: 'Texto de apoio (opcional)...',
      sentimentLabel: 'Sentimento',
      visualStyleLabel: 'Estilo Visual',
      paletteLabel: 'Paleta de Cores',
      startPos: (n: number) => `Posição inicial: legenda #${n}`,
      sceneTypes: {
        title: 'Título',
        content: 'Conteúdo',
        highlight: 'Destaque',
        outro: 'Encerramento',
      },
      sentiments: {
        positive: 'Positivo',
        negative: 'Negativo',
        neutral: 'Neutro',
        exciting: 'Empolgante',
      },
      visualStyles: {
        minimal: 'Minimalista',
        bold: 'Marcante',
        cinematic: 'Cinemático',
      },
    },

    // ── Video Preview ─────────────────────────────────────────────────────
    videoPreview: {
      loading: 'Carregando preview...',
      total: 's total',
    },

    // ── Timeline ──────────────────────────────────────────────────────────
    timeline: {
      heading: 'Linha do Tempo',
    },

    // ── Dubbing Panel ─────────────────────────────────────────────────────
    dubbing: {
      heading: 'Dublagem de Voz',
      description:
        'Detecte falantes automaticamente, traduza o roteiro, gere vozes com IA e exporte o vídeo dublado.',
      langLabel: 'Idioma de destino',
      startBtn: '🎙️ Detectar Falantes & Iniciar',
      processing: 'Processando...',
      statusLabels: {
        idle: 'Pronto',
        diarizing: 'Detectando falantes...',
        translating: 'Traduzindo...',
        generating_tts: 'Gerando vozes...',
        mixing: 'Mixando áudio...',
        done: 'Concluído!',
        error: 'Erro',
      },
      speakersHeading: 'Falantes Detectados',
      speakersDesc: (n: number, s: number) =>
        `${n} falante${n !== 1 ? 's' : ''} identificado${n !== 1 ? 's' : ''}. Renomeie e atribua vozes antes de traduzir.`,
      speakerSegments: (n: number) => `${n} seg`,
      speakerVoiceLabel: 'Voz',
      translateBtn: 'Traduzir →',
      backBtn: '← Voltar',
      reviewHeading: 'Revisar Tradução',
      reviewDesc: 'Edite qualquer segmento antes de gerar as vozes.',
      generateBtn: '🎤 Gerar',
      mixHeading: 'Áudio Pronto',
      mixDesc: (n: number) => `${n} clip${n !== 1 ? 's' : ''} de voz gerado${n !== 1 ? 's' : ''}. Mixe no vídeo final.`,
      mixMoreClips: (n: number) => `+${n} clips a mais`,
      mixBtn: '🎬 Mixar & Exportar',
      doneTitle: 'Dublado!',
      doneSpeakers: (n: number) => `${n} falante${n !== 1 ? 's' : ''}`,
      downloadBtn: '⬇️ Baixar Vídeo Dublado',
      newDubBtn: 'Iniciar Nova Dublagem',
      clipAt: 'em',
      errorGeneric: 'Erro',
    },
  },

  en: {
    // ── Home ──────────────────────────────────────────────────────────────
    home: {
      badge: 'AI-Powered Video Editor',
      title: 'Transform Videos with',
      titleHighlight: 'AI',
      description:
        'Upload raw footage. Get a production-ready vertical video with AI-generated scenes, animated subtitles, and smart editing.',
      briefLabel: 'Creative Brief (optional)',
      briefPlaceholder:
        "Describe the style, mood, or key message you want... (e.g. 'Make it energetic and motivational')",
      errorGeneric: 'Something went wrong',
      errorUpload: 'Upload failed',
      errorTranscribe: 'Transcription failed',
      errorAnalyze: 'Analysis failed',
      features: [
        { icon: '🎙️', label: 'Whisper AI', desc: 'Auto-transcription' },
        { icon: '🧠', label: 'Claude AI', desc: 'Scene intelligence' },
        { icon: '🎬', label: 'Remotion', desc: 'Pro rendering' },
      ],
    },

    // ── Processing ────────────────────────────────────────────────────────
    processing: {
      title: 'Processing your video',
      stepOf: (a: number, b: number) => `Step ${a} of ${b}`,
      stages: [
        { label: 'Uploading', desc: 'Sending video to server', icon: '📤' },
        { label: 'Normalizing', desc: 'Converting to H.264 @ 30fps', icon: '⚙️' },
        { label: 'Transcribing', desc: 'Whisper AI processing audio', icon: '🎙️' },
        { label: 'Analyzing', desc: 'Claude creating scene structure', icon: '🧠' },
        { label: 'Ready', desc: 'Opening editor...', icon: '✅' },
      ],
    },

    // ── Upload Zone ───────────────────────────────────────────────────────
    upload: {
      idle: 'Drop your video',
      dragging: 'Drop it here',
      formats: 'MP4, MOV, AVI, HEVC — up to 2GB',
      browse: 'Browse files',
    },

    // ── Editor Layout ─────────────────────────────────────────────────────
    editor: {
      loadingProject: 'Loading project...',
      downloadMp4: 'Download MP4',
      exportVideo: 'Export Video',
      rendering: 'Rendering...',
      errorLoad: 'Failed to load project',
      errorRender: 'Render failed',
      tabScene: '🎬 Scene',
      tabDubbing: '🌐 Dubbing',
      statusReady: 'ready',
      statusDone: 'done',
      statusError: 'error',
    },

    // ── Scene List ────────────────────────────────────────────────────────
    sceneList: {
      heading: (n: number) => `Scenes (${n})`,
    },

    // ── Scene Editor ──────────────────────────────────────────────────────
    sceneEditor: {
      heading: 'Scene Editor',
      saving: 'Saving',
      empty: 'Select a scene to edit',
      typeLabel: 'Type',
      titleLabel: 'Title',
      titlePlaceholder: 'Scene title...',
      bodyLabel: 'Body Text',
      bodyPlaceholder: 'Supporting text (optional)...',
      sentimentLabel: 'Sentiment',
      visualStyleLabel: 'Visual Style',
      paletteLabel: 'Color Palette',
      startPos: (n: number) => `Start position: subtitle #${n}`,
      sceneTypes: {
        title: 'Title',
        content: 'Content',
        highlight: 'Highlight',
        outro: 'Outro',
      },
      sentiments: {
        positive: 'Positive',
        negative: 'Negative',
        neutral: 'Neutral',
        exciting: 'Exciting',
      },
      visualStyles: {
        minimal: 'Minimal',
        bold: 'Bold',
        cinematic: 'Cinematic',
      },
    },

    // ── Video Preview ─────────────────────────────────────────────────────
    videoPreview: {
      loading: 'Loading preview...',
      total: 's total',
    },

    // ── Timeline ──────────────────────────────────────────────────────────
    timeline: {
      heading: 'Timeline',
    },

    // ── Dubbing Panel ─────────────────────────────────────────────────────
    dubbing: {
      heading: 'Voice Dubbing',
      description:
        'Automatically detect speakers, translate the script, generate AI voices, and export a dubbed video.',
      langLabel: 'Target language',
      startBtn: '🎙️ Detect Speakers & Start',
      processing: 'Processing...',
      statusLabels: {
        idle: 'Ready',
        diarizing: 'Detecting speakers...',
        translating: 'Translating...',
        generating_tts: 'Generating voices...',
        mixing: 'Mixing audio...',
        done: 'Done!',
        error: 'Error',
      },
      speakersHeading: 'Detected Speakers',
      speakersDesc: (n: number, _s: number) =>
        `${n} speaker${n !== 1 ? 's' : ''} identified. Rename and assign voices before translating.`,
      speakerSegments: (n: number) => `${n} seg`,
      speakerVoiceLabel: 'Voice',
      translateBtn: 'Translate →',
      backBtn: '← Back',
      reviewHeading: 'Review Translation',
      reviewDesc: 'Edit any segment before generating voices.',
      generateBtn: '🎤 Generate',
      mixHeading: 'Audio Ready',
      mixDesc: (n: number) => `${n} voice clip${n !== 1 ? 's' : ''} generated. Mix into the final video.`,
      mixMoreClips: (n: number) => `+${n} more clips`,
      mixBtn: '🎬 Mix & Export',
      doneTitle: 'Dubbed!',
      doneSpeakers: (n: number) => `${n} speaker${n !== 1 ? 's' : ''}`,
      downloadBtn: '⬇️ Download Dubbed Video',
      newDubBtn: 'Start New Dub',
      clipAt: '@',
      errorGeneric: 'Error',
    },
  },
} as const;

export default t;
export type Translations = typeof t;
