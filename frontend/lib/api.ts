/**
 * REST API client for the FastAPI backend.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface StockSnapshot {
  id: number;
  symbol: string;
  name: string;
  sector: string;
  price: number;
  open: number;
  high: number;
  low: number;
  prev_close: number;
  volume: number;
  change: number;
  change_pct: number;
  market_cap: number;
  volatility?: number;
  drift?: number;
  timestamp?: string;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Order {
  id: number;
  symbol: string;
  order_type: "market" | "limit";
  side: "buy" | "sell";
  quantity: number;
  price: number | null;
  status: string;
  filled_quantity: number;
  filled_price: number | null;
  created_at: string;
}

export interface Holding {
  symbol: string;
  quantity: number;
  avg_buy_price: number;
  current_price: number;
  total_invested: number;
  market_value: number;
  pnl: number;
  pnl_pct: number;
}

export interface Portfolio {
  cash_balance: number;
  total_market_value: number;
  total_invested: number;
  total_pnl: number;
  total_pnl_pct: number;
  total_equity: number;
  holdings: Holding[];
}

export interface Trade {
  id: number;
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  total: number;
  executed_at: string;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "API Error");
  }
  return res.json();
}

export const api = {
  // Stocks
  getStocks: () => apiFetch<{ stocks: StockSnapshot[] }>("/stocks"),
  getStock: (symbol: string) => apiFetch<StockSnapshot>(`/stocks/${symbol}`),
  getHistory: (symbol: string, interval = "1m", limit = 120) =>
    apiFetch<{ symbol: string; interval: string; candles: Candle[] }>(
      `/stocks/${symbol}/history?interval=${interval}&limit=${limit}`
    ),

  // Orders
  placeOrder: (data: {
    symbol: string;
    order_type: "market" | "limit";
    side: "buy" | "sell";
    quantity: number;
    price?: number;
  }) =>
    apiFetch<{ order_id: number; status: string; [key: string]: unknown }>(
      "/orders",
      { method: "POST", body: JSON.stringify(data) }
    ),
  getOrders: (status?: string) =>
    apiFetch<{ orders: Order[] }>(`/orders${status ? `?status=${status}` : ""}`),
  cancelOrder: (id: number) =>
    apiFetch<{ message: string }>(`/orders/${id}`, { method: "DELETE" }),

  // Portfolio
  getPortfolio: () => apiFetch<Portfolio>("/portfolio"),
  getTrades: (limit = 50) => apiFetch<{ trades: Trade[] }>(`/portfolio/trades?limit=${limit}`),
};
