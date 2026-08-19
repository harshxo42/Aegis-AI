# Aegis AI — Emergency Healthcare Response Platform

Aegis AI is a full-stack emergency healthcare platform that combines AI-assisted healthcare workflows, emergency response, hospital services, maps, analytics, secure authentication, and role-based access control into a single web application.

## Core Features

### Emergency & SOS Management

* Emergency creation and management
* Hospital and ambulance workflows
* Location-aware emergency response
* Real-time communication infrastructure

### AI Healthcare Assistant

* AI-powered healthcare conversations
* Server-side AI integration
* Safety-focused, non-diagnostic responses
* Emergency escalation guidance

### AI Medical Report Analysis

* PDF medical report upload
* PDF text extraction
* AI-assisted report analysis
* Medical and non-medical document handling

### Search & Healthcare Discovery

* Healthcare-related search
* Hospital discovery
* Patient and doctor workflows

### Authentication & RBAC

* JWT-based authentication
* Role-based authorization
* Protected API routes
* Redis-backed token revocation

### Hospital & Patient Management

* Hospital information
* Departments and doctors
* Patient workflows
* Hospital availability functionality

### Maps & Location Services

* Interactive maps using Leaflet
* Location-based healthcare services
* Hospital and emergency location workflows

### Analytics

* Healthcare and operational analytics
* Dashboard visualizations using Recharts

### Responsive UI

* Modern React interface
* Responsive layouts
* Tailwind CSS
* Framer Motion animations
* Interactive notifications and UI components

## Architecture

```text
React Frontend
     │
     │ HTTPS / REST
     ▼
FastAPI Backend
     │
     ├──────────────► Database
     │
     ├──────────────► Redis
     │                 └── Token Revocation
     │
     ├──────────────► AI Provider
     │                 └── OpenRouter
     │
     └──────────────► Celery
                       └── Background Processing
```

## Technology Stack

### Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS
* Framer Motion
* Redux Toolkit
* TanStack React Query
* React Router
* Axios
* Leaflet / React-Leaflet
* Recharts
* React Markdown
* Lucide React
* React Icons

### Backend

* Python
* FastAPI
* SQLAlchemy
* Alembic
* Redis
* Celery
* Pydantic
* JWT / Python-JOSE
* bcrypt
* pypdf
* OpenAI Python SDK
* Prometheus FastAPI Instrumentator
* Uvicorn



## Security

Aegis AI keeps sensitive operations on the backend and applies multiple security controls:

* JWT-based authentication
* Role-based access control
* Protected API routes
* Redis-backed token revocation
* Secure password hashing with bcrypt
* Server-side AI API integration
* CORS configuration
* SQLAlchemy ORM
* Environment-based secrets
* AI API keys are not exposed to the frontend

### Token Revocation

When a user logs out, the active access token is revoked through the backend and Redis-backed invalidation mechanism.

A previously issued token is rejected after logout instead of remaining usable until normal expiration.

## AI Integration

AI requests are handled server-side through the FastAPI backend.

The frontend does not directly expose AI provider credentials.

AI functionality includes:

* Healthcare assistant conversations
* AI-assisted predictions and triage support
* Medical report analysis
* PDF-based report processing
* Safety-oriented, non-diagnostic guidance

AI-generated information is intended as assistance and does not replace professional medical diagnosis or emergency medical care.

## Medical Report Processing

The medical report workflow supports PDF uploads and server-side processing.

Production verification included:

* Medical PDF testing
* Additional medical PDF testing
* Non-medical PDF testing
* Additional non-medical PDF testing

The tested inputs produced the expected application behavior.

## Testing

The backend currently has:

* **246 automated tests**
* **93% test coverage**
* GitHub CI verification

Testing covers important areas including:

* Authentication
* Authorization / RBAC
* AI functionality
* PDF processing
* Emergency workflows
* Hospital functionality
* API validation
* Security behavior
* Error handling

Major frontend production workflows have also been smoke-tested.

## Production Deployment

### Frontend

Deployed on **Vercel**.

### Backend

Deployed on **Render**.

Production health verification confirms that the backend is running successfully in the production environment.

## Local Development

### Prerequisites

* Node.js
* Python 3.10+
* Docker / Docker Compose
* PostgreSQL
* Redis

### Backend

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
```

Configure environment variables using:

```text
backend/.env.example
```

Run migrations:

```bash
alembic upgrade head
```

Start the backend:

```bash
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
```

Configure:

```text
VITE_API_URL=http://localhost:8000
```

Start the development server:

```bash
npm run dev
```

### Frontend Build

```bash
npm run build
```

### Frontend Lint

```bash
npm run lint
```

### Backend Tests

```bash
cd backend
pytest
```

For coverage:

```bash
pytest --cov=app --cov-report=term-missing
```


## Project Structure

```text
Aegis AI/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── alembic/
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── docs/
├── scripts/
├── docker-compose.yml
└── README.md