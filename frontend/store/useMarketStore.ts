/**
 * Zustand global store for market data, portfolio, and orders.
 */
import { create } from "zustand";
import type { StockSnapshot, Holding, Order, Trade } from "@/lib/api";

interface MarketState {
  stocks: Record<string, StockSnapshot>;
  orderedSymbols: string[];
  cash: number;
  holdings: Holding[];
  totalEquity: number;
  totalPnl: number;
  totalPnlPct: number;
  recentTrades: Trade[];
  orders: Order[];
  isConnected: boolean;

  // Actions
  setStocks: (stocks: StockSnapshot[]) => void;
  updatePrice: (stocks: StockSnapshot[]) => void;
  setCash: (amount: number) => void;
  setHoldings: (holdings: Holding[]) => void;
  setPortfolio: (data: {
    cash_balance: number;
    holdings: Holding[];
    total_equity: number;
    total_pnl: number;
    total_pnl_pct: number;
  }) => void;
  addTrade: (trade: Trade) => void;
  setOrders: (orders: Order[]) => void;
  setConnected: (v: boolean) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  stocks: {},
  orderedSymbols: [],
  cash: 100_000,
  holdings: [],
  totalEquity: 100_000,
  totalPnl: 0,
  totalPnlPct: 0,
  recentTrades: [],
  orders: [],
  isConnected: false,

  setStocks: (stocks) =>
    set(() => {
      const map: Record<string, StockSnapshot> = {};
      const symbols: string[] = [];
      for (const s of stocks) {
        map[s.symbol] = s;
        symbols.push(s.symbol);
      }
      return { stocks: map, orderedSymbols: symbols };
    }),

  updatePrice: (incoming) =>
    set((state) => {
      const updated = { ...state.stocks };
      for (const s of incoming) {
        updated[s.symbol] = { ...updated[s.symbol], ...s };
      }
      return { stocks: updated };
    }),

  setCash: (amount) => set({ cash: amount }),

  setHoldings: (holdings) => set({ holdings }),

  setPortfolio: ({ cash_balance, holdings, total_equity, total_pnl, total_pnl_pct }) =>
    set({
      cash: cash_balance,
      holdings,
      totalEquity: total_equity,
      totalPnl: total_pnl,
      totalPnlPct: total_pnl_pct,
    }),

  addTrade: (trade) =>
    set((state) => ({
      recentTrades: [trade, ...state.recentTrades].slice(0, 100),
    })),

  setOrders: (orders) => set({ orders }),

  setConnected: (v) => set({ isConnected: v }),
}));
