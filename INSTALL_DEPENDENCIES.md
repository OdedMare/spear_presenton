# Installing Translation Dependencies

The multi-agent translation feature requires two additional Python packages:
- `deep-translator` - For Google Translate API integration
- `langdetect` - For automatic language detection

## Quick Install

### Option 1: Docker (Recommended)
The dependencies are automatically installed when building the Docker image.

```bash
docker-compose build
docker-compose up
```

### Option 2: Local Development

#### If using a virtual environment:
```bash
cd servers/fastapi
source venv/bin/activate  # or your virtualenv path
pip install deep-translator langdetect
```

#### If using system Python (macOS with externally-managed environment):
```bash
cd servers/fastapi
pip install --user deep-translator langdetect
```

#### Or use pipx for isolated installation:
```bash
brew install pipx
pipx install deep-translator langdetect
```

### Option 3: Install from requirements.txt
```bash
cd servers/fastapi
pip install -r requirements.txt
```

## Verify Installation

Check if dependencies are installed:

```bash
python3 -c "from deep_translator import GoogleTranslator; from langdetect import detect; print('✅ Dependencies installed!')"
```

Or use the health check endpoint:

```bash
curl http://localhost:8000/api/v1/ppt/translate/health
```

Expected response when installed:
```json
{
  "status": "healthy",
  "dependencies_installed": true,
  ...
}
```

Expected response when NOT installed:
```json
{
  "status": "dependencies_missing",
  "dependencies_installed": false,
  "error": "Translation dependencies not installed...",
  "install_command": "pip install deep-translator langdetect"
}
```

## Graceful Degradation

The server will **start successfully** even if these dependencies are not installed. The translation dependencies are lazy-loaded only when the translation endpoint is called.

If you try to use the translation endpoint without installing dependencies, you'll get a clear error message:

```json
{
  "status": "error",
  "stage": "unknown",
  "message": "Translation dependencies not installed. Run: pip install deep-translator langdetect"
}
```

## Troubleshooting

### macOS: "externally-managed-environment" error

If you see this error when trying to install:
```
error: externally-managed-environment
```

**Solution 1:** Use a virtual environment (recommended)
```bash
python3 -m venv venv
source venv/bin/activate
pip install deep-translator langdetect
```

**Solution 2:** Install with --user flag
```bash
pip install --user deep-translator langdetect
```

**Solution 3:** Use Docker (easiest)
```bash
docker-compose up
```

### Verification Failed

If `python3 -c "from deep_translator import GoogleTranslator"` fails:

1. Check Python version (requires 3.7+)
   ```bash
   python3 --version
   ```

2. Check pip version
   ```bash
   pip --version
   ```

3. Try upgrading pip
   ```bash
   pip install --upgrade pip
   ```

4. Install with verbose output
   ```bash
   pip install -v deep-translator langdetect
   ```

## Alternative: Use Existing LLM for Translation

If you can't install the dependencies, you can still use translation by configuring the existing LLM-based translation in the content rewrite endpoint:

```bash
POST /api/v1/ppt/rewrite/generate-rewritten-content
{
  "mode": "translate",
  "source_language": "hebrew",
  "target_language": "english",
  ...
}
```

This uses the existing `translate_with_agents()` function which doesn't require the new dependencies.
