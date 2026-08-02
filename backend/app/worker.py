"""
Aegis AI – Background Worker Configuration

Celery application instance configured to use Redis as a message broker and result backend.
"""

from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "aegis_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
)

@celery_app.task
def example_background_task(data: dict) -> dict:
    """An example background task for processing data."""
    # Logic for heavy processing (e.g., AI inference offline, sending emails) goes here
    return {"status": "success", "processed_data": data}
