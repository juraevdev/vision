from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select

from .. import services
from ..deps import DB, CeoUser, CurrentUser
from ..models import Project, Task
from ..schemas import StatusIn, TaskOut

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _task_or_404(db: DB, task_id: int) -> Task:
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Topshiriq topilmadi.")
    return task


@router.get("/mine", response_model=list[TaskOut])
def my_tasks(db: DB, user: CurrentUser):
    return services.list_tasks(db, Task.assignee_id == user.id)


@router.patch("/{task_id}/status", response_model=TaskOut)
def update_status(task_id: int, body: StatusIn, db: DB, user: CurrentUser):
    task = _task_or_404(db, task_id)
    if user.role != "ceo" and task.assignee_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Bu topshiriq sizga biriktirilmagan.")
    if task.status == body.status:
        return services.get_task(db, task.id)

    project = db.get(Project, task.project_id)
    task.status = body.status
    link = services.project_link(project.id)

    if user.role == "member":
        services.notify(
            db,
            services.ceo_ids(db),
            "status",
            f"{user.name} topshiriqni bajardi"
            if body.status == "done"
            else f"{user.name} topshiriq holatini o‘zgartirdi",
            body=f"{task.title} ({project.title})",
            link=link,
        )
    elif task.assignee_id:
        services.notify(
            db,
            [task.assignee_id],
            "status",
            f"Topshiriq holati yangilandi: {task.title}",
            body=f"Rahbar holatni o‘zgartirdi ({project.title})",
            link=link,
        )

    db.flush()
    siblings = db.execute(
        select(Task.status, Task.assignee_id).where(Task.project_id == project.id)
    ).all()
    if body.status == "done" and all(s == "done" for s, _ in siblings):
        assignees = [assignee for _, assignee in siblings if assignee is not None]
        services.notify(
            db,
            [*services.ceo_ids(db), *assignees],
            "project",
            f"Loyiha 100% bajarildi: {project.title}",
            body="Barcha topshiriqlar yakunlandi.",
            link=link,
        )

    db.commit()
    return services.get_task(db, task.id)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: DB, _: CeoUser):
    db.delete(_task_or_404(db, task_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
