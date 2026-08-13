# Aegis AI — Emergency Healthcare Response Platform

Aegis AI is a comprehensive, full-stack emergency healthcare platform designed to streamline emergency response, triage, and medical facility coordination. It leverages modern web technologies and AI to provide real-time insights, interactive location-based services, and intelligent healthcare assistance.

## 🚀 Key Features

*   **Emergency SOS Workflow:** Rapid dispatch and routing for emergency situations with live Leaflet-based geolocation for hospitals, ambulances, and patients.
*   **Intelligent Triage & AI Predictions:** Secure, server-side AI integration using the OpenAI API to analyze symptoms and provide non-diagnostic medical guidance and triage prioritization.
*   **AI Healthcare Assistant:** An interactive conversational interface for medical guidance, securely powered by the backend without exposing API keys.
*   **Role-Based Access Control:** Distinct workflows for patients, hospitals, and ambulance services.
*   **Real-time Availability:** Live tracking of hospital bed availability, ICU capacity, and ambulance dispatch status.
*   **Responsive UI:** A production-ready, glassmorphism-inspired design system built with React, Tailwind CSS, and Framer Motion, ensuring usability across mobile, tablet, and desktop devices.
*   **Secure & Scalable Backend:** A robust FastAPI backend with PostgreSQL, Redis, and strict JWT-based authentication.

## 🏗️ Architecture & Tech Stack

Aegis AI follows a modern, decoupled architecture:

```
Frontend (React)  ==[HTTPS/REST]==>  Backend (FastAPI)  ====>  PostgreSQL / Redis
                                            |
                                            ====>  AI Service (OpenAI)
```

### Frontend
*   **Framework:** React 18, TypeScript, Vite
*   **Styling:** Tailwind CSS, Framer Motion, CSS Variables for theming
*   **State Management:** Redux Toolkit
*   **Routing:** React Router v6
*   **Maps:** Leaflet & React-Leaflet
*   **Deployment:** Vercel

### Backend
*   **Framework:** FastAPI, Python 3
*   **Database:** PostgreSQL (SQLAlchemy ORM, Alembic migrations)
*   **Caching & Queue:** Redis
*   **AI Integration:** Official `AsyncOpenAI` Python SDK (Server-Side Only)
*   **Authentication:** JWT (JSON Web Tokens) with refresh token rotation

## 🤖 AI Integration & Security

Aegis AI integrates the OpenAI API strictly through the FastAPI backend to ensure maximum security.
*   **No API keys** are ever exposed to the frontend or committed to source control.
*   The AI operates as an assistant, strictly adhering to a safety-first system prompt that emphasizes emergency redirection and non-definitive diagnosis.

## 🛠️ Local Development Setup

### Prerequisites
*   Node.js 18+
*   Python 3.10+
*   Docker & Docker Compose (for database/Redis)

### Backend Setup
1.  Navigate to the backend directory: `cd backend`
2.  Create a virtual environment: `python -m venv venv`
3.  Activate the environment: `source venv/bin/activate` (or `venv\Scripts\activate` on Windows)
4.  Install dependencies: `pip install -r requirements.txt`
5.  Create a `.env` file based on `.env.example` and add your `OPENAI_API_KEY`.
6.  Start Docker services (PostgreSQL & Redis): `docker-compose up -d`
7.  Run migrations: `alembic upgrade head`
8.  Start the server: `uvicorn app.main:app --reload`

### Frontend Setup
1.  Navigate to the frontend directory: `cd frontend`
2.  Install dependencies: `npm install`
3.  Create a `.env` file containing `VITE_API_URL=http://localhost:8000`
4.  Start the development server: `npm run dev`

## 🧪 Testing

*   **Backend:** Run `pytest` in the `backend` directory.
*   **Frontend:** The frontend is statically typed with strict TypeScript checks (`npm run build`).

## 🔒 Security

*   CORS is strictly configured on the backend.
*   All routes are protected by robust JWT validation and role-based guards.
*   Database interaction uses SQLAlchemy ORM to prevent SQL injection.

## 🔮 Future Improvements
*   Real-time WebSockets for live ambulance tracking and instant notifications.
*   Production OCR integration for automated medical report parsing.
*   Multilingual support for accessibility in diverse regions.
