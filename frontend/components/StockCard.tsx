"use client";
import Link from "next/link";
import { useRef, useEffect } from "react";
import { TrendingUp, TrendingDown, BarChart2 } from "lucide-react";
import type { StockSnapshot } from "@/lib/api";

interface StockCardProps {
  stock: StockSnapshot;
}

export default function StockCard({ stock }: StockCardProps) {
  const up = stock.change_pct >= 0;
  const prevPriceRef = useRef(stock.price);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prevPriceRef.current !== stock.price && cardRef.current) {
      const cls = stock.price > prevPriceRef.current ? "animate-flash-green" : "animate-flash-red";
      cardRef.current.classList.add(cls);
      setTimeout(() => cardRef.current?.classList.remove(cls), 500);
      prevPriceRef.current = stock.price;
    }
  }, [stock.price]);

  const sectorColors: Record<string, string> = {
    Technology: "text-blue-400 bg-blue-400/10",
    Finance: "text-emerald-400 bg-emerald-400/10",
    Energy: "text-yellow-400 bg-yellow-400/10",
    Healthcare: "text-pink-400 bg-pink-400/10",
    Consumer: "text-purple-400 bg-purple-400/10",
  };

  return (
    <Link href={`/trade/${stock.symbol}`}>
      <div
        ref={cardRef}
        className="group relative bg-glass border border-white/10 rounded-2xl p-5 hover:border-brand-500/40 hover:shadow-lg hover:shadow-brand-500/10 transition-all duration-200 cursor-pointer overflow-hidden"
      >
        {/* Background glow */}
        <div
          className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
            up ? "bg-glow-green" : "bg-glow-red"
          }`}
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-lg font-mono">{stock.symbol}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    sectorColors[stock.sector] || "text-gray-400 bg-gray-400/10"
                  }`}
                >
                  {stock.sector}
                </span>
              </div>
              <div className="text-gray-400 text-xs mt-0.5 truncate max-w-[160px]">{stock.name}</div>
            </div>

            <div className={`p-2 rounded-xl ${up ? "bg-up/10" : "bg-down/10"}`}>
              {up ? (
                <TrendingUp className="w-4 h-4 text-up" />
              ) : (
                <TrendingDown className="w-4 h-4 text-down" />
              )}
            </div>
          </div>

          {/* Price */}
          <div className="mb-3">
            <div className="text-white font-mono font-bold text-2xl">
              ${stock.price?.toFixed(2)}
            </div>
            <div className={`flex items-center gap-1.5 text-sm font-mono mt-0.5 ${up ? "text-up" : "text-down"}`}>
              <span>{up ? "▲" : "▼"}</span>
              <span>
                {up ? "+" : ""}{stock.change?.toFixed(2)} ({up ? "+" : ""}
                {stock.change_pct?.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div>
              <div className="text-gray-500">Open</div>
              <div className="text-gray-300 font-mono">${stock.open?.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-gray-500">High</div>
              <div className="text-up font-mono">${stock.high?.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-gray-500">Low</div>
              <div className="text-down font-mono">${stock.low?.toFixed(2)}</div>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-gray-500">
            <BarChart2 className="w-3 h-3" />
            <span>Vol: {(stock.volume / 1000).toFixed(1)}K</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
