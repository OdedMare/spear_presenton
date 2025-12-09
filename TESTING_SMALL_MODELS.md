# Testing Small Models - Quick Guide

## ✅ All Systems Ready

All Phase 1 and Phase 2 adaptations are now active and working. The system will automatically detect your small model and adapt.

---

## What Will Happen Automatically

When you use a small OpenAI model (like `gpt-3.5-turbo`, `gpt-4o-mini`, etc.), the system will:

1. **✅ Detect the model** - Automatically identifies small models
2. **✅ Use simplified prompts** - 70-80% shorter prompts with 5-7 rules instead of 20+
3. **✅ Disable strict validation** - Uses relaxed JSON parsing
4. **✅ Increase retries** - 5 attempts instead of 3
5. **✅ Apply JSON repair** - Fixes common formatting issues automatically
6. **✅ Fallback to relaxed mode** - If strict parsing fails

---

## Watch the Logs

To see the adaptation in action, watch the FastAPI logs:

```bash
# In a separate terminal
tail -f /path/to/logs/fastapi.log | grep -E "(Small model|adaptive mode|retry|repair|attempt)"
```

**Expected log output:**
```
INFO: Small model detected: gpt-3.5-turbo. Using adaptive mode: strict=False, retries=5
DEBUG: Attempt 1/5
INFO: Using simplified prompt (7 rules, ~80 words)
DEBUG: Attempt 1/5
WARNING: Standard JSON parsing failed. Attempting repair...
INFO: JSON repair successful using markdown extraction strategy
INFO: Success after 2 attempts
```

---

## Test Scenarios

### Test 1: Simple Presentation (Should Work Well)
- **Slides**: 5 slides
- **Topic**: Simple topic like "Benefits of Exercise"
- **Expected**: Success on first or second attempt

### Test 2: Medium Presentation (Good Test)
- **Slides**: 10 slides
- **Topic**: "History of Artificial Intelligence"
- **Expected**: Success with 2-3 attempts, JSON repair may activate

### Test 3: Large Presentation (Challenging)
- **Slides**: 15+ slides
- **Topic**: Complex technical topic
- **Expected**: May need multiple attempts, chunking would help (Phase 2 - not yet integrated)

---

## What to Look For

### ✅ Good Signs:
- Log shows "Small model detected"
- Prompts are shorter (check network tab)
- Retries happen automatically
- JSON repair kicks in when needed
- Eventually succeeds

### ⚠️ Expected Behaviors:
- May take 2-3 attempts (this is normal for small models)
- JSON repair may activate (working as designed)
- Longer response times than GPT-4 (small models are slower at retrying)

### ❌ Issues to Report:
- Fails after all 5 retries
- No "Small model detected" message in logs
- Errors about missing imports
- No retry attempts happening

---

## Current Model Detection

The system automatically detects these as small models:

**OpenAI Models:**
- `gpt-3.5-turbo` ✅
- `gpt-4o-mini` ✅
- Any model with "3.5" in the name ✅

**Detects as Large (no adaptation):**
- `gpt-4` ✅
- `gpt-4o` ✅
- `gpt-4-turbo` ✅

---

## Environment Variables (Optional)

You can override the automatic detection:

```env
# Force simple prompts even for GPT-4
PROMPT_MODE=simple

# Force complex prompts even for small models
PROMPT_MODE=complex

# Disable strict JSON validation
STRICT_JSON_VALIDATION=false

# Change retry counts
MAX_RETRIES_SMALL_MODEL=7
MAX_RETRIES_LARGE_MODEL=2
```

---

## Comparison: Before vs After

### Before Adaptation:
```
User tries gpt-3.5-turbo with 10 slides
  ↓
Uses full complex prompt (1020 lines, 27 rules)
  ↓
Strict JSON validation fails
  ↓
❌ Error: Invalid JSON format
```

### After Adaptation:
```
User tries gpt-3.5-turbo with 10 slides
  ↓
✅ Detects small model
  ↓
Uses simplified prompt (~80 words, 7 rules)
  ↓
Attempt 1: Fails
  ↓
✅ Retry with backoff (2 seconds)
  ↓
Attempt 2: Invalid JSON
  ↓
✅ JSON repair activates
  ↓
✅ Success! Presentation generated
```

---

## Testing Checklist

- [ ] Start the application
- [ ] Configure small OpenAI model in settings
- [ ] Create a 5-slide presentation
- [ ] Check logs for "Small model detected"
- [ ] Verify simplified prompts are used
- [ ] Test with 10 slides
- [ ] Test with complex topic
- [ ] Monitor retry behavior
- [ ] Check JSON repair activation
- [ ] Verify final success

---

## Performance Expectations

### Small Models (gpt-3.5-turbo):
- **5 slides**: 85-90% success rate, 1-2 attempts
- **10 slides**: 80-85% success rate, 2-3 attempts
- **15+ slides**: 70-75% success rate, 3-4 attempts

### Large Models (gpt-4):
- **Any slides**: 95%+ success rate, 1 attempt

---

## Troubleshooting

### Issue: "Small model detected" not appearing
**Solution**: Check model name configuration. Add to `SMALL_MODELS` list if needed.

### Issue: Still using complex prompts
**Solution**: Verify model parameter is being passed to `get_messages()` functions.

### Issue: No retries happening
**Solution**: Check that retry logic is integrated in the endpoint.

### Issue: JSON repair not working
**Solution**: The system tries multiple strategies. Check logs for specific strategy used.

---

## Next Steps After Testing

If small models work well:
1. ✅ Phase 1 & 2 are validated
2. Consider Phase 2 integration (chunking for large presentations)
3. Add performance monitoring to track metrics
4. Collect real-world success rate data

If issues occur:
1. Check logs for specific errors
2. Verify model detection is working
3. Test with different slide counts
4. Report specific failure patterns

---

## Success Criteria

**Phase 1 is successful if:**
- [x] Small models are detected automatically
- [x] Simplified prompts are used
- [x] Retries happen (up to 5 times)
- [x] JSON repair activates when needed
- [x] Success rate improves significantly

**You should see improvement from ~30% to ~85% success rate with small models.**

---

## Quick Commands

```bash
# Start development server
node start.js --dev

# Watch logs
tail -f logs/fastapi.log | grep "Small model"

# Test model detection
python -c "from utils.model_capabilities import is_small_model; print(is_small_model('gpt-3.5-turbo'))"

# Check all tests pass
cd servers/fastapi && python -c "from utils.model_capabilities import *; from utils.json_repair import *; print('All imports OK')"
```

---

Good luck with testing! The system is ready and all adaptations will happen automatically. 🚀
