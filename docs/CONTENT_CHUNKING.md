# Smart Content Chunking - Quick Start

## Problem Solved

Fixed the **413 error** when rewriting large presentations:
```
Error: Requested 'input_tokens' are above the consumer's maximum for a single request.
Model has max context of 12000 tokens while 30215 were requested.
```

## Solution

The system now **automatically chunks** large presentations into smaller batches that fit within your model's token limits.

## How to Use

### No Configuration Needed (Default)

Just use the content rewrite endpoint as normal:

```bash
POST /api/v1/ppt/content-rewrite/generate-rewritten-content
```

The system will:
1. ✅ Estimate token usage
2. ✅ Split into batches if needed (default: 8000 tokens per batch)
3. ✅ Process each batch
4. ✅ Combine results automatically

### Custom Configuration (Optional)

If you need to adjust for your specific model, set the environment variable:

```bash
# For models with small context (4k)
export CONTENT_REWRITE_MAX_INPUT_TOKENS=3000

# For models with medium context (12k) - DEFAULT
export CONTENT_REWRITE_MAX_INPUT_TOKENS=8000

# For models with large context (32k+)
export CONTENT_REWRITE_MAX_INPUT_TOKENS=20000

# For models with very large context (100k+)
export CONTENT_REWRITE_MAX_INPUT_TOKENS=80000
```

Or add to your `.env` file:
```
CONTENT_REWRITE_MAX_INPUT_TOKENS=8000
```

## What You'll See

### Small Presentation (No Chunking)
```
INFO: Estimated tokens for 5 slides: ~2000
INFO: Processing content rewrite in 1 batch(es)
✅ Success: Generated content for 5 slides in 1 batch(es)
```

### Large Presentation (Automatic Chunking)
```
INFO: Estimated tokens for 50 slides: ~30000
INFO: Split 50 slides into 4 batches
INFO: Processing batch 1/4: 12 slides
INFO: Processing batch 2/4: 13 slides
INFO: Processing batch 3/4: 13 slides
INFO: Processing batch 4/4: 12 slides
INFO: Combining 4 batches into final result
✅ Success: Generated content for 50 slides in 4 batch(es)
```

## Benefits

- 🚀 **Works with any model** - no model-specific configuration needed
- 💰 **Token efficient** - only sends what's needed
- 🔧 **Easy to configure** - single environment variable
- 📊 **Transparent** - clear logging of what's happening
- ✨ **Automatic** - no code changes required

## Troubleshooting

### Still getting 413 errors?

Lower the token limit:
```bash
export CONTENT_REWRITE_MAX_INPUT_TOKENS=5000
```

### Processing too slowly?

If your model has a large context window, increase the limit:
```bash
export CONTENT_REWRITE_MAX_INPUT_TOKENS=15000
```

### How do I know what limit to use?

**Rule of thumb:**
- Take your model's max context (e.g., 12000)
- Subtract 4000 for output tokens and safety margin
- Use that number (e.g., 8000)

## Files Changed

- ✅ `services/content_chunker.py` - Smart chunking logic
- ✅ `api/v1/ppt/endpoints/content_rewrite.py` - Integrated chunking
- ✅ `tests/test_content_chunker.py` - Comprehensive tests
- ✅ `.env.example` - Configuration example

## Testing

Run tests to verify everything works:
```bash
python tests/test_content_chunker.py
```

All 9 tests should pass ✅
