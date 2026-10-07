from conftest import login


def add_member(client, ceo, name, email):
    response = client.post(
        "/api/members",
        headers=ceo,
        json={"name": name, "email": email, "position": "Dasturchi", "password": "secret1"},
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


def notifications(client, headers):
    return client.get("/api/notifications", headers=headers).json()


def test_health_and_auth(client, ceo):
    assert client.get("/api/health").json() == {"status": "ok"}
    assert client.get("/api/auth/me").status_code == 401

    me = client.get("/api/auth/me", headers=ceo).json()
    assert me["role"] == "ceo" and me["email"] == "ceo@vision.uz"

    bad = client.post("/api/auth/login", json={"email": "ceo@vision.uz", "password": "nope"})
    assert bad.status_code == 401
    assert bad.json()["detail"] == "Email yoki parol noto‘g‘ri."

    assert client.post("/api/auth/logout", headers=ceo).status_code == 204
    assert client.get("/api/auth/me", headers=ceo).status_code == 401


def test_project_flow_with_notifications(client, ceo):
    ali = add_member(client, ceo, "Ali Valiyev", "ali@vision.uz")
    vali = add_member(client, ceo, "Vali Aliyev", "vali@vision.uz")
    ali_h = login(client, "ali@vision.uz", "secret1")
    vali_h = login(client, "vali@vision.uz", "secret1")

    created = client.post(
        "/api/projects",
        headers=ceo,
        json={
            "title": "Mobil ilova",
            "kind": "new",
            "goal": "Mijozlar uchun ilova chiqarish",
            "deadline": "2026-12-31",
            "tasks": [
                {"title": "Dizayn", "assignee_id": ali},
                {"title": "API", "assignee_id": ali},
                {"title": "Test", "assignee_id": vali},
                {"title": "   "},
            ],
        },
    )
    assert created.status_code == 201, created.text
    project = created.json()
    assert project["total"] == 3 and project["progress"] == 0
    assert {p["name"] for p in project["people"]} == {"Ali Valiyev", "Vali Aliyev"}

    ali_inbox = notifications(client, ali_h)
    assert ali_inbox["unread"] == 2
    titles = [n["title"] for n in ali_inbox["items"]]
    assert "Yangi loyiha qo‘shildi: Mobil ilova" in titles
    assert "Sizga 2 ta yangi topshiriq berildi" in titles
    assert ali_inbox["items"][0]["created_at"].endswith("Z")
    assert "Sizga yangi topshiriq: Test" in [n["title"] for n in notifications(client, vali_h)["items"]]

    tasks = {t["title"]: t for t in project["tasks"]}
    forbidden = client.patch(
        f"/api/tasks/{tasks['Test']['id']}/status", headers=ali_h, json={"status": "done"}
    )
    assert forbidden.status_code == 403

    for title in ("Dizayn", "API"):
        response = client.patch(
            f"/api/tasks/{tasks[title]['id']}/status", headers=ali_h, json={"status": "done"}
        )
        assert response.status_code == 200 and response.json()["status"] == "done"

    summary = client.get("/api/projects", headers=vali_h).json()[0]
    assert summary["done"] == 2 and summary["progress"] == 67

    ceo_titles = [n["title"] for n in notifications(client, ceo)["items"]]
    assert ceo_titles.count("Ali Valiyev topshiriqni bajardi") == 2

    client.patch(f"/api/tasks/{tasks['Test']['id']}/status", headers=ceo, json={"status": "done"})
    assert client.get(f"/api/projects/{project['id']}", headers=ceo).json()["progress"] == 100
    assert notifications(client, vali_h)["items"][0]["title"] == "Loyiha 100% bajarildi: Mobil ilova"
    assert "Loyiha 100% bajarildi: Mobil ilova" in [
        n["title"] for n in notifications(client, ceo)["items"]
    ]

    mine = client.get("/api/tasks/mine", headers=ali_h).json()
    assert [t["title"] for t in mine] == ["Dizayn", "API"]


def test_ceo_only_and_validation(client, ceo):
    add_member(client, ceo, "Ali", "ali@vision.uz")
    member = login(client, "ali@vision.uz", "secret1")

    assert client.get("/api/members", headers=member).status_code == 403
    denied = client.post(
        "/api/projects", headers=member, json={"title": "X", "kind": "new", "goal": "Y"}
    )
    assert denied.status_code == 403

    empty_goal = client.post(
        "/api/projects", headers=ceo, json={"title": "X", "kind": "new", "goal": " "}
    )
    assert empty_goal.json()["detail"] == "Loyiha maqsadini yozing."

    bad_date = client.post(
        "/api/projects",
        headers=ceo,
        json={"title": "X", "kind": "new", "goal": "Y", "deadline": "ertaga"},
    )
    assert bad_date.status_code == 422
    assert bad_date.json()["detail"] == "Ma’lumotlar noto‘g‘ri kiritildi."

    duplicate = client.post(
        "/api/members",
        headers=ceo,
        json={"name": "Ali", "email": "ALI@vision.uz", "password": "secret1"},
    )
    assert duplicate.status_code == 409


def test_update_delete_and_read_state(client, ceo):
    ali = add_member(client, ceo, "Ali", "ali@vision.uz")
    ali_h = login(client, "ali@vision.uz", "secret1")
    project = client.post(
        "/api/projects",
        headers=ceo,
        json={"title": "CRM", "kind": "ongoing", "goal": "Eski", "tasks": [{"title": "A"}]},
    ).json()

    task = client.post(
        f"/api/projects/{project['id']}/tasks",
        headers=ceo,
        json={"title": "Integratsiya", "assignee_id": ali, "deadline": "2026-11-01"},
    )
    assert task.status_code == 201 and task.json()["assignee_name"] == "Ali"

    updated = client.put(
        f"/api/projects/{project['id']}",
        headers=ceo,
        json={"title": "CRM 2", "kind": "ongoing", "goal": "Yangi maqsad"},
    )
    assert updated.json()["title"] == "CRM 2"
    inbox = notifications(client, ali_h)
    assert inbox["items"][0]["title"] == "Loyiha maqsadi yangilandi: CRM 2"
    assert inbox["unread"] == 3

    first = inbox["items"][0]["id"]
    assert client.post(f"/api/notifications/{first}/read", headers=ali_h).status_code == 204
    assert notifications(client, ali_h)["unread"] == 2
    client.post("/api/notifications/read-all", headers=ali_h)
    assert notifications(client, ali_h)["unread"] == 0

    assert client.delete(f"/api/tasks/{task.json()['id']}", headers=ceo).status_code == 204
    assert client.delete(f"/api/projects/{project['id']}", headers=ceo).status_code == 204
    assert client.get(f"/api/projects/{project['id']}", headers=ceo).status_code == 404

    assert client.delete(f"/api/members/{ali}", headers=ceo).status_code == 204
    assert client.get("/api/auth/me", headers=ali_h).status_code == 401


def test_profile_and_password(client, ceo):
    profile = client.patch("/api/auth/me", headers=ceo, json={"name": "Aziz", "position": "CEO"})
    assert profile.json()["name"] == "Aziz"

    other = login(client, "ceo@vision.uz", "vision2026")
    wrong = client.post(
        "/api/auth/me/password", headers=ceo, json={"current": "x", "next": "newpass1"}
    )
    assert wrong.status_code == 400
    ok = client.post(
        "/api/auth/me/password", headers=ceo, json={"current": "vision2026", "next": "newpass1"}
    )
    assert ok.status_code == 204
    assert client.get("/api/auth/me", headers=ceo).status_code == 200
    assert client.get("/api/auth/me", headers=other).status_code == 401
    login(client, "ceo@vision.uz", "newpass1")
