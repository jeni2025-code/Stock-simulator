"use client";
import { useState } from "react";
import { useMarketStore } from "@/store/useMarketStore";
import { api } from "@/lib/api";
import { ShoppingCart, TrendingDown, Loader2, CheckCircle, XCircle } from "lucide-react";

interface TradePanelProps {
  symbol: string;
  currentPrice: number;
  onOrderFilled?: () => void;
}

type Side = "buy" | "sell";
type OrderType = "market" | "limit";

export default function TradePanel({ symbol, currentPrice, onOrderFilled }: TradePanelProps) {
  const { cash, holdings } = useMarketStore();
  const [side, setSide] = useState<Side>("buy");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [quantity, setQuantity] = useState("");
  const [limitPrice, setLimitPrice] = useState(currentPrice.toFixed(2));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const holding = holdings.find((h) => h.symbol === symbol);
  const sharesOwned = holding?.quantity ?? 0;
  const execPrice = orderType === "market" ? currentPrice : parseFloat(limitPrice);
  const qty = parseInt(quantity) || 0;
  const totalCost = qty * execPrice;
  const maxBuy = Math.floor(cash / execPrice);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qty <= 0) return;
    setLoading(true);
    setMessage(null);
    try {
      const result = await api.placeOrder({
        symbol,
        order_type: orderType,
        side,
        quantity: qty,
        price: orderType === "limit" ? parseFloat(limitPrice) : undefined,
      });
      const verb = side === "buy" ? "Bought" : "Sold";
      setMessage({
        type: "success",
        text: result.status === "filled"
          ? `✓ ${verb} ${qty} ${symbol} @ $${(result.price as number)?.toFixed(2) ?? execPrice.toFixed(2)}`
          : `⏳ Limit order queued for ${qty} ${symbol}`,
      });
      setQuantity("");
      onOrderFilled?.();
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Order failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-850/80 border border-white/10 rounded-2xl p-5">
      <h3 className="text-white font-semibold text-base mb-4">Place Order</h3>

      {/* Buy / Sell toggle */}
      <div className="flex bg-surface-900 rounded-xl p-1 mb-4">
        <button
          onClick={() => setSide("buy")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            side === "buy"
              ? "bg-up text-white shadow-lg shadow-up/30"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <ShoppingCart className="w-4 h-4 inline mr-1.5 mb-0.5" />
          Buy
        </button>
        <button
          onClick={() => setSide("sell")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            side === "sell"
              ? "bg-down text-white shadow-lg shadow-down/30"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <TrendingDown className="w-4 h-4 inline mr-1.5 mb-0.5" />
          Sell
        </button>
      </div>

      {/* Order Type */}
      <div className="flex gap-2 mb-4">
        {(["market", "limit"] as OrderType[]).map((t) => (
          <button
            key={t}
            onClick={() => setOrderType(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all capitalize ${
              orderType === t
                ? "border-brand-500/60 bg-brand-500/10 text-brand-400"
                : "border-white/10 text-gray-400 hover:border-white/20"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Limit Price */}
        {orderType === "limit" && (
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Limit Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-brand-500/60 focus:bg-surface-850 transition-all"
            />
          </div>
        )}

        {/* Quantity */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs text-gray-400">Quantity</label>
            {side === "buy" && (
              <button
                type="button"
                onClick={() => setQuantity(String(maxBuy))}
                className="text-[11px] text-brand-400 hover:text-brand-300 transition-colors"
              >
                Max ({maxBuy})
              </button>
            )}
            {side === "sell" && sharesOwned > 0 && (
              <button
                type="button"
                onClick={() => setQuantity(String(sharesOwned))}
                className="text-[11px] text-brand-400 hover:text-brand-300 transition-colors"
              >
                All ({sharesOwned})
              </button>
            )}
          </div>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-brand-500/60 focus:bg-surface-850 transition-all"
          />
        </div>

        {/* Summary */}
        <div className="bg-surface-900 rounded-xl p-3 space-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-gray-400">Price</span>
            <span className="text-white">${execPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Quantity</span>
            <span className="text-white">{qty || "—"}</span>
          </div>
          <div className="flex justify-between border-t border-white/5 pt-2 mt-2">
            <span className="text-gray-300 font-semibold">Total</span>
            <span className={`font-semibold ${qty > 0 ? "text-white" : "text-gray-500"}`}>
              ${qty > 0 ? totalCost.toFixed(2) : "—"}
            </span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-500">Cash Available</span>
            <span className="text-gray-300">${cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          {sharesOwned > 0 && (
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-500">Shares Owned</span>
              <span className="text-gray-300">{sharesOwned}</span>
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div
            className={`flex items-center gap-2 p-3 rounded-xl text-xs ${
              message.type === "success"
                ? "bg-up/10 border border-up/20 text-up"
                : "bg-down/10 border border-down/20 text-down"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || qty <= 0}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            side === "buy"
              ? "bg-up hover:bg-up/90 text-white shadow-lg shadow-up/20 disabled:opacity-40"
              : "bg-down hover:bg-down/90 text-white shadow-lg shadow-down/20 disabled:opacity-40"
          }`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {side === "buy" ? "Buy" : "Sell"} {symbol}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
