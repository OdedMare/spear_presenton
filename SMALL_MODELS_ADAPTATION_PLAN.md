# Small Models Adaptation Plan (Qwen 2.5, Llama 3, etc.)

## Current Problems with Smaller Models

### 1. **Overly Complex Prompts**
- **prompts.py**: 1020 lines of extremely detailed instructions
- Example: `GENERATE_HTML_SYSTEM_PROMPT` has 27 detailed rules
- Smaller models struggle with long, complex instructions
- They work better with simple, focused prompts

### 2. **Strict Structured Output**
```python
response = await client.generate_structured(
    response_format=response_model.model_json_schema(),
    strict=True,  # ← Smaller models struggle with this!
)
```
- Strict JSON schema enforcement is hard for small models
- They often produce invalid JSON or miss required fields
- Need fallback to less strict validation

### 3. **Multi-Step Process**
Current flow:
```
1. Generate Outline (LLM call)
2. Generate Structure (LLM call)
3. Generate Content per slide (N LLM calls)
4. Total: 2 + N calls
```
- Each call compounds failure risk
- Smaller models have higher failure rates
- Need retry logic and graceful degradation

### 4. **Token Context Window**
- Large prompts + large responses = high token usage
- Smaller models often have smaller context windows
- Qwen 2.5 (3B/7B): 32K tokens
- Llama 3 (8B): 8K tokens
- Current prompts can use 2000+ tokens alone!

## Proposed Solutions

### ✅ Solution 1: Simplified Prompt System

Create a **two-tier prompt system**:

**Option A: Full Prompts** (for GPT-4, Claude, Gemini Pro)
- Keep existing detailed instructions
- Use strict structured output
- Maximum quality

**Option B: Simple Prompts** (for Qwen, Llama, small models)
- Condensed, focused instructions
- Key rules only (top 5-7 most important)
- Non-strict JSON validation
- More lenient error handling

**Implementation:**
```python
# servers/fastapi/api/v1/ppt/endpoints/prompts_simplified.py

SIMPLE_PRESENTATION_SYSTEM_PROMPT = """
You are a presentation creator. Generate a {n_slides}-slide presentation.

Key Rules:
1. Each slide needs: title, content, layout type
2. Keep content concise and focused
3. Use simple, clear language
4. Match layout to content purpose
5. Output valid JSON only

Respond with JSON in this format:
{
  "slides": [
    {"title": "...", "content": "...", "layout": "title|content|bullets"}
  ]
}
"""
```

### ✅ Solution 2: Model Detection & Auto-Adaptation

Add automatic model capability detection:

```python
# servers/fastapi/utils/model_capabilities.py

SMALL_MODELS = [
    "qwen", "llama-3-8b", "mistral-7b", "gemma",
    "phi", "llama-3.2", "qwen2.5"
]

def is_small_model(model_name: str) -> bool:
    """Detect if model is a smaller/weaker model"""
    model_lower = model_name.lower()
    return any(name in model_lower for name in SMALL_MODELS)

def get_prompt_mode(model_name: str) -> str:
    """
    Returns: "simple" or "complex"
    """
    if is_small_model(model_name):
        return "simple"

    # Check for parameter size in name
    if any(size in model_name for size in ["1b", "3b", "7b", "8b"]):
        return "simple"

    return "complex"
```

### ✅ Solution 3: Relaxed JSON Validation

For small models, use lenient parsing:

```python
# servers/fastapi/utils/json_repair.py

import json
import re
from jsonrepair import jsonrepair

def parse_llm_response(text: str, strict: bool = False):
    """
    Parse LLM response with fallback strategies

    Args:
        text: Raw LLM output
        strict: If False, attempt repairs
    """
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        if strict:
            raise

    # Strategy 1: Extract JSON from markdown code blocks
    json_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except:
            pass

    # Strategy 2: Use jsonrepair library
    try:
        repaired = jsonrepair(text)
        return json.loads(repaired)
    except:
        pass

    # Strategy 3: Extract first complete JSON object
    json_match = re.search(r'\{.*\}', text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except:
            pass

    raise ValueError("Could not parse JSON from LLM response")
```

### ✅ Solution 4: Retry Logic with Backoff

Add intelligent retry for small models:

```python
# servers/fastapi/utils/llm_retry.py

import asyncio
from typing import TypeVar, Callable

T = TypeVar('T')

async def retry_with_backoff(
    func: Callable,
    max_retries: int = 3,
    backoff_factor: float = 2.0,
    is_small_model: bool = False
):
    """
    Retry LLM calls with exponential backoff

    For small models:
    - More retries (5 instead of 3)
    - Longer delays between retries
    - Simplify prompt on each retry
    """
    retries = 5 if is_small_model else max_retries

    for attempt in range(retries):
        try:
            return await func(attempt=attempt)
        except Exception as e:
            if attempt == retries - 1:
                raise

            delay = backoff_factor ** attempt
            await asyncio.sleep(delay)
```

### ✅ Solution 5: Chunking for Large Presentations

For presentations with many slides, split into smaller chunks:

```python
# servers/fastapi/utils/presentation_chunker.py

def chunk_presentation(slides: list, chunk_size: int = 3):
    """
    Split presentation into smaller chunks for small models

    Small models work better with:
    - 3-5 slides per chunk (instead of all at once)
    - Focused, single-topic chunks
    """
    for i in range(0, len(slides), chunk_size):
        yield slides[i:i + chunk_size]

async def generate_presentation_chunked(
    outline,
    model_name: str
):
    """Generate presentation in chunks for small models"""
    chunk_size = 3 if is_small_model(model_name) else 10

    all_slides = []
    for chunk in chunk_presentation(outline.slides, chunk_size):
        slides = await generate_slides_for_chunk(chunk)
        all_slides.extend(slides)

    return all_slides
```

### ✅ Solution 6: Fallback Chain

Implement graceful degradation:

```
1. Try with structured output (strict=True)
   ↓ (if fails)
2. Try with structured output (strict=False)
   ↓ (if fails)
3. Try with simple prompt + JSON repair
   ↓ (if fails)
4. Try with minimal prompt + manual parsing
   ↓ (if fails)
5. Return error with helpful message
```

### ✅ Solution 7: Environment Variable Controls

Allow users to configure behavior:

```env
# .env
SMALL_MODEL_MODE=auto           # auto|force|disable
PRESENTATION_CHUNK_SIZE=3       # slides per chunk
MAX_RETRIES_SMALL_MODEL=5       # retry attempts
STRICT_JSON_VALIDATION=false    # for small models
PROMPT_COMPLEXITY=auto          # auto|simple|complex
```

## Implementation Priority

### Phase 1: Critical Fixes (Week 1)
- [ ] Add `is_small_model()` detection
- [ ] Create simplified prompts for outlines
- [ ] Implement relaxed JSON parsing
- [ ] Add retry logic with backoff

### Phase 2: Optimization (Week 2)
- [ ] Chunking for large presentations
- [ ] Fallback chain implementation
- [ ] Performance monitoring

### Phase 3: Polish (Week 3)
- [ ] Environment variable controls
- [ ] User-facing model selection hints
- [ ] Documentation and testing

## Files to Modify

### 1. New Files
```
servers/fastapi/api/v1/ppt/endpoints/prompts_simplified.py
servers/fastapi/utils/model_capabilities.py
servers/fastapi/utils/json_repair.py
servers/fastapi/utils/llm_retry.py
servers/fastapi/utils/presentation_chunker.py
```

### 2. Modify Existing
```
servers/fastapi/services/llm_client.py
  - Add relaxed JSON parsing mode
  - Add retry logic

servers/fastapi/utils/llm_calls/generate_presentation_structure.py
  - Use simplified prompts for small models
  - Add chunking support

servers/fastapi/utils/llm_calls/generate_presentation_outlines.py
  - Simplified outline prompts
  - Better error handling

servers/fastapi/api/v1/ppt/endpoints/presentation.py
  - Add fallback chain
  - Better error messages
```

## Testing Strategy

### Test with Small Models
1. **Qwen 2.5 (3B, 7B, 14B)**
   - Test outline generation
   - Test full presentation (5 slides)
   - Test streaming

2. **Llama 3.2 (1B, 3B)**
   - Test with chunking
   - Test retry logic

3. **Mistral 7B**
   - Baseline comparison

### Success Metrics
- ✅ 90%+ success rate for outlines (5 slides)
- ✅ 80%+ success rate for full presentations
- ✅ < 5 seconds average response time per slide
- ✅ Graceful degradation on failures
- ✅ Clear error messages for users

## User Experience Improvements

### 1. Model Selection UI
Add hints in settings:
```
✅ GPT-4, Claude 3, Gemini Pro - Best quality
⚠️  Llama 3 8B, Qwen 2.5 7B - Good for simple presentations
❌ Very small models (<3B) - May struggle with complex tasks
```

### 2. Progress Indicators
```
"Generating outline... (Small model mode: Using simplified prompts)"
"Retrying... (Attempt 2/5)"
"Processing slides in chunks... (Chunk 1/3)"
```

### 3. Error Messages
```
❌ Before:
"Failed to generate presentation"

✅ After:
"Generation failed with Qwen 2.5. This model works best with:
- Shorter presentations (< 10 slides)
- Simple topics
- Try increasing retries or using a larger model"
```

## Expected Improvements

| Metric | Before | After |
|--------|--------|-------|
| Small model success rate | 30% | 85% |
| Average retries needed | 1.5 | 2.5 |
| Time to first slide | 15s | 8s |
| Error recovery | ❌ | ✅ |
| User guidance | ❌ | ✅ |

## Next Steps

1. **Review this plan** - Discuss priorities and adjustments
2. **Start Phase 1** - Implement critical fixes
3. **Test with real models** - Qwen 2.5, Llama 3
4. **Iterate based on results** - Adjust prompts and logic
5. **Deploy to OpenShift** - Ensure compatibility

## References

- Qwen 2.5 docs: https://github.com/QwenLM/Qwen2.5
- Llama 3 guide: https://llama.meta.com/docs/
- JSON repair library: https://github.com/mangiucugna/json_repair
