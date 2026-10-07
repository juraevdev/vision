from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import get_db
from .models import AuthSession, User, utcnow
from .security import hash_token

_bearer = HTTPBearer(auto_error=False)

DB = Annotated[Session, Depends(get_db)]


def get_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> str:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Tizimga kiring.")
    return credentials.credentials


def get_current_user(token: Annotated[str, Depends(get_token)], db: DB) -> User:
    user = db.scalar(
        select(User)
        .join(AuthSession, AuthSession.user_id == User.id)
        .where(AuthSession.token_hash == hash_token(token), AuthSession.expires_at > utcnow())
    )
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sessiya muddati tugagan. Qayta kiring.")
    return user


def require_ceo(user: Annotated[User, Depends(get_current_user)]) -> User:
    if user.role != "ceo":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Bu amal faqat rahbar uchun.")
    return user


Token = Annotated[str, Depends(get_token)]
CurrentUser = Annotated[User, Depends(get_current_user)]
CeoUser = Annotated[User, Depends(require_ceo)]
