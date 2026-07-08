import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MarketWebSocketProvider from "@/components/MarketWebSocketProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "StockSim Exchange — Real-Time Stock Simulator",
  description:
    "A real-time stock exchange simulator with live prices, order matching, candlestick charts, and portfolio tracking. Paper trade with $100K virtual cash.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-surface-950 text-white antialiased font-sans min-h-screen">
        <MarketWebSocketProvider />
        <Navbar />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
