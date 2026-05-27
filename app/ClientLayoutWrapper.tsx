// app/ClientLayoutWrapper.tsx
"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LoadingScreen from "./LoadingScreen";

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [waitingForTouch, setWaitingForTouch] = useState(false);
  const audioRef = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 過去にアクセスしたことがあるかフラグを確認
    const hasVisited = sessionStorage.getItem("hasVisitedInsert");
    
    if (!hasVisited) {
      // 初回訪問：タッチ待機状態に
      setIsFirstVisit(true);
      setWaitingForTouch(true);
      // 音声を準備・プリロード
      const audio = new Audio("/audio/startup.ogg");
      audio.volume = 0.5;
      audio.preload = "auto";
      // 音声データを事前に読み込む
      audio.load();
      audioRef[1](audio);
    } else {
      // 2回目以降：1秒後に自動でメニュー表示
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // タッチ時のハンドラー
  const handleTouch = () => {
    if (!waitingForTouch) return;
    
    setWaitingForTouch(false);
    
    // 音声を再生
    if (audioRef[0]) {
      audioRef[0].play().catch((error) => {
        console.log("再生エラー:", error);
      });
    }
    
    // 1秒後にメニューを表示
    setTimeout(() => {
      setIsLoading(false);
      sessionStorage.setItem("hasVisitedInsert", "true");
    }, 1000);
  };

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <LoadingScreen 
          key="loader" 
          isFirstVisit={isFirstVisit}
          onTouch={handleTouch}
          waitingForTouch={waitingForTouch}
        />
      ) : (
        <motion.div
          key="content"
          className="flex-1 flex flex-col"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

