from typing import Optional
from models.llm_message import LLMSystemMessage, LLMUserMessage
from models.presentation_layout import PresentationLayoutModel
from models.presentation_outline_model import PresentationOutlineModel
from services.llm_client import LLMClient
from utils.llm_client_error_handler import handle_llm_client_exceptions
from utils.llm_provider import get_model
from utils.get_dynamic_models import get_presentation_structure_model_with_n_slides
from models.presentation_structure_model import PresentationStructureModel
from utils.model_capabilities import is_small_model


def get_messages(
    presentation_layout: PresentationLayoutModel,
    n_slides: int,
    data: str,
    instructions: Optional[str] = None,
    model: Optional[str] = None,
):
    """
    Get messages for structure generation.

    For small models, returns simplified prompt focused on layout selection.
    For large models, returns full design philosophy prompt.
    """
    # Simplified prompt for small models
    if model and is_small_model(model):
        return [
            LLMSystemMessage(
                content=f"""
You are a presentation designer. Select the best layout for each slide.

{presentation_layout.to_string()}

{"# User Instructions: " + instructions if instructions else ""}

Key Rules:
1. Match layout to content purpose
2. Opening/closing slides → Title layouts
3. Data/metrics → Chart layouts
4. Comparisons → Side-by-side layouts
5. Create visual variety
6. Select layout index for all {n_slides} slides

Choose layouts that make the presentation engaging and clear.
                """,
            ),
            LLMUserMessage(
                content=f"{data}",
            ),
        ]

    # Full prompt for large models
    return [
        LLMSystemMessage(
            content=f"""
                You're a professional presentation designer with creative freedom to design engaging presentations.

                {presentation_layout.to_string()}

                # DESIGN PHILOSOPHY
                - Create visually compelling and varied presentations
                - Match layout to content purpose and audience needs
                - Prioritize engagement over rigid formatting rules

                # Layout Selection Guidelines
                1. **Content-driven choices**: Let the slide's purpose guide layout selection
                - Opening/closing → Title layouts
                - Processes/workflows → Visual process layouts
                - Comparisons/contrasts → Side-by-side layouts
                - Data/metrics → Chart/graph layouts
                - Concepts/ideas → Image + text layouts
                - Key insights → Emphasis layouts

                2. **Visual variety**: Aim for diverse, engaging presentation flow
                - Mix text-heavy and visual-heavy slides naturally
                - Use your judgment on when repetition serves the content
                - Balance information density across slides

                3. **Audience experience**: Consider how slides work together
                - Create natural transitions between topics
                - Use layouts that enhance comprehension
                - Design for maximum impact and retention

                **Trust your design instincts. Focus on creating the most effective presentation for the content and audience.**

                {"# User Instruction:" if instructions else ""}
                {instructions or ""}

                User intruction should be taken into account while creating the presentation structure, except for number of slides.

                Select layout index for each of the {n_slides} slides based on what will best serve the presentation's goals.
            """,
        ),
        LLMUserMessage(
            content=f"""
                {data}
            """,
        ),
    ]


def get_messages_for_slides_markdown(
    presentation_layout: PresentationLayoutModel,
    n_slides: int,
    data: str,
    instructions: Optional[str] = None,
    model: Optional[str] = None,
):
    """Get messages for markdown-based structure generation."""
    # Simplified prompt for small models
    if model and is_small_model(model):
        return [
            LLMSystemMessage(
                content=f"""
You are a presentation designer. Select layouts that match slide content.

{"# User Instructions: " + instructions if instructions else ""}

{presentation_layout.to_string()}

Select layout index for each of the {n_slides} slides.
                """,
            ),
            LLMUserMessage(
                content=f"{data}",
            ),
        ]

    # Full prompt for large models
    return [
        LLMSystemMessage(
            content=f"""
                You're a professional presentation designer with creative freedom to design engaging presentations.

                {"# User Instruction:" if instructions else ""}
                {instructions or ""}

                {presentation_layout.to_string()}

                Select layout that best matches the content of the slides.

                User intruction should be taken into account while creating the presentation structure, except for number of slides.

                Select layout index for each of the {n_slides} slides based on what will best serve the presentation's goals.
            """,
        ),
        LLMUserMessage(
            content=f"""
                {data}
            """,
        ),
    ]


async def generate_presentation_structure(
    presentation_outline: PresentationOutlineModel,
    presentation_layout: PresentationLayoutModel,
    instructions: Optional[str] = None,
    using_slides_markdown: bool = False,
) -> PresentationStructureModel:

    client = LLMClient()
    model = get_model()
    response_model = get_presentation_structure_model_with_n_slides(
        len(presentation_outline.slides)
    )

    try:
        response = await client.generate_structured(
            model=model,
            messages=(
                get_messages_for_slides_markdown(
                    presentation_layout,
                    len(presentation_outline.slides),
                    presentation_outline.to_string(),
                    instructions,
                    model,  # Pass model for adaptive prompt selection
                )
                if using_slides_markdown
                else get_messages(
                    presentation_layout,
                    len(presentation_outline.slides),
                    presentation_outline.to_string(),
                    instructions,
                    model,  # Pass model for adaptive prompt selection
                )
            ),
            response_format=response_model.model_json_schema(),
            strict=True,
        )
        return PresentationStructureModel(**response)
    except Exception as e:
        raise handle_llm_client_exceptions(e)
