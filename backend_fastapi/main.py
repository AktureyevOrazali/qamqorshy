from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.routes import admin, auth, bookings, caregivers, lang, messages, profile, quality, reviews, users
from core.config import settings
from db.session import Base, engine

UPLOADS_ROOT = Path(__file__).resolve().parent / 'uploads'
UPLOADS_ROOT.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.AUTO_CREATE_TABLES:
        Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title='Qamqorhy API',
    openapi_url=f'{settings.API_V1_STR}/openapi.json',
    lifespan=lifespan,
)
app.mount('/uploads', StaticFiles(directory=UPLOADS_ROOT), name='uploads')

if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )


@app.get('/')
def read_root():
    return {'message': 'Welcome to Qamqorhy FastAPI Backend'}


api_router = APIRouter()
api_router.include_router(auth.router, prefix='/auth', tags=['auth'])
api_router.include_router(users.router, prefix='/users', tags=['users'])
api_router.include_router(profile.router, prefix='/profile', tags=['profile'])
api_router.include_router(caregivers.router, prefix='/caregivers', tags=['caregivers'])
api_router.include_router(bookings.router, prefix='/bookings', tags=['bookings'])
api_router.include_router(messages.router, prefix='/messages', tags=['messages'])
api_router.include_router(reviews.router, prefix='/reviews', tags=['reviews'])
api_router.include_router(quality.router, prefix='/quality-updates', tags=['quality-updates'])
api_router.include_router(lang.router, prefix='/lang', tags=['lang'])
api_router.include_router(admin.router, prefix='/admin', tags=['admin'])

app.include_router(api_router, prefix=settings.API_V1_STR)


