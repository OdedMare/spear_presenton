# OpenShift Deployment Fixes - Summary

This document summarizes all the fixes implemented to resolve OpenShift deployment issues.

## Date
December 11, 2025

## Issues Fixed

### 1. Icon Generation IndexError ✅ FIXED

**Problem**: When ChromaDB ONNX models timeout during download, the code crashed with `IndexError: list index out of range`

**Root Cause**: The code tried to pop from an empty results list when icon embeddings failed to download.

**Files Changed**:
- `servers/fastapi/utils/process_slides.py` (lines 52-58)

**Fix Applied**:
```python
for icon_path in icon_paths:
    icon_dict = get_dict_at_path(slide.content, icon_path)
    # Check if we have results available before popping
    if results:
        icon_dict["__icon_url__"] = results.pop()[0]
        set_dict_at_path(slide.content, icon_path, icon_dict)
    # If no results available (icon generation failed), skip this icon
```

**Result**: Presentations continue to generate without icons when icon service fails, instead of crashing.

---

### 2. Icon Embeddings SSL Certificate Failure ✅ FIXED

**Problem**: ChromaDB ONNX embedding models can't download in OpenShift due to self-signed SSL certificates.

**Root Cause**: OpenShift uses self-signed certificates that Python's SSL verification rejects.

**Files Changed**:
- `servers/fastapi/services/icon_finder_service.py` (lines 14-20)

**Fix Applied**:
Added SSL bypass when `DISABLE_SSL_VERIFY=true`:
```python
if os.getenv("DISABLE_SSL_VERIFY", "false").lower() == "true":
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    os.environ["CURL_CA_BUNDLE"] = ""
    os.environ["REQUESTS_CA_BUNDLE"] = ""
    ssl._create_default_https_context = ssl._create_unverified_context
```

**Environment Variable Required**:
```yaml
- name: DISABLE_SSL_VERIFY
  value: "true"
```

---

### 3. PDF/PPTX Export Network Error ✅ FIXED

**Problem**: PDF and PPTX exports reach 100% but then fail with "network error" when trying to download the file.

**Root Causes**:
1. Nginx was using `localhost` instead of `127.0.0.1` to proxy to FastAPI
2. Next.js export routes were using `localhost:3000` for Puppeteer
3. nginx.conf was not being copied into Docker image

**Files Changed**:
- `nginx.conf` - ALL proxy_pass directives updated
- `servers/nextjs/app/api/export-as-pdf/route.ts` (line 44)
- `servers/nextjs/app/api/presentation_to_pptx_model/route.ts` (line 110)
- `start.js` (line 159) - Added `-H 0.0.0.0` to Next.js
- `Dockerfile` (line 71)
- `Dockerfile.offline` (line 71)

**Fixes Applied**:

**A. Nginx Configuration** - Changed all `localhost` to `127.0.0.1`:
```nginx
location / {
    proxy_pass http://127.0.0.1:3000;  # Was: localhost:3000
}

location /api/v1/ {
    proxy_pass http://127.0.0.1:8000;  # Was: localhost:8000
}

location /mcp/ {
    proxy_pass http://127.0.0.1:8001/mcp/;  # Was: localhost:8001
}
```

**B. Export Routes** - Updated Puppeteer base URL:
```typescript
const baseUrl = process.env.NEXTJS_BASE_URL || 'http://127.0.0.1:3000';
```

**C. Next.js Binding** - Bind to all interfaces:
```javascript
["run", isDev ? "dev" : "start", "--", "-p", nextjsPort.toString(), "-H", "0.0.0.0"]
```

**D. Docker Configuration** - Copy nginx.conf into image:
```dockerfile
COPY nginx.conf /etc/nginx/nginx.conf
```

**Environment Variable** (optional override):
```yaml
- name: NEXTJS_BASE_URL
  value: "http://127.0.0.1:3000"
```

**Result**: PDF and PPTX exports now complete successfully and download correctly.

---

### 4. Docling SSL Certificate Failure ✅ ALREADY IMPLEMENTED

**Problem**: Docling can't download AI models from HuggingFace due to self-signed SSL certificates.

**Status**: SSL bypass was already implemented in `docling_service.py` (lines 14-26)

**Environment Variable Required**:
```yaml
- name: DISABLE_SSL_VERIFY
  value: "true"
```

**Verification**: The fix is in place. If you're still seeing SSL errors, ensure the environment variable is set.

---

### 5. Offline Deployment Support ✅ ENHANCED

**Problem**: Models need to be downloaded at runtime, which fails in airgapped environments.

**Files Changed**:
- `download_models.py` - NEW: Downloads both Docling and ChromaDB models
- `Dockerfile.offline` - NEW: Bundles pre-downloaded models
- `docs/OFFLINE_DEPLOYMENT.md` - Complete offline deployment guide

**Solution**:

**For Internet-Connected Deployments**:
Set `DISABLE_SSL_VERIFY=true` to bypass certificate issues during runtime model download.

**For Completely Offline Deployments**:
1. On internet-connected machine:
   ```bash
   python3 download_models.py
   ```
2. Build Docker image with bundled models:
   ```bash
   docker build -f Dockerfile.offline -t presenton:offline .
   ```
3. Transfer image to airgapped environment
4. Deploy without needing any internet access

**Models Downloaded**:
- Docling models: `huggingface_models/` (~500MB-1GB)
- ChromaDB ONNX models: `chroma_models/` (~100MB)

---

## Testing Checklist

To verify all fixes are working in your OpenShift environment:

### Required Environment Variables
```yaml
env:
  - name: DISABLE_SSL_VERIFY
    value: "true"
  - name: NEXTJS_BASE_URL
    value: "http://127.0.0.1:3000"
```

### Test Cases

- [ ] **Icon Generation**: Upload document, generate presentation, verify icons appear (or gracefully absent)
- [ ] **PDF Export**: Create presentation, export to PDF, verify download completes
- [ ] **PPTX Export**: Create presentation, export to PPTX, verify download completes
- [ ] **Document Upload**: Upload PDF/PPTX, verify parsing works with SSL bypass
- [ ] **Offline Deployment**: Test with `Dockerfile.offline` in completely offline environment

---

## Files Modified Summary

### Python Backend
- `servers/fastapi/services/docling_service.py` - SSL bypass (already existed)
- `servers/fastapi/services/icon_finder_service.py` - SSL bypass (NEW)
- `servers/fastapi/utils/process_slides.py` - Empty results safety check (NEW)

### TypeScript Frontend
- `servers/nextjs/app/api/export-as-pdf/route.ts` - Use 127.0.0.1
- `servers/nextjs/app/api/presentation_to_pptx_model/route.ts` - Use 127.0.0.1

### Configuration
- `nginx.conf` - All localhost → 127.0.0.1
- `start.js` - Bind Next.js to 0.0.0.0

### Docker
- `Dockerfile` - Copy nginx.conf, set NEXTJS_BASE_URL
- `Dockerfile.offline` - Copy nginx.conf, bundle models

### New Files
- `download_models.py` - Download script for offline deployment
- `docs/OFFLINE_DEPLOYMENT.md` - Offline deployment guide
- `docs/OPENSHIFT_FIXES_SUMMARY.md` - This file

---

## Deployment Instructions

### Standard OpenShift Deployment (with internet)

1. Rebuild Docker image:
   ```bash
   docker build -t presenton:latest .
   ```

2. Update OpenShift deployment with environment variables:
   ```yaml
   env:
     - name: DISABLE_SSL_VERIFY
       value: "true"
     - name: NEXTJS_BASE_URL
       value: "http://127.0.0.1:3000"
   ```

3. Deploy and test

### Offline OpenShift Deployment

1. On internet-connected machine:
   ```bash
   python3 download_models.py
   docker build -f Dockerfile.offline -t presenton:offline .
   docker save presenton:offline | gzip > presenton-offline.tar.gz
   ```

2. Transfer `presenton-offline.tar.gz` to airgapped environment

3. Load and deploy:
   ```bash
   docker load < presenton-offline.tar.gz
   # Deploy to OpenShift
   ```

---

## Known Limitations

1. **SSL Bypass Security**: `DISABLE_SSL_VERIFY=true` disables certificate validation. Only use in trusted networks.

2. **Multi-Pod Storage**: File operations (exports, uploads) require shared storage (ReadWriteMany PVC) for multi-pod deployments.

3. **Model Download Size**: First startup with models downloads ~600MB-1.1GB. Use offline deployment for faster startup.

---

## Troubleshooting

### "SSL certificate verify failed"
- Ensure `DISABLE_SSL_VERIFY=true` is set in OpenShift deployment
- Check environment variable is actually reaching the pods: `oc exec <pod> -- env | grep DISABLE_SSL_VERIFY`

### "Failed - network error" on export
- Verify nginx.conf was copied into image: `oc exec <pod> -- cat /etc/nginx/nginx.conf`
- Check if it contains `127.0.0.1` instead of `localhost`
- Verify NEXTJS_BASE_URL environment variable is set

### Icons not appearing
- Check logs for "Warning: Unable to download icon embeddings"
- If SSL error, set `DISABLE_SSL_VERIFY=true`
- Icons will be skipped gracefully, presentation will still generate

### Models downloading on every pod restart
- Use `Dockerfile.offline` to bundle models into image
- Or configure persistent volume for `/tmp/.cache/`

---

## Next Steps

If you're still experiencing issues after applying these fixes:

1. Check pod logs for specific error messages
2. Verify environment variables are set correctly
3. Test locally with Docker first before deploying to OpenShift
4. Check OpenShift network policies aren't blocking localhost connections

For support, provide:
- Pod logs showing the error
- Output of `oc describe pod <pod-name>`
- Environment variables output
