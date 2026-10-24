import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Volume2, VolumeX, Music } from 'lucide-react';
import { startupAudio } from '../utils/audio';

interface OpeningIntroProps {
  onComplete: () => void;
}

export const OpeningIntro: React.FC<OpeningIntroProps> = ({ onComplete }) => {
  const [isMuted, setIsMuted] = useState<boolean>(startupAudio.getMuted());

  const handleEnter = () => {
    // ユーザー指定の起動音を再生してメイン画面へ入場
    startupAudio.playStartupSound();
    onComplete();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleEnter();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    startupAudio.setMuted(nextMuted);
  };

  return (
    <motion.div
      id="opening-intro-overlay"
      role="button"
      tabIndex={0}
      aria-label="Click to enter CHRIS Official Site"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 1.05,
        filter: 'blur(12px)',
        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
      }}
      onClick={handleEnter}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070709] text-white cursor-pointer select-none overflow-hidden outline-none"
    >
      {/* 右上サウンドコントロール */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleMute}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-neutral-300 hover:text-white transition-colors cursor-pointer"
          title={isMuted ? '起動音をONにする' : '起動音をミュートする'}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Muted</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span className="hidden sm:inline">Sound ON</span>
            </>
          )}
        </button>
      </div>

      {/* アンビエント発光エフェクト */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0.15, 0.35, 0.2], scale: [0.9, 1.15, 1] }}
        transition={{ duration: 2.2, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
        className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-neutral-800 via-red-950/30 to-neutral-700/20 blur-3xl pointer-events-none"
      />

      {/* 背景のグリッドライン */}
      <div
        className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"
        aria-hidden="true"
      />

      {/* メインコンテンツ */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg w-full">
        {/* サウンド波形イコライザー演出 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex items-center gap-1 mb-8 h-6"
        >
          {[40, 75, 100, 60, 90, 45, 80, 55, 95, 70, 50].map((height, i) => (
            <motion.span
              key={i}
              animate={{
                height: isMuted
                  ? '20%'
                  : [`${height * 0.3}%`, `${height}%`, `${height * 0.4}%`],
              }}
              transition={{
                duration: 0.8 + (i % 3) * 0.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.06,
              }}
              className={`w-0.5 rounded-full transition-colors ${
                isMuted ? 'bg-neutral-600' : 'bg-neutral-300'
              }`}
            />
          ))}
        </motion.div>

        {/* アーティスト名 ロゴアニメーション */}
        <motion.div
          initial={{ opacity: 0, y: 20, letterSpacing: '0.2em' }}
          animate={{ opacity: 1, y: 0, letterSpacing: '0.5em' }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <h1 className="text-4xl sm:text-6xl font-black uppercase text-white font-mono tracking-[0.5em] pl-[0.5em] drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
            CHRIS
          </h1>
        </motion.div>

        {/* サブタイトル / 最新曲タグ */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-4 flex flex-col items-center gap-2"
        >
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-neutral-400 font-mono">
            <span>Official Artist Site</span>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300 text-xs tracking-wider"
          >
            <Sparkles className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span>New Video: Afterlife</span>
          </motion.div>
        </motion.div>

        {/* クリック待機ボタン & ガイド */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-10 flex flex-col items-center gap-3"
        >
          <div
            id="enter-site-button"
            className="group relative inline-flex items-center gap-2.5 px-7 py-3 rounded-full border border-neutral-600 bg-neutral-900/90 hover:bg-neutral-800 hover:border-neutral-400 text-white transition-all duration-300 shadow-xl shadow-black/80 hover:scale-105 cursor-pointer"
          >
            <span className="text-xs font-mono font-bold tracking-[0.25em] uppercase pl-[0.25em]">
              CLICK TO START
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono tracking-widest uppercase">
            {!isMuted && <Music className="w-3 h-3 text-red-400 animate-pulse" />}
            <motion.span
              id="opening-click-to-start-guide"
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              CLICK TO START
            </motion.span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
