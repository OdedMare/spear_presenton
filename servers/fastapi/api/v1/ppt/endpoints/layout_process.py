import logging
import os
import tempfile
import uuid
from typing import List, Optional

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from constants.documents import POWERPOINT_TYPES
from service.layout_extractor import parse_pptx_to_layouts
from api.v1.ppt.endpoints import pptx_slides as pptx_slides_module
from api.v1.ppt.endpoints.pptx_slides import FontAnalysisResult
from utils.asset_directory_utils import get_images_directory

LAYOUT_PROCESS_ROUTER = APIRouter(prefix="/layout", tags=["Layout"])
logger = logging.getLogger(__name__)


class LayoutSlide(BaseModel):
    id: str
    index: int
    width: int
    height: int
    background: Optional[dict] = None
    fonts: List[str]
    elements: List[dict]


class LayoutProcessResponse(BaseModel):
    success: bool
    slides: List[LayoutSlide]
    fonts: Optional[FontAnalysisResult] = None
    total_slides: int


@LAYOUT_PROCESS_ROUTER.post("/process", response_model=LayoutProcessResponse)
async def process_pptx_to_layout(
    pptx_file: UploadFile = File(..., description="PPTX file to process"),
    fonts: Optional[List[UploadFile]] = File(
        None, description="Optional font files to install before parsing"
    ),
):
    """Extract deterministic layout JSON for each slide directly from OOXML."""
    if pptx_file.content_type not in POWERPOINT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Expected PPTX file, got {pptx_file.content_type}",
        )

    with tempfile.TemporaryDirectory() as temp_dir:
        pptx_path = os.path.join(temp_dir, "presentation.pptx")
        pptx_content = await pptx_file.read()
        with open(pptx_path, "wb") as fp:
            fp.write(pptx_content)

        if fonts:
            await pptx_slides_module._install_fonts(fonts, temp_dir)

        presentation_id = uuid.uuid4()
        images_dir = get_images_directory()
        presentation_images_dir = os.path.join(images_dir, str(presentation_id))
        os.makedirs(presentation_images_dir, exist_ok=True)
        asset_url_prefix = f"/app_data/images/{presentation_id}"

        slides = parse_pptx_to_layouts(pptx_path, presentation_images_dir, asset_url_prefix)
        logger.info("layout/process extracted %s slides from %s", len(slides), pptx_file.filename)

        slide_xmls = pptx_slides_module._extract_slide_xmls(pptx_path, temp_dir)
        font_analysis = await pptx_slides_module.analyze_fonts_in_all_slides(slide_xmls)

        return LayoutProcessResponse(
            success=True,
            slides=[
                LayoutSlide(
                    id=slide["id"],
                    index=slide["index"],
                    width=slide["width"],
                    height=slide["height"],
                    background=slide.get("background"),
                    fonts=slide.get("fonts", []),
                    elements=slide.get("elements", []),
                )
                for slide in slides
            ],
            fonts=font_analysis,
            total_slides=len(slides),
        )
