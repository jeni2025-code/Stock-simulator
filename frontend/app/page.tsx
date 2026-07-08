"use client";
import { useState, useMemo } from "react";
import { useMarketStore } from "@/store/useMarketStore";
import StockCard from "@/components/StockCard";
import MarketTicker from "@/components/MarketTicker";
import { TrendingUp, TrendingDown, Search, Activity, DollarSign, BarChart2 } from "lucide-react";

const SECTORS = ["All", "Technology", "Finance", "Energy", "Healthcare", "Consumer"];

export default function DashboardPage() {
  const { stocks, orderedSymbols, totalEquity, totalPnl, totalPnlPct, cash } = useMarketStore();
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All");
  const [sortBy, setSortBy] = useState<"change_pct" | "price" | "volume" | "market_cap">("change_pct");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const allStocks = orderedSymbols.map((s) => stocks[s]).filter(Boolean);

  const filtered = useMemo(() => {
    return allStocks
      .filter((s) => {
        const matchSearch =
          s.symbol.toLowerCase().includes(search.toLowerCase()) ||
          s.name.toLowerCase().includes(search.toLowerCase());
        const matchSector = sector === "All" || s.sector === sector;
        return matchSearch && matchSector;
      })
      .sort((a, b) => {
        const dir = sortDir === "desc" ? -1 : 1;
        return (a[sortBy] - b[sortBy]) * dir;
      });
  }, [allStocks, search, sector, sortBy, sortDir]);

  const gainers = [...allStocks].sort((a, b) => b.change_pct - a.change_pct).slice(0, 5);
  const losers = [...allStocks].sort((a, b) => a.change_pct - b.change_pct).slice(0, 5);

  const totalMarketCap = allStocks.reduce((sum, s) => sum + s.market_cap, 0);
  const avgChange = allStocks.length
    ? allStocks.reduce((sum, s) => sum + s.change_pct, 0) / allStocks.length
    : 0;

  return (
    <div className="min-h-screen">
      {/* Ticker */}
      <MarketTicker />

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Hero Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Portfolio Equity",
              value: `$${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
              sub: `Cash: $${cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
              icon: DollarSign,
              color: "brand",
            },
            {
              label: "Total P&L",
              value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`,
              sub: `${totalPnlPct >= 0 ? "+" : ""}${totalPnlPct.toFixed(2)}% return`,
              icon: TrendingUp,
              color: totalPnl >= 0 ? "up" : "down",
            },
            {
              label: "Market Cap",
              value: `$${(totalMarketCap / 1e9).toFixed(2)}B`,
              sub: `${allStocks.length} stocks tracked`,
              icon: BarChart2,
              color: "brand",
            },
            {
              label: "Avg Change",
              value: `${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%`,
              sub: `Market ${avgChange >= 0 ? "up" : "down"} today`,
              icon: Activity,
              color: avgChange >= 0 ? "up" : "down",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-surface-900/60 border border-white/8 rounded-2xl p-5 flex items-center gap-4"
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  stat.color === "brand"
                    ? "bg-brand-500/15 text-brand-400"
                    : stat.color === "up"
                    ? "bg-up/15 text-up"
                    : "bg-down/15 text-down"
                }`}
              >
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-0.5">{stat.label}</div>
                <div
                  className={`font-mono font-bold text-lg leading-tight ${
                    stat.color === "brand"
                      ? "text-white"
                      : stat.color === "up"
                      ? "text-up"
                      : "text-down"
                  }`}
                >
                  {stat.value}
                </div>
                <div className="text-gray-500 text-[11px]">{stat.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Gainers & Losers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Top Gainers */}
          <div className="bg-surface-900/50 border border-white/8 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-up" />
              <h2 className="text-white font-semibold text-sm">Top Gainers</h2>
            </div>
            <div className="space-y-2">
              {gainers.map((s) => (
                <div key={s.symbol} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono font-semibold text-sm w-14">{s.symbol}</span>
                    <span className="text-gray-500 text-xs truncate max-w-[120px]">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-200 font-mono text-sm">${s.price?.toFixed(2)}</span>
                    <span className="text-up text-xs font-mono font-medium bg-up/10 px-2 py-0.5 rounded-lg">
                      +{s.change_pct?.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div className="bg-surface-900/50 border border-white/8 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-4 h-4 text-down" />
              <h2 className="text-white font-semibold text-sm">Top Losers</h2>
            </div>
            <div className="space-y-2">
              {losers.map((s) => (
                <div key={s.symbol} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono font-semibold text-sm w-14">{s.symbol}</span>
                    <span className="text-gray-500 text-xs truncate max-w-[120px]">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-200 font-mono text-sm">${s.price?.toFixed(2)}</span>
                    <span className="text-down text-xs font-mono font-medium bg-down/10 px-2 py-0.5 rounded-lg">
                      {s.change_pct?.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search stocks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500/60 transition-all placeholder:text-gray-600"
            />
          </div>

          {/* Sector filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {SECTORS.map((s) => (
              <button
                key={s}
                onClick={() => setSector(s)}
                className={`px-3 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  sector === s
                    ? "bg-brand-600/20 border-brand-500/40 text-brand-400"
                    : "bg-surface-900/50 border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortDir}`}
            onChange={(e) => {
              const [field, dir] = e.target.value.split("-") as [typeof sortBy, typeof sortDir];
              setSortBy(field);
              setSortDir(dir);
            }}
            className="bg-surface-900/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-brand-500/60"
          >
            <option value="change_pct-desc">↑ Change %</option>
            <option value="change_pct-asc">↓ Change %</option>
            <option value="price-desc">↑ Price</option>
            <option value="price-asc">↓ Price</option>
            <option value="volume-desc">↑ Volume</option>
            <option value="market_cap-desc">↑ Market Cap</option>
          </select>
        </div>

        {/* Stock Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No stocks match your filters.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 animate-fade-in">
            {filtered.map((s) => (
              <StockCard key={s.symbol} stock={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
