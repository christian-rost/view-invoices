# CLAUDE.md - Technical Notes for View Invoices

This file contains technical details, architectural decisions, and important implementation notes for future development sessions.

## Current State

- **GitHub**: https://github.com/christian-rost/view-invoices
- **Branch**: `main`
- **Produktname**: View Invoices
- **Deployment**: Coolify auf VPS ✓

### Production URLs

| Service | URL |
|---------|-----|
| Frontend | https://view-invoices-frontend.xqtfive.de |
| Backend | https://view-invoices-backend.xqtfive.de |
| Supabase | https://supabase.xqtfive.de |

## Project Overview

View Invoices is a system to view invoices and their attributes stored in a Supabase database.

**Two screens:**
1. **Tree View**: Liste aller Rechnungen mit 3 Attributen (datum, nummer, erbringer_name)
2. **Detail View**: Rechnungsdetails inkl. Leistungspositionen + verknüpfte Bestellung (nebeneinander) mit Abweichungs-Erkennung

## Architecture

### Project Structure (llm-council style)

```
view-invoices/
├── pyproject.toml        # Python dependencies (uv)
├── .python-version       # Python 3.10
├── start.sh              # Local dev: starts backend + frontend
├── .env.example          # Environment template
├── scripts/
│   ├── migrate_bestellungen_schema.sql  # Schema-Migration + Testdaten
│   └── test_mismatch_data.sql           # Test-Abweichungen erzeugen
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
  - Invoices: `/api/invoices`, `/api/invoices/{id}` (inkl. Leistungen, Bestellung + Bestellpositionen)
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
- Linkes Panel: Rechnungsdetails in Grid-Layout + Leistungstabelle (Bezeichnung, Menge, Wert)
- Rechtes Panel: Bestellungsdetails inkl. Adressen, Versand & Kosten + Bestellpositionstabelle
- **Abweichungs-Erkennung** zwischen Rechnung und Bestellung:
  - Gesamtpreis ↔ Gesamtwert
  - Datum ↔ Datum
  - Leistungen ↔ Bestellpositionen (Bezeichnung, Menge, Wert/Einzelpreis, Anzahl)
  - Abweichende Felder werden mit ⚠-Icon und roter Hervorhebung markiert (beide Seiten)
  - Überzählige Leistungen werden **nicht** markiert, wenn ihr Wert einem Bestellungsfeld entspricht (Rabatt, Versandkosten, MwSt., Zwischensumme)

**Styling (`index.css`)**
- XQT5 Corporate Design:
  - Primary: `#ee7f00` (Orange)
  - Dark: `#213452` (Navy-Blau)
  - White: `#ffffff`
- Mismatch-Styles: `.mismatch` (Feld-Ebene), `.cell-mismatch` (Tabellenzellen-Ebene), `.mismatch-icon`

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
- **bcrypt==4.0.1** (gepinnt wegen Kompatibilität mit passlib)
- slowapi
- supabase

Frontend (via `package.json`):
- React 19
- Vite 7
- serve (für Production Static Hosting)

## Supabase Tables

**Instance:** https://supabase.xqtfive.de (Self-hosted)

### Table: `rechnungen`

```sql
create table public.rechnungen (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone not null default now(),
  datum text null,
  nummer text null,
  bestellnummer text null,
  gesamtpreis text null,
  erbringer_name text null,
  erbringer_anschrift text null,
  erbringer_steuernummer text null,
  erbringer_umsatzsteuer text null,
  empfaenger_name text null,
  empfaenger_anschrift text null,
  constraint rechnungen_pkey primary key (id)
) TABLESPACE pg_default;

-- Migration für bestehende Tabelle:
-- ALTER TABLE rechnungen ADD COLUMN bestellnummer text null;
```

### Table: `leistungen`

```sql
create table public.leistungen (
  id bigint generated by default as identity not null,
  rechnungs_nummer text not null,
  bezeichnung text null,
  menge text null,
  wert text null,
  constraint leistungen_pkey primary key (id)
);

create index idx_leistungen_rechnungs_nummer on leistungen(rechnungs_nummer);
```

**Verknüpfung:** `leistungen.rechnungs_nummer` → `rechnungen.nummer`

### Table: `bestellungen`

```sql
create table public.bestellungen (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone not null default now(),
  bestellnummer text not null,
  datum text null,
  status text null,
  lieferadresse text null,
  rechnungsadresse text null,
  versandart text null,
  versandkosten text null,
  rabatt text null,
  mwst text null,
  zwischensumme text null,
  gesamtwert text null,
  constraint bestellungen_pkey primary key (id)
);

create unique index idx_bestellungen_bestellnummer on bestellungen(bestellnummer);
```

**Verknüpfung:** `rechnungen.bestellnummer` → `bestellungen.bestellnummer`

### Table: `bestellpositionen`

```sql
create table public.bestellpositionen (
  id bigint generated by default as identity not null,
  bestellnummer text not null,
  bezeichnung text null,
  menge text null,
  einzelpreis text null,
  constraint bestellpositionen_pkey primary key (id)
);

create index idx_bestellpositionen_bestellnummer on bestellpositionen(bestellnummer);
```

**Verknüpfung:** `bestellpositionen.bestellnummer` → `bestellungen.bestellnummer`

### Spaltenübersicht `rechnungen`

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | bigint | Primary Key (auto-increment) |
| `created_at` | timestamptz | Erstellungszeitpunkt (default: now()) |
| `datum` | text | Rechnungsdatum (z.B. "03.12.2025") |
| `nummer` | text | Rechnungsnummer |
| `bestellnummer` | text | Verknüpfung zu bestellungen.bestellnummer |
| `gesamtpreis` | text | Gesamtbetrag mit Währung (z.B. "89,88 €") |
| `erbringer_name` | text | Name des Leistungserbringers |
| `erbringer_anschrift` | text | Anschrift des Leistungserbringers |
| `erbringer_steuernummer` | text | Steuernummer |
| `erbringer_umsatzsteuer` | text | Umsatzsteuer-ID |
| `empfaenger_name` | text | Name des Leistungsempfängers |
| `empfaenger_anschrift` | text | Anschrift des Leistungsempfängers |

### Spaltenübersicht `leistungen`

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | bigint | Primary Key (auto-increment) |
| `rechnungs_nummer` | text | Verknüpfung zu rechnungen.nummer |
| `bezeichnung` | text | Leistungsbezeichnung |
| `menge` | text | Menge (z.B. "1", "2") |
| `wert` | text | Leistungswert (z.B. "8,00 €") |

### Spaltenübersicht `bestellungen`

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | bigint | Primary Key (auto-increment) |
| `created_at` | timestamptz | Erstellungszeitpunkt (default: now()) |
| `bestellnummer` | text | Eindeutige Bestellnummer |
| `datum` | text | Bestelldatum |
| `status` | text | Status (z.B. "offen", "versendet", "abgeschlossen", "bestätigt") |
| `lieferadresse` | text | Lieferadresse |
| `rechnungsadresse` | text | Rechnungsadresse |
| `versandart` | text | Versandart (z.B. "DPD Paketversand (1-2 Tage)") |
| `versandkosten` | text | Versandkosten (z.B. "5,99 €") |
| `rabatt` | text | Rabatt (z.B. "9,74 €") |
| `mwst` | text | Mehrwertsteuer (z.B. "9,78 €") |
| `zwischensumme` | text | Zwischensumme (z.B. "55,25 €") |
| `gesamtwert` | text | Gesamtwert der Bestellung |

### Spaltenübersicht `bestellpositionen`

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | bigint | Primary Key (auto-increment) |
| `bestellnummer` | text | Verknüpfung zu bestellungen.bestellnummer |
| `bezeichnung` | text | Positionsbezeichnung |
| `menge` | text | Menge (z.B. "1", "2") |
| `einzelpreis` | text | Einzelpreis (z.B. "64,99 €") |

### Row Level Security (RLS)

**Aktueller Status:** RLS deaktiviert

Für Produktionsbetrieb mit RLS:
```sql
-- RLS aktivieren
ALTER TABLE rechnungen ENABLE ROW LEVEL SECURITY;

-- Lesezugriff für authentifizierte User
CREATE POLICY "Allow authenticated read" ON rechnungen
FOR SELECT TO authenticated USING (true);
```

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
5. **bcrypt/passlib Fehler**: `bcrypt>=4.1` ist inkompatibel mit `passlib` - daher `bcrypt==4.0.1` gepinnt
6. **Keine Rechnungen angezeigt**: Prüfe ob RLS in Supabase deaktiviert ist oder eine SELECT Policy existiert
7. **"failed to fetch" bei Registration**: Meist bcrypt-Problem oder Backend nicht erreichbar

## Gelöste Probleme (2026-02-02)

| Problem | Symptom | Ursache | Lösung |
|---------|---------|---------|--------|
| Registration fehlgeschlagen | "failed to fetch" / 500 Error | bcrypt 4.1+ inkompatibel mit passlib | `bcrypt==4.0.1` in pyproject.toml gepinnt |
| Keine Rechnungen | Leere Liste trotz Daten in DB | Supabase RLS ohne Policy | RLS deaktiviert oder Policy erstellt |

## Coolify Deployment

Deploy als zwei separate Services auf Coolify.

### Backend Service

| Einstellung | Wert |
|-------------|------|
| Git Source | https://github.com/christian-rost/view-invoices |
| Branch | main |
| Base Directory | `/` |
| Build Pack | Nixpacks |
| Port | 8001 |

**Environment Variables:**
```
JWT_SECRET=<generiert mit: openssl rand -base64 32>
SUPABASE_URL=https://supabase.xqtfive.de
SUPABASE_KEY=<dein-supabase-anon-key>
CORS_ORIGINS=https://view-invoices-frontend.xqtfive.de
admin_user=admin
admin_pw=<sicheres-passwort>
```

**Persistent Storage:** Nicht zwingend erforderlich (User werden in JSON gespeichert, gehen bei Redeploy verloren). Für persistente User optional Volume für `/app/data`.

### Frontend Service

| Einstellung | Wert |
|-------------|------|
| Git Source | https://github.com/christian-rost/view-invoices |
| Branch | main |
| Base Directory | `/frontend` |
| Build Pack | Nixpacks |
| Port | 3000 |

**Environment Variables:**
```
VITE_API_BASE=https://view-invoices-backend.xqtfive.de
```

**nixpacks.toml** (bereits im Repo):
```toml
[phases.setup]
nixPkgs = ["nodejs_22"]

[phases.install]
cmds = ["npm install"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npx serve dist -s -p 3000 -L"
```

### Deployment-Reihenfolge

1. Backend zuerst deployen
2. Health-Check: `curl https://view-invoices-backend.xqtfive.de/api/health`
3. Frontend deployen
4. Supabase RLS prüfen/konfigurieren
