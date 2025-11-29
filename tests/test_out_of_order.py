
import unittest
from api.v1.ppt.endpoints.content_rewrite import sanitize_rewritten_content, RewriteMode
from services.placeholder_extractor import validate_rewritten_content

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

class TestOutOfOrder(unittest.TestCase):
    def test_sanitize_out_of_order(self):
        # This should ideally work if we match by ID
        # But currently it zips, so it might apply id_1 constraints to id_2
        sanitized = sanitize_rewritten_content(
            MOCK_PLACEHOLDER_STRUCTURE, 
            MOCK_REWRITTEN_OUT_OF_ORDER, 
            RewriteMode.STRICT
        )
        
        # Validate should fail if IDs don't match order
        try:
            validate_rewritten_content(MOCK_PLACEHOLDER_STRUCTURE, sanitized)
            print("Validation passed (Unexpected if strict mode requires order)")
        except ValueError as e:
            print(f"Validation failed as expected: {e}")

if __name__ == "__main__":
    unittest.main()
