from datetime import datetime
from typing import Optional
from models.llm_message import LLMSystemMessage, LLMUserMessage
from models.presentation_layout import SlideLayoutModel
from models.presentation_outline_model import SlideOutlineModel
from service.llm_service import LLMService, LLMClient
from utils.llm.error_handler import handle_llm_client_exceptions
from utils.llm.provider import get_model
from utils.llm.schema_utils import add_field_in_schema, remove_fields_from_schema


def get_system_prompt(
    tone: Optional[str] = None,
    verbosity: Optional[str] = None,
    instructions: Optional[str] = None,
):
    return f"""
        Generate structured slide based on provided outline, follow mentioned steps and notes and provide structured output.

        {"# User Instructions:" if instructions else ""}
        {instructions or ""}

        {"# Tone:" if tone else ""}
        {tone or ""}

        {"# Verbosity:" if verbosity else ""}
        {verbosity or ""}

        # Steps
        1. Analyze the outline.
        2. Generate structured slide based on the outline.
        3. Generate speaker note that is simple, clear, concise and to the point.

        # Notes
        - Slide body should not use words like "This slide", "This presentation".
        - Rephrase the slide body to make it flow naturally.
        - Only use markdown to highlight important points.
        - Make sure to follow language guidelines.
        - Speaker note should be normal text, not markdown.
        - Strictly follow the max and min character limit for every property in the slide.
        - Never ever go over the max character limit. Limit your narration to make sure you never go over the max character limit.
        - Number of items should not be more than max number of items specified in slide schema. If you have to put multiple points then merge them to obey max numebr of items.
        - Generate content as per the given tone.
        - Be very careful with number of words to generate for given field. As generating more than max characters will overflow in the design. So, analyze early and never generate more characters than allowed.
        - Do not add emoji in the content.
        - Metrics should be in abbreviated form with least possible characters. Do not add long sequence of words for metrics.
        - For verbosity:
            - If verbosity is 'concise', then generate description as 1/3 or lower of the max character limit. Don't worry if you miss content or context.
            - If verbosity is 'standard', then generate description as 2/3 of the max character limit.
            - If verbosity is 'text-heavy', then generate description as 3/4 or higher of the max character limit. Make sure it does not exceed the max character limit.

        User instructions, tone and verbosity should always be followed and should supercede any other instruction, except for max and min character limit, slide schema and number of items.

        - Provide output in json format and **don't include <parameters> tags**.

        # Image and Icon Output Format
        image: {{
            __image_prompt__: string,
        }}
        icon: {{
            __icon_query__: string,
        }}

    """


def get_user_prompt(outline: str, language: str):
    return f"""
        ## Current Date and Time
        {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

        ## Icon Query And Image Prompt Language
        English

        ## Slide Content Language
        {language}

        ## Slide Outline
        {outline}
    """


def get_messages(
    outline: str,
    language: str,
    tone: Optional[str] = None,
    verbosity: Optional[str] = None,
    instructions: Optional[str] = None,
):

    return [
        LLMSystemMessage(
            content=get_system_prompt(tone, verbosity, instructions),
        ),
        LLMUserMessage(
            content=get_user_prompt(outline, language),
        ),
    ]


async def get_slide_content_from_type_and_outline(
    slide_layout: SlideLayoutModel,
    outline: SlideOutlineModel,
    language: str,
    tone: Optional[str] = None,
    verbosity: Optional[str] = None,
    instructions: Optional[str] = None,
):
    client = LLMClient()
    model = get_model()

    response_schema = remove_fields_from_schema(
        slide_layout.json_schema, ["__image_url__", "__icon_url__"]
    )
    response_schema = add_field_in_schema(
        response_schema,
        {
            "__speaker_note__": {
                "type": "string",
                "minLength": 100,
                "maxLength": 250,
                "description": "Speaker note for the slide",
            }
        },
        True,
    )

    try:
        response = await client.generate_structured(
            model=model,
            messages=get_messages(
                outline.content,
                language,
                tone,
                verbosity,
                instructions,
            ),
            response_format=response_schema,
            strict=False,
        )
        return response

    except Exception as e:
        raise handle_llm_client_exceptions(e)


async def get_edited_slide_content(
    prompt: str,
    slide,
    language: str,
    slide_layout: SlideLayoutModel,
    tone: Optional[str] = None,
    verbosity: Optional[str] = None,
):
    """
    Edit slide content based on a prompt using LLM.

    Args:
        prompt: User's editing instructions
        slide: Current slide model
        language: Content language
        slide_layout: Slide layout schema
        tone: Optional tone instructions
        verbosity: Optional verbosity level

    Returns:
        Updated slide content dict
    """
    client = LLMClient()
    model = get_model()

    # Prepare the current content as context
    current_content_str = f"Current slide content:\n{slide.content}"

    system_prompt = f"""
    You are editing an existing presentation slide based on user instructions.

    {"# Tone:" if tone else ""}
    {tone or ""}

    {"# Verbosity:" if verbosity else ""}
    {verbosity or ""}

    # Instructions
    1. Analyze the current slide content and the user's edit request.
    2. Generate updated structured slide content that incorporates the requested changes.
    3. Maintain the overall structure unless the prompt specifically requests structural changes.
    4. Generate speaker note that is simple, clear, concise and to the point.

    # Important Notes
    - Keep unchanged content intact unless the prompt asks to modify it.
    - Slide body should not use words like "This slide", "This presentation".
    - Only use markdown to highlight important points.
    - Make sure to follow language guidelines.
    - Speaker note should be normal text, not markdown.
    - Strictly follow the max and min character limit for every property in the slide.
    - Never go over the max character limit.
    - Number of items should not exceed max specified in schema.
    - Do not add emoji in the content.
    - Metrics should be in abbreviated form with least possible characters.
    - Provide output in json format and **don't include <parameters> tags**.

    # Image and Icon Output Format
    image: {{
        __image_prompt__: string,
    }}
    icon: {{
        __icon_query__: string,
    }}
    """

    user_prompt = f"""
    ## Current Date and Time
    {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

    ## Icon Query And Image Prompt Language
    English

    ## Slide Content Language
    {language}

    ## Current Slide Content
    {current_content_str}

    ## Edit Request
    {prompt}

    Please generate the updated slide content following the user's edit request.
    """

    response_schema = remove_fields_from_schema(
        slide_layout.json_schema, ["__image_url__", "__icon_url__"]
    )
    response_schema = add_field_in_schema(
        response_schema,
        {
            "__speaker_note__": {
                "type": "string",
                "minLength": 100,
                "maxLength": 250,
                "description": "Speaker note for the slide",
            }
        },
        True,
    )

    try:
        response = await client.generate_structured(
            model=model,
            messages=[
                LLMSystemMessage(content=system_prompt),
                LLMUserMessage(content=user_prompt),
            ],
            response_format=response_schema,
            strict=False,
        )
        return response
    except Exception as e:
        raise handle_llm_client_exceptions(e)


async def get_slide_layout_from_prompt(
    prompt: str,
    presentation_layout,
    slide,
) -> SlideLayoutModel:
    """
    Determine the appropriate slide layout based on edit prompt.

    Args:
        prompt: User's editing instructions
        presentation_layout: Available layouts for the presentation
        slide: Current slide model

    Returns:
        Selected SlideLayoutModel
    """
    # For now, keep the same layout unless the prompt explicitly mentions layout change
    # This is a simple implementation - could be enhanced with LLM-based layout selection

    current_layout_id = slide.layout

    # Find the current layout in presentation layouts
    for layout_group in presentation_layout.layout_groups:
        for layout in layout_group.layouts:
            if layout.id == current_layout_id:
                return layout

    # Fallback to the first available layout
    if presentation_layout.layout_groups and presentation_layout.layout_groups[0].layouts:
        return presentation_layout.layout_groups[0].layouts[0]

    raise ValueError("No valid layout found")


async def get_edited_slide_html(prompt: str, html_to_edit: str) -> str:
    """
    Edit slide HTML content based on a prompt using LLM.

    Args:
        prompt: User's editing instructions
        html_to_edit: Current HTML content

    Returns:
        Updated HTML content
    """
    client = LLMClient()
    model = get_model()

    system_prompt = """
    You are editing HTML content for a presentation slide based on user instructions.

    # Instructions
    1. Analyze the current HTML and the user's edit request.
    2. Generate updated HTML that incorporates the requested changes.
    3. Maintain valid HTML structure.
    4. Keep styling and classes intact unless specifically asked to change them.
    5. Only modify the content/text/structure as requested.

    # Important Notes
    - Preserve all CSS classes and styling unless asked to change them.
    - Maintain proper HTML structure.
    - Do not add unnecessary HTML comments.
    - Return only the HTML, no explanations.
    """

    user_prompt = f"""
    ## Current HTML
    ```html
    {html_to_edit}
    ```

    ## Edit Request
    {prompt}

    Please generate the updated HTML following the user's edit request.
    Return only the HTML code, nothing else.
    """

    try:
        response = await client.generate(
            model=model,
            messages=[
                LLMSystemMessage(content=system_prompt),
                LLMUserMessage(content=user_prompt),
            ],
        )

        # Extract HTML from response (remove markdown code blocks if present)
        html = response.strip()
        if html.startswith("```html"):
            html = html[7:]
        if html.startswith("```"):
            html = html[3:]
        if html.endswith("```"):
            html = html[:-3]

        return html.strip()
    except Exception as e:
        raise handle_llm_client_exceptions(e)
