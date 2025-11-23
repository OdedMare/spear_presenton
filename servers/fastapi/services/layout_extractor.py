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

# EMU → px per MSO: 1px = 9525 EMU at 96 DPI
EMU_PER_PX = 9525
DEFAULT_DPI = 96

NS = {
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def emu_to_px(emu: Optional[int]) -> int:
    """Convert EMU to pixels (96 DPI) using 1px = 9525 EMU."""
    if emu is None:
        return 0
    return int(round(emu / EMU_PER_PX))


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
    """
    Build a scheme color map from the theme file.
    Extracts all named colors from the color scheme including:
    - dk1, lt1, dk2, lt2 (dark/light pairs)
    - accent1-6 (accent colors)
    - hlink, folHlink (hyperlink colors)
    """
    colors: Dict[str, str] = {}
    clr_scheme = theme_tree.find(".//a:clrScheme", NS)
    if clr_scheme is None:
        return colors

    for child in clr_scheme:
        # Get the color name from the tag (e.g., a:dk1 -> dk1)
        name = etree.QName(child.tag).localname

        # First try to find direct srgbClr
        srgb = child.find("a:srgbClr", NS)
        if srgb is not None and srgb.get("val"):
            colors[name] = srgb.get("val").upper()
            continue

        # Try sysClr (system color)
        sys_clr = child.find("a:sysClr", NS)
        if sys_clr is not None:
            # sysClr can have lastClr attribute with the actual color
            last_clr = sys_clr.get("lastClr")
            if last_clr:
                colors[name] = last_clr.upper()
            continue

        # Try schemeClr (reference to another scheme color)
        scheme = child.find("a:schemeClr", NS)
        if scheme is not None and scheme.get("val"):
            ref_name = scheme.get("val")
            # Store reference for later resolution
            colors[name] = ref_name
            continue

    # Resolve any scheme color references (second pass)
    resolved = {}
    for name, value in colors.items():
        if len(value) == 6 and all(c in "0123456789ABCDEF" for c in value):
            # Already a hex color
            resolved[name] = value
        elif value in colors:
            # It's a reference, try to resolve
            ref_value = colors[value]
            if len(ref_value) == 6 and all(c in "0123456789ABCDEF" for c in ref_value):
                resolved[name] = ref_value
            else:
                # Can't resolve, keep original
                resolved[name] = value
        else:
            resolved[name] = value

    return resolved


def _resolve_scheme_color(val: Optional[str], theme_colors: Dict[str, str]) -> Optional[str]:
    """
    Resolve a scheme color name to its hex value.
    Returns None only if val is None or not found in theme.
    """
    if not val:
        return None
    # Direct lookup
    if val in theme_colors:
        result = theme_colors[val]
        # Ensure it's uppercase hex
        if result and len(result) == 6:
            return result.upper()
    return None


def _parse_color(color_el: Optional[etree._Element], theme_colors: Dict[str, str]) -> Tuple[Optional[str], Optional[float]]:
    """
    Return (hex color, opacity) from any color node or its children.
    Supports srgbClr, schemeClr, scrgbClr, sysClr, prstClr.
    Handles alpha/opacity modifiers.
    """
    if color_el is None:
        return None, None

    def _get_color_transforms(node: etree._Element) -> Dict[str, float]:
        """
        Extract color transform modifiers (lumMod, lumOff, tint, shade, alpha).
        These are used extensively in PowerPoint to create color variations.
        """
        transforms = {}

        # Alpha (transparency)
        alpha_el = node.find("a:alpha", NS)
        if alpha_el is not None and alpha_el.get("val"):
            transforms["alpha"] = float(alpha_el.get("val")) / 100000

        # Luminance modulation (brightness multiplier)
        lum_mod = node.find("a:lumMod", NS)
        if lum_mod is not None and lum_mod.get("val"):
            transforms["lumMod"] = float(lum_mod.get("val")) / 100000

        # Luminance offset (brightness shift)
        lum_off = node.find("a:lumOff", NS)
        if lum_off is not None and lum_off.get("val"):
            transforms["lumOff"] = float(lum_off.get("val")) / 100000

        # Tint (mix with white)
        tint_el = node.find("a:tint", NS)
        if tint_el is not None and tint_el.get("val"):
            transforms["tint"] = float(tint_el.get("val")) / 100000

        # Shade (mix with black)
        shade_el = node.find("a:shade", NS)
        if shade_el is not None and shade_el.get("val"):
            transforms["shade"] = float(shade_el.get("val")) / 100000

        return transforms

    def _apply_color_transforms(hex_color: str, transforms: Dict[str, float]) -> Tuple[str, float]:
        """
        Apply PowerPoint color transforms to a hex color.
        Returns (transformed_hex, opacity).
        """
        if not hex_color or len(hex_color) != 6:
            return hex_color, transforms.get("alpha", 1.0)

        # Parse RGB
        r = int(hex_color[0:2], 16)
        g = int(hex_color[2:4], 16)
        b = int(hex_color[4:6], 16)

        # Apply luminance modulation and offset
        if "lumMod" in transforms or "lumOff" in transforms:
            lum_mod = transforms.get("lumMod", 1.0)
            lum_off = transforms.get("lumOff", 0.0)
            r = int(max(0, min(255, r * lum_mod + lum_off * 255)))
            g = int(max(0, min(255, g * lum_mod + lum_off * 255)))
            b = int(max(0, min(255, b * lum_mod + lum_off * 255)))

        # Apply tint (mix with white)
        if "tint" in transforms:
            tint = transforms["tint"]
            r = int(r + (255 - r) * (1 - tint))
            g = int(g + (255 - g) * (1 - tint))
            b = int(b + (255 - b) * (1 - tint))

        # Apply shade (mix with black)
        if "shade" in transforms:
            shade = transforms["shade"]
            r = int(r * shade)
            g = int(g * shade)
            b = int(b * shade)

        transformed = "{:02X}{:02X}{:02X}".format(r, g, b)
        opacity = transforms.get("alpha", 1.0)

        return transformed, opacity

    def _alpha(node: etree._Element) -> Optional[float]:
        """Extract alpha transparency from color modifiers (deprecated - use _get_color_transforms)."""
        alpha_el = node.find("a:alpha", NS)
        if alpha_el is not None and alpha_el.get("val"):
            return float(alpha_el.get("val")) / 100000
        return None

    local = etree.QName(color_el).localname

    # Get color transforms (lumMod, lumOff, tint, shade, alpha)
    transforms = _get_color_transforms(color_el)

    # Direct RGB color (hex format)
    if local == "srgbClr":
        hex_val = color_el.get("val")
        if hex_val:
            return _apply_color_transforms(hex_val.upper(), transforms)
        return None, transforms.get("alpha")

    # Scheme color reference (theme-based)
    if local == "schemeClr":
        base = _resolve_scheme_color(color_el.get("val"), theme_colors)
        if base:
            return _apply_color_transforms(base, transforms)
        return None, transforms.get("alpha")

    # RGB color in percentage format (0-100000 scale)
    if local == "scrgbClr":
        try:
            r = int(color_el.get("r", "0"))
            g = int(color_el.get("g", "0"))
            b = int(color_el.get("b", "0"))
            hex_color = "{:02X}{:02X}{:02X}".format(
                int(r * 255 / 100000),
                int(g * 255 / 100000),
                int(b * 255 / 100000)
            )
            return _apply_color_transforms(hex_color, transforms)
        except Exception:
            return None, transforms.get("alpha")

    # System color (e.g., windowText, window)
    if local == "sysClr":
        # Use lastClr if available, otherwise try to map system color name
        last_clr = color_el.get("lastClr")
        if last_clr:
            return _apply_color_transforms(last_clr.upper(), transforms)

        # Fallback to common system color mappings
        sys_val = color_el.get("val")
        sys_color_map = {
            "windowText": "000000",
            "window": "FFFFFF",
            "btnFace": "F0F0F0",
            "btnText": "000000",
        }
        if sys_val in sys_color_map:
            return _apply_color_transforms(sys_color_map[sys_val], transforms)
        return None, transforms.get("alpha")

    # Preset color (named colors like "black", "white")
    if local == "prstClr":
        prs_val = color_el.get("val")
        preset_color_map = {
            "black": "000000",
            "white": "FFFFFF",
            "red": "FF0000",
            "green": "00FF00",
            "blue": "0000FF",
            "yellow": "FFFF00",
            "cyan": "00FFFF",
            "magenta": "FF00FF",
        }
        if prs_val in preset_color_map:
            return _apply_color_transforms(preset_color_map[prs_val], transforms)
        return None, transforms.get("alpha")

    # Nested color elements (recursive search)
    for tag in ("a:srgbClr", "a:schemeClr", "a:scrgbClr", "a:sysClr", "a:prstClr"):
        child = color_el.find(tag, NS)
        if child is not None:
            return _parse_color(child, theme_colors)

    return None, None


def extract_fill(
    sp_pr: Optional[etree._Element],
    rels: Dict[str, Dict[str, str]],
    zipf: Optional[zipfile.ZipFile],
    part_path: str,
    asset_output_dir: str,
    asset_url_prefix: str,
    slide_index: int,
    element_index: int,
    theme_colors: Dict[str, str],
) -> Optional[Dict[str, Any]]:
    """
    Parse solid/gradient/blip fills from a shape properties node (spPr).
    Supports srgbClr, schemeClr, grad stops, and image fills.
    Handles all nested color elements and theme references.
    """
    if sp_pr is None:
        return None

    # Check for solidFill with nested color elements
    solid = sp_pr.find("a:solidFill", NS)
    if solid is not None:
        # Try to find any color element child
        color_el = None
        for child in solid:
            tag_name = etree.QName(child.tag).localname
            if tag_name in ("srgbClr", "schemeClr", "scrgbClr", "sysClr", "prstClr"):
                color_el = child
                break

        if color_el is not None:
            color, opacity = _parse_color(color_el, theme_colors)
            if color:
                return {"type": "solid", "color": f"#{color}", "opacity": opacity if opacity is not None else 1}

    # Check for gradient fill with multiple stops
    grad = sp_pr.find("a:gradFill", NS)
    if grad is not None:
        stops = []
        gs_list = grad.find("a:gsLst", NS)
        if gs_list is not None:
            for gs in gs_list.findall("a:gs", NS):
                pos = float(gs.get("pos", "0")) / 100000
                # Find color element in gradient stop
                color_el = None
                for child in gs:
                    tag_name = etree.QName(child.tag).localname
                    if tag_name in ("srgbClr", "schemeClr", "scrgbClr", "sysClr", "prstClr"):
                        color_el = child
                        break

                if color_el is not None:
                    color, opacity = _parse_color(color_el, theme_colors)
                    if color:
                        stops.append({"color": f"#{color}", "offset": pos, "opacity": opacity if opacity is not None else 1})

        if stops:
            angle_el = grad.find("a:lin", NS)
            angle = float(angle_el.get("ang")) / 60000 if angle_el is not None and angle_el.get("ang") else 0
            return {"type": "gradient", "angle": angle, "stops": stops}

    # Check for image/blip fill
    blip_fill = sp_pr.find("a:blipFill", NS)
    if blip_fill is not None:
        blip_el = blip_fill.find("a:blip", NS)
        rid = blip_el.get(f"{{{NS['r']}}}embed") if blip_el is not None else None
        if rid and rid in rels and zipf is not None:
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

    # Check for pattern fill
    patt_fill = sp_pr.find("a:pattFill", NS)
    if patt_fill is not None:
        patt_type = patt_fill.get("prst")  # Pattern type (dotted, cross, etc.)

        # Get foreground color
        fg_color_el = patt_fill.find("a:fgClr", NS)
        fg_color = None
        fg_opacity = None
        if fg_color_el is not None:
            for child in fg_color_el:
                tag_name = etree.QName(child.tag).localname
                if tag_name in ("srgbClr", "schemeClr", "scrgbClr", "sysClr", "prstClr"):
                    fg_color, fg_opacity = _parse_color(child, theme_colors)
                    break

        # Get background color
        bg_color_el = patt_fill.find("a:bgClr", NS)
        bg_color = None
        bg_opacity = None
        if bg_color_el is not None:
            for child in bg_color_el:
                tag_name = etree.QName(child.tag).localname
                if tag_name in ("srgbClr", "schemeClr", "scrgbClr", "sysClr", "prstClr"):
                    bg_color, bg_opacity = _parse_color(child, theme_colors)
                    break

        if fg_color or bg_color:
            return {
                "type": "pattern",
                "pattern": patt_type,
                "fgColor": f"#{fg_color}" if fg_color else None,
                "bgColor": f"#{bg_color}" if bg_color else None,
                "fgOpacity": fg_opacity if fg_opacity is not None else 1,
                "bgOpacity": bg_opacity if bg_opacity is not None else 1,
            }

    # Check for noFill
    no_fill = sp_pr.find("a:noFill", NS)
    if no_fill is not None:
        return {"type": "none"}

    return None


def rel_target_strip(target: str) -> str:
    """Strip ../ from rel targets for clean joining."""
    return target.lstrip("./").replace("../", "")


def extract_border(sp_pr: Optional[etree._Element], theme_colors: Dict[str, str]) -> Optional[Dict[str, Any]]:
    """
    Extract line/border from spPr <a:ln>.
    Handles solidFill, gradFill, and pattern fills within lines.
    Converts EMUs to pixels using 1px = 12700 EMU for line width.
    """
    if sp_pr is None:
        return None
    ln_el = sp_pr.find("a:ln", NS)
    if ln_el is None:
        return None

    # Extract line width
    width_emus = ln_el.get("w")
    width_px = int(int(width_emus) / 12700) if width_emus else 1  # 1px = 12700 EMU for line width

    # Extract line color from solidFill
    solid_fill = ln_el.find("a:solidFill", NS)
    if solid_fill is not None:
        # Find nested color element
        color_el = None
        for child in solid_fill:
            tag_name = etree.QName(child.tag).localname
            if tag_name in ("srgbClr", "schemeClr", "scrgbClr", "sysClr", "prstClr"):
                color_el = child
                break

        if color_el is not None:
            color, opacity = _parse_color(color_el, theme_colors)
            if color:
                # Extract dash style if present
                dash_el = ln_el.find("a:prstDash", NS)
                dash_style = dash_el.get("val") if dash_el is not None else None

                return {
                    "width": width_px,
                    "color": f"#{color}",
                    "opacity": opacity if opacity is not None else 1,
                    "dash": dash_style,
                }

    # Check for gradFill in line (less common but valid)
    grad_fill = ln_el.find("a:gradFill", NS)
    if grad_fill is not None:
        stops = []
        gs_list = grad_fill.find("a:gsLst", NS)
        if gs_list is not None:
            for gs in gs_list.findall("a:gs", NS):
                pos = float(gs.get("pos", "0")) / 100000
                color_el = None
                for child in gs:
                    tag_name = etree.QName(child.tag).localname
                    if tag_name in ("srgbClr", "schemeClr", "scrgbClr", "sysClr", "prstClr"):
                        color_el = child
                        break

                if color_el is not None:
                    color, opacity = _parse_color(color_el, theme_colors)
                    if color:
                        stops.append({"color": f"#{color}", "offset": pos, "opacity": opacity if opacity is not None else 1})

        if stops:
            # Use first stop color as primary border color
            return {
                "width": width_px,
                "color": stops[0]["color"],
                "opacity": stops[0]["opacity"],
                "gradient": stops,
            }

    # Check for noFill (invisible border)
    no_fill = ln_el.find("a:noFill", NS)
    if no_fill is not None:
        return {"width": 0, "color": "transparent", "opacity": 0}

    return None


def extract_shape_type(sp_pr: Optional[etree._Element]) -> str:
    """
    Extract shape geometry type from spPr.
    Returns preset geometry (rect, ellipse, roundRect, etc.) or 'custom' for path-based shapes.
    """
    if sp_pr is None:
        return "rect"

    # Check for preset geometry
    prst_geom = sp_pr.find("a:prstGeom", NS)
    if prst_geom is not None:
        shape_type = prst_geom.get("prst")
        if shape_type:
            return shape_type

    # Check for custom geometry (path-based)
    cust_geom = sp_pr.find("a:custGeom", NS)
    if cust_geom is not None:
        return "custom"

    # Default to rectangle if no geometry specified
    return "rect"


def extract_text(tx_body: Optional[etree._Element], theme_colors: Dict[str, str]) -> Tuple[List[Dict[str, Any]], Optional[str], Optional[str], Optional[str]]:
    """Extract paragraph runs into a flat list of spans with formatting."""
    runs: List[Dict[str, Any]] = []
    align: Optional[str] = None
    vertical_align: Optional[str] = None
    bullet: Optional[str] = None

    if tx_body is None:
        return runs, align, vertical_align, bullet

    body_pr = tx_body.find("a:bodyPr", NS)
    if body_pr is not None:
        vertical_align = body_pr.get("anchor")

    for para in tx_body.findall("a:p", NS):
        ppr = para.find("a:pPr", NS)
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

        for run in para.findall("a:r", NS):
            rpr = run.find("a:rPr", NS)
            font = {
                "family": rpr.find("a:latin", NS).get("typeface")
                if rpr is not None and rpr.find("a:latin", NS) is not None
                else None,
                "size": (float(rpr.get("sz")) / 100 if rpr is not None and rpr.get("sz") else None),
                "bold": bool(rpr.get("b") == "1") if rpr is not None else False,
                "italic": bool(rpr.get("i") == "1") if rpr is not None else False,
                "underline": bool(rpr.get("u") and rpr.get("u") != "none") if rpr is not None else False,
            }
            color, opacity = _parse_color(rpr.find("a:solidFill", NS) if rpr is not None else None, theme_colors)
            runs.append(
                {
                    "text": "".join(t.text or "" for t in run.findall("a:t", NS)),
                    "font": font.get("family"),
                    "size": font.get("size"),
                    "color": color,
                    "bold": font.get("bold"),
                    "italic": font.get("italic"),
                    "underline": font.get("underline"),
                    "opacity": opacity if opacity is not None else 1,
                }
            )

        # also handle <a:fld> or plain text in <a:t> under <a:p>
        if not para.findall("a:r", NS):
            text_val = "".join(t.text or "" for t in para.findall("a:t", NS))
            if text_val:
                runs.append({"text": text_val, "font": None, "size": None, "color": None, "bold": False, "italic": False, "underline": False})

    return runs, align, vertical_align, bullet


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
    """
    Extract a shape element (sp, pic, grpSp, graphicFrame, cxnSp).
    Returns complete shape data including geometry, fills, borders, text, and images.
    """
    tag_name = etree.QName(sp_el.tag).localname

    # Handle picture elements
    if tag_name == "pic":
        return extract_image(sp_el, rels, zipf, part_path, asset_output_dir, asset_url_prefix, slide_index, z_index, theme_colors)

    # Handle group shapes (recursively extract children)
    if tag_name == "grpSp":
        group_sp_tree = sp_el.find("p:grpSpPr", NS)
        xfrm = sp_el.find("p:grpSpPr/a:xfrm", NS)
        geom = _shape_common(xfrm)

        # Extract all child shapes in the group
        children = []
        for child_idx, child in enumerate(sp_el):
            child_tag = etree.QName(child.tag).localname
            if child_tag in ("sp", "pic", "grpSp", "graphicFrame", "cxnSp"):
                children.append(
                    extract_shape(child, rels, zipf, part_path, asset_output_dir, asset_url_prefix, slide_index, z_index + child_idx, theme_colors)
                )

        return {
            "type": "group",
            "placeholder": "none",
            "placeholderIdx": None,
            "x": geom["x"],
            "y": geom["y"],
            "width": geom["width"],
            "height": geom["height"],
            "rotation": geom["rotation"],
            "zIndex": z_index,
            "fill": None,
            "border": None,
            "opacity": 1,
            "shapeType": "group",
            "text": [],
            "children": children,
        }

    # Handle graphic frames (charts, tables, SmartArt)
    if tag_name == "graphicFrame":
        xfrm = sp_el.find("p:xfrm", NS)
        geom = _shape_common(xfrm)

        # Detect type (chart, table, or diagram)
        graphic_data = sp_el.find(".//a:graphicData", NS)
        uri = graphic_data.get("uri") if graphic_data is not None else None
        frame_type = "unknown"
        if uri:
            if "chart" in uri:
                frame_type = "chart"
            elif "table" in uri:
                frame_type = "table"
            elif "diagram" in uri or "smartArt" in uri:
                frame_type = "diagram"

        return {
            "type": "graphicFrame",
            "frameType": frame_type,
            "placeholder": "none",
            "placeholderIdx": None,
            "x": geom["x"],
            "y": geom["y"],
            "width": geom["width"],
            "height": geom["height"],
            "rotation": geom["rotation"],
            "zIndex": z_index,
            "fill": None,
            "border": None,
            "opacity": 1,
            "shapeType": frame_type,
            "text": [],
        }

    # Handle connector shapes (lines/arrows between shapes)
    if tag_name == "cxnSp":
        sp_pr = sp_el.find("p:spPr", NS)
        xfrm = sp_pr.find("a:xfrm", NS) if sp_pr is not None else None
        geom = _shape_common(xfrm)

        border = extract_border(sp_pr, theme_colors)

        return {
            "type": "connector",
            "placeholder": "none",
            "placeholderIdx": None,
            "x": geom["x"],
            "y": geom["y"],
            "width": geom["width"],
            "height": geom["height"],
            "rotation": geom["rotation"],
            "zIndex": z_index,
            "fill": None,
            "border": border,
            "opacity": 1,
            "shapeType": "line",
            "text": [],
        }

    # Handle regular shapes (rectangles, ellipses, text boxes, etc.)
    nv_pr = sp_el.find("p:nvSpPr/p:nvPr/p:ph", NS)
    placeholder = nv_pr.get("type") if nv_pr is not None else "none"
    placeholder_idx = nv_pr.get("idx") if nv_pr is not None else None

    xfrm = sp_el.find("p:spPr/a:xfrm", NS)
    geom = _shape_common(xfrm)

    sp_pr = sp_el.find("p:spPr", NS)
    fill = extract_fill(sp_pr, rels, zipf, part_path, asset_output_dir, asset_url_prefix, slide_index, z_index, theme_colors)
    border = extract_border(sp_pr, theme_colors)
    shape_type = extract_shape_type(sp_pr)

    tx_body = sp_el.find("p:txBody", NS)
    text_runs, align, v_align, bullet = extract_text(tx_body, theme_colors)

    element_type = "text" if text_runs else "shape"

    # Theme style refs (fillRef/lnRef) fallback when explicit fill/line missing
    # This handles shapes that inherit their formatting from theme styles
    style_el = sp_el.find("p:style", NS)
    if style_el is not None:
        # Extract fill from fillRef if not already set
        if fill is None:
            fill_ref = style_el.find("a:fillRef", NS)
            if fill_ref is not None:
                # Check for scheme color reference
                for child in fill_ref:
                    tag_name = etree.QName(child.tag).localname
                    if tag_name in ("srgbClr", "schemeClr", "scrgbClr", "sysClr", "prstClr"):
                        color, opacity = _parse_color(child, theme_colors)
                        if color:
                            fill = {"type": "solid", "color": f"#{color}", "opacity": opacity if opacity is not None else 1}
                        break

        # Extract border from lnRef if not already set
        if border is None:
            ln_ref = style_el.find("a:lnRef", NS)
            if ln_ref is not None:
                # Get line width from idx attribute (0=none, 1=hairline, 2=thin, 3=medium, 4=thick)
                ln_idx = ln_ref.get("idx")
                width_map = {"0": 0, "1": 1, "2": 1, "3": 2, "4": 3}
                width = width_map.get(ln_idx, 1) if ln_idx else 1

                # Check for scheme color reference
                for child in ln_ref:
                    tag_name = etree.QName(child.tag).localname
                    if tag_name in ("srgbClr", "schemeClr", "scrgbClr", "sysClr", "prstClr"):
                        color, opacity = _parse_color(child, theme_colors)
                        if color:
                            border = {"width": width, "color": f"#{color}", "opacity": opacity if opacity is not None else 1}
                        break

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
        "image": None,
    }


def extract_slide_details(
    zipf: zipfile.ZipFile,
    slide_path: str,
    slide_rels: Dict[str, Dict[str, str]],
    layout_tree: Optional[etree._Element],
    layout_rels: Dict[str, Dict[str, str]],
    master_tree: Optional[etree._Element],
    master_rels: Dict[str, Dict[str, str]],
    layout_path: Optional[str],
    master_path: Optional[str],
    theme_colors: Dict[str, str],
    width_px: int,
    height_px: int,
    asset_output_dir: str,
    asset_url_prefix: str,
    slide_index: int,
) -> Dict[str, Any]:
    slide_tree = _read_xml(zipf, slide_path)

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

    def parse_sp_tree(
        sp_tree: Optional[etree._Element],
        rels: Dict[str, Dict[str, str]],
        part_path: str,
        z_offset: int = 0,
        extract_all: bool = True
    ):
        """
        Extract all shapes from a shape tree.
        If extract_all=True: extracts ALL shapes (for slide content)
        If extract_all=False: extracts only non-placeholder shapes (for layout/master backgrounds)
        """
        elems: List[Dict[str, Any]] = []
        if sp_tree is None:
            return elems
        for z_index, child in enumerate(sp_tree):
            local = etree.QName(child.tag).localname
            if local in ("sp", "pic", "grpSp", "graphicFrame", "cxnSp"):
                # Extract all shape types including groups, connectors, charts, tables
                shape_data = extract_shape(
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
                elems.append(shape_data)
        return elems

    # Extract ALL slide shapes FIRST (this is the actual slide content - highest priority)
    slide_sp_tree = slide_tree.find("p:cSld/p:spTree", NS)
    slide_elements = parse_sp_tree(slide_sp_tree, slide_rels, slide_path, 0, extract_all=True)

    # Extract layout background shapes (decorative elements and placeholder templates)
    layout_sp_tree = layout_tree.find("p:cSld/p:spTree", NS) if layout_tree is not None else None
    layout_elements = parse_sp_tree(layout_sp_tree, layout_rels, layout_path or slide_path, len(slide_elements), extract_all=True)

    # Extract master background shapes (theme decorations)
    master_sp_tree = master_tree.find("p:cSld/p:spTree", NS) if master_tree is not None else None
    master_elements = parse_sp_tree(master_sp_tree, master_rels, master_path or slide_path, len(slide_elements) + len(layout_elements), extract_all=True)

    # DEBUG: Log what we're extracting from each layer
    logger.info(
        "Slide %s RAW extraction: slide=%s elements, layout=%s elements, master=%s elements",
        slide_index,
        len(slide_elements),
        len(layout_elements),
        len(master_elements)
    )

    # DEBUG: Log element details for slide content
    for idx, el in enumerate(slide_elements[:3]):  # Log first 3
        logger.debug(
            "  Slide[%s]: type=%s, ph=%s, x=%s, y=%s, w=%s, h=%s, fill=%s, border=%s, textLen=%s",
            idx,
            el.get("type"),
            el.get("placeholder"),
            el.get("x"),
            el.get("y"),
            el.get("width"),
            el.get("height"),
            el.get("fill", {}).get("type") if el.get("fill") else None,
            el.get("border", {}).get("width") if el.get("border") else None,
            sum(len(run.get("text", "")) for run in el.get("text", []))
        )

    # Build final element list with proper layering
    # Strategy: Start with slide content, add layout/master only for missing placeholders and decorations

    all_elements: List[Dict[str, Any]] = []
    placeholder_map: Dict[Tuple[str, Optional[str]], Dict[str, Any]] = {}

    # STEP 1: Add all non-placeholder shapes from master (backgrounds, logos, etc.)
    for el in master_elements:
        if el.get("placeholder") == "none":
            all_elements.append(el)

    # STEP 2: Add layout elements
    for el in layout_elements:
        placeholder = el.get("placeholder")
        if placeholder == "none":
            # Non-placeholder layout decorations
            all_elements.append(el)
        else:
            # Store as placeholder template
            key = (placeholder, el.get("placeholderIdx"))
            placeholder_map[key] = el

    # STEP 3: Add slide elements (override placeholders)
    for el in slide_elements:
        placeholder = el.get("placeholder")
        if placeholder == "none":
            # Direct slide content (not a placeholder)
            all_elements.append(el)
        else:
            # Slide placeholder - merge with layout template if exists
            key = (placeholder, el.get("placeholderIdx"))
            if key in placeholder_map:
                # Merge slide content with layout template
                layout_template = placeholder_map[key]

                # Slide content ALWAYS wins, but use layout position/size if slide has zero values
                merged_el = {
                    **layout_template,  # Start with layout template
                    **el,  # Override with slide values
                    # Special handling for geometry - use slide if non-zero, else layout
                    "x": el["x"] if el.get("x", 0) != 0 else layout_template.get("x", 0),
                    "y": el["y"] if el.get("y", 0) != 0 else layout_template.get("y", 0),
                    "width": el["width"] if el.get("width", 0) != 0 else layout_template.get("width", 0),
                    "height": el["height"] if el.get("height", 0) != 0 else layout_template.get("height", 0),
                    # Always use slide's content (text, fill, border) if present
                    "text": el.get("text") if el.get("text") else layout_template.get("text", []),
                    "fill": el.get("fill") or layout_template.get("fill"),
                    "border": el.get("border") or layout_template.get("border"),
                }
                all_elements.append(merged_el)
                # Remove from placeholder map so we don't add it again
                del placeholder_map[key]
            else:
                # Slide placeholder with no layout template
                all_elements.append(el)

    # STEP 4: Add any unused layout placeholders (empty placeholders that slide didn't override)
    for placeholder_el in placeholder_map.values():
        # Only add if it has actual content (text, fill, or is an image)
        if placeholder_el.get("text") or placeholder_el.get("fill") or placeholder_el.get("type") == "image":
            all_elements.append(placeholder_el)

    elements = all_elements

    # Re-sort by z-index to ensure proper rendering order
    elements.sort(key=lambda e: e.get("zIndex", 0))

    fonts = list({run.get("font") for el in elements for run in (el.get("text") or []) if run.get("font")})

    # Detailed extraction statistics
    stats = {
        "total": len(elements),
        "shapes": sum(1 for e in elements if e.get("type") == "shape"),
        "text": sum(1 for e in elements if e.get("type") == "text"),
        "images": sum(1 for e in elements if e.get("type") == "image"),
        "groups": sum(1 for e in elements if e.get("type") == "group"),
        "charts": sum(1 for e in elements if e.get("type") == "graphicFrame" and e.get("frameType") == "chart"),
        "tables": sum(1 for e in elements if e.get("type") == "graphicFrame" and e.get("frameType") == "table"),
        "connectors": sum(1 for e in elements if e.get("type") == "connector"),
        "with_fills": sum(1 for e in elements if e.get("fill")),
        "with_borders": sum(1 for e in elements if e.get("border")),
        "with_gradients": sum(1 for e in elements if e.get("fill") and e["fill"].get("type") == "gradient"),
        "with_patterns": sum(1 for e in elements if e.get("fill") and e["fill"].get("type") == "pattern"),
        "placeholders": sum(1 for e in elements if e.get("placeholder") != "none"),
        "master_shapes": sum(1 for e in elements if isinstance(e.get("zIndex"), str) and e.get("zIndex", "").startswith("master_")),
        "layout_shapes": sum(1 for e in elements if isinstance(e.get("zIndex"), str) and e.get("zIndex", "").startswith("layout_")),
    }

    logger.info(
        "Slide %s: Extracted %s elements [shapes=%s, text=%s, images=%s, groups=%s, charts=%s, tables=%s, connectors=%s] | "
        "Formatting: fills=%s, borders=%s, gradients=%s, patterns=%s | Layout: placeholders=%s, master=%s, layout=%s",
        slide_index,
        stats["total"],
        stats["shapes"],
        stats["text"],
        stats["images"],
        stats["groups"],
        stats["charts"],
        stats["tables"],
        stats["connectors"],
        stats["with_fills"],
        stats["with_borders"],
        stats["with_gradients"],
        stats["with_patterns"],
        stats["placeholders"],
        stats["master_shapes"],
        stats["layout_shapes"],
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

            layouts.append(
                extract_slide_details(
                    zipf,
                    slide_path,
                    slide_rels,
                    layout_tree,
                    layout_rels,
                    master_tree,
                    master_rels,
                    layout_path,
                    master_path,
                    theme_colors,
                    width_px,
                    height_px,
                    asset_output_dir,
                    asset_url_prefix,
                    slide_index,
                )
            )

        logger.info("Extracted %s slides", len(layouts))
        return layouts
