# OpenShift Deployment Guide

This guide provides step-by-step instructions to deploy Presenton on OpenShift.

## Prerequisites

- OpenShift CLI (`oc`) installed
- Access to an OpenShift cluster
- Git repository with Presenton code
- OpenAI API key (or other LLM provider credentials)

## Quick Start - Complete Deployment Steps

### Step 1: Login to OpenShift

```bash
# Login to your OpenShift cluster
oc login https://api.your-cluster.com:6443 --token=YOUR_TOKEN

# Or login with username/password
oc login https://api.your-cluster.com:6443 -u your-username -p your-password
```

### Step 2: Create a New Project

```bash
# Create a new project for Presenton
oc new-project presenton

# Verify you're in the correct project
oc project presenton
```

### Step 3: Create Secrets for API Keys

```bash
# Create secret with your API keys
oc create secret generic presenton-secrets \
  --from-literal=OPENAI_API_KEY=sk-your-openai-key-here \
  --from-literal=GOOGLE_API_KEY=your-google-key \
  --from-literal=ANTHROPIC_API_KEY=your-anthropic-key

# Verify secret was created
oc get secrets presenton-secrets
```

### Step 4: Build the Application Image

**Option A: Build from Git Repository (Recommended)**

```bash
# Create a BuildConfig from your Git repository
oc new-build https://github.com/yourusername/presenton.git \
  --name=presenton \
  --strategy=docker

# Watch the build progress
oc logs -f bc/presenton

# Verify the image was created
oc get imagestream presenton
```

**Option B: Build Locally and Push**

```bash
# Build the Docker image locally
docker build -t presenton:latest .

# Tag for OpenShift registry
docker tag presenton:latest image-registry.openshift-image-registry.svc:5000/presenton/presenton:latest

# Login to OpenShift registry
oc registry login

# Push the image
docker push image-registry.openshift-image-registry.svc:5000/presenton/presenton:latest
```

### Step 5: Create Deployment

```bash
# Create deployment YAML file
cat <<EOF > presenton-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: presenton
  labels:
    app: presenton
spec:
  replicas: 1
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
        image: image-registry.openshift-image-registry.svc:5000/presenton/presenton:latest
        ports:
        - containerPort: 3000
          name: nextjs
          protocol: TCP
        - containerPort: 8000
          name: fastapi
          protocol: TCP
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: presenton-secrets
              key: OPENAI_API_KEY
        - name: LLM
          value: "openai"
        - name: OPENAI_MODEL
          value: "gpt-4"
        - name: CAN_CHANGE_KEYS
          value: "true"
        - name: APP_DATA_DIRECTORY
          value: "/tmp/app_data"
        - name: TEMP_DIRECTORY
          value: "/tmp/presenton"
        resources:
          limits:
            memory: "4Gi"
            cpu: "2"
          requests:
            memory: "2Gi"
            cpu: "1"
        volumeMounts:
        - name: tmp-storage
          mountPath: /tmp
      volumes:
      - name: tmp-storage
        emptyDir: {}
EOF

# Apply the deployment
oc apply -f presenton-deployment.yaml

# Watch the deployment
oc get pods -w
```

### Step 6: Create Services

```bash
# Create services YAML file
cat <<EOF > presenton-services.yaml
---
apiVersion: v1
kind: Service
metadata:
  name: presenton-frontend
  labels:
    app: presenton
spec:
  selector:
    app: presenton
  ports:
  - name: nextjs
    port: 3000
    targetPort: 3000
    protocol: TCP
---
apiVersion: v1
kind: Service
metadata:
  name: presenton-backend
  labels:
    app: presenton
spec:
  selector:
    app: presenton
  ports:
  - name: fastapi
    port: 8000
    targetPort: 8000
    protocol: TCP
EOF

# Apply the services
oc apply -f presenton-services.yaml

# Verify services were created
oc get svc
```

### Step 7: Create Routes

```bash
# Create routes YAML file
cat <<EOF > presenton-routes.yaml
---
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: presenton
  labels:
    app: presenton
spec:
  to:
    kind: Service
    name: presenton-frontend
  port:
    targetPort: 3000
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
---
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: presenton-api
  labels:
    app: presenton
spec:
  path: /api
  to:
    kind: Service
    name: presenton-backend
  port:
    targetPort: 8000
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
EOF

# Apply the routes
oc apply -f presenton-routes.yaml

# Get the route URLs
oc get routes
```

### Step 8: Access Your Application

```bash
# Get the frontend URL
FRONTEND_URL=$(oc get route presenton -o jsonpath='{.spec.host}')
echo "Frontend URL: https://$FRONTEND_URL"

# Get the API URL
API_URL=$(oc get route presenton-api -o jsonpath='{.spec.host}')
echo "API URL: https://$API_URL"

# Open in browser
echo "Visit: https://$FRONTEND_URL"
```

## Verification and Troubleshooting

### Check Pod Status

```bash
# List all pods
oc get pods

# Get detailed pod information
oc describe pod <pod-name>

# View pod logs
oc logs <pod-name>

# Follow logs in real-time
oc logs -f <pod-name>
```

### Check Application Health

```bash
# Test the frontend
curl -I https://$(oc get route presenton -o jsonpath='{.spec.host}')

# Test the backend API
curl https://$(oc get route presenton-api -o jsonpath='{.spec.host}')/api/v1/ppt/health
```

### Common Issues

**Pod not starting:**
```bash
# Check events
oc get events --sort-by='.lastTimestamp'

# Check pod logs
oc logs <pod-name>

# Check resource quotas
oc describe quota
```

**Permission errors:**
```bash
# Verify security context constraints
oc get scc

# Check pod security context
oc get pod <pod-name> -o yaml | grep -A 10 securityContext
```

**Image pull errors:**
```bash
# Check image stream
oc get imagestream

# Trigger new build
oc start-build presenton
```

## Update Deployment

### Rebuild After Code Changes

```bash
# Start a new build
oc start-build presenton

# Watch build logs
oc logs -f bc/presenton

# Once build completes, rollout will happen automatically
# Or manually trigger rollout
oc rollout restart deployment/presenton

# Watch the rollout
oc rollout status deployment/presenton
```

### Update Environment Variables

```bash
# Update secrets
oc set env deployment/presenton --from=secret/presenton-secrets

# Or update specific environment variable
oc set env deployment/presenton OPENAI_MODEL=gpt-4-turbo

# Verify changes
oc set env deployment/presenton --list
```

### Scale the Application

```bash
# Scale up to 3 replicas
oc scale deployment/presenton --replicas=3

# Verify scaling
oc get pods

# Enable autoscaling
oc autoscale deployment/presenton --min=1 --max=5 --cpu-percent=80
```

## Persistent Storage (Optional)

If you need data to persist across pod restarts:

```bash
# Create a PersistentVolumeClaim
cat <<EOF > presenton-pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: presenton-data
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
EOF

oc apply -f presenton-pvc.yaml

# Update deployment to use PVC
oc set volume deployment/presenton \
  --add \
  --name=app-data \
  --type=persistentVolumeClaim \
  --claim-name=presenton-data \
  --mount-path=/tmp/app_data
```

## Cleanup

To remove all Presenton resources:

```bash
# Delete all resources
oc delete deployment presenton
oc delete svc presenton-frontend presenton-backend
oc delete route presenton presenton-api
oc delete secret presenton-secrets
oc delete pvc presenton-data  # if using persistent storage
oc delete buildconfig presenton
oc delete imagestream presenton

# Or delete entire project
oc delete project presenton
```

## Complete One-Command Deployment

For quick deployment, save all resources in one file:

```bash
# Create complete deployment file
cat <<EOF > presenton-complete.yaml
# Add all YAML from steps above combined
EOF

# Deploy everything at once
oc apply -f presenton-complete.yaml

# Get application URL
echo "Application available at: https://$(oc get route presenton -o jsonpath='{.spec.host}')"
```

## Technical Details

### OpenShift Compatibility

The application has been adapted for OpenShift's security constraints:

1. **Non-Root User**: Runs as UID 1001 with proper group permissions
2. **Direct Port Access**: Exposes ports 3000 (Next.js) and 8000 (FastAPI)
3. **No Nginx**: OpenShift Routes handle traffic routing
4. **Writable Storage**: Uses `/tmp/app_data` for file operations

### Environment Variables

- `APP_DATA_DIRECTORY=/tmp/app_data` - Application data storage
- `TEMP_DIRECTORY=/tmp/presenton` - Temporary files
- `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` - Browser path
- `LLM=openai` - LLM provider selection
- `OPENAI_API_KEY` - From secret
- `CAN_CHANGE_KEYS=true` - Allow runtime key updates

## Building for OpenShift

### Option 1: Build with Docker

```bash
docker build -t presenton:openshift .
```

### Option 2: Build with OpenShift BuildConfig

Create a BuildConfig from the Git repository:

```yaml
apiVersion: build.openshift.io/v1
kind: BuildConfig
metadata:
  name: presenton
spec:
  source:
    type: Git
    git:
      uri: 'https://github.com/yourusername/presenton.git'
      ref: main
  strategy:
    type: Docker
    dockerStrategy:
      dockerfilePath: Dockerfile
  output:
    to:
      kind: ImageStreamTag
      name: 'presenton:latest'
```

## Deploying to OpenShift

### Create Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: presenton
spec:
  replicas: 1
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
        image: presenton:openshift
        ports:
        - containerPort: 8080
          protocol: TCP
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: presenton-secrets
              key: openai-api-key
        - name: LLM
          value: "openai"
        - name: OPENAI_MODEL
          value: "gpt-4"
        - name: CAN_CHANGE_KEYS
          value: "true"
        resources:
          limits:
            memory: "4Gi"
            cpu: "2"
          requests:
            memory: "2Gi"
            cpu: "1"
        volumeMounts:
        - name: tmp-storage
          mountPath: /tmp
      volumes:
      - name: tmp-storage
        emptyDir: {}
```

### Create Services

Create two services - one for the frontend (Next.js) and one for the backend (FastAPI):

```yaml
---
apiVersion: v1
kind: Service
metadata:
  name: presenton-frontend
spec:
  selector:
    app: presenton
  ports:
  - name: nextjs
    port: 3000
    targetPort: 3000
    protocol: TCP
---
apiVersion: v1
kind: Service
metadata:
  name: presenton-backend
spec:
  selector:
    app: presenton
  ports:
  - name: fastapi
    port: 8000
    targetPort: 8000
    protocol: TCP
```

### Create Routes

Create routes for both frontend and backend:

```yaml
---
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: presenton
spec:
  to:
    kind: Service
    name: presenton-frontend
  port:
    targetPort: 3000
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
---
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: presenton-api
spec:
  path: /api
  to:
    kind: Service
    name: presenton-backend
  port:
    targetPort: 8000
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
```

## Secrets Management

Create a secret for API keys:

```bash
oc create secret generic presenton-secrets \
  --from-literal=openai-api-key=YOUR_OPENAI_API_KEY \
  --from-literal=google-api-key=YOUR_GOOGLE_API_KEY \
  --from-literal=anthropic-api-key=YOUR_ANTHROPIC_API_KEY
```

## Persistent Storage (Optional)

If you need persistent storage beyond pod restarts, create a PersistentVolumeClaim:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: presenton-data
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

Then mount it in the deployment:

```yaml
volumeMounts:
- name: app-data
  mountPath: /tmp/app_data
volumes:
- name: app-data
  persistentVolumeClaim:
    claimName: presenton-data
```

## Resource Requirements

Recommended resource limits:

- **Memory**: 2-4Gi (Chromium and LibreOffice require significant memory)
- **CPU**: 1-2 cores
- **Storage**: 10Gi for presentations, uploads, and exports

## Security Context

OpenShift automatically applies security constraints. The Dockerfile is configured to work with:

- Non-root user (arbitrary UID)
- Read-only root filesystem (except /tmp)
- No privilege escalation
- Drop all capabilities

## Troubleshooting

### Permission Denied Errors

If you encounter permission errors, ensure the pod is running with the correct security context:

```bash
oc get pod <pod-name> -o yaml | grep -A 10 securityContext
```

### Nginx Won't Start

Check nginx logs:

```bash
oc exec <pod-name> -- cat /tmp/nginx/logs/error.log
```

### Application Data Not Persisting

Ensure you've mounted a PersistentVolume to `/tmp/app_data` if you need data to persist across pod restarts.

## Complete Deployment Example

```bash
# Create the secret
oc create secret generic presenton-secrets \
  --from-literal=openai-api-key=YOUR_API_KEY

# Apply all configurations
oc apply -f openshift-deployment.yaml

# Check deployment status
oc get pods
oc logs -f deployment/presenton

# Get the route URL
oc get route presenton -o jsonpath='{.spec.host}'
```

## Notes

- The application runs on port **8080** (not 80)
- All file storage uses `/tmp/app_data` which is ephemeral by default
- For production, use a PersistentVolume for `/tmp/app_data`
- The container runs as a non-root user with UID 1001
- Nginx runs in foreground mode (`daemon off;`)
