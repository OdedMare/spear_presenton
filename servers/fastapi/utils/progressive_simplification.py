"""
Progressive prompt simplification for retry attempts.

On each retry, prompts become progressively simpler to increase
success rate with small models.

Complexity Levels:
- Level 0 (Initial): Full or simplified prompt based on model
- Level 1: Remove optional rules and examples
- Level 2: Keep only essential rules (3-5 core rules)
- Level 3: Minimal prompt with basic instruction only
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


def get_simplified_outline_prompt(
    complexity_level: int,
    n_slides: int,
    include_title_slide: bool = True,
    instructions: Optional[str] = None,
    tone: Optional[str] = None,
    verbosity: Optional[str] = None
) -> str:
    """
    Get progressively simpler outline generation prompts.

    Args:
        complexity_level: 0 (normal), 1 (simple), 2 (minimal), 3 (bare minimum)
        n_slides: Number of slides
        include_title_slide: Whether to include title slide
        instructions: User instructions
        tone: Presentation tone
        verbosity: Content verbosity

    Returns:
        Prompt string at specified complexity level
    """
    if complexity_level == 0:
        # Normal simplified prompt (already implemented in generate_presentation_outlines.py)
        return f"""
You are a presentation outline creator. Generate {include_title_slide and "structured" or "content"} slides with clear titles and descriptions.

{"# User Instructions:" if instructions else ""}
{instructions or ""}

{"# Tone: " + tone if tone else ""}
{"# Verbosity: " + verbosity if verbosity else ""}

Key Rules:
1. Create slides with clear titles and brief descriptions
2. Use markdown format for content
3. Keep flow logical and consistent
4. Emphasize numerical data when present
5. {"Start with title slide" if include_title_slide else "No title slide needed"}
6. No table of contents slides
7. Follow language guidelines

Use web search for latest information when needed.
        """

    elif complexity_level == 1:
        # Simplified - remove optional guidelines
        return f"""
You are a presentation creator. Generate {n_slides} slides with titles and descriptions.

{"User Instructions: " + instructions if instructions else ""}

Rules:
1. Clear title for each slide
2. Brief description in markdown
3. Logical flow
4. {"First slide is title slide" if include_title_slide else "No title slide"}
5. No table of contents

Output valid JSON only.
        """

    elif complexity_level == 2:
        # Minimal - only core requirements
        return f"""
Create {n_slides} presentation slides.

{"Instructions: " + instructions if instructions else ""}

Requirements:
- Title and description for each slide
- {"Include title slide" if include_title_slide else "Content slides only"}
- Output JSON format

Generate the slides now.
        """

    else:  # complexity_level >= 3
        # Bare minimum - absolute essentials only
        return f"""
Generate {n_slides} slides with title and description for each.
{"First slide: title slide." if include_title_slide else ""}
Output JSON only.
        """


def get_simplified_structure_prompt(
    complexity_level: int,
    n_slides: int,
    instructions: Optional[str] = None
) -> str:
    """
    Get progressively simpler structure/layout selection prompts.

    Args:
        complexity_level: 0 (normal), 1 (simple), 2 (minimal), 3 (bare minimum)
        n_slides: Number of slides
        instructions: User instructions

    Returns:
        Prompt string at specified complexity level
    """
    if complexity_level == 0:
        # Normal simplified prompt
        return f"""
You are a presentation designer. Select the best layout for each slide.

{"# User Instructions: " + instructions if instructions else ""}

Key Rules:
1. Match layout to content purpose
2. Opening/closing slides → Title layouts
3. Data/metrics → Chart layouts
4. Comparisons → Side-by-side layouts
5. Create visual variety
6. Select layout index for all {n_slides} slides

Choose layouts that make the presentation engaging and clear.
        """

    elif complexity_level == 1:
        # Simplified - core rules only
        return f"""
Select layout for each of {n_slides} slides.

{"Instructions: " + instructions if instructions else ""}

Rules:
1. Match layout to content
2. Title slides for opening/closing
3. Chart layouts for data
4. Vary layouts for engagement

Output layout index for each slide.
        """

    elif complexity_level == 2:
        # Minimal - basic instruction
        return f"""
Choose layout for {n_slides} slides.

{"Instructions: " + instructions if instructions else ""}

Match layout to slide content.
Output layout index for each.
        """

    else:  # complexity_level >= 3
        # Bare minimum
        return f"""
Select layout index for {n_slides} slides.
Match content to layout type.
        """


def get_complexity_level_for_attempt(
    attempt: int,
    max_retries: int,
    is_small_model: bool = False
) -> int:
    """
    Determine prompt complexity level based on retry attempt.

    Args:
        attempt: Current attempt number (0-indexed)
        max_retries: Maximum number of retries
        is_small_model: Whether using a small model

    Returns:
        Complexity level (0-3)

    Examples:
        >>> get_complexity_level_for_attempt(0, 5, True)
        0  # First attempt: normal simplified prompt
        >>> get_complexity_level_for_attempt(2, 5, True)
        1  # Third attempt: simpler
        >>> get_complexity_level_for_attempt(4, 5, True)
        3  # Last attempt: bare minimum
    """
    if attempt == 0:
        return 0  # Normal simplified prompt

    # For small models, progress through levels faster
    if is_small_model:
        if attempt <= 1:
            return 0
        elif attempt <= 2:
            return 1
        elif attempt <= 3:
            return 2
        else:
            return 3
    else:
        # Large models: slower progression
        if attempt <= 2:
            return 0
        elif attempt <= 3:
            return 1
        else:
            return 2


def log_simplification_level(
    attempt: int,
    complexity_level: int,
    prompt_type: str = "outline"
):
    """
    Log the simplification level being applied.

    Args:
        attempt: Attempt number
        complexity_level: Current complexity level
        prompt_type: Type of prompt being simplified
    """
    level_names = {
        0: "normal simplified",
        1: "simplified",
        2: "minimal",
        3: "bare minimum"
    }

    level_name = level_names.get(complexity_level, "unknown")

    logger.info(
        f"Retry attempt {attempt + 1}: Using {level_name} prompt "
        f"(level {complexity_level}) for {prompt_type}"
    )


def should_simplify_further(
    current_level: int,
    error_message: str
) -> bool:
    """
    Determine if prompt should be simplified based on error type.

    Some errors benefit more from simplification than others.

    Args:
        current_level: Current complexity level
        error_message: Error message from failed attempt

    Returns:
        True if further simplification is recommended
    """
    # Already at minimum level
    if current_level >= 3:
        return False

    # Error patterns that benefit from simplification
    simplification_indicators = [
        "json",
        "parse",
        "schema",
        "format",
        "invalid",
        "structure",
        "validation",
        "required field"
    ]

    error_lower = error_message.lower()
    return any(indicator in error_lower for indicator in simplification_indicators)


class ProgressiveSimplifier:
    """
    Helper class for progressive prompt simplification during retries.
    """

    def __init__(
        self,
        is_small_model: bool = False,
        max_retries: int = 5
    ):
        self.is_small_model = is_small_model
        self.max_retries = max_retries
        self.current_attempt = 0

    def get_outline_prompt(
        self,
        n_slides: int,
        include_title_slide: bool = True,
        instructions: Optional[str] = None,
        tone: Optional[str] = None,
        verbosity: Optional[str] = None
    ) -> str:
        """Get outline prompt at current complexity level."""
        level = get_complexity_level_for_attempt(
            self.current_attempt,
            self.max_retries,
            self.is_small_model
        )

        log_simplification_level(self.current_attempt, level, "outline")

        return get_simplified_outline_prompt(
            level,
            n_slides,
            include_title_slide,
            instructions,
            tone,
            verbosity
        )

    def get_structure_prompt(
        self,
        n_slides: int,
        instructions: Optional[str] = None
    ) -> str:
        """Get structure prompt at current complexity level."""
        level = get_complexity_level_for_attempt(
            self.current_attempt,
            self.max_retries,
            self.is_small_model
        )

        log_simplification_level(self.current_attempt, level, "structure")

        return get_simplified_structure_prompt(
            level,
            n_slides,
            instructions
        )

    def next_attempt(self):
        """Move to next retry attempt."""
        self.current_attempt += 1

    def reset(self):
        """Reset to initial attempt."""
        self.current_attempt = 0

    def get_current_level(self) -> int:
        """Get current complexity level."""
        return get_complexity_level_for_attempt(
            self.current_attempt,
            self.max_retries,
            self.is_small_model
        )


# Example usage
if __name__ == "__main__":
    print("Progressive Simplification Example\n")

    # Simulate retries with small model
    simplifier = ProgressiveSimplifier(is_small_model=True, max_retries=5)

    for attempt in range(5):
        print(f"\n{'=' * 60}")
        print(f"Attempt {attempt + 1}/5")
        print(f"{'=' * 60}")

        prompt = simplifier.get_outline_prompt(
            n_slides=5,
            include_title_slide=True,
            instructions="Focus on technical content"
        )

        print(f"\nComplexity Level: {simplifier.get_current_level()}")
        print(f"\nPrompt:\n{prompt}")

        simplifier.next_attempt()
