// app/LoadingScreen.tsx
"use client";

import { motion, Variants } from "framer-motion";
import { useEffect, useState } from "react";

interface RippleType {
  id: number;
  x: number;
  y: number;
}

interface LoadingScreenProps {
  isFirstVisit: boolean;
  onTouch: (e: React.MouseEvent | React.TouchEvent) => void;
  waitingForTouch: boolean;
  changeToWelcome?: boolean;
  isReloading?: boolean;
}

export default function LoadingScreen({ 
  isFirstVisit, 
  onTouch, 
  waitingForTouch,
  changeToWelcome = false,
  isReloading = false
}: LoadingScreenProps) {
  const [randomHex, setRandomHex] = useState("0x0000");
  const [ripples, setRipples] = useState<RippleType[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRandomHex(`0x${Math.floor(Math.random() * 65535).toString(16).toUpperCase()}`);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!waitingForTouch) return;

    let x: number, y: number;
    if ('touches' in e) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    } else {
      x = e.clientX;
      y = e.clientY;
    }

    const newRipple: RippleType = { id: Date.now(), x, y };
    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 1000);

    onTouch(e);
  };

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
        ease: "linear",
        times: [0, 0.1, 0.2, 0.4, 0.6, 1],
        repeat: Infinity,
        repeatDelay: 1.5
      }
    }
  };

  const mainText = isReloading 
    ? "RELOADING..." 
    : changeToWelcome 
      ? "WELCOME BACK" 
      : "GANG CAT RECORDS";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden select-none font-mono cursor-pointer"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      onClick={waitingForTouch ? handleInteraction : undefined}
      onTouchStart={waitingForTouch ? handleInteraction : undefined}
    >
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-30" />

      {ripples.map((ripple) => (
        <motion.div
          key={ripple.id}
          className="absolute pointer-events-none"
          style={{ left: ripple.x, top: ripple.y }}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* 💡 ここを修正しました：[0, 1, 2] を補完 */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-white/40"
              style={{ left: '50%', top: '50%', translateX: '-50%', translateY: '-50%' }}
              initial={{ width: 0, height: 0, opacity: 0.6 }}
              animate={{ width: 300 + i * 100, height: 300 + i * 100, opacity: 0 }}
              transition={{ duration: 0.8 + i * 0.2, ease: "easeOut", delay: i * 0.1 }}
            />
          ))}
        </motion.div>
      ))}

      <div className="absolute top-6 left-6 flex flex-col text-[10px] text-neutral-500 tracking-wider">
        <span className="text-neutral-400 font-bold">SYS_STATUS: RUNNING</span>
        <span>BOOT_SEQ: {isReloading ? "DATA_REFRESH" : isFirstVisit ? "INITIAL_LAUNCH" : "RE_INITIALIZED"}</span>
      </div>

      <div className="absolute top-6 right-6 flex items-center gap-2 text-[10px] text-neutral-500">
        <motion.span 
          animate={{ opacity: [1, 0.2, 1] }} 
          transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }} 
          className={`w-1.5 h-1.5 rounded-full ${isReloading ? "bg-amber-500 shadow-[0_0_8px_#f59e0b]" : "bg-emerald-500 shadow-[0_0_8px_#10b981]"}`}
        />
        <span>LINK: SECURE</span>
        <span className="text-neutral-400 font-bold ml-2">{randomHex}</span>
      </div>

      <div className="absolute bottom-8 left-6 text-[10px] text-neutral-500 tracking-widest flex gap-4">
        <span>FPS: 60.00</span>
        <span>STAGE: PORT_01</span>
      </div>

      <div className="absolute bottom-8 right-6 text-[10px] text-neutral-400 tracking-widest">
        <span>© GANG CAT RECORDS</span>
      </div>

      <div className="absolute w-[440px] h-[220px] max-w-[85vw] max-h-[30vh] pointer-events-none opacity-20 border border-neutral-800">
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white -mt-[2px] -ml-[2px]" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white -mt-[2px] -mr-[2px]" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white -mb-[2px] -ml-[2px]" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white -mb-[2px] -mr-[2px]" />
      </div>

      <div className="relative overflow-hidden p-8 z-10">
        <motion.div
          key={`bg-${mainText}`}
          className="absolute inset-0 flex items-center justify-center text-sm font-inter tracking-[0.4em] text-neutral-800 uppercase font-bold blur-[1px] opacity-20"
          variants={glitchVariants}
          animate="animate"
        >
          {mainText}
        </motion.div>

        <motion.h1
          className="relative text-sm font-inter tracking-[0.4em] text-white uppercase text-center font-medium"
          initial={{ y: 0, opacity: 1, scale: 1 }}
          key={`fg-${mainText}`}
        >
          <motion.span className="inline-block" variants={glitchVariants} animate="animate">
            {mainText}
          </motion.span>
        </motion.h1>
      </div>

      <motion.div 
        className="absolute left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neutral-700 to-transparent opacity-40"
        initial={{ top: "-5%" }}
        animate={{ top: "105%" }}
        transition={{ duration: 2.5, ease: "linear", repeat: Infinity }}
      />

      <motion.div 
        className="absolute bottom-0 left-0 h-[1px] bg-neutral-600"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
      />

      {isFirstVisit && waitingForTouch && !isReloading && (
        <motion.div
          className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
        >
          <span className="text-xs text-neutral-400 tracking-[0.3em] uppercase">
            Tap anywhere to start
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
