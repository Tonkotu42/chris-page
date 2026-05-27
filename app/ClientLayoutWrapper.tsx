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

  useEffect(() => {
    // 過去にアクセスしたことがあるかフラグを確認
    const hasVisited = sessionStorage.getItem("hasVisitedInsert");
    
    // 初回は3000ms（3秒）、2回目以降（再読み込み）は1000ms（1秒）に短縮
    const loadingDuration = hasVisited ? 1000 : 3000;

    // 起動音の処理
    const audio = new Audio("/audio/startup.mp3");
    audio.volume = 0.5;

    // ユーザー操作で音声を再生する関数
    const playAudio = () => {
      if (!hasVisited) {
        audio.play().catch((error) => {
          console.log("再生エラー:", error);
        });
      }
      // イベントリスナーを削除
      document.removeEventListener("click", playAudio);
      document.removeEventListener("touchstart", playAudio);
      document.removeEventListener("keydown", playAudio);
    };

    // 初回訪問時はユーザー操作を待つ、または即座に再生を試みる
    if (!hasVisited) {
      // まず自動再生を試みる
      audio.play().catch(() => {
        // 自動再生がブロックされたらユーザー操作を待つ
        document.addEventListener("click", playAudio);
        document.addEventListener("touchstart", playAudio);
        document.addEventListener("keydown", playAudio);
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
      document.removeEventListener("click", playAudio);
      document.removeEventListener("touchstart", playAudio);
      document.removeEventListener("keydown", playAudio);
    };
  }, []);

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        // 💡 ここから「onComplete」を完全に削除しました
        <LoadingScreen key="loader" />
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

