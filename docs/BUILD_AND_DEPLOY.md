# Build and Deploy Guide

Complete guide for building and deploying Presenton to OpenShift.

## Prerequisites

- Docker installed
- Access to OpenShift cluster
- `oc` CLI tool installed and configured
- Git repository cloned

## Quick Start

### 1. Build Docker Image

**Standard build (with internet access at runtime)**:
```bash
# From repository root
docker build -t presenton:latest .
```

**Offline build (bundle models, no internet needed)**:
```bash
# First, download models (requires internet)
python3 download_models.py

# Build with bundled models
docker build -f Dockerfile.offline -t presenton:offline .
```

### 2. Test Locally

```bash
# Run the container
docker run -p 8080:8080 \
  -e DISABLE_SSL_VERIFY=true \
  -e LOG_LEVEL=INFO \
  presenton:latest

# Access the application
open http://localhost:8080
```

### 3. Push to Registry

**For OpenShift internal registry**:
```bash
# Tag for OpenShift registry
docker tag presenton:latest image-registry.openshift-image-registry.svc:5000/your-namespace/presenton:latest

# Login to OpenShift
oc login --server=https://your-openshift-api:6443

# Push image
docker push image-registry.openshift-image-registry.svc:5000/your-namespace/presenton:latest
```

**For external registry (Docker Hub, Quay.io, etc.)**:
```bash
# Login
docker login

# Tag and push
docker tag presenton:latest your-registry/presenton:latest
docker push your-registry/presenton:latest
```

---

## OpenShift Deployment

### Option 1: Using YAML Files

Create `openshift-deployment.yaml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: presenton

---
apiVersion: v1
kind: Secret
metadata:
  name: presenton-secrets
  namespace: presenton
type: Opaque
stringData:
  # Add your API keys here
  OPENAI_API_KEY: "sk-..."
  GOOGLE_API_KEY: "..."
  ANTHROPIC_API_KEY: "..."
  # Optional: Elasticsearch credentials
  ELASTICSEARCH_USER: "elastic"
  ELASTICSEARCH_PASSWORD: "changeme"

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: presenton-config
  namespace: presenton
data:
  # Application configuration
  LLM: "openai"
  IMAGE_PROVIDER: "dall-e-3"
  CAN_CHANGE_KEYS: "false"
  DISABLE_SSL_VERIFY: "true"
  LOG_LEVEL: "INFO"
  ENVIRONMENT: "production"
  NEXTJS_BASE_URL: "http://127.0.0.1:3000"
  # Optional: Elasticsearch
  ELASTICSEARCH_URL: "http://elasticsearch:9200"
  ELASTICSEARCH_INDEX_PREFIX: "presenton-logs"

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: presenton-data
  namespace: presenton
spec:
  accessModes:
    - ReadWriteOnce  # Use ReadWriteMany for multi-pod deployments
  resources:
    requests:
      storage: 10Gi
  # For OpenShift with OCS/ODF:
  # storageClassName: ocs-storagecluster-cephfs  # For ReadWriteMany

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: presenton
  namespace: presenton
  labels:
    app: presenton
spec:
  replicas: 1  # Increase for HA (requires ReadWriteMany PVC)
  selector:
    matchLabels:
      app: presenton
  template:
    metadata:
      labels:
        app: presenton
    spec:
      containers:
      - name: presenton
        image: your-registry/presenton:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
          name: http
          protocol: TCP
        env:
        # Load from ConfigMap
        - name: LLM
          valueFrom:
            configMapKeyRef:
              name: presenton-config
              key: LLM
        - name: IMAGE_PROVIDER
          valueFrom:
            configMapKeyRef:
              name: presenton-config
              key: IMAGE_PROVIDER
        - name: CAN_CHANGE_KEYS
          valueFrom:
            configMapKeyRef:
              name: presenton-config
              key: CAN_CHANGE_KEYS
        - name: DISABLE_SSL_VERIFY
          valueFrom:
            configMapKeyRef:
              name: presenton-config
              key: DISABLE_SSL_VERIFY
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: presenton-config
              key: LOG_LEVEL
        - name: ENVIRONMENT
          valueFrom:
            configMapKeyRef:
              name: presenton-config
              key: ENVIRONMENT
        - name: NEXTJS_BASE_URL
          valueFrom:
            configMapKeyRef:
              name: presenton-config
              key: NEXTJS_BASE_URL
        # Optional: Elasticsearch
        - name: ELASTICSEARCH_URL
          valueFrom:
            configMapKeyRef:
              name: presenton-config
              key: ELASTICSEARCH_URL
              optional: true
        - name: ELASTICSEARCH_INDEX_PREFIX
          valueFrom:
            configMapKeyRef:
              name: presenton-config
              key: ELASTICSEARCH_INDEX_PREFIX
              optional: true
        - name: ELASTICSEARCH_USER
          valueFrom:
            secretKeyRef:
              name: presenton-secrets
              key: ELASTICSEARCH_USER
              optional: true
        - name: ELASTICSEARCH_PASSWORD
          valueFrom:
            secretKeyRef:
              name: presenton-secrets
              key: ELASTICSEARCH_PASSWORD
              optional: true
        # Load API keys from Secret
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: presenton-secrets
              key: OPENAI_API_KEY
              optional: true
        - name: GOOGLE_API_KEY
          valueFrom:
            secretKeyRef:
              name: presenton-secrets
              key: GOOGLE_API_KEY
              optional: true
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: presenton-secrets
              key: ANTHROPIC_API_KEY
              optional: true
        volumeMounts:
        - name: app-data
          mountPath: /tmp/app_data
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /api/v1/ppt/health
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 30
          timeoutSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/v1/ppt/health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
      volumes:
      - name: app-data
        persistentVolumeClaim:
          claimName: presenton-data
      # Security context for OpenShift
      securityContext:
        runAsNonRoot: true
        seccompProfile:
          type: RuntimeDefault

---
apiVersion: v1
kind: Service
metadata:
  name: presenton
  namespace: presenton
  labels:
    app: presenton
spec:
  type: ClusterIP
  ports:
  - port: 8080
    targetPort: 8080
    protocol: TCP
    name: http
  selector:
    app: presenton
  sessionAffinity: ClientIP  # Sticky sessions for multi-pod

---
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: presenton
  namespace: presenton
  labels:
    app: presenton
spec:
  to:
    kind: Service
    name: presenton
    weight: 100
  port:
    targetPort: http
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
  wildcardPolicy: None
```

Deploy:
```bash
# Create namespace and resources
oc apply -f openshift-deployment.yaml

# Check deployment status
oc get pods -n presenton
oc logs -f deployment/presenton -n presenton

# Get the route URL
oc get route presenton -n presenton -o jsonpath='{.spec.host}'
```

### Option 2: Using OpenShift CLI

```bash
# Create project
oc new-project presenton

# Create from image
oc new-app your-registry/presenton:latest \
  --name=presenton \
  -e DISABLE_SSL_VERIFY=true \
  -e LOG_LEVEL=INFO \
  -e ENVIRONMENT=production

# Expose service
oc expose svc/presenton

# Add persistent storage
oc set volume deployment/presenton \
  --add --name=app-data \
  --type=persistentVolumeClaim \
  --claim-name=presenton-data \
  --claim-size=10Gi \
  --mount-path=/tmp/app_data

# Scale up (requires ReadWriteMany PVC)
oc scale deployment/presenton --replicas=3
```

---

## Configuration

### Required Environment Variables

```yaml
# SSL bypass for self-signed certificates
DISABLE_SSL_VERIFY: "true"

# Next.js base URL for Puppeteer
NEXTJS_BASE_URL: "http://127.0.0.1:3000"
```

### Optional - LLM Configuration

```yaml
# LLM Provider
LLM: "openai"  # Options: openai, google, anthropic, ollama, custom

# API Keys (use Secrets!)
OPENAI_API_KEY: "sk-..."
GOOGLE_API_KEY: "..."
ANTHROPIC_API_KEY: "..."

# Image Generation
IMAGE_PROVIDER: "dall-e-3"  # Options: dall-e-3, gemini-flash, pexels, pixabay
```

### Optional - Elasticsearch Logging

```yaml
ELASTICSEARCH_URL: "http://elasticsearch:9200"
ELASTICSEARCH_USER: "elastic"
ELASTICSEARCH_PASSWORD: "changeme"
ELASTICSEARCH_INDEX_PREFIX: "presenton-logs"
LOG_LEVEL: "INFO"
```

### Optional - Database

```yaml
# External database (PostgreSQL or MySQL)
DATABASE_URL: "postgresql://user:pass@host:5432/presenton"
```

---

## Offline Deployment (Airgapped)

For environments without internet access:

### Step 1: Download Models (Internet Machine)

```bash
# Download models
python3 download_models.py

# Verify downloads
ls -lh huggingface_models/
ls -lh chroma_models/
```

### Step 2: Build Offline Image (Internet Machine)

```bash
# Build with bundled models
docker build -f Dockerfile.offline -t presenton:offline .

# Save image as tar
docker save presenton:offline | gzip > presenton-offline.tar.gz

# Check size
ls -lh presenton-offline.tar.gz
```

### Step 3: Transfer to Airgapped Environment

```bash
# Transfer file (USB, SCP, etc.)
scp presenton-offline.tar.gz user@airgapped-host:~/

# On airgapped machine, load image
docker load < presenton-offline.tar.gz
```

### Step 4: Push to Internal Registry

```bash
# Tag for internal registry
docker tag presenton:offline internal-registry.local/presenton:offline

# Push to internal registry
docker push internal-registry.local/presenton:offline
```

### Step 5: Deploy to OpenShift

```bash
# Deploy using internal image
oc new-app internal-registry.local/presenton:offline \
  --name=presenton \
  -e DISABLE_SSL_VERIFY=true

# Expose and configure as normal
```

---

## Health Checks

Add health check endpoint if not present:

```python
# In servers/fastapi/api/v1/ppt/router.py
@router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
```

Test:
```bash
curl http://your-route/api/v1/ppt/health
```

---

## Monitoring with Elasticsearch

### Deploy Elasticsearch on OpenShift

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: elasticsearch-data
  namespace: presenton
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: elasticsearch
  namespace: presenton
spec:
  replicas: 1
  selector:
    matchLabels:
      app: elasticsearch
  template:
    metadata:
      labels:
        app: elasticsearch
    spec:
      containers:
      - name: elasticsearch
        image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
        ports:
        - containerPort: 9200
        env:
        - name: discovery.type
          value: single-node
        - name: xpack.security.enabled
          value: "true"
        - name: ELASTIC_PASSWORD
          value: changeme
        volumeMounts:
        - name: data
          mountPath: /usr/share/elasticsearch/data
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: elasticsearch-data

---
apiVersion: v1
kind: Service
metadata:
  name: elasticsearch
  namespace: presenton
spec:
  ports:
  - port: 9200
  selector:
    app: elasticsearch
```

Deploy Kibana for visualization:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kibana
  namespace: presenton
spec:
  replicas: 1
  selector:
    matchLabels:
      app: kibana
  template:
    metadata:
      labels:
        app: kibana
    spec:
      containers:
      - name: kibana
        image: docker.elastic.co/kibana/kibana:8.11.0
        ports:
        - containerPort: 5601
        env:
        - name: ELASTICSEARCH_HOSTS
          value: http://elasticsearch:9200
        - name: ELASTICSEARCH_USERNAME
          value: elastic
        - name: ELASTICSEARCH_PASSWORD
          value: changeme

---
apiVersion: v1
kind: Service
metadata:
  name: kibana
  namespace: presenton
spec:
  ports:
  - port: 5601
  selector:
    app: kibana

---
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: kibana
  namespace: presenton
spec:
  to:
    kind: Service
    name: kibana
  port:
    targetPort: 5601
```

---

## Troubleshooting

### Check Pod Status
```bash
oc get pods -n presenton
oc describe pod <pod-name> -n presenton
oc logs <pod-name> -n presenton
oc logs <pod-name> -n presenton --previous  # Previous crash logs
```

### Check Environment Variables
```bash
oc exec <pod-name> -n presenton -- env | grep -E "DISABLE_SSL|NEXTJS|ELASTICSEARCH"
```

### Test nginx Configuration
```bash
oc exec <pod-name> -n presenton -- cat /etc/nginx/nginx.conf | grep 127.0.0.1
```

### Check Storage
```bash
oc get pvc -n presenton
oc describe pvc presenton-data -n presenton
```

### Check Routes
```bash
oc get routes -n presenton
curl -I https://$(oc get route presenton -n presenton -o jsonpath='{.spec.host}')
```

### View Logs in Real-Time
```bash
oc logs -f deployment/presenton -n presenton
```

---

## Scaling

### Horizontal Scaling

**Requirements**:
- ReadWriteMany PVC for shared storage
- Sticky sessions configured

```bash
# Scale to 3 replicas
oc scale deployment/presenton --replicas=3 -n presenton

# Check status
oc get pods -n presenton -l app=presenton
```

### Vertical Scaling

```bash
# Increase resources
oc set resources deployment/presenton \
  --requests=memory=4Gi,cpu=2000m \
  --limits=memory=8Gi,cpu=4000m \
  -n presenton
```

---

## Backup and Restore

### Backup

```bash
# Backup PVC data
oc rsync <pod-name>:/tmp/app_data ./backup/ -n presenton

# Backup database
oc exec <pod-name> -n presenton -- \
  pg_dump -U postgres presenton > presenton-backup.sql
```

### Restore

```bash
# Restore data
oc rsync ./backup/ <pod-name>:/tmp/app_data -n presenton

# Restore database
cat presenton-backup.sql | \
  oc exec -i <pod-name> -n presenton -- \
  psql -U postgres presenton
```

---

## Updates and Rollbacks

### Update Image

```bash
# Build new version
docker build -t presenton:v2 .
docker push your-registry/presenton:v2

# Update deployment
oc set image deployment/presenton presenton=your-registry/presenton:v2 -n presenton

# Watch rollout
oc rollout status deployment/presenton -n presenton
```

### Rollback

```bash
# View rollout history
oc rollout history deployment/presenton -n presenton

# Rollback to previous version
oc rollout undo deployment/presenton -n presenton

# Rollback to specific revision
oc rollout undo deployment/presenton --to-revision=2 -n presenton
```

---

## Security Checklist

- [ ] Use Secrets for API keys, not ConfigMaps
- [ ] Enable TLS on routes
- [ ] Set resource limits
- [ ] Use non-root containers (already configured)
- [ ] Enable network policies if required
- [ ] Regular security updates
- [ ] Monitor logs for security events
- [ ] Rotate credentials regularly
- [ ] Use RBAC for OpenShift access

---

## Performance Tuning

### OpenShift Resource Quotas

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: presenton-quota
  namespace: presenton
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    persistentvolumeclaims: "5"
```

### Limit Ranges

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: presenton-limits
  namespace: presenton
spec:
  limits:
  - max:
      memory: 8Gi
      cpu: "4"
    min:
      memory: 512Mi
      cpu: "250m"
    type: Container
```

---

## Summary

Quick deployment checklist:

1. ✅ Build image: `docker build -t presenton:latest .`
2. ✅ Push to registry: `docker push your-registry/presenton:latest`
3. ✅ Create OpenShift project: `oc new-project presenton`
4. ✅ Deploy: `oc apply -f openshift-deployment.yaml`
5. ✅ Check status: `oc get pods -n presenton`
6. ✅ Get URL: `oc get route presenton -n presenton`
7. ✅ Test: Open URL in browser

For issues, check logs: `oc logs -f deployment/presenton -n presenton`
