"""
Endpoint to save extracted layout as a reusable template.
"""

import json
import os
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

from utils.get_env import get_app_data_directory_env


TEMPLATE_SAVE_ROUTER = APIRouter(prefix="/template", tags=["Template"])


class LayoutTemplate(BaseModel):
    """A saved layout template."""
    id: str
    name: str
    description: Optional[str] = None
    slides: List[dict]  # List of layout JSON for each slide
    width_px: int
    height_px: int
    fonts: List[str] = []


class SaveTemplateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    slides: List[dict]  # Layout JSON from /layout/process
    width_px: int
    height_px: int
    fonts: List[str] = []


class SaveTemplateResponse(BaseModel):
    success: bool
    template_id: str
    message: str


@TEMPLATE_SAVE_ROUTER.post("/save", response_model=SaveTemplateResponse)
async def save_layout_template(request: SaveTemplateRequest):
    """
    Save an extracted layout as a reusable template.

    The layout should come from /layout/process endpoint.
    This saves it to the filesystem for reuse.
    """
    import uuid

    # Generate template ID
    template_id = str(uuid.uuid4())

    # Get templates directory
    app_data_dir = get_app_data_directory_env()
    templates_dir = os.path.join(app_data_dir, "layout_templates")
    os.makedirs(templates_dir, exist_ok=True)

    # Create template data
    template_data = {
        "id": template_id,
        "name": request.name,
        "description": request.description,
        "slides": request.slides,
        "width_px": request.width_px,
        "height_px": request.height_px,
        "fonts": request.fonts,
    }

    # Save to file
    template_file = os.path.join(templates_dir, f"{template_id}.json")
    with open(template_file, "w") as f:
        json.dump(template_data, f, indent=2)

    return SaveTemplateResponse(
        success=True,
        template_id=template_id,
        message=f"Template '{request.name}' saved successfully",
    )


@TEMPLATE_SAVE_ROUTER.get("/list")
async def list_templates():
    """List all saved layout templates."""
    app_data_dir = get_app_data_directory_env()
    templates_dir = os.path.join(app_data_dir, "layout_templates")

    if not os.path.exists(templates_dir):
        return {"templates": []}

    templates = []
    for filename in os.listdir(templates_dir):
        if filename.endswith(".json"):
            filepath = os.path.join(templates_dir, filename)
            with open(filepath, "r") as f:
                template_data = json.load(f)
                templates.append({
                    "id": template_data["id"],
                    "name": template_data["name"],
                    "description": template_data.get("description"),
                    "num_slides": len(template_data.get("slides", [])),
                })

    return {"templates": templates}


@TEMPLATE_SAVE_ROUTER.get("/{template_id}")
async def get_template(template_id: str):
    """Get a specific template by ID."""
    app_data_dir = get_app_data_directory_env()
    templates_dir = os.path.join(app_data_dir, "layout_templates")
    template_file = os.path.join(templates_dir, f"{template_id}.json")

    if not os.path.exists(template_file):
        raise HTTPException(status_code=404, detail="Template not found")

    with open(template_file, "r") as f:
        template_data = json.load(f)

    return template_data
