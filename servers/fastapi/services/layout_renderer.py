from __future__ import annotations

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
