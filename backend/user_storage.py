"""JSON-based user storage module."""
import json
import uuid
import logging
from pathlib import Path
from typing import Optional
from passlib.context import CryptContext

from .config import USER_DATA_DIR

logger = logging.getLogger(__name__)

# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# User data directory
USER_DATA_PATH = Path(USER_DATA_DIR)
USER_DATA_PATH.mkdir(parents=True, exist_ok=True)


def _get_user_file(user_id: str) -> Path:
    """Get the file path for a user."""
    return USER_DATA_PATH / f"{user_id}.json"


def _load_all_users() -> list[dict]:
    """Load all users from storage."""
    users = []
    for file in USER_DATA_PATH.glob("*.json"):
        try:
            with open(file, "r") as f:
                users.append(json.load(f))
        except (json.JSONDecodeError, IOError) as e:
            logger.error(f"Error loading user file {file}: {e}")
    return users


def create_user(username: str, email: str, password: str, is_admin: bool = False) -> Optional[dict]:
    """Create a new user with hashed password."""
    if get_user_by_username(username):
        logger.warning(f"Username already exists: {username}")
        return None

    if get_user_by_email(email):
        logger.warning(f"Email already exists: {email}")
        return None

    user_id = str(uuid.uuid4())
    hashed_password = pwd_context.hash(password)

    user = {
        "id": user_id,
        "username": username,
        "email": email,
        "password_hash": hashed_password,
        "is_admin": is_admin
    }

    try:
        with open(_get_user_file(user_id), "w") as f:
            json.dump(user, f, indent=2)
        logger.info(f"User created: {username}")
        return {k: v for k, v in user.items() if k != "password_hash"}
    except IOError as e:
        logger.error(f"Error creating user: {e}")
        return None


def get_user_by_username(username: str) -> Optional[dict]:
    """Get user by username."""
    for user in _load_all_users():
        if user.get("username") == username:
            return user
    return None


def get_user_by_email(email: str) -> Optional[dict]:
    """Get user by email."""
    for user in _load_all_users():
        if user.get("email") == email:
            return user
    return None


def get_user_by_id(user_id: str) -> Optional[dict]:
    """Get user by ID."""
    user_file = _get_user_file(user_id)
    if user_file.exists():
        try:
            with open(user_file, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            logger.error(f"Error loading user {user_id}: {e}")
    return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_all_users() -> list[dict]:
    """Get all users (without password hashes)."""
    users = _load_all_users()
    return [{k: v for k, v in user.items() if k != "password_hash"} for user in users]


def delete_user(user_id: str) -> bool:
    """Delete a user by ID."""
    user_file = _get_user_file(user_id)
    if user_file.exists():
        try:
            user_file.unlink()
            logger.info(f"User deleted: {user_id}")
            return True
        except IOError as e:
            logger.error(f"Error deleting user {user_id}: {e}")
    return False


def update_user(user_id: str, **kwargs) -> Optional[dict]:
    """Update user fields."""
    user = get_user_by_id(user_id)
    if not user:
        return None

    allowed_fields = {"username", "email", "is_admin"}
    for key, value in kwargs.items():
        if key in allowed_fields:
            user[key] = value

    if "password" in kwargs:
        user["password_hash"] = pwd_context.hash(kwargs["password"])

    try:
        with open(_get_user_file(user_id), "w") as f:
            json.dump(user, f, indent=2)
        return {k: v for k, v in user.items() if k != "password_hash"}
    except IOError as e:
        logger.error(f"Error updating user {user_id}: {e}")
        return None
