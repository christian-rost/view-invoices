# CLAUDE.md - Technical Notes for View invoices

This file contains technical details, architectural decisions, and important implementation notes for future development sessions.

## Current State

- **Githubname**: 'view-invoices'
- **Branch**: `master`
- **Produktname**: View invoices
- **Deployment**: Coolify auf VPS
  - Frontend: https://5ais.xqtfive.com
  - Backend: Separate Instanz

## Project Overview

View invoices is a system, where you can view invoices and their attributes which are stored in a database (supabase) in the table 'rechnungen'.
It consists of two screens:
1. a tree view where you can view all the invoices stored in the database table with only 3 attributes: datum, nummer, erbringer_name
2. a detailed view which shows up when you select one of the lines in the tree view. all the attributes of the database table are displayed

## Architecture

### Backend Structure (`backend/`)

**`config.py`**
- Contains `supabase_url` (url to access supabase)
- Contains 'supabase_key' (api-key to access supabase)
- Backend runs on **port 8001**
- JWT configuration: `JWT_SECRET`, `JWT_ALGORITHM`, `JWT_EXPIRATION_HOURS`
- Admin credentials: `admin_user`, `admin_pw` (environment variables)

**`user_storage.py`**
- JSON-based user storage in `data/users/`
- **Bcrypt password hashing** via passlib (NOT SHA-256)
- User CRUD operations with error handling
- Functions: `create_user()`, `get_user_by_username()`, `get_user_by_email()`, `verify_password()`

**`auth.py`**
- JWT token creation and validation
- `get_current_user()`: Dependency for protected routes
- `get_current_admin()`: Dependency for admin-only routes
- `is_admin_user()`: Check if user is admin

**`main.py`**
- FastAPI app with CORS middleware
- **CORS origins configurable via `CORS_ORIGINS` environment variable**
- Authentication endpoints: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- Admin endpoints: `/api/admin/users`, `/api/admin/users/{id}`, etc.
- Input validation on registration (username 3-32 chars, EmailStr, password min 8 chars)
- Internal errors not exposed to clients
- **Rate-Limiting** via slowapi:
  - `/api/auth/login`: 5 Requests/Minute
  - `/api/auth/register`: 3 Requests/Minute
  - `/api/conversations/{id}/message`: 10 Requests/Minute
  - `/api/conversations/{id}/message/stream`: 10 Requests/Minute

### Frontend Structure (`frontend/src/`)

**`App.jsx`**
- Main orchestration: manages conversations list and current conversation
- Handles authentication state
- PDF upload support

**`auth.jsx`**
- Authentication context provider
- Token management in localStorage
- Login/logout/register functions

**`components/Login.jsx`**
- Login and registration forms
- Tab-based UI for switching between login/register

**`components/ChatInterface.jsx`**
- Multiline textarea (3 rows, resizable)
- Enter to send, Shift+Enter for new line

**`components/Stage1.jsx`**, **`Stage2.jsx`**, **`Stage3.jsx`**
- Tab views for individual model responses
- ReactMarkdown rendering

**Styling (`*.css`)**
- **XQT5 Corporate Design**:
  - Primary color: `#ee7f00` (Orange)
  - Dark color: `#213452` (Navy-Blau)
  - White: `#ffffff`
- CSS Variables in `index.css` für konsistentes Theming
- Light mode theme

## Environment Variables

### Backend

| Variable | Beschreibung | Pflicht |
|----------|--------------|---------|
| `OPENROUTER_API_KEY` | API-Key für OpenRouter | Ja |
| `JWT_SECRET` | Secret für JWT-Token (min. 32 Zeichen empfohlen) | **Ja** |
| `admin_user` | Admin-Benutzername | Ja |
| `admin_pw` | Admin-Passwort | Ja |
| `CORS_ORIGINS` | Erlaubte Origins (kommasepariert) | Nein (Default: localhost) |

**Wichtig**: `JWT_SECRET` ist seit version02 **Pflicht**. Das Backend startet nicht ohne diese Variable und wirft einen `RuntimeError`.

### Frontend

| Variable | Beschreibung | Pflicht |
|----------|--------------|---------|
| `VITE_API_BASE` | Backend-URL | Ja (Production) |

## Security Features (version02)

1. **Bcrypt Password Hashing**: Ersetzt SHA-256, nutzt passlib
2. **Input Validation**: Pydantic validators für Registration
3. **CORS Restriction**: Nur spezifische Methods/Headers erlaubt
4. **Error Handling**: Interne Fehler nicht an Client exponiert
5. **Logging**: Proper logging statt print statements
6. **User Isolation**: Benutzer sehen nur eigene Conversations
7. **JWT Secret Pflicht**: RuntimeError wenn `JWT_SECRET` nicht gesetzt
8. **Sichere Admin-Prüfung**: `is_admin`-Flag statt Username-Vergleich
9. **UUID User-IDs**: Keine Timestamp-Kollisionen mehr möglich
10. **Rate-Limiting**: slowapi für Brute-Force- und DoS-Schutz

## Key Design Decisions

### Stage 2 Prompt Format
```
1. Evaluate each response individually first
2. Provide "FINAL RANKING:" header
3. Numbered list format: "1. Response C", "2. Response A", etc.
4. No additional text after ranking section
```

### Error Handling Philosophy
- Log errors internally, show generic messages to users

## Important Implementation Details

### Relative Imports
All backend modules use relative imports (e.g., `from .config import ...`). Run backend as `python -m backend.main` from project root.

### Dependencies
- `pydantic[email]` - Required for EmailStr validation
- `passlib[bcrypt]` - Required for password hashing
- `slowapi` - Required for rate limiting

## Common Gotchas

1. **Module Import Errors**: Run `python -m backend.main` from project root
2. **CORS Issues**: Set `CORS_ORIGINS` environment variable for production
3. **Email Validation Error**: Ensure `pydantic[email]` is installed
4. **Password Hashing**: Old SHA-256 hashes are incompatible with bcrypt
5. **JWT_SECRET fehlt**: Backend startet nicht ohne `JWT_SECRET` - generiere mit `openssl rand -base64 32`
6. **slowapi Request-Parameter**: Bei Rate-Limited Endpoints muss der erste Parameter `request: Request` heißen, Pydantic-Body als `body: ModelName`

## Data Flow Summary

