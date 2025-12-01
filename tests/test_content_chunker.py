"""
Tests for Content Chunker Service

Verifies that the chunking logic correctly splits large presentations
into batches that fit within token limits.
"""

import unittest
import sys
import os

# Add server directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), "../servers/fastapi"))

from services.content_chunker import (
    estimate_tokens,
    estimate_structure_tokens,
    chunk_placeholder_structure,
    combine_chunked_results,
    get_optimal_batch_size
)


class TestContentChunker(unittest.TestCase):
    
    def test_estimate_tokens(self):
        """Test token estimation for text"""
        # Simple test: ~4 chars per token
        text = "This is a test" * 100  # 1400 chars
        tokens = estimate_tokens(text)
        self.assertGreater(tokens, 300)  # Should be ~350
        self.assertLess(tokens, 400)
    
    def test_estimate_structure_tokens(self):
        """Test token estimation for placeholder structure"""
        structure = {
            "slides": [
                {
                    "slideNumber": 1,
                    "elements": [
                        {
                            "id": "slide1_shape0",
                            "text": "Test title",
                            "maxLength": 50
                        }
                    ]
                }
            ]
        }
        tokens = estimate_structure_tokens(structure)
        self.assertGreater(tokens, 0)
    
    def test_no_chunking_needed(self):
        """Test that small presentations don't get chunked"""
        structure = {
            "slides": [
                {
                    "slideNumber": 1,
                    "elements": [
                        {"id": "slide1_shape0", "text": "Title"}
                    ]
                }
            ]
        }
        
        chunks = chunk_placeholder_structure(
            structure,
            system_prompt="Short prompt",
            user_prompt="Short user prompt",
            max_input_tokens=8000
        )
        
        # Should return single chunk (no splitting needed)
        self.assertEqual(len(chunks), 1)
        self.assertEqual(chunks[0], structure)
    
    def test_chunking_large_presentation(self):
        """Test that large presentations get chunked correctly"""
        # Create a large structure with many slides
        slides = []
        for i in range(50):  # 50 slides
            slide = {
                "slideNumber": i + 1,
                "elements": [
                    {
                        "id": f"slide{i+1}_shape{j}",
                        "text": "Lorem ipsum dolor sit amet " * 20,  # Long text
                        "maxLength": 500
                    }
                    for j in range(5)  # 5 elements per slide
                ]
            }
            slides.append(slide)
        
        structure = {"slides": slides}
        
        chunks = chunk_placeholder_structure(
            structure,
            system_prompt="System prompt",
            user_prompt="User prompt",
            max_input_tokens=5000  # Lower limit to force chunking
        )
        
        # Should be split into multiple chunks
        self.assertGreater(len(chunks), 1)
        
        # Verify all slides are present across chunks
        total_slides = sum(len(chunk.get("slides", [])) for chunk in chunks)
        self.assertEqual(total_slides, 50)
    
    def test_combine_chunked_results(self):
        """Test combining multiple chunk results"""
        chunk1 = {
            "slides": [
                {"slideNumber": 1, "elements": [{"id": "s1", "text": "Slide 1"}]},
                {"slideNumber": 2, "elements": [{"id": "s2", "text": "Slide 2"}]}
            ]
        }
        
        chunk2 = {
            "slides": [
                {"slideNumber": 3, "elements": [{"id": "s3", "text": "Slide 3"}]},
                {"slideNumber": 4, "elements": [{"id": "s4", "text": "Slide 4"}]}
            ]
        }
        
        combined = combine_chunked_results([chunk1, chunk2])
        
        # Should have all 4 slides
        self.assertEqual(len(combined["slides"]), 4)
        
        # Should be in order
        slide_numbers = [s["slideNumber"] for s in combined["slides"]]
        self.assertEqual(slide_numbers, [1, 2, 3, 4])
    
    def test_combine_single_chunk(self):
        """Test that combining a single chunk returns it unchanged"""
        chunk = {
            "slides": [
                {"slideNumber": 1, "elements": [{"id": "s1", "text": "Slide 1"}]}
            ]
        }
        
        combined = combine_chunked_results([chunk])
        self.assertEqual(combined, chunk)
    
    def test_combine_empty_chunks(self):
        """Test combining empty chunk list"""
        combined = combine_chunked_results([])
        self.assertEqual(combined, {"slides": []})
    
    def test_get_optimal_batch_size(self):
        """Test optimal batch size calculation"""
        # 100 slides, 200 tokens each, 8000 max tokens, 2000 base
        batch_size = get_optimal_batch_size(
            total_slides=100,
            avg_tokens_per_slide=200,
            max_input_tokens=8000,
            base_tokens=2000
        )
        
        # Should be (8000 - 2000) / 200 = 30
        self.assertEqual(batch_size, 30)
    
    def test_slide_ordering_preserved(self):
        """Test that slide ordering is preserved after chunking and combining"""
        slides = [
            {"slideNumber": i, "elements": [{"id": f"s{i}", "text": f"Slide {i}"}]}
            for i in range(1, 11)
        ]
        
        structure = {"slides": slides}
        
        chunks = chunk_placeholder_structure(
            structure,
            system_prompt="Test",
            user_prompt="Test",
            max_input_tokens=3000  # Force chunking
        )
        
        # Simulate processing (just return chunks as-is)
        combined = combine_chunked_results(chunks)
        
        # Verify all slides present and in order
        result_numbers = [s["slideNumber"] for s in combined["slides"]]
        expected_numbers = list(range(1, 11))
        self.assertEqual(result_numbers, expected_numbers)


if __name__ == "__main__":
    unittest.main()
