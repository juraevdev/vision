import re

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import case, func, select

from ..deps import DB, CeoUser
from ..models import Task, User
from ..schemas import MemberIn, MemberOut
from ..security import hash_password

router = APIRouter(prefix="/members", tags=["members"])

EMAIL_RE = re.compile(r"^\S+@\S+\.\S+$")


@router.get("", response_model=list[MemberOut])
def list_members(db: DB, _: CeoUser):
    open_tasks = func.coalesce(func.sum(case((Task.status != "done", 1), else_=0)), 0)
    done_tasks = func.coalesce(func.sum(case((Task.status == "done", 1), else_=0)), 0)
    stmt = (
        select(User, open_tasks, done_tasks)
        .outerjoin(Task, Task.assignee_id == User.id)
        .where(User.role == "member")
        .group_by(User.id)
        .order_by(User.name)
    )
    return [
        MemberOut(
            id=user.id,
            name=user.name,
            email=user.email,
            position=user.position,
            created_at=user.created_at,
            open_tasks=open_count,
            done_tasks=done_count,
        )
        for user, open_count, done_count in db.execute(stmt)
    ]


@router.post("", response_model=MemberOut, status_code=status.HTTP_201_CREATED)
def add_member(body: MemberIn, db: DB, _: CeoUser):
    name = body.name.strip()
    email = body.email.strip().lower()
    if not name:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ism familiyani kiriting.")
    if not EMAIL_RE.match(email):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email manzil noto‘g‘ri.")
    if len(body.password) < 6:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Parol kamida 6 belgidan iborat bo‘lsin.")
    if db.scalar(select(User.id).where(func.lower(User.email) == email)) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Bu email bilan akkaunt allaqachon mavjud.")

    user = User(
        name=name,
        email=email,
        password_hash=hash_password(body.password),
        role="member",
        position=body.position.strip(),
    )
    db.add(user)
    db.commit()
    return MemberOut(
        id=user.id,
        name=user.name,
        email=user.email,
        position=user.position,
        created_at=user.created_at,
        open_tasks=0,
        done_tasks=0,
    )


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(member_id: int, db: DB, _: CeoUser):
    user = db.get(User, member_id)
    if user is None or user.role != "member":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Jamoa a’zosi topilmadi.")
    db.delete(user)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
