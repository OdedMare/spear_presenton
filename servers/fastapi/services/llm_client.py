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
)
from utils.llm_provider import get_llm_provider, get_model
from utils.parsers import parse_bool_or_none
from utils.schema_utils import (
    ensure_strict_json_schema,
)


class LLMClient:
    def __init__(self):
        self.llm_provider = get_llm_provider()
        self._client = self._get_client()
        self.tool_calls_handler = LLMToolCallsHandler(self)

    # ? Use tool calls
    def use_tool_calls_for_structured_output(self) -> bool:
        if self.llm_provider != LLMProvider.CUSTOM:
            return False
        return parse_bool_or_none(get_tool_calls_env()) or False

    # ? Disable thinking
    def disable_thinking(self) -> bool:
        return parse_bool_or_none(get_disable_thinking_env()) or False

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

        use_tool_calls_for_structured_output = (
            self.use_tool_calls_for_structured_output()
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
                return dict(dirtyjson.loads(content))
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
        parsed_tools = self.tool_calls_handler.parse_tools(tools)

        content = None
        match self.llm_provider:
            case LLMProvider.OPENAI:
                content = await self._generate_openai_structured(
                    model=model,
                    messages=messages,
                    response_format=response_format,
                    strict=strict,
                    tools=parsed_tools,
                    max_tokens=max_tokens,
                )
            case LLMProvider.CUSTOM:
                content = await self._generate_custom_structured(
                    model=model,
                    messages=messages,
                    response_format=response_format,
                    strict=strict,
                    max_tokens=max_tokens,
                )
        if content is None:
            raise HTTPException(
                status_code=400,
                detail="LLM did not return any content",
            )
        return content

    # ? Stream Unstructured Content
    async def _stream_openai(
        self,
        model: str,
        messages: List[LLMMessage],
        max_tokens: Optional[int] = None,
        tools: Optional[List[dict]] = None,
        extra_body: Optional[dict] = None,
        depth: int = 0,
    ) -> AsyncGenerator[str, None]:
        client: AsyncOpenAI = self._client
        stream = await client.chat.completions.create(
            model=model,
            messages=[message.model_dump() for message in messages],
            max_completion_tokens=max_tokens,
            tools=tools,
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
        For now, this falls back to non-streaming generate_structured and yields the complete result.
        True streaming of structured output would require parsing partial JSON, which is complex.
        """
        # For now, we'll use the non-streaming method and yield the complete result
        # This maintains the async generator interface while we work on true streaming support
        result = await self.generate_structured(
            model=model,
            messages=messages,
            response_format=response_format,
            strict=strict,
            tools=tools,
            max_tokens=max_tokens,
        )
        # Convert the dict result to JSON string and yield it
        import json
        yield json.dumps(result)
