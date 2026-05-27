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
          {/* メカニカル・モノクローム・ウィング・トランジション */}
          {showWingsTransition && (
            <>
              {/* 左のギザギザ機械羽 */}
              <div className="fixed inset-y-0 left-0 w-1/2 z-50 overflow-hidden pointer-events-none">
                <motion.svg
                  viewBox="0 0 450 900"
                  className="absolute right-0 h-full w-auto"
                  style={{ transform: "translateX(0%)" }}
                  initial={{ x: "-100%", scaleY: 0.7 }}
                  animate={{ 
                    x: ["0%", "0%", "-120%"],
                    scaleY: [1, 1.05, 0.95]
                  }}
                  transition={{ 
                    duration: 1.4, 
                    times: [0, 0.45, 1],
                    ease: [0.16, 1, 0.3, 1] // キレのあるインダストリアルな動き
                  }}
                >
                  {/* 💡 輪郭だけをくり抜いたソリッドな白黒デザイン */}
                  <path
                    d="M450,50 
                       L320,180 L380,210 
                       L240,320 L310,350 
                       L140,480 L220,510 
                       L60,650 L150,670 
                       L0,800 L450,700 Z"
                    fill="#000000"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeLinejoin="miter" // 角を丸めず鋭角に尖らせる
                  />
                  
                  {/* 💡 内部の機械的なスリットライン */}
                  {[...Array(8)].map((_, i) => (
                    <motion.path
                      key={`line-l-${i}`}
                      d={`M450,${120 + i * 60} L${250 - i * 20},${220 + i * 60}`}
                      stroke="#ffffff"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.03 }}
                    />
                  ))}
                </motion.svg>
              </div>
              
                           {/* 右のギザギザ機械羽 */}
              <div className="fixed inset-y-0 right-0 w-1/2 z-50 overflow-hidden pointer-events-none">
                <motion.svg
                  key="wing-r"
                  viewBox="0 0 450 900"
                  className="absolute left-0 h-full w-auto"
                  // 💡 initial と animate の両方に「scaleX(-1)」を入れ、アニメーション中も常に反転（シンメトリー）させます
                  initial={{ x: "100%", scaleY: 0.7, scaleX: -1 }}
                  animate={{ 
                    x: ["0%", "0%", "120%"],
                    scaleY: [1, 1.05, 0.95],
                    scaleX: [-1, -1.05, -0.95] // 縦のバウンドに合わせて横も反転を維持
                  }}
                  transition={{ 
                    duration: 1.4, 
                    times: [0, 0.45, 1],
                    ease: [0.16, 1, 0.3, 1]
                  }}
                >

                  <path
                    d="M450,50 
                       L320,180 L380,210 
                       L240,320 L310,350 
                       L140,480 L220,510 
                       L60,650 L150,670 
                       L0,800 L450,700 Z"
                    fill="#000000"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeLinejoin="miter"
                  />
                  
                  {[...Array(8)].map((_, i) => (
                    <motion.path
                      key={`line-r-${i}`}
                      d={`M450,${120 + i * 60} L${250 - i * 20},${220 + i * 60}`}
                      stroke="#ffffff"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.03 }}
                    />
                  ))}
                </motion.svg>
              </div>

              {/* モノクローム・ラディカルフラッシュ */}
              <motion.div 
                className="fixed inset-0 z-40 pointer-events-none"
                initial={{ opacity: 0, backgroundColor: "#ffffff" }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.25, ease: "linear" }}
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

