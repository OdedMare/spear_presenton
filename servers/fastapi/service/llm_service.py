"""
LLM Service - Business logic for LLM interactions.

Handles all LLM provider integrations (OpenAI, custom endpoints, etc.),
structured output generation, tool calling, and prompt management.

This is a CRITICAL service used by almost all presentation generation features.
Migrated from services/llm_client.py to follow clean architecture.
"""

import dirtyjson
import json
from typing import AsyncGenerator, List, Optional
from fastapi import HTTPException
from openai import AsyncOpenAI
from openai.types.chat.chat_completion_chunk import (
    ChatCompletionChunk as OpenAIChatCompletionChunk,
)
from enums.llm_provider import LLMProvider
from models.llm_message import (
    OpenAIAssistantMessage,
    LLMMessage,
    LLMSystemMessage,
    LLMUserMessage,
)
from models.llm_tool_call import (
    LLMToolCall,
    OpenAIToolCall,
    OpenAIToolCallFunction,
)
from models.llm_tools import LLMDynamicTool, LLMTool
from services.llm_tool_calls_handler import LLMToolCallsHandler
from utils.async_iterator import iterator_to_async
from utils.dummy_functions import do_nothing_async
from utils.get_env import (
    get_custom_llm_api_key_env,
    get_custom_llm_url_env,
    get_disable_thinking_env,
    get_openai_api_key_env,
    get_tool_calls_env,
    get_web_grounding_env,
)
from utils.llm_provider import get_llm_provider, get_model
from utils.parsers import parse_bool_or_none
from utils.schema_utils import (
    ensure_strict_json_schema,
)
from utils.model_capabilities import (
    is_small_model,
    get_prompt_mode,
    should_use_strict_json,
    get_max_retries,
)
from utils.json_repair import parse_llm_json
from utils.llm_retry import retry_with_backoff, retry_with_fallback
from common.logger import logger


class LLMService:
    """
    LLM Service - Handles all LLM provider interactions.

    Supports multiple providers (OpenAI, Custom/Ollama, etc.)
    and provides structured output generation capabilities.
    """
    def __init__(self):
        self.llm_provider = get_llm_provider()
        self._client = self._get_client()
        self.tool_calls_handler = LLMToolCallsHandler(self)

    # ? Model capability detection
    def is_small_model(self, model: str) -> bool:
        """Check if model is a small/weak model needing simplified prompts."""
        return is_small_model(model)

    def get_adaptive_strict_mode(self, model: str) -> bool:
        """
        Determine if strict JSON validation should be used based on model capability.

        Small models work better with relaxed validation.
        """
        return should_use_strict_json(model)

    def get_adaptive_max_retries(self, model: str) -> int:
        """Get appropriate number of retries based on model capability."""
        return get_max_retries(model)

    # ? Use tool calls
    def use_tool_calls_for_structured_output(self) -> bool:
        if self.llm_provider != LLMProvider.CUSTOM:
            return False
        return parse_bool_or_none(get_tool_calls_env()) or False

    # ? Disable thinking
    def disable_thinking(self) -> bool:
        return parse_bool_or_none(get_disable_thinking_env()) or False

    # ? Enable web grounding
    def enable_web_grounding(self) -> bool:
        return parse_bool_or_none(get_web_grounding_env()) or False

    # ? Check if model supports structured outputs (JSON schema)
    def supports_structured_outputs(self, model: str) -> bool:
        """
        Check if the given model supports structured outputs with JSON schema.

        For OpenAI: Only newer models support json_schema response_format.
        For Custom/Ollama/Qwen: We assume they might support it and let
        the error handling catch any issues if they don't.
        """
        if self.llm_provider != LLMProvider.OPENAI:
            # For custom providers (Ollama, Qwen, LM Studio, etc.),
            # we can't know capabilities in advance. Return True to try
            # structured outputs first, with fallback to tool calls on error.
            return True

        # Known OpenAI models that support structured outputs
        # Using a prefix-based whitelist for OpenAI only
        supported_prefixes = [
            "gpt-4o",  # matches gpt-4o, gpt-4o-mini, gpt-4o-2024-08-06, etc.
            "chatgpt-4o",
        ]

        # Check if model starts with any supported prefix
        for prefix in supported_prefixes:
            if model.startswith(prefix):
                return True

        # For older OpenAI models, use tool calls instead
        return False

    # ? Clients
    def _get_client(self):
        match self.llm_provider:
            case LLMProvider.OPENAI:
                return self._get_openai_client()
            case LLMProvider.CUSTOM:
                return self._get_custom_client()
            case _:
                raise HTTPException(
                    status_code=400,
                    detail="LLM Provider must be either openai or custom",
                )

    def _get_openai_client(self):
        if not get_openai_api_key_env():
            raise HTTPException(
                status_code=400,
                detail="OpenAI API Key is not set",
            )
        return AsyncOpenAI()

    def _get_custom_client(self):
        if not get_custom_llm_url_env():
            raise HTTPException(
                status_code=400,
                detail="Custom LLM URL is not set",
            )
        return AsyncOpenAI(
            base_url=get_custom_llm_url_env(),
            api_key=get_custom_llm_api_key_env() or "null",
        )

    # ? Prompts
    def _get_system_prompt(self, messages: List[LLMMessage]) -> str:
        for message in messages:
            if isinstance(message, LLMSystemMessage):
                return message.content
        return ""

    # ? Generate Unstructured Content
    async def _generate_openai(
        self,
        model: str,
        messages: List[LLMMessage],
        max_tokens: Optional[int] = None,
        tools: Optional[List[dict]] = None,
        extra_body: Optional[dict] = None,
        depth: int = 0,
    ) -> str | None:
        client: AsyncOpenAI = self._client
        response = await client.chat.completions.create(
            model=model,
            messages=[message.model_dump() for message in messages],
            max_completion_tokens=max_tokens,
            tools=tools,
            extra_body=extra_body,
        )
        tool_calls = response.choices[0].message.tool_calls
        if tool_calls:
            parsed_tool_calls = [
                OpenAIToolCall(
                    id=tool_call.id,
                    type=tool_call.type,
                    function=OpenAIToolCallFunction(
                        name=tool_call.function.name,
                        arguments=tool_call.function.arguments,
                    ),
                )
                for tool_call in tool_calls
            ]
            tool_call_messages = await self.tool_calls_handler.handle_tool_calls_openai(
                parsed_tool_calls
            )
            assistant_message = OpenAIAssistantMessage(
                role="assistant",
                content=response.choices[0].message.content,
                tool_calls=[tool_call.model_dump() for tool_call in parsed_tool_calls],
            )
            new_messages = [
                *messages,
                assistant_message,
                *tool_call_messages,
            ]
            return await self._generate_openai(
                model=model,
                messages=new_messages,
                max_tokens=max_tokens,
                tools=tools,
                extra_body=extra_body,
                depth=depth + 1,
            )

        return response.choices[0].message.content

    async def _generate_custom(
        self,
        model: str,
        messages: List[LLMMessage],
        max_tokens: Optional[int] = None,
        depth: int = 0,
    ):
        extra_body = {"enable_thinking": False} if self.disable_thinking() else None
        return await self._generate_openai(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            extra_body=extra_body,
            depth=depth,
        )

    async def generate(
        self,
        model: str,
        messages: List[LLMMessage],
        max_tokens: Optional[int] = None,
        tools: Optional[List[type[LLMTool] | LLMDynamicTool]] = None,
    ):
        parsed_tools = self.tool_calls_handler.parse_tools(tools)

        content = None
        match self.llm_provider:
            case LLMProvider.OPENAI:
                content = await self._generate_openai(
                    model=model,
                    messages=messages,
                    max_tokens=max_tokens,
                    tools=parsed_tools,
                )
            case LLMProvider.CUSTOM:
                content = await self._generate_custom(
                    model=model, messages=messages, max_tokens=max_tokens
                )
        if content is None:
            raise HTTPException(
                status_code=400,
                detail="LLM did not return any content",
            )
        return content

    # ? Generate Structured Content
    async def _generate_openai_structured(
        self,
        model: str,
        messages: List[LLMMessage],
        response_format: dict,
        strict: bool = False,
        max_tokens: Optional[int] = None,
        tools: Optional[List[dict]] = None,
        extra_body: Optional[dict] = None,
        depth: int = 0,
    ) -> dict | None:
        client: AsyncOpenAI = self._client
        response_schema = response_format
        all_tools = [*tools] if tools else None

        # Use tool calls for structured output if:
        # 1. Custom LLM explicitly requests it, OR
        # 2. OpenAI model doesn't support structured outputs
        use_tool_calls_for_structured_output = (
            self.use_tool_calls_for_structured_output() or
            not self.supports_structured_outputs(model)
        )

        if strict and depth == 0:
            response_schema = ensure_strict_json_schema(
                response_schema,
                path=(),
                root=response_schema,
            )
        if use_tool_calls_for_structured_output and depth == 0:
            if all_tools is None:
                all_tools = []
            all_tools.append(
                self.tool_calls_handler.parse_tool(
                    LLMDynamicTool(
                        name="ResponseSchema",
                        description="Provide response to the user",
                        parameters=response_schema,
                        handler=do_nothing_async,
                    ),
                    strict=strict,
                )
            )

        # Try to use structured outputs, with fallback to tool calls if not supported
        try:
            response = await client.chat.completions.create(
                model=model,
                messages=[message.model_dump() for message in messages],
                response_format=(
                    {
                        "type": "json_schema",
                        "json_schema": (
                            {
                                "name": "ResponseSchema",
                                "strict": strict,
                                "schema": response_schema,
                            }
                        ),
                    }
                    if not use_tool_calls_for_structured_output
                    else None
                ),
                max_completion_tokens=max_tokens,
                tools=all_tools,
                extra_body=extra_body,
            )
        except Exception as e:
            # If structured outputs fail (e.g., model doesn't support it),
            # retry with tool calls instead
            error_message = str(e).lower()
            if ("response_format" in error_message or "json_schema" in error_message) and depth == 0:
                # Retry with tool calls
                if all_tools is None:
                    all_tools = []
                all_tools.append(
                    self.tool_calls_handler.parse_tool(
                        LLMDynamicTool(
                            name="ResponseSchema",
                            description="Provide response to the user",
                            parameters=response_schema,
                            handler=do_nothing_async,
                        ),
                        strict=strict,
                    )
                )
                response = await client.chat.completions.create(
                    model=model,
                    messages=[message.model_dump() for message in messages],
                    response_format=None,  # Don't use json_schema
                    max_completion_tokens=max_tokens,
                    tools=all_tools,
                    extra_body=extra_body,
                )
            else:
                # Re-raise if it's a different error
                raise

        content = response.choices[0].message.content

        tool_calls = response.choices[0].message.tool_calls
        has_response_schema = False

        if tool_calls:
            for tool_call in tool_calls:
                if tool_call.function.name == "ResponseSchema":
                    content = tool_call.function.arguments
                    has_response_schema = True

            if not has_response_schema:
                parsed_tool_calls = [
                    OpenAIToolCall(
                        id=tool_call.id,
                        type=tool_call.type,
                        function=OpenAIToolCallFunction(
                            name=tool_call.function.name,
                            arguments=tool_call.function.arguments,
                        ),
                    )
                    for tool_call in tool_calls
                ]
                tool_call_messages = (
                    await self.tool_calls_handler.handle_tool_calls_openai(
                        parsed_tool_calls
                    )
                )
                new_messages = [
                    *messages,
                    OpenAIAssistantMessage(
                        role="assistant",
                        content=response.choices[0].message.content,
                        tool_calls=[each.model_dump() for each in parsed_tool_calls],
                    ),
                    *tool_call_messages,
                ]
                content = await self._generate_openai_structured(
                    model=model,
                    messages=new_messages,
                    response_format=response_schema,
                    strict=strict,
                    max_tokens=max_tokens,
                    tools=all_tools,
                    extra_body=extra_body,
                    depth=depth + 1,
                )
        if content:
            if depth == 0:
                # Try relaxed JSON parsing for better small model support
                try:
                    # First try standard JSON parsing
                    return dict(dirtyjson.loads(content))
                except Exception as e:
                    logger.warning(f"Standard JSON parsing failed: {e}. Attempting repair...")
                    try:
                        # Use advanced JSON repair strategies
                        repaired = parse_llm_json(content, strict=False, repair=True)
                        if isinstance(repaired, dict):
                            return repaired
                        else:
                            raise ValueError(f"Repaired JSON is not a dict: {type(repaired)}")
                    except Exception as repair_error:
                        logger.error(f"JSON repair also failed: {repair_error}")
                        # Re-raise original error
                        raise e
            return content
        return None

    async def _generate_custom_structured(
        self,
        model: str,
        messages: List[LLMMessage],
        response_format: dict,
        strict: bool = False,
        max_tokens: Optional[int] = None,
        depth: int = 0,
    ):
        extra_body = {"enable_thinking": False} if self.disable_thinking() else None
        return await self._generate_openai_structured(
            model=model,
            messages=messages,
            response_format=response_format,
            strict=strict,
            max_tokens=max_tokens,
            extra_body=extra_body,
            depth=depth,
        )

    async def generate_structured(
        self,
        model: str,
        messages: List[LLMMessage],
        response_format: dict,
        strict: bool = False,
        tools: Optional[List[type[LLMTool] | LLMDynamicTool]] = None,
        max_tokens: Optional[int] = None,
    ) -> dict:
        """
        Generate structured output with adaptive retry logic and relaxed validation.

        For small models:
        - Automatically adjusts strict mode based on model capability
        - Uses more retry attempts with exponential backoff
        - Falls back to relaxed JSON parsing if strict parsing fails
        """
        parsed_tools = self.tool_calls_handler.parse_tools(tools)

        # Adapt strict mode based on model capability
        adaptive_strict = strict and self.get_adaptive_strict_mode(model)
        is_small = self.is_small_model(model)
        max_retries = self.get_adaptive_max_retries(model)

        if is_small:
            logger.info(
                f"Small model detected: {model}. "
                f"Using adaptive mode: strict={adaptive_strict}, retries={max_retries}"
            )

        # Define primary generation function
        async def generate_with_strict():
            match self.llm_provider:
                case LLMProvider.OPENAI:
                    return await self._generate_openai_structured(
                        model=model,
                        messages=messages,
                        response_format=response_format,
                        strict=adaptive_strict,
                        tools=parsed_tools,
                        max_tokens=max_tokens,
                    )
                case LLMProvider.CUSTOM:
                    return await self._generate_custom_structured(
                        model=model,
                        messages=messages,
                        response_format=response_format,
                        strict=adaptive_strict,
                        max_tokens=max_tokens,
                    )

        # Define fallback function with relaxed validation
        async def generate_with_relaxed():
            logger.info("Falling back to relaxed JSON validation")
            match self.llm_provider:
                case LLMProvider.OPENAI:
                    return await self._generate_openai_structured(
                        model=model,
                        messages=messages,
                        response_format=response_format,
                        strict=False,
                        tools=parsed_tools,
                        max_tokens=max_tokens,
                    )
                case LLMProvider.CUSTOM:
                    return await self._generate_custom_structured(
                        model=model,
                        messages=messages,
                        response_format=response_format,
                        strict=False,
                        max_tokens=max_tokens,
                    )

        try:
            # Try with retry logic and fallback
            logger.info(f"Starting structured generation with model {model} (provider: {self.llm_provider})")
            content = await retry_with_fallback(
                primary_func=generate_with_strict,
                fallback_func=generate_with_relaxed if adaptive_strict else None,
                max_retries=max_retries,
                is_small_model=is_small,
            )

            if content is None:
                raise HTTPException(
                    status_code=400,
                    detail="LLM did not return any content",
                )

            return content

        except Exception as e:
            logger.error(f"Structured generation failed after all retries: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate structured output: {str(e)}",
            )

    # ? Stream Unstructured Content
    async def _stream_openai(
        self,
        model: str,
        messages: List[LLMMessage],
        max_tokens: Optional[int] = None,
        tools: Optional[List[dict]] = None,
        response_format: Optional[dict] = None,
        extra_body: Optional[dict] = None,
        depth: int = 0,
    ) -> AsyncGenerator[str, None]:
        client: AsyncOpenAI = self._client
        stream = await client.chat.completions.create(
            model=model,
            messages=[message.model_dump() for message in messages],
            max_completion_tokens=max_tokens,
            tools=tools,
            response_format=response_format,
            extra_body=extra_body,
            stream=True,
            stream_options={"include_usage": True},
        )

        tool_calls_dict = {}
        full_content = ""

        async for chunk in stream:
            chunk: OpenAIChatCompletionChunk
            delta = chunk.choices[0].delta if chunk.choices else None

            if delta and delta.content:
                full_content += delta.content
                yield delta.content

            if delta and delta.tool_calls:
                for tool_call_chunk in delta.tool_calls:
                    idx = tool_call_chunk.index
                    if idx not in tool_calls_dict:
                        tool_calls_dict[idx] = {
                            "id": tool_call_chunk.id or "",
                            "type": tool_call_chunk.type or "function",
                            "function": {
                                "name": tool_call_chunk.function.name or "",
                                "arguments": tool_call_chunk.function.arguments or "",
                            },
                        }
                    else:
                        if tool_call_chunk.id:
                            tool_calls_dict[idx]["id"] = tool_call_chunk.id
                        if tool_call_chunk.type:
                            tool_calls_dict[idx]["type"] = tool_call_chunk.type
                        if tool_call_chunk.function.name:
                            tool_calls_dict[idx]["function"]["name"] = (
                                tool_call_chunk.function.name
                            )
                        if tool_call_chunk.function.arguments:
                            tool_calls_dict[idx]["function"]["arguments"] += (
                                tool_call_chunk.function.arguments
                            )

        if tool_calls_dict:
            tool_calls = [
                OpenAIToolCall(
                    id=tc["id"],
                    type=tc["type"],
                    function=OpenAIToolCallFunction(
                        name=tc["function"]["name"],
                        arguments=tc["function"]["arguments"],
                    ),
                )
                for tc in tool_calls_dict.values()
            ]

            tool_call_messages = await self.tool_calls_handler.handle_tool_calls_openai(
                tool_calls
            )
            assistant_message = OpenAIAssistantMessage(
                role="assistant",
                content=full_content or None,
                tool_calls=[tc.model_dump() for tc in tool_calls],
            )
            new_messages = [
                *messages,
                assistant_message,
                *tool_call_messages,
            ]

            async for content in self._stream_openai(
                model=model,
                messages=new_messages,
                max_tokens=max_tokens,
                tools=tools,
                extra_body=extra_body,
                depth=depth + 1,
            ):
                yield content

    async def _stream_custom(
        self,
        model: str,
        messages: List[LLMMessage],
        max_tokens: Optional[int] = None,
        depth: int = 0,
    ):
        extra_body = {"enable_thinking": False} if self.disable_thinking() else None
        async for content in self._stream_openai(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            extra_body=extra_body,
            depth=depth,
        ):
            yield content

    async def stream(
        self,
        model: str,
        messages: List[LLMMessage],
        max_tokens: Optional[int] = None,
        tools: Optional[List[type[LLMTool] | LLMDynamicTool]] = None,
    ) -> AsyncGenerator[str, None]:
        parsed_tools = self.tool_calls_handler.parse_tools(tools)

        match self.llm_provider:
            case LLMProvider.OPENAI:
                async for content in self._stream_openai(
                    model=model,
                    messages=messages,
                    max_tokens=max_tokens,
                    tools=parsed_tools,
                ):
                    yield content
            case LLMProvider.CUSTOM:
                async for content in self._stream_custom(
                    model=model, messages=messages, max_tokens=max_tokens
                ):
                    yield content

    async def stream_structured(
        self,
        model: str,
        messages: List[LLMMessage],
        response_format: dict,
        strict: bool = False,
        tools: Optional[List[type[LLMTool] | LLMDynamicTool]] = None,
        max_tokens: Optional[int] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Stream structured output from LLM.
        """
        # Adapt strict mode
        adaptive_strict = strict and self.get_adaptive_strict_mode(model)
        
        # Check if we can use native structured output streaming (OpenAI only for now)
        can_stream_structured = (
            (self.llm_provider == LLMProvider.OPENAI or self.llm_provider == LLMProvider.CUSTOM) and 
            self.supports_structured_outputs(model) and
            not self.use_tool_calls_for_structured_output()
        )

        if can_stream_structured:
            logger.info(f"Using native structured streaming for model {model}")
            schema_to_use = response_format
            if adaptive_strict:
                schema_to_use = ensure_strict_json_schema(
                    response_format, path=(), root=response_format
                )

            json_schema_format = {
                "type": "json_schema",
                "json_schema": {
                    "name": "ResponseSchema",
                    "strict": adaptive_strict,
                    "schema": schema_to_use,
                },
            }
            
            parsed_tools = self.tool_calls_handler.parse_tools(tools)
            
            # Use native streaming
            try:
                async for chunk in self._stream_openai(
                    model=model,
                    messages=messages,
                    response_format=json_schema_format,
                    tools=parsed_tools,
                    max_tokens=max_tokens
                ):
                    yield chunk
                return
            except Exception as e:
                logger.warning(f"Streaming structured output failed: {e}. Falling back to non-streaming.")
                # Fallback to non-streaming below
        
        # Fallback: Use non-streaming method and yield result at the end
        # We yield a single space as a preliminary heartbeat to help with some proxies
        logger.info(f"Model {model} (provider: {self.llm_provider}) does not support native structured streaming. Using non-streaming fallback.")
        yield " " 
        
        result = await self.generate_structured(
            model=model,
            messages=messages,
            response_format=response_format,
            strict=strict,
            tools=tools,
            max_tokens=max_tokens,
        )
        import json
        yield json.dumps(result)


# Backward compatibility alias
LLMClient = LLMService
