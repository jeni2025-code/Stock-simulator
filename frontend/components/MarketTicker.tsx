"use client";
import { useMarketStore } from "@/store/useMarketStore";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function MarketTicker() {
  const { stocks, orderedSymbols } = useMarketStore();

  const items = orderedSymbols.map((sym) => stocks[sym]).filter(Boolean);
  // Duplicate for seamless looping
  const doubled = [...items, ...items];

  return (
    <div className="w-full bg-surface-900/50 border-b border-white/5 overflow-hidden py-2.5">
      <div className="flex animate-ticker w-max">
        {doubled.map((s, i) => {
          const up = s.change_pct >= 0;
          return (
            <div
              key={`${s.symbol}-${i}`}
              className="flex items-center gap-3 px-6 border-r border-white/5 whitespace-nowrap"
            >
              <span className="text-white font-mono font-bold text-sm">{s.symbol}</span>
              <span className="text-gray-200 font-mono text-sm">
                ${s.price?.toFixed(2) ?? "—"}
              </span>
              <span
                className={`flex items-center gap-0.5 text-xs font-mono font-medium ${
                  up ? "text-up" : "text-down"
                }`}
              >
                {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {up ? "+" : ""}{s.change_pct?.toFixed(2) ?? "0.00"}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
