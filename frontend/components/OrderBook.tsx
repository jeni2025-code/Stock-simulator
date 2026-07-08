"use client";
import { useEffect, useRef, useState } from "react";
import { useMarketStore } from "@/store/useMarketStore";

interface OrderBookProps {
  symbol: string;
}

interface OrderLevel {
  price: number;
  size: number;
  total: number;
}

function generateOrderBook(midPrice: number, spread = 0.05, levels = 10) {
  const bids: OrderLevel[] = [];
  const asks: OrderLevel[] = [];
  let bidTotal = 0;
  let askTotal = 0;

  for (let i = 0; i < levels; i++) {
    const bidPrice = parseFloat((midPrice * (1 - spread * (i + 1) * 0.2)).toFixed(2));
    const askPrice = parseFloat((midPrice * (1 + spread * (i + 1) * 0.2)).toFixed(2));
    const bidSize = Math.floor(Math.random() * 500 + 50);
    const askSize = Math.floor(Math.random() * 500 + 50);
    bidTotal += bidSize;
    askTotal += askSize;
    bids.push({ price: bidPrice, size: bidSize, total: bidTotal });
    asks.push({ price: askPrice, size: askSize, total: askTotal });
  }

  return { bids, asks };
}

export default function OrderBook({ symbol }: OrderBookProps) {
  const { stocks } = useMarketStore();
  const stock = stocks[symbol];
  const price = stock?.price ?? 0;

  const [book, setBook] = useState(() => generateOrderBook(price));
  const prevPrice = useRef(price);

  useEffect(() => {
    if (price === 0) return;
    // Regenerate order book on each price tick with slight mutation
    if (Math.abs(price - prevPrice.current) > 0 || Math.random() < 0.3) {
      setBook((prev) => {
        const newBids = prev.bids.map((b, i) => ({
          price: parseFloat((price * (1 - 0.05 * (i + 1) * 0.2)).toFixed(2)),
          size: Math.max(10, b.size + Math.floor((Math.random() - 0.5) * 100)),
          total: 0,
        }));
        const newAsks = prev.asks.map((a, i) => ({
          price: parseFloat((price * (1 + 0.05 * (i + 1) * 0.2)).toFixed(2)),
          size: Math.max(10, a.size + Math.floor((Math.random() - 0.5) * 100)),
          total: 0,
        }));
        // Recalc totals
        let bt = 0, at = 0;
        for (const b of newBids) { bt += b.size; b.total = bt; }
        for (const a of newAsks) { at += a.size; a.total = at; }
        return { bids: newBids, asks: newAsks };
      });
      prevPrice.current = price;
    }
  }, [price]);

  const maxTotal = Math.max(
    book.bids[book.bids.length - 1]?.total ?? 1,
    book.asks[book.asks.length - 1]?.total ?? 1
  );

  const spread = book.asks[0] && book.bids[0]
    ? (book.asks[0].price - book.bids[0].price).toFixed(2)
    : "—";

  return (
    <div className="bg-surface-850/80 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Order Book</h3>
        <div className="text-xs text-gray-400 font-mono">
          Spread: <span className="text-gray-200">${spread}</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 px-4 py-2 text-[10px] text-gray-500 uppercase tracking-wider border-b border-white/5">
        <span>Price</span>
        <span className="text-center">Size</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (sell orders) — reversed so highest is at top */}
      <div className="px-2 py-1">
        {[...book.asks].reverse().map((a, i) => (
          <div key={i} className="relative grid grid-cols-3 px-2 py-[3px] text-xs font-mono rounded group hover:bg-white/[0.03]">
            <div
              className="absolute right-0 top-0 bottom-0 bg-down/10 rounded"
              style={{ width: `${(a.total / maxTotal) * 100}%` }}
            />
            <span className="text-down relative z-10">${a.price.toFixed(2)}</span>
            <span className="text-gray-300 text-center relative z-10">{a.size.toLocaleString()}</span>
            <span className="text-gray-500 text-right relative z-10">{a.total.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Mid price */}
      <div className="px-4 py-2.5 bg-surface-900/60 border-y border-white/5 flex items-center justify-between">
        <span className="text-white font-mono font-bold text-base">${price.toFixed(2)}</span>
        <span className={`text-xs font-mono ${(stock?.change_pct ?? 0) >= 0 ? "text-up" : "text-down"}`}>
          {(stock?.change_pct ?? 0) >= 0 ? "▲" : "▼"} {Math.abs(stock?.change_pct ?? 0).toFixed(2)}%
        </span>
      </div>

      {/* Bids (buy orders) */}
      <div className="px-2 py-1">
        {book.bids.map((b, i) => (
          <div key={i} className="relative grid grid-cols-3 px-2 py-[3px] text-xs font-mono rounded group hover:bg-white/[0.03]">
            <div
              className="absolute right-0 top-0 bottom-0 bg-up/10 rounded"
              style={{ width: `${(b.total / maxTotal) * 100}%` }}
            />
            <span className="text-up relative z-10">${b.price.toFixed(2)}</span>
            <span className="text-gray-300 text-center relative z-10">{b.size.toLocaleString()}</span>
            <span className="text-gray-500 text-right relative z-10">{b.total.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
