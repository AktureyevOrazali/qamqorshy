from fastapi import APIRouter, Response
from pydantic import BaseModel

router = APIRouter()

class LangRequest(BaseModel):
    lang: str

@router.post("")
def set_language(request: LangRequest, response: Response):
    """
    Set language cookie for the frontend.
    """
    # Next.js and frontend might use 'lang' or 'NEXT_LOCALE'. Set both to be safe.
    max_age = 365 * 24 * 60 * 60  # 1 year
    
    response.set_cookie(
        key="lang", 
        value=request.lang, 
        max_age=max_age, 
        path="/", 
        samesite="lax", 
        httponly=False  # Accessible by client JS if needed
    )
    response.set_cookie(
        key="NEXT_LOCALE", 
        value=request.lang, 
        max_age=max_age, 
        path="/", 
        samesite="lax", 
        httponly=False
    )
    
    return {"status": "success", "lang": request.lang}
