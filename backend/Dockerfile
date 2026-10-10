# Stage 1: Build dependencies
FROM python:3.11-slim as builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim

WORKDIR /app
COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.txt .

RUN pip install --no-cache /wheels/*

COPY . .

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Startup order matters:
#   1. alembic upgrade head   — creates all 11 tables (idempotent)
#   2. seed_hospitals.py      — inserts demo data (idempotent, skips existing)
#   3. uvicorn                — starts the API server
CMD ["sh", "-c", "set -e && alembic upgrade head && python scripts/seed_hospitals.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]