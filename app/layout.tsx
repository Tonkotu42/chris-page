import type { Metadata } from "next";
// ソニー風に最適な Inter と Noto Sans JP をインポート
import { Inter, Noto_Sans_JP } from "next/font/google";
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
  weight: ["400", "500", "700"], // 必要な太さを指定
});

export const metadata: Metadata = {
  title: "Sony Style Portfolio",
  description: "Created with Next.js and Framer Motion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja" // 日本語環境に合わせて ja に変更
      className={`${inter.variable} ${notoSansJP.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-white">
        {children}
      </body>
    </html>
  );
}

