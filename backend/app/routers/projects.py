from fastapi import APIRouter, HTTPException, Response, status

from .. import services
from ..deps import DB, CeoUser, CurrentUser
from ..models import Project, Task
from ..schemas import ProjectCreate, ProjectDetail, ProjectIn, ProjectOut, TaskIn, TaskOut

router = APIRouter(prefix="/projects", tags=["projects"])


def _bad_request(message: str) -> HTTPException:
    return HTTPException(status.HTTP_400_BAD_REQUEST, message)


def _clean_project(body: ProjectIn) -> dict:
    title, goal = body.title.strip(), body.goal.strip()
    if not title:
        raise _bad_request("Loyiha nomini kiriting.")
    if not goal:
        raise _bad_request("Loyiha maqsadini yozing.")
    if body.kind not in ("new", "ongoing"):
        raise _bad_request("Loyiha turini tanlang.")
    return {
        "title": title,
        "kind": body.kind,
        "goal": goal,
        "description": body.description.strip(),
        "start_date": body.start_date,
        "deadline": body.deadline,
    }


def _check_assignees(db: DB, tasks: list[TaskIn]) -> None:
    for task in tasks:
        if task.assignee_id and not services.is_member(db, task.assignee_id):
            raise _bad_request("Tanlangan jamoa a’zosi topilmadi.")


def _project_or_404(db: DB, project_id: int) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Loyiha topilmadi.")
    return project


@router.get("", response_model=list[ProjectOut])
def list_projects(db: DB, _: CurrentUser):
    return services.list_projects(db)


@router.post("", response_model=ProjectDetail, status_code=status.HTTP_201_CREATED)
def create_project(body: ProjectCreate, db: DB, ceo: CeoUser):
    fields = _clean_project(body)
    tasks = [
        task.model_copy(update={"title": task.title.strip(), "description": task.description.strip()})
        for task in body.tasks
        if task.title.strip()
    ]
    _check_assignees(db, tasks)

    project = Project(**fields, created_by=ceo.id)
    db.add(project)
    db.flush()
    db.add_all(
        Task(
            project_id=project.id,
            assignee_id=task.assignee_id,
            title=task.title,
            description=task.description,
            deadline=task.deadline,
        )
        for task in tasks
    )

    label = "Yangi" if project.kind == "new" else "Joriy"
    services.notify(
        db,
        services.member_ids(db),
        "project",
        f"{label} loyiha qo‘shildi: {project.title}",
        body=f"Maqsad: {services.snippet(project.goal)}",
        link=services.project_link(project.id),
    )
    services.notify_assignees(
        db, [(task.title, task.assignee_id) for task in tasks], project.id, project.title
    )
    db.commit()
    return services.get_project(db, project.id)


@router.get("/{project_id}", response_model=ProjectDetail)
def get_project(project_id: int, db: DB, _: CurrentUser):
    project = services.get_project(db, project_id)
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Loyiha topilmadi.")
    return project


@router.put("/{project_id}", response_model=ProjectDetail)
def update_project(project_id: int, body: ProjectIn, db: DB, _: CeoUser):
    project = _project_or_404(db, project_id)
    fields = _clean_project(body)
    goal_changed = fields["goal"] != project.goal
    for key, value in fields.items():
        setattr(project, key, value)

    if goal_changed:
        people = services.get_project(db, project_id).people
        services.notify(
            db,
            [person.id for person in people],
            "project",
            f"Loyiha maqsadi yangilandi: {project.title}",
            body=services.snippet(project.goal),
            link=services.project_link(project.id),
        )
    db.commit()
    return services.get_project(db, project_id)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: DB, _: CeoUser):
    db.delete(_project_or_404(db, project_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{project_id}/tasks", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def add_task(project_id: int, body: TaskIn, db: DB, _: CeoUser):
    project = _project_or_404(db, project_id)
    title = body.title.strip()
    if not title:
        raise _bad_request("Topshiriq nomini kiriting.")
    _check_assignees(db, [body])

    task = Task(
        project_id=project.id,
        assignee_id=body.assignee_id,
        title=title,
        description=body.description.strip(),
        deadline=body.deadline,
    )
    db.add(task)
    services.notify_assignees(db, [(title, body.assignee_id)], project.id, project.title)
    db.commit()
    return services.get_task(db, task.id)
