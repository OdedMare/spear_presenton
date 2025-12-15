# Offline Deployment Guide

This guide explains how to build and deploy Presenton in an environment **without internet access** (air-gapped/offline environment).

## Prerequisites

- A machine **with internet access** for initial setup
- Docker installed on both machines
- Access to transfer Docker images (via registry, USB, tar file, etc.)

## Step 1: Download Required Models (On Machine WITH Internet)

On a machine with internet access, download both the HuggingFace models and ChromaDB ONNX embedding models:

```bash
# Run the download script (will auto-install required packages)
python3 download_models.py
```

This will create two directories with all required AI models:
- `huggingface_models/` - Docling models for PDF/PPTX parsing (~500MB-1GB)
- `chroma_models/` - ONNX embedding models for icon search (~100MB)

**Verify the download:**
```bash
ls -lh huggingface_models/
ls -lh chroma_models/
```

You should see subdirectories with model files in both locations.

## Step 2: Build Docker Image (On Machine WITH Internet)

Build the Docker image with the bundled models using the offline Dockerfile:

```bash
docker build -f Dockerfile.offline -t presenton:offline .
```

**Important:** The `Dockerfile.offline` is specifically designed to bundle pre-downloaded models into the image. It requires that `huggingface_models/` and `chroma_models/` directories exist.

For regular builds (with internet at runtime), use the standard Dockerfile:
```bash
docker build -t presenton:latest .
```

## Step 3: Transfer Image to Offline Environment

Choose one of these methods:

### Method A: Using a Container Registry

```bash
# Tag and push to your registry (still on internet-connected machine)
docker tag presenton:offline your-registry.example.com/presenton:offline
docker push your-registry.example.com/presenton:offline

# On offline machine (if registry is accessible internally)
docker pull your-registry.example.com/presenton:offline
```

### Method B: Save Image to File

```bash
# On internet-connected machine: Save image to tar file
docker save presenton:offline -o presenton-offline.tar

# Transfer presenton-offline.tar to offline machine (USB, SCP, etc.)

# On offline machine: Load image from tar file
docker load -i presenton-offline.tar
```

### Method C: OpenShift ImageStream

```bash
# Create an imagestream in OpenShift
oc create imagestream presenton

# Import the image from external registry
oc import-image presenton:offline \
  --from=your-registry.example.com/presenton:offline \
  --confirm
```

## Step 4: Deploy in Offline Environment

### Docker Compose Deployment

```bash
# Update docker-compose.yml to use the offline image
docker-compose up production
```

Or specify the image directly:

```bash
docker run -d \
  -p 5000:80 \
  -v ./app_data:/app_data \
  -e CAN_CHANGE_KEYS=true \
  presenton:offline
```

### OpenShift Deployment

```bash
# Create deployment using the offline image
oc new-app presenton:offline \
  --name=presenton \
  -e CAN_CHANGE_KEYS=true

# Or if using imagestream
oc new-app --image-stream=presenton:offline

# Create route
oc expose service/presenton

# Scale as needed
oc scale deployment/presenton --replicas=2
```

## Verification

Once deployed, verify the models are working:

1. Access the application UI
2. Try uploading a PDF or PPTX file
3. Click "Decompose" or generate a presentation from the document
4. Check logs for any HuggingFace download attempts (there should be none)

```bash
# Check logs
docker logs presenton-container

# Or in OpenShift
oc logs deployment/presenton
```

**Success indicators:**
- ✅ No SSL certificate errors
- ✅ No "Downloading model..." messages
- ✅ PDF/PPTX processing works immediately
- ✅ No connection attempts to huggingface.co

## Troubleshooting

### Models Not Found

If you see errors about missing models:

```bash
# Verify models are in the image
docker run --rm presenton:offline ls -la /tmp/.cache/huggingface/
```

You should see model directories. If empty, rebuild with models included.

### Permission Errors

If you see permission denied errors in OpenShift:

```bash
# Verify proper permissions were set during build
docker run --rm presenton:offline ls -la /tmp/.cache/
```

Directories should be owned by UID 1001 and writable by group 0.

### Large Image Size

The offline image will be larger due to bundled models (~2-3GB total):

```bash
# Check image size
docker images presenton:offline
```

This is expected and necessary for offline operation.

## Updating Models

To update to newer model versions:

1. On internet-connected machine, delete old models:
   ```bash
   rm -rf huggingface_models/
   ```

2. Re-run download script:
   ```bash
   python3 download_models.py
   ```

3. Rebuild and transfer image as described above

## Alternative: Persistent Volume with Models

For large-scale deployments, you can store models on a persistent volume instead of in the image:

1. Create a PVC for models
2. Download models to the PVC once
3. Mount the PVC to all pods at `/tmp/.cache/huggingface`

This reduces image size and allows model updates without rebuilding.

## Security Note

The models are Apache 2.0 licensed and safe to bundle. No API keys or credentials are included in the models.
