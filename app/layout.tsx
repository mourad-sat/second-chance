import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700", "800", "900"]
});

export const metadata: Metadata = {
  title: {
    default: "منصة تدبير برنامج الفرصة الثانية",
    template: "%s | الفرصة الثانية"
  },
  description: "منصة جمعية نور الأمل لتدبير رحلة المستفيد من التسجيل إلى الإدماج.",
  applicationName: "Second Chance 2.0",
  icons: {
    icon: "/branding/nour-al-amal-mark.svg"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b327a"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className={cairo.className}>{children}</body>
    </html>
  );
}
