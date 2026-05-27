// app/LoadingScreen.tsx（または components/LoadingScreen.tsx）
"use client";

import { motion } from "framer-motion";

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  // グリッチの激しいブレを再現するキーフレームアニメーション
  const glitchVariants = {
    animate: {
      x: [0, -3, 3, -1, 2, 0],
      y: [0, 1, -2, 2, -1, 0],
      skewX: [0, -5, 5, 0, 2, 0],
      filter: [
        "none",
        "drop-shadow(-2px 0 #ff0055) drop-shadow(2px 0 #00ffcc)",
        "drop-shadow(3px 0 #0000ff) drop-shadow(-3px 0 #ff0000)",
        "none"
      ],
      transition: {
        duration: 0.4,

        // 1.5秒後と2.2秒後に不定期にグリッチを発生させる
        delayTimes: [0, 0.1, 0.2, 0.4, 0.6, 1],
        repeat: Infinity,
        repeatDelay: 1.5
      }
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden select-none"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      onAnimationComplete={onComplete}
    >
      {/* 画面全体のサイバー感を出す薄いスキャンライン（走査線） */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />

      <div className="relative overflow-hidden p-8">
        {/* 背景に浮かぶ薄いグリッチノイズ（残像） */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-sm font-inter tracking-[0.4em] text-neutral-800 uppercase font-bold blur-[1px] opacity-30"
          variants={glitchVariants}
          animate="animate"
        >
          GANG CAT RECORDS
        </motion.div>

        {/* メインのテキスト（下から綺麗に浮かび上がった後にブレる） */}
        <motion.h1
          className="relative text-sm font-inter tracking-[0.4em] text-white uppercase text-center font-medium"
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.2,
          }}
        >
          {/* テキスト自体にも時間差でグリッチを適用 */}
          <motion.span
            className="inline-block"
            variants={glitchVariants}
            animate="animate"
          >
            GANG CAT RECORDS
          </motion.span>
        </motion.h1>
      </div>

      {/* 画面下のプログレスバーのような極細ライン（読み込み感を演出） */}
      <motion.div 
        className="absolute bottom-0 left-0 h-[1px] bg-neutral-700"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

