# Multi-Agent Translation System

## Overview

The translation system uses a 3-agent architecture for optimal quality, performance, and cost:

1. **Agent 1 (Parser)**: Analyzes placeholders and categorizes elements
2. **Agent 2 (Translator)**: Performs high-quality translation
3. **Agent 3 (Validator)**: Validates and combines results

Each agent can use a different model, allowing you to optimize for cost/quality tradeoffs.

## Architecture Benefits

### Why 3 Agents?

**Traditional Single-Agent Approach Issues:**
- Uses expensive model for all tasks (even simple parsing)
- Context window fills up with metadata
- Hard to debug translation quality
- Can't optimize different aspects separately

**Multi-Agent Benefits:**
- **Cost Optimization**: Use cheap models for parsing/validation, expensive for translation
- **Better Quality**: Specialized agent for pure translation
- **Faster Processing**: Parallel processing potential
- **Easier Debugging**: Clear separation of concerns
- **Flexible Configuration**: Different models per stage

## Agent Details

### Agent 1: Parser & Analyzer
**Purpose**: Analyze placeholder structure and create translation context

**Responsibilities:**
- Extract text elements with IDs and constraints
- Categorize elements (title, body, bullet, technical, etc.)
- Identify non-translatable content (URLs, code, brand names)
- Add context notes for translator

**Model Recommendation:**
- **Rule-based (default)**: No LLM, pure logic - FREE
- **GPT-4o-mini**: Fast categorization if LLM needed - $0.15/1M tokens
- **Claude Haiku**: Alternative fast model - $0.25/1M tokens

**Why cheap/no model:**
- Task is mostly pattern matching
- No complex reasoning needed
- Runs for every element
- Rule-based works well

### Agent 2: Translation Specialist
**Purpose**: High-quality translation with context awareness

**Responsibilities:**
- Translate text chunks from source to target language
- Respect length and line constraints
- Maintain tone, style, formality
- Handle RTL/LTR properly
- Preserve formatting

**Model Recommendation:**
- **GPT-4 (default)**: Best general translation - $30/1M input tokens
- **Claude Opus**: Highest quality, great for creative text - $15/1M input tokens
- **GPT-4-turbo**: Good balance - $10/1M input tokens
- **Specialized models**: Google Translate API, DeepL Pro, etc.

**Why expensive model:**
- Translation quality is critical
- Requires cultural/linguistic knowledge
- Must handle nuance and idioms
- Only runs on actual translatable text

### Agent 3: Validator & Combiner
**Purpose**: Validate translations and ensure quality

**Responsibilities:**
- Validate structure matches original
- Check length constraints
- Fix truncation issues
- Combine results
- Log quality metrics

**Model Recommendation:**
- **GPT-4o-mini (default)**: Fast validation - $0.15/1M tokens
- **Claude Haiku**: Alternative - $0.25/1M tokens
- **Rule-based**: For simple validation

**Why cheap model:**
- Mostly checking constraints
- Simple fixes (truncation)
- Runs at the end
- No complex reasoning

## Configuration

### Environment Variables

Add these to your `.env` file or docker-compose.yml:

```bash
# Enable/disable multi-agent system
TRANSLATION_USE_AGENTS=true  # Set to "false" to use legacy single-agent

# Agent 1: Parser Configuration
TRANSLATION_PARSER_USE_LLM=false  # Use LLM for parsing (vs rule-based)
TRANSLATION_PARSER_MODEL=gpt-4o-mini  # Model if using LLM

# Agent 2: Translator Configuration
TRANSLATION_MODEL=gpt-4  # Main translation model (most important!)
TRANSLATION_BATCH_SIZE=20  # Elements per batch

# Agent 3: Validator Configuration
TRANSLATION_VALIDATOR_MODEL=gpt-4o-mini  # Validation model
```

### Recommended Configurations

#### 1. **Maximum Quality** (Recommended for important translations)
```bash
TRANSLATION_USE_AGENTS=true
TRANSLATION_PARSER_USE_LLM=false  # Rule-based is fine
TRANSLATION_MODEL=claude-opus-3  # or gpt-4
TRANSLATION_BATCH_SIZE=15  # Smaller batches for quality
TRANSLATION_VALIDATOR_MODEL=gpt-4o-mini
```
**Cost**: ~$15-30 per 1M tokens
**Best for**: Marketing materials, customer-facing content

#### 2. **Balanced** (Default - Good quality, reasonable cost)
```bash
TRANSLATION_USE_AGENTS=true
TRANSLATION_PARSER_USE_LLM=false
TRANSLATION_MODEL=gpt-4
TRANSLATION_BATCH_SIZE=20
TRANSLATION_VALIDATOR_MODEL=gpt-4o-mini
```
**Cost**: ~$5-10 per 1M tokens
**Best for**: General presentations, internal documents

#### 3. **Fast & Cheap** (Budget-friendly)
```bash
TRANSLATION_USE_AGENTS=true
TRANSLATION_PARSER_USE_LLM=false
TRANSLATION_MODEL=gpt-4o-mini  # or gpt-3.5-turbo
TRANSLATION_BATCH_SIZE=30
TRANSLATION_VALIDATOR_MODEL=gpt-4o-mini
```
**Cost**: ~$0.30 per 1M tokens
**Best for**: Quick translations, drafts, high-volume

#### 4. **Legacy Mode** (Old single-agent system)
```bash
TRANSLATION_USE_AGENTS=false
# Uses the original TRANSLATE mode with single LLM call
```

## Performance Comparison

### Example: 50-slide presentation, 200 text elements

| Configuration | Time | Cost | Quality |
|--------------|------|------|---------|
| **Max Quality** (Opus) | ~45s | $0.12 | ⭐⭐⭐⭐⭐ |
| **Balanced** (GPT-4) | ~40s | $0.08 | ⭐⭐⭐⭐ |
| **Fast** (GPT-4o-mini) | ~25s | $0.02 | ⭐⭐⭐ |
| **Legacy** (Single GPT-4) | ~60s | $0.15 | ⭐⭐⭐ |

## Agent Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Uploads PPTX                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  AGENT 1: Parser (Rule-based or GPT-4o-mini)                │
│  ─────────────────────────────────────────────────          │
│  • Extract 200 elements with IDs                            │
│  • Categorize: 20 titles, 100 body, 50 bullets, 30 metadata│
│  • Mark 30 as non-translatable (URLs, dates, code)          │
│  • Add context: "This is a title, keep it concise"          │
│  Output: 170 translatable + 30 preserved                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  AGENT 2: Translator (GPT-4 or Claude Opus)                 │
│  ─────────────────────────────────────────────────          │
│  Batch 1 (20 elements): Hebrew → English                    │
│  Batch 2 (20 elements): Hebrew → English                    │
│  ...                                                         │
│  Batch 9 (10 elements): Hebrew → English                    │
│  Output: 170 high-quality translations                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  AGENT 3: Validator (GPT-4o-mini)                           │
│  ─────────────────────────────────────────────────          │
│  • Validate all 200 elements present                        │
│  • Check length constraints (3 violations found, fixed)     │
│  • Verify structure matches original                        │
│  • Combine 170 translations + 30 preserved                  │
│  Output: Final validated structure for 50 slides            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Inject into PPTX & Download                     │
└─────────────────────────────────────────────────────────────┘
```

## Advanced Configuration

### Custom Batching Strategy

For very large presentations (100+ slides), you can adjust batching:

```bash
# Smaller batches for better quality but slower
TRANSLATION_BATCH_SIZE=10

# Larger batches for faster processing
TRANSLATION_BATCH_SIZE=50
```

### Using Different Models

You can mix and match any supported models:

```bash
# Use Anthropic Claude for translation
TRANSLATION_MODEL=claude-opus-3

# Use Google Gemini for translation
TRANSLATION_MODEL=gemini-pro

# Use Ollama for local translation
TRANSLATION_MODEL=llama3:70b
```

### Disable Specific Agents

If you want to skip an agent:

```bash
# Skip validation (not recommended)
TRANSLATION_VALIDATOR_MODEL=none

# Use rule-based parser always
TRANSLATION_PARSER_USE_LLM=false
```

## Monitoring & Debugging

### Log Output

The system logs detailed information:

```
INFO: Starting multi-agent translation: hebrew → english
INFO: Agent 1 (Parser): Analyzing placeholder structure...
INFO: Parser Agent: Analyzed 200 elements
INFO: Agent 2 (Translator): Translating content...
INFO: Translator Agent: Processing batch 1/9 (20 elements)
INFO: Translator Agent: Processing batch 2/9 (20 elements)
...
INFO: Translator Agent: Completed 170 translations
INFO: Agent 3 (Validator): Validating and combining results...
WARNING: Validator Agent: Found 3 constraint violations (auto-fixed)
INFO: Multi-agent translation complete: 50 slides
```

### Cost Tracking

To track costs, monitor these metrics:
- **Parser tokens**: Usually 0 (rule-based) or ~100 per element
- **Translator tokens**: ~50-200 per element (main cost)
- **Validator tokens**: ~20 per element

## Troubleshooting

### Translation Quality Issues

**Problem**: Translations lose nuance
**Solution**: Use better translator model:
```bash
TRANSLATION_MODEL=claude-opus-3  # or gpt-4
```

**Problem**: Translations too literal
**Solution**: Reduce batch size for more context:
```bash
TRANSLATION_BATCH_SIZE=10
```

### Performance Issues

**Problem**: Translation too slow
**Solution**: Increase batch size or use faster model:
```bash
TRANSLATION_BATCH_SIZE=30
TRANSLATION_MODEL=gpt-4o-mini
```

**Problem**: Too expensive
**Solution**: Use cheaper models or disable agents:
```bash
TRANSLATION_MODEL=gpt-4o-mini
TRANSLATION_USE_AGENTS=false  # Use legacy mode
```

### Constraint Violations

**Problem**: Text doesn't fit in slides
**Solution**: Validator auto-fixes, but you can improve by:
- Using smaller batch sizes
- Adding specific instructions in the user prompt
- Adjusting maxLength calculations

## API Usage

### Frontend Integration

The multi-agent system is transparent to the frontend. Just use the existing API:

```typescript
const response = await fetch('/api/v1/ppt/rewrite/generate-rewritten-content', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    user_prompt: 'Additional instructions (optional)',
    placeholder_structure: extractedStructure,
    mode: 'translate',
    source_language: 'hebrew',
    target_language: 'english'
  })
})
```

The system automatically uses multi-agent translation when:
- `mode` is `"translate"`
- `TRANSLATION_USE_AGENTS=true` (default)
- `source_language` and `target_language` are provided

## Future Enhancements

Potential improvements to the agent system:

1. **Parallel Processing**: Run translation batches in parallel
2. **Caching**: Cache common translations
3. **Custom Glossaries**: Add domain-specific terminology
4. **Quality Scoring**: LLM evaluates translation quality
5. **A/B Testing**: Compare different models automatically
6. **Streaming**: Stream translations as they complete

## Summary

**Key Takeaways:**
- ✅ Multi-agent = Better quality + Lower cost + More control
- ✅ Parser agent is rule-based (free) by default
- ✅ Translator agent is the key quality factor
- ✅ Validator ensures reliability
- ✅ Fully configurable via environment variables
- ✅ Transparent to frontend
- ✅ Falls back to legacy mode if needed

**Recommended Starting Point:**
```bash
TRANSLATION_USE_AGENTS=true
TRANSLATION_PARSER_USE_LLM=false
TRANSLATION_MODEL=gpt-4
TRANSLATION_BATCH_SIZE=20
TRANSLATION_VALIDATOR_MODEL=gpt-4o-mini
```

This gives you excellent quality at reasonable cost!
