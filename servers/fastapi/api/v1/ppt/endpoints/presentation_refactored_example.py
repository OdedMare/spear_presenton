"""
REFACTORED PRESENTATION ENDPOINTS - Example of Clean Architecture

This file demonstrates how to refactor the presentation endpoints to follow
the 4-layer architecture with proper separation of concerns.

BEFORE (Anti-pattern):
- Endpoint directly accesses database via session
- Business logic mixed with HTTP logic
- Hard to test, tightly coupled

AFTER (Clean Architecture):
- Endpoint only handles HTTP concerns (request/response)
- Business logic delegated to service layer
- Service layer uses repository for data access
- Easy to test with mocks, loosely coupled

Compare this file with presentation.py to see the difference.
"""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status

from api.dependencies.services import get_presentation_service, get_slide_service
from service.presentation_service import PresentationService
from service.slide_service import SlideService
from models.presentation_with_slides import PresentationWithSlides
from models.sql.presentation import PresentationModel
from models.generate_presentation_request import GeneratePresentationRequest
from common.exceptions import (
    NotFoundException,
    ValidationError,
    AuthorizationError,
)
from common.logger import logger

router = APIRouter(prefix="/presentation", tags=["Presentation - Refactored"])


# ============================================================================
# EXAMPLE 1: List All Presentations
# ============================================================================

@router.get("/all", response_model=List[PresentationWithSlides])
async def get_all_presentations_refactored(
    skip: int = 0,
    limit: int = 100,
    presentation_service: PresentationService = Depends(get_presentation_service),
    slide_service: SlideService = Depends(get_slide_service),
):
    """
    Get all presentations with their first slide.

    CLEAN ARCHITECTURE EXAMPLE:
    - API layer: Handles HTTP request/response
    - Service layer: Orchestrates business logic
    - DAL layer: Handles database queries

    BEFORE (Anti-pattern in presentation.py):
    ```python
    query = select(PresentationModel, SlideModel).join(...)  # ❌ Direct DB access
    results = await sql_session.execute(query)               # ❌ In endpoint
    ```

    AFTER (Clean):
    ```python
    presentations = await presentation_service.list_presentations()  # ✅ Via service
    ```
    """
    try:
        # Business logic delegated to service layer
        presentations = await presentation_service.list_presentations(
            skip=skip, limit=limit, order_by="created_at"
        )

        # Build response with slides
        presentations_with_slides = []
        for presentation in presentations:
            # Get first slide via service
            slides = await slide_service.get_presentation_slides(
                presentation.id, ordered=True
            )
            first_slide = slides[0] if slides else None

            presentations_with_slides.append(
                PresentationWithSlides(
                    **presentation.model_dump(),
                    slides=[first_slide] if first_slide else [],
                )
            )

        return presentations_with_slides

    except ValidationError as e:
        # Map service exceptions to HTTP status codes
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error listing presentations: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


# ============================================================================
# EXAMPLE 2: Get Single Presentation
# ============================================================================

@router.get("/{presentation_id}", response_model=PresentationModel)
async def get_presentation_refactored(
    presentation_id: UUID,
    presentation_service: PresentationService = Depends(get_presentation_service),
):
    """
    Get presentation by ID.

    BEFORE:
    ```python
    presentation = await sql_session.get(PresentationModel, presentation_id)  # ❌
    if not presentation:
        raise HTTPException(404, "Not found")
    ```

    AFTER:
    ```python
    presentation = await presentation_service.get_presentation(presentation_id)  # ✅
    # Service raises NotFoundException automatically
    ```

    Benefits:
    - No database logic in endpoint
    - Consistent error handling via service
    - Easy to add caching, authorization, etc. in service layer
    """
    try:
        presentation = await presentation_service.get_presentation(presentation_id)
        return presentation

    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting presentation {presentation_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


# ============================================================================
# EXAMPLE 3: Create Presentation
# ============================================================================

@router.post("/", response_model=PresentationModel, status_code=status.HTTP_201_CREATED)
async def create_presentation_refactored(
    request: GeneratePresentationRequest,
    presentation_service: PresentationService = Depends(get_presentation_service),
):
    """
    Create a new presentation.

    BEFORE:
    ```python
    # Business validation scattered in endpoint
    if not request.content:
        raise HTTPException(400, "Content required")

    # Direct database creation
    presentation = PresentationModel(...)
    sql_session.add(presentation)
    await sql_session.commit()
    ```

    AFTER:
    ```python
    # All business logic in service
    presentation = await presentation_service.create_presentation(...)
    # Service handles validation, business rules, persistence
    ```

    Benefits:
    - Business rules centralized in service
    - Endpoint is thin - only HTTP concerns
    - Easy to test business logic independently
    """
    try:
        presentation = await presentation_service.create_presentation(
            content=request.content,
            n_slides=request.n_slides,
            language=request.language,
            title=request.title,
            instructions=request.instructions,
            tone=request.tone.value if request.tone else None,
            verbosity=request.verbosity.value if request.verbosity else None,
            include_table_of_contents=request.include_table_of_contents,
            include_title_slide=request.include_title_slide,
            web_search=request.web_grounding,
        )

        logger.info(f"Created presentation {presentation.id}")
        return presentation

    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating presentation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


# ============================================================================
# EXAMPLE 4: Delete Presentation
# ============================================================================

@router.delete("/{presentation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_presentation_refactored(
    presentation_id: UUID,
    presentation_service: PresentationService = Depends(get_presentation_service),
):
    """
    Delete presentation and all associated slides.

    BEFORE:
    ```python
    # Complex deletion logic in endpoint
    slides = await sql_session.execute(select(SlideModel).where(...))
    for slide in slides:
        await sql_session.delete(slide)

    presentation = await sql_session.get(PresentationModel, presentation_id)
    await sql_session.delete(presentation)
    await sql_session.commit()
    ```

    AFTER:
    ```python
    # Service handles cascade deletion
    await presentation_service.delete_presentation(presentation_id)
    ```

    Benefits:
    - Business rule (cascade delete) encapsulated in service
    - Consistent transaction handling
    - Easy to add webhooks, audit logs, etc. in service layer
    """
    try:
        await presentation_service.delete_presentation(presentation_id)
        logger.info(f"Deleted presentation {presentation_id}")

    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting presentation {presentation_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


# ============================================================================
# EXAMPLE 5: Search Presentations
# ============================================================================

@router.get("/search/{search_term}", response_model=List[PresentationModel])
async def search_presentations_refactored(
    search_term: str,
    limit: int = 50,
    presentation_service: PresentationService = Depends(get_presentation_service),
):
    """
    Search presentations by title.

    BEFORE:
    ```python
    # Complex SQL query in endpoint
    statement = select(PresentationModel).where(
        PresentationModel.title.ilike(f"%{search_term}%")
    ).order_by(...)
    results = await sql_session.execute(statement)
    ```

    AFTER:
    ```python
    # Service abstracts query complexity
    presentations = await presentation_service.search_presentations(search_term)
    ```

    Benefits:
    - Query logic in repository layer
    - Can easily switch to Elasticsearch later
    - Business rules (validation) in service
    """
    try:
        presentations = await presentation_service.search_presentations(
            search_term=search_term, limit=limit
        )
        return presentations

    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error searching presentations: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


# ============================================================================
# ARCHITECTURE SUMMARY
# ============================================================================

"""
LAYER SEPARATION DEMONSTRATED:

1. API LAYER (This File):
   ✅ Request validation (FastAPI does this)
   ✅ Dependency injection (via Depends())
   ✅ HTTP error mapping (ValidationError → 400, NotFoundException → 404)
   ✅ Response formatting
   ❌ NO database access
   ❌ NO business logic
   ❌ NO SQL queries

2. SERVICE LAYER (presentation_service.py):
   ✅ Business validation
   ✅ Business rules enforcement
   ✅ Orchestration between repositories
   ✅ Domain logic
   ❌ NO HTTP concerns
   ❌ NO direct SQL

3. DAL LAYER (presentation_repository.py):
   ✅ Database queries
   ✅ Data persistence
   ✅ Transaction management
   ❌ NO business logic
   ❌ NO HTTP concerns

4. COMMON LAYER:
   ✅ Exceptions (NotFoundException, ValidationError)
   ✅ Logging utilities
   ✅ Shared utilities
   ❌ NO domain-specific logic

DEPENDENCY FLOW:
API → Service → Repository → Database
         ↓
      Common (used by all layers)

BENEFITS:
- Easy to test each layer independently
- Can swap implementations (e.g., switch from SQLite to PostgreSQL)
- Clear ownership of responsibilities
- Easy to add features (caching, authorization, webhooks)
- Follows SOLID principles
"""
