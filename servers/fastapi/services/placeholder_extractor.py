"""
Advanced Text Element Extractor for PPTX Content Rewriting

This service extracts ALL text-bearing elements from PPTX files for the content rewrite feature.
Unlike layout_extractor.py (which extracts full visual properties), this focuses on:
- ALL text elements: shapes, textboxes, tables, SmartArt, charts, notes
- Unique element IDs for precise text replacement
- Text constraints (maxLength, maxLines) for scale & fit rules
- Minimal structure needed for LLM content rewriting

Element types supported:
- "shape" — regular shapes with text (including placeholders)
- "textbox" — free-floating text boxes
- "group_shape" — shapes inside grouped elements
- "table_cell" — text inside table cells
- "smartart" — text nodes inside SmartArt diagrams
- "chart_text" — chart titles, labels, legends
- "notes" — slide speaker notes

Purpose: Enable users to upload a PPTX with their desired design, then rewrite ALL text content
while respecting visual bounds and maintaining design integrity.
"""

import zipfile
import logging
import uuid
from typing import Dict, List, Any, Optional, Tuple
from lxml import etree

logger = logging.getLogger(__name__)

# XML namespaces for PPTX parsing
NS = {
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "c": "http://schemas.openxmlformats.org/drawingml/2006/chart",
    "dgm": "http://schemas.openxmlformats.org/drawingml/2006/diagram",
}


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


def calculate_text_constraints(text: str, width_emu: Optional[int], height_emu: Optional[int]) -> Dict[str, Any]:
    """
    Calculate text constraints based on original text and element dimensions.

    Returns maxLength and maxLines to ensure rewritten text fits within bounds.
    """
    constraints = {}

    # Calculate max length (allow 50% increase for flexibility)
    original_length = len(text)
    constraints["maxLength"] = int(original_length * 1.5)

    # Calculate max lines based on newlines in original text
    if text:
        line_count = text.count('\n') + 1
        constraints["maxLines"] = line_count

    return constraints


def extract_text_from_element(element_el: etree._Element, namespace_prefix: str = "p") -> Tuple[str, int]:
    """
    Extract all text content from any element with a text body.

    Returns tuple of (text_content, paragraph_count).
    Combines all text runs with newlines between paragraphs.
    """
    text_parts = []

    # Find text body (can be p:txBody, c:tx, or a:txBody)
    tx_body = element_el.find(f".//{namespace_prefix}:txBody", NS)
    if tx_body is None:
        tx_body = element_el.find(".//a:txBody", NS)
    if tx_body is None:
        tx_body = element_el.find(".//c:tx", NS)
    if tx_body is None:
        return "", 0

    paragraphs = tx_body.findall("a:p", NS)
    for para in paragraphs:
        para_text = []
        # Find all text runs in the paragraph
        for run in para.findall(".//a:t", NS):
            if run.text:
                para_text.append(run.text)

        if para_text:
            text_parts.append("".join(para_text))

    return "\n".join(text_parts), len(paragraphs)


def get_element_dimensions(element_el: etree._Element) -> Tuple[Optional[int], Optional[int]]:
    """
    Extract element dimensions (width, height) in EMUs.

    Returns (width_emu, height_emu) or (None, None) if not found.
    """
    # Try to find transform (xfrm) element
    xfrm = element_el.find(".//a:xfrm", NS)
    if xfrm is not None:
        ext = xfrm.find("a:ext", NS)
        if ext is not None:
            width = ext.get("cx")
            height = ext.get("cy")
            if width and height:
                return int(width), int(height)

    return None, None


def extract_shape_element(shape_el: etree._Element, slide_num: int, element_index: int) -> Optional[Dict[str, Any]]:
    """
    Extract text from a shape element (sp) with metadata.

    Returns element dict with id, type, text, and constraints.
    """
    text, para_count = extract_text_from_element(shape_el, "p")
    if not text:
        return None  # Skip shapes with no text

    # Get dimensions for constraints
    width_emu, height_emu = get_element_dimensions(shape_el)

    # Check if this is a placeholder
    ph_el = shape_el.find(".//p:ph", NS)
    ph_type = None
    if ph_el is not None:
        ph_type = ph_el.get("type", "body")

    # Generate unique ID
    element_id = f"slide{slide_num}_shape{element_index}"

    # Calculate constraints
    constraints = calculate_text_constraints(text, width_emu, height_emu)

    return {
        "id": element_id,
        "type": "shape",
        "placeholderType": ph_type,  # Can be None for non-placeholder shapes
        "text": text,
        "originalLength": len(text),
        **constraints
    }


def extract_group_shapes(group_el: etree._Element, slide_num: int, element_index: int) -> List[Dict[str, Any]]:
    """
    Extract text from shapes inside a group (grpSp).

    Returns list of element dicts for each shape with text in the group.
    """
    elements = []
    group_index = 0

    for child in group_el:
        tag_name = etree.QName(child.tag).localname
        if tag_name == "sp":  # Shape in group
            text, para_count = extract_text_from_element(child, "p")
            if text:
                width_emu, height_emu = get_element_dimensions(child)
                element_id = f"slide{slide_num}_group{element_index}_shape{group_index}"
                constraints = calculate_text_constraints(text, width_emu, height_emu)

                elements.append({
                    "id": element_id,
                    "type": "group_shape",
                    "text": text,
                    "originalLength": len(text),
                    **constraints
                })
                group_index += 1

    return elements


def extract_table_cells(table_el: etree._Element, slide_num: int, element_index: int) -> List[Dict[str, Any]]:
    """
    Extract text from all cells in a table.

    Returns list of element dicts for each cell with text.
    """
    elements = []
    cell_index = 0

    # Find all table rows and cells
    for row in table_el.findall(".//a:tr", NS):
        for cell in row.findall(".//a:tc", NS):
            text, para_count = extract_text_from_element(cell, "a")
            if text:
                # Get cell dimensions
                width_emu, height_emu = get_element_dimensions(cell)
                element_id = f"slide{slide_num}_table{element_index}_cell{cell_index}"
                constraints = calculate_text_constraints(text, width_emu, height_emu)

                elements.append({
                    "id": element_id,
                    "type": "table_cell",
                    "text": text,
                    "originalLength": len(text),
                    **constraints
                })
                cell_index += 1

    return elements


def extract_chart_text(chart_rel_id: str, slide_path: str, zipf: zipfile.ZipFile, slide_num: int, element_index: int) -> List[Dict[str, Any]]:
    """
    Extract text from chart elements (title, axis labels, legend, data labels).

    Returns list of element dicts for each text element in the chart.
    """
    elements = []

    # Load chart relationships to find chart XML file
    slide_dir = "/".join(slide_path.split("/")[:-1])
    rels_path = f"{slide_dir}/_rels/{slide_path.split('/')[-1]}.rels"

    try:
        rels_tree = _read_xml(zipf, rels_path)
        if rels_tree is None:
            return elements

        # Find chart target
        chart_target = None
        for rel in rels_tree.findall(".//{*}Relationship"):
            if rel.get("Id") == chart_rel_id:
                chart_target = rel.get("Target")
                break

        if not chart_target:
            return elements

        # Resolve chart path
        chart_path = f"{slide_dir}/{chart_target}".replace("../", "")
        chart_tree = _read_xml(zipf, chart_path)
        if chart_tree is None:
            return elements

        chart_index = 0

        # Extract chart title
        title_el = chart_tree.find(".//c:title", NS)
        if title_el is not None:
            title_text, _ = extract_text_from_element(title_el, "c")
            if title_text:
                element_id = f"slide{slide_num}_chart{element_index}_title"
                constraints = calculate_text_constraints(title_text, None, None)
                elements.append({
                    "id": element_id,
                    "type": "chart_text",
                    "subtype": "title",
                    "text": title_text,
                    "originalLength": len(title_text),
                    **constraints
                })

        # Extract axis titles
        for axis_type in ["catAx", "valAx"]:
            for axis in chart_tree.findall(f".//c:{axis_type}", NS):
                axis_title = axis.find(".//c:title", NS)
                if axis_title is not None:
                    axis_text, _ = extract_text_from_element(axis_title, "c")
                    if axis_text:
                        element_id = f"slide{slide_num}_chart{element_index}_axis{chart_index}"
                        constraints = calculate_text_constraints(axis_text, None, None)
                        elements.append({
                            "id": element_id,
                            "type": "chart_text",
                            "subtype": "axis",
                            "text": axis_text,
                            "originalLength": len(axis_text),
                            **constraints
                        })
                        chart_index += 1

    except Exception as e:
        logger.warning(f"Error extracting chart text: {e}")

    return elements


def extract_smartart_text(diagram_rel_id: str, slide_path: str, zipf: zipfile.ZipFile, slide_num: int, element_index: int) -> List[Dict[str, Any]]:
    """
    Extract text from SmartArt diagram nodes.

    SmartArt stores text in diagram data XML files. We extract text from all nodes.
    Returns list of element dicts for each text node in the diagram.
    """
    elements = []

    try:
        # Load slide relationships to find diagram data file
        slide_dir = "/".join(slide_path.split("/")[:-1])
        rels_path = f"{slide_dir}/_rels/{slide_path.split('/')[-1]}.rels"

        rels_tree = _read_xml(zipf, rels_path)
        if rels_tree is None:
            return elements

        # Find diagram data target
        diagram_target = None
        for rel in rels_tree.findall(".//{*}Relationship"):
            if rel.get("Id") == diagram_rel_id:
                diagram_target = rel.get("Target")
                break

        if not diagram_target:
            logger.warning(f"SmartArt diagram relationship not found: {diagram_rel_id}")
            return elements

        # Resolve diagram data path (handle relative paths like ../diagrams/data1.xml)
        if diagram_target.startswith("../"):
            # Relative path - go up one directory from slide_dir
            diagram_path = f"ppt/{diagram_target[3:]}"  # Remove ../ and prepend ppt/
        else:
            # Absolute path from slide directory
            diagram_path = f"{slide_dir}/{diagram_target}"

        diagram_tree = _read_xml(zipf, diagram_path)
        if diagram_tree is None:
            logger.warning(f"Could not read SmartArt diagram data: {diagram_path}")
            return elements

        # SmartArt text is stored in diagram data points
        # Each <dgm:pt> (point) contains text in <dgm:t> elements
        node_index = 0
        for pt in diagram_tree.findall(".//{http://schemas.openxmlformats.org/drawingml/2006/diagram}pt"):
            # Find text element
            t_elem = pt.find(".//{http://schemas.openxmlformats.org/drawingml/2006/diagram}t")
            if t_elem is not None and t_elem.text:
                text = t_elem.text.strip()
                if text:
                    element_id = f"slide{slide_num}_smartart{element_index}_node{node_index}"
                    constraints = calculate_text_constraints(text, None, None)

                    elements.append({
                        "id": element_id,
                        "type": "smartart",
                        "text": text,
                        "originalLength": len(text),
                        **constraints
                    })
                    node_index += 1

        if elements:
            logger.info(f"Extracted {len(elements)} text nodes from SmartArt on slide {slide_num}")
        else:
            logger.warning(f"No text found in SmartArt diagram on slide {slide_num}")

    except Exception as e:
        logger.error(f"Error extracting SmartArt text on slide {slide_num}: {e}", exc_info=True)

    return elements


def extract_all_elements_from_slide(slide_path: str, zipf: zipfile.ZipFile, slide_num: int) -> List[Dict[str, Any]]:
    """
    Extract ALL text-bearing elements from a single slide.

    Returns a list of element dicts with id, type, text, and constraints.
    Handles shapes, textboxes, groups, tables, charts, and SmartArt.
    """
    slide_tree = _read_xml(zipf, slide_path)
    if slide_tree is None:
        return []

    elements = []
    sp_tree = slide_tree.find("p:cSld/p:spTree", NS)
    if sp_tree is None:
        return []

    shape_index = 0
    group_index = 0
    table_index = 0
    chart_index = 0

    for child in sp_tree:
        tag_name = etree.QName(child.tag).localname

        # Extract shapes with text
        if tag_name == "sp":
            element = extract_shape_element(child, slide_num, shape_index)
            if element:
                elements.append(element)
                shape_index += 1

        # Extract grouped shapes
        elif tag_name == "grpSp":
            group_elements = extract_group_shapes(child, slide_num, group_index)
            elements.extend(group_elements)
            if group_elements:
                group_index += 1

        # Extract graphic frames (tables, charts, SmartArt)
        elif tag_name == "graphicFrame":
            graphic_data = child.find(".//a:graphicData", NS)
            if graphic_data is not None:
                uri = graphic_data.get("uri", "")

                # Table
                if "table" in uri:
                    table_el = graphic_data.find(".//a:tbl", NS)
                    if table_el is not None:
                        table_elements = extract_table_cells(table_el, slide_num, table_index)
                        elements.extend(table_elements)
                        if table_elements:
                            table_index += 1

                # Chart
                elif "chart" in uri:
                    # Find chart relationship ID
                    chart_el = graphic_data.find(".//c:chart", NS)
                    if chart_el is not None:
                        chart_rel_id = chart_el.get(f"{{{NS['r']}}}id")
                        if chart_rel_id:
                            chart_elements = extract_chart_text(chart_rel_id, slide_path, zipf, slide_num, chart_index)
                            elements.extend(chart_elements)
                            if chart_elements:
                                chart_index += 1

                # SmartArt/Diagram
                elif "diagram" in uri or "smartArt" in uri:
                    diagram_el = graphic_data.find(".//dgm:relIds", NS)
                    if diagram_el is not None:
                        diagram_rel_id = diagram_el.get(f"{{{NS['r']}}}dm")
                        if diagram_rel_id:
                            smartart_elements = extract_smartart_text(diagram_rel_id, slide_path, zipf, slide_num, chart_index)
                            elements.extend(smartart_elements)

    return elements


def extract_speaker_notes(slide_path: str, zipf: zipfile.ZipFile, slide_num: int) -> Optional[Dict[str, Any]]:
    """
    Extract speaker notes from a slide as an element.

    Notes are stored in a separate XML file referenced by the slide's relationships.
    Returns element dict or None if no notes exist.
    """
    # Get the slide's relationship file
    slide_file_num = slide_path.split("/")[-1].replace("slide", "").replace(".xml", "")
    notes_path = f"ppt/notesSlides/notesSlide{slide_file_num}.xml"

    notes_tree = _read_xml(zipf, notes_path)
    if notes_tree is None:
        return None

    # Find the notes text body
    sp_tree = notes_tree.find("p:cSld/p:spTree", NS)
    if sp_tree is None:
        return None

    # Notes are typically in a shape with placeholder type "body"
    for shape in sp_tree:
        # Check for placeholder
        ph_el = shape.find(".//p:ph", NS)
        if ph_el is not None:
            ph_type = ph_el.get("type", "body")
            if ph_type == "body":
                text, _ = extract_text_from_element(shape, "p")
                if text:
                    element_id = f"slide{slide_num}_notes"
                    width_emu, height_emu = get_element_dimensions(shape)
                    constraints = calculate_text_constraints(text, width_emu, height_emu)
                    return {
                        "id": element_id,
                        "type": "notes",
                        "text": text,
                        "originalLength": len(text),
                        **constraints
                    }

    return None


def extract_all_placeholders(pptx_path: str) -> Dict[str, Any]:
    """
    Extract ALL text elements from a PPTX file with advanced text extraction.

    Returns a structure ready for LLM content rewriting:
    {
        "slides": [
            {
                "slideNumber": 1,
                "elements": [
                    {
                        "id": "slide1_shape0",
                        "type": "shape",
                        "placeholderType": "title",
                        "text": "Slide Title",
                        "originalLength": 11,
                        "maxLength": 13,
                        "maxLines": 1
                    },
                    {
                        "id": "slide1_table0_cell0",
                        "type": "table_cell",
                        "text": "Cell content",
                        "originalLength": 12,
                        "maxLength": 14,
                        "maxLines": 1
                    },
                    {
                        "id": "slide1_notes",
                        "type": "notes",
                        "text": "Speaker notes",
                        "originalLength": 13,
                        "maxLength": 15,
                        "maxLines": 1
                    }
                ]
            },
            ...
        ]
    }
    """
    try:
        with zipfile.ZipFile(pptx_path, 'r') as zipf:
            # Find all slide files
            slide_files = [
                name for name in zipf.namelist()
                if name.startswith("ppt/slides/slide") and name.endswith(".xml")
                and "slideLayout" not in name and "slideMaster" not in name
            ]

            # Sort by slide number - extract number from "ppt/slides/slide123.xml"
            def get_slide_number(filepath):
                # Extract filename without path: "ppt/slides/slide123.xml" -> "slide123.xml"
                filename = filepath.split("/")[-1]
                # Remove "slide" prefix and ".xml" suffix: "slide123.xml" -> "123"
                number_str = filename.replace("slide", "").replace(".xml", "")
                return int(number_str)

            slide_files.sort(key=get_slide_number)

            slides = []
            total_elements = 0

            for slide_num, slide_path in enumerate(slide_files, start=1):
                # Extract all elements from slide
                elements = extract_all_elements_from_slide(slide_path, zipf, slide_num)

                # Extract speaker notes
                notes_element = extract_speaker_notes(slide_path, zipf, slide_num)
                if notes_element:
                    elements.append(notes_element)

                slides.append({
                    "slideNumber": slide_num,
                    "elements": elements
                })

                total_elements += len(elements)

            logger.info(
                f"Extracted {total_elements} text elements from {len(slides)} slides in {pptx_path} "
                f"(avg {total_elements // len(slides) if slides else 0} elements/slide)"
            )

            return {"slides": slides}

    except Exception as e:
        logger.error(f"Error extracting elements from {pptx_path}: {e}", exc_info=True)
        raise


def validate_rewritten_content(original_structure: Dict[str, Any], rewritten_content: Dict[str, Any]) -> bool:
    """
    Validate that rewritten content matches the original element structure.

    Ensures:
    - Same number of slides
    - Same element IDs on each slide
    - Same element order
    - No extra or missing elements
    - Text length constraints respected

    Returns True if valid, raises ValueError with details if invalid.
    """
    original_slides = original_structure.get("slides", [])
    rewritten_slides = rewritten_content.get("slides", [])

    if len(original_slides) != len(rewritten_slides):
        raise ValueError(
            f"Slide count mismatch: original has {len(original_slides)} slides, "
            f"rewritten has {len(rewritten_slides)} slides"
        )

    for i, (orig_slide, rewritten_slide) in enumerate(zip(original_slides, rewritten_slides), start=1):
        orig_elements = orig_slide.get("elements", [])
        rewritten_elements = rewritten_slide.get("elements", [])

        if len(orig_elements) != len(rewritten_elements):
            raise ValueError(
                f"Slide {i} element count mismatch: original has {len(orig_elements)} elements, "
                f"rewritten has {len(rewritten_elements)} elements"
            )

        # Validate each element
        for j, (orig_el, rewritten_el) in enumerate(zip(orig_elements, rewritten_elements)):
            orig_id = orig_el.get("id")
            rewritten_id = rewritten_el.get("id")

            if orig_id != rewritten_id:
                raise ValueError(
                    f"Slide {i}, element {j}: ID mismatch. Expected '{orig_id}', got '{rewritten_id}'"
                )

            # Validate text length constraints
            rewritten_text = rewritten_el.get("text", "")
            max_length = orig_el.get("maxLength")
            if max_length and len(rewritten_text) > max_length:
                raise ValueError(
                    f"Slide {i}, element '{orig_id}': Text length {len(rewritten_text)} exceeds maxLength {max_length}"
                )

            # Validate line count constraints
            max_lines = orig_el.get("maxLines")
            if max_lines:
                rewritten_lines = rewritten_text.count('\n') + 1
                if rewritten_lines > max_lines:
                    raise ValueError(
                        f"Slide {i}, element '{orig_id}': Line count {rewritten_lines} exceeds maxLines {max_lines}"
                    )

    logger.info("Rewritten content structure and constraints validation passed")
    return True
