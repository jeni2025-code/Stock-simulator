from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel, Field
from typing import Optional, Literal
from database import get_db
from models import Order, Stock
from order_engine import execute_order

router = APIRouter(prefix="/orders", tags=["orders"])


class PlaceOrderRequest(BaseModel):
    symbol: str
    order_type: Literal["market", "limit"]
    side: Literal["buy", "sell"]
    quantity: int = Field(gt=0)
    price: Optional[float] = None  # Required for limit orders


@router.post("")
async def place_order(req: PlaceOrderRequest, db: AsyncSession = Depends(get_db)):
    """Place a new buy or sell order."""
    symbol = req.symbol.upper()

    # Validate stock exists
    result = await db.execute(select(Stock).where(Stock.symbol == symbol))
    stock = result.scalars().first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")

    if req.order_type == "limit" and req.price is None:
        raise HTTPException(status_code=400, detail="Limit orders require a price")

    # Create the order
    order = Order(
        stock_id=stock.id,
        symbol=symbol,
        order_type=req.order_type,
        side=req.side,
        quantity=req.quantity,
        price=req.price,
        status="pending",
    )
    db.add(order)
    await db.flush()  # get order.id

    # Attempt to execute
    exec_result = await execute_order(order, db)
    if exec_result.get("pending"):
        # Limit order queued
        await db.commit()
        return {
            "order_id": order.id,
            "status": "pending",
            "message": exec_result.get("message", "Order queued"),
        }
    elif not exec_result.get("success"):
        await db.rollback()
        raise HTTPException(status_code=400, detail=exec_result.get("error", "Order failed"))

    return {
        "order_id": order.id,
        "status": "filled",
        **exec_result,
    }


@router.get("")
async def list_orders(
    status: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """List all orders, optionally filtered by status."""
    query = select(Order).order_by(desc(Order.created_at)).limit(limit)
    if status:
        query = query.where(Order.status == status)
    result = await db.execute(query)
    orders = result.scalars().all()
    return {
        "orders": [
            {
                "id": o.id,
                "symbol": o.symbol,
                "order_type": o.order_type,
                "side": o.side,
                "quantity": o.quantity,
                "price": o.price,
                "status": o.status,
                "filled_quantity": o.filled_quantity,
                "filled_price": o.filled_price,
                "created_at": o.created_at.isoformat(),
            }
            for o in orders
        ]
    }


@router.delete("/{order_id}")
async def cancel_order(order_id: int, db: AsyncSession = Depends(get_db)):
    """Cancel a pending order."""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot cancel order with status '{order.status}'")
    order.status = "cancelled"
    await db.commit()
    return {"message": "Order cancelled", "order_id": order_id}
