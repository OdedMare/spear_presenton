# Small Model Optimization

## Overview

The content rewrite system has been optimized to work with smaller LLMs (7B-13B parameters) by introducing **Lite Prompts** and **Automatic Fallback**.

## Features

### 1. Automatic Fallback (Default)

The system is designed to be robust out of the box:

1. **Attempt 1**: Tries the full, detailed system prompt.
2. **On Failure**: If the model fails (invalid JSON, refusal, etc.), it automatically retries with the **Lite Prompt**.
3. **Success**: Returns the result from the successful attempt.

This ensures that capable models get the full detailed instructions, while smaller models can still succeed with simplified instructions.

### 2. Lite Prompts

Lite prompts are significantly shorter and simpler:
- **Reduced Token Count**: Saves ~500-1000 tokens per request.
- **Simplified Instructions**: Easier for small models to follow.
- **Focus on Structure**: Prioritizes valid JSON output over complex style nuances.

### 3. Configuration

You can force a specific mode using the `CONTENT_REWRITE_PROMPT_MODE` environment variable:

```bash
# Default: Try full, then lite
export CONTENT_REWRITE_PROMPT_MODE=auto

# Force Lite prompts (faster, cheaper, better for small models)
export CONTENT_REWRITE_PROMPT_MODE=lite

# Force Full prompts (disable fallback)
export CONTENT_REWRITE_PROMPT_MODE=full
```

## Recommended Settings for Small Models

If you are using a small model (e.g., Qwen 7B, Llama 3 8B), we recommend:

1. **Set Token Limit**:
   ```bash
   export CONTENT_REWRITE_MAX_INPUT_TOKENS=6000
   ```

2. **Force Lite Mode** (Optional, saves time by skipping the first failed attempt):
   ```bash
   export CONTENT_REWRITE_PROMPT_MODE=lite
   ```

## How it Works

```python
# Pseudo-code of the logic
try:
    # Attempt 1: Full Prompt
    response = llm.generate(full_prompt)
    return parse(response)
except Error:
    # Attempt 2: Lite Prompt
    response = llm.generate(lite_prompt)
    return parse(response)
```

## Verification

Run the fallback tests to verify behavior:
```bash
python tests/test_content_rewrite_fallback.py
```
