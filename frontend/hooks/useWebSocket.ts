"use client";
import { useEffect, useRef, useCallback } from "react";
import { useMarketStore } from "@/store/useMarketStore";
import { api } from "@/lib/api";
import type { StockSnapshot } from "@/lib/api";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export function useMarketWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setStocks, updatePrice, setConnected } = useMarketStore();
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const ws = new WebSocket(`${WS_BASE}/ws/market`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);

        if (msg.type === "snapshot") {
          setStocks(msg.stocks as StockSnapshot[]);
        } else if (msg.type === "price_update") {
          updatePrice(msg.stocks as StockSnapshot[]);
        }
      } catch {}
    };

    ws.onclose = () => {
      setConnected(false);

      if (mountedRef.current) {
        reconnectTimer.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => {
      ws.close();
    };

    // Send ping every 20 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send("ping");
      }
    }, 20000);

    ws.addEventListener("close", () => clearInterval(pingInterval));
  }, [setStocks, updatePrice, setConnected]);

  useEffect(() => {
    mountedRef.current = true;

    // Initial data fetch (fallback if WS not ready)
    api.getStocks().then(({ stocks }) => setStocks(stocks)).catch(() => {});
    connect();

    return () => {
      mountedRef.current = false;

      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }

      wsRef.current?.close();
    };
  }, [connect, setStocks]);
}

export function useTradeWebSocket(onTrade: (trade: unknown) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const ws = new WebSocket(`${WS_BASE}/ws/trades`);
    wsRef.current = ws;

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);

        if (msg.type === "trade_executed") {
          onTrade(msg.trade);
        }
      } catch {}
    };

    ws.onclose = () => {
      if (mountedRef.current) {
        reconnectTimer.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => ws.close();
  }, [onTrade]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;

      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }

      wsRef.current?.close();
    };
  }, [connect]);
}
