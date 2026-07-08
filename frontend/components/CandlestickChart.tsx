"use client";
import { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";
import type { Candle } from "@/lib/api";

interface CandlestickChartProps {
  candles: Candle[];
  livePrice?: number;
  symbol: string;
}

export default function CandlestickChart({ candles, livePrice, symbol }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const candleSeriesRef = useRef<ReturnType<ReturnType<typeof createChart>["addCandlestickSeries"]> | null>(null);
  const volumeSeriesRef = useRef<ReturnType<ReturnType<typeof createChart>["addHistogramSeries"]> | null>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: "#29a3ff44" },
        horzLine: { color: "#29a3ff44" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.1)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.1)",
        timeVisible: true,
        secondsVisible: false,
      },
      width: containerRef.current.clientWidth,
      height: 360,
    });

    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    const volumeSeries = chart.addHistogramSeries({
      color: "#29a3ff",
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    if (candles.length > 0) {
      candleSeries.setData(candles.map((c) => ({
        time: c.time as import("lightweight-charts").Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })));
      volumeSeries.setData(candles.map((c) => ({
        time: c.time as import("lightweight-charts").Time,
        value: c.volume,
        color: c.close >= c.open ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)",
      })));
      chart.timeScale().fitContent();
    }

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update last candle when live price changes
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || candles.length === 0) return;
    const last = candles[candles.length - 1];
    const lp = livePrice ?? last.close;
    candleSeriesRef.current.update({
      time: last.time as import("lightweight-charts").Time,
      open: last.open,
      high: Math.max(last.high, lp),
      low: Math.min(last.low, lp),
      close: lp,
    });
    volumeSeriesRef.current.update({
      time: last.time as import("lightweight-charts").Time,
      value: last.volume,
      color: lp >= last.open ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)",
    });
  }, [livePrice, candles]);

  return (
    <div className="relative">
      <div className="flex items-center gap-3 mb-3 text-xs text-gray-400 font-mono">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-up inline-block" /> Up candle
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-down inline-block" /> Down candle
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <span className="w-2 h-2 rounded-full bg-brand-400 opacity-60 inline-block" /> Volume
        </span>
      </div>
      <div ref={containerRef} className="w-full rounded-xl overflow-hidden" />
    </div>
  );
}
