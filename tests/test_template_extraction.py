#!/usr/bin/env python3
"""
Test script to verify template extraction logic.
"""

import sys
import os
import logging
import json
import tempfile

# Setup logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Add server directory to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "servers/fastapi"))

from services.layout_extractor import parse_pptx_to_layouts

def test_extraction(pptx_path: str):
    """Test template extraction with a real PPTX file."""
    
    print(f"\n{'='*60}")
    print(f"Testing Template Extraction with: {pptx_path}")
    print(f"{'='*60}\n")
    
    with tempfile.TemporaryDirectory() as temp_dir:
        images_dir = os.path.join(temp_dir, "images")
        os.makedirs(images_dir, exist_ok=True)
        
        try:
            slides = parse_pptx_to_layouts(
                pptx_path,
                images_dir,
                "/assets/images"
            )
            
            print(f"\n✓ Successfully extracted {len(slides)} slides")
            
            # Inspect first slide elements
            if slides:
                for i in [0, 9]: # Slide 1 and Slide 10 (index 9)
                    if i < len(slides):
                        print(f"\nSlide {i+1} Elements:")
                        for el in slides[i]["elements"]:
                            kind = el.get("type")
                            text = ""
                            if kind == "text":
                                text = "".join(r.get("text", "") for r in el.get("text", []))
                                wrap = el.get("wrap", "unknown")
                                print(f"  - Text: '{text[:30]}...' (Wrap: {wrap})")
                                
                                # Check colors
                                for run in el.get("text", []):
                                    if run.get("color"):
                                        print(f"    - Color found: {run.get('color')}")
                            
                            elif kind == "image":
                                print(f"  - Image: {el.get('image', {}).get('src')}")
                            
                            elif kind == "shape":
                                fill = el.get("fill")
                                if fill:
                                    print(f"  - Shape Fill: {fill}")
                                else:
                                    print(f"  - Shape (No Fill)")

        except Exception as e:
            print(f"\n❌ Error during extraction: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_template_extraction.py <path_to_pptx>")
        sys.exit(1)
    
    pptx_path = sys.argv[1]
    if not os.path.exists(pptx_path):
        print(f"Error: File not found: {pptx_path}")
        sys.exit(1)
    
    test_extraction(pptx_path)
