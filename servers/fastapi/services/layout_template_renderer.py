"""
Render layout templates to HTML with Tailwind CSS.
Outputs ONLY visual structure, NO CONTENT.
"""

from typing import Any, Dict, List


def _get_tailwind_bg_class(fill: Dict[str, Any]) -> str:
    """Convert fill to Tailwind background class."""
    if not fill:
        return ""

    fill_type = fill.get("type")

    if fill_type == "solid":
        color = fill.get("color", "#000000")
        # Use Tailwind arbitrary value for exact color
        return f"bg-[{color}]"

    elif fill_type == "gradient":
        # TODO: Convert gradient to Tailwind gradient classes
        stops = fill.get("stops", [])
        if stops:
            first_color = stops[0].get("color", "#000000")
            return f"bg-[{first_color}]"  # Fallback to first color

    elif fill_type == "theme":
        # Theme color - use placeholder
        theme_name = fill.get("theme", "unknown")
        # Map common theme colors to Tailwind
        theme_map = {
            "accent1": "bg-blue-500",
            "accent2": "bg-green-500",
            "accent3": "bg-red-500",
            "accent4": "bg-purple-500",
            "accent5": "bg-yellow-500",
            "accent6": "bg-pink-500",
            "dk1": "bg-gray-800",
            "dk2": "bg-gray-700",
            "lt1": "bg-gray-100",
            "lt2": "bg-gray-200",
        }
        return theme_map.get(theme_name, "bg-gray-400")

    return ""


def _get_tailwind_border_class(stroke: Dict[str, Any]) -> str:
    """Convert stroke to Tailwind border classes."""
    if not stroke:
        return ""

    color = stroke.get("color", "#000000")
    width = stroke.get("width", 1)

    # Map width to Tailwind border width
    if width <= 1:
        border_width = "border"
    elif width <= 2:
        border_width = "border-2"
    elif width <= 4:
        border_width = "border-4"
    else:
        border_width = "border-8"

    return f"{border_width} border-[{color}]"


def render_layout_to_html(layout: Dict[str, Any]) -> str:
    """
    Render layout template to HTML with Tailwind CSS.
    Outputs ONLY visual boxes, NO CONTENT.

    Args:
        layout: Layout dict from extract_layout_from_pptx()

    Returns:
        HTML string with Tailwind classes
    """
    width = layout.get("width_px", 960)
    height = layout.get("height_px", 540)
    shapes = layout.get("shapes", [])

    # Container div
    html_parts = [
        f'<div class="relative overflow-hidden" style="width:{width}px; height:{height}px;">'
    ]

    # Render each shape
    for shape in sorted(shapes, key=lambda s: s.get("z", 0)):
        bbox = shape.get("bbox", {})
        x = bbox.get("x", 0)
        y = bbox.get("y", 0)
        w = bbox.get("width", 0)
        h = bbox.get("height", 0)

        if w == 0 or h == 0:
            continue

        # Tailwind classes
        classes = ["absolute"]

        # Background fill
        fill = shape.get("fill")
        if fill:
            bg_class = _get_tailwind_bg_class(fill)
            if bg_class:
                classes.append(bg_class)

        # Border/stroke
        stroke = shape.get("stroke")
        if stroke:
            border_class = _get_tailwind_border_class(stroke)
            if border_class:
                classes.append(border_class)

        # Rounded corners for certain geometries
        geom = shape.get("geometry", "rect")
        if geom in ("roundRect", "ellipse", "circle"):
            classes.append("rounded-lg")
        if geom == "ellipse":
            classes.append("rounded-full")

        # Rotation
        rotation = bbox.get("rotation", 0)
        transform_parts = []
        if rotation != 0:
            transform_parts.append(f"rotate({rotation}deg)")

        # Flip
        if bbox.get("flipH"):
            transform_parts.append("scaleX(-1)")
        if bbox.get("flipV"):
            transform_parts.append("scaleY(-1)")

        # Inline styles (position + size + transform)
        styles = [
            f"left:{x}px",
            f"top:{y}px",
            f"width:{w}px",
            f"height:{h}px",
        ]

        if transform_parts:
            styles.append(f"transform:{' '.join(transform_parts)}")

        # Build the div
        class_str = " ".join(classes)
        style_str = "; ".join(styles)

        html_parts.append(f'  <div class="{class_str}" style="{style_str}"></div>')

    html_parts.append('</div>')

    return "\n".join(html_parts)
