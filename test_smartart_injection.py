#!/usr/bin/env python3
"""
Test script to verify SmartArt text injection works end-to-end.
Run this with a PPTX file containing SmartArt to see detailed logs.
"""

import sys
import os
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Add server directory to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "servers/fastapi"))

from services.placeholder_extractor import extract_all_placeholders
from services.placeholder_injector import inject_content_into_pptx

def test_smartart_injection(pptx_path: str):
    """Test SmartArt injection with a real PPTX file."""
    
    print(f"\n{'='*60}")
    print(f"Testing SmartArt Injection with: {pptx_path}")
    print(f"{'='*60}\n")
    
    # Step 1: Extract placeholders
    print("Step 1: Extracting placeholders...")
    structure = extract_all_placeholders(pptx_path)
    
    # Find SmartArt elements
    smartart_elements = []
    for slide in structure["slides"]:
        for element in slide["elements"]:
            if element["type"] == "smartart":
                smartart_elements.append({
                    "slide": slide["slideNumber"],
                    "id": element["id"],
                    "original_text": element["text"]
                })
    
    if not smartart_elements:
        print("❌ No SmartArt elements found in the presentation!")
        return
    
    print(f"✓ Found {len(smartart_elements)} SmartArt elements:")
    for elem in smartart_elements:
        print(f"  - Slide {elem['slide']}: {elem['id']} = '{elem['original_text'][:50]}...'")
    
    # Step 2: Create rewritten content (just modify the first SmartArt element)
    print("\nStep 2: Creating rewritten content...")
    rewritten_content = {"slides": []}
    
    for slide in structure["slides"]:
        rewritten_slide = {
            "slideNumber": slide["slideNumber"],
            "elements": []
        }
        
        for element in slide["elements"]:
            if element["type"] == "smartart":
                # Replace SmartArt text with test text
                rewritten_slide["elements"].append({
                    "id": element["id"],
                    "text": f"REWRITTEN: {element['text']}"
                })
            else:
                # Keep other elements unchanged
                rewritten_slide["elements"].append({
                    "id": element["id"],
                    "text": element["text"]
                })
        
        rewritten_content["slides"].append(rewritten_slide)
    
    # Step 3: Inject content
    print("\nStep 3: Injecting rewritten content...")
    output_path = pptx_path.replace(".pptx", "_smartart_test.pptx")
    
    try:
        result_path = inject_content_into_pptx(pptx_path, output_path, rewritten_content)
        print(f"\n✓ Successfully created: {result_path}")
        print("\nPlease open the file and verify that SmartArt text was replaced.")
    except Exception as e:
        print(f"\n❌ Error during injection: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_smartart_injection.py <path_to_pptx_with_smartart>")
        sys.exit(1)
    
    pptx_path = sys.argv[1]
    if not os.path.exists(pptx_path):
        print(f"Error: File not found: {pptx_path}")
        sys.exit(1)
    
    test_smartart_injection(pptx_path)
