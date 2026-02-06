"""Main FastAPI application for View Invoices."""
import logging
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from supabase import create_client, Client

from .config import CORS_ORIGINS, PORT, supabase_url, supabase_key
from .auth import (
    create_access_token,
    authenticate_user,
    get_current_user,
    get_current_admin,
)
from .user_storage import create_user, get_all_users, delete_user, get_user_by_id

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# FastAPI app
app = FastAPI(title="View Invoices API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# Supabase client
supabase: Optional[Client] = None
if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)
    logger.info("Supabase client initialized")
else:
    logger.warning("Supabase credentials not set - database features disabled")


# Pydantic models
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if len(v) < 3 or len(v) > 32:
            raise ValueError("Username must be between 3 and 32 characters")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    is_admin: bool = False


class InvoiceResponse(BaseModel):
    id: int
    datum: Optional[str] = None
    nummer: Optional[str] = None
    erbringer_name: Optional[str] = None


class LeistungResponse(BaseModel):
    id: int
    bezeichnung: Optional[str] = None
    menge: Optional[str] = None
    wert: Optional[str] = None


class BestellpositionResponse(BaseModel):
    id: int
    bezeichnung: Optional[str] = None
    menge: Optional[str] = None
    einzelpreis: Optional[str] = None


class BestellungResponse(BaseModel):
    id: int
    bestellnummer: Optional[str] = None
    datum: Optional[str] = None
    status: Optional[str] = None
    lieferadresse: Optional[str] = None
    rechnungsadresse: Optional[str] = None
    versandart: Optional[str] = None
    versandkosten: Optional[str] = None
    rabatt: Optional[str] = None
    mwst: Optional[str] = None
    zwischensumme: Optional[str] = None
    gesamtwert: Optional[str] = None
    positionen: list[BestellpositionResponse] = []


class InvoiceDetailResponse(BaseModel):
    id: int
    created_at: Optional[str] = None
    datum: Optional[str] = None
    nummer: Optional[str] = None
    bestellnummer: Optional[str] = None
    gesamtpreis: Optional[str] = None
    erbringer_name: Optional[str] = None
    erbringer_anschrift: Optional[str] = None
    erbringer_steuernummer: Optional[str] = None
    erbringer_umsatzsteuer: Optional[str] = None
    empfaenger_name: Optional[str] = None
    empfaenger_anschrift: Optional[str] = None
    leistungen: list[LeistungResponse] = []
    bestellung: Optional[BestellungResponse] = None


# Authentication endpoints
@app.post("/api/auth/register", response_model=UserResponse)
@limiter.limit("3/minute")
async def register(request: Request, body: UserRegister):
    """Register a new user."""
    user = create_user(body.username, body.email, body.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists"
        )
    logger.info(f"New user registered: {body.username}")
    return user


@app.post("/api/auth/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, body: UserLogin):
    """Login and get access token."""
    user = authenticate_user(body.username, body.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    access_token = create_access_token(data={"sub": user["id"]})
    logger.info(f"User logged in: {body.username}")
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info."""
    return current_user


# Admin endpoints
@app.get("/api/admin/users", response_model=list[UserResponse])
async def list_users(current_user: dict = Depends(get_current_admin)):
    """List all users (admin only)."""
    return get_all_users()


@app.get("/api/admin/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user: dict = Depends(get_current_admin)):
    """Get user by ID (admin only)."""
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return {k: v for k, v in user.items() if k != "password_hash"}


@app.delete("/api/admin/users/{user_id}")
async def remove_user(user_id: str, current_user: dict = Depends(get_current_admin)):
    """Delete user (admin only)."""
    if user_id == current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )

    if not delete_user(user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    logger.info(f"User deleted by admin: {user_id}")
    return {"message": "User deleted"}


# Invoice endpoints
@app.get("/api/invoices", response_model=list[InvoiceResponse])
async def list_invoices(current_user: dict = Depends(get_current_user)):
    """List all invoices (tree view data)."""
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not configured"
        )

    try:
        response = supabase.table("rechnungen").select("id, datum, nummer, erbringer_name").execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching invoices: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch invoices"
        )


@app.get("/api/invoices/{invoice_id}", response_model=InvoiceDetailResponse)
async def get_invoice(invoice_id: int, current_user: dict = Depends(get_current_user)):
    """Get invoice details with line items."""
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not configured"
        )

    try:
        # Fetch invoice
        response = supabase.table("rechnungen").select("*").eq("id", invoice_id).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )

        invoice = response.data[0]

        # Fetch line items (leistungen) by rechnungs_nummer
        if invoice.get("nummer"):
            leistungen_response = supabase.table("leistungen").select("*").eq("rechnungs_nummer", invoice["nummer"]).execute()
            invoice["leistungen"] = leistungen_response.data or []
        else:
            invoice["leistungen"] = []

        # Fetch order (bestellung) by bestellnummer
        if invoice.get("bestellnummer"):
            bestellung_response = supabase.table("bestellungen").select("*").eq("bestellnummer", invoice["bestellnummer"]).execute()
            if bestellung_response.data:
                bestellung = bestellung_response.data[0]
                # Fetch order positions (bestellpositionen)
                positionen_response = supabase.table("bestellpositionen").select("*").eq("bestellnummer", invoice["bestellnummer"]).execute()
                bestellung["positionen"] = positionen_response.data or []
                invoice["bestellung"] = bestellung
            else:
                invoice["bestellung"] = None
        else:
            invoice["bestellung"] = None

        return invoice
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching invoice {invoice_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch invoice"
        )


# Health check
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "database": supabase is not None}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
