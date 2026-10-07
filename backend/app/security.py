import hashlib
import hmac
import secrets

_SCRYPT = {"n": 16384, "r": 8, "p": 1, "dklen": 64}


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.scrypt(password.encode(), salt=salt.encode(), **_SCRYPT)
    return f"{salt}:{key.hex()}"


def verify_password(password: str, stored: str) -> bool:
    salt, _, expected = stored.partition(":")
    if not salt or not expected:
        return False
    key = hashlib.scrypt(password.encode(), salt=salt.encode(), **_SCRYPT)
    return hmac.compare_digest(key.hex(), expected)


def new_token() -> str:
    return secrets.token_hex(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
