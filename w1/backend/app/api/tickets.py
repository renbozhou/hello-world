from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.errors import bad_request, not_found
from app.models import Tag, Ticket, TicketTag
from app.schemas.tag import TagBindInput, TagOut
from app.schemas.ticket import TicketCreate, TicketListOut, TicketOut, TicketUpdate

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("", response_model=TicketListOut)
def list_tickets(
    q: str | None = None,
    tag_id: UUID | None = None,
    untagged: bool = False,
    completed: bool | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> TicketListOut:
    if untagged and tag_id is not None:
        raise bad_request("untagged 和 tag_id 不能同时传入")

    stmt = select(Ticket).options(selectinload(Ticket.tags))
    count_stmt = select(func.count(func.distinct(Ticket.id)))

    if q:
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(Ticket.title.ilike(pattern))
        count_stmt = count_stmt.where(Ticket.title.ilike(pattern))

    if completed is not None:
        stmt = stmt.where(Ticket.is_completed == completed)
        count_stmt = count_stmt.where(Ticket.is_completed == completed)

    if tag_id is not None:
        stmt = stmt.join(TicketTag, TicketTag.ticket_id == Ticket.id).where(TicketTag.tag_id == tag_id)
        count_stmt = count_stmt.join(TicketTag, TicketTag.ticket_id == Ticket.id).where(TicketTag.tag_id == tag_id)

    if untagged:
        stmt = stmt.outerjoin(TicketTag, TicketTag.ticket_id == Ticket.id).where(TicketTag.ticket_id.is_(None))
        count_stmt = count_stmt.outerjoin(TicketTag, TicketTag.ticket_id == Ticket.id).where(TicketTag.ticket_id.is_(None))

    total = db.scalar(count_stmt) or 0
    items = list(
        db.scalars(
            stmt.order_by(Ticket.updated_at.desc()).limit(limit).offset(offset)
        ).all()
    )
    return TicketListOut(items=items, total=total, limit=limit, offset=offset)


@router.post("", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
def create_ticket(payload: TicketCreate, db: Session = Depends(get_db)) -> Ticket:
    ticket = Ticket(title=payload.title, description=payload.description)
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(ticket_id: UUID, db: Session = Depends(get_db)) -> Ticket:
    stmt = select(Ticket).where(Ticket.id == ticket_id).options(selectinload(Ticket.tags))
    ticket = db.scalar(stmt)
    if ticket is None:
        raise not_found("ticket")
    return ticket


@router.patch("/{ticket_id}", response_model=TicketOut)
def update_ticket(ticket_id: UUID, payload: TicketUpdate, db: Session = Depends(get_db)) -> Ticket:
    ticket = db.get(Ticket, ticket_id)
    if ticket is None:
        raise not_found("ticket")

    if payload.title is not None:
        ticket.title = payload.title
    if payload.description is not None:
        ticket.description = payload.description
    ticket.updated_at = datetime.now(timezone.utc)

    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(ticket_id: UUID, db: Session = Depends(get_db)) -> Response:
    ticket = db.get(Ticket, ticket_id)
    if ticket is None:
        raise not_found("ticket")
    db.delete(ticket)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{ticket_id}/complete", response_model=TicketOut)
def complete_ticket(ticket_id: UUID, db: Session = Depends(get_db)) -> Ticket:
    ticket = db.get(Ticket, ticket_id)
    if ticket is None:
        raise not_found("ticket")

    ticket.is_completed = True
    ticket.completed_at = datetime.now(timezone.utc)
    ticket.updated_at = datetime.now(timezone.utc)
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.post("/{ticket_id}/uncomplete", response_model=TicketOut)
def uncomplete_ticket(ticket_id: UUID, db: Session = Depends(get_db)) -> Ticket:
    ticket = db.get(Ticket, ticket_id)
    if ticket is None:
        raise not_found("ticket")

    ticket.is_completed = False
    ticket.completed_at = None
    ticket.updated_at = datetime.now(timezone.utc)
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.post("/{ticket_id}/tags", response_model=TagOut)
def bind_ticket_tag(ticket_id: UUID, payload: TagBindInput, db: Session = Depends(get_db)) -> Tag:
    ticket = db.get(Ticket, ticket_id)
    if ticket is None:
        raise not_found("ticket")

    if payload.tag_id is None and payload.tag_name is None:
        raise bad_request("tag_id 或 tag_name 必须至少提供一个")

    tag: Tag | None = None
    if payload.tag_id is not None:
        tag = db.get(Tag, payload.tag_id)
        if tag is None:
            raise not_found("tag")
    elif payload.tag_name is not None:
        normalized = payload.tag_name.strip()
        if not normalized:
            raise bad_request("tag_name 不能为空")
        tag = db.scalar(select(Tag).where(Tag.name.ilike(normalized)))
        if tag is None:
            tag = Tag(name=normalized)
            db.add(tag)
            db.flush()

    assert tag is not None
    existing_relation = db.get(TicketTag, {"ticket_id": ticket_id, "tag_id": tag.id})
    if existing_relation is None:
        db.add(TicketTag(ticket_id=ticket_id, tag_id=tag.id))
        ticket.updated_at = datetime.now(timezone.utc)
        db.add(ticket)
        db.commit()
    else:
        db.commit()
    db.refresh(tag)
    return tag


@router.delete("/{ticket_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def unbind_ticket_tag(ticket_id: UUID, tag_id: UUID, db: Session = Depends(get_db)) -> Response:
    ticket = db.get(Ticket, ticket_id)
    if ticket is None:
        raise not_found("ticket")

    relation = db.get(TicketTag, {"ticket_id": ticket_id, "tag_id": tag_id})
    if relation is not None:
        db.delete(relation)
        ticket.updated_at = datetime.now(timezone.utc)
        db.add(ticket)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
