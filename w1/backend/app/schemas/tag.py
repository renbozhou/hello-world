from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema


class TagCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    color: str | None = Field(default=None, max_length=24)


class TagOut(BaseSchema):
    id: UUID
    name: str
    color: str | None
    created_at: datetime


class TagBindInput(BaseModel):
    tag_id: UUID | None = None
    tag_name: str | None = Field(default=None, min_length=1, max_length=50)
