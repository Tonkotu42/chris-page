import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent, PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Disc3,
  FastForward,
  LockKeyhole,
  Pause,
  Play,
  Radio,
  Rewind,
  SkipBack,
  SkipForward,
  Square,
  UnlockKeyhole,
  Upload,
  X,
} from 'lucide-react';
import { SiteMenu } from '../components/SiteMenu';
import {
  loadCassettes,
  loadPlaybackProgress,
  saveCassette,
  savePlaybackProgress,
} from '../lib/musicStorage';
import type { Cassette, CassetteSide } from '../lib/musicStorage';

type SideName = 'A' | 'B';

const initialCassettes: Cassette[] = [
  {
    id: 'afterlife',
    title: 'Afterlife',
    sideATitle: 'Afterlife',
    sideBTitle: 'SIDE B',
    sideA: { kind: 'audio', src: '/music/afterlife.mp3', fileName: 'afterlife.mp3' },
    sideB: null,
    color: 'from-[#a3a3a3] via-[#33384a] to-[#090a10]',
    locked: true,
  },
  {
    id: 'done-with-u',
    title: 'Done With U',
    sideATitle: 'Done With U',
    sideBTitle: 'SIDE B',
    sideA: { kind: 'audio', src: '/music/done-with-u.mp3', fileName: 'd w you.mp3' },
    sideB: null,
    color: 'from-[#b2a1c9] via-[#423448] to-[#090a10]',
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

export default function MusicPage() {
  const [cassettes, setCassettes] = useState(initialCassettes);
  const [activeCassetteId, setActiveCassetteId] = useState<string | null>(null);
  const [selectedCassetteId, setSelectedCassetteId] = useState<string | null>(null);
  const [activeSide, setActiveSide] = useState<SideName>('A');
  const [isPlaying, setIsPlaying] = useState(false);
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
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const pointerStartY = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const turntablePointerId = useRef<number | null>(null);
  const videoRef = useRef<HTMLIFrameElement>(null);
  const rewindTimer = useRef<number | null>(null);
  const recordInputRef = useRef<HTMLInputElement>(null);
  const newTapeInputRef = useRef<HTMLInputElement>(null);
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
  const activeSideId = activeCassette ? sideKey(activeCassette.id, activeSide) : null;

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
    if (currentSide?.kind !== 'audio') {
      setAudioUrl(null);
      return;
    }
    if ('src' in currentSide) {
      setAudioUrl(currentSide.src);
      return;
    }

    const url = URL.createObjectURL(currentSide.blob);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [activeSideId, currentSide]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl || !activeSideId) return;
    let cancelled = false;
    const restorePosition = async () => {
      try {
        const seconds = await loadPlaybackProgress(activeSideId);
        if (!cancelled && seconds > 0) {
          audio.currentTime = Math.min(seconds, Number.isFinite(audio.duration) ? audio.duration : seconds);
        }
        if (!cancelled && isPlaying) await audio.play();
      } catch {
        if (!cancelled) setStorageError('Playback position could not be restored.');
      }
    };
    void restorePosition();
    return () => {
      cancelled = true;
    };
  }, [activeSideId, audioUrl]);

  useEffect(() => {
    if (currentSide?.kind !== 'audio' || !audioRef.current || !audioUrl) return;
    if (isPlaying) {
      void audioRef.current.play().catch(() => {
        setIsPlaying(false);
        setStorageError('This audio file could not be played by the browser.');
      });
    } else {
      audioRef.current.pause();
    }
  }, [audioUrl, currentSide, isPlaying]);

  useEffect(() => {
    if (currentSide?.kind !== 'video') return;
    sendVideoCommand('setPlaybackRate', [isFastForwarding ? 2 : 1]);
  }, [currentSide, isFastForwarding]);

  useEffect(() => {
    if (currentSide?.kind !== 'video') return;
    sendVideoCommand(isPlaying ? 'playVideo' : 'pauseVideo');
  }, [currentSide, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = isFastForwarding ? 4 : 1;
  }, [isFastForwarding]);

  useEffect(() => () => {
    if (rewindTimer.current !== null) window.clearInterval(rewindTimer.current);
    if (progressSaveTimer.current !== null) window.clearTimeout(progressSaveTimer.current);
    if (insertionTimerRef.current !== null) window.clearTimeout(insertionTimerRef.current);
  }, []);

  const persistCassette = (cassette: Cassette) => {
    setCassettes((current) => current.map((item) => item.id === cassette.id ? cassette : item));
    void saveCassette(cassette).catch(() => {
      setStorageError('Cassette changes could not be saved. Check browser storage availability.');
    });
  };

  const startInsertion = (cassette: Cassette) => {
    setActiveCassetteId(cassette.id);
    setActiveSide('A');
    setIsPlaying(cassette.sideA !== null);
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
    setActiveCassetteId(cassette.id);
    setActiveSide('A');
    setSelectedCassetteId(null);
    setIsInserting(false);
    setIsPlaying(cassette.sideA !== null);
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
    setIsPlaying((playing) => !playing);
  };

  const changeCassette = (direction: -1 | 1) => {
    if (!activeCassette) return;
    const index = cassettes.findIndex((cassette) => cassette.id === activeCassette.id);
    const next = cassettes[(index + direction + cassettes.length) % cassettes.length];
    setActiveCassetteId(next.id);
    setActiveSide('A');
    setIsPlaying(true);
  };

  const stopOrEject = () => {
    if (!activeCassette) return;
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    setActiveCassetteId(null);
    setIsPlaying(false);
  };

  const flipSide = () => {
    if (!activeCassette) return;
    setIsPlaying(false);
    setActiveSide((side) => side === 'A' ? 'B' : 'A');
    setIsFlipping(true);
  };

  const handleAudioUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    const side: CassetteSide = { kind: 'audio', blob: file, fileName: file.name };

    if (!activeCassette) {
      const title = file.name.replace(/\.[^.]+$/, '') || 'Untitled Tape';
      const cassette: Cassette = {
        id: `tape-${crypto.randomUUID()}`,
        title,
        sideATitle: title,
        sideBTitle: 'SIDE B',
        sideA: side,
        sideB: null,
        color: tapeColors[cassettes.length % tapeColors.length],
        locked: false,
      };
      setCassettes((current) => [...current, cassette]);
      void saveCassette(cassette).catch(() => {
        setStorageError('The uploaded tape could not be saved.');
      });
      setActiveCassetteId(cassette.id);
      setActiveSide('A');
      setIsPlaying(true);
      return;
    }

    if (activeCassette.locked) {
      setStorageError('Unlock this cassette before recording onto it.');
      return;
    }
    const updated = activeSide === 'A'
      ? { ...activeCassette, sideA: side, sideATitle: file.name.replace(/\.[^.]+$/, '') || 'SIDE A' }
      : { ...activeCassette, sideB: side, sideBTitle: file.name.replace(/\.[^.]+$/, '') || 'SIDE B' };
    persistCassette(updated);
    setIsPlaying(true);
  };

  const handleNewTapeUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    const title = file.name.replace(/\.[^.]+$/, '') || 'Untitled Tape';
    const cassette: Cassette = {
      id: `tape-${crypto.randomUUID()}`,
      title,
      sideATitle: title,
      sideBTitle: 'SIDE B',
      sideA: { kind: 'audio', blob: file, fileName: file.name },
      sideB: null,
      color: tapeColors[cassettes.length % tapeColors.length],
      locked: false,
    };
    setCassettes((current) => [...current, cassette]);
    void saveCassette(cassette).catch(() => {
      setStorageError('The uploaded tape could not be saved.');
    });
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
    if (currentSide?.kind === 'audio' && audioRef.current) {
      setIsPlaying(false);
      rewindTimer.current = window.setInterval(() => {
        if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 2);
      }, 160);
    } else if (currentSide?.kind === 'video') {
      sendVideoCommand('seekTo', [0, true]);
    }
  };

  const endRewind = () => {
    if (rewindTimer.current !== null) {
      window.clearInterval(rewindTimer.current);
      rewindTimer.current = null;
    }
  };

  const saveProgress = (immediate = false) => {
    if (!activeSideId || !audioRef.current) return;
    if (progressSaveTimer.current !== null) window.clearTimeout(progressSaveTimer.current);
    const key = activeSideId;
    const seconds = audioRef.current.currentTime;
    const save = () => {
      void savePlaybackProgress(key, seconds).catch(() => {
        setStorageError('Playback position could not be saved.');
      });
    };
    if (immediate) {
      save();
    } else {
      progressSaveTimer.current = window.setTimeout(save, 1000);
    }
  };

  const seekTurntable = (event: PointerEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const angle = (Math.atan2(
      event.clientY - bounds.top - bounds.height / 2,
      event.clientX - bounds.left - bounds.width / 2,
    ) * 180 / Math.PI + 450) % 360;
    const seconds = angle / 360 * audio.duration;
    audio.currentTime = seconds;
    setPlaybackTime(seconds);
  };

  const handleTurntableKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    let seconds: number | null = null;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') seconds = audio.currentTime - 5;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') seconds = audio.currentTime + 5;
    if (event.key === 'Home') seconds = 0;
    if (event.key === 'End') seconds = audio.duration;
    if (seconds === null) return;
    event.preventDefault();
    audio.currentTime = Math.max(0, Math.min(audio.duration, seconds));
    setPlaybackTime(audio.currentTime);
    saveProgress(true);
  };

  const turntableProgress = playbackDuration > 0
    ? Math.min(1, playbackTime / playbackDuration)
    : 0;
  const canSeekTurntable = currentSide?.kind === 'audio' && playbackDuration > 0;
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
            <div className="flex items-center gap-4">
              <button type="button" onClick={createBlankCassette} className="text-[9px] uppercase tracking-[0.18em] text-neutral-500 transition hover:text-white">
                + Blank tape
              </button>
              <label className="flex cursor-pointer items-center gap-1.5 text-[9px] uppercase tracking-[0.18em] text-neutral-500 transition hover:text-white">
                <Upload className="h-3 w-3" />
                Add audio tape
                <input
                  ref={newTapeInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleNewTapeUpload}
                  className="sr-only"
                />
              </label>
            </div>
          </div>
          <div className="flex min-h-[86px] items-end justify-center gap-2 overflow-x-auto border-b border-white/20 px-2 pb-2 sm:justify-start sm:gap-3">
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
                className={`group relative flex h-[68px] w-[116px] shrink-0 items-center rounded-t-md border border-white/20 bg-gradient-to-br ${cassette.color} px-2 text-left shadow-[0_8px_18px_#000] transition duration-200 hover:-translate-y-1 hover:border-white/50 ${
                  activeCassetteId === cassette.id ? 'brightness-125' : 'brightness-90 hover:brightness-110'
                } ${dropTargetId === cassette.id ? 'cassette-drop-target' : ''} ${
                  snappedTapeId === cassette.id ? 'cassette-snap-in' : ''
                } ${draggedTapeId === cassette.id ? 'cassette-being-dragged' : ''}`}
              >
                <span className="absolute inset-x-1 top-1 h-1 rounded-full bg-white/25" />
                <span className="mr-2 flex h-10 w-6 flex-col items-center justify-center gap-1 rounded-sm border border-white/25 bg-black/55">
                  <span className="h-2 w-2 rounded-full border border-white/60" />
                  <span className="h-2 w-2 rounded-full border border-white/60" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[9px] uppercase tracking-[0.12em] text-white">{cassette.title}</span>
                  <span className="mt-1 block text-[7px] uppercase tracking-[0.18em] text-white/50">
                    CHRIS · VHS {cassette.locked ? '· LOCKED' : ''}
                  </span>
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

      <div
        className="fixed inset-x-0 bottom-0 z-30 px-2 pb-2 sm:px-6 sm:pb-4"
      >
        {isDragging && (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[24px] border-2 border-dashed border-[#f28a36] bg-[#090909]/95 text-xs tracking-[0.2em] text-[#f28a36] shadow-2xl"
          >
            DROP TAPE TO INSERT
          </div>
        )}
        <section
          ref={playerRef}
          aria-label="Cassette player"
          className={`tp7-inspired-deck relative mx-auto w-full max-w-[300px] overflow-hidden rounded-[4px] border border-white/15 px-3 py-3 text-neutral-100 shadow-[0_22px_80px_#000,0_2px_8px_rgb(255_255_255_/_0.06)] transition sm:rounded-[5px] sm:px-4 sm:py-4 ${isDragging ? 'scale-[1.01]' : ''}`}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#f28a36] shadow-[0_0_0_3px_rgb(242_138_54_/_0.12),0_0_10px_rgb(242_138_54_/_0.65)]" />
              <span className="text-[8px] font-semibold uppercase tracking-[0.28em] text-neutral-400">CHRIS / TAPE RECORDER</span>
            </div>
            <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-neutral-500">
              {activeCassette ? `SIDE ${activeSide} · ${isPlaying ? 'PLAY' : 'STOP'}` : 'READY'}
            </span>
          </div>

          <div className="mx-auto flex w-full max-w-[280px] flex-col items-center py-2 sm:max-w-[320px]">
            <div
              role="slider"
              aria-label="Track position"
              aria-valuemin={0}
              aria-valuemax={Math.floor(playbackDuration)}
              aria-valuenow={Math.floor(playbackTime)}
              aria-valuetext={`${formattedPlaybackTime(playbackTime)} of ${formattedPlaybackTime(playbackDuration)}`}
              aria-disabled={!canSeekTurntable}
              tabIndex={canSeekTurntable ? 0 : -1}
              onKeyDown={handleTurntableKeyDown}
              onPointerDown={(event) => {
                if (!canSeekTurntable || !event.isPrimary || event.button !== 0) return;
                event.preventDefault();
                turntablePointerId.current = event.pointerId;
                event.currentTarget.setPointerCapture(event.pointerId);
                seekTurntable(event);
              }}
              onPointerMove={(event) => {
                if (turntablePointerId.current === event.pointerId) seekTurntable(event);
              }}
              onPointerUp={(event) => {
                if (turntablePointerId.current !== event.pointerId) return;
                seekTurntable(event);
                turntablePointerId.current = null;
                saveProgress(true);
              }}
              onPointerCancel={() => {
                turntablePointerId.current = null;
                saveProgress(true);
              }}
              onAnimationEnd={(event) => {
                if (event.animationName === 'cassette-flip') setIsFlipping(false);
              }}
              style={{
                background: `conic-gradient(from 0deg, #f28a36 ${turntableProgress * 100}%, rgb(255 255 255 / 14%) ${turntableProgress * 100}% 100%)`,
              }}
              className={`tp7-reel-face relative flex aspect-square w-[168px] touch-none select-none items-center justify-center rounded-full p-[3px] outline-none sm:w-[196px] ${
                canSeekTurntable ? 'cursor-crosshair focus-visible:ring-2 focus-visible:ring-[#f28a36]/70' : 'cursor-default'
              } ${
                activeCassette ? 'cassette-deck-snap' : ''
              } ${isFlipping ? 'cassette-flip' : ''}`}
            >
              <div className={`tp7-reel-face-inner pointer-events-none absolute inset-[3px] flex items-center justify-center overflow-hidden rounded-full border border-white/15 bg-[radial-gradient(circle_at_36%_28%,#333937,#171b19_58%,#0a0c0b)] shadow-[inset_0_2px_5px_rgb(255_255_255_/_0.12),inset_0_-8px_16px_rgb(0_0_0_/_0.8),0_3px_8px_#000] ${
                isPlaying ? 'tape-reel-spinning' : ''
              }`}>
                <span className="absolute inset-[7px] rounded-full border border-white/[0.08]" />
                <span className="absolute inset-[15px] rounded-full border border-white/[0.06]" />
                <span className="absolute inset-[25px] rounded-full border border-dashed border-white/[0.07]" />
                <div className="tp7-reel-hub relative flex h-12 w-12 items-center justify-center rounded-full border border-[#5b625e] bg-[radial-gradient(circle_at_36%_30%,#545b57,#282e2b_62%,#111412)] shadow-[inset_0_1px_3px_rgb(255_255_255_/_0.2),0_2px_6px_#000] sm:h-14 sm:w-14">
                  <span className="absolute inset-[6px] rounded-full border border-white/10" />
                  <span className="h-2 w-2 rounded-full bg-[#f28a36] shadow-[0_0_8px_rgb(242_138_54_/_0.55)]" />
                </div>
              </div>
              <span
                className="pointer-events-none absolute inset-0 z-10"
                style={{ transform: `rotate(${turntableProgress * 360}deg)` }}
              >
                <span className="absolute left-1/2 top-[4px] h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-[#ffd0a5] bg-[#f28a36] shadow-[0_0_8px_#f28a36]" />
              </span>
            </div>

            <div className="flex w-[168px] justify-between px-1 pt-1 font-mono text-[7px] tabular-nums tracking-[0.12em] text-neutral-500 sm:w-[196px]">
              <span>{formattedPlaybackTime(playbackTime)}</span>
              <span>{formattedPlaybackTime(playbackDuration)}</span>
            </div>

            <div className="mt-2 flex w-full items-center gap-2 border-y border-white/10 py-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isPlaying ? 'bg-[#f28a36]' : 'bg-neutral-700'}`} />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[7px] uppercase tracking-[0.2em] text-neutral-500">SIDE {activeSide} / {isPlaying ? 'PLAYING' : 'STANDBY'}</p>
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
                      className="mt-1 w-full border-b border-white/30 bg-transparent text-xs text-white outline-none"
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
                      className="mt-1 block max-w-full truncate text-left text-xs font-semibold text-neutral-100 disabled:cursor-default sm:text-sm"
                      title="Rename this side"
                    >
                      {activeCassette ? currentSideTitle : 'No cassette loaded'}
                    </button>
                  )}
                  <p className="mt-0.5 truncate font-mono text-[7px] uppercase tracking-[0.1em] text-neutral-600">
                    {currentSide?.kind === 'audio'
                      ? currentSide.fileName
                      : currentSide?.kind === 'video'
                        ? isPlaying ? 'Playing video' : 'Paused'
                        : activeCassette ? 'Blank side · record a file' : 'Drop a tape to begin'}
                  </p>
                </div>
              </div>
              {currentSide?.kind === 'video' && (
                <div className="w-[88px] shrink-0 overflow-hidden rounded border border-white/10 bg-black">
                  <iframe
                    ref={videoRef}
                    key={`${activeCassetteId}:${activeSide}`}
                    title={`${currentSideTitle} YouTube player`}
                    src={`https://www.youtube-nocookie.com/embed/${currentSide.youtubeId}?autoplay=1&enablejsapi=1&rel=0&origin=${encodeURIComponent(window.location.origin)}`}
                    onLoad={() => {
                      sendVideoCommand(isPlaying ? 'playVideo' : 'pauseVideo');
                      sendVideoCommand('setPlaybackRate', [isFastForwarding ? 2 : 1]);
                    }}
                    className="aspect-video w-full"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 border-t border-white/10 pt-2 sm:gap-2.5">
            <button type="button" aria-label="Rewind" title="Hold to rewind" disabled={!currentSide} onPointerDown={beginRewind} onPointerUp={endRewind} onPointerCancel={endRewind} onPointerLeave={endRewind} className="tp7-key">
              <Rewind className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>
            <button type="button" aria-label="Previous cassette" onClick={() => changeCassette(-1)} disabled={!activeCassette} className="tp7-key">
              <SkipBack className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>
            <button type="button" aria-label={isPlaying ? 'Pause' : 'Play'} onClick={togglePlay} disabled={!currentSide} className="tp7-key tp7-play-key">
              {isPlaying ? <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Play className="h-3.5 w-3.5 fill-current sm:h-4 sm:w-4" />}
            </button>
            <button type="button" aria-label="Next cassette" onClick={() => changeCassette(1)} disabled={!activeCassette} className="tp7-key">
              <SkipForward className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>
            <button type="button" aria-label="Fast forward" title="Hold to fast-forward" disabled={!currentSide} onPointerDown={() => setIsFastForwarding(true)} onPointerUp={() => setIsFastForwarding(false)} onPointerCancel={() => setIsFastForwarding(false)} onPointerLeave={() => setIsFastForwarding(false)} className={`tp7-key ${isFastForwarding ? 'tp7-key-active' : ''}`}>
              <FastForward className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>
            <button type="button" aria-label={isPlaying ? 'Stop' : 'Eject'} title={isPlaying ? 'Stop' : 'Eject cassette'} onClick={stopOrEject} disabled={!activeCassette} className="tp7-key">
              <Square className="h-3 w-3 fill-current sm:h-3.5 sm:w-3.5" />
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
            <div className="flex items-center gap-3">
              <button type="button" onClick={flipSide} disabled={!activeCassette} className="tp7-label-key">
                FLIP · SIDE {activeSide === 'A' ? 'B' : 'A'}
              </button>
              <button type="button" onClick={() => activeCassette && persistCassette({ ...activeCassette, locked: !activeCassette.locked })} disabled={!activeCassette} className="tp7-label-key flex items-center gap-1">
                {activeCassette?.locked ? <LockKeyhole className="h-3 w-3" /> : <UnlockKeyhole className="h-3 w-3" />}
                {activeCassette?.locked ? 'LOCKED' : 'UNLOCKED'}
              </button>
            </div>
            <button type="button" onClick={() => recordInputRef.current?.click()} disabled={!activeCassette || activeCassette.locked} className="tp7-label-key flex items-center gap-1">
              <Upload className="h-3 w-3" />
              REC · SIDE {activeSide}
            </button>
            <input ref={recordInputRef} type="file" accept="audio/*" onChange={handleAudioUpload} className="sr-only" />
          </div>

          {currentSide?.kind === 'audio' && (
            <audio
              ref={audioRef}
              src={audioUrl ?? undefined}
              onLoadedMetadata={(event) => {
                const { duration } = event.currentTarget;
                setPlaybackDuration(Number.isFinite(duration) ? duration : 0);
                setPlaybackTime(event.currentTarget.currentTime);
              }}
              onDurationChange={(event) => {
                const { duration } = event.currentTarget;
                setPlaybackDuration(Number.isFinite(duration) ? duration : 0);
              }}
              onTimeUpdate={(event) => {
                setPlaybackTime(event.currentTarget.currentTime);
                saveProgress();
              }}
              onSeeked={() => saveProgress(true)}
              onPause={() => saveProgress(true)}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}
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
              {isInserting ? 'Loading tape...' : 'Swipe down to play'}
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
