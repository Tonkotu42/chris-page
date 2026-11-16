import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Disc3,
  ArrowLeft,
  FastForward,
  FlipHorizontal,
  LockKeyhole,
  Pause,
  Play,
  Rewind,
  SkipBack,
  SkipForward,
  Square,
  UnlockKeyhole,
  X,
} from 'lucide-react';
import { SiteMenu } from '../components/SiteMenu';
import {
  loadCassettes,
  loadPlaybackProgress,
  saveCassette,
  savePlaybackProgress,
} from '../lib/musicStorage';
import { SupabaseWorkletAudioPlayer } from '../lib/encryptedAudioPlayer';
import { createWaveformPeaks, WebAudioPlayer } from '../lib/privateAudioPlayer';
import { createFrequencyWaveform, waveformBarsPerSecond } from '../lib/frequencyWaveform';
import type { FrequencyWaveformBar } from '../lib/frequencyWaveform';
import type { Cassette, CassetteSide } from '../lib/musicStorage';
import { nextQueueEntry } from '../lib/musicQueue';
import type { QueueEntry } from '../lib/musicQueue';
import { initialCassettes } from '../lib/musicCatalog';
import './MusicPage.css';

interface SoundCloudWidgetEvent {
  currentPosition?: number;
}

interface SoundCloudWidget {
  bind: (eventName: string, listener: (event?: SoundCloudWidgetEvent) => void) => void;
  unbind: (eventName: string) => void;
  play: () => void;
  pause: () => void;
  seekTo: (milliseconds: number) => void;
  setVolume: (volume: number) => void;
  getDuration: (callback: (duration: number) => void) => void;
  getPosition: (callback: (position: number) => void) => void;
  isPaused: (callback: (paused: boolean) => void) => void;
}

interface SoundCloudWidgetConstructor {
  (iframeElement: HTMLIFrameElement): SoundCloudWidget;
  Events: {
    READY: string;
    PLAY_PROGRESS: string;
    PLAY: string;
    PAUSE: string;
    FINISH: string;
    ERROR: string;
  };
}

interface SoundCloudApi {
  Widget: SoundCloudWidgetConstructor;
}

declare global {
  interface Window {
    SC?: SoundCloudApi;
  }
}

let soundCloudApiPromise: Promise<void> | null = null;

const loadSoundCloudWidgetApi = () => {
  if (window.SC) return Promise.resolve();
  if (soundCloudApiPromise) return soundCloudApiPromise;

  soundCloudApiPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.async = true;
    script.onload = () => {
      if (window.SC) {
        resolve();
      } else {
        soundCloudApiPromise = null;
        reject(new Error('SoundCloud Widget API did not initialize.'));
      }
    };
    script.onerror = () => {
      soundCloudApiPromise = null;
      reject(new Error('SoundCloud Widget API could not be loaded.'));
    };
    document.head.appendChild(script);
  });

  return soundCloudApiPromise;
};

type SideName = 'A' | 'B';

const tapeColors = [
  'from-[#9aa8a6] via-[#354342] to-[#090a10]',
  'from-[#c7a77b] via-[#57412b] to-[#090a10]',
  'from-[#ad9bc1] via-[#4b3b58] to-[#090a10]',
];

const sideKey = (cassetteId: string, side: SideName) => `${cassetteId}:${side}`;

interface ShelfPointerDrag {
  cassetteId: string;
  pointerId: number;
  startX: number;
  startY: number;
  hasMoved: boolean;
}

interface TurntableDrag {
  pointerId: number;
  lastAngle: number;
  lastTrackTime: number;
  lastMoveTime: number;
  wasPlaying: boolean;
}

interface QueuePointerDrag {
  entryId: string;
  pointerId: number;
  startX: number;
  startY: number;
  hasMoved: boolean;
}

interface CassetteInspectDrag {
  pointerId: number;
  startX: number;
  startY: number;
  rotationX: number;
  rotationY: number;
}

export default function MusicPage() {
  const [cassettes, setCassettes] = useState(initialCassettes);
  const [activeCassetteId, setActiveCassetteId] = useState<string | null>(null);
  const [selectedCassetteId, setSelectedCassetteId] = useState<string | null>(null);
  const [pendingCassetteId, setPendingCassetteId] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<QueueEntry[]>([]);
  const [activeQueueId, setActiveQueueId] = useState<string | null>(null);
  const [autoStartEntry, setAutoStartEntry] = useState<QueueEntry | null>(null);
  const [knownDurations, setKnownDurations] = useState<Record<string, number>>({});
  const [activeSide, setActiveSide] = useState<SideName>('A');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTapeId, setDraggedTapeId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [queueDropTargetId, setQueueDropTargetId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<{ title: string; x: number; y: number } | null>(null);
  const [snappedTapeId, setSnappedTapeId] = useState<string | null>(null);
  const [isInserting, setIsInserting] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [inspectRotation, setInspectRotation] = useState({ x: -12, y: -20 });
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [editingSide, setEditingSide] = useState<SideName | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [audioLoadAttempt, setAudioLoadAttempt] = useState(0);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const [frequencyWaveform, setFrequencyWaveform] = useState<FrequencyWaveformBar[]>([]);
  const [frequencyWaveformError, setFrequencyWaveformError] = useState<string | null>(null);
  const [waveformError, setWaveformError] = useState<string | null>(null);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [isJogging, setIsJogging] = useState(false);
  const [volume, setVolume] = useState(1);
  const [soundCloudReady, setSoundCloudReady] = useState(false);
  const pointerStartY = useRef<number | null>(null);
  const inspectDragRef = useRef<CassetteInspectDrag | null>(null);
  const inspectStageRef = useRef<HTMLDivElement>(null);
  const suppressInspectInsertClickRef = useRef(false);
  const onTrackEndedRef = useRef<() => void>(() => setIsPlaying(false));
  const readyAudioSideRef = useRef<string | null>(null);
  const [trackAudioPlayer] = useState(() => {
    const player = new SupabaseWorkletAudioPlayer();
    player.onEnded = () => onTrackEndedRef.current();
    return player;
  });
  const [insertionSoundPlayer] = useState(() => new WebAudioPlayer());
  const [buttonClickPlayer] = useState(() => new WebAudioPlayer());
  const reelFaceRef = useRef<HTMLDivElement>(null);
  const turntableDragRef = useRef<TurntableDrag | null>(null);
  const platterAngleRef = useRef(0);
  const waveformDragRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLIFrameElement>(null);
  const soundCloudIframeRef = useRef<HTMLIFrameElement>(null);
  const soundCloudWidgetRef = useRef<SoundCloudWidget | null>(null);
  const rewindTimer = useRef<number | null>(null);
  const progressSaveTimer = useRef<number | null>(null);
  const progressWriteRef = useRef<Promise<void>>(Promise.resolve());
  const progressGenerationRef = useRef(0);
  const ejectedSideRef = useRef<string | null>(null);
  const playerRef = useRef<HTMLElement>(null);
  const displayRef = useRef<HTMLElement>(null);
  const shelfPointerDragRef = useRef<ShelfPointerDrag | null>(null);
  const queuePointerDragRef = useRef<QueuePointerDrag | null>(null);
  const suppressNextCassetteClickRef = useRef(false);
  const insertionTimerRef = useRef<number | null>(null);

  const activeCassette = cassettes.find((cassette) => cassette.id === activeCassetteId) ?? null;
  const selectedCassette = cassettes.find((cassette) => cassette.id === selectedCassetteId) ?? null;
  const pendingCassette = cassettes.find((cassette) => cassette.id === pendingCassetteId) ?? null;
  const currentSide: CassetteSide = activeCassette
    ? (activeSide === 'A' ? activeCassette.sideA : activeCassette.sideB)
    : null;
  const currentSideTitle = activeCassette
    ? (activeSide === 'A' ? activeCassette.sideATitle : activeCassette.sideBTitle)
    : '';
  const audioSource = currentSide?.kind === 'audio'
    ? ('src' in currentSide ? currentSide.src : currentSide.blob)
    : null;
  const activeSideId = activeCassette ? sideKey(activeCassette.id, activeSide) : null;
  
  useEffect(() => {
    setPlaybackTime(0);
    setPlaybackDuration(0);
    if (activeSideId && ejectedSideRef.current === activeSideId) ejectedSideRef.current = null;
  }, [activeSideId]);

  const sendVideoCommand = (func: string, args: unknown[] = []) => {
    videoRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      '*',
    );
  };

  useEffect(() => {
    document.title = 'MUSIC | CHRIS';
    let cancelled = false;
    const restoreCassettes = async () => {
      try {
        const savedCassettes = await loadCassettes();
        if (cancelled) return;
        const savedById = new Map(savedCassettes.map((cassette) => [cassette.id, cassette]));
        const merged = [
          ...initialCassettes.map((cassette) => {
            const savedCassette = savedById.get(cassette.id);
            return savedCassette
              ? { ...savedCassette, sideA: cassette.sideA }
              : cassette;
          }),
          ...savedCassettes.filter((cassette) => !initialCassettes.some((initial) => initial.id === cassette.id)),
        ];
        let order: string[] = [];
        try {
          const storedOrder = localStorage.getItem('chris-music-cassette-order');
          if (storedOrder) order = JSON.parse(storedOrder) as string[];
        } catch {
          setStorageError('Cassette order could not be restored.');
        }
        merged.sort((first, second) => {
          const firstIndex = order.indexOf(first.id);
          const secondIndex = order.indexOf(second.id);
          if (firstIndex < 0 && secondIndex < 0) return 0;
          if (firstIndex < 0) return 1;
          if (secondIndex < 0) return -1;
          return firstIndex - secondIndex;
        });
        setCassettes(merged);
      } catch {
        if (!cancelled) setStorageError('Cassette storage could not be opened in this browser.');
      }
    };
    void restoreCassettes();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCassette) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isInserting) setSelectedCassetteId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInserting, selectedCassette]);

  useEffect(() => {
    setInspectRotation({ x: -12, y: -20 });
    inspectDragRef.current = null;
    if (selectedCassetteId) inspectStageRef.current?.focus({ preventScroll: true });
  }, [selectedCassetteId]);

  useEffect(() => {
    let cancelled = false;
    const waveformController = new AbortController();
    setWaveformPeaks([]);
    setFrequencyWaveform([]);
    setFrequencyWaveformError(null);
    setWaveformError(null);
    readyAudioSideRef.current = null;
    setIsAudioReady(false);
    setPlaybackTime(0);
    setPlaybackDuration(0);

    if (currentSide?.kind !== 'audio' || !audioSource) {
      trackAudioPlayer.stop();
      setIsAudioLoading(false);
      return;
    }

    setIsAudioLoading(true);
    const loadTrack = async () => {
      try {
        const buffer = await trackAudioPlayer.load(audioSource);
        if (cancelled) return;
        setPlaybackDuration(buffer.duration);
        readyAudioSideRef.current = activeSideId;
        if (activeSideId) setKnownDurations((durations) => ({ ...durations, [activeSideId]: buffer.duration }));
        setWaveformPeaks(createWaveformPeaks(buffer));
        setIsAudioReady(true);
        void createFrequencyWaveform(buffer, waveformController.signal).then((bars) => {
          if (!cancelled) setFrequencyWaveform(bars);
        }).catch((error: unknown) => {
          if (!cancelled) {
            setFrequencyWaveformError(error instanceof Error ? error.message : 'Frequency waveform could not be analyzed.');
          }
        });
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Track audio could not be loaded.';
        setWaveformError(message);
        setStorageError(message);
      } finally {
        if (!cancelled) setIsAudioLoading(false);
      }
    };

    void loadTrack();
    return () => {
      cancelled = true;
      waveformController.abort();
      trackAudioPlayer.stop();
    };
  }, [activeSideId, audioLoadAttempt, audioSource, currentSide?.kind, trackAudioPlayer]);

  useEffect(() => {
    let cancelled = false;
    const loadEffect = (
      player: WebAudioPlayer,
      source: string,
      errorMessage: string,
    ) => {
      void player.load(source).catch(() => {
        if (!cancelled) setStorageError(errorMessage);
      });
    };
    loadEffect(insertionSoundPlayer, '/audio/cassette-insert.ogg', 'Cassette sound could not be loaded.');
    loadEffect(buttonClickPlayer, '/audio/clicking.ogg', 'Button sound could not be loaded.');
    return () => {
      cancelled = true;
      insertionSoundPlayer.stop();
      buttonClickPlayer.stop();
    };
  }, [buttonClickPlayer, insertionSoundPlayer]);

  useEffect(() => {
    if (currentSide?.kind !== 'soundcloud') {
      soundCloudWidgetRef.current = null;
      setSoundCloudReady(false);
      return;
    }

    const iframe = soundCloudIframeRef.current;
    if (!iframe) return;
    let cancelled = false;
    let widget: SoundCloudWidget | null = null;

    const initializeWidget = async () => {
      try {
        await loadSoundCloudWidgetApi();
        if (cancelled || !window.SC) return;

        const api = window.SC;
        const activeWidget = api.Widget(iframe);
        const events = api.Widget.Events;
        widget = activeWidget;
        soundCloudWidgetRef.current = activeWidget;
        activeWidget.bind(events.READY, () => {
          if (cancelled) return;
          setSoundCloudReady(true);
          activeWidget.getDuration((duration) => {
            if (!cancelled) setPlaybackDuration(duration / 1000);
          });
          activeWidget.getPosition((position) => {
            if (!cancelled) setPlaybackTime(position / 1000);
          });
        });
        activeWidget.bind(events.PLAY_PROGRESS, (event) => {
          if (cancelled || typeof event?.currentPosition !== 'number') return;
          setPlaybackTime(event.currentPosition / 1000);
          saveProgress();
        });
        const syncPlaybackState = () => {
          activeWidget.isPaused((paused) => {
            if (cancelled) return;
            setIsPlaying(!paused);
            if (paused) saveProgress(true);
          });
        };
        activeWidget.bind(events.PLAY, syncPlaybackState);
        activeWidget.bind(events.PAUSE, syncPlaybackState);
        activeWidget.bind(events.FINISH, () => {
          if (!cancelled) {
            saveProgress(true);
            onTrackEndedRef.current();
          }
        });
        activeWidget.bind(events.ERROR, () => {
          if (!cancelled) {
            setIsPlaying(false);
            setStorageError('The SoundCloud track could not be played.');
          }
        });
      } catch {
        if (!cancelled) setStorageError('The SoundCloud player could not be initialized.');
      }
    };

    void initializeWidget();
    return () => {
      cancelled = true;
      if (widget && window.SC) {
        Object.values(window.SC.Widget.Events).forEach((event) => widget?.unbind(event));
        widget.pause();
      }
      if (soundCloudWidgetRef.current === widget) soundCloudWidgetRef.current = null;
      setSoundCloudReady(false);
    };
  }, [activeSideId, currentSide?.kind]);

  useEffect(() => {
    const widget = soundCloudWidgetRef.current;
    if (!activeSideId || (autoStartEntry?.cassetteId === activeCassetteId && activeSide === 'A')) return;
    if (currentSide?.kind === 'audio' && !isAudioReady) return;
    if (currentSide?.kind === 'soundcloud' && (!soundCloudReady || !widget)) return;
    if (currentSide?.kind !== 'audio' && currentSide?.kind !== 'soundcloud') return;
    let cancelled = false;
    const restorePosition = async () => {
      try {
        await progressWriteRef.current;
        const seconds = await loadPlaybackProgress(activeSideId);
        if (cancelled || seconds <= 0) return;
        if (currentSide.kind === 'audio') {
          const position = Math.min(seconds, trackAudioPlayer.duration);
          await trackAudioPlayer.seek(position);
          setPlaybackTime(position);
        } else if (currentSide?.kind === 'soundcloud') {
          widget?.seekTo(seconds * 1000);
        }
      } catch {
        if (!cancelled) setStorageError('Playback position could not be restored.');
      }
    };
    void restorePosition();
    return () => {
      cancelled = true;
    };
  }, [activeSideId, currentSide?.kind, isAudioReady, soundCloudReady, trackAudioPlayer]);

  useEffect(() => {
    if (currentSide?.kind === 'soundcloud' && soundCloudReady) {
      const widget = soundCloudWidgetRef.current;
      if (isPlaying) widget?.play();
      else if (!isJogging) widget?.pause();
      return;
    }
    if (currentSide?.kind !== 'audio') return;
    if (isPlaying) {
      if (!isAudioReady) return;
      void trackAudioPlayer.play().catch(() => {
        setIsPlaying(false);
        setStorageError('This audio could not be played by the browser.');
      });
    } else if (!isJogging) {
      trackAudioPlayer.pause();
    }
  }, [currentSide, isAudioReady, isJogging, isPlaying, soundCloudReady, trackAudioPlayer]);

  useEffect(() => {
    if (currentSide?.kind !== 'video') return;
    sendVideoCommand('setPlaybackRate', [isFastForwarding ? 2 : 1]);
  }, [currentSide, isFastForwarding]);

  useEffect(() => {
    if (currentSide?.kind !== 'video') return;
    sendVideoCommand(isPlaying ? 'playVideo' : 'pauseVideo');
  }, [currentSide, isPlaying]);

  useEffect(() => {
    if (currentSide?.kind !== 'video') return;
    const handleVideoMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube-nocookie.com' || event.source !== videoRef.current?.contentWindow) return;
      let data: unknown = event.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if (typeof data !== 'object' || data === null || !('event' in data) || !('info' in data)) return;
      if (data.event === 'onStateChange' && data.info === 0) onTrackEndedRef.current();
    };
    window.addEventListener('message', handleVideoMessage);
    return () => window.removeEventListener('message', handleVideoMessage);
  }, [activeSideId, currentSide?.kind]);

  useEffect(() => {
    trackAudioPlayer.setVolume(volume);
    insertionSoundPlayer.setVolume(volume * 0.6);
    buttonClickPlayer.setVolume(volume * 0.55);
    if (currentSide?.kind === 'video') sendVideoCommand('setVolume', [Math.round(volume * 100)]);
    if (currentSide?.kind === 'soundcloud' && soundCloudReady) {
      soundCloudWidgetRef.current?.setVolume(Math.round(volume * 100));
    }
  }, [buttonClickPlayer, currentSide, insertionSoundPlayer, soundCloudReady, trackAudioPlayer, volume]);

  useEffect(() => {
    trackAudioPlayer.setPlaybackRate(isFastForwarding && !isJogging ? 4 : 1);
  }, [isFastForwarding, isJogging, trackAudioPlayer]);

  useEffect(() => {
    if (!isPlaying || isJogging) return;
    let lastTime = performance.now();
    let animationFrame = 0;
    const rotate = (time: number) => {
      platterAngleRef.current = (platterAngleRef.current + (time - lastTime) / 100) % 360;
      lastTime = time;
      if (reelFaceRef.current) {
        reelFaceRef.current.style.transform = `rotate(${platterAngleRef.current}deg)`;
      }
      animationFrame = requestAnimationFrame(rotate);
    };
    animationFrame = requestAnimationFrame(rotate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isJogging, isPlaying]);

  useEffect(() => () => {
    turntableDragRef.current = null;
    trackAudioPlayer.endScratch();
    setIsJogging(false);
  }, [activeSideId, trackAudioPlayer]);

  useEffect(() => () => {
    if (rewindTimer.current !== null) window.clearInterval(rewindTimer.current);
    if (progressSaveTimer.current !== null) window.clearTimeout(progressSaveTimer.current);
    if (insertionTimerRef.current !== null) window.clearTimeout(insertionTimerRef.current);
    trackAudioPlayer.stop();
    insertionSoundPlayer.stop();
    soundCloudWidgetRef.current?.pause();
    buttonClickPlayer.stop();
  }, [buttonClickPlayer, insertionSoundPlayer, trackAudioPlayer]);

  const persistCassette = (cassette: Cassette) => {
    setCassettes((current) => current.map((item) => item.id === cassette.id ? cassette : item));
    void saveCassette(cassette).catch(() => {
      setStorageError('Cassette changes could not be saved. Check browser storage availability.');
    });
  };

  const playCassetteInsertSound = () => {
    if (!insertionSoundPlayer.isReady) return;
    void insertionSoundPlayer.play({ restart: true }).catch(() => {
      setStorageError('Cassette insertion sound could not be played.');
    });
  };

  const playButtonTouchSound = () => {
    if (!buttonClickPlayer.isReady) return;
    void buttonClickPlayer.play({ restart: true }).catch(() => {
      setStorageError('Button click sound could not be played.');
    });
  };

  const handleHardwareButtonPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.isPrimary && event.button === 0) playButtonTouchSound();
  };

  const handleHardwareButtonKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!event.repeat && (event.key === ' ' || event.key === 'Enter')) playButtonTouchSound();
  };

  const enqueueCassette = (cassette: Cassette) => {
    if (!cassette.sideA) {
      setStorageError('This cassette has no track on side A.');
      return;
    }
    const entry = { id: crypto.randomUUID(), cassetteId: cassette.id };
    playCassetteInsertSound();
    setPlaylist((current) => [...current, entry]);
    setPendingCassetteId(null);
    setSnappedTapeId(cassette.id);
    if (playlist.length === 0 && !isPlaying) {
      if (currentSide?.kind === 'audio') saveProgress(true);
      setActiveQueueId(entry.id);
      setActiveCassetteId(cassette.id);
      setActiveSide('A');
      setIsPlaying(false);
    }
  };

  const startQueueEntry = (entry: QueueEntry) => {
    const cassette = cassettes.find((item) => item.id === entry.cassetteId);
    if (!cassette?.sideA) {
      setIsPlaying(false);
      setAutoStartEntry(null);
      setStorageError('This queued cassette no longer has a track on side A.');
      return;
    }
    if (currentSide?.kind === 'audio' && isPlaying) saveProgress(true);
    setIsPlaying(false);
    setIsFastForwarding(false);
    setActiveQueueId(entry.id);
    setActiveCassetteId(entry.cassetteId);
    setActiveSide('A');
    setAutoStartEntry(entry);
  };

  onTrackEndedRef.current = () => {
    setIsPlaying(false);
    const next = nextQueueEntry(playlist, activeQueueId);
    if (next) startQueueEntry(next);
  };

  useEffect(() => {
    if (!autoStartEntry || autoStartEntry.cassetteId !== activeCassetteId || activeSide !== 'A' || !currentSide) return;
    if (currentSide.kind === 'audio' && (!isAudioReady || readyAudioSideRef.current !== activeSideId)) return;
    if (currentSide.kind === 'soundcloud' && (!soundCloudReady || !soundCloudWidgetRef.current)) return;
    let cancelled = false;
    const start = async () => {
      try {
        if (currentSide.kind === 'audio') {
          await trackAudioPlayer.seek(0);
          if (cancelled) return;
          await trackAudioPlayer.play();
        } else if (currentSide.kind === 'soundcloud') {
          soundCloudWidgetRef.current?.seekTo(0);
          soundCloudWidgetRef.current?.play();
        } else {
          sendVideoCommand('seekTo', [0, true]);
          sendVideoCommand('playVideo');
        }
        if (!cancelled) {
          setPlaybackTime(0);
          setIsPlaying(true);
          setAutoStartEntry(null);
        }
      } catch {
        if (!cancelled) {
          setAutoStartEntry(null);
          setIsPlaying(false);
          setStorageError('The next queued track could not be played. Open the player to retry.');
        }
      }
    };
    void start();
    return () => { cancelled = true; };
  }, [autoStartEntry, activeCassetteId, activeSide, activeSideId, currentSide, isAudioReady, soundCloudReady, trackAudioPlayer]);

  const startInsertion = (cassette: Cassette) => {
    if (!cassette.sideA) {
      setStorageError('This cassette has no track on side A.');
      return;
    }
    enqueueCassette(cassette);
    setIsPlayerExpanded(true);
    setIsInserting(true);
    if (insertionTimerRef.current !== null) window.clearTimeout(insertionTimerRef.current);
    insertionTimerRef.current = window.setTimeout(() => {
      setSelectedCassetteId(null);
      setIsInserting(false);
      setDragOffset(0);
      insertionTimerRef.current = null;
    }, 700);
  };

  const reorderCassettes = (sourceId: string, targetId: string) => {
    if (sourceId === targetId || !cassettes.some((cassette) => cassette.id === sourceId)) return;
    const reordered = [...cassettes];
    const sourceIndex = reordered.findIndex((cassette) => cassette.id === sourceId);
    const targetIndex = reordered.findIndex((cassette) => cassette.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    [reordered[sourceIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[sourceIndex]];
    setCassettes(reordered);
    try {
      localStorage.setItem('chris-music-cassette-order', JSON.stringify(reordered.map((cassette) => cassette.id)));
    } catch {
      setStorageError('Cassette order could not be saved.');
    }
    setSnappedTapeId(targetId);
  };

  const insertCassetteFromDrop = (cassette: Cassette, openPlayer = true) => {
    enqueueCassette(cassette);
    setSelectedCassetteId(null);
    setIsInserting(false);
    setIsPlayerExpanded(openPlayer);
  };

  const insertPendingCassette = () => {
    if (!pendingCassette) {
      setStorageError('Select a cassette from the shelf first.');
      return;
    }
    enqueueCassette(pendingCassette);
  };

  const removeQueueEntry = (entry: QueueEntry) => {
    if (entry.id === activeQueueId) {
      if (currentSide?.kind === 'audio') {
        trackAudioPlayer.pause();
        saveProgress(true);
      }
      setActiveQueueId(null);
      setAutoStartEntry(null);
      setIsPlaying(false);
      setIsFastForwarding(false);
      setActiveCassetteId(null);
    }
    setPlaylist((current) => current.filter((item) => item.id !== entry.id));
  };

  const replaceQueueEntry = (entry: QueueEntry, cassette: Cassette) => {
    if (!cassette.sideA) {
      setStorageError('This cassette has no track on side A.');
      return;
    }
    const replacement = { id: crypto.randomUUID(), cassetteId: cassette.id };
    if (entry.id === activeQueueId) {
      if (currentSide?.kind === 'audio') {
        trackAudioPlayer.pause();
        saveProgress(true);
      }
      setIsPlaying(false);
      setIsFastForwarding(false);
      setAutoStartEntry(null);
      setActiveQueueId(replacement.id);
      setActiveCassetteId(cassette.id);
      setActiveSide('A');
    }
    setPlaylist((current) => current.map((item) => item.id === entry.id ? replacement : item));
    setPendingCassetteId(null);
    setSnappedTapeId(cassette.id);
    playCassetteInsertSound();
  };

  const resetPointerDrag = () => {
    setIsDragging(false);
    setDraggedTapeId(null);
    setDropTargetId(null);
    setQueueDropTargetId(null);
    setDragPreview(null);
  };

  const handleQueuePointerDown = (event: PointerEvent<HTMLButtonElement>, entry: QueueEntry) => {
    if (!event.isPrimary || event.button !== 0) return;
    queuePointerDragRef.current = {
      entryId: entry.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      hasMoved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleQueuePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = queuePointerDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.hasMoved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 8) return;
    drag.hasMoved = true;
    const entry = playlist.find((item) => item.id === drag.entryId);
    const cassette = cassettes.find((item) => item.id === entry?.cassetteId);
    setIsDragging(true);
    setDragPreview({ title: cassette?.sideATitle ?? 'CASSETTE', x: event.clientX, y: event.clientY });
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-queue-slot]');
    setQueueDropTargetId(target?.dataset.queueSlot ?? null);
  };

  const handleQueuePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = queuePointerDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    queuePointerDragRef.current = null;

    // Release capture before hit-testing to ensure correct targeting across browsers
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!drag.hasMoved) return;
    event.preventDefault();
    
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const targetId = target?.closest<HTMLElement>('[data-queue-slot]')?.dataset.queueSlot;
    const entry = playlist.find((item) => item.id === drag.entryId);
    
    if (entry && target?.closest('[data-queue-eject]')) {
      removeQueueEntry(entry);
    } else if (targetId && targetId !== drag.entryId) {
      setPlaylist((current) => {
        const sourceIndex = current.findIndex(e => e.id === drag.entryId);
        const targetIndex = current.findIndex(e => e.id === targetId);
        if (sourceIndex < 0 || targetIndex < 0) return current;
        
        const result = [...current];
        const [removed] = result.splice(sourceIndex, 1);
        result.splice(targetIndex, 0, removed);
        return result;
      });
    }
    resetPointerDrag();
  };

  const handleQueuePointerCancel = () => {
    queuePointerDragRef.current = null;
    resetPointerDrag();
  };

  const handleShelfCassettePointerDown = (
    event: PointerEvent<HTMLButtonElement>,
    cassette: Cassette,
  ) => {
    if (!event.isPrimary || event.button !== 0) return;
    shelfPointerDragRef.current = {
      cassetteId: cassette.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      hasMoved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleShelfCassettePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = shelfPointerDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.hasMoved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 8) return;
    drag.hasMoved = true;
    setDraggedTapeId(drag.cassetteId);
    setIsDragging(true);
    setIsPlayerExpanded(true);
    const cassette = cassettes.find((item) => item.id === drag.cassetteId);
    setDragPreview({ title: cassette?.sideATitle ?? 'CASSETTE', x: event.clientX, y: event.clientY });
    const queueTarget = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-queue-slot]');
    setQueueDropTargetId(queueTarget?.dataset.queueSlot ?? null);
    const hoveredCassette = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLButtonElement>('[data-cassette-id]');
    setDropTargetId(hoveredCassette?.dataset.cassetteId ?? null);
  };

  const handleShelfCassettePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = shelfPointerDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    shelfPointerDragRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!drag.hasMoved) return;

    event.preventDefault();
    suppressNextCassetteClickRef.current = true;
    window.setTimeout(() => {
      suppressNextCassetteClickRef.current = false;
    }, 0);

    const dropElement = document.elementFromPoint(event.clientX, event.clientY);
    const targetCassetteId = dropElement?.closest<HTMLButtonElement>('[data-cassette-id]')?.dataset.cassetteId;
    
    const targetCassette = cassettes.find((cassette) => cassette.id === targetCassetteId);
    const sourceCassette = cassettes.find((cassette) => cassette.id === drag.cassetteId);

    resetPointerDrag();

    if (targetCassette && sourceCassette) {
      reorderCassettes(sourceCassette.id, targetCassette.id);
      return;
    }

    const queueId = dropElement?.closest<HTMLElement>('[data-queue-slot]')?.dataset.queueSlot;
    const queueEntry = playlist.find((entry) => entry.id === queueId);
    const slot = dropElement?.closest('[data-cassette-slot]');
    
    if (sourceCassette && queueEntry) {
      replaceQueueEntry(queueEntry, sourceCassette);
    } else if (sourceCassette && slot) {
      insertCassetteFromDrop(sourceCassette);
    }
  };

  const handleShelfCassettePointerCancel = () => {
    shelfPointerDragRef.current = null;
    resetPointerDrag();
  };

  const handleInspectPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (isInserting || !event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    inspectDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      rotationX: inspectRotation.x,
      rotationY: inspectRotation.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleInspectPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = inspectDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || isInserting) return;
    setInspectRotation({
      x: Math.max(-65, Math.min(65, drag.rotationX - (event.clientY - drag.startY) * 0.5)),
      y: drag.rotationY + (event.clientX - drag.startX) * 0.7,
    });
  };

  const handleInspectPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (inspectDragRef.current?.pointerId === event.pointerId) inspectDragRef.current = null;
  };

  const handleInspectKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (isInserting) return;
    const { key } = event;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(key)) return;
    event.preventDefault();
    setInspectRotation((rotation) => {
      if (key === 'Home') return { x: -12, y: -20 };
      return {
        x: Math.max(-65, Math.min(65, rotation.x + (key === 'ArrowUp' ? -15 : key === 'ArrowDown' ? 15 : 0))),
        y: rotation.y + (key === 'ArrowLeft' ? -15 : key === 'ArrowRight' ? 15 : 0),
      };
    });
  };

  const handleCassettePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (isInserting || !event.isPrimary || event.button !== 0) return;
    pointerStartY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleCassettePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (pointerStartY.current === null || isInserting) return;
    setDragOffset(Math.max(0, event.clientY - pointerStartY.current));
  };

  const handleCassettePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (pointerStartY.current === null) return;
    const distance = event.clientY - pointerStartY.current;
    pointerStartY.current = null;
    if (distance > 110 && selectedCassette) {
      suppressInspectInsertClickRef.current = true;
      window.setTimeout(() => { suppressInspectInsertClickRef.current = false; }, 0);
      startInsertion(selectedCassette);
    } else {
      setDragOffset(0);
    }
  };

  const handleAnimationEnd = () => {
    if (!isInserting) return;
    if (insertionTimerRef.current !== null) {
      window.clearTimeout(insertionTimerRef.current);
      insertionTimerRef.current = null;
    }
    setSelectedCassetteId(null);
    setIsInserting(false);
    setDragOffset(0);
  };

  const togglePlay = () => {
    if (!activeCassette || !currentSide) return;
    const shouldPlay = !isPlaying;
    if (currentSide.kind === 'audio') {
      if (shouldPlay) {
        if (!isAudioReady) return;
        void trackAudioPlayer.play().catch(() => {
          setIsPlaying(false);
          setStorageError('This audio could not be played by the browser.');
        });
      } else {
        trackAudioPlayer.pause();
        saveProgress(true);
      }
    } else if (currentSide.kind === 'soundcloud') {
      if (shouldPlay) soundCloudWidgetRef.current?.play();
      else soundCloudWidgetRef.current?.pause();
    }
    setIsPlaying(shouldPlay);
  };

  // useEffect(() => {
  //   if (!isPlaying || !window.matchMedia('(max-width: 768px)').matches) return;
  //   setIsPlayerExpanded(false);
  //   displayRef.current?.scrollIntoView({
  //     block: 'center',
  //     behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  //   });
  // }, [isPlaying]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const session = navigator.mediaSession;
    if (!activeCassette || !currentSide) {
      session.metadata = null;
      session.playbackState = 'none';
      return;
    }

    if ('MediaMetadata' in window) {
      session.metadata = new MediaMetadata({
        title: currentSideTitle,
        artist: 'CHRIS',
        album: 'CHRIS / MUSIC',
        artwork: [{ src: new URL('/music-artwork.png', window.location.origin).href, sizes: '512x512', type: 'image/png' }],
      });
    }
    session.playbackState = isPlaying ? 'playing' : 'paused';
    const setHandler = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        session.setActionHandler(action, handler);
      } catch (error) {
        console.warn(`Media Session ${action} action is unavailable:`, error);
      }
    };
    setHandler('play', () => { if (!isPlaying) togglePlay(); });
    setHandler('pause', () => { if (isPlaying) togglePlay(); });

    return () => {
      setHandler('play', null);
      setHandler('pause', null);
      session.metadata = null;
      session.playbackState = 'none';
    };
  }, [activeCassette, currentSide, currentSideTitle, isAudioReady, isPlaying, soundCloudReady]);

const changeCassette = (direction: -1 | 1) => {
    // キューが空、または現在再生中のキューIDが存在しない場合は何もしない
    if (playlist.length === 0 || !activeQueueId) return;

    if (currentSide?.kind === 'audio') saveProgress(true);
    
    // 現在再生している曲の、キュー（playlist）内でのインデックスを取得
    const index = playlist.findIndex((entry) => entry.id === activeQueueId);
    if (index === -1) return;

    // 前/次のキューエントリーを取得（リストの端に到達したらループさせる）
    const nextEntry = playlist[(index + direction + playlist.length) % playlist.length];

    // 新しいキューの状態をセット
    setActiveQueueId(nextEntry.id);
    setActiveCassetteId(nextEntry.cassetteId);
    setActiveSide('A');
    setAutoStartEntry(null);
    setIsPlaying(false);
  };

  const stopOrEject = () => {
    if (!activeCassette) return;
    if (currentSide?.kind === 'audio') {
      trackAudioPlayer.pause();
    }
    if (isPlaying) {
      saveProgress(true);
      setIsPlaying(false);
      return;
    }
    setActiveQueueId(null);
    setAutoStartEntry(null);
    progressGenerationRef.current += 1;
    ejectedSideRef.current = activeSideId;
    if (progressSaveTimer.current !== null) {
      window.clearTimeout(progressSaveTimer.current);
      progressSaveTimer.current = null;
    }
    if (activeSideId && (currentSide?.kind === 'audio' || currentSide?.kind === 'soundcloud')) {
      queueProgressSave(activeSideId, 0);
    }
    trackAudioPlayer.stop();
    soundCloudWidgetRef.current?.pause();
    soundCloudWidgetRef.current?.seekTo(0);
    setPlaybackTime(0);
    setActiveCassetteId(null);
    setIsPlaying(false);
  };

  const flipSide = () => {
    if (!activeCassette) return;
    if (currentSide?.kind === 'audio') saveProgress(true);
    setActiveQueueId(null);
    setAutoStartEntry(null);
    setIsPlaying(false);
    setActiveSide((side) => side === 'A' ? 'B' : 'A');
    setIsFlipping(true);
  };

  const createBlankCassette = () => {
    const cassette: Cassette = {
      id: `tape-${crypto.randomUUID()}`,
      title: 'Untitled Tape',
      sideATitle: 'SIDE A',
      sideBTitle: 'SIDE B',
      sideA: null,
      sideB: null,
      color: tapeColors[cassettes.length % tapeColors.length],
      locked: false,
    };
    setCassettes((current) => [...current, cassette]);
    void saveCassette(cassette).catch(() => {
      setStorageError('The blank cassette could not be saved.');
    });
  };

  const beginRewind = () => {
    if (currentSide?.kind === 'audio' && isAudioReady) {
      trackAudioPlayer.pause();
      saveProgress(true);
      setIsPlaying(false);
      rewindTimer.current = window.setInterval(() => {
        void trackAudioPlayer.seek(Math.max(0, trackAudioPlayer.currentTime - 2)).catch(() => {
          setStorageError('The track could not be rewound.');
        });
      }, 160);
    } else if (currentSide?.kind === 'video') {
      sendVideoCommand('seekTo', [0, true]);
    } else if (currentSide?.kind === 'soundcloud') {
      soundCloudWidgetRef.current?.seekTo(0);
    }
  };

  const endRewind = () => {
    if (rewindTimer.current !== null) {
      window.clearInterval(rewindTimer.current);
      rewindTimer.current = null;
    }
    if (currentSide?.kind === 'audio') saveProgress(true);
  };

  const queueProgressSave = (key: string, seconds: number) => {
    progressWriteRef.current = progressWriteRef.current.then(() => savePlaybackProgress(key, seconds)).catch(() => {
      setStorageError('Playback position could not be saved.');
    });
  };

  const saveProgress = (immediate = false) => {
    const audio = currentSide?.kind === 'audio' ? trackAudioPlayer : null;
    const widget = currentSide?.kind === 'soundcloud' ? soundCloudWidgetRef.current : null;
    if (!activeSideId || ejectedSideRef.current === activeSideId || (!audio && !widget)) return;
    if (progressSaveTimer.current !== null) window.clearTimeout(progressSaveTimer.current);
    const key = activeSideId;
    const generation = progressGenerationRef.current;
    const audioPosition = audio?.currentTime;
    const save = () => {
      if (generation !== progressGenerationRef.current) return;
      if (audio) {
        queueProgressSave(key, audioPosition ?? 0);
      } else {
        widget?.getPosition((position) => {
          if (generation === progressGenerationRef.current) queueProgressSave(key, position / 1000);
        });
      }
    };
    if (immediate) {
      save();
    } else {
      progressSaveTimer.current = window.setTimeout(save, 1000);
    }
  };

  useEffect(() => {
    if (currentSide?.kind !== 'audio' || !isPlaying) return;
    const timer = window.setInterval(() => {
      setPlaybackTime(trackAudioPlayer.currentTime);
      saveProgress();
    }, 100);
    return () => window.clearInterval(timer);
  }, [currentSide?.kind, isPlaying, trackAudioPlayer]);

  const seekWaveform = (event: PointerEvent<HTMLDivElement>) => {
    if (!canSeekWaveform || !trackAudioPlayer.isReady || trackAudioPlayer.duration <= 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const position = progress * trackAudioPlayer.duration;
    void trackAudioPlayer.seek(position).catch(() => {
      setStorageError('The track could not be seeked.');
    });
    setPlaybackTime(position);
  };

  const startWaveformDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!canSeekWaveform || !event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    waveformDragRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    seekWaveform(event);
  };

  const moveWaveform = (event: PointerEvent<HTMLDivElement>) => {
    if (waveformDragRef.current === event.pointerId) seekWaveform(event);
  };

  const endWaveformDrag = (event: PointerEvent<HTMLDivElement>, shouldSeek: boolean) => {
    if (waveformDragRef.current !== event.pointerId) return;
    if (shouldSeek) seekWaveform(event);
    waveformDragRef.current = null;
    saveProgress(true);
  };

  const turntableAngle = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return Math.atan2(
      event.clientY - bounds.top - bounds.height / 2,
      event.clientX - bounds.left - bounds.width / 2,
    );
  };

  const startTurntableDrag = (event: PointerEvent<HTMLDivElement>) => {
    const audio = currentSide?.kind === 'audio' && isAudioReady ? trackAudioPlayer : null;
    const widget = currentSide?.kind === 'soundcloud' ? soundCloudWidgetRef.current : null;
    if (!canSeekTurntable || (!audio && !widget) || !event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    audio?.pause();
    widget?.pause();
    turntableDragRef.current = {
      pointerId: event.pointerId,
      lastAngle: turntableAngle(event),
      lastTrackTime: audio?.currentTime ?? playbackTime,
      lastMoveTime: event.timeStamp,
      wasPlaying: isPlaying,
    };
    if (audio) {
      void audio.beginScratch().catch(() => {
        if (turntableDragRef.current?.pointerId !== event.pointerId) return;
        audio.endScratch();
        setStorageError('The track scratch sound could not be played.');
      });
    } else {
      setStorageError('Scratch audio is unavailable for SoundCloud tracks.');
    }
    setIsJogging(true);
    if (isPlaying) setIsPlaying(false);
  };

  const moveTurntable = (event: PointerEvent<HTMLDivElement>) => {
    const drag = turntableDragRef.current;
    const audio = currentSide?.kind === 'audio' && isAudioReady ? trackAudioPlayer : null;
    const widget = currentSide?.kind === 'soundcloud' ? soundCloudWidgetRef.current : null;
    if (!drag || drag.pointerId !== event.pointerId || (!audio && !widget)) return;
    const angle = turntableAngle(event);
    let angleDelta = angle - drag.lastAngle;
    if (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
    if (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
    drag.lastAngle = angle;
    if (Math.abs(angleDelta) <= 0.002) return;
    const secondsPerRevolution = 8;
    const timeDelta = angleDelta / (Math.PI * 2) * secondsPerRevolution;
    const previousTrackTime = drag.lastTrackTime;
    drag.lastTrackTime = Math.max(
      0,
      Math.min(playbackDuration, drag.lastTrackTime + timeDelta),
    );
    if (audio) {
      audio.scratch(previousTrackTime, drag.lastTrackTime, Math.max(0.02, Math.min(0.12, (event.timeStamp - drag.lastMoveTime) / 1000)));
    }
    else widget?.seekTo(drag.lastTrackTime * 1000);
    drag.lastMoveTime = event.timeStamp;
    platterAngleRef.current = (platterAngleRef.current + angleDelta * 180 / Math.PI) % 360;
    if (reelFaceRef.current) {
      reelFaceRef.current.style.transform = `rotate(${platterAngleRef.current}deg)`;
    }
    setPlaybackTime(drag.lastTrackTime);
    saveProgress();
  };

  const endTurntableDrag = (event: PointerEvent<HTMLDivElement>, resumePlayback: boolean) => {
    const drag = turntableDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    turntableDragRef.current = null;
    setIsJogging(false);
    trackAudioPlayer.endScratch();
    trackAudioPlayer.pause();
    soundCloudWidgetRef.current?.pause();
    saveProgress(true);
    if (resumePlayback && drag.wasPlaying && currentSide?.kind === 'audio') {
      void trackAudioPlayer.play().then(() => setIsPlaying(true)).catch(() => {
        setStorageError('This audio could not be resumed.');
      });
    } else if (resumePlayback && drag.wasPlaying) {
      setIsPlaying(true);
    }
  };

  const handleTurntableKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const audio = currentSide?.kind === 'audio' && isAudioReady ? trackAudioPlayer : null;
    const widget = currentSide?.kind === 'soundcloud' ? soundCloudWidgetRef.current : null;
    const duration = audio?.duration ?? playbackDuration;
    const currentTime = audio?.currentTime ?? playbackTime;
    if ((!audio && !widget) || !Number.isFinite(duration) || duration <= 0) return;
    let seconds: number | null = null;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') seconds = currentTime - 5;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') seconds = currentTime + 5;
    if (event.key === 'Home') seconds = 0;
    if (event.key === 'End') seconds = duration;
    if (seconds === null) return;
    event.preventDefault();
    const newTime = Math.max(0, Math.min(duration, seconds));
    if (audio) {
      void audio.seek(newTime).catch(() => {
        setStorageError('The track could not be seeked.');
      });
    }
    else widget?.seekTo(newTime * 1000);
    setPlaybackTime(newTime);
    saveProgress(true);
  };

  const turntableProgress = playbackDuration > 0
    ? Math.min(1, playbackTime / playbackDuration)
    : 0;
  const canSeekTurntable = playbackDuration > 0 && (
    (currentSide?.kind === 'audio' && isAudioReady)
    || (currentSide?.kind === 'soundcloud' && soundCloudReady)
  );
  const canSeekWaveform = canSeekTurntable && waveformPeaks.length > 0;
  const zoomBarCount = waveformBarsPerSecond * 10;
  const zoomCenter = playbackDuration > 0
    ? Math.floor(playbackTime / playbackDuration * frequencyWaveform.length)
    : 0;
  const formattedDeckTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const wholeSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
    const hundredths = Math.floor((seconds % 1) * 100).toString().padStart(2, '0');
    return `${minutes}:${wholeSeconds}.${hundredths}`;
  };
  const formattedPlaybackTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainder}`;
  };

  const updateSideTitle = (side: SideName) => {
    if (!activeCassette || !editedTitle.trim()) {
      setEditingSide(null);
      return;
    }
    persistCassette(side === 'A'
      ? { ...activeCassette, sideATitle: editedTitle.trim() }
      : { ...activeCassette, sideBTitle: editedTitle.trim() });
    setEditingSide(null);
  };

  return (
    <div className={`music-page min-h-screen bg-black text-neutral-100 ${isDragging ? 'is-dragging' : ''}`}>
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-sm tracking-[0.24em] text-white">CHRIS</Link>
          <SiteMenu />
        </div>
      </header>

      <main className="music-room mx-auto flex min-h-[calc(100svh-65px)] max-w-6xl flex-col px-6 pb-44 pt-8 md:pt-12">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-neutral-500">CHRIS / MUSIC</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-5xl">MUSIC</h1>
          </div>
          <Disc3 className="mb-1 h-7 w-7 text-neutral-500" />
        </div>

        <section aria-label="Cassette shelf" className="music-room-shelf mt-8">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.28em] text-neutral-500">TAPE COLLECTION</p>
            <button type="button" onClick={createBlankCassette} className="text-[9px] uppercase tracking-[0.18em] text-neutral-500 transition hover:text-white">
              + Blank tape
            </button>
          </div>
          <div className="cassette-shelf-grid">
            {cassettes.map((cassette, index) => (
              <button
                key={cassette.id}
                type="button"
                aria-label={`Select ${cassette.title} cassette`}
                aria-pressed={pendingCassetteId === cassette.id}
                data-cassette-id={cassette.id}
                onPointerDown={(event) => handleShelfCassettePointerDown(event, cassette)}
                onPointerMove={handleShelfCassettePointerMove}
                onPointerUp={handleShelfCassettePointerUp}
                onPointerCancel={handleShelfCassettePointerCancel}
                onAnimationEnd={() => {
                  if (snappedTapeId === cassette.id) setSnappedTapeId(null);
                }}
                onClick={() => {
                  if (suppressNextCassetteClickRef.current) return;
                  setPendingCassetteId(cassette.id);
                  setDragOffset(0);
                }}
                className={`cassette-shelf-tape group relative flex items-center border border-white/20 bg-gradient-to-br ${cassette.color} text-left shadow-[0_8px_18px_#000] transition duration-200 hover:-translate-y-1 hover:border-white/50 ${
                  activeCassetteId === cassette.id ? 'brightness-125' : 'brightness-90 hover:brightness-110'
                } ${dropTargetId === cassette.id ? 'cassette-drop-target' : ''} ${
                  snappedTapeId === cassette.id ? 'cassette-snap-in' : ''
                } ${draggedTapeId === cassette.id ? 'cassette-being-dragged' : ''}`}
              >
                <span className="cassette-shelf-tape-seam" />
                <span className="music-shelf-index">{String(index + 1).padStart(2, '0')}</span>
                <img className="music-shelf-art" src="/music-artwork.png" alt="" />
                <span className="cassette-shelf-label ml-2 min-w-0 flex-1">
                  <span className="block truncate text-[9px] uppercase tracking-[0.12em] text-white">{cassette.title}</span>
                  <span className="mt-1 block truncate text-[7px] uppercase tracking-[0.18em] text-white/50">
                    CHRIS · {knownDurations[sideKey(cassette.id, 'A')] === undefined ? '--:--' : formattedPlaybackTime(knownDurations[sideKey(cassette.id, 'A')])}
                  </span>
                </span>
                <span aria-hidden="true" className="ml-2 flex shrink-0 flex-col gap-1 text-[6px] text-white/40">
                  <span>90</span>
                  <span>TYPE I</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section ref={displayRef} className={`music-room-display ${isPlaying ? 'is-playing' : ''}`} aria-label="Selected cassette display">
          <div className="music-room-bar" aria-hidden="true">
            <span>CHRIS<br />LISTENING BAR</span><i /><i /><i />
          </div>
          <div className="music-room-table" aria-hidden="true" />
          {isPlaying && (
            <div className="music-room-dancer" aria-hidden="true">
              <svg viewBox="0 0 32 40" shapeRendering="crispEdges">
                <g className="music-room-dancer-body">
                  <path fill="#050505" d="M8 3h3V1h10v2h3v3h2v11h-2v3h-2v2h3v3h2v8h-4v3h-5v-2h-4v2H9v-3H5v-8h2v-3h3v-2H8v-3H6V6h2z" />
                  <path fill="#f2f2f2" d="M10 8h12v9h-2v2h-8v-2h-2z" />
                  <path fill="#262626" d="M9 5h2V3h10v2h2v6h-3V8h-2v2h-3V8h-2v2H9z" />
                  <path fill="#00ff66" d="M6 9h3v7H6zm17 0h3v7h-3z" />
                  <path fill="#050505" d="M12 12h2v2h-2zm6 0h2v2h-2zm-3 4h3v1h-3z" />
                  <path fill="#f2f2f2" d="M10 22h12v3h2v7h-5v-3h-6v3H8v-7h2z" />
                  <path fill="#555" d="M15 22h2v7h-2zM9 29h3v3H9zm11 0h3v3h-3z" />
                  <path fill="#00ff66" d="M13 25h6v2h-6z" />
                  <g className="music-room-dancer-arm-left">
                    <path fill="#050505" d="M6 22h4v3H8v6H4v-7h2z" />
                    <path fill="#eee" d="M6 25h2v4H6z" />
                  </g>
                  <g className="music-room-dancer-arm-right">
                    <path fill="#050505" d="M22 22h4v2h2v7h-4v-6h-2z" />
                    <path fill="#eee" d="M24 25h2v4h-2z" />
                  </g>
                </g>
                <g className="music-room-dancer-feet">
                  <path fill="#050505" d="M9 32h6v4h2v-4h6v5h2v2h-9v-3h-1v3H7v-2h2z" />
                  <path fill="#eee" d="M9 37h5v1H9zm9 0h5v1h-5z" />
                </g>
              </svg>
            </div>
          )}
          <div className="music-room-feature" key={activeCassetteId ?? 'empty'}>
            <div className="music-room-art">
              <img src="/music-artwork.png" alt="" />
              <span>{activeCassette ? currentSideTitle : 'CHRIS / MUSIC'}</span>
            </div>
            <div className={`music-room-tape ${isPlaying ? 'is-playing' : ''}`} aria-hidden="true">
              <div className="music-room-tape-label">
                <span>CHRIS // SIDE {activeCassette ? activeSide : 'A'}</span>
                <strong>{activeCassette ? currentSideTitle : 'SELECT A TAPE'}</strong>
              </div>
              <div className="music-room-tape-window">
                <span className="music-room-tape-reel" /><span className="music-room-tape-center" /><span className="music-room-tape-reel" />
              </div>
            </div>
          </div>
          <div className="music-room-display-controls">
            <p aria-live="polite">
              {activeCassette
                ? `${currentSideTitle} · SIDE ${activeSide} · ${isPlaying ? 'NOW PLAYING' : isAudioLoading ? 'LOADING' : waveformError ? 'ERROR' : currentSide ? 'READY' : 'BLANK SIDE'}`
                : 'CHOOSE A CASSETTE'}
            </p>
            {activeCassette && (
              <div className="music-room-actions">
                {isPlaying && <button type="button" onClick={togglePlay}>PAUSE</button>}
                <button type="button" onClick={() => setSelectedCassetteId(activeCassette.id)}>INSPECT TAPE</button>
              </div>
            )}
          </div>
        </section>
        <section className="music-playlist" aria-label="Custom cassette playlist">
          <div className="music-playlist-heading">
            <h2>CASSETTE QUEUE <span>{String(playlist.length).padStart(2, '0')}</span></h2>
            <span>INSERT IN PLAY ORDER</span>
          </div>
          <button type="button" className="music-cassette-slot" data-cassette-slot onClick={insertPendingCassette}>
            <span>▼ MODULAR TAPE BAY ▼</span>
            <strong>{pendingCassette ? `INSERT ${pendingCassette.title}` : 'SELECT A TAPE, THEN TAP HERE'}</strong>
          </button>
          {playlist.length ? (
            <ol className="music-playlist-items">
              {playlist.map((entry, index) => {
                const cassette = cassettes.find((item) => item.id === entry.cassetteId);
                return (
                  <li key={entry.id} className={entry.id === activeQueueId ? 'is-current' : ''}>
                    <button type="button" className="music-queue-play" onClick={() => startQueueEntry(entry)} aria-label={`Play queued ${cassette?.title ?? 'cassette'}`}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <strong>{cassette?.sideATitle ?? 'Unavailable cassette'}</strong>
                      <span>{entry.id === activeQueueId ? 'LOADED' : 'PLAY'}</span>
                    </button>
                    <button type="button" className="music-queue-remove" onClick={() => removeQueueEntry(entry)} aria-label={`Remove ${cassette?.title ?? 'cassette'} from queue`}>×</button>
                  </li>
                );
              })}
            </ol>
          ) : <p className="music-playlist-empty">SELECT A TAPE AND INSERT IT TO BUILD YOUR PLAYLIST</p>}
        </section>
        <Link to="/" className="music-room-back"><ArrowLeft size={16} aria-hidden="true" /> HOME</Link>

        {storageError && (
          <p role="status" className="fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded border border-white/20 bg-[#111] px-4 py-2 text-center text-[10px] text-neutral-300">
            {storageError}
            <button type="button" onClick={() => setStorageError(null)} aria-label="Dismiss message" className="ml-3 text-white">×</button>
          </p>
        )}
      </main>

      {dragPreview && (
        <div className="music-tape-drag-preview" aria-hidden="true" style={{ left: dragPreview.x, top: dragPreview.y }}>
          <strong>{dragPreview.title}</strong><span>▣ ▣</span>
        </div>
      )}
      <div className={`tp7-player-drawer fixed inset-x-0 bottom-0 z-30 px-2 pb-2 sm:px-6 sm:pb-4 ${isPlayerExpanded ? 'is-open' : 'is-closed'}`}>
        <button
          type="button"
          aria-expanded={isPlayerExpanded}
          aria-controls="cassette-deck"
          onPointerDown={handleHardwareButtonPointerDown}
          onKeyDown={handleHardwareButtonKeyDown}
          onClick={() => setIsPlayerExpanded((expanded) => !expanded)}
          className="tp7-drawer-trigger"
        >
          <span className="tp7-drawer-label">CHRIS // FIELD PLAYER</span>
          <span className="tp7-drawer-led" />
          <span className="tp7-drawer-instruction">{isPlayerExpanded ? 'TAP TO HIDE' : 'TAP TO OPEN'}</span>
        </button>
        <section
          ref={playerRef}
          id="cassette-deck"
          aria-label="Cassette player"
          aria-hidden={!isPlayerExpanded}
          inert={!isPlayerExpanded}
          className={`tp7-inspired-deck relative mx-auto w-full max-w-[500px] overflow-hidden rounded-[8px] border border-[#414349] px-3 py-3 text-[#e4e5e8] shadow-[0_14px_28px_rgb(0_0_0_/_55%)] transition sm:px-5 sm:py-5 ${isDragging ? 'scale-[1.01]' : ''}`}
        >
          <div className="tp7-unit-header flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <span className={`tp7-status-led ${isPlaying ? 'is-active' : ''}`} />
              <span className="text-[8px] font-semibold uppercase tracking-[0.22em] text-neutral-400">CHRIS // FIELD PLAYER</span>
            </div>
            <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-neutral-500">
              {activeCassette
                ? `SIDE ${activeSide} · ${isAudioLoading ? 'LOADING' : isPlaying ? 'PLAY' : 'STANDBY'}`
                : 'STANDBY'}
            </span>
          </div>

          <button type="button" className="music-cassette-slot music-deck-slot" data-cassette-slot onClick={insertPendingCassette}>
            <span>▼ MODULAR TAPE BAY ▼</span>
            <strong>{pendingCassette ? `INSERT ${pendingCassette.title}` : 'SELECT A TAPE, THEN TAP HERE'}</strong>
          </button>

          <div className="tp7-player-content mx-auto flex w-full max-w-full flex-col items-center py-3">
            <div className="tp7-display-panel">
              <div className="tp7-display-topline">
                <span className={`tp7-display-state ${isPlaying ? 'is-active' : ''}`}>
                  {isAudioLoading ? 'LOAD' : isPlaying ? 'PLAY' : 'STP'}
                </span>
                <span>{currentSide ? `TRK 01/01 · SIDE ${activeSide}` : 'NO TAPE LOADED'}</span>
                <span className="ml-auto">
                  {currentSide?.kind === 'soundcloud'
                    ? 'SC'
                    : currentSide ? isFastForwarding ? '2.00x' : '1.00x' : '--'}
                </span>
              </div>
              <div className="tp7-display-track-row">
                <div className="tp7-display-track-main">
                  <p className="tp7-display-time">{formattedDeckTime(playbackTime)}</p>
                  <div className="min-w-0 flex-1">
                    {activeCassette && editingSide === activeSide ? (
                      <input
                        autoFocus
                        value={editedTitle}
                        onChange={(event) => setEditedTitle(event.currentTarget.value)}
                        onBlur={() => updateSideTitle(activeSide)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') updateSideTitle(activeSide);
                          if (event.key === 'Escape') setEditingSide(null);
                        }}
                        aria-label="Tape side title"
                        className="tp7-track-title-input"
                      />
                    ) : (
                      <button
                        type="button"
                        disabled={!activeCassette}
                        onClick={() => {
                          if (!activeCassette) return;
                          setEditedTitle(currentSideTitle);
                          setEditingSide(activeSide);
                        }}
                        className="tp7-track-title"
                        title="Rename this side"
                      >
                        {activeCassette ? currentSideTitle : 'NO TAPE LOADED'}
                      </button>
                    )}
                    <p className="tp7-track-file">
                      {currentSide?.kind === 'audio'
                        ? currentSide.fileName
                        : currentSide?.kind === 'video'
                          ? isPlaying ? 'VIDEO INPUT · PLAYING' : 'VIDEO INPUT · STANDBY'
                          : currentSide?.kind === 'soundcloud'
                            ? 'SOUNDCLOUD STREAM'
                            : activeCassette ? 'BLANK SIDE' : 'INSERT CASSETTE TO BEGIN'}
                    </p>
                  </div>
                </div>
                {currentSide?.kind === 'video' && (
                  <div className="tp7-video-window">
                    <iframe
                      ref={videoRef}
                      key={`${activeCassetteId}:${activeSide}`}
                      title={`${currentSideTitle} YouTube player`}
                      src={`https://www.youtube-nocookie.com/embed/${currentSide.youtubeId}?autoplay=1&enablejsapi=1&rel=0&origin=${encodeURIComponent(window.location.origin)}`}
                      onLoad={() => {
                        videoRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening' }), 'https://www.youtube-nocookie.com');
                        sendVideoCommand('addEventListener', ['onStateChange']);
                        sendVideoCommand(isPlaying ? 'playVideo' : 'pauseVideo');
                        sendVideoCommand('setPlaybackRate', [isFastForwarding ? 2 : 1]);
                        sendVideoCommand('setVolume', [Math.round(volume * 100)]);
                      }}
                      className="aspect-video w-full"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
              {currentSide?.kind === 'soundcloud' && (
                <div className="tp7-soundcloud-window">
                  <iframe
                    ref={soundCloudIframeRef}
                    key={`${activeCassetteId}:${activeSide}`}
                    title={`${currentSideTitle} SoundCloud player`}
                    src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(currentSide.trackUrl)}&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&download=false&visual=false&color=%23ff4a1c`}
                    allow="autoplay; encrypted-media"
                  />
                </div>
              )}
            {currentSide?.kind === 'audio' && (
              <div className="w-full">
                <div className="mb-1 flex items-center justify-between font-mono text-[7px] uppercase tracking-[0.16em] text-neutral-500">
                  <span>Waveform</span>
                  <span>{formattedPlaybackTime(playbackTime)} / {formattedPlaybackTime(playbackDuration)}</span>
                </div>
                {waveformPeaks.length > 0 ? (
                  <>
                  <div className="cdj-frequency-header">
                    <span>10 SEC DETAIL</span>
                    <span><b className="cdj-frequency-low">LOW</b> / <b className="cdj-frequency-mid">MID</b> / <b className="cdj-frequency-high">HIGH</b></span>
                  </div>
                  {frequencyWaveform.length > 0 ? (
                    <div className="cdj-frequency-waveform" role="img" aria-label="10 second waveform around the current position, shaded by low, mid and high frequencies">
                      {Array.from({ length: zoomBarCount }, (_, index) => {
                        const bar = frequencyWaveform[zoomCenter - zoomBarCount / 2 + index];
                        const energy = bar ? bar.low + bar.mid + bar.high : 0;
                        const lowEnd = energy ? bar.low / energy * 100 : 0;
                        const midEnd = energy ? (bar.low + bar.mid) / energy * 100 : 0;
                        return (
                          <span
                            key={index}
                            className="cdj-frequency-bar"
                            style={{
                              height: bar ? `${Math.max(3, bar.peak * 100)}%` : '0%',
                              background: energy
                                ? `linear-gradient(to top, #eee ${lowEnd}%, #aaa ${lowEnd}% ${midEnd}%, #777 ${midEnd}%)`
                                : 'transparent',
                            }}
                          />
                        );
                      })}
                      <span className="cdj-frequency-playhead" aria-hidden="true" />
                    </div>
                  ) : (
                    <div className="cdj-frequency-placeholder" role="status">
                      {frequencyWaveformError ?? 'Analyzing frequency waveform...'}
                    </div>
                  )}
                  <div
                    role="slider"
                    aria-label="Track waveform seek"
                    aria-valuemin={0}
                    aria-valuemax={Math.floor(playbackDuration)}
                    aria-valuenow={Math.floor(playbackTime)}
                    aria-valuetext={`${formattedPlaybackTime(playbackTime)} of ${formattedPlaybackTime(playbackDuration)}`}
                    aria-disabled={!canSeekWaveform}
                    tabIndex={canSeekWaveform ? 0 : -1}
                    title="Click or drag the waveform to seek"
                    onKeyDown={handleTurntableKeyDown}
                    onPointerDown={startWaveformDrag}
                    onPointerMove={moveWaveform}
                    onPointerUp={(event) => endWaveformDrag(event, true)}
                    onPointerCancel={(event) => endWaveformDrag(event, false)}
                    onLostPointerCapture={(event) => endWaveformDrag(event, false)}
                    className={`cdj-waveform ${canSeekWaveform ? 'cursor-ew-resize focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#f28a36]' : 'cursor-wait'}`}
                  >
                    {waveformPeaks.map((peak, index) => (
                      <span
                        key={index}
                        aria-hidden="true"
                        className={`cdj-waveform-bar ${
                          (index + 0.5) / waveformPeaks.length <= turntableProgress
                            ? 'cdj-waveform-bar-played'
                            : ''
                        }`}
                        style={{ height: `${Math.max(8, peak * 100)}%` }}
                      />
                    ))}
                    <span
                      aria-hidden="true"
                      className="cdj-waveform-playhead"
                      style={{ left: `${turntableProgress * 100}%` }}
                    />
                  </div>
                  </>
                ) : (
                  <div className="cdj-waveform-placeholder" role="status" aria-live="polite">
                    {waveformError ? (
                      <>
                        <span>{waveformError}</span>
                        <button
                          type="button"
                          className="shrink-0 border border-white/30 px-2 py-1 text-[8px] uppercase tracking-[0.12em] text-white hover:border-[#f28a36]"
                          onClick={() => setAudioLoadAttempt((attempt) => attempt + 1)}
                        >
                          Retry
                        </button>
                      </>
                    ) : isAudioLoading ? 'Loading audio...' : 'Analyzing waveform...'}
                  </div>
                )}
              </div>
            )}
            {currentSide === null && (
              <div className="tp7-display-empty">
                {activeCassette ? 'BLANK SIDE' : 'INSERT CASSETTE TO BEGIN'}
              </div>
            )}
            </div>

            <div className="tp7-drive-header">
              <span>VIRTUAL DIRECT DRIVE</span>
              <span>{isJogging ? 'SCRUB' : isPlaying ? 'MOTOR ACTIVE' : 'IDLE // STANDBY'}</span>
            </div>

            <div className="tp7-drive-zone">
              <aside className="tp7-track-list" aria-label="Track list">
                <div className="tp7-track-list-header">
                  <span>TRACK LIST / TAPE SLOTS</span>
                  <span>{String(playlist.length).padStart(2, '0')}</span>
                </div>
                <p className="tp7-tape-hint">{pendingCassette ? 'TAP A SLOT TO REPLACE' : 'DRAG HANDLE TO SWAP / × TO EJECT'}</p>
                <div className="tp7-track-list-items">
                  {playlist.map((entry, index) => {
                    const cassette = cassettes.find((item) => item.id === entry.cassetteId);
                    return (
                      <div key={entry.id} data-queue-slot={entry.id} className={`tp7-tape-slot ${entry.id === activeQueueId ? 'is-current' : ''} ${entry.id === queueDropTargetId ? 'is-drop-target' : ''}`}>
                        <button
                          type="button"
                          className="tp7-tape-drag"
                          aria-label={`Drag ${cassette?.sideATitle ?? 'cassette'} slot`}
                          title="Drag to swap slots or eject"
                          onPointerDown={(event) => handleQueuePointerDown(event, entry)}
                          onPointerMove={handleQueuePointerMove}
                          onPointerUp={handleQueuePointerUp}
                          onPointerCancel={handleQueuePointerCancel}
                        >⠿</button>
                        <button
                          type="button"
                          className="tp7-tape-insert"
                          aria-label={pendingCassette ? `Replace slot ${index + 1} with ${pendingCassette.title}` : `Play slot ${index + 1}: ${cassette?.sideATitle ?? 'unavailable cassette'}`}
                          aria-pressed={entry.id === activeQueueId}
                          onClick={() => pendingCassette ? replaceQueueEntry(entry, pendingCassette) : startQueueEntry(entry)}
                        >
                          <span className="tp7-tape-number">{String(index + 1).padStart(2, '0')}</span>
                          <span className="tp7-tape-copy">
                            <strong>{cassette?.sideATitle ?? 'UNAVAILABLE'}</strong>
                            <span>{entry.id === activeQueueId ? 'LOADED' : 'SIDE A'}</span>
                          </span>
                          <span className="tp7-tape-reels" aria-hidden="true">▣ ▣</span>
                        </button>
                        <div className="tp7-tape-actions">
                          <button
                            type="button"
                            disabled={index === 0}
                            aria-label={`Move slot ${index + 1} up`}
                            onClick={() => setPlaylist((current) => {
                              const result = [...current];
                              [result[index - 1], result[index]] = [result[index], result[index - 1]];
                              return result;
                            })}
                          >▲</button>
                          <button
                            type="button"
                            disabled={index === playlist.length - 1}
                            aria-label={`Move slot ${index + 1} down`}
                            onClick={() => setPlaylist((current) => {
                              const result = [...current];
                              [result[index + 1], result[index]] = [result[index], result[index + 1]];
                              return result;
                            })}
                          >▼</button>
                          <button type="button" aria-label={`Eject slot ${index + 1}: ${cassette?.sideATitle ?? 'cassette'}`} onClick={() => removeQueueEntry(entry)}>×</button>
                        </div>
                      </div>
                    );
                  })}
                  <button type="button" className="tp7-tape-empty" data-cassette-slot onClick={insertPendingCassette}>
                    {pendingCassette ? `+ INSERT ${pendingCassette.title}` : '+ INSERT TAPE'}
                  </button>
                </div>
                <div className="tp7-tape-eject" data-queue-eject>DRAG HERE TO EJECT</div>
              </aside>
              <div
                role="slider"
                aria-label="Turntable jog wheel"
                  aria-valuemin={0}
                  aria-valuemax={Math.floor(playbackDuration)}
                  aria-valuenow={Math.floor(playbackTime)}
                  aria-valuetext={`${formattedPlaybackTime(playbackTime)} of ${formattedPlaybackTime(playbackDuration)}. Rotate while dragging to jog.`}
                  aria-disabled={!canSeekTurntable}
                  tabIndex={canSeekTurntable ? 0 : -1}
                  title="Rotate around the platter to scratch or seek"
                  onKeyDown={handleTurntableKeyDown}
                  onPointerDown={startTurntableDrag}
                  onPointerMove={moveTurntable}
                  onPointerUp={(event) => endTurntableDrag(event, true)}
                  onPointerCancel={(event) => endTurntableDrag(event, false)}
                  onLostPointerCapture={(event) => endTurntableDrag(event, false)}
                  onAnimationEnd={(event) => {
                    if (event.animationName === 'cassette-flip') setIsFlipping(false);
                  }}
                  style={{
                    background: `conic-gradient(from 0deg, #eee ${turntableProgress * 100}%, #555 ${turntableProgress * 100}% 100%)`,
                  }}
                  className={`tp7-reel-face tp7-drive-platter relative flex aspect-square w-[184px] touch-none select-none items-center justify-center rounded-full p-[7px] outline-none sm:w-[204px] ${
                    canSeekTurntable ? 'cursor-grab focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4a1c] active:cursor-grabbing' : 'cursor-default'
                  } ${
                    activeCassette ? 'cassette-deck-snap' : ''
                  } ${isFlipping ? 'cassette-flip' : ''}`}
                >
                  <div
                    className="tp7-reel-face-inner pointer-events-none absolute inset-[7px] flex items-center justify-center overflow-hidden rounded-full border"
                  >
                    <div ref={reelFaceRef} className="absolute inset-0 flex items-center justify-center">
                      <span className="tp7-platter-groove absolute inset-[7px] rounded-full border" />
                      <span className="tp7-platter-groove absolute inset-[15px] rounded-full border" />
                      <span className="tp7-platter-groove absolute inset-[25px] rounded-full border" />
                      <span className="tp7-platter-index-mark tp7-platter-index-mark-left" />
                      <span className="tp7-platter-index-mark tp7-platter-index-mark-right" />
                      <span className="tp7-platter-index-mark tp7-platter-index-mark-top" />
                      <div className="tp7-reel-hub relative flex h-16 w-16 items-center justify-center rounded-full border sm:h-[72px] sm:w-[72px]">
                        <span className="tp7-reel-hub-ring absolute rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
                <label className="cdj-volume-control tp7-drive-volume">
                  <span className="font-mono text-[7px] uppercase tracking-[0.16em] text-neutral-500">Master</span>
                  <input
                    type="range"
                    aria-label="Master volume"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(event) => setVolume(Number(event.currentTarget.value))}
                    className="cdj-volume-fader"
                  />
                  <output className="font-mono text-[7px] tabular-nums text-neutral-500">
                    {Math.round(volume * 100)}%
                  </output>
                </label>
              </div>

            <p className="tp7-reel-caption">DRAG REEL: SCRUB / HOLD: BRAKE</p>
          </div>

          <div className="tp7-switch-bank-header">
            <span>TRANSPORT // MECHANICAL SWITCH BANK</span>
            <span>TRAVEL: 1.5PX</span>
          </div>

          <div className="cdj-transport-controls" role="group" aria-label="Transport controls">
            <button type="button" aria-label="Rewind" title="Hold to rewind" disabled={!currentSide} onPointerDown={(event) => { handleHardwareButtonPointerDown(event); beginRewind(); }} onPointerUp={endRewind} onPointerCancel={endRewind} onPointerLeave={endRewind} onKeyDown={handleHardwareButtonKeyDown} className="cdj-control-button">
              <span className="cdj-control-label">REW</span>
              <Rewind className="cdj-control-icon" />
            </button>
            <button type="button" aria-label="Previous cassette" onPointerDown={handleHardwareButtonPointerDown} onKeyDown={handleHardwareButtonKeyDown} onClick={() => changeCassette(-1)} disabled={!activeCassette} className="cdj-control-button cdj-control-light">
              <span className="cdj-control-label">PREV</span>
              <SkipBack className="cdj-control-icon" />
            </button>
            <button type="button" aria-label={isPlaying ? 'Pause' : 'Play'} onPointerDown={handleHardwareButtonPointerDown} onKeyDown={handleHardwareButtonKeyDown} onClick={togglePlay} disabled={!currentSide || (currentSide.kind === 'audio' && !isAudioReady)} className={`cdj-control-button cdj-control-play ${isPlaying ? 'cdj-control-lit' : ''}`}>
              <span className="cdj-control-label">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
              {isPlaying ? <Pause className="cdj-control-icon" /> : <Play className="cdj-control-icon" />}
            </button>
            <button type="button" aria-label="Next cassette" onPointerDown={handleHardwareButtonPointerDown} onKeyDown={handleHardwareButtonKeyDown} onClick={() => changeCassette(1)} disabled={!activeCassette} className="cdj-control-button cdj-control-light">
              <span className="cdj-control-label">NEXT</span>
              <SkipForward className="cdj-control-icon" />
            </button>
            <button type="button" aria-label="Fast forward" title="Hold to fast-forward" disabled={!currentSide || currentSide.kind === 'soundcloud'} onPointerDown={(event) => { handleHardwareButtonPointerDown(event); setIsFastForwarding(true); }} onPointerUp={() => setIsFastForwarding(false)} onPointerCancel={() => setIsFastForwarding(false)} onPointerLeave={() => setIsFastForwarding(false)} onKeyDown={handleHardwareButtonKeyDown} className={`cdj-control-button ${isFastForwarding ? 'cdj-control-active' : ''}`}>
              <span className="cdj-control-label">FWD</span>
              <FastForward className="cdj-control-icon" />
            </button>
            <button type="button" aria-label={isPlaying ? 'Stop' : 'Eject'} title={isPlaying ? 'Stop' : 'Eject cassette'} onPointerDown={handleHardwareButtonPointerDown} onKeyDown={handleHardwareButtonKeyDown} onClick={stopOrEject} disabled={!activeCassette} className="cdj-control-button cdj-control-light">
              <span className="cdj-control-label">{isPlaying ? 'STOP' : 'EJECT'}</span>
              <Square className="cdj-control-icon" />
            </button>
          </div>

          <div className="tp7-footer-cavity" role="group" aria-label="Cassette controls">
            <button
              type="button"
              aria-label={`Flip to side ${activeSide === 'A' ? 'B' : 'A'}`}
              onPointerDown={handleHardwareButtonPointerDown}
              onKeyDown={handleHardwareButtonKeyDown}
              onClick={flipSide}
              disabled={!activeCassette}
              className="tp7-footer-key"
            >
              <span className="tp7-footer-label">FLIP</span>
              <span className="tp7-footer-led" />
              <FlipHorizontal className="tp7-footer-glyph" />
            </button>
            <button
              type="button"
              aria-label={activeCassette?.locked ? 'Unlock cassette' : 'Lock cassette'}
              onPointerDown={handleHardwareButtonPointerDown}
              onKeyDown={handleHardwareButtonKeyDown}
              onClick={() => activeCassette && persistCassette({ ...activeCassette, locked: !activeCassette.locked })}
              disabled={!activeCassette}
              className={`tp7-footer-key ${activeCassette?.locked ? 'is-locked' : ''}`}
            >
              <span className="tp7-footer-label">{activeCassette?.locked ? 'LOCKED' : 'LOCK'}</span>
              <span className="tp7-footer-led" />
              {activeCassette?.locked
                ? <LockKeyhole className="tp7-footer-glyph" />
                : <UnlockKeyhole className="tp7-footer-glyph" />}
            </button>
          </div>

        </section>
      </div>

      {selectedCassette && (
        <div
          role="presentation"
          onClick={() => {
            if (!isInserting) setSelectedCassetteId(null);
          }}
          className="cassette-inspect-overlay fixed inset-0 z-40 flex items-center justify-center px-5"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedCassette.title} cassette`}
            onClick={(event) => event.stopPropagation()}
            className="cassette-inspect-dialog cassette-popup-in relative w-full max-w-sm text-center"
          >
            <button
              type="button"
              aria-label="Close cassette"
              onClick={() => setSelectedCassetteId(null)}
              disabled={isInserting}
              className="cassette-inspect-close"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="cassette-inspect-heading">
              <span>CHRIS / TAPE ARCHIVE</span><span>INSPECT MODE</span>
            </div>
            <div
              onAnimationEnd={handleAnimationEnd}
              style={{ transform: `translateY(${dragOffset}px)` }}
              className={`cassette-inspect-motion ${isInserting ? 'cassette-slide-to-player' : ''}`}
            >
              <div
                ref={inspectStageRef}
                role="group"
                aria-label="Rotate cassette"
                aria-describedby="cassette-inspect-instructions"
                tabIndex={isInserting ? -1 : 0}
                onPointerDown={handleInspectPointerDown}
                onPointerMove={handleInspectPointerMove}
                onPointerUp={handleInspectPointerEnd}
                onPointerCancel={handleInspectPointerEnd}
                onLostPointerCapture={handleInspectPointerEnd}
                onKeyDown={handleInspectKeyDown}
                className="cassette-inspect-stage"
              >
                <div className="cassette-inspect-object" style={{ transform: `rotateX(${inspectRotation.x}deg) rotateY(${inspectRotation.y}deg)` }}>
                  {(['A', 'B'] as const).map((side) => (
                    <div className={`cassette-inspect-face cassette-inspect-face-${side.toLowerCase()}`} key={side}>
                      <div className="cassette-inspect-label">
                        <div className="cassette-inspect-label-top"><span>CHRIS // TAPE ARCHIVE</span><b>SIDE {side}</b></div>
                        <strong>{side === 'A' ? selectedCassette.sideATitle : selectedCassette.sideBTitle}</strong>
                        <div className="cassette-inspect-label-bottom"><span>STEREO / 01</span><span>{(side === 'A' ? selectedCassette.sideA : selectedCassette.sideB) ? 'RECORDED' : 'BLANK'}</span></div>
                      </div>
                      <div className="cassette-inspect-window">
                        <span className="cassette-inspect-reel"><i /></span>
                        <span className="cassette-inspect-spool" />
                        <span className="cassette-inspect-reel"><i /></span>
                      </div>
                      <div className="cassette-inspect-bottom"><span>▣</span><span>CHRIS / SIDE {side}</span><span>▣</span></div>
                    </div>
                  ))}
                  <div className="cassette-inspect-edge cassette-inspect-edge-top" />
                  <div className="cassette-inspect-edge cassette-inspect-edge-bottom" />
                  <div className="cassette-inspect-edge cassette-inspect-edge-left" />
                  <div className="cassette-inspect-edge cassette-inspect-edge-right" />
                </div>
              </div>
            </div>
            <p className="cassette-inspect-title">{selectedCassette.title}</p>
            <p id="cassette-inspect-instructions" className="cassette-inspect-instructions">
              {isInserting ? 'LOADING TAPE...' : 'DRAG TO ROTATE / ARROW KEYS TO TURN'}
            </p>
            {!isInserting && (
              <div className="cassette-inspect-controls">
                <button type="button" onClick={() => setInspectRotation((rotation) => ({ ...rotation, y: rotation.y + 180 }))}>FLIP A / B</button>
                <button type="button" onClick={() => setInspectRotation({ x: -12, y: -20 })}>RESET VIEW</button>
                <button
                  type="button"
                  className="cassette-inspect-insert"
                  onPointerDown={handleCassettePointerDown}
                  onPointerMove={handleCassettePointerMove}
                  onPointerUp={handleCassettePointerUp}
                  onPointerCancel={() => { pointerStartY.current = null; setDragOffset(0); }}
                  onClick={() => { if (!suppressInspectInsertClickRef.current) startInsertion(selectedCassette); }}
                >
                  ↓ SLIDE OR TAP TO INSERT
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}