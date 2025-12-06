#!/usr/bin/env python3
"""
Quick test to verify translation imports work correctly.
Run this to check syntax and import errors without installing dependencies.
"""

import sys
import os

# Add fastapi directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'servers', 'fastapi'))

def test_imports():
    """Test that all translation modules can be imported"""

    print("Testing translation module imports...")

    try:
        print("\n1. Testing translation_tools...")
        # Just check syntax, don't execute (deep-translator not installed yet)
        with open('servers/fastapi/services/translation_tools.py', 'r') as f:
            code = f.read()
            compile(code, 'translation_tools.py', 'exec')
        print("   ✓ translation_tools.py syntax valid")

        print("\n2. Testing translation_orchestrator...")
        with open('servers/fastapi/services/translation_orchestrator.py', 'r') as f:
            code = f.read()
            compile(code, 'translation_orchestrator.py', 'exec')
        print("   ✓ translation_orchestrator.py syntax valid")

        print("\n3. Testing translation endpoint...")
        with open('servers/fastapi/api/v1/ppt/endpoints/translation.py', 'r') as f:
            code = f.read()
            compile(code, 'translation.py', 'exec')
        print("   ✓ translation.py syntax valid")

        print("\n4. Testing router integration...")
        with open('servers/fastapi/api/v1/ppt/router.py', 'r') as f:
            code = f.read()
            if 'TRANSLATION_ROUTER' in code and 'include_router(TRANSLATION_ROUTER' in code:
                print("   ✓ Router properly includes TRANSLATION_ROUTER")
            else:
                print("   ✗ Router missing TRANSLATION_ROUTER")
                return False

        print("\n✅ All syntax checks passed!")
        print("\nNext steps:")
        print("1. Install dependencies: pip install deep-translator langdetect")
        print("2. Start server: cd servers/fastapi && python server.py")
        print("3. Test endpoint: curl -X POST http://localhost:8000/api/v1/ppt/translate ...")

        return True

    except SyntaxError as e:
        print(f"\n❌ Syntax error: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_imports()
    sys.exit(0 if success else 1)
