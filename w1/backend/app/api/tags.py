from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Tag
from app.schemas.tag import TagCreate, TagOut

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=list[TagOut])
def list_tags(db: Session = Depends(get_db)) -> list[Tag]:
    stmt = select(Tag).order_by(Tag.name.asc())
    return list(db.scalars(stmt).all())


@router.post("", response_model=TagOut, status_code=status.HTTP_201_CREATED)
def create_tag(payload: TagCreate, db: Session = Depends(get_db)) -> Tag:
    normalized = payload.name.strip()
    existing = db.scalar(select(Tag).where(Tag.name.ilike(normalized)))
    if existing is not None:
        return existing

    tag = Tag(name=normalized, color=payload.color)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag
