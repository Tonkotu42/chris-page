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
  
  const [changeToWelcome, setChangeToWelcome] = useState(false);
  // 💡 追加：リフレッシュ画面を呼び出す状態
  const [isReloading, setIsReloading] = useState(false);

  const startupAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem("hasVisitedInsert");
    
    if (!hasVisited) {
      setIsFirstVisit(true);
      setWaitingForTouch(true);
      setIsReloading(false); // 初回はFalse
      
      startupAudioRef.current = new Audio("/audio/startup.ogg");
      startupAudioRef.current.volume = 0.5;
    } else {
      setIsFirstVisit(false);
      setWaitingForTouch(false);
      // 💡 追加：2回目以降のアクセス（リフレッシュ）時はTrueにする
      setIsReloading(true);

      const refreshAudio = new Audio("/audio/reload.ogg");
      refreshAudio.volume = 0.4;
      
      refreshAudio.play().catch((err) => {
        console.log("リフレッシュ音の自動再生がブロックされました:", err);
      });

      // 1秒後にインサート画面を閉じる
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
      const audio = startupAudioRef.current;

      const onAudioStart = () => {
        setTimeout(() => {
          setShowWingsTransition(true);
          setChangeToWelcome(true);
          
          setTimeout(() => {
            setIsLoading(false);
            sessionStorage.setItem("hasVisitedInsert", "true");
          }, 1200);
        }, 200);

        audio.removeEventListener("timeupdate", onAudioStart);
      };

      audio.addEventListener("timeupdate", onAudioStart);

      audio.play().catch((err) => {
        console.log(err);
        setShowWingsTransition(true);
        setChangeToWelcome(true);
        setTimeout(() => {
          setIsLoading(false);
          sessionStorage.setItem("hasVisitedInsert", "true");
        }, 1200);
      });
    }
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
            changeToWelcome={changeToWelcome}
            // 💡 追加：LoadingScreenにリフレッシュ状態を流し込む
            isReloading={isReloading}
          />
          
          {showWingsTransition && (
            <>
              <div className="fixed inset-y-0 left-0 w-1/2 z-50 overflow-hidden pointer-events-none">
                <motion.svg
                  viewBox="0 0 450 900"
                  className="absolute right-0 h-full w-auto"
                  initial={{ x: "-100%", scaleY: -0.7 }}
                  animate={{ 
                    x: ["0%", "0%", "-120%"],
                    scaleY: [-1, -1.05, -0.95]
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
              
              <div className="fixed inset-y-0 right-0 w-1/2 z-50 overflow-hidden pointer-events-none">
                <motion.svg
                  viewBox="0 0 450 900"
                  className="absolute left-0 h-full w-auto"
                  initial={{ x: "100%", scaleY: -0.7, scaleX: -1 }}
                  animate={{ 
                    x: ["0%", "0%", "120%"],
                    scaleY: [-1, -1.05, -0.95],
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
