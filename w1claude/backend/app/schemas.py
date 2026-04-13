from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TagBase(BaseModel):
    name: str


class TagCreate(TagBase):
    pass


class TagOut(TagBase):
    id: int

    model_config = {"from_attributes": True}


class TicketCreate(BaseModel):
    title: str
    description: Optional[str] = None
    tag_ids: list[int] = []


class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class TicketStatusUpdate(BaseModel):
    status: str  # "open" | "done"


class TicketOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: str
    tags: list[TagOut]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
