import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import ClientLayoutWrapper from "./ClientLayoutWrapper"; // 2で作成するコンポーネント
import "./globals.css";

// 英語用フォントの設定
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// 日本語用フォントの設定
const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// メタデータ（サーバーコンポーネントでのみ定義可能）
export const metadata: Metadata = {
  title: "GANG CAT RECORDS",
  description: "Created with Next.js and Framer Motion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${inter.variable} ${notoSansJP.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-white overflow-x-hidden">
        {/* クライアント側の演出部分のみをラップ */}
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}
