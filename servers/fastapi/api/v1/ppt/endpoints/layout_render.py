from typing import Any, Dict

from fastapi import APIRouter
from pydantic import BaseModel

from services.layout_renderer import render_slide

LAYOUT_RENDER_ROUTER = APIRouter(prefix="/layout", tags=["Layout"])


class LayoutRenderRequest(BaseModel):
    slide: Dict[str, Any]


class LayoutRenderResponse(BaseModel):
    success: bool
    html: str


@LAYOUT_RENDER_ROUTER.post("/render", response_model=LayoutRenderResponse)
async def render_layout_slide(payload: LayoutRenderRequest):
    """Render a single layout slide into deterministic HTML."""
    html_content = render_slide(payload.slide)
    return LayoutRenderResponse(success=True, html=html_content)
