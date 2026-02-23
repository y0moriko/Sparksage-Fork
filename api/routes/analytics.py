from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from api.deps import get_current_user
import db

router = APIRouter()


@router.get("/summary")
async def get_analytics_summary(user: dict = Depends(get_current_user)):
    """Get summarized analytics for the dashboard charts."""
    summary = await db.get_analytics_summary()
    return summary


@router.get("/history")
async def get_analytics_history(
    limit: int = Query(100, ge=1, le=500),
    user: dict = Depends(get_current_user)
):
    """Get detailed analytics event history."""
    history = await db.get_analytics_history(limit=limit)
    return {"history": history}
