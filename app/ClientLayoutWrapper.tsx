"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import LoadingScreen from "./LoadingScreen"; // インサート画面用コンポーネント

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <LoadingScreen key="loader" onComplete={() => setIsLoading(false)} />
      ) : (
        <div key="content" className="flex-1 flex flex-col">
          {children}
        </div>
      )}
    </AnimatePresence>
  );
}
