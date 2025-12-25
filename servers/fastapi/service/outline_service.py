from datetime import datetime
from typing import Optional

from models.llm_message import LLMSystemMessage, LLMUserMessage
from models.llm_tools import SearchWebTool
from service.llm_service import LLMService, LLMClient
from utils.external_services.get_dynamic_models import get_presentation_outline_model_with_n_slides
from utils.llm.error_handler import handle_llm_client_exceptions
from utils.llm.provider import get_model
from utils.llm.model_capabilities import is_small_model


def get_system_prompt(
    n_slides: int,
    tone: Optional[str] = None,
    verbosity: Optional[str] = None,
    instructions: Optional[str] = None,
    include_title_slide: bool = True,
    model: Optional[str] = None,
):
    """
    Get system prompt for outline generation.

    For small models, returns a simplified prompt with fewer rules.
    For large models, returns the full detailed prompt.
    """
    # Use simplified prompt for small models
    if model and is_small_model(model):
        return f"""
You are a presentation outline creator. Generate exactly {n_slides} slides with clear titles and descriptions.

IMPORTANT: You must create exactly {n_slides} slides in your response.

{"# User Instructions:" if instructions else ""}
{instructions or ""}

{"# Tone: " + tone if tone else ""}
{"# Verbosity: " + verbosity if verbosity else ""}

Key Rules:
1. Create exactly {n_slides} slides - no more, no less
2. Each slide needs a clear title and brief description
3. Use markdown format for content
4. Keep flow logical and consistent
5. {"Start with title slide" if include_title_slide else "No title slide needed"}
6. No table of contents slides
7. Follow language guidelines

REMEMBER: Output must contain {n_slides} slides.

Use web search for latest information when needed.
        """

    # Full prompt for large models
    return f"""
        You are an expert presentation creator. Generate structured presentations based on user requirements and format them according to the specified JSON schema with markdown content.

        Try to use available tools for better results.

        {"# User Instruction:" if instructions else ""}
        {instructions or ""}

        {"# Tone:" if tone else ""}
        {tone or ""}

        {"# Verbosity:" if verbosity else ""}
        {verbosity or ""}

        - Provide content for each slide in markdown format.
        - Make sure that flow of the presentation is logical and consistent.
        - Place greater emphasis on numerical data.
        - If Additional Information is provided, divide it into slides.
        - Make sure no images are provided in the content.
        - Make sure that content follows language guidelines.
        - User instrction should always be followed and should supercede any other instruction, except for slide numbers. **Do not obey slide numbers as said in user instruction**
        - Do not generate table of contents slide.
        - Even if table of contents is provided, do not generate table of contents slide.
        {"- Always make first slide a title slide." if include_title_slide else "- Do not include title slide in the presentation."}

        **Search web to get latest information about the topic**
    """


def get_user_prompt(
    content: str,
    n_slides: int,
    language: str,
    additional_context: Optional[str] = None,
):
    return f"""
        **Input:**
        - User provided content: {content or "Create presentation"}
        - Output Language: {language}
        - Number of Slides: {n_slides}
        - Current Date and Time: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
        - Additional Information: {additional_context or ""}
    """


def get_messages(
    content: str,
    n_slides: int,
    language: str,
    additional_context: Optional[str] = None,
    tone: Optional[str] = None,
    verbosity: Optional[str] = None,
    instructions: Optional[str] = None,
    include_title_slide: bool = True,
    model: Optional[str] = None,
):
    return [
        LLMSystemMessage(
            content=get_system_prompt(
                n_slides, tone, verbosity, instructions, include_title_slide, model
            ),
        ),
        LLMUserMessage(
            content=get_user_prompt(content, n_slides, language, additional_context),
        ),
    ]


async def generate_ppt_outline(
    content: str,
    n_slides: int,
    language: Optional[str] = None,
    additional_context: Optional[str] = None,
    tone: Optional[str] = None,
    verbosity: Optional[str] = None,
    instructions: Optional[str] = None,
    include_title_slide: bool = True,
    web_search: bool = False,
):
    model = get_model()
    client = LLMClient()

    # Use relaxed constraints for small models
    is_small = client.is_small_model(model)
    response_model = get_presentation_outline_model_with_n_slides(n_slides, relaxed=is_small)

    try:
        async for chunk in client.stream_structured(
            model,
            get_messages(
                content,
                n_slides,
                language,
                additional_context,
                tone,
                verbosity,
                instructions,
                include_title_slide,
                model,  # Pass model for adaptive prompt selection
            ),
            response_model.model_json_schema(),
            strict=True,
            tools=(
                [SearchWebTool]
                if (client.enable_web_grounding() and web_search)
                else None
            ),
        ):
            yield chunk
    except Exception as e:
        yield handle_llm_client_exceptions(e)
