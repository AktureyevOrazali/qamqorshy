from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from api import deps
from core.security import create_access_token, verify_password, get_password_hash
from core.config import settings
from db.models import User, ClientProfile, CaregiverProfile, UserRole
from schemas.user import UserCreate, User as UserSchema, Token

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

def _set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="qamqorshy_session",
        value=token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
        samesite="lax",
        httponly=True  # Important to protect session from client JS
    )

@router.post("/register", response_model=UserSchema)
def register(user_in: UserCreate, response: Response, db: Session = Depends(deps.get_db)) -> Any:
    """
    Create new user.
    """
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )

    if user_in.role == UserRole.CAREGIVER and not user_in.categories:
        raise HTTPException(
            status_code=400,
            detail="Caregiver must choose at least one care category.",
        )

    if user_in.role == UserRole.CAREGIVER and (user_in.hourlyRate is None or user_in.hourlyRate <= 0):
        raise HTTPException(
            status_code=400,
            detail="Caregiver must set an hourly rate.",
        )
    
    db_user = User(
        email=user_in.email,
        passwordHash=get_password_hash(user_in.password),
        fullName=user_in.fullName,
        phone=user_in.phone,
        role=user_in.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    if db_user.role == UserRole.CLIENT:
        profile = ClientProfile(userId=db_user.id)
        db.add(profile)
    elif db_user.role == UserRole.CAREGIVER:
        profile = CaregiverProfile(
            userId=db_user.id,
            hourlyRate=user_in.hourlyRate or 0,
            categories=",".join(category.value for category in user_in.categories or []),
        )
        db.add(profile)
    
    db.commit()
    
    # Authenticate immediately after registration
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(db_user.id, expires_delta=access_token_expires)
    _set_auth_cookie(response, token)
    
    return db_user


@router.post("/login", response_model=Token)
def login(request: LoginRequest, response: Response, db: Session = Depends(deps.get_db)) -> Any:
    """
    JSON API login (receives JSON body instead of Forms)
    """
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.passwordHash):
        raise HTTPException(
            status_code=400,
            detail="Incorrect email or password",
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(user.id, expires_delta=access_token_expires)
    
    _set_auth_cookie(response, token)
    
    return {
        "access_token": token,
        "token_type": "bearer",
    }

@router.post("/logout")
def logout(response: Response) -> Any:
    """
    Logout route. Simply deletes the cookie.
    """
    response.delete_cookie("qamqorshy_session", path="/")
    return {"message": "Successfully logged out"}
