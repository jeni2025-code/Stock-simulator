from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base


class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    sector = Column(String, nullable=False)
    current_price = Column(Float, nullable=False)
    open_price = Column(Float, nullable=False)
    high_price = Column(Float, nullable=False)
    low_price = Column(Float, nullable=False)
    prev_close = Column(Float, nullable=False)
    volume = Column(Integer, default=0)
    market_cap = Column(Float, nullable=False)
    volatility = Column(Float, default=0.02)  # daily volatility for GBM
    drift = Column(Float, default=0.0001)     # drift for GBM

    orders = relationship("Order", back_populates="stock")
    price_history = relationship("PriceHistory", back_populates="stock")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)
    symbol = Column(String, nullable=False)
    order_type = Column(String, nullable=False)   # "market" | "limit"
    side = Column(String, nullable=False)          # "buy" | "sell"
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=True)           # None for market orders
    status = Column(String, default="pending")     # pending | filled | cancelled | partial
    filled_quantity = Column(Integer, default=0)
    filled_price = Column(Float, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    stock = relationship("Stock", back_populates="orders")


class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, nullable=False)
    side = Column(String, nullable=False)   # "buy" | "sell"
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    executed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Portfolio(Base):
    __tablename__ = "portfolio"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, nullable=False)
    quantity = Column(Integer, default=0)
    avg_buy_price = Column(Float, default=0.0)
    total_invested = Column(Float, default=0.0)


class CashAccount(Base):
    __tablename__ = "cash_account"

    id = Column(Integer, primary_key=True, index=True)
    balance = Column(Float, default=100000.0)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)
    symbol = Column(String, nullable=False)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Integer, default=0)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    interval = Column(String, default="1m")  # 1m, 5m, 1h

    stock = relationship("Stock", back_populates="price_history")
