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
                    {/* 進化したサイバー・エンジェルウィング・トランジション */}
          {showWingsTransition && (
            <>
              {/* 左の多層の羽 */}
              <div className="fixed inset-y-0 left-0 w-1/2 z-[60] overflow-hidden pointer-events-none">
                {[...Array(3)].map((_, layerIndex) => (
                  <motion.svg
                    key={`wing-l-${layerIndex}`}
                    viewBox="0 0 450 900"
                    className="absolute right-0 h-full w-auto filter drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    style={{ 
                      transform: "translateX(25%)",
                      mixBlendMode: layerIndex === 2 ? "screen" : "normal"
                    }}
                    initial={{ x: "-120%", rotate: -15, scale: 0.8 }}
                    animate={{ 
                      x: ["0%", "0%", "-150%"],
                      rotate: [0, -5, -25],
                      scale: [1, 1.05, 0.9]
                    }}
                    transition={{ 
                      duration: 1.8, 
                      times: [0, 0.45, 1],
                      ease: [0.25, 1, 0.5, 1],
                      delay: layerIndex * 0.08 // 時間差で重なって展開
                    }}
                  >
                    <defs>
                      <linearGradient id={`wingGradL-${layerIndex}`} x1="0%" y1="50%" x2="100%" y2="50%">
                        <stop offset="0%" stopColor="#030303" />
                        <stop offset="60%" stopColor={layerIndex === 2 ? "#111" : "#0a0a0a"} />
                        <stop offset="95%" stopColor={layerIndex === 2 ? "#10b981" : layerIndex === 1 ? "#ff0055" : "#262626"} />
                        <stop offset="100%" stopColor="#ffffff" />
                      </linearGradient>
                      <filter id="cyberGlowL">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    
                    {/* 精細化したアブストラクトな羽のパス */}
                    <path
                      d="M450,0 C420,50 310,80 260,140 C200,210 120,320 60,420 C10,500 0,560 30,590 C70,630 180,560 250,520 C320,480 390,400 450,320 Z
                         M450,250 C400,320 280,390 200,470 C130,540 70,660 40,760 C20,820 30,850 60,850 C110,850 220,720 310,610 C380,520 430,420 450,350 Z"
                      fill={`url(#wingGradL-${layerIndex})`}
                      opacity={layerIndex === 2 ? 0.9 : 1}
                    />
                    
                    {/* サイバーグリッド・フェザーライン */}
                    {[...Array(18)].map((_, i) => (
                      <motion.path
                        key={i}
                        d={`M450,${30 + i * 45} Q${320 - i * 12},${120 + i * 35} ${50 + i * 15},${200 + i * 25}`}
                        stroke={layerIndex === 2 ? "rgba(16,185,121,0.4)" : "rgba(255,255,255,0.06)"}
                        strokeWidth={layerIndex === 2 ? "1.5" : "1"}
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: [0, 1, 1], opacity: [0, 0.8, 0] }}
                        transition={{ duration: 1.4, times: [0, 0.4, 1], delay: layerIndex * 0.1 + i * 0.02 }}
                      />
                    ))}
                  </motion.svg>
                ))}
              </div>
              
              {/* 右の多層の羽 */}
              <div className="fixed inset-y-0 right-0 w-1/2 z-[60] overflow-hidden pointer-events-none">
                {[...Array(3)].map((_, layerIndex) => (
                  <motion.svg
                    key={`wing-r-${layerIndex}`}
                    viewBox="0 0 450 900"
                    className="absolute left-0 h-full w-auto filter drop-shadow-[0_0_15px_rgba(255,0,85,0.2)]"
                    style={{ 
                      transform: "translateX(-25%) scaleX(-1)",
                      mixBlendMode: layerIndex === 2 ? "screen" : "normal"
                    }}
                    initial={{ x: "120%", rotate: 15, scale: 0.8 }}
                    animate={{ 
                      x: ["0%", "0%", "150%"],
                      rotate: [0, 5, 25],
                      scale: [1, 1.05, 0.9]
                    }}
                    transition={{ 
                      duration: 1.8, 
                      times: [0, 0.45, 1],
                      ease: [0.25, 1, 0.5, 1],
                      delay: layerIndex * 0.08
                    }}
                  >
                    <defs>
                      <linearGradient id={`wingGradR-${layerIndex}`} x1="0%" y1="50%" x2="100%" y2="50%">
                        <stop offset="0%" stopColor="#030303" />
                        <stop offset="60%" stopColor={layerIndex === 2 ? "#111" : "#0a0a0a"} />
                        <stop offset="95%" stopColor={layerIndex === 2 ? "#ff0055" : layerIndex === 1 ? "#10b981" : "#262626"} />
                        <stop offset="100%" stopColor="#ffffff" />
                      </linearGradient>
                    </defs>
                    
                    <path
                      d="M450,0 C420,50 310,80 260,140 C200,210 120,320 60,420 C10,500 0,560 30,590 C70,630 180,560 250,520 C320,480 390,400 450,320 Z
                         M450,250 C400,320 280,390 200,470 C130,540 70,660 40,760 C20,820 30,850 60,850 C110,850 220,720 310,610 C380,520 430,420 450,350 Z"
                      fill={`url(#wingGradR-${layerIndex})`}
                      opacity={layerIndex === 2 ? 0.9 : 1}
                    />
                    
                    {[...Array(18)].map((_, i) => (
                      <motion.path
                        key={i}
                        d={`M450,${30 + i * 45} Q${320 - i * 12},${120 + i * 35} ${50 + i * 15},${200 + i * 25}`}
                        stroke={layerIndex === 2 ? "rgba(255,0,85,0.4)" : "rgba(255,255,255,0.06)"}
                        strokeWidth={layerIndex === 2 ? "1.5" : "1"}
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: [0, 1, 1], opacity: [0, 0.8, 0] }}
                        transition={{ duration: 1.4, times: [0, 0.4, 1], delay: layerIndex * 0.1 + i * 0.02 }}
                      />
                    ))}
                  </motion.svg>
                ))}
              </div>

             
              {/* 爆速化したスリットフラッシュエフェクト */}
              <motion.div 
                className="fixed inset-0 z-[70] pointer-events-none mix-blend-overlay"
                initial={{ opacity: 0, backgroundColor: "#ffffff" }}
                animate={{ 
                  // 💡 一瞬だけ最大輝度になり、0.3秒で完全に消え去るように調整
                  opacity: [0, 1, 0.8, 0],
                  backgroundColor: ["#ffffff", "#10b981", "#ff0055", "#ffffff"]
                }}
                transition={{ 
                  duration: 0.35, // 1.5秒から0.35秒へ大幅に短縮！
                  times: [0, 0.15, 0.3, 1],
                  ease: "easeOut" 
                }}
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

