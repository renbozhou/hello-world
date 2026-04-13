from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import BaseSchema
from app.schemas.tag import TagOut


class TicketCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("title cannot be empty")
        return stripped


class TicketUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)

    @field_validator("title")
    @classmethod
    def validate_optional_title(cls, value: str | None) -> str | None:
        if value is None:
            return value
        stripped = value.strip()
        if not stripped:
            raise ValueError("title cannot be empty")
        return stripped


class TicketOut(BaseSchema):
    id: UUID
    title: str
    description: str | None
    is_completed: bool
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    tags: list[TagOut]


class TicketListOut(BaseModel):
    items: list[TicketOut]
    total: int
    limit: int
    offset: int
