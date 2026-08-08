import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "4exam.study - 우리학교 시험자료",
  description: "전국 학교별 교과서 맞춤 무료 시험자료 플랫폼",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
