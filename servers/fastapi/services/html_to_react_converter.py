"""
Deterministic HTML to React/TSX converter.
Converts rendered HTML layouts into reusable React components without using VLMs.
"""

import re
from typing import Dict, List, Optional, Set, Tuple
from html.parser import HTMLParser


class HTMLToReactParser(HTMLParser):
    """Parse HTML and build React component structure."""

    def __init__(self):
        super().__init__()
        self.component_code: List[str] = []
        self.tag_stack: List[Tuple[str, Dict[str, str]]] = []
        self.indent_level = 2
        self.props: Set[str] = set()
        self.prop_counter = 0
        self.editable_texts: List[Dict[str, str]] = []

    def handle_starttag(self, tag: str, attrs: List[Tuple[str, Optional[str]]]):
        """Handle opening HTML tags."""
        attrs_dict = {k: v for k, v in attrs if v is not None}
        self.tag_stack.append((tag, attrs_dict))

        indent = "  " * self.indent_level
        jsx_tag = self._convert_tag_to_jsx(tag)
        jsx_attrs = self._convert_attrs_to_jsx(attrs_dict, tag)

        if jsx_attrs:
            self.component_code.append(f"{indent}<{jsx_tag} {jsx_attrs}>")
        else:
            self.component_code.append(f"{indent}<{jsx_tag}>")

        self.indent_level += 1

    def handle_endtag(self, tag: str):
        """Handle closing HTML tags."""
        if not self.tag_stack:
            return

        self.indent_level -= 1
        indent = "  " * self.indent_level
        jsx_tag = self._convert_tag_to_jsx(tag)
        self.component_code.append(f"{indent}</{jsx_tag}>")
        self.tag_stack.pop()

    def handle_data(self, data: str):
        """Handle text content between tags."""
        data = data.strip()
        if not data:
            return

        indent = "  " * self.indent_level

        # Check if this is a text element we should make editable
        if self._is_editable_text(data):
            prop_name = self._create_text_prop(data)
            self.component_code.append(f"{indent}{{{prop_name}}}")
        else:
            # Escape curly braces for JSX
            escaped_data = data.replace("{", "{{").replace("}", "}}")
            self.component_code.append(f"{indent}{escaped_data}")

    def _convert_tag_to_jsx(self, tag: str) -> str:
        """Convert HTML tag to JSX-compatible tag."""
        # HTML tags are already valid JSX
        return tag

    def _convert_attrs_to_jsx(self, attrs: Dict[str, str], tag: str) -> str:
        """Convert HTML attributes to JSX props."""
        jsx_attrs: List[str] = []

        for key, value in attrs.items():
            # Convert style attribute
            if key == "style":
                jsx_attrs.append(f'style={{{{ {self._parse_inline_styles(value)} }}}}')
            # Convert class to className
            elif key == "class":
                jsx_attrs.append(f'className="{value}"')
            # Convert data attributes
            elif key.startswith("data-"):
                jsx_attrs.append(f'{key}="{value}"')
            # Handle boolean attributes
            elif value == "" or value.lower() == key.lower():
                jsx_attrs.append(key)
            # Handle image src - make it a prop if it's user content
            elif key == "src" and tag == "img":
                if self._is_user_image(value):
                    prop_name = self._create_image_prop(value)
                    jsx_attrs.append(f'src={{{prop_name}}}')
                else:
                    jsx_attrs.append(f'src="{value}"')
            # Handle other attributes
            else:
                # Escape quotes in attribute values
                escaped_value = value.replace('"', '\\"')
                jsx_attrs.append(f'{key}="{escaped_value}"')

        return " ".join(jsx_attrs)

    def _parse_inline_styles(self, style_str: str) -> str:
        """Convert inline CSS to JSX style object."""
        if not style_str:
            return "{}"

        styles: List[str] = []
        declarations = style_str.split(";")

        for decl in declarations:
            decl = decl.strip()
            if not decl or ":" not in decl:
                continue

            prop, value = decl.split(":", 1)
            prop = prop.strip()
            value = value.strip()

            # Convert CSS property to camelCase
            jsx_prop = self._css_to_camel_case(prop)

            # Quote string values, handle numbers
            if value and value[-1] in "0123456789":
                # Try to parse as number (for px, %, etc.)
                styles.append(f'{jsx_prop}: "{value}"')
            else:
                styles.append(f'{jsx_prop}: "{value}"')

        return ", ".join(styles)

    def _css_to_camel_case(self, css_prop: str) -> str:
        """Convert CSS property to camelCase for JSX."""
        parts = css_prop.split("-")
        return parts[0] + "".join(word.capitalize() for word in parts[1:])

    def _is_editable_text(self, text: str) -> bool:
        """Determine if text should be made into a prop."""
        # Make text editable if it's longer than 3 chars and not just whitespace
        if len(text.strip()) < 3:
            return False

        # Skip if it's just numbers or special characters
        if text.strip().replace(" ", "").replace(",", "").replace(".", "").isdigit():
            return False

        return True

    def _is_user_image(self, src: str) -> bool:
        """Determine if image src should be made into a prop."""
        # Make images that are in user-uploaded directories editable
        return "/app_data/images/" in src or "/uploads/" in src

    def _create_text_prop(self, text: str) -> str:
        """Create a prop name for editable text."""
        # Create semantic prop name from text
        words = re.sub(r"[^\w\s]", "", text).split()[:3]  # First 3 words
        prop_name = "".join(word.capitalize() for word in words)

        if not prop_name:
            prop_name = f"Text{self.prop_counter}"
            self.prop_counter += 1

        # Ensure uniqueness
        base_name = prop_name
        counter = 1
        while prop_name in self.props:
            prop_name = f"{base_name}{counter}"
            counter += 1

        self.props.add(prop_name)
        self.editable_texts.append({"prop": prop_name, "default": text})
        return prop_name

    def _create_image_prop(self, src: str) -> str:
        """Create a prop name for editable image."""
        prop_name = f"image{self.prop_counter}"
        self.prop_counter += 1
        self.props.add(prop_name)
        return prop_name


def convert_html_to_react(
    html: str,
    fonts: Optional[List[str]] = None,
    component_name: str = "SlideLayout",
) -> str:
    """
    Convert HTML to React/TSX component deterministically.

    Args:
        html: HTML content to convert
        fonts: List of font URLs to import
        component_name: Name for the generated component

    Returns:
        Complete TSX component code as string
    """
    # Parse HTML
    parser = HTMLToReactParser()
    parser.feed(html)

    # Build component props interface
    props_interface = _generate_props_interface(parser, component_name)

    # Build component function
    component_function = _generate_component_function(
        parser, component_name, fonts or []
    )

    # Combine into complete component
    return f"{props_interface}\n\n{component_function}"


def _generate_props_interface(parser: HTMLToReactParser, component_name: str) -> str:
    """Generate TypeScript interface for component props."""
    if not parser.props:
        return f"interface {component_name}Props {{}}"

    lines = [f"interface {component_name}Props {{"]

    # Add text props
    for item in parser.editable_texts:
        prop = item["prop"]
        lines.append(f'  {prop}?: string; // Default: "{item["default"]}"')

    # Add other props
    for prop in parser.props:
        if not any(item["prop"] == prop for item in parser.editable_texts):
            lines.append(f"  {prop}?: string;")

    lines.append("}")
    return "\n".join(lines)


def _generate_component_function(
    parser: HTMLToReactParser, component_name: str, fonts: List[str]
) -> str:
    """Generate React component function."""
    lines = []

    # Add component declaration with props destructuring
    if parser.props:
        prop_defaults = []
        for item in parser.editable_texts:
            prop = item["prop"]
            default = item["default"].replace('"', '\\"')
            prop_defaults.append(f'{prop} = "{default}"')

        # Add other props without defaults
        for prop in parser.props:
            if not any(item["prop"] == prop for item in parser.editable_texts):
                prop_defaults.append(prop)

        props_str = ", ".join(prop_defaults)
        lines.append(
            f"const {component_name}: React.FC<{component_name}Props> = ({{ {props_str} }}) => {{"
        )
    else:
        lines.append(f"const {component_name}: React.FC = () => {{")

    # Add font loading effect if fonts provided
    if fonts:
        lines.append("  // Load fonts")
        lines.append("  React.useEffect(() => {")
        for font_url in fonts:
            lines.append(f'    const link = document.createElement("link");')
            lines.append(f'    link.rel = "stylesheet";')
            lines.append(f'    link.href = "{font_url}";')
            lines.append(f"    document.head.appendChild(link);")
            lines.append(f"    return () => {{ document.head.removeChild(link); }};")
        lines.append("  }, []);")
        lines.append("")

    # Add component JSX
    lines.append("  return (")
    lines.extend(parser.component_code)
    lines.append("  );")
    lines.append("};")

    return "\n".join(lines)


def convert_html_to_react_simple(html: str, fonts: Optional[List[str]] = None) -> str:
    """
    Simplified HTML to React conversion - preserves structure without prop extraction.

    Args:
        html: HTML content to convert
        fonts: List of font URLs to import

    Returns:
        React component code as string
    """
    # Simple replacements for common HTML → JSX conversions
    jsx = html

    # Replace class with className
    jsx = re.sub(r'\bclass="', 'className="', jsx)
    jsx = re.sub(r"\bclass='", "className='", jsx)

    # Convert inline styles to JSX format
    jsx = _convert_inline_styles_simple(jsx)

    # Build component
    component_lines = [
        "const SlideLayout: React.FC = () => {",
    ]

    if fonts:
        component_lines.append("  React.useEffect(() => {")
        for font_url in fonts:
            component_lines.extend(
                [
                    f'    const link = document.createElement("link");',
                    f'    link.rel = "stylesheet";',
                    f'    link.href = "{font_url}";',
                    f"    document.head.appendChild(link);",
                ]
            )
        component_lines.append("  }, []);")
        component_lines.append("")

    component_lines.extend(["  return (", f"    {jsx}", "  );", "};"])

    return "\n".join(component_lines)


def _convert_inline_styles_simple(html: str) -> str:
    """Convert inline style attributes to JSX style objects (simplified)."""

    def replace_style(match):
        style_content = match.group(1)
        # Convert to JSX style object format
        declarations = style_content.split(";")
        jsx_styles = []

        for decl in declarations:
            decl = decl.strip()
            if not decl or ":" not in decl:
                continue

            prop, value = decl.split(":", 1)
            prop = prop.strip()
            value = value.strip()

            # Convert to camelCase
            jsx_prop = re.sub(r"-([a-z])", lambda m: m.group(1).upper(), prop)
            jsx_styles.append(f'{jsx_prop}: "{value}"')

        if jsx_styles:
            return f'style={{{{ {", ".join(jsx_styles)} }}}}'
        return ""

    return re.sub(r'style="([^"]*)"', replace_style, html)
