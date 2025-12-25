from __future__ import annotations

import base64
import logging
import os
import posixpath
import uuid
import zipfile
from typing import Any, Dict, List, Optional, Tuple

from lxml import etree

logger = logging.getLogger(__name__)

EMU_PER_INCH = 914400
DEFAULT_DPI = 96

NS = {
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def emu_to_px(emu: Optional[int], dpi: int = DEFAULT_DPI) -> int:
    """Convert EMU to pixels."""
    if emu is None:
        return 0
    return int(round(emu * dpi / EMU_PER_INCH))


def _read_xml(zipf: zipfile.ZipFile, path: str) -> etree._Element:
    return etree.fromstring(zipf.read(path))


def load_slide_xml(zipf: zipfile.ZipFile, path: str) -> etree._Element:
    """Public helper to load a slide XML part."""
    return _read_xml(zipf, path)


def _load_relationships(zipf: zipfile.ZipFile, rels_path: str) -> Dict[str, Dict[str, str]]:
    if rels_path not in zipf.namelist():
        logger.debug("rels file missing: %s", rels_path)
        return {}
    rels_tree = _read_xml(zipf, rels_path)
    rels: Dict[str, Dict[str, str]] = {}
    # Some .rels files declare a default namespace, others don't—match both.
    for rel in rels_tree.findall(".//{*}Relationship"):
        rid = rel.get("Id")
        if not rid:
            continue
        rels[rid] = {"target": rel.get("Target"), "type": rel.get("Type")}
    logger.debug("loaded %s relationships from %s", len(rels), rels_path)
    return rels


def _resolve_target(base_part: str, target: str) -> str:
    """Resolve a relationship target relative to a base OOXML part (not its .rels)."""
    if target.startswith("/"):
        return target.lstrip("/")
    base_dir = posixpath.dirname(base_part)
    return posixpath.normpath(posixpath.join(base_dir, target))


def _parse_theme_colors(theme_tree: etree._Element) -> Dict[str, str]:
    """Build a scheme color map from the theme file."""
    colors: Dict[str, str] = {}
    clr_scheme = theme_tree.find(".//a:clrScheme", NS)
    if clr_scheme is None:
        return colors
    for child in clr_scheme:
        name = child.get("name") or child.tag.split("}")[-1]
        srgb = child.find("a:srgbClr", NS)
        if srgb is not None and srgb.get("val"):
            colors[name] = f"#{srgb.get('val').upper()}"
    return colors


def _resolve_scheme_color(val: Optional[str], theme_colors: Dict[str, str]) -> Optional[str]:
    if not val:
        return None
    if val in theme_colors:
        return theme_colors[val]
    return None


def _parse_color(color_el: Optional[etree._Element], theme_colors: Dict[str, str]) -> Tuple[Optional[str], Optional[float]]:
    """Return (hex color, opacity) from any color node or its children."""
    if color_el is None:
        return None, None

    def _alpha(node: etree._Element) -> Optional[float]:
        alpha_el = node.find("a:alpha", NS)
        return float(alpha_el.get("val")) / 100000 if alpha_el is not None and alpha_el.get("val") else None

    # direct node handlers
    local = etree.QName(color_el).localname
    if local == "srgbClr":
        hex_val = color_el.get("val")
        return (f"#{hex_val.upper()}" if hex_val else None, _alpha(color_el))
    if local == "schemeClr":
        base = _resolve_scheme_color(color_el.get("val"), theme_colors)
        return base, _alpha(color_el)
    if local == "scrgbClr":
        try:
            r = int(color_el.get("r", "0"))
            g = int(color_el.get("g", "0"))
            b = int(color_el.get("b", "0"))
            return (
                "#{:02X}{:02X}{:02X}".format(int(r * 255 / 100000), int(g * 255 / 100000), int(b * 255 / 100000)),
                _alpha(color_el),
            )
        except Exception:
            return None, _alpha(color_el)
    # some files put color under child nodes of solidFill/ln
    srgb = color_el.find("a:srgbClr", NS)
    if srgb is not None:
        return _parse_color(srgb, theme_colors)
    scheme = color_el.find("a:schemeClr", NS)
    if scheme is not None:
        return _parse_color(scheme, theme_colors)
    scrgb = color_el.find("a:scrgbClr", NS)
    if scrgb is not None:
        return _parse_color(scrgb, theme_colors)
    
    # Log unhandled color type if it's not None
    if color_el is not None:
        logger.debug(f"Unhandled color element: {etree.QName(color_el).localname}")
        
    return None, None


def extract_fill(
    fill_el: Optional[etree._Element],
    rels: Dict[str, Dict[str, str]],
    zipf: Optional[zipfile.ZipFile],
    part_path: str,
    asset_output_dir: str,
    asset_url_prefix: str,
    slide_index: int,
    element_index: int,
    theme_colors: Dict[str, str],
) -> Optional[Dict[str, Any]]:
    """Parse solid/gradient/blip fills into JSON."""
    if fill_el is None:
        return None

    solid = fill_el.find("a:solidFill", NS)
    if solid is not None:
        color_el = next(iter(solid), None)
        color, opacity = _parse_color(color_el, theme_colors)
        return {"type": "solid", "color": color, "opacity": opacity if opacity is not None else 1}

    grad = fill_el.find("a:gradFill", NS)
    if grad is not None:
        stops = []
        for gs in grad.findall("a:gsLst/a:gs", NS):
            pos = float(gs.get("pos", "0")) / 100000
            color, opacity = _parse_color(next(iter(gs), None), theme_colors)
            stops.append({"color": color, "offset": pos, "opacity": opacity if opacity is not None else 1})
        angle_el = grad.find("a:lin", NS)
        angle = float(angle_el.get("ang")) / 60000 if angle_el is not None and angle_el.get("ang") else 0
        return {"type": "gradient", "angle": angle, "stops": stops}

    # a:blipFill or p:blipFill
    blip = fill_el if etree.QName(fill_el).localname == "blipFill" else fill_el.find("a:blipFill", NS)
    if blip is not None:
        blip_el = blip.find("a:blip", NS)
        rid = blip_el.get(f"{{{NS['r']}}}embed") if blip_el is not None else None
        
        if rid:
            if rid in rels and zipf is not None:
                target = _resolve_target(part_path, rels[rid]["target"])
                target_path = target if target.startswith("ppt/") else f"ppt/{rel_target_strip(rels[rid]['target'])}"
                
                if target_path in zipf.namelist():
                    data = zipf.read(target_path)
                    ext = os.path.splitext(target_path)[1] or ".png"
                    filename = f"slide_{slide_index}_el_{element_index}{ext}"
                    os.makedirs(asset_output_dir, exist_ok=True)
                    with open(os.path.join(asset_output_dir, filename), "wb") as fp:
                        fp.write(data)
                    return {
                        "type": "image",
                        "image": {
                            "embed": rid,
                            "src": f"{asset_url_prefix}/{filename}",
                            "base64": f"data:image/{ext.lstrip('.').lower()};base64,{base64.b64encode(data).decode()}",
                        },
                    }
                else:
                    logger.warning(f"Image target not found in zip: {target_path}")
            else:
                logger.warning(f"Image relationship ID {rid} not found in rels")
        else:
            logger.debug("Blip fill found but no embed ID")
            
    return None


def rel_target_strip(target: str) -> str:
    """Strip ../ from rel targets for clean joining."""
    return target.lstrip("./").replace("../", "")


def extract_line(ln_el: Optional[etree._Element], theme_colors: Dict[str, str]) -> Optional[Dict[str, Any]]:
    if ln_el is None:
        return None
    width_emus = ln_el.get("w")
    width = emu_to_px(int(width_emus)) if width_emus else 0
    dash = ln_el.get("cmpd") or ln_el.get("cap")
    color, opacity = _parse_color(ln_el.find("a:solidFill", NS), theme_colors)
    return {"width": width or 1, "color": color, "dash": dash, "opacity": opacity if opacity is not None else 1}


def extract_text(tx_body: Optional[etree._Element], theme_colors: Dict[str, str]) -> Tuple[List[Dict[str, Any]], Optional[str], Optional[str], Optional[str], str]:
    """Extract paragraph runs into a flat list of spans with formatting."""
    runs: List[Dict[str, Any]] = []
    align: Optional[str] = None
    vertical_align: Optional[str] = None
    bullet: Optional[str] = None
    wrap: str = "square"

    if tx_body is None:
        return runs, align, vertical_align, bullet, wrap

    body_pr = tx_body.find("a:bodyPr", NS)
    if body_pr is not None:
        vertical_align = body_pr.get("anchor")
        if body_pr.get("wrap") == "none":
            wrap = "none"

    for para in tx_body.findall("a:p", NS):
        ppr = para.find("a:pPr", NS)
        
        # Parse default run properties (defRPr)
        def_font = None
        def_size = None
        def_bold = None
        def_italic = None
        def_underline = None
        def_color = None
        def_opacity = None

        if ppr is not None:
            align_val = ppr.get("algn")
            align = align or {
                "ctr": "center",
                "r": "right",
                "just": "justify",
            }.get(align_val, "left")
            if ppr.find("a:buNone", NS) is not None:
                bullet = "none"
            elif ppr.find("a:buAutoNum", NS) is not None:
                bullet = "number"
            elif ppr.find("a:buChar", NS) is not None:
                bullet = "bullet"

            def_rpr = ppr.find("a:defRPr", NS)
            if def_rpr is not None:
                def_font = def_rpr.find("a:latin", NS).get("typeface") if def_rpr.find("a:latin", NS) is not None else None
                def_size = float(def_rpr.get("sz")) / 100 if def_rpr.get("sz") else None
                def_bold = bool(def_rpr.get("b") == "1")
                def_italic = bool(def_rpr.get("i") == "1")
                def_underline = bool(def_rpr.get("u") and def_rpr.get("u") != "none")
                def_color, def_opacity = _parse_color(def_rpr.find("a:solidFill", NS), theme_colors)

        for run in para.findall("a:r", NS):
            rpr = run.find("a:rPr", NS)
            
            # Run properties override default properties
            font_family = (rpr.find("a:latin", NS).get("typeface") if rpr is not None and rpr.find("a:latin", NS) is not None else None) or def_font
            font_size = (float(rpr.get("sz")) / 100 if rpr is not None and rpr.get("sz") else None) or def_size
            
            is_bold = (bool(rpr.get("b") == "1") if rpr is not None and rpr.get("b") is not None else None)
            if is_bold is None:
                is_bold = def_bold if def_bold is not None else False
            
            is_italic = (bool(rpr.get("i") == "1") if rpr is not None and rpr.get("i") is not None else None)
            if is_italic is None:
                is_italic = def_italic if def_italic is not None else False
                
            is_underline = (bool(rpr.get("u") and rpr.get("u") != "none") if rpr is not None and rpr.get("u") is not None else None)
            if is_underline is None:
                is_underline = def_underline if def_underline is not None else False

            color, opacity = _parse_color(rpr.find("a:solidFill", NS) if rpr is not None else None, theme_colors)
            if color is None:
                color = def_color
                opacity = def_opacity

            runs.append(
                {
                    "text": "".join(t.text or "" for t in run.findall("a:t", NS)),
                    "font": font_family,
                    "size": font_size,
                    "color": color,
                    "bold": is_bold,
                    "italic": is_italic,
                    "underline": is_underline,
                    "opacity": opacity if opacity is not None else 1,
                }
            )

        # also handle <a:fld> or plain text in <a:t> under <a:p>
        if not para.findall("a:r", NS):
            text_val = "".join(t.text or "" for t in para.findall("a:t", NS))
            if text_val:
                runs.append({
                    "text": text_val, 
                    "font": def_font, 
                    "size": def_size, 
                    "color": def_color, 
                    "bold": def_bold if def_bold is not None else False, 
                    "italic": def_italic if def_italic is not None else False, 
                    "underline": def_underline if def_underline is not None else False,
                    "opacity": def_opacity if def_opacity is not None else 1
                })

    return runs, align, vertical_align, bullet, wrap


def extract_background(
    node: Optional[etree._Element],
    theme_colors: Dict[str, str],
    rels: Dict[str, Dict[str, str]],
    zipf: Optional[zipfile.ZipFile],
    part_path: str,
    asset_output_dir: str,
    asset_url_prefix: str,
    slide_index: int,
) -> Optional[Dict[str, Any]]:
    """Extract a background fill (solid/gradient/image) from slide/layout/master."""
    if node is None:
        return None
    bg_pr = node.find("p:bgPr", NS)
    if bg_pr is None:
        return None
    fill = (
        extract_fill(bg_pr, rels, zipf, part_path, asset_output_dir, asset_url_prefix, slide_index, -1, theme_colors)
        if bg_pr is not None
        else None
    )
    return fill


def _shape_common(xfrm: Optional[etree._Element]) -> Dict[str, Any]:
    if xfrm is None:
        return {
            "x": 0,
            "y": 0,
            "width": 0,
            "height": 0,
            "rotation": 0,
        }
    off = xfrm.find("a:off", NS)
    ext = xfrm.find("a:ext", NS)
    rot_raw = xfrm.get("rot")
    return {
        "x": emu_to_px(int(off.get("x"))) if off is not None and off.get("x") else 0,
        "y": emu_to_px(int(off.get("y"))) if off is not None and off.get("y") else 0,
        "width": emu_to_px(int(ext.get("cx"))) if ext is not None and ext.get("cx") else 0,
        "height": emu_to_px(int(ext.get("cy"))) if ext is not None and ext.get("cy") else 0,
        "rotation": float(rot_raw) / 60000 if rot_raw else 0,
    }


def extract_image(
    pic_el: etree._Element,
    rels: Dict[str, Dict[str, str]],
    zipf: zipfile.ZipFile,
    part_path: str,
    asset_output_dir: str,
    asset_url_prefix: str,
    slide_index: int,
    z_index: int,
    theme_colors: Dict[str, str],
) -> Dict[str, Any]:
    nv_pr = pic_el.find("p:nvPicPr/p:nvPr/p:ph", NS)
    placeholder = nv_pr.get("type") if nv_pr is not None else "none"
    placeholder_idx = nv_pr.get("idx") if nv_pr is not None else None

    xfrm = pic_el.find("p:spPr/a:xfrm", NS)
    geom = _shape_common(xfrm)

    fill = pic_el.find("p:blipFill", NS)
    image_fill = extract_fill(
        fill, rels, zipf, part_path, asset_output_dir, asset_url_prefix, slide_index, z_index, theme_colors
    )
    src = image_fill.get("image", {}).get("src") if image_fill else None
    base64_img = image_fill.get("image", {}).get("base64") if image_fill else None

    return {
        "type": "image",
        "placeholder": placeholder or "none",
        "placeholderIdx": placeholder_idx,
        "x": geom["x"],
        "y": geom["y"],
        "width": geom["width"],
        "height": geom["height"],
        "rotation": geom["rotation"],
        "zIndex": z_index,
        "opacity": 1,
        "fill": None,
        "border": None,
        "shapeType": None,
        "text": [],
        "image": {"embed": None, "src": src, "base64": base64_img},
    }


def extract_shape(
    sp_el: etree._Element,
    rels: Dict[str, Dict[str, str]],
    zipf: zipfile.ZipFile,
    part_path: str,
    asset_output_dir: str,
    asset_url_prefix: str,
    slide_index: int,
    z_index: int,
    theme_colors: Dict[str, str],
) -> Dict[str, Any]:
    tag_name = etree.QName(sp_el.tag).localname
    if tag_name == "pic":
        return extract_image(sp_el, rels, zipf, part_path, asset_output_dir, asset_url_prefix, slide_index, z_index, theme_colors)

    nv_pr = sp_el.find("p:nvSpPr/p:nvPr/p:ph", NS)
    placeholder = nv_pr.get("type") if nv_pr is not None else "none"
    placeholder_idx = nv_pr.get("idx") if nv_pr is not None else None

    xfrm = sp_el.find("p:spPr/a:xfrm", NS)
    geom = _shape_common(xfrm)

    sp_pr = sp_el.find("p:spPr", NS)
    fill = (
        extract_fill(sp_pr, rels, zipf, part_path, asset_output_dir, asset_url_prefix, slide_index, z_index, theme_colors)
        if sp_pr is not None
        else None
    )
    border = extract_line(sp_pr.find("a:ln", NS), theme_colors) if sp_pr is not None else None
    prst = sp_pr.find("a:prstGeom", NS) if sp_pr is not None else None
    shape_type = prst.get("prst") if prst is not None else "custom"

    tx_body = sp_el.find("p:txBody", NS)
    text_runs, align, v_align, bullet, wrap = extract_text(tx_body, theme_colors)

    element_type = "text" if text_runs else "shape"

    # Theme style refs (fillRef/lnRef) fallback when explicit fill/line missing
    style_el = sp_el.find("p:style", NS)
    if style_el is not None:
        if fill is None:
            scheme = style_el.find("a:fillRef/a:schemeClr", NS)
            if scheme is not None:
                color, opacity = _parse_color(scheme, theme_colors)
                if color:
                    fill = {"type": "solid", "color": color, "opacity": opacity if opacity is not None else 1}
        if border is None:
            scheme = style_el.find("a:lnRef/a:schemeClr", NS)
            if scheme is not None:
                color, opacity = _parse_color(scheme, theme_colors)
                if color:
                    border = {"width": 1, "color": color, "dash": None, "opacity": opacity if opacity is not None else 1}

    return {
        "type": element_type,
        "placeholder": placeholder or "none",
        "placeholderIdx": placeholder_idx,
        "x": geom["x"],
        "y": geom["y"],
        "width": geom["width"],
        "height": geom["height"],
        "rotation": geom["rotation"],
        "zIndex": z_index,
        "fill": fill,
        "border": border,
        "opacity": fill.get("opacity") if fill and "opacity" in fill else 1,
        "shapeType": shape_type,
        "text": text_runs,
        "align": align,
        "verticalAlign": v_align,
        "bullet": bullet,
        "wrap": wrap,
        "image": None,
    }


def merge_elements(top_elements: List[Dict[str, Any]], bottom_elements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Merge top layer elements (e.g. Slide) over bottom layer elements (e.g. Layout).
    Matches elements by placeholder type and index.
    Inherits properties like text color from bottom layer if missing in top layer.
    """
    merged: Dict[Tuple[str, Optional[str]], Dict[str, Any]] = {}
    non_placeholders: List[Dict[str, Any]] = []
    
    # Start with bottom elements
    for el in bottom_elements:
        if el.get("placeholder") == "none":
            non_placeholders.append(el)
        else:
            key = (el.get("placeholder"), el.get("placeholderIdx"))
            merged[key] = el

    # Overlay top elements
    for el in top_elements:
        if el.get("placeholder") == "none":
            non_placeholders.append(el)
            continue

        key = (el.get("placeholder"), el.get("placeholderIdx"))
        if key in merged:
            base = merged[key]
            
            # Merge text runs to inherit properties
            slide_text = el.get("text")
            base_text = base.get("text")
            
            if slide_text and base_text:
                # If top has text but missing properties, try to inherit from first run of base
                base_run = base_text[0]
                for run in slide_text:
                    if not run.get("color"):
                        if base_run.get("color"):
                            # logger.debug(f"Inheriting color {base_run.get('color')} from base")
                            pass
                        run["color"] = base_run.get("color")
                    if not run.get("font"):
                        run["font"] = base_run.get("font")
                    if not run.get("size"):
                        run["size"] = base_run.get("size")
                    if run.get("bold") is None: 
                        run["bold"] = base_run.get("bold")
                    if run.get("italic") is None:
                        run["italic"] = base_run.get("italic")
                    if run.get("underline") is None:
                        run["underline"] = base_run.get("underline")

            merged[key] = {
                **base,
                **{
                    # prefer top geometry if non-zero, else keep bottom
                    "x": el["x"] or base.get("x", 0),
                    "y": el["y"] or base.get("y", 0),
                    "width": el["width"] or base.get("width", 0),
                    "height": el["height"] or base.get("height", 0),
                    "rotation": el.get("rotation") if el.get("rotation") is not None else base.get("rotation"),
                    "fill": el.get("fill") or base.get("fill"),
                    "border": el.get("border") or base.get("border"),
                    "opacity": el.get("opacity") or base.get("opacity"),
                    "shapeType": el.get("shapeType") or base.get("shapeType"),
                    "text": slide_text or base_text,
                    "wrap": el.get("wrap") or base.get("wrap"),
                },
            }
        else:
            merged[key] = el

    return non_placeholders + list(merged.values())


def extract_slide_details(
    slide_tree: etree._Element,
    slide_rels: Dict[str, Any],
    layout_tree: Optional[etree._Element],
    layout_rels: Dict[str, Any],
    master_tree: Optional[etree._Element],
    master_rels: Dict[str, Any],
    zipf: zipfile.ZipFile,
    slide_path: str,
    layout_path: Optional[str],
    master_path: Optional[str],
    asset_output_dir: str,
    asset_url_prefix: str,
    slide_index: int,
    theme_colors: Dict[str, str],
    width_px: int,
    height_px: int,
) -> Dict[str, Any]:
    background = (
        extract_background(
            slide_tree.find("p:bg", NS),
            theme_colors,
            slide_rels,
            zipf,
            slide_path,
            asset_output_dir,
            asset_url_prefix,
            slide_index,
        )
        or extract_background(
            layout_tree.find("p:bg", NS) if layout_tree is not None else None,
            theme_colors,
            layout_rels,
            zipf,
            layout_path or slide_path,
            asset_output_dir,
            asset_url_prefix,
            slide_index,
        )
        or extract_background(
            master_tree.find("p:bg", NS) if master_tree is not None else None,
            theme_colors,
            master_rels,
            zipf,
            master_path or slide_path,
            asset_output_dir,
            asset_url_prefix,
            slide_index,
        )
    )

    def parse_sp_tree(sp_tree: Optional[etree._Element], rels: Dict[str, Dict[str, str]], part_path: str, z_offset: int = 0):
        elems: List[Dict[str, Any]] = []
        if sp_tree is None:
            return elems
        for z_index, child in enumerate(sp_tree):
            local = etree.QName(child.tag).localname
            if local in ("sp", "pic"):
                elems.append(
                    extract_shape(
                        child,
                        rels,
                        zipf,
                        part_path,
                        asset_output_dir,
                        asset_url_prefix,
                        slide_index,
                        z_offset + z_index,
                        theme_colors,
                    )
                )
            elif local == "grpSp":
                # Recursively extract group shapes
                grp_sp_pr = child.find("p:grpSpPr", NS)
                # Recurse
                group_elems = parse_sp_tree(child, rels, part_path, z_offset + z_index)
                elems.extend(group_elems)
        return elems

    master_sp_tree = master_tree.find("p:cSld/p:spTree", NS) if master_tree is not None else None
    master_elements = parse_sp_tree(master_sp_tree, master_rels, master_path or "", 0)

    layout_sp_tree = layout_tree.find("p:cSld/p:spTree", NS) if layout_tree is not None else None
    layout_elements = parse_sp_tree(layout_sp_tree, layout_rels, layout_path or slide_path, 0)

    merged_layout = merge_elements(layout_elements, master_elements)

    slide_elements = parse_sp_tree(slide_tree.find("p:cSld/p:spTree", NS), slide_rels, slide_path, 0)
    
    elements = merge_elements(slide_elements, merged_layout)

    fonts = list({run.get("font") for el in elements for run in (el.get("text") or []) if run.get("font")})
    logger.debug(
        "Slide %s parsed: %s elements (fills=%s, borders=%s)",
        slide_index,
        len(elements),
        sum(1 for e in elements if e.get("fill")),
        sum(1 for e in elements if e.get("border")),
    )

    return {
        "id": str(uuid.uuid4()),
        "index": slide_index,
        "width": width_px,
        "height": height_px,
        "background": background,
        "fonts": fonts,
        "elements": elements,
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def parse_pptx_to_layouts(pptx_path: str, asset_output_dir: str, asset_url_prefix: str) -> List[Dict[str, Any]]:
    """
    Parse a PPTX/POTX into deterministic layout JSON using raw OOXML (no python-pptx).

    JSON shape per slide:
    {
      "width": 960,
      "height": 540,
      "background": { "type": "solid|gradient|image", ... },
      "elements": [
        {
          "type": "shape|text|image",
          "placeholder": "title|body|none",
          "x": 0, "y": 0, "width": 0, "height": 0,
          "rotation": 0,
          "zIndex": 0,
          "fill": { ... },
          "border": { ... },
          "opacity": 1,
          "shapeType": "rect|ellipse|roundRect|custom",
          "text": [ { "text": "", "font": "", "size": 0, "color": "", "bold": false, "italic": false } ],
          "image": { "embed": "", "src": "", "base64": "" }
        }
      ]
    }
    """
    with zipfile.ZipFile(pptx_path, "r") as zipf:
        logger.info("Parsing pptx/potx: %s", pptx_path)
        pres_tree = _read_xml(zipf, "ppt/presentation.xml")
        pres_rels = _load_relationships(zipf, "ppt/_rels/presentation.xml.rels")

        # Slide size
        sld_sz = pres_tree.find(".//p:sldSz", NS)
        width_px = emu_to_px(int(sld_sz.get("cx"))) if sld_sz is not None and sld_sz.get("cx") else 960
        height_px = emu_to_px(int(sld_sz.get("cy"))) if sld_sz is not None and sld_sz.get("cy") else 540

        # Theme colors
        theme_colors: Dict[str, str] = {}
        for rel in pres_rels.values():
            if rel["type"].endswith("/theme"):
                theme_target = _resolve_target("ppt/presentation.xml", rel["target"])
                if theme_target not in zipf.namelist() and f"ppt/{rel_target_strip(rel['target'])}" in zipf.namelist():
                    theme_target = f"ppt/{rel_target_strip(rel['target'])}"
                if theme_target in zipf.namelist():
                    theme_colors = _parse_theme_colors(_read_xml(zipf, theme_target))
                    logger.debug("Loaded theme colors from %s (%s entries)", theme_target, len(theme_colors))
                break

        # Map slide order from presentation.xml rels
        slide_targets: List[str] = []
        for sld_id in pres_tree.findall(".//p:sldId", NS):
            rid = sld_id.get(f"{{{NS['r']}}}id")
            if rid and rid in pres_rels:
                target = pres_rels[rid]["target"]
                slide_path = _resolve_target("ppt/presentation.xml", target)
                if not slide_path.startswith("ppt/"):
                    slide_path = f"ppt/{rel_target_strip(target)}"
                slide_targets.append(slide_path)
            else:
                logger.warning("SlideId missing or unresolved rid: %s", rid)
        logger.info("Found %s slide targets: %s", len(slide_targets), slide_targets)

        layouts: List[Dict[str, Any]] = []
        for slide_index, slide_path in enumerate(slide_targets, start=1):
            rels_candidate = posixpath.join(posixpath.dirname(slide_path), "_rels", f"{posixpath.basename(slide_path)}.rels")
            slide_rels = _load_relationships(zipf, rels_candidate)
            if not slide_rels:
                logger.warning("No relationships for slide %s (%s)", slide_index, rels_candidate)

            layout_tree = None
            layout_rels: Dict[str, Dict[str, str]] = {}
            master_tree = None
            master_rels: Dict[str, Dict[str, str]] = {}
            layout_path = None
            master_path = None
            layout_rel = next((r for r in slide_rels.values() if r["type"].endswith("/slideLayout")), None)
            if layout_rel:
                layout_path = _resolve_target(slide_path, layout_rel["target"])
                layout_tree = _read_xml(zipf, layout_path)
                layout_rels = _load_relationships(
                    zipf, f"{posixpath.dirname(layout_path)}/_rels/{posixpath.basename(layout_path)}.rels"
                )
                logger.debug("Slide %s layout: %s", slide_index, layout_path)
                master_rel = next((r for r in layout_rels.values() if r["type"].endswith("/slideMaster")), None)
                if master_rel:
                    master_path = _resolve_target(layout_path, master_rel["target"])
                    master_tree = _read_xml(zipf, master_path)
                    master_rels = _load_relationships(
                        zipf, f"{posixpath.dirname(master_path)}/_rels/{posixpath.basename(master_path)}.rels"
                    )
                    logger.debug("Slide %s master: %s", slide_index, master_path)
            else:
                logger.warning("Slide %s missing layout relationship (rels: %s)", slide_index, rels_candidate)
                layout_tree = None
                layout_rels = {}
                master_tree = None
                master_rels = {}
                layout_path = None

            slide_tree = _read_xml(zipf, slide_path)
            layouts.append(
                extract_slide_details(
                    slide_tree,
                    slide_rels,
                    layout_tree,
                    layout_rels,
                    master_tree,
                    master_rels,
                    zipf,
                    slide_path,
                    layout_path,
                    master_path,
                    asset_output_dir,
                    asset_url_prefix,
                    slide_index,
                    theme_colors,
                    width_px,
                    height_px,
                )
            )

        logger.info("Extracted %s slides", len(layouts))
        return layouts


import html
import math
from typing import Any, Dict, List, Optional


def _style_to_string(style: Dict[str, Any]) -> str:
    return " ".join(f"{k}: {v};" for k, v in style.items() if v is not None)


def _color(val: Optional[str]) -> Optional[str]:
    return val or None


def _fill_styles(fill: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not fill:
        return {}
    kind = fill.get("type")
    if kind == "solid":
        styles = {"background": _color(fill.get("color"))}
        if fill.get("opacity") is not None:
            styles["opacity"] = fill.get("opacity")
        return styles
    if kind == "gradient":
        stops = fill.get("stops") or []
        angle = fill.get("angle", 0)
        if stops:
            stop_str = ", ".join(
                f"{_color(stop.get('color'))} {int(stop.get('offset',0)*100)}%" for stop in stops if stop.get("color")
            )
            return {"background": f"linear-gradient({angle}deg, {stop_str})"}
    if kind == "image":
        img = fill.get("image") or {}
        src = img.get("src") or img.get("base64")
        if src:
            return {
                "background-image": f"url('{src}')",
                "background-size": img.get("fill", "cover"),
                "background-repeat": "no-repeat",
                "background-position": "center",
            }
    return {}


def _border_styles(border: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not border:
        return {}
    width = border.get("width") or 0
    color = _color(border.get("color"))
    dash = border.get("dash")
    style = "dashed" if dash and dash != "solid" else "solid"
    return {"border": f"{width}px {style} {color}"} if color else {}


def _shadow(shadow: Optional[Dict[str, Any]]) -> Optional[str]:
    if not shadow:
        return None
    color = _color(shadow.get("color")) or "rgba(0,0,0,0.25)"
    blur = shadow.get("blur", 0)
    ox = shadow.get("offsetX", 0)
    oy = shadow.get("offsetY", 0)
    return f"{ox}px {oy}px {blur}px {color}"


def _base_style(el: Dict[str, Any]) -> Dict[str, Any]:
    style = {
        "position": "absolute",
        "left": f"{el.get('x',0)}px",
        "top": f"{el.get('y',0)}px",
        "width": f"{el.get('width',0)}px",
        "height": f"{el.get('height',0)}px",
        "z-index": el.get("zIndex", 0),
        "opacity": el.get("opacity", 1),
        "transform-origin": "center",
    }
    if el.get("rotation"):
        style["transform"] = f"rotate({el['rotation']}deg)"
    return style


def _render_text(el: Dict[str, Any]) -> str:
    style = _base_style(el)
    align = el.get("align") or "left"
    v_align = el.get("verticalAlign")
    style.update(
        {
            "text-align": align,
            "display": "flex",
            "flex-direction": "column",
            "justify-content": {
                "top": "flex-start",
                "ctr": "center",
                "center": "center",
                "b": "flex-end",
            }.get(v_align, "flex-start"),
        }
    )
    style.update(_fill_styles(el.get("fill")))
    style.update(_border_styles(el.get("border")))
    shadow_css = _shadow(el.get("shadow"))
    if shadow_css:
        style["text-shadow"] = shadow_css

    if el.get("wrap") == "none":
        style["white-space"] = "nowrap"
    else:
        style["white-space"] = "pre-wrap"  # Preserve newlines but wrap text

    text_runs = el.get("text") or []
    bullet = el.get("bullet")
    lines: List[str] = []
    if bullet and bullet != "none":
        for run in text_runs:
            lines.append(f"<div>{_span(run, bullet=bullet)}</div>")
    else:
        lines.append("".join(_span(run) for run in text_runs))
    return f'<div style="{_style_to_string(style)}">{"".join(lines)}</div>'


def _span(run: Dict[str, Any], bullet: Optional[str] = None) -> str:
    font_family = run.get("font")
    size = run.get("size")
    style = {
        "font-family": font_family,
        "font-size": f"{size}px" if size else None,
        "font-weight": 700 if run.get("bold") else 400,
        "font-style": "italic" if run.get("italic") else "normal",
        "color": _color(run.get("color")),
        "text-decoration": "underline" if run.get("underline") else None,
        "opacity": run.get("opacity"),
    }
    bullet_prefix = ""
    if bullet == "bullet":
        bullet_prefix = "• "
    elif bullet == "number":
        bullet_prefix = ""
    return f'<span style="{_style_to_string(style)}">{html.escape(bullet_prefix + (run.get("text") or ""))}</span>'


def _render_shape(el: Dict[str, Any]) -> str:
    style = _base_style(el)
    style.update(_fill_styles(el.get("fill")))
    style.update(_border_styles(el.get("border")))
    if el.get("shapeType") == "ellipse":
        style["border-radius"] = "9999px"
    shadow_css = _shadow(el.get("shadow"))
    if shadow_css:
        style["box-shadow"] = shadow_css
    return f'<div style="{_style_to_string(style)}"></div>'


def _render_image(el: Dict[str, Any]) -> str:
    style = _base_style(el)
    shadow_css = _shadow(el.get("shadow"))
    if shadow_css:
        style["box-shadow"] = shadow_css
    img = el.get("image") or {}
    src = img.get("src") or img.get("base64") or ""
    style["object-fit"] = img.get("fit", "cover")
    return f'<img src="{html.escape(src)}" style="{_style_to_string(style)}" />'


def _render_line(el: Dict[str, Any]) -> str:
    points = el.get("points") or []
    if len(points) < 2:
        return ""
    (x1, y1), (x2, y2) = points[0], points[1]
    dx = x2 - x1
    dy = y2 - y1
    length = math.hypot(dx, dy)
    angle = math.degrees(math.atan2(dy, dx))
    stroke = el.get("border") or {}
    style = {
        "position": "absolute",
        "left": f"{min(x1,x2)}px",
        "top": f"{min(y1,y2)}px",
        "width": f"{length}px",
        "height": "1px",
        "z-index": el.get("zIndex", 0),
        "transform": f"rotate({angle}deg)",
        "transform-origin": "0 0",
        "border-top": f"{stroke.get('width',1)}px solid {_color(stroke.get('color')) or '#000'}",
    }
    return f'<div style="{_style_to_string(style)}"></div>'


def render_slide(slide: Dict[str, Any]) -> str:
    """Render JSON slide into HTML."""
    width = slide.get("width") or slide.get("width_px") or 1280
    height = slide.get("height") or slide.get("height_px") or 720
    background = slide.get("background")

    container_style = {
        "position": "relative",
        "width": f"{width}px",
        "height": f"{height}px",
        "overflow": "hidden",
    }
    container_style.update(_fill_styles(background))

    elements_html: List[str] = []
    for el in sorted(slide.get("elements", []), key=lambda e: e.get("zIndex", 0)):
        kind = el.get("type")
        if kind == "text":
            elements_html.append(_render_text(el))
        elif kind == "image":
            elements_html.append(_render_image(el))
        elif kind == "line":
            elements_html.append(_render_line(el))
        else:
            elements_html.append(_render_shape(el))

    return f'<div style="{_style_to_string(container_style)}">{"".join(elements_html)}</div>'
