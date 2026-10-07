import math
from collections.abc import Iterable

from sqlalchemy import ColumnElement, case, func, select
from sqlalchemy.orm import Session

from .config import get_settings
from .models import Notification, Project, Task, User
from .schemas import Person, ProjectDetail, ProjectOut, TaskOut
from .security import hash_password

TASK_ORDER = (
    case((Task.status == "in_progress", 0), (Task.status == "todo", 1), else_=2),
    Task.deadline.is_(None),
    Task.deadline,
    Task.id,
)


def progress_of(done: int, total: int) -> int:
    return 0 if total == 0 else math.floor(done * 100 / total + 0.5)


def snippet(value: str, limit: int = 120) -> str:
    return value if len(value) <= limit else f"{value[: limit - 1].rstrip()}…"


def project_link(project_id: int) -> str:
    return f"/projects/{project_id}"


# Tasks


def list_tasks(db: Session, *where: ColumnElement[bool]) -> list[TaskOut]:
    stmt = (
        select(Task, Project.title, User.name)
        .join(Project, Project.id == Task.project_id)
        .outerjoin(User, User.id == Task.assignee_id)
        .where(*where)
        .order_by(*TASK_ORDER)
    )
    return [
        TaskOut(
            id=task.id,
            project_id=task.project_id,
            project_title=project_title,
            assignee_id=task.assignee_id,
            assignee_name=assignee_name,
            title=task.title,
            description=task.description,
            status=task.status,
            deadline=task.deadline,
            created_at=task.created_at,
            updated_at=task.updated_at,
        )
        for task, project_title, assignee_name in db.execute(stmt)
    ]


def get_task(db: Session, task_id: int) -> TaskOut | None:
    rows = list_tasks(db, Task.id == task_id)
    return rows[0] if rows else None


# Projects


def _people_by_project(db: Session, project_ids: list[int]) -> dict[int, list[Person]]:
    if not project_ids:
        return {}
    stmt = (
        select(Task.project_id, User.id, User.name)
        .distinct()
        .join(User, User.id == Task.assignee_id)
        .where(Task.project_id.in_(project_ids))
        .order_by(User.name)
    )
    people: dict[int, list[Person]] = {}
    for project_id, user_id, name in db.execute(stmt):
        people.setdefault(project_id, []).append(Person(id=user_id, name=name))
    return people


def list_projects(db: Session, *where: ColumnElement[bool]) -> list[ProjectOut]:
    done = func.coalesce(func.sum(case((Task.status == "done", 1), else_=0)), 0)
    in_progress = func.coalesce(func.sum(case((Task.status == "in_progress", 1), else_=0)), 0)
    stmt = (
        select(Project, func.count(Task.id), done, in_progress)
        .outerjoin(Task, Task.project_id == Project.id)
        .where(*where)
        .group_by(Project.id)
        .order_by(Project.created_at.desc(), Project.id.desc())
    )
    rows = db.execute(stmt).all()
    people = _people_by_project(db, [project.id for project, *_ in rows])
    return [
        ProjectOut(
            id=project.id,
            title=project.title,
            kind=project.kind,
            goal=project.goal,
            description=project.description,
            start_date=project.start_date,
            deadline=project.deadline,
            created_at=project.created_at,
            total=total,
            done=done_count,
            in_progress=in_progress_count,
            progress=progress_of(done_count, total),
            people=people.get(project.id, []),
        )
        for project, total, done_count, in_progress_count in rows
    ]


def get_project(db: Session, project_id: int) -> ProjectDetail | None:
    rows = list_projects(db, Project.id == project_id)
    if not rows:
        return None
    return ProjectDetail(**rows[0].model_dump(), tasks=list_tasks(db, Task.project_id == project_id))


# Users


def member_ids(db: Session) -> list[int]:
    return list(db.scalars(select(User.id).where(User.role == "member")))


def ceo_ids(db: Session) -> list[int]:
    return list(db.scalars(select(User.id).where(User.role == "ceo")))


def is_member(db: Session, user_id: int) -> bool:
    return db.scalar(select(User.id).where(User.id == user_id, User.role == "member")) is not None


def seed_ceo(db: Session) -> None:
    if db.scalar(select(func.count(User.id))):
        return
    settings = get_settings()
    db.add(
        User(
            name=settings.ceo_name,
            email=settings.ceo_email.strip().lower(),
            password_hash=hash_password(settings.ceo_password),
            role="ceo",
            position="CEO",
        )
    )
    db.commit()


# Notifications


def notify(
    db: Session,
    user_ids: Iterable[int],
    type: str,
    title: str,
    body: str = "",
    link: str | None = None,
) -> None:
    for user_id in dict.fromkeys(user_ids):
        db.add(Notification(user_id=user_id, type=type, title=title, body=body, link=link))


def notify_assignees(
    db: Session, tasks: Iterable[tuple[str, int | None]], project_id: int, project_title: str
) -> None:
    by_assignee: dict[int, list[str]] = {}
    for title, assignee_id in tasks:
        if assignee_id:
            by_assignee.setdefault(assignee_id, []).append(title)
    for user_id, titles in by_assignee.items():
        notify(
            db,
            [user_id],
            "task",
            f"Sizga yangi topshiriq: {titles[0]}"
            if len(titles) == 1
            else f"Sizga {len(titles)} ta yangi topshiriq berildi",
            body=f"“{project_title}” loyihasi",
            link=project_link(project_id),
        )
