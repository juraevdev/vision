import os
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .database import Base, SessionLocal, engine
from .routers import auth, members, notifications, projects, tasks
from .services import seed_ceo


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed_ceo(db)
    yield


app = FastAPI(title="Vision API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_error(_request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Ma’lumotlar noto‘g‘ri kiritildi.",
            "errors": [{"loc": err["loc"], "msg": err["msg"]} for err in exc.errors()],
        },
    )


api = APIRouter(prefix="/api")
for module in (auth, projects, tasks, members, notifications):
    api.include_router(module.router)


@api.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}


app.include_router(api)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8000")))
