"""
Simplified prompts for smaller models (Qwen 2.5, Llama 3, etc.)

These prompts are designed for models with:
- Limited context windows
- Less complex instruction following
- Lower reliability with strict JSON schemas

Key differences from full prompts:
- 70-80% shorter
- 5-7 key rules instead of 20+
- Simple, direct language
- Focus on essential requirements only
"""

def get_simple_outline_system_prompt(n_slides: int) -> str:
    """
    Simplified outline generation prompt for small models.

    Args:
        n_slides: Number of slides to generate

    Returns:
        System prompt for outline generation
    """
    return f"""You are a presentation outline creator. Generate an outline for {n_slides} slides.

Key Rules:
1. Create exactly {n_slides} slides with clear titles
2. Each slide has: title and brief description
3. First slide is title slide, last slide is conclusion
4. Use simple, focused topics
5. Output valid JSON only

Respond with JSON in this format:
{{
  "slides": [
    {{"title": "Slide Title", "description": "Brief description of content"}}
  ]
}}

Example:
{{
  "slides": [
    {{"title": "Introduction to AI", "description": "Overview of artificial intelligence"}},
    {{"title": "Key Benefits", "description": "Main advantages and use cases"}},
    {{"title": "Conclusion", "description": "Summary and takeaways"}}
  ]
}}"""


def get_simple_presentation_structure_prompt(topic: str, n_slides: int, outline: str) -> str:
    """
    Simplified presentation structure prompt for small models.

    Args:
        topic: Presentation topic
        n_slides: Number of slides
        outline: Previously generated outline

    Returns:
        User prompt for structure generation
    """
    return f"""Create a {n_slides}-slide presentation about: {topic}

Use this outline:
{outline}

For each slide, provide:
1. Title (short, clear)
2. Layout type (title_slide, content, bullets, or two_column)
3. Brief content description

Output JSON format:
{{
  "slides": [
    {{
      "title": "Slide Title",
      "layout": "content",
      "content": "Main content description"
    }}
  ]
}}

Keep it simple and focused."""


def get_simple_slide_content_prompt(
    slide_number: int,
    total_slides: int,
    title: str,
    layout: str,
    context: str = ""
) -> str:
    """
    Simplified content generation prompt for individual slides.

    Args:
        slide_number: Current slide number (1-indexed)
        total_slides: Total number of slides
        title: Slide title
        layout: Layout type
        context: Additional context (optional)

    Returns:
        User prompt for content generation
    """
    layout_instructions = {
        "title_slide": "Create title and subtitle only",
        "content": "Create 2-3 paragraphs of text",
        "bullets": "Create 3-5 bullet points",
        "two_column": "Create left and right column content"
    }

    instruction = layout_instructions.get(layout, "Create appropriate content")

    prompt = f"""Generate content for slide {slide_number}/{total_slides}

Title: {title}
Layout: {layout}

Task: {instruction}

Rules:
1. Keep content clear and concise
2. Match the layout type
3. Use simple language
4. Output valid JSON only
"""

    if context:
        prompt += f"\nContext: {context}\n"

    # Layout-specific JSON format
    if layout == "title_slide":
        prompt += """
Output format:
{
  "title": "Main Title",
  "subtitle": "Subtitle or tagline"
}"""
    elif layout == "bullets":
        prompt += """
Output format:
{
  "title": "Slide Title",
  "bullets": [
    "First point",
    "Second point",
    "Third point"
  ]
}"""
    elif layout == "two_column":
        prompt += """
Output format:
{
  "title": "Slide Title",
  "left_column": "Left side content",
  "right_column": "Right side content"
}"""
    else:  # content layout
        prompt += """
Output format:
{
  "title": "Slide Title",
  "content": "Main content text here"
}"""

    return prompt


def get_simple_content_rewrite_prompt(original_content: str, instructions: str) -> str:
    """
    Simplified content rewriting prompt for small models.

    Args:
        original_content: Original slide content
        instructions: User's rewrite instructions

    Returns:
        User prompt for content rewriting
    """
    return f"""Rewrite this presentation content:

Original:
{original_content}

Instructions: {instructions}

Rules:
1. Keep the same structure
2. Apply the requested changes
3. Output valid JSON only

Output format:
{{
  "content": "Rewritten content here"
}}"""


def get_simple_html_generation_prompt(slide_data: dict, template_name: str) -> str:
    """
    Simplified HTML generation prompt for small models.

    Args:
        slide_data: Slide content data
        template_name: Template identifier

    Returns:
        User prompt for HTML generation
    """
    return f"""Generate HTML for this slide:

Title: {slide_data.get('title', 'Untitled')}
Content: {slide_data.get('content', '')}
Template: {template_name}

Rules:
1. Use semantic HTML (h1, h2, p, ul, li)
2. Add Tailwind classes for styling
3. Keep it simple and clean
4. Output valid JSON only

Output format:
{{
  "html": "<div class='...'>...</div>"
}}"""


# System prompts for different generation modes
SIMPLE_OUTLINE_SYSTEM_BASE = """You are a presentation outline creator. Follow the instructions exactly and output only valid JSON."""

SIMPLE_STRUCTURE_SYSTEM_BASE = """You are a presentation structure designer. Create clear, focused slides and output only valid JSON."""

SIMPLE_CONTENT_SYSTEM_BASE = """You are a presentation content writer. Write clear, concise content and output only valid JSON."""

SIMPLE_REWRITE_SYSTEM_BASE = """You are a content editor. Make the requested changes while keeping the structure intact. Output only valid JSON."""


def get_prompt_for_model(
    model_name: str,
    prompt_type: str,
    **kwargs
) -> tuple[str, str]:
    """
    Get appropriate prompt based on model capability.

    Args:
        model_name: Name of the LLM model
        prompt_type: Type of prompt ('outline', 'structure', 'content', 'rewrite', 'html')
        **kwargs: Arguments for the specific prompt function

    Returns:
        Tuple of (system_prompt, user_prompt)
    """
    from servers.fastapi.utils.model_capabilities import is_small_model

    # For small models, use simplified prompts
    if is_small_model(model_name):
        if prompt_type == "outline":
            system = SIMPLE_OUTLINE_SYSTEM_BASE
            user = get_simple_outline_system_prompt(kwargs.get('n_slides', 5))
        elif prompt_type == "structure":
            system = SIMPLE_STRUCTURE_SYSTEM_BASE
            user = get_simple_presentation_structure_prompt(
                kwargs['topic'],
                kwargs['n_slides'],
                kwargs['outline']
            )
        elif prompt_type == "content":
            system = SIMPLE_CONTENT_SYSTEM_BASE
            user = get_simple_slide_content_prompt(
                kwargs['slide_number'],
                kwargs['total_slides'],
                kwargs['title'],
                kwargs['layout'],
                kwargs.get('context', '')
            )
        elif prompt_type == "rewrite":
            system = SIMPLE_REWRITE_SYSTEM_BASE
            user = get_simple_content_rewrite_prompt(
                kwargs['original_content'],
                kwargs['instructions']
            )
        elif prompt_type == "html":
            system = SIMPLE_CONTENT_SYSTEM_BASE
            user = get_simple_html_generation_prompt(
                kwargs['slide_data'],
                kwargs['template_name']
            )
        else:
            raise ValueError(f"Unknown prompt type: {prompt_type}")

        return system, user

    # For large models, use full prompts from prompts.py
    # This will be integrated with existing prompts.py
    from servers.fastapi.api.v1.ppt.endpoints.prompts import (
        GENERATE_OUTLINE_SYSTEM_PROMPT,
        GENERATE_PRESENTATION_STRUCTURE_SYSTEM_PROMPT,
        GENERATE_SLIDE_CONTENT_SYSTEM_PROMPT,
        # Import other full prompts as needed
    )

    # Return full prompts for large models (to be implemented)
    # For now, use simplified prompts as fallback
    return get_prompt_for_model(model_name, prompt_type, **kwargs)
