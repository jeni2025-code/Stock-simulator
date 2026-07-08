from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from database import get_db
from models import Stock, PriceHistory
from simulator import get_all_prices, get_price
from typing import Optional

router = APIRouter(prefix="/stocks", tags=["stocks"])


@router.get("")
async def list_stocks(db: AsyncSession = Depends(get_db)):
    """Return all stocks with live prices from simulator."""
    live = get_all_prices()
    return {"stocks": live}


@router.get("/{symbol}")
async def get_stock(symbol: str, db: AsyncSession = Depends(get_db)):
    """Get single stock detail."""
    result = await db.execute(select(Stock).where(Stock.symbol == symbol.upper()))
    stock = result.scalars().first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")

    live_price = get_price(symbol.upper())
    return {
        "id": stock.id,
        "symbol": stock.symbol,
        "name": stock.name,
        "sector": stock.sector,
        "price": live_price or stock.current_price,
        "open": stock.open_price,
        "high": stock.high_price,
        "low": stock.low_price,
        "prev_close": stock.prev_close,
        "volume": stock.volume,
        "market_cap": stock.market_cap,
        "volatility": stock.volatility,
    }


@router.get("/{symbol}/history")
async def get_history(
    symbol: str,
    interval: Optional[str] = "1m",
    limit: Optional[int] = 120,
    db: AsyncSession = Depends(get_db),
):
    """Return OHLCV candle history for a stock."""
    result = await db.execute(
        select(PriceHistory)
        .where(PriceHistory.symbol == symbol.upper(), PriceHistory.interval == interval)
        .order_by(desc(PriceHistory.timestamp))
        .limit(limit)
    )
    candles = result.scalars().all()
    candles_sorted = sorted(candles, key=lambda c: c.timestamp)
    return {
        "symbol": symbol.upper(),
        "interval": interval,
        "candles": [
            {
                "time": int(c.timestamp.timestamp()),
                "open": c.open,
                "high": c.high,
                "low": c.low,
                "close": c.close,
                "volume": c.volume,
            }
            for c in candles_sorted
        ],
    }
