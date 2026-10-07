from datetime import date, datetime, timezone
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer

Role = Literal["ceo", "member"]
ProjectKind = Literal["new", "ongoing"]
TaskStatus = Literal["todo", "in_progress", "done"]
NotificationType = Literal["project", "task", "status"]


def _iso_utc(value: datetime) -> str:
    return value.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")


UTCDateTime = Annotated[datetime, PlainSerializer(_iso_utc, return_type=str)]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# Auth & profile


class UserOut(ORMModel):
    id: int
    name: str
    email: str
    role: Role
    position: str


class LoginIn(BaseModel):
    email: str
    password: str


class LoginOut(BaseModel):
    token: str
    expires_at: UTCDateTime
    user: UserOut


class ProfileIn(BaseModel):
    name: str
    position: str = ""


class PasswordIn(BaseModel):
    current: str
    next: str


# Projects & tasks


class Person(BaseModel):
    id: int
    name: str


class TaskIn(BaseModel):
    title: str
    description: str = ""
    assignee_id: int | None = None
    deadline: date | None = None


class ProjectIn(BaseModel):
    title: str
    kind: str
    goal: str
    description: str = ""
    start_date: date | None = None
    deadline: date | None = None


class ProjectCreate(ProjectIn):
    tasks: list[TaskIn] = Field(default_factory=list)


class StatusIn(BaseModel):
    status: TaskStatus


class TaskOut(BaseModel):
    id: int
    project_id: int
    project_title: str
    assignee_id: int | None
    assignee_name: str | None
    title: str
    description: str
    status: TaskStatus
    deadline: date | None
    created_at: UTCDateTime
    updated_at: UTCDateTime


class ProjectOut(BaseModel):
    id: int
    title: str
    kind: ProjectKind
    goal: str
    description: str
    start_date: date | None
    deadline: date | None
    created_at: UTCDateTime
    total: int
    done: int
    in_progress: int
    progress: int
    people: list[Person]


class ProjectDetail(ProjectOut):
    tasks: list[TaskOut]


# Team


class MemberIn(BaseModel):
    name: str
    email: str
    position: str = ""
    password: str


class MemberOut(BaseModel):
    id: int
    name: str
    email: str
    position: str
    created_at: UTCDateTime
    open_tasks: int
    done_tasks: int


# Notifications


class NotificationOut(ORMModel):
    id: int
    type: NotificationType
    title: str
    body: str
    link: str | None
    read_at: UTCDateTime | None
    created_at: UTCDateTime


class NotificationList(BaseModel):
    unread: int
    items: list[NotificationOut]
