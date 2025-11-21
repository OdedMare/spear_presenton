"""
Deterministic HTML text editor.
Allows text-only edits to HTML without using vision models.
"""

from typing import List, Optional
from enum import Enum
from html.parser import HTMLParser
from pydantic import BaseModel
import re


class EditAction(str, Enum):
    """Types of text edit actions."""

    REPLACE = "replace"
    APPEND = "append"
    PREPEND = "prepend"
    DELETE = "delete"


class TextEdit(BaseModel):
    """Text edit operation."""

    selector: str  # CSS selector or XPath
    action: EditAction
    value: Optional[str] = None  # New text content (not needed for DELETE)


class HTMLTextEditor:
    """Edit HTML text content using CSS selectors."""

    def __init__(self, html: str):
        self.html = html
        self.elements: List[dict] = []
        self._parse_html()

    def _parse_html(self):
        """Parse HTML to extract editable elements."""
        parser = EditableElementParser()
        parser.feed(self.html)
        self.elements = parser.elements

    def apply_edits(self, edits: List[TextEdit]) -> str:
        """Apply text edits to HTML."""
        modified_html = self.html

        for edit in edits:
            modified_html = self._apply_single_edit(modified_html, edit)

        return modified_html

    def _apply_single_edit(self, html: str, edit: TextEdit) -> str:
        """Apply a single edit operation."""
        # Parse selector
        selector_info = self._parse_selector(edit.selector)

        if selector_info["type"] == "class":
            return self._edit_by_class(html, selector_info["value"], edit)
        elif selector_info["type"] == "id":
            return self._edit_by_id(html, selector_info["value"], edit)
        elif selector_info["type"] == "tag":
            return self._edit_by_tag(html, selector_info["value"], edit)
        elif selector_info["type"] == "nth-child":
            return self._edit_by_nth_child(
                html, selector_info["parent"], selector_info["index"], edit
            )
        else:
            # Fallback: simple text replacement
            return self._edit_by_text_match(html, edit)

    def _parse_selector(self, selector: str) -> dict:
        """Parse CSS selector into components."""
        # Handle nth-child selector
        nth_child_match = re.match(r"(.+?):nth-child\((\d+)\)", selector)
        if nth_child_match:
            parent = nth_child_match.group(1).strip()
            index = int(nth_child_match.group(2))
            return {"type": "nth-child", "parent": parent, "index": index}

        # Handle class selector
        if selector.startswith("."):
            return {"type": "class", "value": selector[1:]}

        # Handle ID selector
        if selector.startswith("#"):
            return {"type": "id", "value": selector[1:]}

        # Handle tag selector
        if " " not in selector and "." not in selector and "#" not in selector:
            return {"type": "tag", "value": selector}

        return {"type": "unknown", "value": selector}

    def _edit_by_class(self, html: str, class_name: str, edit: TextEdit) -> str:
        """Edit elements by class name."""
        # Match opening tag with class
        pattern = rf'(<[^>]+class="[^"]*{re.escape(class_name)}[^"]*"[^>]*>)(.*?)(</[^>]+>)'

        def replacer(match):
            opening = match.group(1)
            content = match.group(2)
            closing = match.group(3)

            new_content = self._apply_edit_action(content, edit)
            return f"{opening}{new_content}{closing}"

        return re.sub(pattern, replacer, html, count=1)

    def _edit_by_id(self, html: str, element_id: str, edit: TextEdit) -> str:
        """Edit element by ID."""
        pattern = rf'(<[^>]+id="{re.escape(element_id)}"[^>]*>)(.*?)(</[^>]+>)'

        def replacer(match):
            opening = match.group(1)
            content = match.group(2)
            closing = match.group(3)

            new_content = self._apply_edit_action(content, edit)
            return f"{opening}{new_content}{closing}"

        return re.sub(pattern, replacer, html, count=1)

    def _edit_by_tag(self, html: str, tag_name: str, edit: TextEdit) -> str:
        """Edit first element by tag name."""
        pattern = rf"(<{re.escape(tag_name)}[^>]*>)(.*?)(</{re.escape(tag_name)}>)"

        def replacer(match):
            opening = match.group(1)
            content = match.group(2)
            closing = match.group(3)

            new_content = self._apply_edit_action(content, edit)
            return f"{opening}{new_content}{closing}"

        return re.sub(pattern, replacer, html, count=1)

    def _edit_by_nth_child(
        self, html: str, parent_selector: str, index: int, edit: TextEdit
    ) -> str:
        """Edit nth child of parent element."""
        # This is a simplified implementation
        # For production, consider using BeautifulSoup or lxml
        parent_info = self._parse_selector(parent_selector)

        if parent_info["type"] == "class":
            parent_class = parent_info["value"]
            # Find parent element
            parent_pattern = (
                rf'(<[^>]+class="[^"]*{re.escape(parent_class)}[^"]*"[^>]*>)(.*?)(</[^>]+>)'
            )

            def parent_replacer(parent_match):
                opening = parent_match.group(1)
                content = parent_match.group(2)
                closing = parent_match.group(3)

                # Find nth child within content
                # Simple approach: find div/span/li children
                child_pattern = r"(<(?:div|span|li|p)[^>]*>)(.*?)(</(?:div|span|li|p)>)"
                children = list(re.finditer(child_pattern, content))

                if 0 < index <= len(children):
                    child_match = children[index - 1]
                    child_opening = child_match.group(1)
                    child_content = child_match.group(2)
                    child_closing = child_match.group(3)

                    new_child_content = self._apply_edit_action(child_content, edit)
                    new_child = f"{child_opening}{new_child_content}{child_closing}"

                    # Replace in content
                    content = (
                        content[: child_match.start()]
                        + new_child
                        + content[child_match.end() :]
                    )

                return f"{opening}{content}{closing}"

            return re.sub(parent_pattern, parent_replacer, html, count=1)

        return html

    def _edit_by_text_match(self, html: str, edit: TextEdit) -> str:
        """Edit by matching text content (fallback)."""
        # Use selector as text to match
        old_text = edit.selector
        new_text = self._apply_edit_action(old_text, edit)
        return html.replace(old_text, new_text, 1)

    def _apply_edit_action(self, content: str, edit: TextEdit) -> str:
        """Apply edit action to content."""
        if edit.action == EditAction.REPLACE:
            return edit.value or ""
        elif edit.action == EditAction.APPEND:
            return content + (edit.value or "")
        elif edit.action == EditAction.PREPEND:
            return (edit.value or "") + content
        elif edit.action == EditAction.DELETE:
            return ""
        else:
            return content


class EditableElementParser(HTMLParser):
    """Parse HTML to extract editable text elements."""

    def __init__(self):
        super().__init__()
        self.elements: List[dict] = []
        self.current_path: List[str] = []
        self.element_counts: dict = {}

    def handle_starttag(self, tag: str, attrs: List[tuple]):
        """Track element path."""
        attrs_dict = dict(attrs)

        # Track element count for nth-child
        if tag not in self.element_counts:
            self.element_counts[tag] = 0
        self.element_counts[tag] += 1

        # Build selector
        selector = tag
        if "id" in attrs_dict:
            selector = f"#{attrs_dict['id']}"
        elif "class" in attrs_dict:
            classes = attrs_dict["class"].split()
            if classes:
                selector = f".{classes[0]}"

        self.current_path.append(selector)

    def handle_endtag(self, tag: str):
        """Pop element from path."""
        if self.current_path:
            self.current_path.pop()

    def handle_data(self, data: str):
        """Extract text content."""
        data = data.strip()
        if data and len(data) > 3:
            # This is editable text
            selector = " > ".join(self.current_path) if self.current_path else "body"
            self.elements.append(
                {"selector": selector, "text": data, "length": len(data)}
            )


def edit_html_text(html: str, edits: List[TextEdit]) -> str:
    """
    Apply text edits to HTML without vision models.

    Args:
        html: HTML content to edit
        edits: List of text edit operations

    Returns:
        Modified HTML content
    """
    editor = HTMLTextEditor(html)
    return editor.apply_edits(edits)


def extract_editable_elements(html: str) -> List[dict]:
    """
    Extract list of editable text elements from HTML.

    Args:
        html: HTML content to analyze

    Returns:
        List of editable elements with selectors and text
    """
    parser = EditableElementParser()
    parser.feed(html)
    return parser.elements


def find_text_by_content(html: str, search_text: str) -> Optional[str]:
    """
    Find selector for text content.

    Args:
        html: HTML content to search
        search_text: Text to find

    Returns:
        CSS selector for the element containing the text, or None
    """
    elements = extract_editable_elements(html)
    for element in elements:
        if search_text in element["text"]:
            return element["selector"]
    return None
