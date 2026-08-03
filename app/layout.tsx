import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "منصة تدبير برنامج الفرصة الثانية",
  description: "منصة جمعية نور الأمل لتدبير المستفيدين والتتبع السنوي"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
