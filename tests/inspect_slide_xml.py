import zipfile
import sys
from lxml import etree

NS = {
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
}

def inspect_xml(pptx_path, slide_num):
    print(f"\n--- Slide {slide_num} ---")
    with zipfile.ZipFile(pptx_path, 'r') as z:
        slide_path = f"ppt/slides/slide{slide_num}.xml" # Renamed 'path' to 'slide_path' for clarity
        if slide_path in z.namelist():
            xml_content = z.read(slide_path)
            tree = etree.fromstring(xml_content)
            
            # Print full XML for first shape
            if tree.findall(".//p:sp", NS):
                first_sp = tree.findall(".//p:sp", NS)[0]
                print(f"\n--- Full XML for Slide Shape 0 ---")
                print(etree.tostring(first_sp, pretty_print=True).decode())

            # Check Layout
            rels_path = f"ppt/slides/_rels/slide{slide_num}.xml.rels"
            rels = {}
            if rels_path in z.namelist():
                rels_xml_content = z.read(rels_path)
                rels_tree = etree.fromstring(rels_xml_content)
                for r_tag in rels_tree.findall(".//r:Relationship", NS):
                    r_id = r_tag.get("Id")
                    r_type = r_tag.get("Type")
                    r_target = r_tag.get("Target")
                    rels[r_id] = {"type": r_type, "target": r_target}

            layout_rel = next((r for r in rels.values() if r["type"].endswith("/slideLayout")), None)
            if layout_rel:
                # The target path in rels is relative to the _rels directory.
                # We need to resolve it relative to the slide's directory.
                layout_path = posixpath.join(posixpath.dirname(slide_path), layout_rel["target"])
                # Normalize path
                layout_path = posixpath.normpath(layout_path)
                
                try:
                    layout_tree = etree.fromstring(z.read(layout_path))
                    print(f"\n--- Layout {layout_path} ---")
                    for i, sp in enumerate(layout_tree.findall(".//p:sp", NS)):
                        ph = sp.find("p:nvSpPr/p:nvPr/p:ph", NS)
                        ph_type = ph.get("type") if ph is not None else "None"
                        ph_idx = ph.get("idx") if ph is not None else "None"
                        print(f"Layout Shape {i}: type={ph_type}, idx={ph_idx}")
                        if i == 0:
                             print(etree.tostring(sp, pretty_print=True).decode())
                except Exception as e:
                    print(f"Could not read layout: {e}")
            
            # Find all shapes
            for i, sp in enumerate(tree.findall(".//p:sp", NS)):
                # The original code had this block, which is now handled by the new "Print full XML for first shape" block above.
                # if i == 0:
                #     print(f"\n--- Full XML for Shape {i} ---")
                #     print(etree.tostring(sp, pretty_print=True).decode())
                
                print(f"\nShape {i}:")
                # ... rest of the loop ...
                
                # Check style
                style = sp.find("p:style", NS)
                if style is not None:
                    font_ref = style.find("a:fontRef", NS)
                    if font_ref is not None:
                        color = font_ref.find(".//a:schemeClr", NS)
                        val = color.get("val") if color is not None else "None"
                        print(f"  Style FontRef Color: {val}")
                
                # Check text body
                txBody = sp.find("p:txBody", NS)
                if txBody is not None:
                    for p in txBody.findall("a:p", NS):
                        print("  Paragraph:")
                        # Check paragraph properties
                        pPr = p.find("a:pPr", NS)
                        if pPr is not None:
                             print(f"    pPr: {etree.tostring(pPr, pretty_print=True).decode().strip()}")

                        for r in p.findall("a:r", NS):
                            t = r.find("a:t", NS).text
                            print(f"    Run: '{t}'")
                            rPr = r.find("a:rPr", NS)
                            if rPr is not None:
                                fill = rPr.find("a:solidFill", NS)
                                if fill is not None:
                                    print(f"      Explicit Fill: {etree.tostring(fill).decode().strip()}")
                                else:
                                    print("      No Explicit Fill")
                            else:
                                print("      No rPr")
        else:
            print(f"Slide {slide_num} not found")

if __name__ == "__main__":
    inspect_xml(sys.argv[1], 1)
    inspect_xml(sys.argv[1], 10)
