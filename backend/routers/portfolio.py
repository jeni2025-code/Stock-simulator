from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from database import get_db
from models import Portfolio, CashAccount, Trade
from order_engine import get_or_create_cash
from simulator import get_price

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("")
async def get_portfolio(db: AsyncSession = Depends(get_db)):
    """Return full portfolio: holdings, cash, total P&L."""
    cash = await get_or_create_cash(db)

    result = await db.execute(select(Portfolio).where(Portfolio.quantity > 0))
    holdings = result.scalars().all()

    holdings_data = []
    total_market_value = 0.0
    total_invested = 0.0

    for h in holdings:
        current_price = get_price(h.symbol) or h.avg_buy_price
        market_value = current_price * h.quantity
        pnl = market_value - h.total_invested
        pnl_pct = (pnl / h.total_invested * 100) if h.total_invested > 0 else 0.0

        total_market_value += market_value
        total_invested += h.total_invested

        holdings_data.append({
            "symbol": h.symbol,
            "quantity": h.quantity,
            "avg_buy_price": h.avg_buy_price,
            "current_price": current_price,
            "total_invested": h.total_invested,
            "market_value": round(market_value, 2),
            "pnl": round(pnl, 2),
            "pnl_pct": round(pnl_pct, 2),
        })

    total_pnl = total_market_value - total_invested
    total_equity = cash.balance + total_market_value

    return {
        "cash_balance": round(cash.balance, 2),
        "total_market_value": round(total_market_value, 2),
        "total_invested": round(total_invested, 2),
        "total_pnl": round(total_pnl, 2),
        "total_pnl_pct": round((total_pnl / total_invested * 100) if total_invested > 0 else 0.0, 2),
        "total_equity": round(total_equity, 2),
        "holdings": holdings_data,
    }


@router.get("/trades")
async def get_trade_history(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Return recent trade history."""
    result = await db.execute(
        select(Trade).order_by(desc(Trade.executed_at)).limit(limit)
    )
    trades = result.scalars().all()
    return {
        "trades": [
            {
                "id": t.id,
                "symbol": t.symbol,
                "side": t.side,
                "quantity": t.quantity,
                "price": t.price,
                "total": t.total,
                "executed_at": t.executed_at.isoformat(),
            }
            for t in trades
        ]
    }
