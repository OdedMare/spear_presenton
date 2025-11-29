import os
import sys
import json
import unittest
from unittest.mock import MagicMock, patch

# Add server directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), "../servers/fastapi"))

from services.placeholder_extractor import extract_all_placeholders, validate_rewritten_content
from services.placeholder_injector import inject_content_into_pptx
from api.v1.ppt.endpoints.content_rewrite import sanitize_rewritten_content, RewriteMode

# Mock data
MOCK_PLACEHOLDER_STRUCTURE = {
    "slides": [
        {
            "slideNumber": 1,
            "elements": [
                {
                    "id": "slide1_shape0",
                    "type": "shape",
                    "placeholderType": "title",
                    "text": "Original Title",
                    "originalLength": 14,
                    "maxLength": 21,
                    "maxLines": 1
                },
                {
                    "id": "slide1_shape1",
                    "type": "shape",
                    "placeholderType": "body",
                    "text": "Original Body",
                    "originalLength": 13,
                    "maxLength": 19,
                    "maxLines": 1
                }
            ]
        }
    ]
}

MOCK_REWRITTEN_CONTENT = {
    "slides": [
        {
            "slideNumber": 1,
            "elements": [
                {
                    "id": "slide1_shape0",
                    "text": "New Title"
                },
                {
                    "id": "slide1_shape1",
                    "text": "New Body Content"
                }
            ]
        }
    ]
}

class TestContentRewriteStrict(unittest.TestCase):
    
    def test_sanitize_rewritten_content_strict(self):
        """Test sanitization in strict mode (truncation)"""
        
        # Create content that exceeds limits
        long_content = {
            "slides": [
                {
                    "slideNumber": 1,
                    "elements": [
                        {
                            "id": "slide1_shape0",
                            "text": "This title is way too long for the constraint" # > 21 chars
                        },
                        {
                            "id": "slide1_shape1",
                            "text": "Line 1\nLine 2" # > 1 line
                        }
                    ]
                }
            ]
        }
        
        sanitized = sanitize_rewritten_content(MOCK_PLACEHOLDER_STRUCTURE, long_content, RewriteMode.STRICT)
        
        # Check title truncation
        title_el = sanitized["slides"][0]["elements"][0]
        self.assertLessEqual(len(title_el["text"]), 21)
        self.assertTrue(title_el["text"].endswith("..."))
        
        # Check line truncation
        body_el = sanitized["slides"][0]["elements"][1]
        self.assertNotIn("\n", body_el["text"])
        self.assertEqual(body_el["text"], "Line 1")

    def test_validate_rewritten_content_valid(self):
        """Test validation with valid content"""
        self.assertTrue(validate_rewritten_content(MOCK_PLACEHOLDER_STRUCTURE, MOCK_REWRITTEN_CONTENT))

    def test_validate_rewritten_content_invalid_id(self):
        """Test validation with mismatched ID"""
        invalid_content = {
            "slides": [
                {
                    "slideNumber": 1,
                    "elements": [
                        {
                            "id": "slide1_shape_WRONG",
                            "text": "New Title"
                        },
                        {
                            "id": "slide1_shape1",
                            "text": "New Body Content"
                        }
                    ]
                }
            ]
        }
        
        with self.assertRaisesRegex(ValueError, "unknown element ID"):
             validate_rewritten_content(MOCK_PLACEHOLDER_STRUCTURE, invalid_content)

    def test_validate_rewritten_content_missing_slide(self):
        """Test validation with missing slide"""
        invalid_content = {"slides": []}
        
        with self.assertRaisesRegex(ValueError, "Slide count mismatch"):
             validate_rewritten_content(MOCK_PLACEHOLDER_STRUCTURE, invalid_content)

if __name__ == "__main__":
    unittest.main()
