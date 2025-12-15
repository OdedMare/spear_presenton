#!/usr/bin/env python3
"""
Download AI models for offline Docker builds.

This script downloads the required Docling models from HuggingFace
and ChromaDB ONNX embedding models so they can be bundled into
the Docker image for environments without internet access.

Usage:
    python3 download_models.py

The models will be saved to ./huggingface_models/ and ./chroma_models/
"""

import os
import sys
import subprocess
import urllib.request
import tarfile
import hashlib

# Check if huggingface_hub is installed, install if missing
try:
    from huggingface_hub import snapshot_download
except ImportError:
    print("huggingface_hub not found. Installing...")
    try:
        # Try normal install first
        subprocess.check_call([sys.executable, "-m", "pip", "install", "huggingface_hub"])
    except subprocess.CalledProcessError:
        # If that fails (system Python), try with --user flag
        print("Retrying with --user flag...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "--user", "huggingface_hub"])
        except subprocess.CalledProcessError:
            print("\n❌ Failed to install huggingface_hub automatically.")
            print("\nPlease install it manually with one of these commands:")
            print("  pip3 install --user huggingface_hub")
            print("  pip3 install --break-system-packages huggingface_hub")
            print("\nThen run this script again.")
            sys.exit(1)
    from huggingface_hub import snapshot_download

def download_onnx_embedding_model():
    """Download ChromaDB ONNX embedding model for icon search."""
    print("\n" + "=" * 60)
    print("Downloading ChromaDB ONNX Embedding Model")
    print("=" * 60)

    url = "https://chroma-onnx-models.s3.amazonaws.com/all-MiniLM-L6-v2/onnx.tar.gz"
    expected_hash = "913d7300ceae3b2dbc2c50d1de4baacab4be7b9380491c27fab7418616a16ec3"

    # Create output directory
    output_dir = os.path.abspath("./chroma_models/onnx_models/all-MiniLM-L6-v2")
    os.makedirs(output_dir, exist_ok=True)

    tar_path = os.path.join(output_dir, "onnx.tar.gz")

    try:
        print(f"\nDownloading from: {url}")
        print(f"Saving to: {tar_path}\n")

        # Download with progress
        def reporthook(block_num, block_size, total_size):
            downloaded = block_num * block_size
            if total_size > 0:
                percent = min(downloaded * 100 / total_size, 100)
                print(f"\rProgress: {percent:.1f}% ({downloaded}/{total_size} bytes)", end="")

        urllib.request.urlretrieve(url, tar_path, reporthook)
        print("\n")

        # Verify hash
        print("Verifying file integrity...")
        with open(tar_path, "rb") as f:
            file_hash = hashlib.sha256(f.read()).hexdigest()

        if file_hash != expected_hash:
            print(f"❌ Hash mismatch! Expected: {expected_hash}, Got: {file_hash}")
            return False

        print("✅ Hash verified!")

        # Extract tar.gz
        print("Extracting model files...")
        with tarfile.open(tar_path, "r:gz") as tar:
            tar.extractall(output_dir)

        # Clean up tar file
        os.remove(tar_path)

        print(f"✅ ONNX embedding model downloaded and extracted to {output_dir}\n")
        return True

    except Exception as e:
        print(f"❌ Failed to download ONNX embedding model: {e}\n")
        return False

def main():
    print("\n" + "=" * 60)
    print("AI Models Download for Offline Deployment")
    print("=" * 60)
    print("\nThis script downloads:")
    print("  1. Docling models (HuggingFace) - for PDF/PPTX parsing")
    print("  2. ONNX embedding model (ChromaDB) - for icon search")
    print("\n")

    # Download Docling models
    cache_dir = os.path.abspath("./huggingface_models")
    print("=" * 60)
    print("Step 1: Downloading Docling Models")
    print("=" * 60)
    print(f"\nModels will be saved to: {cache_dir}\n")

    models = [
        "docling-project/docling-layout-heron",
        "docling-project/docling-layout",
    ]

    for i, model in enumerate(models, 1):
        print(f"[{i}/{len(models)}] Downloading {model}...")
        try:
            snapshot_download(
                repo_id=model,
                cache_dir=cache_dir,
                resume_download=True
            )
            print(f"✅ {model} downloaded successfully!\n")
        except Exception as e:
            print(f"❌ Failed to download {model}: {e}\n")
            return 1

    # Download ONNX embedding model for icons
    print("\n" + "=" * 60)
    print("Step 2: Downloading ONNX Embedding Model")
    print("=" * 60)

    if not download_onnx_embedding_model():
        return 1

    print("\n" + "=" * 60)
    print("✅ All models downloaded successfully!")
    print("=" * 60)
    print(f"\nDocling models location: {cache_dir}")
    print(f"ONNX models location: ./chroma_models/")
    print("\nYou can now build the Docker image:")
    print("  docker build -t presenton:offline .")
    print("\n")

    return 0

if __name__ == "__main__":
    exit(main())
