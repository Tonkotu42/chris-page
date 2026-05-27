// app/loading.tsx
import LoadingScreen from "./LoadingScreen"; // 既存のコンポーネントを読み込む場合

export default function Loading() {
  const handleComplete = () => {
    console.log("読み込み完了");
  };

  return <LoadingScreen onComplete={handleComplete} />;
}

