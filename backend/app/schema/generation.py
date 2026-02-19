from pydantic import BaseModel, Field
from typing import Optional, List

class LoreItem(BaseModel):
    category: str = Field(..., description="Category of lore: character, setting, or plot point")
    text: str = Field(..., description="The lore content text")

class GenerateRequest(BaseModel):
    text: str = Field(...)
    additional_instructions: Optional[str] = Field(None)
    word_count: int = Field(256, description="Number of words to generate.", example=100)
    current_position: Optional[int] = None
    selected_text: Optional[str] = Field(None, description="Selected passage for modification")
    text_before: Optional[str] = Field(None, description="Story text preceding the selected passage")
    text_after: Optional[str] = Field(None, description="Story text following the selected passage")
    lore: Optional[List[LoreItem]] = Field(None, description="Story context and lore items")
    provider: Optional[str] = Field(None, description="LLM provider: xai, openai, anthropic")
    model: Optional[str] = Field(None, description="Model name (e.g., gpt-4o, claude-sonnet-4)")
    api_key: Optional[str] = Field(None, description="API key (overridden by .env)")

class GenerateResponse(BaseModel):
    generated_text: str = Field(...)