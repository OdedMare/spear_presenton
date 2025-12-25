"""
Smart Content Chunker for Large Presentations

This service intelligently chunks large presentation content to stay within
model token limits while processing content rewrites.

Features:
- Estimates token count before sending to LLM
- Splits presentations into optimal batches
- Processes batches sequentially to save tokens
- Combines results back together
"""

import json
import logging
from typing import Dict, Any, List, Tuple

logger = logging.getLogger(__name__)


def estimate_tokens(text: str) -> int:
    """
    Estimate token count for text.
    
    Uses a simple heuristic: ~4 characters per token on average.
    This is conservative and works well for most languages.
    
    Args:
        text: Text to estimate tokens for
        
    Returns:
        Estimated token count
    """
    return len(text) // 4


def estimate_structure_tokens(structure: Dict[str, Any]) -> int:
    """
    Estimate total tokens for a placeholder structure.
    
    Args:
        structure: Placeholder structure dict
        
    Returns:
        Estimated token count
    """
    # Convert to JSON string and estimate
    json_str = json.dumps(structure, ensure_ascii=False)
    return estimate_tokens(json_str)


def chunk_placeholder_structure(
    placeholder_structure: Dict[str, Any],
    system_prompt: str,
    user_prompt: str,
    max_input_tokens: int = 8000,  # Conservative limit (leaving room for output)
    overhead_tokens: int = 500  # Reserve for formatting, instructions, etc.
) -> List[Dict[str, Any]]:
    """
    Split a large placeholder structure into smaller chunks that fit within token limits.
    
    Strategy:
    1. Estimate tokens for system prompt + user prompt base
    2. Calculate available tokens for placeholder data
    3. Group slides into batches that fit within limit
    4. Return list of chunked structures
    
    Args:
        placeholder_structure: Full placeholder structure with all slides
        system_prompt: System prompt text
        user_prompt: User prompt template (without placeholder data)
        max_input_tokens: Maximum input tokens allowed
        overhead_tokens: Reserved tokens for formatting
        
    Returns:
        List of chunked placeholder structures, each within token limit
    """
    slides = placeholder_structure.get("slides", [])
    
    if not slides:
        return [placeholder_structure]
    
    # Estimate base prompt tokens
    base_tokens = estimate_tokens(system_prompt) + estimate_tokens(user_prompt) + overhead_tokens
    available_tokens = max_input_tokens - base_tokens
    
    logger.info(f"Base prompt tokens: ~{base_tokens}, Available for content: ~{available_tokens}")
    
    # Estimate tokens per slide
    slide_tokens = []
    for slide in slides:
        slide_json = json.dumps({"slides": [slide]}, ensure_ascii=False)
        tokens = estimate_tokens(slide_json)
        slide_tokens.append(tokens)
        logger.debug(f"Slide {slide.get('slideNumber')}: ~{tokens} tokens")
    
    # Check if we need to chunk at all
    total_tokens = sum(slide_tokens)
    if total_tokens <= available_tokens:
        logger.info(f"No chunking needed. Total tokens: ~{total_tokens} (limit: {available_tokens})")
        return [placeholder_structure]
    
    # Group slides into batches
    chunks = []
    current_batch = []
    current_batch_tokens = 0
    
    for i, (slide, tokens) in enumerate(zip(slides, slide_tokens)):
        # Check if single slide exceeds limit
        if tokens > available_tokens:
            logger.warning(
                f"Slide {slide.get('slideNumber')} alone has ~{tokens} tokens, "
                f"exceeds limit of {available_tokens}. Will process individually and may fail."
            )
            # Process this slide alone
            if current_batch:
                chunks.append({"slides": current_batch})
                current_batch = []
                current_batch_tokens = 0
            chunks.append({"slides": [slide]})
            continue
        
        # Check if adding this slide would exceed limit
        if current_batch_tokens + tokens > available_tokens:
            # Save current batch and start new one
            chunks.append({"slides": current_batch})
            logger.info(f"Created batch with {len(current_batch)} slides (~{current_batch_tokens} tokens)")
            current_batch = [slide]
            current_batch_tokens = tokens
        else:
            # Add to current batch
            current_batch.append(slide)
            current_batch_tokens += tokens
    
    # Add remaining batch
    if current_batch:
        chunks.append({"slides": current_batch})
        logger.info(f"Created final batch with {len(current_batch)} slides (~{current_batch_tokens} tokens)")
    
    logger.info(
        f"Split {len(slides)} slides into {len(chunks)} batches "
        f"(original: ~{total_tokens} tokens, limit: {available_tokens})"
    )
    
    return chunks


def combine_chunked_results(chunked_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Combine multiple chunked rewrite results back into a single structure.
    
    Args:
        chunked_results: List of rewritten content chunks
        
    Returns:
        Combined placeholder structure
    """
    if not chunked_results:
        return {"slides": []}
    
    if len(chunked_results) == 1:
        return chunked_results[0]
    
    # Combine all slides from all chunks
    combined_slides = []
    for chunk in chunked_results:
        slides = chunk.get("slides", [])
        combined_slides.extend(slides)
    
    # Sort by slide number to maintain order
    combined_slides.sort(key=lambda s: s.get("slideNumber", 0))
    
    logger.info(f"Combined {len(chunked_results)} chunks into {len(combined_slides)} slides")
    
    return {"slides": combined_slides}


def get_optimal_batch_size(
    total_slides: int,
    avg_tokens_per_slide: int,
    max_input_tokens: int = 8000,
    base_tokens: int = 2000
) -> int:
    """
    Calculate optimal batch size for processing slides.
    
    Args:
        total_slides: Total number of slides
        avg_tokens_per_slide: Average tokens per slide
        max_input_tokens: Maximum input tokens allowed
        base_tokens: Base tokens for prompts
        
    Returns:
        Optimal number of slides per batch
    """
    available_tokens = max_input_tokens - base_tokens
    batch_size = max(1, available_tokens // avg_tokens_per_slide)
    
    logger.info(
        f"Optimal batch size: {batch_size} slides "
        f"(avg {avg_tokens_per_slide} tokens/slide, {available_tokens} available)"
    )
    
    return batch_size
import asyncio
from typing import List

from models.document_chunk import DocumentChunk


class ScoreBasedChunker:

    def extract_headings(self, text: str) -> List[str]:
        lines = text.split("\n")
        headings = []
        
        for line in lines:
            line = line.strip()
            if line.startswith("#"):
                headings.append(line)
        
        return headings

    def score_headings(self, headings: List[str]) -> List[float]:
        heading_scores = []
        last_heading_index = -1
        first_heading_found = False

        for i, heading in enumerate(headings):
            score = 0.0
            
            heading_level = len(heading) - len(heading.lstrip("#"))
            
            if heading_level <= 3:
                score += 10.0 - (heading_level - 1) * 2.0
            else:
                score += 4.0 - (heading_level - 4) * 0.5

            if not first_heading_found:
                score += 5.0
                first_heading_found = True

            if last_heading_index != -1:
                distance = i - last_heading_index
                distance_bonus = min(5.0, distance * 0.5)
                score += distance_bonus

            last_heading_index = i
            heading_scores.append(score)

        return heading_scores

    def get_chunks_from_headings(
        self,
        text: str,
        headings: List[str],
        heading_scores: List[float],
        top_k: int = 10,
    ) -> List[DocumentChunk]:
        if not heading_scores:
            heading_scores = self.score_headings(headings)

        chunks = []
        heading_indices = []

        for i, score in enumerate(heading_scores):
            if score > 0:
                heading_indices.append((i, score))

        if len(heading_indices) == 0:
            return chunks

        heading_indices.sort(key=lambda x: (-x[1], x[0]))

        if len(heading_indices) <= top_k:
            selected_indices = [idx for idx, _ in heading_indices]
            selected_indices.sort()
        else:
            score_groups = {}
            for idx, score in heading_indices:
                rounded_score = round(score)
                if rounded_score not in score_groups:
                    score_groups[rounded_score] = []
                score_groups[rounded_score].append(idx)

            sorted_groups = sorted(
                score_groups.items(), key=lambda x: x[0], reverse=True
            )

            selected_indices = []

            for score, indices in sorted_groups:
                indices.sort()
                remaining_needed = top_k - len(selected_indices)

                if remaining_needed <= 0:
                    break

                if len(indices) <= remaining_needed:
                    selected_indices.extend(indices)
                else:
                    if remaining_needed == 1:
                        mid_idx = len(indices) // 2
                        selected_indices.append(indices[mid_idx])
                    elif remaining_needed == 2:
                        selected_indices.append(indices[0])
                        selected_indices.append(indices[-1])
                    else:
                        step = (len(indices) - 1) / (remaining_needed - 1)

                        for i in range(remaining_needed):
                            index = int(round(i * step))
                            if index < len(indices):
                                selected_indices.append(indices[index])

            selected_indices.sort()

        lines = text.split("\n")
        heading_positions = {}
        
        for i, line in enumerate(lines):
            line_stripped = line.strip()
            if line_stripped.startswith("#"):
                for heading_idx, heading in enumerate(headings):
                    if heading == line_stripped and heading_idx not in heading_positions:
                        heading_positions[heading_idx] = i
                        break
        
        for i, heading_idx in enumerate(selected_indices):
            if heading_idx not in heading_positions:
                continue
                
            heading = headings[heading_idx]
            heading_line_idx = heading_positions[heading_idx]
            
            if i + 1 < len(selected_indices):
                next_heading_idx = selected_indices[i + 1]
                if next_heading_idx in heading_positions:
                    next_heading_line_idx = heading_positions[next_heading_idx]
                    content_end = next_heading_line_idx
                else:
                    content_end = len(lines)
            else:
                content_end = len(lines)

            content_lines = lines[heading_line_idx + 1 : content_end]
            content = "\n".join(content_lines).strip()

            chunk = DocumentChunk(
                heading=heading,
                content=content,
                heading_index=heading_idx,
                score=heading_scores[heading_idx],
            )
            chunks.append(chunk)
            
        return chunks

    async def get_n_chunks(self, text: str, n: int) -> List[DocumentChunk]:
        headings = await asyncio.to_thread(self.extract_headings, text)
        heading_scores = await asyncio.to_thread(self.score_headings, headings)
        chunks = await asyncio.to_thread(
            self.get_chunks_from_headings, text, headings, heading_scores, n
        )
        if len(chunks) < n:
            raise ValueError(f"Only {len(chunks)} chunks found, requested {n}")
        return chunks
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
from html.parser import HTMLParser
from typing import List, Optional

from models.pptx_models import PptxFontModel, PptxTextRunModel


class InlineHTMLToRunsParser(HTMLParser):
    def __init__(self, base_font: PptxFontModel):
        super().__init__(convert_charrefs=True)
        self.base_font = base_font
        self.tag_stack: List[str] = []
        self.text_runs: List[PptxTextRunModel] = []

    def _current_font(self) -> PptxFontModel:
        font_json = self.base_font.model_dump()
        is_bold = any(tag in ("strong", "b") for tag in self.tag_stack)
        is_italic = any(tag in ("em", "i") for tag in self.tag_stack)
        is_underline = any(tag == "u" for tag in self.tag_stack)
        is_strike = any(tag in ("s", "strike", "del") for tag in self.tag_stack)
        is_code = any(tag == "code" for tag in self.tag_stack)

        if is_bold:
            font_json["font_weight"] = 700
        if is_italic:
            font_json["italic"] = True
        if is_underline:
            font_json["underline"] = True
        if is_strike:
            font_json["strike"] = True
        if is_code:
            font_json["name"] = "Courier New"

        return PptxFontModel(**font_json)

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        if tag == "br":
            self.text_runs.append(PptxTextRunModel(text="\n"))
            return
        self.tag_stack.append(tag)

    def handle_endtag(self, tag):
        tag = tag.lower()
        for i in range(len(self.tag_stack) - 1, -1, -1):
            if self.tag_stack[i] == tag:
                del self.tag_stack[i]
                break

    def handle_data(self, data):
        if data == "":
            return
        self.text_runs.append(PptxTextRunModel(text=data, font=self._current_font()))


def parse_html_text_to_text_runs(
    text: str, base_font: Optional[PptxFontModel] = None
) -> List[PptxTextRunModel]:
    normalized_text = text.replace("\r\n", "\n").replace("\r", "\n")
    normalized_text = normalized_text.replace("\n", "<br>")

    parser = InlineHTMLToRunsParser(base_font if base_font else PptxFontModel())
    parser.feed(normalized_text)
    return parser.text_runs


