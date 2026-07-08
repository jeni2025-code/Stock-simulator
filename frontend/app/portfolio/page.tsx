"use client";
import { useEffect, useCallback, useState } from "react";
import { useMarketStore } from "@/store/useMarketStore";
import { api } from "@/lib/api";
import type { Trade } from "@/lib/api";
import PortfolioTable from "@/components/PortfolioTable";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  History,
  RefreshCw,
} from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const SECTOR_COLORS: Record<string, string> = {
  Technology: "#29a3ff",
  Finance:    "#22c55e",
  Energy:     "#f59e0b",
  Healthcare: "#f472b6",
  Consumer:   "#a78bfa",
};

export default function PortfolioPage() {
  const { holdings, cash, totalEquity, totalPnl, totalPnlPct, setPortfolio } = useMarketStore();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, t] = await Promise.all([api.getPortfolio(), api.getTrades(50)]);
      setPortfolio({
        cash_balance: p.cash_balance,
        holdings: p.holdings,
        total_equity: p.total_equity,
        total_pnl: p.total_pnl,
        total_pnl_pct: p.total_pnl_pct,
      });
      setTrades(t.trades);
    } catch {} finally {
      setLoading(false);
    }
  }, [setPortfolio]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const up = totalPnl >= 0;

  // Allocation pie chart data
  const pieData = holdings.map((h) => ({
    name: h.symbol,
    value: h.market_value,
    sector: "",
  }));
  if (cash > 0) pieData.push({ name: "Cash", value: cash, sector: "" });

  const COLORS = ["#29a3ff", "#22c55e", "#f59e0b", "#f472b6", "#a78bfa", "#34d399", "#fb923c", "#60a5fa"];

  return (
    <div className="min-h-screen max-w-[1600px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-bold text-2xl mb-1">My Portfolio</h1>
          <p className="text-gray-400 text-sm">Paper trading — $100,000 virtual starting capital</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-surface-900/60 border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white hover:border-white/20 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total Equity",
            value: `$${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            icon: DollarSign,
            color: "brand",
          },
          {
            label: "Cash Balance",
            value: `$${cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            icon: DollarSign,
            color: "blue",
          },
          {
            label: "Unrealized P&L",
            value: `${up ? "+" : ""}$${totalPnl.toFixed(2)}`,
            sub: `${totalPnlPct >= 0 ? "+" : ""}${totalPnlPct.toFixed(2)}%`,
            icon: up ? TrendingUp : TrendingDown,
            color: up ? "up" : "down",
          },
          {
            label: "Positions",
            value: String(holdings.length),
            sub: "active holdings",
            icon: PieChart,
            color: "brand",
          },
        ].map((c) => (
          <div key={c.label} className="bg-surface-900/60 border border-white/8 rounded-2xl p-5 flex items-center gap-4">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                c.color === "up"
                  ? "bg-up/15 text-up"
                  : c.color === "down"
                  ? "bg-down/15 text-down"
                  : "bg-brand-500/15 text-brand-400"
              }`}
            >
              <c.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-0.5">{c.label}</div>
              <div
                className={`font-mono font-bold text-lg leading-tight ${
                  c.color === "up" ? "text-up" : c.color === "down" ? "text-down" : "text-white"
                }`}
              >
                {c.value}
              </div>
              {c.sub && <div className="text-gray-500 text-[11px]">{c.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 mb-6">
        {/* Holdings Table */}
        <div className="bg-surface-900/50 border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-brand-400" />
            <h2 className="text-white font-semibold text-sm">Holdings</h2>
          </div>
          <PortfolioTable />
        </div>

        {/* Allocation Pie */}
        <div className="bg-surface-900/50 border border-white/8 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-brand-400" />
            <h2 className="text-white font-semibold text-sm">Allocation</h2>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RechartsPie>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", color: "#9ca3af" }}
                />
              </RechartsPie>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-500 text-sm">
              No holdings to display
            </div>
          )}
        </div>
      </div>

      {/* Trade History */}
      <div className="bg-surface-900/50 border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <History className="w-4 h-4 text-brand-400" />
          <h2 className="text-white font-semibold text-sm">Trade History</h2>
          <span className="ml-auto text-xs text-gray-500">{trades.length} trades</span>
        </div>
        {trades.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">No trades executed yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {["Symbol", "Side", "Qty", "Price", "Total", "Time"].map((h) => (
                    <th key={h} className={`py-3 px-4 text-gray-500 text-xs uppercase tracking-wider font-medium ${h === "Symbol" ? "text-left" : "text-right"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 text-white font-mono font-semibold">{t.symbol}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${t.side === "buy" ? "bg-up/10 text-up" : "bg-down/10 text-down"}`}>
                        {t.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-200 font-mono">{t.quantity}</td>
                    <td className="py-3 px-4 text-right text-gray-200 font-mono">${t.price.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-white font-mono font-medium">${t.total.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-gray-500 text-xs">
                      {new Date(t.executed_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
