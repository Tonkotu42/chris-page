// components/LoadingScreen.tsx
"use client";

import { motion } from "framer-motion";

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      onAnimationComplete={onComplete}
    >
      <div className="overflow-hidden">
        <motion.h1
          className="font-inter text-sm tracking-[0.4em] text-white uppercase text-center"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 1.2,
            ease: [0.16, 1, 0.3, 1], // 洗練された一瞬で動くイージング
            delay: 0.2,
          }}
        >
          SONY STYLE PORTFOLIO
        </motion.h1>
      </div>
    </motion.div>
  );
}
