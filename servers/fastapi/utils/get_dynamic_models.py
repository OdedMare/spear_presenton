from typing import List, Optional
from pydantic import Field
from models.presentation_outline_model import (
    PresentationOutlineModel,
    SlideOutlineModel,
)
from models.presentation_structure_model import PresentationStructureModel


def get_presentation_outline_model_with_n_slides(n_slides: int, relaxed: bool = False):
    """
    Get presentation outline model with specific number of slides.

    Args:
        n_slides: Target number of slides
        relaxed: If True, makes constraints more flexible for small models
    """
    if relaxed:
        # For small models: more lenient constraints
        class SlideOutlineModelWithNSlides(SlideOutlineModel):
            content: str = Field(
                description="Markdown content for each slide",
                min_length=50,  # Reduced from 100
                max_length=500,  # Increased from 300
            )

        class PresentationOutlineModelWithNSlides(PresentationOutlineModel):
            slides: List[SlideOutlineModelWithNSlides] = Field(
                description=f"List of slide outlines (should contain {n_slides} slides)",
                min_items=max(1, n_slides - 2),  # Allow 2 fewer slides
                max_items=n_slides + 2,  # Allow 2 extra slides
            )
    else:
        # For large models: strict constraints
        class SlideOutlineModelWithNSlides(SlideOutlineModel):
            content: str = Field(
                description="Markdown content for each slide",
                min_length=100,
                max_length=300,
            )

        class PresentationOutlineModelWithNSlides(PresentationOutlineModel):
            slides: List[SlideOutlineModelWithNSlides] = Field(
                description="List of slide outlines",
                min_items=n_slides,
                max_items=n_slides,
            )

    return PresentationOutlineModelWithNSlides


def get_presentation_structure_model_with_n_slides(n_slides: int):
    class PresentationStructureModelWithNSlides(PresentationStructureModel):
        slides: List[int] = Field(
            description="List of slide layouts",
            min_items=n_slides,
            max_items=n_slides,
        )

    return PresentationStructureModelWithNSlides
