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
  
  // 通常ロゴからWELCOME BACKへ切り替えるトリガー
  const [changeToWelcome, setChangeToWelcome] = useState(false);

  const startupAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem("hasVisitedInsert");
    
    if (!hasVisited) {
      // 【初回訪問時】
      setIsFirstVisit(true);
      setWaitingForTouch(true);
      
      startupAudioRef.current = new Audio("/audio/startup.ogg");
      startupAudioRef.current.volume = 0.5;
    } else {
      // 【リフレッシュ（2回目以降）時】
      setIsFirstVisit(false);
      setWaitingForTouch(false);

      // リフレッシュ専用の短い音声を生成して最速で鳴らす
      const refreshAudio = new Audio("/audio/reload.ogg"); // ※拡張子は.oggでも可
      refreshAudio.volume = 0.4; // リピート時は少し控えめの音量に
      
      refreshAudio.play().catch((err) => {
        // 初回訪問ではないため、ブラウザのセキュリティ制限でブロックされる場合があります
        console.log("リフレッシュ音の自動再生がブロックされました:", err);
      });

      // 1秒後にインサート画面を閉じる
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // 音声をタッチ直後に最速で鳴らすように修正
  // 音声のリアルタイムな再生開始を検知してアニメーションを動かす
  const handleTouch = () => {
    if (!waitingForTouch) return;
    setWaitingForTouch(false);
    
    if (startupAudioRef.current) {
      const audio = startupAudioRef.current;

      // 1. 音声が実際に再生開始され、再生時間が動き出した瞬間を監視するイベント
      const onAudioStart = () => {
        // 音が鳴り始めたら、200ms（0.2秒）後に羽の展開と文字切り替えをスタート！
        setTimeout(() => {
          setShowWingsTransition(true);
          setChangeToWelcome(true);
          
          // さらに1.2秒後に画面をフェードアウトしてメニューへ
          setTimeout(() => {
            setIsLoading(false);
            sessionStorage.setItem("hasVisitedInsert", "true");
          }, 1200);
        }, 200);

        // イベントが何度も実行されないように一度実行したら削除する
        audio.removeEventListener("timeupdate", onAudioStart);
      };

      audio.addEventListener("timeupdate", onAudioStart);

      // 2. タッチの瞬間に最速で再生命令を出す
      audio.play().catch((err) => {
        console.log(err);
        // 万が一ブラウザに再生をブロックされた場合のセーフティ（即座にアニメーションを動かす）
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
            changeToWelcome={changeToWelcome} // 状態をLoadingScreenに引き渡す
          />
          
          {/* シンメトリー機械羽 */}
          {showWingsTransition && (
            <>
              {/* 左の機械羽（上下逆転） */}
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
              
              {/* 右の機械羽（完全シンメトリー ＆ 上下逆転） */}
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
