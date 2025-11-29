
import unittest
import sys
import os
import logging

# Add server directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), "../servers/fastapi"))

from api.v1.ppt.endpoints.content_rewrite import sanitize_rewritten_content, RewriteMode
from services.placeholder_extractor import validate_rewritten_content

# Configure logging to avoid noise
logging.basicConfig(level=logging.CRITICAL)

MOCK_PLACEHOLDER_STRUCTURE = {
    "slides": [
        {
            "slideNumber": 1,
            "elements": [
                {
                    "id": "id_1",
                    "text": "Original 1",
                    "maxLength": 10
                },
                {
                    "id": "id_2",
                    "text": "Original 2",
                    "maxLength": 10
                }
            ]
        }
    ]
}

MOCK_REWRITTEN_OUT_OF_ORDER = {
    "slides": [
        {
            "slideNumber": 1,
            "elements": [
                {
                    "id": "id_2",
                    "text": "New 2"
                },
                {
                    "id": "id_1",
                    "text": "New 1"
                }
            ]
        }
    ]
}

MOCK_REWRITTEN_MISSING_ID = {
    "slides": [
        {
            "slideNumber": 1,
            "elements": [
                {
                    "id": "id_1",
                    "text": "New 1"
                }
            ]
        }
    ]
}

MOCK_REWRITTEN_EXTRA_ID = {
    "slides": [
        {
            "slideNumber": 1,
            "elements": [
                {
                    "id": "id_1",
                    "text": "New 1"
                },
                {
                    "id": "id_2",
                    "text": "New 2"
                },
                {
                    "id": "id_3",
                    "text": "Extra"
                }
            ]
        }
    ]
}

class TestContentRewriteRobust(unittest.TestCase):
    def test_sanitize_out_of_order(self):
        """Test that sanitization works even if elements are out of order"""
        sanitized = sanitize_rewritten_content(
            MOCK_PLACEHOLDER_STRUCTURE, 
            MOCK_REWRITTEN_OUT_OF_ORDER, 
            RewriteMode.STRICT
        )
        
        # Check that we got both elements back
        elements = sanitized["slides"][0]["elements"]
        self.assertEqual(len(elements), 2)
        
        # Verify IDs are present (order in output depends on input order, which is fine)
        ids = [e["id"] for e in elements]
        self.assertIn("id_1", ids)
        self.assertIn("id_2", ids)

    def test_validate_out_of_order(self):
        """Test that validation passes for out-of-order elements"""
        # This should now pass
        self.assertTrue(validate_rewritten_content(MOCK_PLACEHOLDER_STRUCTURE, MOCK_REWRITTEN_OUT_OF_ORDER))

    def test_validate_missing_id(self):
        """Test that validation fails if an ID is missing"""
        with self.assertRaisesRegex(ValueError, "element count mismatch"):
            validate_rewritten_content(MOCK_PLACEHOLDER_STRUCTURE, MOCK_REWRITTEN_MISSING_ID)

    def test_validate_extra_id(self):
        """Test that validation fails if an extra ID is present"""
        with self.assertRaisesRegex(ValueError, "element count mismatch"):
            validate_rewritten_content(MOCK_PLACEHOLDER_STRUCTURE, MOCK_REWRITTEN_EXTRA_ID)
            
    def test_sanitize_removes_extra_id(self):
        """Test that sanitization removes extra IDs in strict mode"""
        sanitized = sanitize_rewritten_content(
            MOCK_PLACEHOLDER_STRUCTURE, 
            MOCK_REWRITTEN_EXTRA_ID, 
            RewriteMode.STRICT
        )
        
        elements = sanitized["slides"][0]["elements"]
        self.assertEqual(len(elements), 2)
        ids = [e["id"] for e in elements]
        self.assertNotIn("id_3", ids)

if __name__ == "__main__":
    unittest.main()
