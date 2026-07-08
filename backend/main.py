"""
Real-Time Stock Exchange Simulator — FastAPI Backend
Main entrypoint: starts the API, WebSocket server, and GBM price simulator.
"""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from database import init_db, AsyncSessionLocal
from models import Stock, CashAccount
from seed_data import STOCKS
from simulator import tick, load_price_state
from websocket_manager import manager
from routers import stocks, orders, portfolio


# ─── Startup / Shutdown ───────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database
    await init_db()
    await seed_database()
    await load_price_state()

    # Start GBM tick scheduler (every 1 second)
    scheduler = AsyncIOScheduler()
    scheduler.add_job(tick, "interval", seconds=1, id="price_tick")
    scheduler.start()
    app.state.scheduler = scheduler

    yield

    scheduler.shutdown()


async def seed_database():
    """Insert seed stocks if DB is empty."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Stock))
        existing = result.scalars().first()
        if existing:
            return  # Already seeded

        for s in STOCKS:
            stock = Stock(
                symbol=s["symbol"],
                name=s["name"],
                sector=s["sector"],
                current_price=s["current_price"],
                open_price=s["current_price"],
                high_price=s["current_price"],
                low_price=s["current_price"],
                prev_close=s["current_price"],
                volume=0,
                market_cap=s["market_cap"],
                volatility=s["volatility"],
                drift=s["drift"],
            )
            db.add(stock)

        # Create cash account with $100,000
        cash = CashAccount(balance=100_000.0)
        db.add(cash)
        await db.commit()


# ─── App Setup ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Stock Exchange Simulator API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(stocks.router)
app.include_router(orders.router)
app.include_router(portfolio.router)


# ─── WebSocket Endpoints ──────────────────────────────────────────────────────

@app.websocket("/ws/market")
async def ws_market(websocket: WebSocket):
    """WebSocket for live market price updates."""
    await manager.connect(websocket, "market")
    try:
        # Send current snapshot on connect
        from simulator import get_all_prices
        prices = get_all_prices()
        import json
        from datetime import datetime, timezone
        await websocket.send_text(json.dumps({
            "type": "snapshot",
            "stocks": prices,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }))
        while True:
            # Keep connection alive — client sends pings
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.websocket("/ws/trades")
async def ws_trades(websocket: WebSocket):
    """WebSocket for live trade execution events."""
    await manager.connect(websocket, "trades")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.websocket("/ws/portfolio")
async def ws_portfolio(websocket: WebSocket):
    """WebSocket for portfolio updates."""
    await manager.connect(websocket, "portfolio")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "message": "Stock Exchange Simulator running 🚀"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
