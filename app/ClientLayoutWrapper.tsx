// app/ClientLayoutWrapper.tsx
"use client";

import { useState, useEffect, useRef } from "react";
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
  
  // 💡 追加：通常ロゴからWELCOME BACKへ切り替えるトリガー
  const [changeToWelcome, setChangeToWelcome] = useState(false);

  const startupAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem("hasVisitedInsert");
    
    startupAudioRef.current = new Audio("/audio/startup.mp3");
    startupAudioRef.current.volume = 0.5;

    if (!hasVisited) {
      setIsFirstVisit(true);
      setWaitingForTouch(true);
    } else {
      setIsFirstVisit(false);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleTouch = () => {
    if (!waitingForTouch) return;
    setWaitingForTouch(false);
    
    if (startupAudioRef.current) {
      startupAudioRef.current.play().catch((err) => console.log(err));
    }
    
    // 💡 タッチされてから0.2秒後に羽を展開し、同時に中央の文字をWELCOME BACKにする
    setTimeout(() => {
      setShowWingsTransition(true);
      setChangeToWelcome(true); // 💡 ここで文字を切り替える指示を出す！
      
      // 羽が開いて文字を見せたあと、1.2秒後に画面をフェードアウトしてメニューへ
      setTimeout(() => {
        setIsLoading(false);
        sessionStorage.setItem("hasVisitedInsert", "true");
      }, 1200);
    }, 200);
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
            changeToWelcome={changeToWelcome} // 💡 状態をLoadingScreenに引き渡す
          />
          
          {/* シンメトリー機械羽 */}
          {showWingsTransition && (
            <>
              {/* 左の機械羽 */}
              <div className="fixed inset-y-0 left-0 w-1/2 z-50 overflow-hidden pointer-events-none">
                <motion.svg
                  viewBox="0 0 450 900"
                  className="absolute right-0 h-full w-auto"
                  initial={{ x: "-100%", scaleY: 0.7 }}
                  animate={{ 
                    x: ["0%", "0%", "-120%"],
                    scaleY: [1, 1.05, 0.95]
                  }}
                  transition={{ duration: 1.4, times: [0, 0.45, 1], ease: [0.16, 1, 0.3, 1] }}
                >
                  <path
                    d="M450,50 L320,180 L380,210 L240,320 L310,350 L140,480 L220,510 L60,650 L150,670 L0,800 L450,700 Z"
                    fill="#000000"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeLinejoin="miter"
                  />
                </motion.svg>
              </div>
              
              {/* 右の機械羽（完全シンメトリー） */}
              <div className="fixed inset-y-0 right-0 w-1/2 z-50 overflow-hidden pointer-events-none">
                <motion.svg
                  viewBox="0 0 450 900"
                  className="absolute left-0 h-full w-auto"
                  initial={{ x: "100%", scaleY: 0.7, scaleX: -1 }}
                  animate={{ 
                    x: ["0%", "0%", "120%"],
                    scaleY: [1, 1.05, 0.95],
                    scaleX: [-1, -1.05, -0.95]
                  }}
                  transition={{ duration: 1.4, times: [0, 0.45, 1], ease: [0.16, 1, 0.3, 1] }}
                >
                  <path
                    d="M450,50 L320,180 L380,210 L240,320 L310,350 L140,480 L220,510 L60,650 L150,670 L0,800 L450,700 Z"
                    fill="#000000"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeLinejoin="miter"
                  />
                </motion.svg>
              </div>
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
