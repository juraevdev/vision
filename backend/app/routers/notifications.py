from typing import Annotated

from fastapi import APIRouter, Query, Response, status
from sqlalchemy import func, select, update

from ..deps import DB, CurrentUser
from ..models import Notification, utcnow
from ..schemas import NotificationList

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationList)
def list_notifications(db: DB, user: CurrentUser, limit: Annotated[int, Query(ge=1, le=100)] = 12):
    unread = db.scalar(
        select(func.count(Notification.id)).where(
            Notification.user_id == user.id, Notification.read_at.is_(None)
        )
    )
    items = db.scalars(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.id.desc())
        .limit(limit)
    ).all()
    return NotificationList(unread=unread or 0, items=items)


@router.post("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_read(notification_id: int, db: DB, user: CurrentUser):
    db.execute(
        update(Notification)
        .where(
            Notification.id == notification_id,
            Notification.user_id == user.id,
            Notification.read_at.is_(None),
        )
        .values(read_at=utcnow())
    )
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read(db: DB, user: CurrentUser):
    db.execute(
        update(Notification)
        .where(Notification.user_id == user.id, Notification.read_at.is_(None))
        .values(read_at=utcnow())
    )
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
