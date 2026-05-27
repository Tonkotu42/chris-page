// components/LoadingScreen.tsx（または app/LoadingScreen.tsx）
"use client";

import { motion } from "framer-motion";

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      // 画面全体が消える時間を1秒（1.0）にして滑らかに
      transition={{ duration: 1.0, ease: "easeInOut" }}
      onAnimationComplete={onComplete}
    >
      <div className="overflow-hidden">
        <motion.h1
          className="font-inter text-sm tracking-[0.4em] text-white uppercase text-center"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          // 演出をしっかり見せるための時間調整
          transition={{
            duration: 1.5,          // 1.5秒かけてじわっと文字が出る
            ease: [0.16, 1, 0.3, 1],
            delay: 0.3,            // 起動直後に少しだけ待ってから文字を出す
          }}
        >
          SONY STYLE PORTFOLIO
        </motion.h1>
      </div>
    </motion.div>
  );
}
