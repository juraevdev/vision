from datetime import timedelta

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import delete, func, select

from ..config import get_settings
from ..deps import DB, CurrentUser, Token
from ..models import AuthSession, User, utcnow
from ..schemas import LoginIn, LoginOut, PasswordIn, ProfileIn, UserOut
from ..security import hash_password, hash_token, new_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginOut)
def login(body: LoginIn, db: DB):
    email = body.email.strip().lower()
    if not email or not body.password:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email va parolni kiriting.")

    user = db.scalar(select(User).where(func.lower(User.email) == email))
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email yoki parol noto‘g‘ri.")

    now = utcnow()
    db.execute(delete(AuthSession).where(AuthSession.expires_at < now))
    token = new_token()
    expires_at = now + timedelta(days=get_settings().session_days)
    db.add(AuthSession(token_hash=hash_token(token), user_id=user.id, expires_at=expires_at))
    db.commit()
    return LoginOut(token=token, expires_at=expires_at, user=UserOut.model_validate(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(token: Token, db: DB):
    db.execute(delete(AuthSession).where(AuthSession.token_hash == hash_token(token)))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser):
    return user


@router.patch("/me", response_model=UserOut)
def update_profile(body: ProfileIn, user: CurrentUser, db: DB):
    name = body.name.strip()
    if not name:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ism familiyani kiriting.")
    user.name = name
    user.position = body.position.strip()
    db.commit()
    return user


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(body: PasswordIn, user: CurrentUser, token: Token, db: DB):
    if not verify_password(body.current, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Joriy parol noto‘g‘ri.")
    if len(body.next) < 6:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Yangi parol kamida 6 belgidan iborat bo‘lsin."
        )
    user.password_hash = hash_password(body.next)
    db.execute(
        delete(AuthSession).where(
            AuthSession.user_id == user.id, AuthSession.token_hash != hash_token(token)
        )
    )
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
