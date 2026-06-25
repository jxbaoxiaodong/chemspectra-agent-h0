import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChemSpectra Agent — AI FTIR 光谱分析",
  description:
    "AI 驱动的 FTIR 红外光谱自动分析平台。上传光谱文件或输入峰位，自动鉴定材料、解释峰位、分配官能团，生成结构化分析报告。",
  keywords: ["FTIR", "光谱分析", "红外光谱", "材料鉴定", "AI", "化学分析"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-950 text-slate-200">{children}</body>
    </html>
  );
}
