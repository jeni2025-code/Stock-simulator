"use client";
import { useMarketStore } from "@/store/useMarketStore";
import { TrendingUp, TrendingDown, Package } from "lucide-react";
import Link from "next/link";

export default function PortfolioTable() {
  const { holdings, totalPnl, totalPnlPct, totalEquity, cash } = useMarketStore();

  if (holdings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="w-12 h-12 text-gray-600 mb-3" />
        <p className="text-gray-400 font-medium">No positions yet</p>
        <p className="text-gray-600 text-sm mt-1">Start trading to see your holdings here</p>
        <Link
          href="/"
          className="mt-4 px-4 py-2 bg-brand-600/20 border border-brand-500/30 text-brand-400 rounded-xl text-sm hover:bg-brand-600/30 transition-all"
        >
          Go to Market
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left py-3 px-4 text-gray-500 text-xs uppercase tracking-wider font-medium">Symbol</th>
            <th className="text-right py-3 px-4 text-gray-500 text-xs uppercase tracking-wider font-medium">Qty</th>
            <th className="text-right py-3 px-4 text-gray-500 text-xs uppercase tracking-wider font-medium">Avg Cost</th>
            <th className="text-right py-3 px-4 text-gray-500 text-xs uppercase tracking-wider font-medium">Cur Price</th>
            <th className="text-right py-3 px-4 text-gray-500 text-xs uppercase tracking-wider font-medium">Market Val</th>
            <th className="text-right py-3 px-4 text-gray-500 text-xs uppercase tracking-wider font-medium">P&L</th>
            <th className="text-right py-3 px-4 text-gray-500 text-xs uppercase tracking-wider font-medium">P&L %</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => {
            const up = h.pnl >= 0;
            return (
              <tr
                key={h.symbol}
                className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-3.5 px-4">
                  <Link href={`/trade/${h.symbol}`} className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/20 flex items-center justify-center">
                      <span className="text-brand-400 text-xs font-bold">{h.symbol[0]}</span>
                    </div>
                    <span className="text-white font-mono font-semibold group-hover:text-brand-400 transition-colors">
                      {h.symbol}
                    </span>
                  </Link>
                </td>
                <td className="py-3.5 px-4 text-right text-gray-200 font-mono">{h.quantity}</td>
                <td className="py-3.5 px-4 text-right text-gray-200 font-mono">${h.avg_buy_price.toFixed(2)}</td>
                <td className="py-3.5 px-4 text-right text-gray-200 font-mono">${h.current_price.toFixed(2)}</td>
                <td className="py-3.5 px-4 text-right text-white font-mono font-medium">
                  ${h.market_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className={`py-3.5 px-4 text-right font-mono font-medium ${up ? "text-up" : "text-down"}`}>
                  <div className="flex items-center justify-end gap-1">
                    {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {up ? "+" : ""}{h.pnl.toFixed(2)}
                  </div>
                </td>
                <td className={`py-3.5 px-4 text-right font-mono ${up ? "text-up" : "text-down"}`}>
                  <span className={`px-2 py-0.5 rounded-lg text-xs ${up ? "bg-up/10" : "bg-down/10"}`}>
                    {up ? "+" : ""}{h.pnl_pct.toFixed(2)}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
