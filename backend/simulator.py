"""
Geometric Brownian Motion (GBM) Price Simulator.

dS = S * (mu * dt + sigma * sqrt(dt) * Z)
where Z ~ N(0,1)

Ticks every second. Updates all stock prices and broadcasts via WebSocket.
Also records 1-minute OHLCV candles.
"""

import numpy as np
import asyncio
from datetime import datetime, timezone
from sqlalchemy import select, update
from database import AsyncSessionLocal
from models import Stock, PriceHistory, CashAccount
from websocket_manager import manager
from typing import Dict, Any

# In-memory price state for fast access
_price_state: Dict[str, Dict[str, Any]] = {}
# Candle accumulator: symbol -> current candle data
_candle_accum: Dict[str, Dict[str, Any]] = {}
_tick_count: int = 0


async def load_price_state():
    """Load initial stock prices into memory."""
    global _price_state, _candle_accum
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Stock))
        stocks = result.scalars().all()
        for s in stocks:
            _price_state[s.symbol] = {
                "id": s.id,
                "symbol": s.symbol,
                "name": s.name,
                "sector": s.sector,
                "price": s.current_price,
                "open": s.open_price,
                "high": s.high_price,
                "low": s.low_price,
                "prev_close": s.prev_close,
                "volume": s.volume,
                "volatility": s.volatility,
                "drift": s.drift,
                "market_cap": s.market_cap,
            }
            _candle_accum[s.symbol] = {
                "open": s.current_price,
                "high": s.current_price,
                "low": s.current_price,
                "close": s.current_price,
                "volume": 0,
                "start_time": datetime.now(timezone.utc),
            }


def _gbm_tick(price: float, mu: float, sigma: float, dt: float = 1.0) -> float:
    """Calculate next price using GBM formula."""
    z = np.random.standard_normal()
    next_price = price * np.exp((mu - 0.5 * sigma ** 2) * dt + sigma * np.sqrt(dt) * z)
    return round(max(next_price, 0.01), 2)


async def tick():
    """Main tick function — called every second by APScheduler."""
    global _tick_count
    _tick_count += 1

    updates = []
    broadcast_data = []

    for symbol, state in _price_state.items():
        old_price = state["price"]
        new_price = _gbm_tick(old_price, state["drift"], state["volatility"])

        # Update intraday H/L
        state["price"] = new_price
        state["high"] = max(state["high"], new_price)
        state["low"] = min(state["low"], new_price)

        # Simulate volume: random small trade sizes
        tick_volume = int(np.random.exponential(500))
        state["volume"] = state["volume"] + tick_volume

        # Update candle accumulator
        candle = _candle_accum[symbol]
        candle["high"] = max(candle["high"], new_price)
        candle["low"] = min(candle["low"], new_price)
        candle["close"] = new_price
        candle["volume"] += tick_volume

        pct_change = ((new_price - state["prev_close"]) / state["prev_close"]) * 100

        updates.append({
            "symbol": symbol,
            "price": new_price,
            "high": state["high"],
            "low": state["low"],
            "volume": state["volume"],
        })

        broadcast_data.append({
            "symbol": symbol,
            "name": state["name"],
            "sector": state["sector"],
            "price": new_price,
            "prev_close": state["prev_close"],
            "open": state["open"],
            "high": state["high"],
            "low": state["low"],
            "volume": state["volume"],
            "change": round(new_price - state["prev_close"], 2),
            "change_pct": round(pct_change, 2),
            "market_cap": state["market_cap"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    # Broadcast to all market subscribers
    await manager.broadcast("market", {
        "type": "price_update",
        "stocks": broadcast_data,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    # Persist to DB every 10 ticks (every ~10 seconds)
    if _tick_count % 10 == 0:
        async with AsyncSessionLocal() as db:
            for upd in updates:
                await db.execute(
                    update(Stock)
                    .where(Stock.symbol == upd["symbol"])
                    .values(
                        current_price=upd["price"],
                        high_price=upd["high"],
                        low_price=upd["low"],
                        volume=upd["volume"],
                    )
                )
            await db.commit()

    # Save 1-minute candle every 60 ticks
    if _tick_count % 60 == 0:
        await _save_candles()


async def _save_candles():
    """Save accumulated 1-minute OHLCV candles to the DB."""
    async with AsyncSessionLocal() as db:
        for symbol, candle in _candle_accum.items():
            state = _price_state[symbol]
            ph = PriceHistory(
                stock_id=state["id"],
                symbol=symbol,
                open=candle["open"],
                high=candle["high"],
                low=candle["low"],
                close=candle["close"],
                volume=candle["volume"],
                timestamp=candle["start_time"],
                interval="1m",
            )
            db.add(ph)
            # Reset candle
            now = datetime.now(timezone.utc)
            _candle_accum[symbol] = {
                "open": candle["close"],
                "high": candle["close"],
                "low": candle["close"],
                "close": candle["close"],
                "volume": 0,
                "start_time": now,
            }
        await db.commit()


def get_price(symbol: str) -> float | None:
    """Get current in-memory price for a symbol."""
    state = _price_state.get(symbol)
    return state["price"] if state else None


def get_all_prices() -> list:
    """Return all current prices as a list."""
    return list(_price_state.values())
