#!/usr/bin/env python3
"""
Test script for layout_extractor.py with detailed logging.
Usage: python test_extractor.py <path_to_pptx_file> [--debug-layout]
"""
import sys
import logging
import json
import os
from pathlib import Path

# Check for debug flag
if "--debug-layout" in sys.argv:
    os.environ["DEBUG_LAYOUT"] = "true"
    sys.argv.remove("--debug-layout")
    print("🔍 DEBUG_LAYOUT mode ENABLED - Full inheritance chain logging activated")

# Setup logging to see all DEBUG messages
logging.basicConfig(
    level=logging.DEBUG,
    format='%(levelname)s [%(name)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

# Import the extractor
sys.path.insert(0, str(Path(__file__).parent / "servers" / "fastapi"))
from services.layout_extractor import parse_pptx_to_layouts

def main():
    if len(sys.argv) < 2:
        print("Usage: python test_extractor.py <path_to_pptx_file> [--debug-layout]")
        print("\nOptions:")
        print("  --debug-layout    Enable detailed inheritance chain logging")
        print("\nThis script will:")
        print("  1. Parse the PPTX file with full DEBUG logging")
        print("  2. Show theme color loading")
        print("  3. Show fill/border extraction attempts")
        print("  4. Show inheritance resolution (Slide → Layout → Master → Theme)")
        print("  5. Output final JSON to test_output.json")
        print("\nWith --debug-layout, you'll see:")
        print("  - XML element maps for each placeholder")
        print("  - Step-by-step inheritance resolution")
        print("  - Exactly where each color/border comes from")
        print("  - XML snippets when resolution fails")
        sys.exit(1)

    pptx_path = sys.argv[1]
    if not Path(pptx_path).exists():
        print(f"Error: File not found: {pptx_path}")
        sys.exit(1)

    print(f"\n{'='*80}")
    print(f"Testing PPTX Extractor with: {pptx_path}")
    print(f"{'='*80}\n")

    # Create output directory
    asset_output_dir = Path(__file__).parent / "test_assets"
    asset_output_dir.mkdir(exist_ok=True)

    # Run the extractor
    try:
        layouts = parse_pptx_to_layouts(
            pptx_path=pptx_path,
            asset_output_dir=str(asset_output_dir),
            asset_url_prefix="/test_assets"
        )

        # Save output
        output_file = Path(__file__).parent / "test_output.json"
        with open(output_file, "w") as f:
            json.dump(layouts, f, indent=2)

        print(f"\n{'='*80}")
        print(f"Extraction complete!")
        print(f"{'='*80}\n")
        print(f"Total slides: {len(layouts)}")

        # Summary statistics
        for i, layout in enumerate(layouts, 1):
            elements = layout.get("elements", [])
            fills = sum(1 for e in elements if isinstance(e, dict) and e.get("fill") is not None)
            borders = sum(1 for e in elements if isinstance(e, dict) and e.get("border") is not None)
            print(f"  Slide {i}: {len(elements)} elements, {fills} with fills, {borders} with borders")

        print(f"\nOutput saved to: {output_file}")
        print(f"Assets saved to: {asset_output_dir}")

    except Exception as e:
        print(f"\n{'='*80}")
        print(f"ERROR during extraction:")
        print(f"{'='*80}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
