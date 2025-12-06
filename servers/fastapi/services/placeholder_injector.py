"""
Advanced Text Element Injector for PPTX Content Rewriting

This service injects rewritten text content back into PPTX files using element IDs.
Works with the advanced placeholder_extractor.py to handle ALL text-bearing structures.

Supports injection into:
- Shapes (regular and placeholders)
- Textboxes
- Grouped shapes
- Table cells
- Chart text elements (titles, axis labels)
- SmartArt diagram nodes (FULLY IMPLEMENTED)
- Speaker notes

Purpose: Take LLM-generated content and inject it precisely into the original PPTX file
using unique element IDs, preserving all visual design while updating only the text.
"""

import zipfile
import logging
import os
from typing import Dict, Any, Optional, List
from lxml import etree
import shutil
import copy
import uuid

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


def is_rtl_text(text: str) -> bool:
    """
    Check if text contains right-to-left characters (Hebrew, Arabic).
    """
    if not text:
        return False
        
    for char in text:
        # Hebrew: 0590-05FF, Arabic: 0600-06FF
        if '\u0590' <= char <= '\u05FF' or '\u0600' <= char <= '\u06FF':
            return True
            
    return False


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

    # Save formatting from first existing run (if any) and paragraph properties
    existing_paras = tx_body.findall("a:p", NS)
    existing_rpr = None
    existing_ppr = None
    
    if existing_paras:
        # Save run properties
        first_run = existing_paras[0].find("a:r/a:rPr", NS)
        if first_run is not None:
            existing_rpr = first_run
            
        # Save paragraph properties
        first_ppr = existing_paras[0].find("a:pPr", NS)
        if first_ppr is not None:
            existing_ppr = first_ppr

    # Clear existing paragraphs
    for para in existing_paras:
        tx_body.remove(para)
        
    # Determine text direction
    is_rtl = is_rtl_text(new_text)
    rtl_val = "1" if is_rtl else "0"
    align_val = "r" if is_rtl else None # Only enforce right alignment for RTL, let LTR default

    # Create new paragraphs
    for para_text in paragraphs:
        # Create new paragraph element
        new_para = etree.Element(f"{{{NS['a']}}}p")

        # Add paragraph properties
        if existing_ppr is not None:
            # Clone existing pPr
            para_props = etree.fromstring(etree.tostring(existing_ppr, encoding='unicode'))
            new_para.append(para_props)
        else:
            # Create new pPr
            para_props = etree.SubElement(new_para, f"{{{NS['a']}}}pPr")
            
        # Apply RTL/Alignment overrides
        # We set these even if pPr existed, to ensure text direction matches content
        para_props.set("rtl", rtl_val)
        if align_val:
            para_props.set("algn", align_val)

        # Create run
        run = etree.SubElement(new_para, f"{{{NS['a']}}}r")

        # Copy existing run properties if available
        if existing_rpr is not None:
            run.append(etree.fromstring(etree.tostring(existing_rpr, encoding='unicode')))

        # Add text element
        text_el = etree.SubElement(run, f"{{{NS['a']}}}t")
        text_el.text = para_text

        # Add end paragraph run (required by PowerPoint)
        etree.SubElement(new_para, f"{{{NS['a']}}}endParaRPr")

        tx_body.append(new_para)

    return True


def inject_shape_text(shape_el: etree._Element, new_text: str) -> bool:
    """Inject text into a regular shape element (sp)."""
    # Check if txBody exists
    tx_body = shape_el.find(".//p:txBody", NS)
    
    # Determine text direction for potential new txBody
    is_rtl = is_rtl_text(new_text)
    rtl_col_val = "1" if is_rtl else "0"
    
    if tx_body is None:
        # Create txBody if missing
        # p:sp children: nvSpPr, spPr, style?, txBody?, extLst?
        
        # Create new txBody with basic properties
        tx_body = etree.Element(f"{{{NS['p']}}}txBody")
        
        # Add body properties (wrap="square" is standard for textboxes)
        body_pr = etree.SubElement(tx_body, f"{{{NS['a']}}}bodyPr")
        body_pr.set("wrap", "square")
        body_pr.set("rtlCol", rtl_col_val)
        etree.SubElement(body_pr, f"{{{NS['a']}}}spAutoFit")
        
        # Add list style
        etree.SubElement(tx_body, f"{{{NS['a']}}}lstStyle")
        
        # Add empty paragraph so replace_text_in_element has something to work with
        para = etree.SubElement(tx_body, f"{{{NS['a']}}}p")
        etree.SubElement(para, f"{{{NS['a']}}}endParaRPr")
        
        # Find insertion point
        # Try to insert after style, or spPr
        style = shape_el.find("p:style", NS)
        if style is not None:
            style.addnext(tx_body)
        else:
            sp_pr = shape_el.find("p:spPr", NS)
            if sp_pr is not None:
                sp_pr.addnext(tx_body)
            else:
                # Fallback: append (might be invalid schema order but better than nothing)
                shape_el.append(tx_body)
                
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
                        f.write(etree.tostring(chart_tree, xml_declaration=True, encoding='utf-8'))
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
                                    f.write(etree.tostring(chart_tree, xml_declaration=True, encoding='utf-8'))
                                return True
                    current_axis += 1

    except Exception as e:
        logger.error(f"Error injecting chart text: {e}")
        return False

    return False


def inject_smartart_text(slide_path: str, zipf: zipfile.ZipFile, element_id: str, new_text: str, temp_dir: str) -> bool:
    """
    Inject text into SmartArt diagram nodes.

    Element ID format: slide{N}_smartart{S}_node{NODE}

    Returns True if text was injected successfully.
    """
    logger.info(f"Starting SmartArt injection for element: {element_id}, new_text: '{new_text[:50]}...'")
    
    parts = element_id.split("_")
    if len(parts) != 3:
        logger.error(f"Invalid SmartArt element ID: {element_id}")
        return False

    smartart_num = int(parts[1].replace("smartart", ""))
    node_num = int(parts[2].replace("node", ""))
    logger.info(f"Parsed element ID: smartart_num={smartart_num}, node_num={node_num}")

    # Load slide to find SmartArt graphic frame and get its relationship ID
    slide_tree = _read_xml(zipf, slide_path)
    if slide_tree is None:
        logger.error(f"Failed to read slide: {slide_path}")
        return False

    sp_tree = slide_tree.find("p:cSld/p:spTree", NS)
    if sp_tree is None:
        logger.error(f"No shape tree found in slide: {slide_path}")
        return False

    # Find the SmartArt graphic frame and get its relationship ID
    current_smartart = 0
    diagram_rel_id = None

    for child in sp_tree:
        tag_name = etree.QName(child.tag).localname
        if tag_name == "graphicFrame":
            graphic_data = child.find(".//a:graphicData", NS)
            if graphic_data is not None:
                uri = graphic_data.get("uri", "")
                if "diagram" in uri:
                    logger.info(f"Found SmartArt diagram #{current_smartart}")
                    if current_smartart == smartart_num:
                        diagram_el = graphic_data.find(".//{http://schemas.openxmlformats.org/drawingml/2006/diagram}relIds", NS)
                        if diagram_el is not None:
                            # Get the data relationship ID
                            diagram_rel_id = diagram_el.get(f"{{{NS['r']}}}dm")
                            logger.info(f"Found target SmartArt with rel ID: {diagram_rel_id}")
                            break
                    current_smartart += 1

    if not diagram_rel_id:
        logger.warning(f"Could not find SmartArt #{smartart_num} for element: {element_id}")
        return False

    # Load slide relationships to find diagram data file
    slide_dir = "/".join(slide_path.split("/")[:-1])
    rels_path = f"{slide_dir}/_rels/{slide_path.split('/')[-1]}.rels"
    logger.info(f"Loading relationships from: {rels_path}")

    try:
        rels_tree = _read_xml(zipf, rels_path)
        if rels_tree is None:
            logger.error(f"Failed to read relationships: {rels_path}")
            return False

        # Find diagram data target
        diagram_target = None
        for rel in rels_tree.findall(".//{*}Relationship"):
            if rel.get("Id") == diagram_rel_id:
                diagram_target = rel.get("Target")
                logger.info(f"Found diagram target: {diagram_target}")
                break

        if not diagram_target:
            logger.error(f"Could not find relationship target for ID: {diagram_rel_id}")
            return False

        # Resolve diagram data path (handle relative paths like ../diagrams/data1.xml)
        if diagram_target.startswith("../"):
            # Relative path - go up one directory from slide_dir
            diagram_path = f"ppt/{diagram_target[3:]}"  # Remove ../ and prepend ppt/
        else:
            # Absolute path from slide directory
            diagram_path = f"{slide_dir}/{diagram_target}"
        
        logger.info(f"Resolved diagram path: {diagram_path}")

        diagram_tree = _read_xml(zipf, diagram_path)
        if diagram_tree is None:
            logger.error(f"Failed to read diagram data: {diagram_path}")
            return False

        # Find the specific node by index
        current_node = 0
        total_nodes = 0
        for pt in diagram_tree.findall(".//{http://schemas.openxmlformats.org/drawingml/2006/diagram}pt"):
            t_elem = pt.find(".//{http://schemas.openxmlformats.org/drawingml/2006/diagram}t")
            total_nodes += 1
            if t_elem is not None:
                # Extract text from all <a:t> elements to check if this node has text
                text_parts = []
                a_t_elements = t_elem.findall(".//a:t", NS)
                for a_t in a_t_elements:
                    if a_t.text:
                        text_parts.append(a_t.text)
                
                if text_parts:
                    text = " ".join(text_parts).strip()
                    if text:
                        logger.info(f"Found valid text node #{current_node}: '{text[:30]}...'")
                        if current_node == node_num:
                            # Found the target node - update its text
                            logger.info(f"Updating node #{node_num} from '{text}' to '{new_text}'")
                            
                            # Replace text in the first <a:t> element and remove others
                            if a_t_elements:
                                a_t_elements[0].text = new_text
                                # Remove additional <a:t> elements if there were multiple
                                for a_t in a_t_elements[1:]:
                                    parent = a_t.getparent()
                                    if parent is not None:
                                        parent.remove(a_t)

                            # Write modified diagram data back to temp directory
                            output_diagram_path = os.path.join(temp_dir, diagram_path)
                            os.makedirs(os.path.dirname(output_diagram_path), exist_ok=True)
                            with open(output_diagram_path, 'wb') as f:
                                f.write(etree.tostring(diagram_tree, xml_declaration=True, encoding='utf-8'))

                            logger.info(f"Successfully injected text into SmartArt node {node_num} on {slide_path}")
                            logger.info(f"Wrote modified diagram to: {output_diagram_path}")
                            return True
                        current_node += 1
                    else:
                        logger.debug(f"Skipping whitespace-only node")

        logger.warning(f"Could not find SmartArt node {node_num} (found {current_node} valid nodes out of {total_nodes} total nodes) for element: {element_id}")
        return False

    except Exception as e:
        logger.error(f"Error injecting SmartArt text: {e}", exc_info=True)
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
                        f.write(etree.tostring(notes_tree, xml_declaration=True, encoding='utf-8'))
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
    
    # If slide doesn't exist in zipfile (new slide), read from temp directory
    if slide_tree is None:
        temp_slide_path = os.path.join(temp_dir, slide_path)
        if os.path.exists(temp_slide_path):
            try:
                slide_tree = etree.parse(temp_slide_path).getroot()
            except Exception as e:
                logger.error(f"Error reading slide from temp directory: {e}")
                raise ValueError(f"Could not read slide: {slide_path}")
        else:
            raise ValueError(f"Could not read slide: {slide_path}")

    sp_tree = slide_tree.find("p:cSld/p:spTree", NS)
    if sp_tree is None:
        raise ValueError(f"Slide has no shape tree: {slide_path}")

    # Process each element
    injected_count = 0
    skipped_new_count = 0
    notes_element = None

    for element in elements:
        element_id = element.get("id")
        new_text = element.get("text", "")
        is_new = element.get("isNew", False)
        should_remove = element.get("remove", False)
        font_size = element.get("fontSize")  # Optional font size

        if not element_id:
            logger.warning("Element missing ID, skipping")
            continue

        # Handle element removal
        if should_remove:
            if "_shape" in element_id:
                parts = element_id.split("_")
                if len(parts) == 2:
                    shape_num = int(parts[1].replace("shape", ""))
                    current_shape = 0
                    for child in sp_tree:
                        tag_name = etree.QName(child.tag).localname
                        if tag_name == "sp":
                            if current_shape == shape_num:
                                sp_tree.remove(child)
                                logger.info(f"Removed shape: {element_id}")
                                break
                            current_shape += 1
            continue

        # Skip new elements that don't exist in the original PPTX
        # New elements are indicated by "isNew": true or "_new_" in the ID
        if is_new or "_new_" in element_id:
            if "_shape" in element_id:
                logger.info(f"Injecting new shape: {element_id}")
                if inject_new_shape(sp_tree, element):
                    injected_count += 1
            else:
                logger.info(f"Skipping new element type (not supported yet): {element_id}")
                skipped_new_count += 1
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

        elif "_smartart" in element_id:
            # SmartArt node text
            if inject_smartart_text(slide_path, zipf, element_id, new_text, temp_dir):
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
                                # Apply font size if specified
                                if font_size:
                                    apply_font_size_to_shape(child, font_size)
                            break
                        current_shape += 1

        else:
            logger.warning(f"Unknown element type for ID: {element_id}")

    # Handle speaker notes
    if notes_element:
        inject_speaker_notes(slide_path, zipf, notes_element.get("text", ""), temp_dir)

    if skipped_new_count > 0:
        logger.info(f"Injected text into {injected_count}/{len(elements)} elements on {slide_path} (skipped {skipped_new_count} new elements)")
    else:
        logger.info(f"Injected text into {injected_count}/{len(elements)} elements on {slide_path}")

    return slide_tree


def apply_font_size_to_shape(shape_el: etree._Element, font_size: int) -> bool:
    """
    Apply font size to all text runs in a shape.

    Args:
        shape_el: The shape XML element
        font_size: Font size in points

    Returns:
        True if successful
    """
    # Find text body
    tx_body = shape_el.find(".//p:txBody", NS)
    if tx_body is None:
        return False

    # Convert points to EMUs (1 point = 12700 EMUs)
    font_size_emu = font_size * 100

    # Find all text runs and update font size
    for para in tx_body.findall("a:p", NS):
        for run in para.findall("a:r", NS):
            # Get or create run properties
            rPr = run.find("a:rPr", NS)
            if rPr is None:
                rPr = etree.Element(f"{{{NS['a']}}}rPr")
                # Insert rPr before text element
                t = run.find("a:t", NS)
                if t is not None:
                    run.insert(run.index(t), rPr)
                else:
                    run.insert(0, rPr)

            # Set font size
            rPr.set("sz", str(font_size_emu))

    return True


def inject_new_shape(sp_tree: etree._Element, element: Dict[str, Any]) -> bool:
    """
    Inject a new shape into the slide by cloning an existing one.

    Supports position and size control:
    - position: "top", "middle", "bottom", "left", "right", "center", "top-left", "top-right", "bottom-left", "bottom-right"
    - size: "small", "medium", "large", "full-width"
    - layout: "single", "two-column-left", "two-column-right"
    - shapeType: "textbox", "title", "subtitle" (default: "textbox")
    - fontSize: font size in points (e.g., 12, 18, 24, 32)
    """
    element_id = element.get("id")
    new_text = element.get("text", "")
    target_ph_type = element.get("placeholderType", "body")
    position = element.get("position", "bottom")  # Default: stack at bottom
    size = element.get("size", "medium")  # Default: medium
    layout = element.get("layout", "single")  # Default: single column
    shape_type = element.get("shapeType", "textbox")  # Type of shape to create
    font_size = element.get("fontSize")  # Optional font size in points

    # Find reference shape and slide dimensions
    ref_shape = None
    max_y = 0
    min_x = 999999999
    max_x = 0
    slide_width = 9144000  # Standard slide width in EMUs (~25.4cm)
    slide_height = 6858000  # Standard slide height in EMUs (~19.05cm)

    # Map shape type to placeholder type for better reference selection
    shape_type_to_ph = {
        "title": "title",
        "subtitle": "subTitle",
        "textbox": "body",
    }
    target_ph_type = shape_type_to_ph.get(shape_type, "body")

    for child in sp_tree:
        tag_name = etree.QName(child.tag).localname
        if tag_name == "sp":
            # Check dimensions for stacking
            xfrm = child.find(".//a:xfrm", NS)
            if xfrm is not None:
                off = xfrm.find("a:off", NS)
                ext = xfrm.find("a:ext", NS)
                if off is not None and ext is not None:
                    x = int(off.get("x", 0))
                    y = int(off.get("y", 0))
                    cx = int(ext.get("cx", 0))
                    cy = int(ext.get("cy", 0))
                    max_y = max(max_y, y + cy)
                    min_x = min(min_x, x)
                    max_x = max(max_x, x + cx)

            # Check for matching placeholder type
            ph = child.find(".//p:ph", NS)
            ph_type = ph.get("type") if ph is not None else "body"

            if ph_type == target_ph_type:
                ref_shape = child
            elif ref_shape is None and ph_type == "body":
                ref_shape = child # Fallback to body

    if ref_shape is None:
        # Fallback to ANY text shape
        for child in sp_tree:
             tag_name = etree.QName(child.tag).localname
             if tag_name == "sp" and child.find(".//p:txBody", NS) is not None:
                 ref_shape = child
                 break

    if ref_shape is None:
        logger.warning(f"Could not find reference shape to clone for new element: {element_id}")
        return False

    # Clone
    new_shape = copy.deepcopy(ref_shape)

    # Calculate size based on size parameter
    MARGIN = 360000  # ~1cm
    size_map = {
        "small": 0.3,    # 30% of available space
        "medium": 0.5,   # 50% of available space
        "large": 0.7,    # 70% of available space
        "full-width": 0.9  # 90% of slide width
    }
    size_factor = size_map.get(size, 0.5)

    # Get reference shape dimensions
    ref_xfrm = ref_shape.find(".//a:xfrm", NS)
    ref_cx = int(ref_xfrm.find("a:ext", NS).get("cx", 3000000)) if ref_xfrm is not None else 3000000
    ref_cy = int(ref_xfrm.find("a:ext", NS).get("cy", 1000000)) if ref_xfrm is not None else 1000000

    # Calculate new dimensions
    if size == "full-width":
        new_cx = int(slide_width * size_factor)
        new_cy = ref_cy  # Keep height from reference
    else:
        new_cx = int(ref_cx * (size_factor * 2))  # Scale width
        new_cy = int(ref_cy * (size_factor * 1.5))  # Scale height proportionally

    # Calculate position based on position parameter
    if layout == "two-column-left":
        # Left column (50% width)
        new_x = MARGIN
        new_cx = int((slide_width - MARGIN * 3) / 2)
        new_y = max_y + MARGIN
    elif layout == "two-column-right":
        # Right column (50% width)
        new_x = int(slide_width / 2) + MARGIN
        new_cx = int((slide_width - MARGIN * 3) / 2)
        new_y = max_y + MARGIN
    elif position == "top":
        new_x = int((slide_width - new_cx) / 2)  # Centered horizontally
        new_y = MARGIN
    elif position == "middle" or position == "center":
        new_x = int((slide_width - new_cx) / 2)
        new_y = int((slide_height - new_cy) / 2)
    elif position == "bottom":
        new_x = int((slide_width - new_cx) / 2)
        new_y = max_y + MARGIN
    elif position == "left":
        new_x = MARGIN
        new_y = int((slide_height - new_cy) / 2)
    elif position == "right":
        new_x = slide_width - new_cx - MARGIN
        new_y = int((slide_height - new_cy) / 2)
    elif position == "top-left":
        new_x = MARGIN
        new_y = MARGIN
    elif position == "top-right":
        new_x = slide_width - new_cx - MARGIN
        new_y = MARGIN
    elif position == "bottom-left":
        new_x = MARGIN
        new_y = max_y + MARGIN
    elif position == "bottom-right":
        new_x = slide_width - new_cx - MARGIN
        new_y = max_y + MARGIN
    else:
        # Default: stack at bottom
        new_x = int((slide_width - new_cx) / 2)
        new_y = max_y + MARGIN

    # Apply position and size
    xfrm = new_shape.find(".//a:xfrm", NS)
    if xfrm is not None:
        off = xfrm.find("a:off", NS)
        ext = xfrm.find("a:ext", NS)
        if off is not None:
            off.set("x", str(new_x))
            off.set("y", str(new_y))
        if ext is not None:
            ext.set("cx", str(new_cx))
            ext.set("cy", str(new_cy))
            
    # Update ID
    nv_pr = new_shape.find(".//p:nvSpPr", NS)
    if nv_pr is not None:
        cNvPr = nv_pr.find(".//p:cNvPr", NS)
        if cNvPr is not None:
            # Generate new ID
            new_id = str(uuid.uuid4().int & (1<<32)-1) # Random uint32
            cNvPr.set("id", new_id)
            cNvPr.set("name", f"New Shape {element_id}")

    # Inject Text
    inject_shape_text(new_shape, new_text)

    # Apply font size if specified
    if font_size:
        apply_font_size_to_shape(new_shape, font_size)

    sp_tree.append(new_shape)
    return True


def clone_existing_element(sp_tree: etree._Element, source_id: str, element: Dict[str, Any]) -> bool:
    """
    Clone an existing element and create a new one with modified content/position.

    Args:
        sp_tree: The slide's shape tree
        source_id: ID of the element to clone (e.g., "slide1_shape0")
        element: Dict containing new element data (id, text, position, size)

    Returns:
        True if successful
    """
    new_id = element.get("id")
    new_text = element.get("text", "")
    position = element.get("position", "bottom")
    size = element.get("size", "medium")
    layout = element.get("layout", "single")

    # Find the source element to clone
    source_shape = None

    if "_shape" in source_id:
        parts = source_id.split("_")
        if len(parts) >= 2:
            shape_num = int(parts[1].replace("shape", ""))
            current_shape = 0

            for child in sp_tree:
                tag_name = etree.QName(child.tag).localname
                if tag_name == "sp":
                    if current_shape == shape_num:
                        source_shape = child
                        break
                    current_shape += 1

    if source_shape is None:
        logger.warning(f"Could not find source element to clone: {source_id}")
        return False

    # Create element dict for inject_new_shape
    new_element_dict = {
        "id": new_id,
        "text": new_text,
        "position": position,
        "size": size,
        "layout": layout
    }

    # Use inject_new_shape logic but with the cloned shape as reference
    # For now, just use inject_new_shape which will find a similar placeholder type
    return inject_new_shape(sp_tree, new_element_dict)


def duplicate_slide(temp_dir: str, source_slide_index: int, new_slide_index: int) -> bool:
    """
    Duplicate an existing slide to create a new one.

    Args:
        temp_dir: Path to extracted PPTX directory
        source_slide_index: 1-based index of slide to copy
        new_slide_index: 1-based index of new slide to create

    Returns:
        True if successful
    """
    try:
        # 1. Copy slide XML
        source_path = os.path.join(temp_dir, "ppt", "slides", f"slide{source_slide_index}.xml")
        dest_path = os.path.join(temp_dir, "ppt", "slides", f"slide{new_slide_index}.xml")
        shutil.copy2(source_path, dest_path)

        # 2. Copy slide relationships if they exist
        source_rels = os.path.join(temp_dir, "ppt", "slides", "_rels", f"slide{source_slide_index}.xml.rels")
        if os.path.exists(source_rels):
            dest_rels_dir = os.path.join(temp_dir, "ppt", "slides", "_rels")
            os.makedirs(dest_rels_dir, exist_ok=True)
            dest_rels = os.path.join(dest_rels_dir, f"slide{new_slide_index}.xml.rels")
            shutil.copy2(source_rels, dest_rels)

        # 3. Update [Content_Types].xml
        ct_path = os.path.join(temp_dir, "[Content_Types].xml")
        ct_tree = etree.parse(ct_path)
        ct_root = ct_tree.getroot()

        # Add Override for new slide
        ns_ct = "http://schemas.openxmlformats.org/package/2006/content-types"
        override = etree.SubElement(ct_root, f"{{{ns_ct}}}Override")
        override.set("PartName", f"/ppt/slides/slide{new_slide_index}.xml")
        override.set("ContentType", "application/vnd.openxmlformats-officedocument.presentationml.slide+xml")

        ct_tree.write(ct_path, encoding="UTF-8", xml_declaration=True)

        # 4. Update presentation.xml and its rels

        # 4a. Update _rels/presentation.xml.rels
        pres_rels_path = os.path.join(temp_dir, "ppt", "_rels", "presentation.xml.rels")
        pres_rels_tree = etree.parse(pres_rels_path)
        pres_rels_root = pres_rels_tree.getroot()

        # Find max rId
        max_rid = 0
        for rel in pres_rels_root.findall(".//{*}Relationship"):
            rid = rel.get("Id")
            if rid and rid.startswith("rId"):
                try:
                    val = int(rid[3:])
                    max_rid = max(max_rid, val)
                except:
                    pass

        new_rid = f"rId{max_rid + 1}"

        # Add Relationship
        ns_rel = "http://schemas.openxmlformats.org/package/2006/relationships"
        rel = etree.SubElement(pres_rels_root, f"{{{ns_rel}}}Relationship")
        rel.set("Id", new_rid)
        rel.set("Type", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide")
        rel.set("Target", f"slides/slide{new_slide_index}.xml")

        pres_rels_tree.write(pres_rels_path, encoding="UTF-8", xml_declaration=True)

        # 4b. Update presentation.xml
        pres_path = os.path.join(temp_dir, "ppt", "presentation.xml")
        pres_tree = etree.parse(pres_path)
        pres_root = pres_tree.getroot()

        sld_id_lst = pres_root.find(".//p:sldIdLst", NS)
        if sld_id_lst is None:
            return False

        # Find max slide ID
        max_id = 255
        for sld_id in sld_id_lst.findall("p:sldId", NS):
            sid = sld_id.get("id")
            if sid:
                try:
                    max_id = max(max_id, int(sid))
                except:
                    pass

        new_id = str(max_id + 1)

        # Add sldId
        new_sld_id = etree.SubElement(sld_id_lst, f"{{{NS['p']}}}sldId")
        new_sld_id.set("id", new_id)
        new_sld_id.set(f"{{{NS['r']}}}id", new_rid)

        pres_tree.write(pres_path, encoding="UTF-8", xml_declaration=True)

        return True

    except Exception as e:
        logger.error(f"Error duplicating slide: {e}", exc_info=True)
        return False


def remove_slide(temp_dir: str, slide_number: int) -> bool:
    """
    Remove a slide from the presentation.
    """
    try:
        # 1. Find the rId for this slide in presentation.xml.rels
        pres_rels_path = os.path.join(temp_dir, "ppt", "_rels", "presentation.xml.rels")
        pres_rels_tree = etree.parse(pres_rels_path)
        pres_rels_root = pres_rels_tree.getroot()
        
        target_file = f"slides/slide{slide_number}.xml"
        rid = None
        
        for rel in pres_rels_root.findall(".//{*}Relationship"):
            if rel.get("Target") == target_file:
                rid = rel.get("Id")
                pres_rels_root.remove(rel) # Remove the relationship
                break
                
        if not rid:
            logger.warning(f"Could not find relationship for slide {slide_number}")
            return False
            
        pres_rels_tree.write(pres_rels_path, encoding="UTF-8", xml_declaration=True)

        # 2. Remove sldId from presentation.xml
        pres_path = os.path.join(temp_dir, "ppt", "presentation.xml")
        pres_tree = etree.parse(pres_path)
        pres_root = pres_tree.getroot()
        
        sld_id_lst = pres_root.find(".//p:sldIdLst", NS)
        if sld_id_lst is not None:
            for sld_id in sld_id_lst.findall("p:sldId", NS):
                if sld_id.get(f"{{{NS['r']}}}id") == rid:
                    sld_id_lst.remove(sld_id)
                    pres_tree.write(pres_path, encoding="UTF-8", xml_declaration=True)
                    
                    # 3. Remove slide XML and rels files
                    slide_xml_path = os.path.join(temp_dir, "ppt", "slides", f"slide{slide_number}.xml")
                    if os.path.exists(slide_xml_path):
                        os.remove(slide_xml_path)
                    
                    slide_rels_path = os.path.join(temp_dir, "ppt", "slides", "_rels", f"slide{slide_number}.xml.rels")
                    if os.path.exists(slide_rels_path):
                        os.remove(slide_rels_path)

                    # 4. Update [Content_Types].xml
                    ct_path = os.path.join(temp_dir, "[Content_Types].xml")
                    ct_tree = etree.parse(ct_path)
                    ct_root = ct_tree.getroot()
                    
                    ns_ct = "http://schemas.openxmlformats.org/package/2006/content-types"
                    for override in ct_root.findall(f"{{{ns_ct}}}Override"):
                        if override.get("PartName") == f"/ppt/slides/slide{slide_number}.xml":
                            ct_root.remove(override)
                            break
                    ct_tree.write(ct_path, encoding="UTF-8", xml_declaration=True)

                    return True
                    
        return False
    except Exception as e:
        logger.error(f"Error removing slide: {e}")
        return False


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

        # Handle flexible mode with variable slide counts
        # Match rewritten slides to original slides by slideNumber
        # If there are more rewritten slides than original slides, skip the extras
        # If there are fewer rewritten slides, only process the matched ones

        with zipfile.ZipFile(original_pptx_path, 'r') as zipf:
            processed_count = 0
            skipped_new_slides = 0

            for rewritten_slide in rewritten_slides:
                slide_number = rewritten_slide.get("slideNumber")
                is_new_slide = rewritten_slide.get("isNew", False)
                should_remove = rewritten_slide.get("remove", False)

                if should_remove:
                    logger.info(f"Removing slide {slide_number}")
                    remove_slide(temp_dir, slide_number)
                    continue

                # Handle new slides
                if is_new_slide or slide_number > len(slide_files):
                    logger.info(f"Detected new slide request: {slide_number}")

                    # If it's a new slide, we need to create it
                    if slide_files:
                        # Use the last slide as template
                        last_slide_file = slide_files[-1]
                        last_slide_num = int(last_slide_file.replace("slide", "").replace(".xml", ""))

                        logger.info(f"Duplicating slide {last_slide_num} to create slide {slide_number}")
                        if duplicate_slide(temp_dir, last_slide_num, slide_number):
                            # Add to slide_files list so we can process it
                            new_slide_filename = f"slide{slide_number}.xml"
                            slide_files.append(new_slide_filename)
                            # Re-sort slide_files to ensure correct indexing for subsequent operations
                            slide_files = sorted(
                                [f for f in os.listdir(slides_dir) if f.startswith("slide") and f.endswith(".xml") and "Layout" not in f],
                                key=lambda x: int(x.replace("slide", "").replace(".xml", ""))
                            )
                        else:
                            logger.error(f"Failed to create new slide {slide_number}")
                            continue
                    else:
                        logger.error("No existing slides to duplicate!")
                        continue

                # Find corresponding slide file
                if slide_number <= len(slide_files):
                    # Ensure slide_files is up-to-date after potential additions/removals
                    current_slide_files = sorted(
                        [f for f in os.listdir(slides_dir) if f.startswith("slide") and f.endswith(".xml") and "Layout" not in f],
                        key=lambda x: int(x.replace("slide", "").replace(".xml", ""))
                    )
                    # Find the actual file name for the given slide_number
                    # This is more robust than relying on index if slides were removed
                    target_slide_file = f"slide{slide_number}.xml"
                    if target_slide_file in current_slide_files:
                        slide_file = target_slide_file
                    else:
                        logger.error(f"Slide file {target_slide_file} not found after processing. Skipping.")
                        continue
                else:
                    logger.error(f"Slide number {slide_number} out of range even after duplication attempt")
                    continue

                slide_path = f"ppt/slides/{slide_file}"
                elements = rewritten_slide.get("elements", [])
                new_elements = rewritten_slide.get("newElements", [])

                # Mark new elements with isNew flag for proper handling
                for new_el in new_elements:
                    new_el["isNew"] = True

                # Combine existing and new elements
                all_elements = elements + new_elements

                # Inject all elements
                modified_tree = inject_elements_into_slide(slide_path, zipf, all_elements, temp_dir)

                # Write modified slide back to temp directory
                output_slide_path = os.path.join(temp_dir, slide_path)
                with open(output_slide_path, 'wb') as f:
                    f.write(etree.tostring(modified_tree, xml_declaration=True, encoding='utf-8'))

                processed_count += 1
                logger.info(f"Injected content into slide {slide_file}")

            if skipped_new_slides > 0:
                logger.warning(
                    f"Flexible mode: Processed {processed_count}/{len(rewritten_slides)} slides "
                    f"(skipped {skipped_new_slides} new slides not in original PPTX)"
                )

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
