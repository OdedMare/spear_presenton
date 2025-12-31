#!/bin/bash
set -e

# Docker Multi-Platform Build Script for Presenton
# Usage: ./docker-build.sh [OPTIONS]
#
# Options:
#   --platform PLATFORM    Target platform (default: linux/amd64)
#   --tag TAG             Docker image tag (default: odedmare/presenton:latest)
#   --push                Push to registry after build
#   --load                Load image to local Docker (cannot be used with --push for multi-platform)
#   --cache-from TAG      Use cache from specific tag
#   --no-cache            Build without cache
#
# Examples:
#   ./docker-build.sh --push
#   ./docker-build.sh --platform linux/amd64,linux/arm64 --push
#   ./docker-build.sh --load --platform linux/amd64

# Default values
PLATFORM="linux/amd64"
TAG="odedmare/presenton:latest"
PUSH=""
LOAD=""
CACHE_FROM=""
NO_CACHE=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --platform)
      PLATFORM="$2"
      shift 2
      ;;
    --tag)
      TAG="$2"
      shift 2
      ;;
    --push)
      PUSH="--push"
      shift
      ;;
    --load)
      LOAD="--load"
      shift
      ;;
    --cache-from)
      CACHE_FROM="--cache-from type=registry,ref=$2"
      shift 2
      ;;
    --no-cache)
      NO_CACHE="--no-cache"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate conflicting options
if [[ -n "$PUSH" ]] && [[ -n "$LOAD" ]]; then
  echo "Error: --push and --load cannot be used together for multi-platform builds"
  exit 1
fi

echo "========================================="
echo "Building Docker Image"
echo "========================================="
echo "Platform: $PLATFORM"
echo "Tag: $TAG"
echo "Push: ${PUSH:-no}"
echo "Load: ${LOAD:-no}"
echo "Cache from: ${CACHE_FROM:-none}"
echo "No cache: ${NO_CACHE:-no}"
echo "========================================="

# Ensure buildx builder exists
if ! docker buildx inspect presenton-builder >/dev/null 2>&1; then
  echo "Creating buildx builder: presenton-builder"
  docker buildx create --name presenton-builder --driver docker-container --bootstrap
fi

echo "Using buildx builder: presenton-builder"
docker buildx use presenton-builder

# Build the image
echo "Starting build..."
docker buildx build \
  --platform "$PLATFORM" \
  -t "$TAG" \
  $PUSH \
  $LOAD \
  $CACHE_FROM \
  $NO_CACHE \
  --progress=plain \
  .

echo "========================================="
echo "Build completed successfully!"
echo "========================================="

if [[ -n "$PUSH" ]]; then
  echo "Image pushed to: $TAG"
elif [[ -n "$LOAD" ]]; then
  echo "Image loaded to local Docker: $TAG"
else
  echo "Image built but not pushed or loaded"
  echo "Use --push to push to registry or --load to load locally"
fi
