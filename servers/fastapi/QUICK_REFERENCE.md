# Quick Reference - Clean Architecture

## 🎯 Where Does Code Go?

### Data Access → `dal/repositories/`
```python
# dal/repositories/presentation_repository.py
async def get_by_id(self, presentation_id: UUID):
    return await self.session.get(PresentationModel, presentation_id)
```

### Business Logic → `service/`
```python
# service/presentation_service.py
async def create_presentation(self, content: str, n_slides: int):
    if n_slides < 1 or n_slides > 100:
        raise ValidationError("Slides must be 1-100")
    presentation = PresentationModel(content=content, n_slides=n_slides)
    return await self.presentation_repo.create(presentation)
```

### HTTP Handling → `api/v1/ppt/endpoints/`
```python
# api/v1/ppt/endpoints/presentation.py
@router.post("/presentations")
async def create_presentation(
    request: CreateRequest,
    service: PresentationService = Depends(get_presentation_service)
):
    try:
        return await service.create_presentation(request.content, request.n_slides)
    except ValidationError as e:
        raise HTTPException(400, str(e))
```

### Shared Utilities → `common/`
```python
# common/exceptions.py
class ValidationError(PresentonException):
    pass

# common/logger.py
logger.info("message")
```

---

## 📁 Directory Structure

```
dal/repositories/        ← Database queries ONLY
service/                 ← Business rules ONLY
api/v1/ppt/endpoints/    ← HTTP handling ONLY
common/                  ← Shared utilities
api/dependencies/        ← Dependency injection
```

---

## 🚫 Don'ts

❌ **Don't** access database in endpoints
❌ **Don't** put business logic in repositories
❌ **Don't** import `services.*` (use `service.*`)
❌ **Don't** create circular dependencies

---

## ✅ Dos

✅ **Do** use services in endpoints
✅ **Do** use repositories in services
✅ **Do** throw exceptions in services
✅ **Do** map exceptions to HTTP in endpoints
✅ **Do** inject dependencies via `Depends()`

---

## 🔄 Dependency Flow

```
API Layer (endpoints)
    ↓ depends on
Service Layer (business logic)
    ↓ depends on
DAL Layer (repositories)
    ↓ depends on
Database
```

All layers can use → `common/` utilities

---

## 📝 Adding a New Feature

### 1. Create Repository Method (if needed)
```python
# dal/repositories/presentation_repository.py
async def search_by_title(self, search_term: str):
    statement = select(PresentationModel).where(...)
    return await self.session.execute(statement)
```

### 2. Create Service Method
```python
# service/presentation_service.py
async def search_presentations(self, search_term: str):
    if not search_term:
        raise ValidationError("Search term required")
    return await self.presentation_repo.search_by_title(search_term)
```

### 3. Create Endpoint
```python
# api/v1/ppt/endpoints/presentation.py
@router.get("/search/{term}")
async def search(
    term: str,
    service: PresentationService = Depends(get_presentation_service)
):
    try:
        return await service.search_presentations(term)
    except ValidationError as e:
        raise HTTPException(400, str(e))
```

---

## 🧪 Testing Pattern

```python
# Test service with mock repository
@pytest.fixture
def mock_repo():
    return Mock(spec=PresentationRepository)

async def test_create_presentation(mock_repo):
    service = PresentationService(mock_repo)
    mock_repo.create.return_value = PresentationModel(...)

    result = await service.create_presentation(...)

    assert result is not None
    mock_repo.create.assert_called_once()
```

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| `ARCHITECTURE.md` | Complete architecture guide |
| `REFACTORING_COMPLETE.md` | Completion report |
| `presentation_clean.py` | Clean endpoint examples |
| `NEXT_STEPS.md` | Optional improvements |

---

## 🆘 Common Issues

**Q: Import error `from services.*`**
A: Use `from service.*` (no 's')

**Q: How do I access database?**
A: Create repository method, use in service

**Q: Where do I put validation?**
A: Business validation in service layer

**Q: Where do I catch exceptions?**
A: In endpoints, map to HTTP status codes

---

## ✨ Remember

- Keep endpoints THIN (5-20 lines)
- Keep services FOCUSED (one domain)
- Keep repositories SIMPLE (data only)
- Use dependency injection
- Follow SOLID principles

**You've got this!** 🚀
