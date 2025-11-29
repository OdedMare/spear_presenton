#!/usr/bin/env python3
"""
Diagnostic script to inspect SmartArt XML structure in a PPTX file.
"""

import sys
import os
import zipfile
from lxml import etree

NS = {
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "dgm": "http://schemas.openxmlformats.org/drawingml/2006/diagram",
}

def inspect_smartart(pptx_path: str):
    """Inspect SmartArt structure in a PPTX file."""
    
    with zipfile.ZipFile(pptx_path, 'r') as zipf:
        # Find all slide files
        slide_files = [name for name in zipf.namelist()
                      if name.startswith("ppt/slides/slide") and name.endswith(".xml")
                      and "slideLayout" not in name and "slideMaster" not in name]
        
        for slide_file in sorted(slide_files):
            # Extract slide number from path like "ppt/slides/slide1.xml"
            filename = slide_file.split("/")[-1]  # Get "slide1.xml"
            slide_num = int(filename.replace("slide", "").replace(".xml", ""))
            
            # Read slide
            with zipf.open(slide_file) as f:
                slide_tree = etree.parse(f).getroot()
            
            # Find SmartArt
            sp_tree = slide_tree.find("p:cSld/p:spTree", NS)
            if sp_tree is None:
                continue
            
            for child in sp_tree:
                tag_name = etree.QName(child.tag).localname
                if tag_name == "graphicFrame":
                    graphic_data = child.find(".//a:graphicData", NS)
                    if graphic_data is not None:
                        uri = graphic_data.get("uri", "")
                        if "diagram" in uri:
                            print(f"\n{'='*60}")
                            print(f"Found SmartArt on Slide {slide_num}")
                            print(f"{'='*60}")
                            
                            # Get relationship ID
                            diagram_el = graphic_data.find(".//dgm:relIds", NS)
                            if diagram_el is not None:
                                rel_id = diagram_el.get(f"{{{NS['r']}}}dm")
                                print(f"Relationship ID: {rel_id}")
                                
                                # Load relationships
                                slide_dir = "/".join(slide_file.split("/")[:-1])
                                rels_file = f"{slide_dir}/_rels/{slide_file.split('/')[-1]}.rels"
                                
                                with zipf.open(rels_file) as f:
                                    rels_tree = etree.parse(f).getroot()
                                
                                # Find diagram data file
                                for rel in rels_tree.findall(".//{*}Relationship"):
                                    if rel.get("Id") == rel_id:
                                        target = rel.get("Target")
                                        print(f"Diagram data file: {target}")
                                        
                                        # Resolve path
                                        if target.startswith("../"):
                                            diagram_path = f"ppt/{target[3:]}"
                                        else:
                                            diagram_path = f"{slide_dir}/{target}"
                                        
                                        # Read diagram data
                                        try:
                                            with zipf.open(diagram_path) as f:
                                                diagram_tree = etree.parse(f).getroot()
                                            
                                            print(f"\nDiagram XML structure:")
                                            print(etree.tostring(diagram_tree, pretty_print=True, encoding='unicode')[:1000])
                                            
                                            # Find all points
                                            points = diagram_tree.findall(".//{http://schemas.openxmlformats.org/drawingml/2006/diagram}pt")
                                            print(f"\nFound {len(points)} diagram points")
                                            
                                            for i, pt in enumerate(points):
                                                print(f"\nPoint {i}:")
                                                print(etree.tostring(pt, pretty_print=True, encoding='unicode')[:500])
                                                
                                                # Try to find text
                                                t_elem = pt.find(".//{http://schemas.openxmlformats.org/drawingml/2006/diagram}t")
                                                if t_elem is not None:
                                                    print(f"  Text element found: '{t_elem.text}'")
                                                else:
                                                    print(f"  No text element found")
                                        
                                        except Exception as e:
                                            print(f"Error reading diagram data: {e}")
                                        
                                        break

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python inspect_smartart.py <path_to_pptx>")
        sys.exit(1)
    
    inspect_smartart(sys.argv[1])
