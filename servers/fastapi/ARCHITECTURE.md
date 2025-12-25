# Clean 4-Layer Architecture Guide

## Overview

This FastAPI backend follows a **Clean 4-Layer Architecture** with strict separation of concerns and adherence to SOLID principles.

```
┌─────────────────────────────────────────┐
│          API Layer (HTTP)               │  ← Thin controllers
├─────────────────────────────────────────┤
│       Service Layer (Business)          │  ← Business logic
├─────────────────────────────────────────┤
│        DAL Layer (Data Access)          │  ← Repository pattern
├─────────────────────────────────────────┤
│       Common Layer (Utilities)          │  ← Shared utilities
└─────────────────────────────────────────┘
```

## Layer Definitions

### 1. API Layer (`api/`)

**Responsibility**: HTTP interface and request/response handling

**Allowed to**:
- Define routes and HTTP methods
- Validate request data (via Pydantic)
- Map exceptions to HTTP status codes
- Format responses
- Inject dependencies via `Depends()`

**NOT allowed to**:
- Access database directly
- Contain business logic
- Write SQL queries
- Create domain objects

**Dependencies**: `service`, `common`

**Example**:
```python
@router.get("/presentations/{id}")
async def get_presentation(
    id: UUID,
    service: PresentationService = Depends(get_presentation_service)
):
    try:
        presentation = await service.get_presentation(id)
        return presentation
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
```

### 2. Service Layer (`service/`)

**Responsibility**: Business logic, domain rules, and orchestration

**Allowed to**:
- Validate business rules
- Orchestrate operations across repositories
- Coordinate with external services (LLM, images, etc.)
- Transform data between layers
- Enforce domain invariants

**NOT allowed to**:
- Access database sessions directly
- Write SQL queries
- Handle HTTP requests/responses
- Know about FastAPI

**Dependencies**: `dal`, `common`

**Example**:
```python
class PresentationService:
    def __init__(self, presentation_repo: PresentationRepository):
        self.presentation_repo = presentation_repo

    async def create_presentation(self, content: str, n_slides: int):
        # Business validation
        if n_slides < 1 or n_slides > 100:
            raise ValidationError("Slides must be 1-100")

        # Create entity
        presentation = PresentationModel(content=content, n_slides=n_slides)

        # Delegate to repository
        return await self.presentation_repo.create(presentation)
```

### 3. DAL Layer (`dal/`)

**Responsibility**: Data access and persistence

**Allowed to**:
- Execute database queries
- Manage transactions
- Handle database connections
- Implement repository pattern

**NOT allowed to**:
- Contain business logic
- Know about HTTP
- Make business decisions
- Transform domain data

**Dependencies**: `models`, `common`

**Example**:
```python
class PresentationRepository(BaseRepository[PresentationModel]):
    async def get_by_id(self, presentation_id: UUID) -> PresentationModel:
        presentation = await self.session.get(PresentationModel, presentation_id)
        if not presentation:
            raise NotFoundException("Presentation", presentation_id)
        return presentation
```

### 4. Common Layer (`common/`)

**Responsibility**: Cross-cutting concerns and utilities

**Allowed to**:
- Define exceptions
- Provide logging utilities
- Offer pure utility functions
- Manage configuration

**NOT allowed to**:
- Contain business logic
- Access database
- Handle HTTP
- Know about domain models

**Dependencies**: None (can be used by all layers)

**Example**:
```python
class NotFoundException(PresentonException):
    def __init__(self, entity_type: str, entity_id: Any):
        message = f"{entity_type} with ID {entity_id} not found"
        super().__init__(message)
```

## Dependency Rules

### Allowed Dependencies

```
api       → service, common
service   → dal, common
dal       → common
common    → (nothing)
```

### Forbidden Dependencies

```
api       ✗ dal (must go through service)
service   ✗ api (service doesn't know about HTTP)
dal       ✗ service (data layer doesn't call business layer)
common    ✗ any layer (must be independent)
```

## SOLID Principles Applied

### Single Responsibility Principle (SRP)

Each class has one reason to change:
- **Repository**: Only changes if data access changes
- **Service**: Only changes if business rules change
- **Controller**: Only changes if API contract changes

**Example**:
```python
# ✅ GOOD - Single responsibility
class PresentationRepository:
    """Only handles presentation data access"""
    async def get_by_id(self, id): ...
    async def create(self, presentation): ...

# ❌ BAD - Multiple responsibilities
class PresentationManager:
    """Handles HTTP, business logic, AND data access"""
    async def handle_request(self, request): ...
    def validate_business_rules(self, data): ...
    async def save_to_database(self, entity): ...
```

### Open/Closed Principle (OCP)

Open for extension, closed for modification:
- New repository implementations can be added without changing services
- New services can be added without changing API layer

**Example**:
```python
# ✅ GOOD - Can extend by adding new repository
class CachedPresentationRepository(PresentationRepository):
    """Extends with caching without modifying original"""
    async def get_by_id(self, id):
        cached = self.cache.get(id)
        if cached:
            return cached
        return await super().get_by_id(id)
```

### Liskov Substitution Principle (LSP)

Any repository implementation can replace another:
- Services depend on repository interfaces
- Can swap SQLite repository for PostgreSQL repository
- Tests can use in-memory repository

**Example**:
```python
# ✅ GOOD - Service works with any repository implementation
class PresentationService:
    def __init__(self, repo: PresentationRepository):
        self.repo = repo  # Works with any implementation

# Can use real repository
service = PresentationService(PresentationRepository(session))

# Or mock for testing
service = PresentationService(MockPresentationRepository())
```

### Interface Segregation Principle (ISP)

Small, focused interfaces:
- Each repository has methods for one entity type only
- Services have focused responsibilities

**Example**:
```python
# ✅ GOOD - Focused repository interface
class PresentationRepository:
    async def get_by_id(self, id): ...
    async def create(self, presentation): ...
    # Only presentation-related methods

# ❌ BAD - God interface
class DataRepository:
    async def get_presentation(self, id): ...
    async def get_slide(self, id): ...
    async def get_user(self, id): ...
    # Too many unrelated methods
```

### Dependency Inversion Principle (DIP)

High-level modules depend on abstractions:
- Services depend on repository abstractions (base classes)
- API depends on service abstractions
- Dependencies injected, not created

**Example**:
```python
# ✅ GOOD - Depends on abstraction
class PresentationService:
    def __init__(self, repo: PresentationRepository):
        self.repo = repo  # Injected dependency

# ❌ BAD - Creates concrete dependency
class PresentationService:
    def __init__(self):
        self.repo = PresentationRepository(session)  # Hard-coded
```

## File Structure

```
servers/fastapi/
├── api/                           # Layer 4: HTTP
│   ├── dependencies/
│   │   └── services.py           # Dependency injection
│   ├── v1/
│   │   └── ppt/
│   │       └── endpoints/        # Route handlers
│   │           ├── presentation.py
│   │           └── slide.py
│   └── middlewares.py
│
├── service/                       # Layer 3: Business Logic
│   ├── presentation_service.py
│   ├── slide_service.py
│   ├── auth_service.py
│   └── ...
│
├── dal/                           # Layer 2: Data Access
│   ├── database.py               # Connection & session
│   └── repositories/
│       ├── base_repository.py    # Generic CRUD
│       ├── presentation_repository.py
│       ├── slide_repository.py
│       └── ...
│
├── common/                        # Layer 1: Shared
│   ├── logger.py
│   ├── exceptions.py
│   └── ...
│
└── models/                        # Data Models
    ├── sql/                       # Database models
    └── dto/                       # API request/response models
```

## Common Patterns

### Creating a New Endpoint

1. **Add repository method** (if needed):
```python
# dal/repositories/presentation_repository.py
async def search_by_title(self, search_term: str):
    statement = select(PresentationModel).where(...)
    return await self.session.execute(statement)
```

2. **Add service method** (business logic):
```python
# service/presentation_service.py
async def search_presentations(self, search_term: str):
    if not search_term:
        raise ValidationError("Search term required")
    return await self.presentation_repo.search_by_title(search_term)
```

3. **Add endpoint** (HTTP handler):
```python
# api/v1/ppt/endpoints/presentation.py
@router.get("/search/{term}")
async def search(term: str, service = Depends(get_presentation_service)):
    try:
        return await service.search_presentations(term)
    except ValidationError as e:
        raise HTTPException(400, str(e))
```

### Adding a New Entity

1. Create SQLModel in `models/sql/`
2. Create repository in `dal/repositories/`
3. Create service in `service/`
4. Add dependency injection in `api/dependencies/services.py`
5. Create endpoints in `api/v1/`

## Testing Strategy

### Unit Tests

Test each layer independently:

```python
# Test service with mock repository
@pytest.fixture
def mock_repo():
    repo = Mock(spec=PresentationRepository)
    return repo

async def test_create_presentation(mock_repo):
    service = PresentationService(mock_repo)
    mock_repo.create.return_value = PresentationModel(...)

    result = await service.create_presentation(...)

    assert result is not None
    mock_repo.create.assert_called_once()
```

### Integration Tests

Test API layer with real database:

```python
async def test_get_presentation_endpoint(client):
    response = await client.get("/api/v1/ppt/presentation/123")
    assert response.status_code == 200
```

## Migration Checklist

To refactor existing code to this architecture:

### Phase 1: Foundation
- [x] Create `dal/repositories/base_repository.py`
- [x] Create `common/exceptions.py`
- [x] Create concrete repositories
- [x] Set up dependency injection

### Phase 2: Services
- [x] Create service classes
- [x] Move business logic from endpoints to services
- [x] Move business logic from `utils/` to services

### Phase 3: API Refactoring
- [ ] Refactor endpoints to use services
- [ ] Remove direct database access from endpoints
- [ ] Add proper error handling

### Phase 4: Cleanup
- [ ] Remove old `services/` directory (rename to avoid confusion)
- [ ] Move pure utilities to `common/`
- [ ] Update all imports

## Architecture Violations to Fix

### Current Violations

1. **API → DAL direct access** (`presentation.py:79-91`)
   ```python
   # ❌ BAD
   sql_session: AsyncSession = Depends(get_async_session)
   query = select(PresentationModel, SlideModel)...
   results = await sql_session.execute(query)

   # ✅ GOOD
   service: PresentationService = Depends(get_presentation_service)
   presentations = await service.list_presentations()
   ```

2. **Business logic in utils/** (`utils/llm_calls/`)
   - Move to `service/llm_service.py`
   - These are business operations, not utilities

3. **Services with data access** (`services/auth_service.py`)
   - Split into `service/auth_service.py` (business logic)
   - And `dal/repositories/user_repository.py` (data access)

## Examples

See `api/v1/ppt/endpoints/presentation_refactored_example.py` for complete examples of:
- Clean endpoint structure
- Proper error handling
- Dependency injection
- Comparison with anti-patterns

## Questions?

- **Q: Where do I put LLM calls?**
  A: In `service/` layer. They're business logic.

- **Q: Can services call other services?**
  A: Yes! Services can orchestrate other services.

- **Q: Where do I validate API input?**
  A: Pydantic models (automatic). Business validation in service.

- **Q: Can repositories contain business logic?**
  A: No! Only data access. Move business logic to services.

- **Q: Where do I handle transactions?**
  A: Repository layer manages transactions implicitly via session.

## Benefits Achieved

✅ **Testability**: Each layer can be tested independently
✅ **Maintainability**: Clear ownership of responsibilities
✅ **Flexibility**: Easy to swap implementations
✅ **Scalability**: Can add caching, authorization, etc. cleanly
✅ **Team Development**: Clear boundaries for parallel work
✅ **Code Reuse**: Services reusable across different endpoints
✅ **Type Safety**: Better typing with repository interfaces
✅ **SOLID Compliance**: Follows all SOLID principles
