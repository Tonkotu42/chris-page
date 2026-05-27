// app/ClientLayoutWrapper.tsx
"use client";

import { useState, useEffect } from "react";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import LoadingScreen from "./LoadingScreen";

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [showWingsTransition, setShowWingsTransition] = useState(false);
  const [waitingForTouch, setWaitingForTouch] = useState(false);
  const audioRef = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 過去にアクセスしたことがあるかフラグを確認
    const hasVisited = sessionStorage.getItem("hasVisitedInsert");
    
    if (hasVisited) {
      setIsFirstVisit(false);
    }

    if (!hasVisited) {
      // 初回訪問：タッチ待機状態に
      setIsFirstVisit(true);
      setWaitingForTouch(true);
      // 音声を準備・プリロード（mp3 または ogg 実際のファイル名に合わせてください）
      const audio = new Audio("/audio/startup.mp3");
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
    
    // 1秒後に羽アニメーションを開始
    setTimeout(() => {
      setShowWingsTransition(true);
      // 羽アニメーション完了後（1.5秒後）にメニューを表示
      setTimeout(() => {
        setIsLoading(false);
        sessionStorage.setItem("hasVisitedInsert", "true");
      }, 1500);
    }, 1000);
  };

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <>
          <LoadingScreen 
            key="loader" 
            isFirstVisit={isFirstVisit}
            onTouch={handleTouch}
            waitingForTouch={waitingForTouch}
          />
          
          {/* 天使の羽トランジション（初回のみ） */}
          {showWingsTransition && (
            <>
              {/* 左の羽 */}
              <motion.div
                className="fixed inset-y-0 left-0 w-1/2 z-[60] overflow-hidden"
                initial={{ x: "-100%" }}
                animate={{ x: ["0%", "0%", "-100%"] }}
                transition={{ 
                  duration: 1.5, 
                  times: [0, 0.4, 1],
                  ease: "easeInOut" 
                }}
              >
                <svg
                  viewBox="0 0 400 800"
                  className="absolute right-0 h-full w-auto"
                  style={{ transform: "translateX(30%)" }}
                >
                  <defs>
                    <linearGradient id="wingGradientLeft" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0a0a0a" />
                      <stop offset="70%" stopColor="#1a1a1a" />
                      <stop offset="100%" stopColor="#2a2a2a" />
                    </linearGradient>
                    <filter id="featherGlow">
                      <feGaussianBlur stdDeviation="2" result="glow" />
                      <feMerge>
                        <feMergeNode in="glow" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  
                  <path
                    d="M400,0 L400,800 L350,800 Q300,700 280,600 Q250,500 200,400 Q150,300 100,250 Q50,200 0,180 Q50,160 100,150 Q150,140 200,100 Q250,60 300,30 Q350,10 400,0 Z"
                    fill="url(#wingGradientLeft)"
                  />
                  
                  {[...Array(12)].map((_, i) => (
                    <motion.path
                      key={i}
                      d={`M400,${50 + i * 60} Q${300 - i * 15},${100 + i * 50} ${100 - i * 8},${150 + i * 30}`}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="1"
                      fill="none"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                    />
                  ))}
                  
                  <path
                    d="M400,0 Q350,10 300,30 Q250,60 200,100 Q150,140 100,150 Q50,160 0,180"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="2"
                    fill="none"
                    filter="url(#featherGlow)"
                  />
                </svg>
              </motion.div>
              
              {/* 右の羽 */}
              <motion.div
                className="fixed inset-y-0 right-0 w-1/2 z-[60] overflow-hidden"
                initial={{ x: "100%" }}
                animate={{ x: ["0%", "0%", "100%"] }}
                transition={{ 
                  duration: 1.5, 
                  times: [0, 0.4, 1],
                  ease: "easeInOut" 
                }}
              >
                <svg
                  viewBox="0 0 400 800"
                  className="absolute left-0 h-full w-auto"
                  style={{ transform: "translateX(-30%) scaleX(-1)" }}
                >
                  <defs>
                    <linearGradient id="wingGradientRight" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0a0a0a" />
                      <stop offset="70%" stopColor="#1a1a1a" />
                      <stop offset="100%" stopColor="#2a2a2a" />
                    </linearGradient>
                  </defs>
                  
                  <path
                    d="M400,0 L400,800 L350,800 Q300,700 280,600 Q250,500 200,400 Q150,300 100,250 Q50,200 0,180 Q50,160 100,150 Q150,140 200,100 Q250,60 300,30 Q350,10 400,0 Z"
                    fill="url(#wingGradientRight)"
                  />
                  
                  {[...Array(12)].map((_, i) => (
                    <motion.path
                      key={i}
                      d={`M400,${50 + i * 60} Q${300 - i * 15},${100 + i * 50} ${100 - i * 8},${150 + i * 30}`}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="1"
                      fill="none"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                    />
                  ))}
                  
                  <path
                    d="M400,0 Q350,10 300,30 Q250,60 200,100 Q150,140 100,150 Q50,160 0,180"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="2"
                    fill="none"
                    filter="url(#featherGlow)"
                  />
                </svg>
              </motion.div>

              {/* 中央の光エフェクト */}
              <motion.div 
                className="fixed inset-0 bg-white z-[55] pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, times: [0, 0.4, 1], ease: "easeInOut" }}
              />
            </>
          )}
        </>
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

