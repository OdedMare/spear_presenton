import asyncio
import json
from typing import Optional
from pydantic import BaseModel, Field


from openai import AsyncOpenAI
from constants.llm import DEFAULT_OPENAI_MODEL


class HeadingDescription(BaseModel):
    heading: str = Field(
        description="Heading of the slide", min_length=10, max_length=20
    )
    description: str = Field(
        description="Description of the slide", min_length=40, max_length=200
    )


class SlideContentTest(BaseModel):
    title: str = Field(description="Title of the slide", min_length=10, max_length=20)
    first_content: HeadingDescription = Field(description="First content of the slide")
    second_content: HeadingDescription = Field(
        description="Second content of the slide"
    )
    third_content: HeadingDescription = Field(description="Third content of the slide")


class ColumnContentModel(BaseModel):
    title: str = Field(min_length=3, max_length=100, description="Column title")
    content: str = Field(min_length=10, max_length=800, description="Column content")


class TwoColumnSlideModel(BaseModel):
    title: str = Field(
        min_length=3,
        max_length=100,
        description="Title of the slide",
    )
    subtitle: Optional[str] = Field(
        min_length=3,
        max_length=150,
        description="Optional subtitle or description",
    )
    leftColumn: ColumnContentModel = Field(
        description="Left column content",
    )
    rightColumn: ColumnContentModel = Field(
        description="Right column content",
    )
    backgroundImage: Optional[str] = Field(
        description="URL to background image for the slide"
    )


def test_openai_schema_support():
    client = AsyncOpenAI()
    response = asyncio.run(
        client.beta.chat.completions.parse(
            model=DEFAULT_OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Generate a slide for a presentation"},
            ],
            response_format=TwoColumnSlideModel,
        )
    )
    print(response.choices[0].message.parsed)
