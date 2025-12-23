
import asyncio
import os
import sys
from typing import AsyncGenerator
from unittest.mock import MagicMock, AsyncMock, patch

# Add server directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), "../servers/fastapi"))

from services.llm_client import LLMClient
from models.llm_message import LLMUserMessage
from enums.llm_provider import LLMProvider

async def main():
    print("Starting Streaming Test...")
    
    # Mock environment getters
    with patch("services.llm_client.get_llm_provider", return_value=LLMProvider.OPENAI), \
         patch("services.llm_client.get_openai_api_key_env", return_value="sk-test"), \
         patch("services.llm_client.AsyncOpenAI") as mock_openai_cls:
        
        mock_client = AsyncMock()
        mock_openai_cls.return_value = mock_client
        
        # Mock streaming response
        async def mock_stream(*args, **kwargs):
            chunks = ["{", '"key":', ' "value"', "}"]
            for c in chunks:
                mock_chunk = MagicMock()
                mock_chunk.choices = [MagicMock()]
                mock_chunk.choices[0].delta.content = c
                mock_chunk.choices[0].delta.tool_calls = None
                yield mock_chunk
                
        mock_client.chat.completions.create.return_value = mock_stream()
        
        # Initialize client
        client = LLMClient()
        # Force OpenAI provider and supported model
        client.llm_provider = LLMProvider.OPENAI
        
        # Test stream_structured
        print("\nTesting stream_structured...")
        messages = [LLMUserMessage(content="Test")]
        schema = {"type": "object", "properties": {"key": {"type": "string"}}}
        
        collected_output = ""
        async for chunk in client.stream_structured(
            model="gpt-4o",
            messages=messages,
            response_format=schema,
            strict=True
        ):
            print(f"Received chunk: {chunk}")
            collected_output += chunk
            
        print(f"\nFinal collected output: {collected_output}")
        
        # Verify call arguments
        call_args = mock_client.chat.completions.create.call_args
        if call_args:
            kwargs = call_args.kwargs
            print(f"\nCall kwargs 'stream': {kwargs.get('stream')}")
            print(f"Call kwargs 'response_format': {kwargs.get('response_format')}")
            
            if kwargs.get('stream') is True and kwargs.get('response_format') is not None:
                print("\nSUCCESS: Streaming execution confirmed with response_format!")
            else:
                print("\nFAILURE: Did not call with stream=True or missing response_format")
        else:
            print("\nFAILURE: Client was not called")

if __name__ == "__main__":
    asyncio.run(main())
