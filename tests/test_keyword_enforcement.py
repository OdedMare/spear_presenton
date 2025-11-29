
import unittest
import sys
import os
import json
from unittest.mock import MagicMock, patch, AsyncMock

# Add server directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), "../servers/fastapi"))

from api.v1.ppt.endpoints.content_rewrite import generate_rewritten_content, RewriteRequest, RewriteMode

class TestKeywordEnforcement(unittest.IsolatedAsyncioTestCase):
    
    async def test_keyword_validation_success(self):
        """Test that validation passes when keywords are present"""
        
        # Mock request
        request = RewriteRequest(
            user_prompt="Rewrite this",
            placeholder_structure={
                "slides": [{
                    "slideNumber": 1,
                    "elements": [{"id": "s1_e1", "type": "shape", "text": "Original", "maxLength": 100}]
                }]
            },
            mode=RewriteMode.STRICT,
            keywords=["Important", "Term"]
        )
        
        # Mock LLM response
        mock_rewritten_content = {
            "slides": [{
                "slideNumber": 1,
                "elements": [{"id": "s1_e1", "type": "shape", "text": "This is an Important Term in the text"}]
            }]
        }
        
        with patch("api.v1.ppt.endpoints.content_rewrite.LLMClient") as MockClient:
            instance = MockClient.return_value
            instance.generate = AsyncMock(return_value=json.dumps(mock_rewritten_content))
            
            # Should not raise exception
            response = await generate_rewritten_content(request)
            self.assertIsNotNone(response)

    async def test_keyword_validation_failure(self):
        """Test that validation fails when keywords are missing"""
        
        # Mock request
        request = RewriteRequest(
            user_prompt="Rewrite this",
            placeholder_structure={
                "slides": [{
                    "slideNumber": 1,
                    "elements": [{"id": "s1_e1", "type": "shape", "text": "Original", "maxLength": 100}]
                }]
            },
            mode=RewriteMode.STRICT,
            keywords=["MissingTerm"]
        )
        
        # Mock LLM response (missing the keyword)
        mock_rewritten_content = {
            "slides": [{
                "slideNumber": 1,
                "elements": [{"id": "s1_e1", "type": "shape", "text": "This text does not have the term"}]
            }]
        }
        
        with patch("api.v1.ppt.endpoints.content_rewrite.LLMClient") as MockClient:
            instance = MockClient.return_value
            instance.generate = AsyncMock(return_value=json.dumps(mock_rewritten_content))
            
            # Should raise HTTPException due to ValueError in validation
            from fastapi import HTTPException
            with self.assertRaises(HTTPException) as cm:
                await generate_rewritten_content(request)
            
            self.assertIn("Rewritten content missing required keywords: MissingTerm", cm.exception.detail)

if __name__ == "__main__":
    unittest.main()
