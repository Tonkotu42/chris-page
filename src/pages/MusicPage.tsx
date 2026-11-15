import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Disc3,
  FastForward,
  FlipHorizontal,
  LockKeyhole,
  Pause,
  Play,
  Radio,
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
import type { Cassette, CassetteSide } from '../lib/musicStorage';

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

const initialCassettes: Cassette[] = [
  {
    id: 'afterlife',
    title: 'Afterlife',
    sideATitle: 'Afterlife',
    sideBTitle: 'SIDE B',
    sideA: { kind: 'audio', src: 'afterlife.bin', fileName: 'afterlife.mp3' },
    sideB: null,
    color: 'from-[#a3a3a3] via-[#33384a] to-[#090a10]',
    locked: true,
  },
  {
    id: 'done-with-u',
    title: 'Done With U',
    sideATitle: 'Done With U',
    sideBTitle: 'SIDE B',
    sideA: { kind: 'audio', src: 'done-with-u.bin', fileName: 'Done with you.mp3' },
    sideB: null,
    color: 'from-[#b2a1c9] via-[#423448] to-[#090a10]',
    locked: true,
  },
  {
    id: 'make-me-up',
    title: 'Make Me Up',
    sideATitle: 'Make Me Up',
    sideBTitle: 'SIDE B',
    sideA: { kind: 'audio', src: 'make-me-up.bin', fileName: 'Make Me up.mp3' },
    sideB: null,
    color: 'from-[#c7a77b] via-[#57412b] to-[#090a10]',
    locked: true,
  },
];

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
  wasPlaying: boolean;
}

interface TrackListItem {
  cassetteId: string;
  side: SideName;
  title: string;
  detail: string;
  kind: 'audio' | 'video' | 'soundcloud';
}

export default function MusicPage() {
  const [cassettes, setCassettes] = useState(initialCassettes);
  const [activeCassetteId, setActiveCassetteId] = useState<string | null>(null);
  const [selectedCassetteId, setSelectedCassetteId] = useState<string | null>(null);
  const [activeSide, setActiveSide] = useState<SideName>('A');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTapeId, setDraggedTapeId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [snappedTapeId, setSnappedTapeId] = useState<string | null>(null);
  const [isInserting, setIsInserting] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [editingSide, setEditingSide] = useState<SideName | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [audioLoadAttempt, setAudioLoadAttempt] = useState(0);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const [waveformError, setWaveformError] = useState<string | null>(null);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [isJogging, setIsJogging] = useState(false);
  const [platterAngle, setPlatterAngle] = useState(0);
  const [volume, setVolume] = useState(1);
  const [soundCloudReady, setSoundCloudReady] = useState(false);
  const pointerStartY = useRef<number | null>(null);
  const [trackAudioPlayer] = useState(() => {
    const player = new SupabaseWorkletAudioPlayer();
    player.onEnded = () => setIsPlaying(false);
    return player;
  });
  const [vhsNoisePlayer] = useState(() => new WebAudioPlayer());
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
  const playerRef = useRef<HTMLElement>(null);
  const shelfPointerDragRef = useRef<ShelfPointerDrag | null>(null);
  const suppressNextCassetteClickRef = useRef(false);
  const insertionTimerRef = useRef<number | null>(null);

  const activeCassette = cassettes.find((cassette) => cassette.id === activeCassetteId) ?? null;
  const selectedCassette = cassettes.find((cassette) => cassette.id === selectedCassetteId) ?? null;
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
  const availableTracks: TrackListItem[] = cassettes.flatMap((cassette) =>
    (['A', 'B'] as const).flatMap((side) => {
      const cassetteSide = side === 'A' ? cassette.sideA : cassette.sideB;
      if (!cassetteSide) return [];
      return [{
        cassetteId: cassette.id,
        side,
        title: side === 'A' ? cassette.sideATitle : cassette.sideBTitle,
        detail: cassetteSide.kind === 'audio'
          ? cassetteSide.fileName
          : cassetteSide.kind === 'video'
            ? `VIDEO · ${cassetteSide.youtubeId}`
            : 'SOUNDCLOUD',
        kind: cassetteSide.kind,
      }];
    }),
  );

  useEffect(() => {
    setPlaybackTime(0);
    setPlaybackDuration(0);
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
    let cancelled = false;
    setWaveformPeaks([]);
    setWaveformError(null);
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
        setWaveformPeaks(createWaveformPeaks(buffer));
        setIsAudioReady(true);
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
    loadEffect(vhsNoisePlayer, '/audio/vhs-noise.ogg', 'VHS noise could not be loaded.');
    loadEffect(insertionSoundPlayer, '/audio/cassette-insert.ogg', 'Cassette sound could not be loaded.');
    loadEffect(buttonClickPlayer, '/audio/clicking.ogg', 'Button sound could not be loaded.');
    return () => {
      cancelled = true;
      vhsNoisePlayer.stop();
      insertionSoundPlayer.stop();
      buttonClickPlayer.stop();
    };
  }, [buttonClickPlayer, insertionSoundPlayer, vhsNoisePlayer]);

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
            setIsPlaying(false);
            saveProgress(true);
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
    if (!activeSideId) return;
    if (currentSide?.kind === 'audio' && !isAudioReady) return;
    if (currentSide?.kind === 'soundcloud' && (!soundCloudReady || !widget)) return;
    if (currentSide?.kind !== 'audio' && currentSide?.kind !== 'soundcloud') return;
    let cancelled = false;
    const restorePosition = async () => {
      try {
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
    trackAudioPlayer.setVolume(volume);
    vhsNoisePlayer.setVolume(volume * 0.6);
    insertionSoundPlayer.setVolume(volume * 0.6);
    buttonClickPlayer.setVolume(volume * 0.55);
    if (currentSide?.kind === 'video') sendVideoCommand('setVolume', [Math.round(volume * 100)]);
    if (currentSide?.kind === 'soundcloud' && soundCloudReady) {
      soundCloudWidgetRef.current?.setVolume(Math.round(volume * 100));
    }
  }, [buttonClickPlayer, currentSide, insertionSoundPlayer, soundCloudReady, trackAudioPlayer, vhsNoisePlayer, volume]);

  useEffect(() => {
    trackAudioPlayer.setPlaybackRate(isFastForwarding && !isJogging ? 4 : 1);
  }, [isFastForwarding, isJogging, trackAudioPlayer]);

  useEffect(() => () => {
    if (rewindTimer.current !== null) window.clearInterval(rewindTimer.current);
    if (progressSaveTimer.current !== null) window.clearTimeout(progressSaveTimer.current);
    if (insertionTimerRef.current !== null) window.clearTimeout(insertionTimerRef.current);
    trackAudioPlayer.stop();
    vhsNoisePlayer.stop();
    insertionSoundPlayer.stop();
    soundCloudWidgetRef.current?.pause();
    buttonClickPlayer.stop();
  }, [buttonClickPlayer, insertionSoundPlayer, trackAudioPlayer, vhsNoisePlayer]);

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

  const selectTrackFromList = (track: TrackListItem) => {
    if (track.cassetteId === activeCassetteId && track.side === activeSide) {
      setIsPlayerExpanded(true);
      return;
    }
    if (currentSide?.kind === 'audio') saveProgress(true);
    setActiveCassetteId(track.cassetteId);
    setActiveSide(track.side);
    setIsPlaying(false);
    setIsFastForwarding(false);
    setIsPlayerExpanded(true);
  };

  const startInsertion = (cassette: Cassette) => {
    if (currentSide?.kind === 'audio') saveProgress(true);
    playCassetteInsertSound();
    setActiveCassetteId(cassette.id);
    setActiveSide('A');
    setIsPlaying(false);
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

  const insertCassetteFromDrop = (cassette: Cassette) => {
    if (currentSide?.kind === 'audio') saveProgress(true);
    playCassetteInsertSound();
    setActiveCassetteId(cassette.id);
    setActiveSide('A');
    setSelectedCassetteId(null);
    setIsInserting(false);
    setIsPlaying(false);
    setIsPlayerExpanded(true);
    setSnappedTapeId(cassette.id);
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
    const hoveredCassette = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLButtonElement>('[data-cassette-id]');
    setDropTargetId(hoveredCassette?.dataset.cassetteId ?? null);
  };

  const handleShelfCassettePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = shelfPointerDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    shelfPointerDragRef.current = null;
    if (!drag.hasMoved) return;

    event.preventDefault();
    suppressNextCassetteClickRef.current = true;
    window.setTimeout(() => {
      suppressNextCassetteClickRef.current = false;
    }, 0);

    const targetCassetteId = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLButtonElement>('[data-cassette-id]')
      ?.dataset.cassetteId;
    const targetCassette = cassettes.find((cassette) => cassette.id === targetCassetteId);
    const sourceCassette = cassettes.find((cassette) => cassette.id === drag.cassetteId);

    setIsDragging(false);
    setDraggedTapeId(null);
    setDropTargetId(null);

    if (targetCassette && sourceCassette) {
      reorderCassettes(sourceCassette.id, targetCassette.id);
      return;
    }

    const playerBounds = playerRef.current?.getBoundingClientRect();
    if (
      sourceCassette &&
      playerBounds &&
      event.clientX >= playerBounds.left &&
      event.clientX <= playerBounds.right &&
      event.clientY >= playerBounds.top &&
      event.clientY <= playerBounds.bottom
    ) {
      insertCassetteFromDrop(sourceCassette);
    }
  };

  const handleShelfCassettePointerCancel = () => {
    shelfPointerDragRef.current = null;
    setIsDragging(false);
    setDraggedTapeId(null);
    setDropTargetId(null);
  };

  const handleCassettePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (isInserting) return;
    pointerStartY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleCassettePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerStartY.current === null || isInserting) return;
    setDragOffset(Math.max(0, event.clientY - pointerStartY.current));
  };

  const handleCassettePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerStartY.current === null) return;
    const distance = event.clientY - pointerStartY.current;
    pointerStartY.current = null;
    if (distance > 110 && selectedCassette) {
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

  const changeCassette = (direction: -1 | 1) => {
    if (!activeCassette) return;
    if (currentSide?.kind === 'audio') saveProgress(true);
    const index = cassettes.findIndex((cassette) => cassette.id === activeCassette.id);
    const next = cassettes[(index + direction + cassettes.length) % cassettes.length];
    setActiveCassetteId(next.id);
    setActiveSide('A');
    setIsPlaying(false);
  };

  const stopOrEject = () => {
    if (!activeCassette) return;
    if (currentSide?.kind === 'audio') {
      trackAudioPlayer.pause();
      saveProgress(true);
    }
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    setActiveCassetteId(null);
    setIsPlaying(false);
  };

  const flipSide = () => {
    if (!activeCassette) return;
    if (currentSide?.kind === 'audio') saveProgress(true);
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

  const saveProgress = (immediate = false) => {
    const audio = currentSide?.kind === 'audio' ? trackAudioPlayer : null;
    const widget = currentSide?.kind === 'soundcloud' ? soundCloudWidgetRef.current : null;
    if (!activeSideId || (!audio && !widget)) return;
    if (progressSaveTimer.current !== null) window.clearTimeout(progressSaveTimer.current);
    const key = activeSideId;
    const audioPosition = audio?.currentTime;
    const save = () => {
      if (audio) {
        void savePlaybackProgress(key, audioPosition ?? 0).catch(() => {
          setStorageError('Playback position could not be saved.');
        });
      } else {
        widget?.getPosition((position) => {
          void savePlaybackProgress(key, position / 1000).catch(() => {
            setStorageError('Playback position could not be saved.');
          });
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
    if (reelFaceRef.current) {
      const transform = window.getComputedStyle(reelFaceRef.current).transform;
      if (transform !== 'none') {
        const matrix = new DOMMatrixReadOnly(transform);
        platterAngleRef.current = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
        setPlatterAngle(platterAngleRef.current);
      }
    }
    audio?.pause();
    widget?.pause();
    if (vhsNoisePlayer.isReady) {
      void vhsNoisePlayer.play({ loop: true, restart: true }).catch(() => {
        setStorageError('VHS noise could not be played.');
      });
    }
    turntableDragRef.current = {
      pointerId: event.pointerId,
      lastAngle: turntableAngle(event),
      lastTrackTime: audio?.currentTime ?? playbackTime,
      wasPlaying: isPlaying,
    };
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
    drag.lastTrackTime = Math.max(
      0,
      Math.min(playbackDuration, drag.lastTrackTime + timeDelta),
    );
    if (audio) {
      void audio.seek(drag.lastTrackTime).catch(() => {
        setStorageError('The track could not be seeked.');
      });
    }
    else widget?.seekTo(drag.lastTrackTime * 1000);
    platterAngleRef.current += angleDelta * 180 / Math.PI;
    setPlatterAngle(platterAngleRef.current);
    setPlaybackTime(drag.lastTrackTime);
    saveProgress();
  };

  const endTurntableDrag = (event: PointerEvent<HTMLDivElement>, resumePlayback: boolean) => {
    const drag = turntableDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    turntableDragRef.current = null;
    setIsJogging(false);
    trackAudioPlayer.pause();
    soundCloudWidgetRef.current?.pause();
    vhsNoisePlayer.pause();
    void vhsNoisePlayer.seek(0);
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
    <div className="music-page min-h-screen bg-black text-neutral-100">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-sm tracking-[0.24em] text-white">CHRIS</Link>
          <SiteMenu />
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100svh-65px)] max-w-6xl flex-col px-6 pb-44 pt-8 md:pt-12">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-neutral-500">CHRIS / MUSIC</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-5xl">MUSIC</h1>
          </div>
          <Disc3 className="mb-1 h-7 w-7 text-neutral-500" />
        </div>

        <section aria-label="Cassette shelf" className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.28em] text-neutral-500">TAPE COLLECTION</p>
            <button type="button" onClick={createBlankCassette} className="text-[9px] uppercase tracking-[0.18em] text-neutral-500 transition hover:text-white">
              + Blank tape
            </button>
          </div>
          <div className="cassette-shelf-grid">
            {cassettes.map((cassette) => (
              <button
                key={cassette.id}
                type="button"
                aria-label={`Select ${cassette.title} cassette`}
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
                  setSelectedCassetteId(cassette.id);
                  setDragOffset(0);
                }}
                className={`cassette-shelf-tape group relative flex items-center border border-white/20 bg-gradient-to-br ${cassette.color} text-left shadow-[0_8px_18px_#000] transition duration-200 hover:-translate-y-1 hover:border-white/50 ${
                  activeCassetteId === cassette.id ? 'brightness-125' : 'brightness-90 hover:brightness-110'
                } ${dropTargetId === cassette.id ? 'cassette-drop-target' : ''} ${
                  snappedTapeId === cassette.id ? 'cassette-snap-in' : ''
                } ${draggedTapeId === cassette.id ? 'cassette-being-dragged' : ''}`}
              >
                <span className="cassette-shelf-tape-seam" />
                <span className="flex h-9 w-7 shrink-0 flex-col items-center justify-center gap-1 rounded-sm border border-white/25 bg-black/65">
                  <span className="h-2 w-2 rounded-full border border-white/60" />
                  <span className="h-2 w-2 rounded-full border border-white/60" />
                </span>
                <span className="cassette-shelf-label ml-2 min-w-0 flex-1">
                  <span className="block truncate text-[9px] uppercase tracking-[0.12em] text-white">{cassette.title}</span>
                  <span className="mt-1 block truncate text-[7px] uppercase tracking-[0.18em] text-white/50">
                    CHRIS · SIDE A {cassette.locked ? '· LOCKED' : ''}
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

        <div className="flex flex-1 items-center justify-center py-12 text-center">
          <div>
            <Radio className="mx-auto h-8 w-8 text-neutral-800" />
            <p className="mt-4 text-[10px] uppercase tracking-[0.28em] text-neutral-700">
              {activeCassette
                ? `${currentSideTitle} · SIDE ${activeSide} · ${isPlaying ? 'NOW PLAYING' : currentSide ? 'READY' : 'BLANK SIDE'}`
                : 'CHOOSE A CASSETTE'}
            </p>
          </div>
        </div>

        {storageError && (
          <p role="status" className="fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded border border-white/20 bg-[#111] px-4 py-2 text-center text-[10px] text-neutral-300">
            {storageError}
            <button type="button" onClick={() => setStorageError(null)} aria-label="Dismiss message" className="ml-3 text-white">×</button>
          </p>
        )}
      </main>

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
        {isDragging && (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[24px] border-2 border-dashed border-[#f28a36] bg-[#090909]/95 text-xs tracking-[0.2em] text-[#f28a36] shadow-2xl"
          >
            DROP TAPE TO INSERT
          </div>
        )}
        <section
          ref={playerRef}
          id="cassette-deck"
          aria-label="Cassette player"
          aria-hidden={!isPlayerExpanded}
          inert={!isPlayerExpanded}
          className={`tp7-inspired-deck relative mx-auto w-full max-w-[500px] overflow-hidden rounded-[8px] border border-[#f4f4f6] px-3 py-3 text-[#202124] shadow-[0_14px_28px_rgb(0_0_0_/_55%)] transition sm:px-5 sm:py-5 ${isDragging ? 'scale-[1.01]' : ''}`}
        >
          <div className="tp7-unit-header flex items-center justify-between border-b border-black/15 pb-2">
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
                  <span>TRACK LIST</span>
                  <span>{String(availableTracks.length).padStart(2, '0')}</span>
                </div>
                <div className="tp7-track-list-items">
                  {availableTracks.length > 0 ? availableTracks.map((track, index) => {
                    const isSelectedTrack = track.cassetteId === activeCassetteId && track.side === activeSide;
                    return (
                      <button
                        key={`${track.cassetteId}:${track.side}`}
                        type="button"
                        aria-pressed={isSelectedTrack}
                        onPointerDown={handleHardwareButtonPointerDown}
                        onKeyDown={handleHardwareButtonKeyDown}
                        onClick={() => selectTrackFromList(track)}
                        className={`tp7-track-item ${isSelectedTrack ? 'is-selected' : ''}`}
                      >
                        <span className="tp7-track-number">{String(index + 1).padStart(2, '0')}</span>
                        <span className="tp7-track-copy">
                          <span className="tp7-track-item-title">{track.title}</span>
                          <span className="tp7-track-item-detail">{track.detail}</span>
                        </span>
                        <span className="tp7-track-item-led" />
                      </button>
                    );
                  }) : (
                    <p className="tp7-track-list-empty">NO TRACKS</p>
                  )}
                </div>
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
                    background: `conic-gradient(from 0deg, #ff4a1c ${turntableProgress * 100}%, #999ba1 ${turntableProgress * 100}% 100%)`,
                  }}
                  className={`tp7-reel-face tp7-drive-platter relative flex aspect-square w-[184px] touch-none select-none items-center justify-center rounded-full p-[7px] outline-none sm:w-[204px] ${
                    canSeekTurntable ? 'cursor-grab focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4a1c] active:cursor-grabbing' : 'cursor-default'
                  } ${
                    activeCassette ? 'cassette-deck-snap' : ''
                  } ${isFlipping ? 'cassette-flip' : ''}`}
                >
                  <div
                    ref={reelFaceRef}
                    style={isJogging ? { transform: `rotate(${platterAngle}deg)` } : undefined}
                    className={`tp7-reel-face-inner pointer-events-none absolute inset-[7px] flex items-center justify-center overflow-hidden rounded-full border ${
                      isPlaying && !isJogging ? 'tape-reel-spinning' : ''
                    }`}
                  >
                    <span className="tp7-platter-groove absolute inset-[7px] rounded-full border" />
                    <span className="tp7-platter-groove absolute inset-[15px] rounded-full border" />
                    <span className="tp7-platter-groove absolute inset-[25px] rounded-full border" />
                    <span className="tp7-platter-index-mark tp7-platter-index-mark-left" />
                    <span className="tp7-platter-index-mark tp7-platter-index-mark-right" />
                    <div className="tp7-reel-hub relative flex h-16 w-16 items-center justify-center rounded-full border sm:h-[72px] sm:w-[72px]">
                      <span className="tp7-reel-hub-ring absolute rounded-full" />
                      <span className="tp7-reel-hub-label">
                        <span>CHRIS</span>
                        <span>MOTOR</span>
                      </span>
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
            <button type="button" aria-label={isPlaying ? 'Pause' : 'Play'} onPointerDown={handleHardwareButtonPointerDown} onKeyDown={handleHardwareButtonKeyDown} onClick={togglePlay} disabled={!currentSide || (currentSide.kind === 'audio' && !isAudioReady)} className={`cdj-control-button cdj-control-play ${isPlaying ? 'cdj-control-active' : ''}`}>
              <span className="cdj-control-label">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
              {isPlaying ? <Pause className="cdj-control-icon" /> : <Play className="cdj-control-icon fill-current" />}
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
              <Square className="cdj-control-icon fill-current" />
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
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 px-5 backdrop-blur-sm"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedCassette.title} cassette`}
            onClick={(event) => event.stopPropagation()}
            className="cassette-popup-in relative w-full max-w-sm text-center"
          >
            <button
              type="button"
              aria-label="Close cassette"
              onClick={() => setSelectedCassetteId(null)}
              disabled={isInserting}
              className="absolute -right-2 -top-12 rounded-full border border-white/15 p-2 text-neutral-400 transition hover:text-white disabled:opacity-0"
            >
              <X className="h-4 w-4" />
            </button>
            <div
              onPointerDown={handleCassettePointerDown}
              onPointerMove={handleCassettePointerMove}
              onPointerUp={handleCassettePointerUp}
              onPointerCancel={() => {
                pointerStartY.current = null;
                setDragOffset(0);
              }}
              onAnimationEnd={handleAnimationEnd}
              style={{ transform: `translateY(${dragOffset}px)` }}
              className={`selected-cassette relative mx-auto flex aspect-[1.55/1] w-full max-w-[330px] touch-none select-none items-center justify-center overflow-hidden rounded-2xl border border-white/30 bg-gradient-to-br ${selectedCassette.color} shadow-[0_30px_90px_#000] ${
                isInserting ? 'cassette-slide-to-player' : 'cursor-grab active:cursor-grabbing'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
              <div className="relative flex h-20 w-52 items-center justify-around rounded-lg border border-white/15 bg-black/75 shadow-inner sm:h-24 sm:w-60">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border-[6px] border-neutral-300/80 shadow-[inset_0_0_0_3px_#111] sm:h-16 sm:w-16">
                  <span className="h-4 w-4 rounded-full bg-black" />
                </span>
                <span className="h-10 w-12 rounded-sm border border-white/15 bg-white/10" />
                <span className="flex h-14 w-14 items-center justify-center rounded-full border-[6px] border-neutral-300/80 shadow-[inset_0_0_0_3px_#111] sm:h-16 sm:w-16">
                  <span className="h-4 w-4 rounded-full bg-black" />
                </span>
              </div>
              <p className="absolute bottom-3 left-5 right-5 truncate text-center text-[10px] uppercase tracking-[0.24em] text-white">
                {selectedCassette.title}
              </p>
            </div>
            <p className="mt-7 text-xs font-medium uppercase tracking-[0.22em] text-white">{selectedCassette.title}</p>
            <p className="mt-2 text-[9px] uppercase tracking-[0.2em] text-neutral-500">
              {isInserting ? 'Loading tape...' : 'Swipe down to insert'}
            </p>
            {!isInserting && (
              <button
                type="button"
                onClick={() => startInsertion(selectedCassette)}
                className="mt-5 rounded-full border border-white/20 px-5 py-2 text-[9px] uppercase tracking-[0.2em] text-neutral-300 transition hover:border-white/60 hover:text-white"
              >
                Slide into player
              </button>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
