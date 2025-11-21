"""
Extract visual layout structure from PowerPoint slideLayout XML files.
This extracts ONLY the geometry, fills, and visual properties - NO CONTENT.
"""

import os
import zipfile
from typing import Any, Dict, List, Optional
import xml.etree.ElementTree as ET
from pptx.oxml.ns import qn


# EMU to pixel conversion
EMU_PER_INCH = 914400
DEFAULT_DPI = 96


def emu_to_px(emu: int, dpi: int = DEFAULT_DPI) -> int:
    """Convert EMU to pixels."""
    return int(round(emu * dpi / EMU_PER_INCH))


def _parse_xfrm(xfrm_elem) -> Dict[str, Any]:
    """Parse transform (position, size, rotation, flip)."""
    if xfrm_elem is None:
        return {}

    result = {}

    # Position (offset)
    off = xfrm_elem.find(qn('a:off'))
    if off is not None:
        result['x'] = emu_to_px(int(off.get('x', 0)))
        result['y'] = emu_to_px(int(off.get('y', 0)))

    # Size (extent)
    ext = xfrm_elem.find(qn('a:ext'))
    if ext is not None:
        result['width'] = emu_to_px(int(ext.get('cx', 0)))
        result['height'] = emu_to_px(int(ext.get('cy', 0)))

    # Rotation (in 1/60000th of a degree)
    rot = xfrm_elem.get('rot')
    if rot:
        result['rotation'] = int(rot) / 60000.0

    # Flip
    if xfrm_elem.get('flipH') == '1':
        result['flipH'] = True
    if xfrm_elem.get('flipV') == '1':
        result['flipV'] = True

    return result


def _parse_solid_fill(solid_fill_elem) -> Optional[Dict[str, Any]]:
    """Parse solidFill element."""
    if solid_fill_elem is None:
        return None

    # Try sRGB color
    srgb_clr = solid_fill_elem.find(qn('a:srgbClr'))
    if srgb_clr is not None:
        hex_color = '#' + srgb_clr.get('val', '000000').upper()
        return {"type": "solid", "color": hex_color}

    # Try scheme color (theme color reference)
    scheme_clr = solid_fill_elem.find(qn('a:schemeClr'))
    if scheme_clr is not None:
        theme_name = scheme_clr.get('val', 'unknown')
        # For now, return a placeholder - theme colors need to be resolved
        # TODO: Resolve theme colors from ppt/theme/themeX.xml
        return {"type": "theme", "theme": theme_name}

    return None


def _parse_grad_fill(grad_fill_elem) -> Optional[Dict[str, Any]]:
    """Parse gradFill element."""
    if grad_fill_elem is None:
        return None

    stops = []
    gs_list = grad_fill_elem.find(qn('a:gsLst'))
    if gs_list is not None:
        for gs in gs_list.findall(qn('a:gs')):
            pos = int(gs.get('pos', 0)) / 100000.0  # Convert to 0-1
            srgb_clr = gs.find(qn('a:srgbClr'))
            if srgb_clr is not None:
                color = '#' + srgb_clr.get('val', '000000').upper()
                stops.append({"offset": pos, "color": color})

    # Linear gradient angle
    lin = grad_fill_elem.find(qn('a:lin'))
    angle = 0
    if lin is not None:
        ang = int(lin.get('ang', 0))
        angle = ang / 60000.0  # Convert to degrees

    if stops:
        return {"type": "gradient", "stops": stops, "angle": angle}

    return None


def _parse_shape(sp_elem, z_index: int) -> Optional[Dict[str, Any]]:
    """Parse a shape element from slideLayout."""
    sp_pr = sp_elem.find(qn('p:spPr'))
    if sp_pr is None:
        return None

    # Transform (position, size, rotation, flip)
    xfrm = sp_pr.find(qn('a:xfrm'))
    bbox = _parse_xfrm(xfrm)

    if not bbox or bbox.get('width', 0) == 0 or bbox.get('height', 0) == 0:
        return None

    # Geometry (shape type)
    prst_geom = sp_pr.find(qn('a:prstGeom'))
    geom = prst_geom.get('prst', 'rect') if prst_geom is not None else 'rect'

    # Fill
    fill = None
    solid_fill = sp_pr.find(qn('a:solidFill'))
    if solid_fill is not None:
        fill = _parse_solid_fill(solid_fill)

    grad_fill = sp_pr.find(qn('a:gradFill'))
    if grad_fill is not None and fill is None:
        fill = _parse_grad_fill(grad_fill)

    # Stroke/line
    stroke = None
    ln = sp_pr.find(qn('a:ln'))
    if ln is not None:
        no_fill = ln.find(qn('a:noFill'))
        if no_fill is None:  # Has visible line
            solid_fill_ln = ln.find(qn('a:solidFill'))
            if solid_fill_ln is not None:
                stroke_fill = _parse_solid_fill(solid_fill_ln)
                if stroke_fill:
                    width = ln.get('w')
                    stroke = {
                        "color": stroke_fill.get("color"),
                        "width": emu_to_px(int(width)) if width else 1
                    }

    # Placeholder type (for semantic info, not rendered)
    nv_sp_pr = sp_elem.find(qn('p:nvSpPr'))
    placeholder_type = None
    if nv_sp_pr is not None:
        nv_pr = nv_sp_pr.find(qn('p:nvPr'))
        if nv_pr is not None:
            ph = nv_pr.find(qn('p:ph'))
            if ph is not None:
                placeholder_type = ph.get('type', 'content')

    return {
        "type": "shape",
        "geometry": geom,
        "bbox": bbox,
        "fill": fill,
        "stroke": stroke,
        "z": z_index,
        "placeholder_type": placeholder_type,
    }


def extract_layout_from_pptx(pptx_path: str, layout_index: int = 0) -> Dict[str, Any]:
    """
    Extract visual layout structure from a slideLayout XML file.
    Returns ONLY geometry and visual properties, NO CONTENT.

    Args:
        pptx_path: Path to PPTX file
        layout_index: Index of layout to extract (0-based)

    Returns:
        Dict with slide dimensions and shape elements
    """
    with zipfile.ZipFile(pptx_path, 'r') as zip_ref:
        # List all slideLayout files
        layout_files = [f for f in zip_ref.namelist() if f.startswith('ppt/slideLayouts/slideLayout') and f.endswith('.xml')]
        layout_files.sort()

        if layout_index >= len(layout_files):
            raise ValueError(f"Layout index {layout_index} out of range (found {len(layout_files)} layouts)")

        layout_file = layout_files[layout_index]

        # Parse the layout XML
        with zip_ref.open(layout_file) as f:
            tree = ET.parse(f)
            root = tree.getroot()

        # Get slide dimensions from presentation.xml
        with zip_ref.open('ppt/presentation.xml') as f:
            pres_tree = ET.parse(f)
            pres_root = pres_tree.getroot()
            sld_sz = pres_root.find('.//{http://schemas.openxmlformats.org/presentationml/2006/main}sldSz')
            width_px = emu_to_px(int(sld_sz.get('cx', 9144000)))  # Default 10" at 96dpi
            height_px = emu_to_px(int(sld_sz.get('cy', 6858000)))  # Default 7.5" at 96dpi

    # Parse shapes from layout
    shapes = []
    sp_tree = root.find('.//{http://schemas.openxmlformats.org/presentationml/2006/main}spTree')
    if sp_tree is not None:
        for z_index, sp_elem in enumerate(sp_tree.findall(qn('p:sp'))):
            shape = _parse_shape(sp_elem, z_index)
            if shape:
                shapes.append(shape)

    return {
        "width_px": width_px,
        "height_px": height_px,
        "shapes": shapes,
    }
