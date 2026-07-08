"use client";
import { useMarketWebSocket } from "@/hooks/useWebSocket";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { useMarketStore } from "@/store/useMarketStore";

/**
 * Client component that initializes the WebSocket connection
 * and loads portfolio data on mount. Rendered in the root layout.
 */
export default function MarketWebSocketProvider() {
  useMarketWebSocket();

  const { setPortfolio } = useMarketStore();

  useEffect(() => {
    const load = async () => {
      try {
        const p = await api.getPortfolio();
        setPortfolio({
          cash_balance: p.cash_balance,
          holdings: p.holdings,
          total_equity: p.total_equity,
          total_pnl: p.total_pnl,
          total_pnl_pct: p.total_pnl_pct,
        });
      } catch {}
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [setPortfolio]);

  return null;
}
