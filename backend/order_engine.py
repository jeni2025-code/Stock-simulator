"""
Order Matching Engine.
Handles market and limit order execution.
Updates portfolio and cash account accordingly.
"""

from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from models import Order, Trade, Portfolio, CashAccount, Stock
from websocket_manager import manager
from simulator import get_price


async def get_or_create_cash(db: AsyncSession) -> CashAccount:
    result = await db.execute(select(CashAccount))
    cash = result.scalars().first()
    if not cash:
        cash = CashAccount(balance=100_000.0)
        db.add(cash)
        await db.commit()
        await db.refresh(cash)
    return cash


async def get_or_create_holding(db: AsyncSession, symbol: str) -> Portfolio:
    result = await db.execute(select(Portfolio).where(Portfolio.symbol == symbol))
    holding = result.scalars().first()
    if not holding:
        holding = Portfolio(symbol=symbol, quantity=0, avg_buy_price=0.0, total_invested=0.0)
        db.add(holding)
        await db.flush()
    return holding


async def execute_order(order: Order, db: AsyncSession) -> dict:
    """
    Execute an order immediately (market) or check if limit price is met.
    Returns execution result dict.
    """
    current_price = get_price(order.symbol)
    if current_price is None:
        return {"success": False, "error": "Symbol not found in simulator"}

    execute_price = current_price

    # Limit order price check
    if order.order_type == "limit":
        if order.side == "buy" and order.price < current_price:
            return {"success": False, "pending": True, "message": "Limit order queued"}
        if order.side == "sell" and order.price > current_price:
            return {"success": False, "pending": True, "message": "Limit order queued"}
        execute_price = order.price

    total_value = execute_price * order.quantity

    cash = await get_or_create_cash(db)
    holding = await get_or_create_holding(db, order.symbol)

    if order.side == "buy":
        if cash.balance < total_value:
            return {"success": False, "error": f"Insufficient funds. Need ${total_value:.2f}, have ${cash.balance:.2f}"}

        # Deduct cash
        cash.balance = round(cash.balance - total_value, 2)

        # Update holding (weighted avg buy price)
        new_total_qty = holding.quantity + order.quantity
        if holding.quantity == 0:
            new_avg = execute_price
        else:
            new_avg = (holding.total_invested + total_value) / new_total_qty
        holding.quantity = new_total_qty
        holding.avg_buy_price = round(new_avg, 4)
        holding.total_invested = round(holding.total_invested + total_value, 2)

    elif order.side == "sell":
        if holding.quantity < order.quantity:
            return {"success": False, "error": f"Insufficient shares. Have {holding.quantity}, selling {order.quantity}"}

        # Credit cash
        cash.balance = round(cash.balance + total_value, 2)
        holding.quantity -= order.quantity
        holding.total_invested = round(holding.avg_buy_price * holding.quantity, 2)
        if holding.quantity == 0:
            holding.avg_buy_price = 0.0
            holding.total_invested = 0.0

    # Update order status
    order.status = "filled"
    order.filled_quantity = order.quantity
    order.filled_price = execute_price
    order.updated_at = datetime.now(timezone.utc)

    # Record trade
    trade = Trade(
        symbol=order.symbol,
        side=order.side,
        quantity=order.quantity,
        price=execute_price,
        total=round(total_value, 2),
        order_id=order.id,
        executed_at=datetime.now(timezone.utc),
    )
    db.add(trade)
    await db.commit()
    await db.refresh(trade)

    result = {
        "success": True,
        "trade_id": trade.id,
        "symbol": trade.symbol,
        "side": trade.side,
        "quantity": trade.quantity,
        "price": trade.price,
        "total": trade.total,
        "cash_balance": cash.balance,
    }

    # Broadcast trade event
    await manager.broadcast("trades", {
        "type": "trade_executed",
        "trade": result,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return result


async def check_pending_limit_orders(db: AsyncSession):
    """
    Check all pending limit orders and execute any that can be filled.
    Called on each price tick.
    """
    result = await db.execute(
        select(Order).where(Order.status == "pending")
    )
    pending = result.scalars().all()
    for order in pending:
        current_price = get_price(order.symbol)
        if current_price is None:
            continue
        can_fill = False
        if order.side == "buy" and order.price >= current_price:
            can_fill = True
        elif order.side == "sell" and order.price <= current_price:
            can_fill = True
        if can_fill:
            await execute_order(order, db)
