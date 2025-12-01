"""
Tests for Content Rewrite Fallback Logic

Verifies that the system correctly falls back to Lite prompts when the Full prompt fails.
"""

import unittest
from unittest.mock import AsyncMock, patch, MagicMock
import sys
import os
import json

# Add server directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), "../servers/fastapi"))

from api.v1.ppt.endpoints.content_rewrite import generate_rewritten_content, RewriteRequest, RewriteMode
from api.v1.ppt.endpoints.prompts import (
    CONTENT_REWRITE_SYSTEM_PROMPT,
    CONTENT_REWRITE_LITE_SYSTEM_PROMPT
)

class TestContentRewriteFallback(unittest.IsolatedAsyncioTestCase):
    
    async def test_fallback_to_lite_prompt(self):
        """Test that we fall back to lite prompt if full prompt fails"""
        
        # Mock request
        request = RewriteRequest(
            user_prompt="Rewrite this",
            placeholder_structure={
                "slides": [
                    {
                        "slideNumber": 1,
                        "elements": [{"id": "s1", "text": "Old", "maxLength": 10}]
                    }
                ]
            },
            mode=RewriteMode.STRICT
        )
        
        # Mock LLM client
        mock_llm_client = AsyncMock()
        
        # First call fails (invalid JSON), second call succeeds
        mock_llm_client.generate.side_effect = [
            "Invalid JSON response",  # Full prompt fails
            json.dumps({              # Lite prompt succeeds
                "slides": [
                    {
                        "slideNumber": 1,
                        "elements": [{"id": "s1", "text": "New"}]
                    }
                ]
            })
        ]
        
        # Mock dependencies
        with patch("api.v1.ppt.endpoints.content_rewrite.LLMClient", return_value=mock_llm_client), \
             patch("api.v1.ppt.endpoints.content_rewrite.get_model", return_value="test-model"), \
             patch("api.v1.ppt.endpoints.content_rewrite.estimate_structure_tokens", return_value=100), \
             patch("api.v1.ppt.endpoints.content_rewrite.chunk_placeholder_structure") as mock_chunk:
            
            # Setup chunk mock to return the input structure as a single chunk
            mock_chunk.return_value = [{"slides": request.placeholder_structure["slides"]}]
            
            # Run function
            response = await generate_rewritten_content(request)
            
            # Verify result
            self.assertEqual(response.rewritten_content["slides"][0]["elements"][0]["text"], "New")
            
            # Verify LLM was called twice
            self.assertEqual(mock_llm_client.generate.call_count, 2)
            
            # Verify first call used Full prompt
            first_call_args = mock_llm_client.generate.call_args_list[0]
            self.assertIn(CONTENT_REWRITE_SYSTEM_PROMPT, first_call_args.kwargs["messages"][0].content)
            
            # Verify second call used Lite prompt
            second_call_args = mock_llm_client.generate.call_args_list[1]
            self.assertIn(CONTENT_REWRITE_LITE_SYSTEM_PROMPT, second_call_args.kwargs["messages"][0].content)

    async def test_success_with_full_prompt(self):
        """Test that we don't use lite prompt if full prompt succeeds"""
        
        request = RewriteRequest(
            user_prompt="Rewrite this",
            placeholder_structure={"slides": []},
            mode=RewriteMode.STRICT
        )
        
        mock_llm_client = AsyncMock()
        mock_llm_client.generate.return_value = json.dumps({"slides": []})
        
        with patch("api.v1.ppt.endpoints.content_rewrite.LLMClient", return_value=mock_llm_client), \
             patch("api.v1.ppt.endpoints.content_rewrite.get_model", return_value="test-model"), \
             patch("api.v1.ppt.endpoints.content_rewrite.estimate_structure_tokens", return_value=100), \
             patch("api.v1.ppt.endpoints.content_rewrite.chunk_placeholder_structure") as mock_chunk:
            
            mock_chunk.return_value = [{"slides": []}]
            
            await generate_rewritten_content(request)
            
            # Should only call once
            self.assertEqual(mock_llm_client.generate.call_count, 1)

if __name__ == "__main__":
    unittest.main()
