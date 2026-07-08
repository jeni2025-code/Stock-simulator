"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useMarketStore } from "@/store/useMarketStore";
import { api } from "@/lib/api";
import type { Candle, Order } from "@/lib/api";
import CandlestickChart from "@/components/CandlestickChart";
import OrderBook from "@/components/OrderBook";
import TradePanel from "@/components/TradePanel";
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function TradePage() {
  const params = useParams();
  const symbol = (params?.symbol as string ?? "").toUpperCase();
  const { stocks, orders, setOrders } = useMarketStore();
  const stock = stocks[symbol];

  const [candles, setCandles] = useState<Candle[]>([]);
  const [interval, setInterval] = useState("1m");
  const [recentTrades, setRecentTrades] = useState<{ id: number; side: string; quantity: number; price: number; total: number; executed_at: string }[]>([]);

  const loadCandles = useCallback(async () => {
    try {
      const data = await api.getHistory(symbol, interval, 120);
      setCandles(data.candles);
    } catch {}
  }, [symbol, interval]);

  const loadOrders = useCallback(async () => {
    try {
      const data = await api.getOrders();
      setOrders(data.orders.filter((o) => o.symbol === symbol));
    } catch {}
  }, [symbol, setOrders]);

  const loadTrades = useCallback(async () => {
    try {
      const data = await api.getTrades(20);
      setRecentTrades(data.trades.filter((t) => t.symbol === symbol));
    } catch {}
  }, [symbol]);

  useEffect(() => {
    loadCandles();
    loadOrders();
    loadTrades();
  }, [loadCandles, loadOrders, loadTrades]);

  const handleOrderFilled = () => {
    setTimeout(() => {
      loadOrders();
      loadTrades();
    }, 500);
  };

  if (!stock) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-gray-400 mb-2">Loading {symbol}...</div>
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const up = stock.change_pct >= 0;

  return (
    <div className="min-h-screen max-w-[1600px] mx-auto px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Market
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-white font-mono font-semibold">{symbol}</span>
      </div>

      {/* Stock Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 bg-surface-900/50 border border-white/8 rounded-2xl p-5">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/20 flex items-center justify-center">
              <span className="text-brand-400 font-bold">{symbol[0]}</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">{symbol}</h1>
              <div className="text-gray-400 text-sm">{stock.name}</div>
            </div>
            <span className="ml-2 text-xs px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400">
              {stock.sector}
            </span>
          </div>
        </div>

        <div className="flex items-end gap-4">
          <div>
            <div className="text-white font-mono font-bold text-3xl">${stock.price?.toFixed(2)}</div>
            <div className={`flex items-center gap-1.5 font-mono text-sm mt-0.5 ${up ? "text-up" : "text-down"}`}>
              {up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {up ? "+" : ""}{stock.change?.toFixed(2)} ({up ? "+" : ""}{stock.change_pct?.toFixed(2)}%)
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 text-sm">
            {[
              { label: "Open", value: `$${stock.open?.toFixed(2)}` },
              { label: "High", value: `$${stock.high?.toFixed(2)}`, cls: "text-up" },
              { label: "Low", value: `$${stock.low?.toFixed(2)}`, cls: "text-down" },
              { label: "Prev Close", value: `$${stock.prev_close?.toFixed(2)}` },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-gray-500 text-xs">{item.label}</div>
                <div className={`font-mono font-medium ${item.cls ?? "text-gray-200"}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Chart */}
          <div className="bg-surface-900/50 border border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-sm">Price Chart</h2>
              <div className="flex items-center gap-2">
                {["1m"].map((iv) => (
                  <button
                    key={iv}
                    onClick={() => setInterval(iv)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      interval === iv
                        ? "bg-brand-600/20 border-brand-500/40 text-brand-400"
                        : "border-white/10 text-gray-400 hover:text-white"
                    }`}
                  >
                    {iv}
                  </button>
                ))}
                <button
                  onClick={loadCandles}
                  className="p-1.5 text-gray-400 hover:text-white border border-white/10 rounded-lg transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {candles.length > 0 ? (
              <CandlestickChart candles={candles} livePrice={stock.price} symbol={symbol} />
            ) : (
              <div className="h-[360px] flex items-center justify-center text-gray-500 text-sm">
                <div className="text-center">
                  <div className="mb-2">Accumulating candle data...</div>
                  <div className="text-xs text-gray-600">Charts appear after the first minute of trading</div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Trades */}
          <div className="bg-surface-900/50 border border-white/8 rounded-2xl p-5">
            <h2 className="text-white font-semibold text-sm mb-4">Recent Trades</h2>
            {recentTrades.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">No trades for {symbol} yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-2 px-3 text-gray-500 uppercase tracking-wider font-medium">Side</th>
                      <th className="text-right py-2 px-3 text-gray-500 uppercase tracking-wider font-medium">Qty</th>
                      <th className="text-right py-2 px-3 text-gray-500 uppercase tracking-wider font-medium">Price</th>
                      <th className="text-right py-2 px-3 text-gray-500 uppercase tracking-wider font-medium">Total</th>
                      <th className="text-right py-2 px-3 text-gray-500 uppercase tracking-wider font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrades.map((t) => (
                      <tr key={t.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded font-medium ${t.side === "buy" ? "bg-up/10 text-up" : "bg-down/10 text-down"}`}>
                            {t.side.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-gray-200 font-mono">{t.quantity}</td>
                        <td className="py-2 px-3 text-right text-gray-200 font-mono">${t.price.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-white font-mono">${t.total.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-gray-500">
                          {new Date(t.executed_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pending Orders */}
          {orders.filter((o) => o.status === "pending").length > 0 && (
            <div className="bg-surface-900/50 border border-white/8 rounded-2xl p-5">
              <h2 className="text-white font-semibold text-sm mb-4">Pending Orders</h2>
              <div className="space-y-2">
                {orders.filter((o) => o.status === "pending").map((o) => (
                  <div key={o.id} className="flex items-center justify-between py-2.5 px-3 bg-surface-900 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${o.side === "buy" ? "bg-up/10 text-up" : "bg-down/10 text-down"}`}>
                        {o.side.toUpperCase()}
                      </span>
                      <span className="text-gray-300 text-sm font-mono">{o.quantity} @ ${o.price?.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={async () => {
                        await api.cancelOrder(o.id);
                        loadOrders();
                      }}
                      className="text-xs text-gray-500 hover:text-down transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <TradePanel
            symbol={symbol}
            currentPrice={stock.price}
            onOrderFilled={handleOrderFilled}
          />
          <OrderBook symbol={symbol} />
        </div>
      </div>
    </div>
  );
}
