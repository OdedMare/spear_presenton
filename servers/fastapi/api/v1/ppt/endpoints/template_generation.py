"""
Unified template generation endpoints using deterministic pipeline.
Replaces VLM-based approach with pure code-based OOXML → HTML → React conversion.
"""

import os
import tempfile
import uuid
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from constants.documents import POWERPOINT_TYPES
from services.layout_extractor import parse_pptx_to_layouts, ParsedSlide
from services.layout_renderer import render_slide
from services.html_to_react_converter import convert_html_to_react
from services.html_text_editor import (
    TextEdit,
    edit_html_text,
    extract_editable_elements,
    find_text_by_content,
)
from api.v1.ppt.endpoints import pptx_slides as pptx_slides_module
from api.v1.ppt.endpoints.pptx_slides import FontAnalysisResult
from utils.asset_directory_utils import get_images_directory


TEMPLATE_GENERATION_ROUTER = APIRouter(
    prefix="/template", tags=["Template Generation"]
)


# ============================================================================
# Request/Response Models
# ============================================================================


class SlideLayoutData(BaseModel):
    """Complete slide data with all representations."""

    slide_number: int
    layout_json: Dict[str, Any]
    html: str
    react_component: Optional[str] = None
    fonts: List[str]


class TemplateGenerationResponse(BaseModel):
    """Response from template generation endpoint."""

    success: bool
    slides: List[SlideLayoutData]
    total_slides: int
    fonts: Optional[FontAnalysisResult] = None
    presentation_id: str
    message: Optional[str] = None


class HTMLRenderRequest(BaseModel):
    """Request to render layout JSON to HTML."""

    slides: List[Dict[str, Any]]


class HTMLRenderResponse(BaseModel):
    """Response from HTML rendering."""

    success: bool
    html_slides: List[str]
    message: Optional[str] = None


class ReactConversionRequest(BaseModel):
    """Request to convert HTML to React."""

    html: str
    fonts: Optional[List[str]] = None
    component_name: Optional[str] = "SlideLayout"


class ReactConversionResponse(BaseModel):
    """Response from React conversion."""

    success: bool
    react_component: str
    message: Optional[str] = None


class TextEditRequest(BaseModel):
    """Request to edit HTML text."""

    html: str
    edits: List[TextEdit]


class TextEditResponse(BaseModel):
    """Response from text editing."""

    success: bool
    edited_html: str
    message: Optional[str] = None


class ExtractEditableRequest(BaseModel):
    """Request to extract editable elements."""

    html: str


class ExtractEditableResponse(BaseModel):
    """Response with editable elements."""

    success: bool
    elements: List[Dict[str, Any]]
    message: Optional[str] = None


class FindTextRequest(BaseModel):
    """Request to find text selector."""

    html: str
    search_text: str


class FindTextResponse(BaseModel):
    """Response with text selector."""

    success: bool
    selector: Optional[str]
    message: Optional[str] = None


# ============================================================================
# Endpoints
# ============================================================================


@TEMPLATE_GENERATION_ROUTER.post(
    "/generate", response_model=TemplateGenerationResponse
)
async def generate_template_from_pptx(
    pptx_file: UploadFile = File(..., description="PPTX file to process"),
    fonts: Optional[List[UploadFile]] = File(
        None, description="Optional font files to install"
    ),
    include_react: bool = False,
):
    """
    Complete deterministic pipeline: PPTX → Layout JSON → HTML → React.

    This endpoint:
    1. Parses PPTX to extract layout JSON (positions, sizes, colors, etc.)
    2. Renders layout JSON to pixel-accurate HTML
    3. Optionally converts HTML to React components
    4. Returns all representations for flexible use

    Args:
        pptx_file: PPTX file to process
        fonts: Optional font files to install before processing
        include_react: Whether to include React component conversion (slower)

    Returns:
        TemplateGenerationResponse with slides in multiple formats
    """
    try:
        # Validate PPTX file
        if pptx_file.content_type not in POWERPOINT_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Expected PPTX, got {pptx_file.content_type}",
            )

        with tempfile.TemporaryDirectory() as temp_dir:
            # Save uploaded PPTX file
            pptx_path = os.path.join(temp_dir, "presentation.pptx")
            pptx_content = await pptx_file.read()
            with open(pptx_path, "wb") as fp:
                fp.write(pptx_content)

            # Install fonts if provided
            if fonts:
                await pptx_slides_module._install_fonts(fonts, temp_dir)

            # Generate unique presentation ID for asset storage
            presentation_id = str(uuid.uuid4())
            images_dir = get_images_directory()
            presentation_images_dir = os.path.join(images_dir, presentation_id)
            os.makedirs(presentation_images_dir, exist_ok=True)
            asset_url_prefix = f"/app_data/images/{presentation_id}"

            # Step 1: Extract layout JSON from PPTX
            print(f"Extracting layouts from PPTX...")
            slides = parse_pptx_to_layouts(
                pptx_path, presentation_images_dir, asset_url_prefix
            )
            print(f"Extracted {len(slides)} slides")

            # Step 2: Analyze fonts
            slide_xmls = pptx_slides_module._extract_slide_xmls(pptx_path, temp_dir)
            font_analysis = await pptx_slides_module.analyze_fonts_in_all_slides(
                slide_xmls
            )
            print(
                f"Font analysis: {len(font_analysis.internally_supported_fonts)} supported, "
                f"{len(font_analysis.not_supported_fonts)} not supported"
            )

            # Step 3: Render each slide to HTML
            print("Rendering slides to HTML...")
            slides_data: List[SlideLayoutData] = []

            for slide in slides:
                # Convert slide to dict for JSON serialization
                slide_dict = {
                    "width_px": slide.width_px,
                    "height_px": slide.height_px,
                    "background": slide.background,
                    "fonts": slide.fonts,
                    "elements": slide.elements,
                    "index": slide.index,
                    "id": slide.id,
                }

                # Render to HTML
                html_content = render_slide(slide_dict)

                # Optionally convert to React
                react_component = None
                if include_react:
                    try:
                        # Get font URLs for this slide
                        font_urls = []
                        for font_name in slide.fonts:
                            # Find matching font in analysis
                            for supported_font in font_analysis.internally_supported_fonts:
                                if supported_font["name"] == font_name:
                                    font_urls.append(supported_font["google_fonts_url"])
                                    break

                        react_component = convert_html_to_react(
                            html_content,
                            fonts=font_urls,
                            component_name=f"Slide{slide.index}Layout",
                        )
                    except Exception as e:
                        print(f"Warning: Failed to convert slide {slide.index} to React: {e}")
                        # Continue without React component

                slides_data.append(
                    SlideLayoutData(
                        slide_number=slide.index,
                        layout_json=slide_dict,
                        html=html_content,
                        react_component=react_component,
                        fonts=slide.fonts,
                    )
                )

            print(f"Successfully processed {len(slides_data)} slides")

            return TemplateGenerationResponse(
                success=True,
                slides=slides_data,
                total_slides=len(slides_data),
                fonts=font_analysis,
                presentation_id=presentation_id,
                message=f"Successfully processed {len(slides_data)} slides",
            )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating template: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Error generating template: {str(e)}"
        )


@TEMPLATE_GENERATION_ROUTER.post("/render-html", response_model=HTMLRenderResponse)
async def render_layouts_to_html(request: HTMLRenderRequest):
    """
    Render layout JSON to HTML (deterministic, no VLM).

    Args:
        request: List of layout JSON objects

    Returns:
        HTMLRenderResponse with rendered HTML for each slide
    """
    try:
        html_slides = []

        for slide_dict in request.slides:
            html_content = render_slide(slide_dict)
            html_slides.append(html_content)

        return HTMLRenderResponse(
            success=True,
            html_slides=html_slides,
            message=f"Rendered {len(html_slides)} slides to HTML",
        )

    except Exception as e:
        print(f"Error rendering HTML: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error rendering HTML: {str(e)}")


@TEMPLATE_GENERATION_ROUTER.post(
    "/html-to-react", response_model=ReactConversionResponse
)
async def convert_html_to_react_endpoint(request: ReactConversionRequest):
    """
    Convert HTML to React component (deterministic, no VLM).

    Args:
        request: HTML content, fonts, and component name

    Returns:
        ReactConversionResponse with React component code
    """
    try:
        if not request.html or not request.html.strip():
            raise HTTPException(status_code=400, detail="HTML content cannot be empty")

        react_component = convert_html_to_react(
            request.html, fonts=request.fonts, component_name=request.component_name
        )

        return ReactConversionResponse(
            success=True,
            react_component=react_component,
            message="Successfully converted HTML to React component",
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error converting to React: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error converting to React: {str(e)}"
        )


@TEMPLATE_GENERATION_ROUTER.post("/edit-text", response_model=TextEditResponse)
async def edit_html_text_endpoint(request: TextEditRequest):
    """
    Edit HTML text without vision models.

    Args:
        request: HTML content and list of text edits

    Returns:
        TextEditResponse with edited HTML
    """
    try:
        if not request.html or not request.html.strip():
            raise HTTPException(status_code=400, detail="HTML content cannot be empty")

        if not request.edits:
            raise HTTPException(status_code=400, detail="Edits list cannot be empty")

        edited_html = edit_html_text(request.html, request.edits)

        return TextEditResponse(
            success=True,
            edited_html=edited_html,
            message=f"Successfully applied {len(request.edits)} edit(s)",
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error editing HTML: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error editing HTML: {str(e)}")


@TEMPLATE_GENERATION_ROUTER.post(
    "/extract-editable", response_model=ExtractEditableResponse
)
async def extract_editable_elements_endpoint(request: ExtractEditableRequest):
    """
    Extract list of editable text elements from HTML.

    Args:
        request: HTML content

    Returns:
        ExtractEditableResponse with list of editable elements
    """
    try:
        if not request.html or not request.html.strip():
            raise HTTPException(status_code=400, detail="HTML content cannot be empty")

        elements = extract_editable_elements(request.html)

        return ExtractEditableResponse(
            success=True,
            elements=elements,
            message=f"Found {len(elements)} editable element(s)",
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error extracting editable elements: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error extracting editable elements: {str(e)}"
        )


@TEMPLATE_GENERATION_ROUTER.post("/find-text", response_model=FindTextResponse)
async def find_text_selector_endpoint(request: FindTextRequest):
    """
    Find CSS selector for text content.

    Args:
        request: HTML content and search text

    Returns:
        FindTextResponse with selector for matching text
    """
    try:
        if not request.html or not request.html.strip():
            raise HTTPException(status_code=400, detail="HTML content cannot be empty")

        if not request.search_text or not request.search_text.strip():
            raise HTTPException(status_code=400, detail="Search text cannot be empty")

        selector = find_text_by_content(request.html, request.search_text)

        if selector:
            return FindTextResponse(
                success=True,
                selector=selector,
                message=f"Found text at selector: {selector}",
            )
        else:
            return FindTextResponse(
                success=False, selector=None, message="Text not found in HTML"
            )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error finding text: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error finding text: {str(e)}")
