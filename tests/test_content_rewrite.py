#!/usr/bin/env python3
"""
Test script for Content Rewrite API endpoints
Run this to verify the backend is working correctly.
"""

import sys
import os

# Add the fastapi directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'servers', 'fastapi'))

def test_imports():
    """Test that all modules can be imported"""
    print("Testing imports...")

    try:
        from services.placeholder_extractor import extract_all_placeholders
        print("✓ placeholder_extractor imported successfully")
    except Exception as e:
        print(f"✗ Failed to import placeholder_extractor: {e}")
        return False

    try:
        from services.placeholder_injector import inject_content_into_pptx
        print("✓ placeholder_injector imported successfully")
    except Exception as e:
        print(f"✗ Failed to import placeholder_injector: {e}")
        return False

    try:
        from api.v1.ppt.endpoints.content_rewrite import router
        print("✓ content_rewrite endpoint imported successfully")
    except Exception as e:
        print(f"✗ Failed to import content_rewrite endpoint: {e}")
        return False

    try:
        from api.v1.ppt.endpoints.prompts import CONTENT_REWRITE_SYSTEM_PROMPT
        print("✓ CONTENT_REWRITE_SYSTEM_PROMPT imported successfully")
        print(f"  Prompt length: {len(CONTENT_REWRITE_SYSTEM_PROMPT)} characters")
    except Exception as e:
        print(f"✗ Failed to import CONTENT_REWRITE_SYSTEM_PROMPT: {e}")
        return False

    return True

def test_router_registration():
    """Test that the router is registered correctly"""
    print("\nTesting router registration...")

    try:
        from api.v1.ppt.router import API_V1_PPT_ROUTER

        # Check if content_rewrite routes are registered
        routes = [route.path for route in API_V1_PPT_ROUTER.routes]
        rewrite_routes = [r for r in routes if 'rewrite' in r]

        if rewrite_routes:
            print("✓ Content rewrite routes registered:")
            for route in rewrite_routes:
                print(f"  - {route}")
        else:
            print("✗ No content rewrite routes found!")
            return False

        return True
    except Exception as e:
        print(f"✗ Failed to check router registration: {e}")
        return False

if __name__ == "__main__":
    print("="*60)
    print("Content Rewrite Backend Test")
    print("="*60)
    print()

    success = True

    # Test imports
    if not test_imports():
        success = False

    # Test router registration
    if not test_router_registration():
        success = False

    print()
    print("="*60)
    if success:
        print("✓ All tests passed! Backend is ready.")
        print("\nNext steps:")
        print("1. Start the backend: python servers/fastapi/server.py")
        print("2. Start the frontend: cd servers/nextjs && npm run dev")
        print("3. Navigate to: http://localhost:3000/content-rewrite")
    else:
        print("✗ Some tests failed. Please fix the issues above.")
    print("="*60)

    sys.exit(0 if success else 1)
