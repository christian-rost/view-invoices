# CLAUDE.md - Technical Notes for View Invoices

This file contains technical details, architectural decisions, and important implementation notes for future development sessions.

## Current State

- **GitHub**: https://github.com/christian-rost/view-invoices
- **Branch**: `main`
- **Produktname**: View Invoices
- **Deployment**: Coolify auf VPS (geplant)

## Project Overview

View Invoices is a system to view invoices and their attributes stored in a Supabase database (table: `rechnungen`).

**Two screens:**
1. **Tree View**: Liste aller Rechnungen mit 3 Attributen (datum, nummer, erbringer_name)
2. **Detail View**: Alle Attribute einer ausgewählten Rechnung

## Architecture

### Project Structure (llm-council style)

```
view-invoices/
├── pyproject.toml        # Python dependencies (uv)
├── .python-version       # Python 3.10
├── start.sh              # Local dev: starts backend + frontend
├── .env.example          # Environment template
├── backend/
│   ├── config.py         # Supabase, JWT, CORS config
│   ├── auth.py           # JWT token handling
│   ├── user_storage.py   # JSON user storage with bcrypt
│   └── main.py           # FastAPI app
└── frontend/
    ├── package.json      # React 19, Vite 7
    └── src/
        ├── App.jsx       # Main orchestration
        ├── auth.jsx      # Auth context
        └── components/
            ├── Login.jsx
            ├── TreeView.jsx
            └── DetailView.jsx
```

### Backend (`backend/`)

**`config.py`**
- Supabase: `supabase_url`, `supabase_key`
- JWT: `JWT_SECRET` (required), `JWT_ALGORITHM`, `JWT_EXPIRATION_HOURS`
- Admin: `admin_user`, `admin_pw`
- CORS: `CORS_ORIGINS` (comma-separated)
- Data: `DATA_DIR`, `USER_DATA_DIR` (both in `data/`)
- Port: **8001**

**`user_storage.py`**
- JSON-based storage in `data/users/`
- Bcrypt password hashing (passlib)
- Functions: `create_user()`, `get_user_by_username()`, `get_user_by_email()`, `verify_password()`

**`auth.py`**
- JWT token creation/validation
- Dependencies: `get_current_user()`, `get_current_admin()`

**`main.py`**
- FastAPI with CORS middleware
- Rate-Limiting (slowapi):
  - `/api/auth/login`: 5/minute
  - `/api/auth/register`: 3/minute
- Endpoints:
  - Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
  - Admin: `/api/admin/users`, `/api/admin/users/{id}`
  - Invoices: `/api/invoices`, `/api/invoices/{id}`
  - Health: `/api/health`

### Frontend (`frontend/src/`)

**`App.jsx`**
- Manages invoice list and selected invoice
- Handles authentication state

**`auth.jsx`**
- AuthContext with token in localStorage
- `login()`, `register()`, `logout()`, `fetchWithAuth()`

**`components/Login.jsx`**
- Tab-based login/register forms

**`components/TreeView.jsx`**
- Invoice list (datum, nummer, erbringer_name)
- Click to select

**`components/DetailView.jsx`**
- All invoice fields in grid layout
- Status badges, currency formatting

**Styling (`index.css`)**
- XQT5 Corporate Design:
  - Primary: `#ee7f00` (Orange)
  - Dark: `#213452` (Navy-Blau)
  - White: `#ffffff`

## Environment Variables

### Backend

| Variable | Beschreibung | Pflicht |
|----------|--------------|---------|
| `JWT_SECRET` | Secret für JWT-Token (min. 32 Zeichen) | **Ja** |
| `SUPABASE_URL` | Supabase Project URL | Ja |
| `SUPABASE_KEY` | Supabase Anon Key | Ja |
| `admin_user` | Admin-Benutzername | Nein |
| `admin_pw` | Admin-Passwort | Nein |
| `CORS_ORIGINS` | Erlaubte Origins (kommasepariert) | Nein |

### Frontend

| Variable | Beschreibung | Pflicht |
|----------|--------------|---------|
| `VITE_API_BASE` | Backend-URL | Ja (Production) |

## Development

### Local Setup

```bash
# Backend
cp .env.example .env
# Edit .env with your values

# Start both
./start.sh
```

Or separately:
```bash
# Backend (from project root)
uv run python -m backend.main

# Frontend
cd frontend && npm install && npm run dev
```

### Dependencies

Backend (via `pyproject.toml` + uv):
- fastapi, uvicorn
- python-dotenv
- pydantic[email]
- python-jose[cryptography]
- passlib[bcrypt]
- slowapi
- supabase

Frontend (via `package.json`):
- React 19
- Vite 7

## Supabase Table: `rechnungen`

Expected columns:
- `id` (int, primary key)
- `datum` (date)
- `nummer` (text)
- `erbringer_name` (text)
- `erbringer_anschrift` (text)
- `erbringer_steuernummer` (text)
- `empfaenger_name` (text)
- `empfaenger_anschrift` (text)
- `betrag_netto` (numeric)
- `betrag_mwst` (numeric)
- `betrag_brutto` (numeric)
- `waehrung` (text)
- `beschreibung` (text)
- `zahlungsziel` (date)
- `status` (text)

## Security Features

1. **Bcrypt Password Hashing** via passlib
2. **JWT Authentication** with required secret
3. **Input Validation** via Pydantic
4. **Rate-Limiting** via slowapi
5. **CORS Restriction** configurable
6. **UUID User-IDs**
7. **Admin flag** for privilege check

## Common Gotchas

1. **Module Import Errors**: Run `uv run python -m backend.main` from project root
2. **JWT_SECRET missing**: Backend won't start - generate with `openssl rand -base64 32`
3. **CORS Issues**: Set `CORS_ORIGINS` for production
4. **Supabase not configured**: `/api/invoices` returns 503

## Coolify Deployment

Deploy as two separate services (like llm-council):

**Backend:**
- Build: Nixpacks (Python)
- Port: 8001
- Environment variables from .env.example

**Frontend:**
- Build: Nixpacks (Node)
- Build command: `npm run build`
- Start command: `npm run preview`
- Environment: `VITE_API_BASE=https://backend-url`
