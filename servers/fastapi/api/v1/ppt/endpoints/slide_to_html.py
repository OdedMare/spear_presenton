import os
import base64
import asyncio
from datetime import datetime
from io import BytesIO
from typing import Optional, List, Dict, Tuple
from uuid import UUID
from fastapi import APIRouter, HTTPException, File, UploadFile, Form, Depends
from pydantic import BaseModel
from openai import OpenAI
from openai import APIError
from PIL import Image
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func
from utils.asset_directory_utils import get_images_directory
from services.database import get_async_session
from models.sql.presentation_layout_code import PresentationLayoutCodeModel
from .prompts import (
    GENERATE_HTML_SYSTEM_PROMPT,
    HTML_TO_REACT_SYSTEM_PROMPT,
    HTML_EDIT_SYSTEM_PROMPT,
)
from models.sql.template import TemplateModel
from utils.get_env import (
    get_custom_llm_api_key_env,
    get_custom_llm_url_env,
    get_custom_model_env,
    get_custom_template_llm_url_env,
    get_custom_template_llm_api_key_env,
    get_custom_template_model_env,
)


def _get_custom_ai_client():
    base_url = get_custom_template_llm_url_env() or get_custom_llm_url_env()
    model = get_custom_template_model_env() or get_custom_model_env()
    api_key = (
        get_custom_template_llm_api_key_env()
        or get_custom_llm_api_key_env()
        or "null"
    )

    if not base_url:
        raise HTTPException(
            status_code=500, detail="CUSTOM_LLM_URL environment variable not set"
        )
    if not model:
        raise HTTPException(
            status_code=500, detail="CUSTOM_MODEL environment variable not set"
        )
    return OpenAI(base_url=base_url, api_key=api_key), model

# Create separate routers for each functionality
SLIDE_TO_HTML_ROUTER = APIRouter(prefix="/slide-to-html", tags=["slide-to-html"])
HTML_TO_REACT_ROUTER = APIRouter(prefix="/html-to-react", tags=["html-to-react"])
HTML_EDIT_ROUTER = APIRouter(prefix="/html-edit", tags=["html-edit"])
LAYOUT_MANAGEMENT_ROUTER = APIRouter(
    prefix="/template-management", tags=["template-management"]
)


# Request/Response models for slide-to-html endpoint
class SlideToHtmlRequest(BaseModel):
    image: str  # Partial path to image file (e.g., "/app_data/images/uuid/slide_1.png")
    xml: str  # OXML content as text
    fonts: Optional[List[str]] = None  # Optional normalized root fonts for this slide


class SlideToHtmlResponse(BaseModel):
    success: bool
    html: str


# Request/Response models for html-edit endpoint
class HtmlEditResponse(BaseModel):
    success: bool
    edited_html: str
    message: Optional[str] = None


# Request/Response models for html-to-react endpoint
class HtmlToReactRequest(BaseModel):
    html: str  # HTML content to convert to React component
    image: Optional[str] = None  # Optional image path to provide visual context


class HtmlToReactResponse(BaseModel):
    success: bool
    react_component: str
    message: Optional[str] = None


# Request/Response models for layout management endpoints
class LayoutData(BaseModel):
    presentation: UUID  # UUID of the presentation
    layout_id: str  # Unique identifier for the layout
    layout_name: str  # Display name of the layout
    layout_code: str  # TSX/React component code for the layout
    fonts: Optional[List[str]] = None  # Optional list of font links


class SaveLayoutsRequest(BaseModel):
    layouts: list[LayoutData]


class SaveLayoutsResponse(BaseModel):
    success: bool
    saved_count: int
    message: Optional[str] = None


class GetLayoutsResponse(BaseModel):
    success: bool
    layouts: list[LayoutData]
    message: Optional[str] = None
    template: Optional[dict] = None
    fonts: Optional[List[str]] = None


class PresentationSummary(BaseModel):
    presentation_id: UUID
    layout_count: int
    last_updated_at: Optional[datetime] = None
    template: Optional[dict] = None


class GetPresentationSummaryResponse(BaseModel):
    success: bool
    presentations: List[PresentationSummary]
    total_presentations: int
    total_layouts: int
    message: Optional[str] = None


class ErrorResponse(BaseModel):
    success: bool = False
    detail: str
    error_code: Optional[str] = None


class TemplateCreateRequest(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None


class TemplateCreateResponse(BaseModel):
    success: bool
    template: dict
    message: Optional[str] = None


class TemplateInfo(BaseModel):
    id: UUID
    name: Optional[str] = None
    description: Optional[str] = None
    created_at: Optional[datetime] = None


def _minify_ooxml(xml_text: str, max_chars: int = 12000) -> str:
    """
    Remove excess whitespace/comments from OXML to save tokens before sending to the LLM.
    """
    if not xml_text:
        return ""
    cleaned = " ".join(xml_text.split())
    if max_chars and len(cleaned) > max_chars:
        return cleaned[:max_chars]
    return cleaned


def _encode_slide_image(path: str) -> Tuple[str, str]:
    """
    Resize/compress slide image before encoding to keep payloads well under provider limits.
    """
    max_edge_px = 1600
    jpeg_quality = 82

    with Image.open(path) as img:
        format_hint = "PNG" if img.mode in ("RGBA", "LA") else "JPEG"
        if max(img.size) > max_edge_px:
            resample_mode = getattr(Image, "Resampling", Image).LANCZOS
            img.thumbnail((max_edge_px, max_edge_px), resample_mode)

        buffer = BytesIO()
        save_kwargs = {"optimize": True}
        if format_hint == "JPEG":
            img = img.convert("RGB")
            save_kwargs["quality"] = jpeg_quality
        img.save(buffer, format=format_hint, **save_kwargs)

    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    media_type = f"image/{format_hint.lower()}"
    return encoded, media_type


async def _encode_slide_image_async(path: str) -> Tuple[str, str]:
    """
    Run the heavy image encoding work in a thread so we do not block the event loop.
    """
    return await asyncio.to_thread(_encode_slide_image, path)


def _call_chat_completion_text(
    client: OpenAI,
    model: str,
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.0,
    max_tokens: int = 4096,
) -> str:
    """
    Helper to call the /v1/chat/completions endpoint and safely extract text output.
    """
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": user_prompt})

    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )

    # Prefer standard completion choices.
    choices = getattr(response, "choices", None)
    if choices:
        first_choice = choices[0]
        message = getattr(first_choice, "message", None)
        if message:
            message_content = getattr(message, "content", None)
            if isinstance(message_content, list):
                combined = "".join(
                    part.get("text", "")
                    for part in message_content
                    if isinstance(part, dict)
                )
                if combined:
                    return combined.strip()
            message_text = getattr(message, "text", None)
            if message_text:
                return message_text.strip()
        text = getattr(first_choice, "text", None)
        if text:
            return text.strip()

    # Fallbacks for providers that expose text/output_text.
    for attr in ("output_text", "text"):
        value = getattr(response, attr, None)
        if isinstance(value, str) and value.strip():
            return value.strip()

    return ""


async def generate_html_from_slide(
    base64_image: str,
    media_type: str,
    xml_content: str,
    client: OpenAI,
    model: str,
    fonts: Optional[List[str]] = None,
) -> str:
    """
    Generate HTML content from slide image and XML using the configured custom AI provider.

    Args:
        base64_image: Base64 encoded image data
        media_type: MIME type of the image (e.g., 'image/png')
        xml_content: OXML content as text
        client: OpenAI-compatible client
        model: Model identifier to use for generation
        fonts: Optional list of normalized root font families to prefer in output

    Returns:
        Generated HTML content as string

    Raises:
        HTTPException: If API call fails or no content is generated
    """
    print("Generating HTML from slide image and XML using custom AI provider...")
    try:
        # Compose textual prompt for the chat completions API.
        data_url = f"data:{media_type};base64,{base64_image}"
        fonts_text = (
            f"FONTS (normalized root families used in this slide, reference where needed): {', '.join(fonts)}"
            if fonts
            else ""
        )
        user_sections = [
            "You are given a slide screenshot encoded as a data URL. "
            "Recreate the design in semantic HTML + Tailwind CSS using the OXML for structure.",
            f"SLIDE_IMAGE_DATA_URL:\n{data_url}",
            "POWERPOINT_OXML_CONTENT:",
            xml_content,
        ]
        if fonts_text:
            user_sections.append(fonts_text)

        user_prompt = "\n\n".join(section for section in user_sections if section)
        system_prompt = GENERATE_HTML_SYSTEM_PROMPT.strip()

        print("Making Chat Completions API request for HTML generation...")
        html_content = _call_chat_completion_text(
            client=client,
            model=model,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.0,
            max_tokens=4096,
        )

        print(f"Received HTML content length: {len(html_content)}")

        if not html_content:
            raise HTTPException(
                status_code=500,
                detail="No HTML content generated by the custom AI provider",
            )

        return html_content

    except APIError as e:
        print(f"Custom AI API Error: {e}")
        raise HTTPException(
            status_code=500, detail=f"Custom AI error during HTML generation: {str(e)}"
        )
    except Exception as e:
        # Handle various API errors
        error_msg = str(e)
        print(f"Exception occurred: {error_msg}")
        print(f"Exception type: {type(e)}")
        if "timeout" in error_msg.lower():
            raise HTTPException(
                status_code=408,
                detail=f"Custom AI timeout during HTML generation: {error_msg}",
            )
        elif "connection" in error_msg.lower():
            raise HTTPException(
                status_code=503,
                detail=f"Custom AI connection error during HTML generation: {error_msg}",
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Custom AI error during HTML generation: {error_msg}",
            )


async def generate_react_component_from_html(
    html_content: str,
    client: OpenAI,
    model: str,
    image_base64: Optional[str] = None,
    media_type: Optional[str] = None,
) -> str:
    """
    Convert HTML content to TSX React component using the configured custom AI provider.

    Args:
        html_content: Generated HTML content
        client: OpenAI-compatible client
        model: Model identifier

    Returns:
        Generated TSX React component code as string

    Raises:
        HTTPException: If API call fails or no content is generated
    """
    try:
        print("Making Chat Completions API request for React component generation...")

        user_sections = [
            "Convert the provided HTML into a reusable TSX React component. "
            "Preserve structure, Tailwind classes, and responsiveness.",
        ]

        if image_base64 and media_type:
            data_url = f"data:{media_type};base64,{image_base64}"
            user_sections.append(f"REFERENCE_SLIDE_IMAGE_DATA_URL:\n{data_url}")

        user_sections.extend(["HTML_INPUT:", html_content])
        user_prompt = "\n\n".join(section for section in user_sections if section)

        react_content = _call_chat_completion_text(
            client=client,
            model=model,
            system_prompt=HTML_TO_REACT_SYSTEM_PROMPT.strip(),
            user_prompt=user_prompt,
            temperature=0.0,
            max_tokens=4096,
        )

        print(f"Received React content length: {len(react_content)}")

        if not react_content:
            raise HTTPException(
                status_code=500,
                detail="No React component generated by the custom AI provider",
            )

        react_content = (
            react_content.replace("```tsx", "")
            .replace("```", "")
            .replace("typescript", "")
            .replace("javascript", "")
        )

        # Filter out lines that start with import or export
        filtered_lines = []
        for line in react_content.split("\n"):
            stripped_line = line.strip()
            if not (
                stripped_line.startswith("import ")
                or stripped_line.startswith("export ")
            ):
                filtered_lines.append(line)

        filtered_react_content = "\n".join(filtered_lines)
        print(f"Filtered React content length: {len(filtered_react_content)}")

        return filtered_react_content
    except APIError as e:
        print(f"Custom AI API Error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Custom AI error during React generation: {str(e)}",
        )
    except Exception as e:
        # Handle various API errors
        error_msg = str(e)
        print(f"Exception occurred: {error_msg}")
        print(f"Exception type: {type(e)}")
        if "timeout" in error_msg.lower():
            raise HTTPException(
                status_code=408,
                detail=f"Custom AI timeout during React generation: {error_msg}",
            )
        elif "connection" in error_msg.lower():
            raise HTTPException(
                status_code=503,
                detail=f"Custom AI connection error during React generation: {error_msg}",
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Custom AI error during React generation: {error_msg}",
            )


async def edit_html_with_images(
    current_ui_base64: str,
    sketch_base64: Optional[str],
    media_type: str,
    html_content: str,
    prompt: str,
    client: OpenAI,
    model: str,
) -> str:
    """
    Edit HTML content based on one or two images and a text prompt using the configured custom AI provider.

    Args:
        current_ui_base64: Base64 encoded current UI image data
        sketch_base64: Base64 encoded sketch/indication image data (optional)
        media_type: MIME type of the images (e.g., 'image/png')
        html_content: Current HTML content to edit
        prompt: Text prompt describing the changes
        client: OpenAI-compatible client
        model: Model identifier

    Returns:
        Edited HTML content as string

    Raises:
        HTTPException: If API call fails or no content is generated
    """
    try:
        print("Making Chat Completions API request for HTML editing...")

        current_data_url = f"data:{media_type};base64,{current_ui_base64}"
        user_sections = [
            "Update the existing HTML according to the instructions. "
            "Use the provided current UI screenshot (data URL) as context.",
            f"CURRENT_UI_IMAGE_DATA_URL:\n{current_data_url}",
        ]

        if sketch_base64:
            sketch_data_url = f"data:{media_type};base64,{sketch_base64}"
            user_sections.append(
                f"OPTIONAL_REFERENCE_SKETCH_DATA_URL:\n{sketch_data_url}"
            )

        user_sections.extend(
            [
                "CURRENT_HTML:",
                html_content,
                "INSTRUCTIONS:",
                prompt,
            ]
        )
        user_prompt = "\n\n".join(section for section in user_sections if section)

        edited_html = _call_chat_completion_text(
            client=client,
            model=model,
            system_prompt=HTML_EDIT_SYSTEM_PROMPT.strip(),
            user_prompt=user_prompt,
            temperature=0.0,
            max_tokens=4096,
        )

        print(f"Received edited HTML content length: {len(edited_html)}")

        if not edited_html:
            raise HTTPException(
                status_code=500,
                detail="No edited HTML content generated by the custom AI provider",
            )

        return edited_html

    except APIError as e:
        print(f"Custom AI API Error: {e}")
        raise HTTPException(
            status_code=500, detail=f"Custom AI error during HTML editing: {str(e)}"
        )
    except Exception as e:
        # Handle various API errors
        error_msg = str(e)
        print(f"Exception occurred: {error_msg}")
        print(f"Exception type: {type(e)}")
        if "timeout" in error_msg.lower():
            raise HTTPException(
                status_code=408,
                detail=f"Custom AI timeout during HTML editing: {error_msg}",
            )
        elif "connection" in error_msg.lower():
            raise HTTPException(
                status_code=503,
                detail=f"Custom AI connection error during HTML editing: {error_msg}",
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Custom AI error during HTML editing: {error_msg}",
            )


# ENDPOINT 1: Slide to HTML conversion
@SLIDE_TO_HTML_ROUTER.post("/", response_model=SlideToHtmlResponse)
async def convert_slide_to_html(request: SlideToHtmlRequest):
    """
    Convert a slide image and its OXML data to HTML using the configured custom AI provider.

    Args:
        request: JSON request containing image path and XML content

    Returns:
        SlideToHtmlResponse with generated HTML
    """
    try:
        client, model = _get_custom_ai_client()

        # Resolve image path to actual file system path
        image_path = request.image

        # Handle different path formats
        if image_path.startswith("/app_data/images/"):
            # Remove the /app_data/images/ prefix and join with actual images directory
            relative_path = image_path[len("/app_data/images/") :]
            actual_image_path = os.path.join(get_images_directory(), relative_path)
        elif image_path.startswith("/static/"):
            # Handle static files
            relative_path = image_path[len("/static/") :]
            actual_image_path = os.path.join("static", relative_path)
        else:
            # Assume it's already a full path or relative to images directory
            if os.path.isabs(image_path):
                actual_image_path = image_path
            else:
                actual_image_path = os.path.join(get_images_directory(), image_path)

        # Check if image file exists
        if not os.path.exists(actual_image_path):
            raise HTTPException(
                status_code=404, detail=f"Image file not found: {image_path}"
            )

        # Resize/compress and encode the image off the main thread to keep requests light.
        base64_image, media_type = await _encode_slide_image_async(actual_image_path)

        # Generate HTML using the extracted function
        html_content = await generate_html_from_slide(
            base64_image=base64_image,
            media_type=media_type,
            xml_content=_minify_ooxml(request.xml),
            client=client,
            model=model,
            fonts=request.fonts,
        )

        html_content = html_content.replace("```html", "").replace("```", "")

        return SlideToHtmlResponse(success=True, html=html_content)

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the full error for debugging
        print(f"Unexpected error during slide to HTML processing: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error processing slide to HTML: {str(e)}"
        )


# ENDPOINT 2: HTML to React component conversion
@HTML_TO_REACT_ROUTER.post("/", response_model=HtmlToReactResponse)
async def convert_html_to_react(request: HtmlToReactRequest):
    """
    Convert HTML content to TSX React component using the configured custom AI provider.

    Args:
        request: JSON request containing HTML content

    Returns:
        HtmlToReactResponse with generated React component
    """
    try:
        client, model = _get_custom_ai_client()

        # Validate HTML content
        if not request.html or not request.html.strip():
            raise HTTPException(status_code=400, detail="HTML content cannot be empty")

        # Optionally resolve image and encode to base64
        image_b64 = None
        media_type = None
        if request.image:
            image_path = request.image
            if image_path.startswith("/app_data/images/"):
                relative_path = image_path[len("/app_data/images/") :]
                actual_image_path = os.path.join(get_images_directory(), relative_path)
            elif image_path.startswith("/static/"):
                relative_path = image_path[len("/static/") :]
                actual_image_path = os.path.join("static", relative_path)
            else:
                actual_image_path = (
                    image_path
                    if os.path.isabs(image_path)
                    else os.path.join(get_images_directory(), image_path)
                )
            if os.path.exists(actual_image_path):
                image_b64, media_type = await _encode_slide_image_async(
                    actual_image_path
                )

        # Convert HTML to React component
        react_component = await generate_react_component_from_html(
            html_content=request.html,
            client=client,
            model=model,
            image_base64=image_b64,
            media_type=media_type,
        )

        react_component = react_component.replace("```tsx", "").replace("```", "")

        return HtmlToReactResponse(
            success=True,
            react_component=react_component,
            message="React component generated successfully",
        )

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the full error for debugging
        print(f"Unexpected error during HTML to React processing: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error processing HTML to React: {str(e)}"
        )


# ENDPOINT 3: HTML editing with images
@HTML_EDIT_ROUTER.post("/", response_model=HtmlEditResponse)
async def edit_html_with_images_endpoint(
    current_ui_image: UploadFile = File(..., description="Current UI image file"),
    sketch_image: Optional[UploadFile] = File(
        None, description="Sketch/indication image file (optional)"
    ),
    html: str = Form(..., description="Current HTML content to edit"),
    prompt: str = Form(..., description="Text prompt describing the changes"),
):
    """
    Edit HTML content based on one or two uploaded images and a text prompt using the configured custom AI provider.

    Args:
        current_ui_image: Uploaded current UI image file
        sketch_image: Uploaded sketch/indication image file (optional)
        html: Current HTML content to edit (form data)
        prompt: Text prompt describing the changes (form data)

    Returns:
        HtmlEditResponse with edited HTML
    """
    try:
        client, model = _get_custom_ai_client()

        # Validate inputs
        if not html or not html.strip():
            raise HTTPException(status_code=400, detail="HTML content cannot be empty")

        if not prompt or not prompt.strip():
            raise HTTPException(status_code=400, detail="Text prompt cannot be empty")

        # Validate current UI image file
        if (
            not current_ui_image.content_type
            or not current_ui_image.content_type.startswith("image/")
        ):
            raise HTTPException(
                status_code=400, detail="Current UI file must be an image"
            )

        # Validate sketch image file only if provided
        if sketch_image and (
            not sketch_image.content_type
            or not sketch_image.content_type.startswith("image/")
        ):
            raise HTTPException(status_code=400, detail="Sketch file must be an image")

        # Read and encode current UI image to base64
        current_ui_content = await current_ui_image.read()
        current_ui_base64 = base64.b64encode(current_ui_content).decode("utf-8")

        # Read and encode sketch image to base64 only if provided
        sketch_base64 = None
        if sketch_image:
            sketch_content = await sketch_image.read()
            sketch_base64 = base64.b64encode(sketch_content).decode("utf-8")

        # Use the content type from the uploaded files
        media_type = current_ui_image.content_type

        # Edit HTML using the function
        edited_html = await edit_html_with_images(
            current_ui_base64=current_ui_base64,
            sketch_base64=sketch_base64,
            media_type=media_type,
            html_content=html,
            prompt=prompt,
            client=client,
            model=model,
        )

        edited_html = edited_html.replace("```html", "").replace("```", "")

        return HtmlEditResponse(
            success=True, edited_html=edited_html, message="HTML edited successfully"
        )

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the full error for debugging
        print(f"Unexpected error during HTML editing: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error processing HTML editing: {str(e)}"
        )


# ENDPOINT 4: Save layouts for a presentation
@LAYOUT_MANAGEMENT_ROUTER.post(
    "/save-templates",
    response_model=SaveLayoutsResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def save_layouts(
    request: SaveLayoutsRequest, session: AsyncSession = Depends(get_async_session)
):
    """
    Save multiple layouts for presentations.

    Args:
        request: JSON request containing array of layout data
        session: Database session

    Returns:
        SaveLayoutsResponse with success status and count of saved layouts

    Raises:
        HTTPException: 400 for validation errors, 500 for server errors
    """
    try:
        # Validate request data
        if not request.layouts:
            raise HTTPException(status_code=400, detail="Layouts array cannot be empty")

        if len(request.layouts) > 50:  # Reasonable limit
            raise HTTPException(
                status_code=400, detail="Cannot save more than 50 layouts at once"
            )

        saved_count = 0

        for i, layout_data in enumerate(request.layouts):
            # Validate individual layout data
            if (
                not layout_data.presentation
                or not str(layout_data.presentation).strip()
            ):
                raise HTTPException(
                    status_code=400,
                    detail=f"Layout {i+1}: presentation_id cannot be empty",
                )

            if not layout_data.layout_id or not layout_data.layout_id.strip():
                raise HTTPException(
                    status_code=400, detail=f"Layout {i+1}: layout_id cannot be empty"
                )

            if not layout_data.layout_name or not layout_data.layout_name.strip():
                raise HTTPException(
                    status_code=400, detail=f"Layout {i+1}: layout_name cannot be empty"
                )

            if not layout_data.layout_code or not layout_data.layout_code.strip():
                raise HTTPException(
                    status_code=400, detail=f"Layout {i+1}: layout_code cannot be empty"
                )

            # Check if layout already exists for this presentation and layout_id
            stmt = select(PresentationLayoutCodeModel).where(
                PresentationLayoutCodeModel.presentation == layout_data.presentation,
                PresentationLayoutCodeModel.layout_id == layout_data.layout_id,
            )
            result = await session.execute(stmt)
            existing_layout = result.scalar_one_or_none()

            if existing_layout:
                # Update existing layout
                existing_layout.layout_name = layout_data.layout_name
                existing_layout.layout_code = layout_data.layout_code
                existing_layout.fonts = layout_data.fonts
                existing_layout.updated_at = datetime.now()
            else:
                # Create new layout
                new_layout = PresentationLayoutCodeModel(
                    presentation=layout_data.presentation,
                    layout_id=layout_data.layout_id,
                    layout_name=layout_data.layout_name,
                    layout_code=layout_data.layout_code,
                    fonts=layout_data.fonts,
                )
                session.add(new_layout)

            saved_count += 1

        await session.commit()

        return SaveLayoutsResponse(
            success=True,
            saved_count=saved_count,
            message=f"Successfully saved {saved_count} layout(s)",
        )

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        await session.rollback()
        raise
    except Exception as e:
        await session.rollback()
        print(f"Unexpected error saving layouts: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while saving layouts: {str(e)}",
        )


# ENDPOINT 5: Get layouts for a presentation
@LAYOUT_MANAGEMENT_ROUTER.get(
    "/get-templates/{presentation}",
    response_model=GetLayoutsResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid presentation ID"},
        404: {
            "model": ErrorResponse,
            "description": "No layouts found for presentation",
        },
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def get_layouts(
    presentation: UUID, session: AsyncSession = Depends(get_async_session)
):
    """
    Retrieve all layouts for a specific presentation.

    Args:
        presentation: UUID of the presentation
        session: Database session

    Returns:
        GetLayoutsResponse with layouts data

    Raises:
        HTTPException: 404 if no layouts found, 400 for invalid UUID, 500 for server errors
    """
    try:
        # Validate presentation_id format (basic UUID check)
        if not presentation or len(str(presentation).strip()) == 0:
            raise HTTPException(
                status_code=400, detail="Presentation ID cannot be empty"
            )

        # Query layouts for the given presentation_id
        stmt = select(PresentationLayoutCodeModel).where(
            PresentationLayoutCodeModel.presentation == presentation
        )
        result = await session.execute(stmt)
        layouts_db = result.scalars().all()

        # Check if any layouts were found
        if not layouts_db:
            raise HTTPException(
                status_code=404,
                detail=f"No layouts found for presentation ID: {presentation}",
            )

        # Convert to response format
        layouts = [
            LayoutData(
                presentation=layout.presentation,
                layout_id=layout.layout_id,
                layout_name=layout.layout_name,
                layout_code=layout.layout_code,
                fonts=layout.fonts,
            )
            for layout in layouts_db
        ]

        # Aggregate unique fonts across all layouts
        aggregated_fonts: set[str] = set()
        for layout in layouts_db:
            if layout.fonts:
                aggregated_fonts.update([f for f in layout.fonts if isinstance(f, str)])
        fonts_list = sorted(list(aggregated_fonts)) if aggregated_fonts else None

        # Fetch template meta
        template_meta = await session.get(TemplateModel, presentation)
        template = None
        if template_meta:
            template = {
                "id": template_meta.id,
                "name": template_meta.name,
                "description": template_meta.description,
                "created_at": template_meta.created_at,
            }

        return GetLayoutsResponse(
            success=True,
            layouts=layouts,
            message=f"Retrieved {len(layouts)} layout(s) for presentation {presentation}",
            template=template,
            fonts=fonts_list,
        )

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"Error retrieving layouts for presentation {presentation}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while retrieving layouts: {str(e)}",
        )


# ENDPOINT: Get all presentations with layout counts
@LAYOUT_MANAGEMENT_ROUTER.get(
    "/summary",
    response_model=GetPresentationSummaryResponse,
    summary="Get all presentations with layout counts",
    description="Retrieve a summary of all presentations and the number of layouts in each",
    responses={
        200: {
            "model": GetPresentationSummaryResponse,
            "description": "Presentations summary retrieved successfully",
        },
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def get_presentations_summary(
    session: AsyncSession = Depends(get_async_session),
):
    """
    Get summary of all presentations with their layout counts.
    """
    try:
        # Query to get presentation_id, count of layouts, and MAX(updated_at)
        stmt = select(
            PresentationLayoutCodeModel.presentation,
            func.count(PresentationLayoutCodeModel.id).label("layout_count"),
            func.max(PresentationLayoutCodeModel.updated_at).label("last_updated_at"),
        ).group_by(PresentationLayoutCodeModel.presentation)

        result = await session.execute(stmt)
        presentation_data = result.all()

        # Convert to response format with template info if available
        presentations = []
        for row in presentation_data:
            template_meta = await session.get(TemplateModel, row.presentation)
            template = None
            if template_meta:
                template = {
                    "id": template_meta.id,
                    "name": template_meta.name,
                    "description": template_meta.description,
                    "created_at": template_meta.created_at,
                }
            presentations.append(
                PresentationSummary(
                    presentation_id=row.presentation,
                    layout_count=row.layout_count,
                    last_updated_at=row.last_updated_at,
                    template=template,
                )
            )

        # Calculate totals
        total_presentations = len(presentations)
        total_layouts = sum(p.layout_count for p in presentations)

        return GetPresentationSummaryResponse(
            success=True,
            presentations=presentations,
            total_presentations=total_presentations,
            total_layouts=total_layouts,
            message=f"Retrieved {total_presentations} presentation(s) with {total_layouts} total layout(s)",
        )

    except Exception as e:
        print(f"Error retrieving presentations summary: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while retrieving presentations summary: {str(e)}",
        )


@LAYOUT_MANAGEMENT_ROUTER.post(
    "/templates",
    response_model=TemplateCreateResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def create_template(
    request: TemplateCreateRequest,
    session: AsyncSession = Depends(get_async_session),
):
    try:
        if not request.id or not request.name:
            raise HTTPException(status_code=400, detail="id and name are required")

        # Upsert template by id
        existing = await session.get(TemplateModel, request.id)
        if existing:
            existing.name = request.name
            existing.description = request.description
        else:
            session.add(
                TemplateModel(
                    id=request.id, name=request.name, description=request.description
                )
            )
        await session.commit()

        # Read back
        template = await session.get(TemplateModel, request.id)
        return TemplateCreateResponse(
            success=True,
            template={
                "id": template.id,
                "name": template.name,
                "description": template.description,
                "created_at": template.created_at,
            },
            message="Template saved",
        )
    except HTTPException:
        await session.rollback()
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to save template: {str(e)}"
        )


@LAYOUT_MANAGEMENT_ROUTER.delete("/delete-templates/{template_id}", status_code=204)
async def delete_template(
    template_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    try:
        await session.execute(
            delete(TemplateModel).where(TemplateModel.id == template_id)
        )
        await session.execute(
            delete(PresentationLayoutCodeModel).where(
                PresentationLayoutCodeModel.presentation == template_id,
            )
        )
        await session.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete template")
