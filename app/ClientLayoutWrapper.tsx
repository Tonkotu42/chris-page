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
  // 💡 チラつき防止のため、初期値は false（ローディングなし）にしておく
  const [isLoading, setIsLoading] = useState(false);
  // 💡 ハイドレーションエラーを防ぐためのマウント状態管理
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // セッションストレージを確認
    const hasVisited = sessionStorage.getItem("hasVisitedBefore");

    if (!hasVisited) {
      // 【初回起動時のみ】ローディングを有効にし、フラグを保存
      setIsLoading(true);
      sessionStorage.setItem("hasVisitedBefore", "true");

      // 3秒後にローディングを終了
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  // 💡 サーバーサイドレンダリング時はコンテンツのみを返してエラーを防ぐ
  if (!isMounted) {
    return <div className="flex-1 flex flex-col">{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <LoadingScreen key="loader" onComplete={() => {}} />
      ) : (
        <motion.div
          key="content"
          className="flex-1 flex flex-col"
          // 💡 リロード時はアニメーション（initial）をスキップして即座に表示させる
          initial={sessionStorage.getItem("hasVisitedBefore") ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

