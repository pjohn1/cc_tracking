import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Card Tracker",
  description: "Balances, due dates, credits and offers in one place.",
  applicationName: "Card Tracker",
  appleWebApp: { capable: true, title: "Cards", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f3ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1012" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
