from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/tickets", tags=["tickets"])


def _get_ticket_or_404(ticket_id: int, db: Session) -> models.Ticket:
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.get("", response_model=list[schemas.TicketOut])
def list_tickets(
    tag_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(models.Ticket)
    if tag_id is not None:
        q = q.filter(models.Ticket.tags.any(models.Tag.id == tag_id))
    if search:
        q = q.filter(models.Ticket.title.ilike(f"%{search}%"))
    if status:
        q = q.filter(models.Ticket.status == status)
    return q.order_by(models.Ticket.created_at.desc()).all()


@router.post("", response_model=schemas.TicketOut, status_code=201)
def create_ticket(body: schemas.TicketCreate, db: Session = Depends(get_db)):
    ticket = models.Ticket(title=body.title, description=body.description)
    if body.tag_ids:
        tags = db.query(models.Tag).filter(models.Tag.id.in_(body.tag_ids)).all()
        ticket.tags = tags
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.get("/{ticket_id}", response_model=schemas.TicketOut)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    return _get_ticket_or_404(ticket_id, db)


@router.put("/{ticket_id}", response_model=schemas.TicketOut)
def update_ticket(ticket_id: int, body: schemas.TicketUpdate, db: Session = Depends(get_db)):
    ticket = _get_ticket_or_404(ticket_id, db)
    if body.title is not None:
        ticket.title = body.title
    if body.description is not None:
        ticket.description = body.description
    db.commit()
    db.refresh(ticket)
    return ticket


@router.delete("/{ticket_id}", status_code=204)
def delete_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = _get_ticket_or_404(ticket_id, db)
    db.delete(ticket)
    db.commit()


@router.patch("/{ticket_id}/status", response_model=schemas.TicketOut)
def patch_status(ticket_id: int, body: schemas.TicketStatusUpdate, db: Session = Depends(get_db)):
    if body.status not in ("open", "done"):
        raise HTTPException(status_code=422, detail="status must be 'open' or 'done'")
    ticket = _get_ticket_or_404(ticket_id, db)
    ticket.status = body.status
    db.commit()
    db.refresh(ticket)
    return ticket


@router.post("/{ticket_id}/tags/{tag_id}", response_model=schemas.TicketOut)
def add_tag(ticket_id: int, tag_id: int, db: Session = Depends(get_db)):
    ticket = _get_ticket_or_404(ticket_id, db)
    tag = db.query(models.Tag).filter(models.Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    if tag not in ticket.tags:
        ticket.tags.append(tag)
        db.commit()
        db.refresh(ticket)
    return ticket


@router.delete("/{ticket_id}/tags/{tag_id}", response_model=schemas.TicketOut)
def remove_tag(ticket_id: int, tag_id: int, db: Session = Depends(get_db)):
    ticket = _get_ticket_or_404(ticket_id, db)
    tag = db.query(models.Tag).filter(models.Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    if tag in ticket.tags:
        ticket.tags.remove(tag)
        db.commit()
        db.refresh(ticket)
    return ticket
