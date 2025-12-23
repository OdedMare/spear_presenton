
import unittest
import sys
import os

# Add server directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), "../servers/fastapi"))

from api.v1.ppt.endpoints.content_rewrite import smart_truncate, validate_content_constraints

class TestContentRewriteImprovements(unittest.TestCase):
    
    def test_smart_truncate_no_cut(self):
        text = "Short text."
        self.assertEqual(smart_truncate(text, 20), "Short text.")

    def test_smart_truncate_sentence_cut(self):
        # Length is 33 chars. Max 25.
        # "Hello world. This is a test."
        # 80% of 25 is 20.
        # "Hello world." ends at char 12.
        # "Hello world." should be preserved if we cut at 25?
        # Wait, min_sentence_length is int(25 * 0.8) = 20.
        # "Hello world." length is 12. 12 < 20. So it won't be picked by strategy 1?
        # Let's adjust the test case.
        
        # Max 20. 80% = 16.
        # Text: "This is a long sentence. Short."
        # "This is a long sentence." is 24 chars. Too long.
        
        # Let's try:
        # Max 30. 80% = 24.
        # Text: "A very long sentence here clearly. And more."
        # "A very long sentence here clearly." is 34 chars. Too long.
        
        # Strategy 1 only works if the sentence ends in the LAST 20% of the allowed space.
        # So acceptable range is [max*0.8, max].
        
        # Example: Max 20. Range [16, 20].
        # Text: "012345678901234. End." (length 21)
        # "012345678901234." length is 16. 
        # If matches finds '.', it's at index 15. End is 16.
        # 16 >= 16. So it should return "012345678901234."
        
        text = "012345678901234. End."
        self.assertEqual(smart_truncate(text, 20), "012345678901234.")
        
    def test_smart_truncate_word_cut(self):
        # Fallback to word boundary
        # Max 10.
        # Text: "Hello world this"
        # "Hello world" is 11 chars.
        # Cut at "Hello" (5 chars).
        # Return "Hello..." (8 chars)
        text = "Hello world this"
        self.assertEqual(smart_truncate(text, 10), "Hello...")
        
    def test_smart_truncate_hard_cut(self):
        # No spaces
        text = "Supercalifragilistic"
        # Max 10.
        # Target 7 + ...
        self.assertEqual(smart_truncate(text, 10), "Superca...")

    def test_validate_content_constraints(self):
        structure = {
            "slides": [{
                "slideNumber": 1,
                "elements": [
                    {"id": "e1", "maxLength": 10},
                    {"id": "e2", "maxLines": 1}
                ]
            }]
        }
        
        # Valid
        content_valid = {
            "slides": [{
                "slideNumber": 1,
                "elements": [
                    {"id": "e1", "text": "Short"},
                    {"id": "e2", "text": "One line"}
                ]
            }]
        }
        self.assertEqual(validate_content_constraints(structure, content_valid), [])
        
        # Invalid Length
        content_invalid_len = {
            "slides": [{
                "slideNumber": 1,
                "elements": [
                    {"id": "e1", "text": "This is too long"},
                    {"id": "e2", "text": "One line"}
                ]
            }]
        }
        errors = validate_content_constraints(structure, content_invalid_len)
        self.assertEqual(len(errors), 1)
        self.assertIn("exceeds maxLength", errors[0])

        # Invalid Lines
        content_invalid_lines = {
            "slides": [{
                "slideNumber": 1,
                "elements": [
                    {"id": "e1", "text": "Ok"},
                    {"id": "e2", "text": "Two\nLines"}
                ]
            }]
        }
        errors = validate_content_constraints(structure, content_invalid_lines)
        self.assertEqual(len(errors), 1)
        self.assertIn("exceeds maxLines", errors[0])

if __name__ == '__main__':
    unittest.main()
