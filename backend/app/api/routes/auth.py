from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from bson import ObjectId

from app.core.database import get_db
from app.core.security import (
    verify_password, get_password_hash,
    create_access_token, get_current_user
)
from app.models.schemas import UserCreate, UserLogin, TokenResponse, UserResponse

router = APIRouter()


def serialize_user(user: dict) -> UserResponse:
    return UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        created_at=user["created_at"],
        projects_count=user.get("projects_count", 0),
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(user_data: UserCreate):
    db = get_db()

    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user_doc = {
        "name": user_data.name,
        "email": user_data.email,
        "password_hash": get_password_hash(user_data.password),
        "created_at": datetime.utcnow(),
        "projects_count": 0,
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = create_access_token({"sub": str(result.inserted_id)})
    return TokenResponse(access_token=token, user=serialize_user(user_doc))


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    db = get_db()

    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token({"sub": str(user["_id"])})
    return TokenResponse(access_token=token, user=serialize_user(user))


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return serialize_user(current_user)
