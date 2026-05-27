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
  // 💡 LoadingScreen に渡すために、初回訪問かどうかを保持するステートを用意します
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  useEffect(() => {
    // 過去にアクセスしたことがあるかフラグを確認
    const hasVisited = sessionStorage.getItem("hasVisitedInsert");
    
    // 💡 hasVisited があれば、初回訪問ではない（false）を設定
    if (hasVisited) {
      setIsFirstVisit(false);
    }
    
    // 初回は3000ms（3秒）、2回目以降（再読み込み）は1000ms（1秒）に短縮
    const loadingDuration = hasVisited ? 1000 : 3000;

    // 起動音の処理
    const audio = new Audio("/audio/startup.mp3");
    audio.volume = 0.5;

    if (!hasVisited) {
      audio.play().catch((error) => {
        console.log("自動再生ブロック:", error);
      });
    }

    // タイマーをセット
    const timer = setTimeout(() => {
      setIsLoading(false);
      // アクセス済みフラグをセッションに保存（タブを閉じるまで有効）
      sessionStorage.setItem("hasVisitedInsert", "true");
    }, loadingDuration);

    return () => {
      clearTimeout(timer);
      audio.pause();
    };
  }, []);

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        // 💡 1つ前の手順で作った LoadingScreen に、isFirstVisit を正しく渡します
        // 💡 型エラーが出ないよう、残りの使わないプロパティにもダミー値を渡して完璧に対応します
        <LoadingScreen 
          key="loader" 
          isFirstVisit={isFirstVisit} 
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

