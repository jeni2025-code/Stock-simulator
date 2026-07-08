"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DollarSign,
  History,
  PieChart,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPie,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import PortfolioTable from "@/components/PortfolioTable";
import { api } from "@/lib/api";
import type { Trade } from "@/lib/api";
import { useMarketStore } from "@/store/useMarketStore";

const SECTOR_COLORS: Record<string, string> = {
  Technology: "#29a3ff",
  Finance: "#22c55e",
  Energy: "#f59e0b",
  Healthcare: "#f472b6",
  Consumer: "#a78bfa",
};

const COLORS = [
  "#29a3ff",
  "#22c55e",
  "#f59e0b",
  "#f472b6",
  "#a78bfa",
  "#34d399",
  "#fb923c",
  "#60a5fa",
];

export default function PortfolioPage() {
  const {
    holdings,
    cash,
    totalEquity,
    totalPnl,
    totalPnlPct,
    setPortfolio,
  } = useMarketStore();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [portfolio, tradeData] = await Promise.all([
        api.getPortfolio(),
        api.getTrades(50),
      ]);

      setPortfolio({
        cash_balance: portfolio.cash_balance,
        holdings: portfolio.holdings,
        total_equity: portfolio.total_equity,
        total_pnl: portfolio.total_pnl,
        total_pnl_pct: portfolio.total_pnl_pct,
      });

      setTrades(tradeData.trades);
    } finally {
      setLoading(false);
    }
  }, [setPortfolio]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const up = totalPnl >= 0;

  const pieData = holdings.map((holding) => ({
    name: holding.symbol,
    value: holding.market_value,
    sector: "",
  }));

  if (cash > 0) {
    pieData.push({
      name: "Cash",
      value: cash,
      sector: "",
    });
  }

  return (
    <div className="min-h-screen max-w-[1600px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">My Portfolio</h1>
          <p className="mt-1 text-sm text-gray-400">
            Paper trading — $100,000 virtual starting capital
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-surface-900/60 px-4 py-2 text-sm text-gray-300 transition-all hover:border-white/20 hover:text-white"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            label: "Total Equity",
            value: `$${totalEquity.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}`,
            icon: DollarSign,
            color: "brand",
          },
          {
            label: "Cash Balance",
            value: `$${cash.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}`,
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
        ].map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-4 rounded-2xl border border-white/8 bg-surface-900/60 p-5"
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                card.color === "up"
                  ? "bg-up/15 text-up"
                  : card.color === "down"
                  ? "bg-down/15 text-down"
                  : "bg-brand-500/15 text-brand-400"
              }`}
            >
              <card.icon className="h-5 w-5" />
            </div>

            <div>
              <div className="mb-0.5 text-xs text-gray-400">
                {card.label}
              </div>

              <div
                className={`font-mono text-lg font-bold leading-tight ${
                  card.color === "up"
                    ? "text-up"
                    : card.color === "down"
                    ? "text-down"
                    : "text-white"
                }`}
              >
                {card.value}
              </div>

              {card.sub && (
                <div className="text-[11px] text-gray-500">
                  {card.sub}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        {/* Holdings */}
        <div className="overflow-hidden rounded-2xl border border-white/8 bg-surface-900/50">
          <div className="flex items-center gap-2 border-b border-white/5 px-5 py-4">
            <PieChart className="h-4 w-4 text-brand-400" />
            <h2 className="text-sm font-semibold text-white">
              Holdings
            </h2>
          </div>

          <PortfolioTable />
        </div>

        {/* Allocation */}
        <div className="rounded-2xl border border-white/8 bg-surface-900/50 p-5">
          <div className="mb-4 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-brand-400" />
            <h2 className="text-sm font-semibold text-white">
              Allocation
            </h2>
          </div>

          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RechartsPie>
                <Pie
                  data={pieData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
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
                  formatter={(value) => [
                    `$${Number(value).toFixed(2)}`,
                    "",
                  ]}
                />

                <Legend
                  wrapperStyle={{
                    fontSize: "11px",
                    color: "#9ca3af",
                  }}
                />
              </RechartsPie>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-gray-500">
              No holdings to display
            </div>
          )}
        </div>
      </div>

      {/* Trade History */}
      <div className="overflow-hidden rounded-2xl border border-white/8 bg-surface-900/50">
        <div className="flex items-center gap-2 border-b border-white/5 px-5 py-4">
          <History className="h-4 w-4 text-brand-400" />

          <h2 className="text-sm font-semibold text-white">
            Trade History
          </h2>

          <span className="ml-auto text-xs text-gray-500">
            {trades.length} trades
          </span>
        </div>

        {trades.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            No trades executed yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {[
                    "Symbol",
                    "Side",
                    "Qty",
                    "Price",
                    "Total",
                    "Time",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 ${
                        heading === "Symbol"
                          ? "text-left"
                          : "text-right"
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {trades.map((trade) => (
                  <tr
                    key={trade.id}
                    className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-white">
                      {trade.symbol}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          trade.side === "buy"
                            ? "bg-up/10 text-up"
                            : "bg-down/10 text-down"
                        }`}
                      >
                        {trade.side.toUpperCase()}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-gray-200">
                      {trade.quantity}
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-gray-200">
                      ${trade.price.toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-medium text-white">
                      ${trade.total.toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-right text-xs text-gray-500">
                      {new Date(trade.executed_at).toLocaleString()}
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
