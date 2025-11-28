"""
Advanced Text Element Injector for PPTX Content Rewriting

This service injects rewritten text content back into PPTX files using element IDs.
Works with the advanced placeholder_extractor.py to handle ALL text-bearing structures.

Supports injection into:
- Shapes (regular and placeholders)
- Textboxes
- Grouped shapes
- Table cells
- Chart text elements
- SmartArt diagram nodes
- Speaker notes

Purpose: Take LLM-generated content and inject it precisely into the original PPTX file
using unique element IDs, preserving all visual design while updating only the text.
"""

import zipfile
import logging
from typing import Dict, Any, Optional, List
from lxml import etree
import os
import shutil

logger = logging.getLogger(__name__)

# XML namespaces for PPTX parsing
NS = {
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "c": "http://schemas.openxmlformats.org/drawingml/2006/chart",
    "dgm": "http://schemas.openxmlformats.org/drawingml/2006/diagram",
}

# Register namespaces for proper XML serialization
for prefix, uri in NS.items():
    etree.register_namespace(prefix, uri)


def _read_xml(zipf: zipfile.ZipFile, path: str) -> Optional[etree._Element]:
    """Read and parse XML from PPTX zip file."""
    try:
        with zipf.open(path) as f:
            return etree.parse(f).getroot()
    except KeyError:
        logger.warning(f"File not found in PPTX: {path}")
        return None
    except Exception as e:
        logger.error(f"Error reading {path}: {e}")
        return None


def replace_text_in_element(element_el: etree._Element, new_text: str, namespace_prefix: str = "p") -> bool:
    """
    Replace all text content in any element with new text.

    Handles multi-paragraph text by splitting on \\n.
    Preserves text formatting (fonts, colors, sizes) from existing runs when possible.

    Args:
        element_el: XML element containing text body
        new_text: New text content (can contain \\n for multiple paragraphs)
        namespace_prefix: Namespace prefix for txBody ("p" for shapes, "c" for charts, "a" for tables)

    Returns:
        True if text was replaced successfully.
    """
    # Find text body (can be p:txBody, c:tx, or a:txBody)
    tx_body = element_el.find(f".//{namespace_prefix}:txBody", NS)
    if tx_body is None:
        tx_body = element_el.find(".//a:txBody", NS)
    if tx_body is None:
        tx_body = element_el.find(".//c:tx", NS)
    if tx_body is None:
        logger.warning(f"Element has no text body, cannot inject text")
        return False

    # Split new text into paragraphs
    paragraphs = new_text.split("\\n") if new_text else [""]

    # Save formatting from first existing run (if any)
    existing_paras = tx_body.findall("a:p", NS)
    existing_rpr = None
    if existing_paras:
        first_run = existing_paras[0].find("a:r/a:rPr", NS)
        if first_run is not None:
            existing_rpr = first_run

    # Clear existing paragraphs
    for para in existing_paras:
        tx_body.remove(para)

    # Create new paragraphs
    for para_text in paragraphs:
        # Create new paragraph element
        new_para = etree.Element(f"{{{NS['a']}}}p")

        # Create run
        run = etree.SubElement(new_para, f"{{{NS['a']}}}r")

        # Copy existing run properties if available
        if existing_rpr is not None:
            run.append(etree.fromstring(etree.tostring(existing_rpr)))

        # Add text element
        text_el = etree.SubElement(run, f"{{{NS['a']}}}t")
        text_el.text = para_text

        # Add end paragraph run (required by PowerPoint)
        etree.SubElement(new_para, f"{{{NS['a']}}}endParaRPr")

        tx_body.append(new_para)

    return True


def inject_shape_text(shape_el: etree._Element, new_text: str) -> bool:
    """Inject text into a regular shape element (sp)."""
    return replace_text_in_element(shape_el, new_text, "p")


def inject_group_shape_text(sp_tree: etree._Element, element_id: str, new_text: str) -> bool:
    """
    Inject text into a shape within a group.

    Element ID format: slide{N}_group{G}_shape{S}
    """
    # Parse element ID to find the specific group and shape
    parts = element_id.split("_")
    if len(parts) != 3:
        logger.error(f"Invalid group shape element ID: {element_id}")
        return False

    group_num = int(parts[1].replace("group", ""))
    shape_num = int(parts[2].replace("shape", ""))

    # Find the group
    current_group = 0
    for child in sp_tree:
        tag_name = etree.QName(child.tag).localname
        if tag_name == "grpSp":
            if current_group == group_num:
                # Found the group, now find the shape
                current_shape = 0
                for group_child in child:
                    group_tag = etree.QName(group_child.tag).localname
                    if group_tag == "sp":
                        if current_shape == shape_num:
                            return inject_shape_text(group_child, new_text)
                        current_shape += 1
            current_group += 1

    logger.warning(f"Could not find group shape: {element_id}")
    return False


def inject_table_cell_text(sp_tree: etree._Element, element_id: str, new_text: str) -> bool:
    """
    Inject text into a table cell.

    Element ID format: slide{N}_table{T}_cell{C}
    """
    # Parse element ID
    parts = element_id.split("_")
    if len(parts) != 3:
        logger.error(f"Invalid table cell element ID: {element_id}")
        return False

    table_num = int(parts[1].replace("table", ""))
    cell_num = int(parts[2].replace("cell", ""))

    # Find the table graphic frame
    current_table = 0
    for child in sp_tree:
        tag_name = etree.QName(child.tag).localname
        if tag_name == "graphicFrame":
            graphic_data = child.find(".//a:graphicData", NS)
            if graphic_data is not None:
                uri = graphic_data.get("uri", "")
                if "table" in uri:
                    if current_table == table_num:
                        # Found the table, find the cell
                        table_el = graphic_data.find(".//a:tbl", NS)
                        if table_el is not None:
                            current_cell = 0
                            for row in table_el.findall(".//a:tr", NS):
                                for cell in row.findall(".//a:tc", NS):
                                    if current_cell == cell_num:
                                        return replace_text_in_element(cell, new_text, "a")
                                    current_cell += 1
                    current_table += 1

    logger.warning(f"Could not find table cell: {element_id}")
    return False


def inject_chart_text(slide_path: str, zipf: zipfile.ZipFile, element_id: str, new_text: str, temp_dir: str) -> bool:
    """
    Inject text into chart elements (title, axis labels).

    Element ID format: slide{N}_chart{C}_title or slide{N}_chart{C}_axis{A}

    Returns True if text was injected successfully.
    """
    parts = element_id.split("_")
    if len(parts) < 3:
        logger.error(f"Invalid chart text element ID: {element_id}")
        return False

    chart_num = int(parts[1].replace("chart", ""))
    subtype = parts[2]  # "title" or "axis{N}"

    # Load slide to find chart relationship
    slide_tree = _read_xml(zipf, slide_path)
    if slide_tree is None:
        return False

    sp_tree = slide_tree.find("p:cSld/p:spTree", NS)
    if sp_tree is None:
        return False

    # Find the chart graphic frame and get its relationship ID
    current_chart = 0
    chart_rel_id = None

    for child in sp_tree:
        tag_name = etree.QName(child.tag).localname
        if tag_name == "graphicFrame":
            graphic_data = child.find(".//a:graphicData", NS)
            if graphic_data is not None:
                uri = graphic_data.get("uri", "")
                if "chart" in uri:
                    if current_chart == chart_num:
                        chart_el = graphic_data.find(".//c:chart", NS)
                        if chart_el is not None:
                            chart_rel_id = chart_el.get(f"{{{NS['r']}}}id")
                            break
                    current_chart += 1

    if not chart_rel_id:
        logger.warning(f"Could not find chart for element: {element_id}")
        return False

    # Load chart relationships to find chart XML
    slide_dir = "/".join(slide_path.split("/")[:-1])
    rels_path = f"{slide_dir}/_rels/{slide_path.split('/')[-1]}.rels"

    try:
        rels_tree = _read_xml(zipf, rels_path)
        if rels_tree is None:
            return False

        # Find chart target
        chart_target = None
        for rel in rels_tree.findall(".//{*}Relationship"):
            if rel.get("Id") == chart_rel_id:
                chart_target = rel.get("Target")
                break

        if not chart_target:
            return False

        # Resolve chart path
        chart_path = f"{slide_dir}/{chart_target}".replace("../", "")
        chart_tree = _read_xml(zipf, chart_path)
        if chart_tree is None:
            return False

        # Inject text based on subtype
        if subtype == "title":
            title_el = chart_tree.find(".//c:title", NS)
            if title_el is not None:
                if replace_text_in_element(title_el, new_text, "c"):
                    # Write modified chart back to temp directory
                    output_chart_path = os.path.join(temp_dir, chart_path)
                    os.makedirs(os.path.dirname(output_chart_path), exist_ok=True)
                    with open(output_chart_path, 'wb') as f:
                        f.write(etree.tostring(chart_tree, xml_declaration=True, encoding='UTF-8'))
                    return True

        elif subtype.startswith("axis"):
            axis_num = int(subtype.replace("axis", ""))
            current_axis = 0
            for axis_type in ["catAx", "valAx"]:
                for axis in chart_tree.findall(f".//c:{axis_type}", NS):
                    if current_axis == axis_num:
                        axis_title = axis.find(".//c:title", NS)
                        if axis_title is not None:
                            if replace_text_in_element(axis_title, new_text, "c"):
                                # Write modified chart back to temp directory
                                output_chart_path = os.path.join(temp_dir, chart_path)
                                os.makedirs(os.path.dirname(output_chart_path), exist_ok=True)
                                with open(output_chart_path, 'wb') as f:
                                    f.write(etree.tostring(chart_tree, xml_declaration=True, encoding='UTF-8'))
                                return True
                    current_axis += 1

    except Exception as e:
        logger.error(f"Error injecting chart text: {e}")
        return False

    return False


def inject_speaker_notes(slide_path: str, zipf: zipfile.ZipFile, new_text: str, temp_dir: str) -> bool:
    """
    Inject text into speaker notes.

    Returns True if notes were updated successfully.
    """
    if not new_text:
        return False

    slide_file_num = slide_path.split("/")[-1].replace("slide", "").replace(".xml", "")
    notes_path = f"ppt/notesSlides/notesSlide{slide_file_num}.xml"

    # Try to read existing notes
    notes_tree = _read_xml(zipf, notes_path)
    if notes_tree is None:
        logger.warning(f"Slide {slide_file_num} has no notes file, skipping notes injection")
        return False

    # Find notes body placeholder
    sp_tree = notes_tree.find("p:cSld/p:spTree", NS)
    if sp_tree is None:
        return False

    for shape in sp_tree:
        # Check for body placeholder in notes
        ph_el = shape.find(".//p:ph", NS)
        if ph_el is not None:
            ph_type = ph_el.get("type", "body")
            if ph_type == "body":
                if inject_shape_text(shape, new_text):
                    # Write modified notes back to temp directory
                    output_notes_path = os.path.join(temp_dir, notes_path)
                    os.makedirs(os.path.dirname(output_notes_path), exist_ok=True)
                    with open(output_notes_path, 'wb') as f:
                        f.write(etree.tostring(notes_tree, xml_declaration=True, encoding='UTF-8'))
                    return True

    return False


def inject_elements_into_slide(
    slide_path: str,
    zipf: zipfile.ZipFile,
    elements: List[Dict[str, Any]],
    temp_dir: str
) -> etree._Element:
    """
    Inject text content into all elements on a single slide using element IDs.

    Args:
        slide_path: Path to slide XML in PPTX
        zipf: Open ZipFile object
        elements: List of elements with "id" and "text" fields
        temp_dir: Temporary directory for writing modified files

    Returns:
        Modified slide XML tree
    """
    slide_tree = _read_xml(zipf, slide_path)
    if slide_tree is None:
        raise ValueError(f"Could not read slide: {slide_path}")

    sp_tree = slide_tree.find("p:cSld/p:spTree", NS)
    if sp_tree is None:
        raise ValueError(f"Slide has no shape tree: {slide_path}")

    # Process each element
    injected_count = 0
    notes_element = None

    for element in elements:
        element_id = element.get("id")
        new_text = element.get("text", "")

        if not element_id:
            logger.warning("Element missing ID, skipping")
            continue

        # Determine element type from ID
        if "_notes" in element_id:
            # Handle speaker notes separately
            notes_element = element
            continue

        elif "_group" in element_id:
            # Grouped shape
            if inject_group_shape_text(sp_tree, element_id, new_text):
                injected_count += 1

        elif "_table" in element_id:
            # Table cell
            if inject_table_cell_text(sp_tree, element_id, new_text):
                injected_count += 1

        elif "_chart" in element_id:
            # Chart text
            if inject_chart_text(slide_path, zipf, element_id, new_text, temp_dir):
                injected_count += 1

        elif "_shape" in element_id:
            # Regular shape - find by index
            parts = element_id.split("_")
            if len(parts) == 2:
                shape_num = int(parts[1].replace("shape", ""))
                current_shape = 0

                for child in sp_tree:
                    tag_name = etree.QName(child.tag).localname
                    if tag_name == "sp":
                        if current_shape == shape_num:
                            if inject_shape_text(child, new_text):
                                injected_count += 1
                            break
                        current_shape += 1

        else:
            logger.warning(f"Unknown element type for ID: {element_id}")

    # Handle speaker notes
    if notes_element:
        inject_speaker_notes(slide_path, zipf, notes_element.get("text", ""), temp_dir)

    logger.info(f"Injected text into {injected_count}/{len(elements)} elements on {slide_path}")

    return slide_tree


def inject_content_into_pptx(
    original_pptx_path: str,
    output_pptx_path: str,
    rewritten_content: Dict[str, Any]
) -> str:
    """
    Inject rewritten content into a PPTX file using element-based structure.

    Args:
        original_pptx_path: Path to original PPTX file
        output_pptx_path: Path where modified PPTX should be saved
        rewritten_content: Dict with structure:
            {
                "slides": [
                    {
                        "slideNumber": 1,
                        "elements": [
                            {"id": "slide1_shape0", "text": "New text"},
                            {"id": "slide1_table0_cell0", "text": "Cell text"},
                            ...
                        ]
                    },
                    ...
                ]
            }

    Returns:
        Path to the output PPTX file
    """
    # Create temp directory for extraction
    temp_dir = original_pptx_path + "_temp"
    os.makedirs(temp_dir, exist_ok=True)

    try:
        # Extract PPTX to temp directory
        with zipfile.ZipFile(original_pptx_path, 'r') as zipf:
            zipf.extractall(temp_dir)

        # Get list of slide files
        slides_dir = os.path.join(temp_dir, "ppt", "slides")
        slide_files = sorted(
            [f for f in os.listdir(slides_dir) if f.startswith("slide") and f.endswith(".xml") and "Layout" not in f],
            key=lambda x: int(x.replace("slide", "").replace(".xml", ""))
        )

        rewritten_slides = rewritten_content.get("slides", [])

        if len(slide_files) != len(rewritten_slides):
            raise ValueError(
                f"Slide count mismatch: PPTX has {len(slide_files)} slides, "
                f"rewritten content has {len(rewritten_slides)} slides"
            )

        # Inject content into each slide
        with zipfile.ZipFile(original_pptx_path, 'r') as zipf:
            for slide_file, rewritten_slide in zip(slide_files, rewritten_slides):
                slide_path = f"ppt/slides/{slide_file}"
                elements = rewritten_slide.get("elements", [])

                # Inject all elements
                modified_tree = inject_elements_into_slide(slide_path, zipf, elements, temp_dir)

                # Write modified slide back to temp directory
                output_slide_path = os.path.join(temp_dir, slide_path)
                with open(output_slide_path, 'wb') as f:
                    f.write(etree.tostring(modified_tree, xml_declaration=True, encoding='UTF-8'))

                logger.info(f"Injected content into slide {slide_file}")

        # Repackage as PPTX
        with zipfile.ZipFile(output_pptx_path, 'w', zipfile.ZIP_DEFLATED) as output_zip:
            for root, dirs, files in os.walk(temp_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, temp_dir)
                    output_zip.write(file_path, arcname)

        logger.info(f"Created rewritten PPTX: {output_pptx_path}")
        return output_pptx_path

    finally:
        # Clean up temp directory
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
