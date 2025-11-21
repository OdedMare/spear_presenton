from __future__ import annotations

import html
import math
from typing import Any, Dict, List, Optional


def _style_to_string(style: Dict[str, Any]) -> str:
    """Convert a style dict into inline CSS."""
    parts: List[str] = []
    for key, value in style.items():
        if value is None:
            continue
        parts.append(f"{key}: {value};")
    return " ".join(parts)


def _color(color: Optional[str]) -> Optional[str]:
    return color if color else None


def _shadow(shadow: Optional[Dict[str, Any]]) -> Optional[str]:
    if not shadow:
        return None
    color = shadow.get("color") or "rgba(0,0,0,0.25)"
    blur = shadow.get("blur", 0)
    ox = shadow.get("offsetX", 0)
    oy = shadow.get("offsetY", 0)
    opacity = shadow.get("opacity")
    if opacity is not None and isinstance(color, str) and color.startswith("#"):
        try:
            r = int(color[1:3], 16)
            g = int(color[3:5], 16)
            b = int(color[5:7], 16)
            color = f"rgba({r},{g},{b},{opacity})"
        except Exception:
            pass
    return f"{ox}px {oy}px {blur}px {color}"


def _fill_styles(fill: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not fill:
        return {}
    kind = fill.get("type")
    if kind == "solid":
        return {"background": _color(fill.get("color"))}
    if kind == "gradient":
        gradient = fill.get("gradient") or {}
        stops = gradient.get("stops") or []
        angle = gradient.get("angle", 0)
        if stops:
            stop_str = ", ".join(
                f"{_color(stop.get('color'))} {int(stop.get('offset', 0) * 100)}%"
                for stop in stops
                if stop.get("color")
            )
            return {"background": f"linear-gradient({angle}deg, {stop_str})"}
    if kind == "image":
        image = fill.get("image") or {}
        src = image.get("src")
        if src:
            fill_mode = image.get("fill", "cover")
            opacity = image.get("opacity")
            styles = {
                "background-image": f"url('{src}')",
                "background-size": fill_mode,
                "background-repeat": "no-repeat",
                "background-position": "center",
            }
            if opacity is not None:
                styles["opacity"] = opacity
            return styles
    return {}


def _stroke_styles(stroke: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not stroke:
        return {}
    width = stroke.get("width") or 0
    color = _color(stroke.get("color"))
    dash = stroke.get("dash")
    styles: Dict[str, Any] = {}
    if color:
        styles["border"] = f"{width}px { 'dashed' if dash in ('dash','dot') else 'solid'} {color}"
    return styles


def _text_span(run: Dict[str, Any]) -> str:
    font = run.get("font", {}) or {}
    style = {
        "font-family": font.get("family"),
        "font-size": f"{font.get('size')}px" if font.get("size") else None,
        "font-weight": font.get("weight"),
        "font-style": font.get("style"),
        "color": _color(run.get("color") or font.get("color")),
        "text-decoration": "underline" if run.get("underline") else None,
    }
    if run.get("strike"):
        style["text-decoration"] = "line-through"
    if run.get("highlight"):
        style["background-color"] = _color(run.get("highlight"))

    return f"<span style=\"{_style_to_string(style)}\">{html.escape(run.get('text',''))}</span>"


def _render_text(element: Dict[str, Any]) -> str:
    bbox = element.get("bbox", {})
    bullets = element.get("bullets", [])
    runs_flat = element.get("runs", [])

    style = {
        "position": "absolute",
        "left": f"{bbox.get('x',0)}px",
        "top": f"{bbox.get('y',0)}px",
        "width": f"{bbox.get('width',0)}px",
        "height": f"{bbox.get('height',0)}px",
        "z-index": element.get("z", 0),
        "transform": f"rotate({element.get('rotation',0)}deg)"
        if element.get("rotation")
        else None,
        "opacity": element.get("opacity"),
        "text-align": element.get("align") or "left",
        "overflow": "hidden",
    }

    shadow_css = _shadow(element.get("shadow"))
    if shadow_css:
        style["text-shadow"] = shadow_css

    html_lines: List[str] = []
    if bullets:
        for bullet in bullets:
            indent = bullet.get("level", 0) * 18
            marker = bullet.get("marker", "bullet")
            marker_text = "•" if marker == "bullet" else ""
            if marker == "number":
                marker_text = ""
            line_runs = bullet.get("runs") or runs_flat
            line_html = "".join(_text_span(r) for r in line_runs)
            if marker == "number":
                html_lines.append(
                    f'<div style="padding-left:{indent+12}px">{line_html}</div>'
                )
            elif marker == "none":
                html_lines.append(
                    f'<div style="padding-left:{indent}px">{line_html}</div>'
                )
            else:
                html_lines.append(
                    f'<div style="padding-left:{indent+12}px"><span style="padding-right:8px">{marker_text}</span>{line_html}</div>'
                )
    else:
        html_lines.append("".join(_text_span(r) for r in runs_flat))

    return f'<div style="{_style_to_string(style)}">{"".join(html_lines)}</div>'


def _render_shape(element: Dict[str, Any]) -> str:
    bbox = element.get("bbox", {})
    style = {
        "position": "absolute",
        "left": f"{bbox.get('x',0)}px",
        "top": f"{bbox.get('y',0)}px",
        "width": f"{bbox.get('width',0)}px",
        "height": f"{bbox.get('height',0)}px",
        "z-index": element.get("z", 0),
        "transform": f"rotate({element.get('rotation',0)}deg)"
        if element.get("rotation")
        else None,
        "opacity": element.get("opacity"),
        "border-radius": f"{element.get('radius')}px" if element.get("radius") else None,
    }
    style.update(_fill_styles(element.get("fill")))
    style.update(_stroke_styles(element.get("stroke")))
    shadow_css = _shadow(element.get("shadow"))
    if shadow_css:
        style["box-shadow"] = shadow_css
    return f'<div style="{_style_to_string(style)}"></div>'


def _render_image(element: Dict[str, Any]) -> str:
    bbox = element.get("bbox", {})
    style = {
        "position": "absolute",
        "left": f"{bbox.get('x',0)}px",
        "top": f"{bbox.get('y',0)}px",
        "width": f"{bbox.get('width',0)}px",
        "height": f"{bbox.get('height',0)}px",
        "z-index": element.get("z", 0),
        "transform": f"rotate({element.get('rotation',0)}deg)"
        if element.get("rotation")
        else None,
        "opacity": element.get("opacity"),
        "object-fit": element.get("object_fit", "cover"),
    }
    shadow_css = _shadow(element.get("shadow"))
    if shadow_css:
        style["box-shadow"] = shadow_css
    style.update(_stroke_styles(element.get("border")))
    style.update(_fill_styles(element.get("background")))

    crop = element.get("crop")
    if crop:
        l = crop.get("left", 0)
        t = crop.get("top", 0)
        r = crop.get("right", 0)
        b = crop.get("bottom", 0)
        style["clip-path"] = f"inset({t}px {r}px {b}px {l}px)"

    src = html.escape(element.get("src", ""))
    return f'<img src="{src}" style="{_style_to_string(style)}" />'


def _render_table(element: Dict[str, Any]) -> str:
    bbox = element.get("bbox", {})
    style = {
        "position": "absolute",
        "left": f"{bbox.get('x',0)}px",
        "top": f"{bbox.get('y',0)}px",
        "width": f"{bbox.get('width',0)}px",
        "height": f"{bbox.get('height',0)}px",
        "z-index": element.get("z", 0),
        "transform": f"rotate({element.get('rotation',0)}deg)"
        if element.get("rotation")
        else None,
        "opacity": element.get("opacity"),
        "border-collapse": "collapse",
    }
    rows = element.get("rows", [])
    html_rows: List[str] = []
    for row in rows:
        cells_html = []
        for cell in row.get("cells", []):
            runs = cell.get("runs", [])
            text_html = (
                "".join(_text_span(r) for r in runs)
                if runs
                else html.escape(cell.get("text", "") or "")
            )
            cell_style = {}
            cells_html.append(f'<td style="{_style_to_string(cell_style)}">{text_html}</td>')
        html_rows.append(f"<tr>{''.join(cells_html)}</tr>")
    return f'<table style="{_style_to_string(style)}">{"".join(html_rows)}</table>'


def _render_line(element: Dict[str, Any]) -> str:
    points = element.get("points", [])
    if len(points) < 2:
        return ""
    (x1, y1), (x2, y2) = points[0], points[1]
    dx = x2 - x1
    dy = y2 - y1
    length = math.hypot(dx, dy)
    angle = math.degrees(math.atan2(dy, dx))
    stroke = element.get("stroke", {})
    style = {
        "position": "absolute",
        "left": f"{min(x1,x2)}px",
        "top": f"{min(y1,y2)}px",
        "width": f"{length}px",
        "height": "1px",
        "z-index": element.get("z", 0),
        "transform": f"rotate({angle}deg)",
        "transform-origin": "0 0",
        "border-top": f"{stroke.get('width',1)}px solid {_color(stroke.get('color')) or '#000'}",
    }
    return f'<div style="{_style_to_string(style)}"></div>'


def render_slide(slide: Dict[str, Any]) -> str:
    """Render a LayoutSlide dict to HTML."""
    width = slide.get("width_px", 1280)
    height = slide.get("height_px", 720)
    background = slide.get("background")

    container_style = {
        "position": "relative",
        "width": f"{width}px",
        "height": f"{height}px",
        "overflow": "hidden",
    }
    container_style.update(_fill_styles(background))

    elements_html: List[str] = []
    for element in sorted(slide.get("elements", []), key=lambda e: e.get("z", 0)):
        kind = element.get("type")
        if kind == "text":
            elements_html.append(_render_text(element))
        elif kind == "shape":
            elements_html.append(_render_shape(element))
        elif kind == "image":
            elements_html.append(_render_image(element))
        elif kind == "table":
            elements_html.append(_render_table(element))
        elif kind == "line":
            elements_html.append(_render_line(element))

    return f'<div style="{_style_to_string(container_style)}">{"".join(elements_html)}</div>'
