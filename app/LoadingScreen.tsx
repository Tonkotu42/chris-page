// app/LoadingScreen.tsx
"use client";

// 💡 「Variants」という型をインポートに追加しました
import { motion, Variants } from "framer-motion";
import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [randomHex, setRandomHex] = useState("0x0000");

  useEffect(() => {
    const interval = setInterval(() => {
      setRandomHex(`0x${Math.floor(Math.random() * 65535).toString(16).toUpperCase()}`);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // 💡 型を「: Variants」と指定し、easeの配列エラーを解消しました
  const glitchVariants: Variants = {
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
        // イージングを固定値に修正して型エラーを完全に解消
        ease: "linear",
        times: [0, 0.1, 0.2, 0.4, 0.6, 1],
        repeat: Infinity,
        repeatDelay: 1.5
      }
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden select-none font-mono"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      {/* 画面全体のスキャンライン */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-30" />

      {/* 画面の4隅を使った機材風UI */}
      <div className="absolute top-6 left-6 flex flex-col text-[10px] text-neutral-500 tracking-wider">
        <span className="text-neutral-400 font-bold">SYS_STATUS: RUNNING</span>
        <span>BOOT_SEQ: INITIALIZED</span>
      </div>

      <div className="absolute top-6 right-6 flex items-center gap-2 text-[10px] text-neutral-500">
        <motion.span 
          animate={{ opacity: [1, 0.2, 1] }} 
          transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }} 
          className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"
        />
        <span>LINK: SECURE</span>
        <span className="text-neutral-400 font-bold ml-2">{randomHex}</span>
      </div>

      <div className="absolute bottom-8 left-6 text-[10px] text-neutral-500 tracking-widest flex gap-4">
        <span>FPS: 60.00</span>
        <span>STAGE: PORT_01</span>
      </div>

      <div className="absolute bottom-8 right-6 text-[10px] text-neutral-400 tracking-widest">
        <span>© SONY STYLE</span>
      </div>

      {/* 中央のカメラ風照準フレーム */}
      <div className="absolute w-[440px] h-[220px] max-w-[85vw] max-h-[30vh] pointer-events-none opacity-20 border border-neutral-800">
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white -mt-[2px] -ml-[2px]" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white -mt-[2px] -mr-[2px]" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white -mb-[2px] -ml-[2px]" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white -mb-[2px] -mr-[2px]" />
      </div>

      {/* 中央のメインロゴ */}
      <div className="relative overflow-hidden p-8 z-10">
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-sm font-inter tracking-[0.4em] text-neutral-800 uppercase font-bold blur-[1px] opacity-20"
          variants={glitchVariants}
          animate="animate"
        >
          SONY STYLE PORTFOLIO
        </motion.div>

        <motion.h1
          className="relative text-sm font-inter tracking-[0.4em] text-white uppercase text-center font-medium"
          initial={{ y: 15, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          <motion.span className="inline-block" variants={glitchVariants} animate="animate">
            SONY STYLE PORTFOLIO
          </motion.span>
        </motion.h1>
      </div>

      {/* スキャンレーザー */}
      <motion.div 
        className="absolute left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neutral-700 to-transparent opacity-40"
        initial={{ top: "-5%" }}
        animate={{ top: "105%" }}
        transition={{ duration: 2.5, ease: "linear", repeat: Infinity }}
      />

      {/* プログレスライン */}
      <motion.div 
        className="absolute bottom-0 left-0 h-[1px] bg-neutral-600"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
      />
    </motion.div>
  );
}
