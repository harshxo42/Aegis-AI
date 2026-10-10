"""
Aegis AI – Neon Database Validation Script

Run this BEFORE and AFTER 'alembic upgrade head' to verify the Neon
PostgreSQL database state.  Never prints credentials.

Usage:
    cd backend
    python scripts/validate_neon_migration.py
"""
import asyncio
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings
from app.core.database import engine


EXPECTED_TABLES = {
    "users",
    "hospitals",
    "departments",
    "doctors",
    "ambulances",
    "patients",
    "emergency_requests",
    "medical_reports",
    "predictions",
    "notifications",
    "audit_logs",
}

EXPECTED_ENUMS = {
    "hospitaltype",
    "userrole",
    "ambulancetype",
    "ambulancestatus",
    "notificationtype",
    "emergencytype",
    "emergencystatus",
    "predictiontype",
}


async def main() -> None:
    db_type = settings.DATABASE_URL.split("://")[0].split("+")[0]
    host_hint = settings.DATABASE_URL.split("@")[-1].split("/")[0] if "@" in settings.DATABASE_URL else "unknown"
    print(f"\n{'='*60}")
    print(f"  Aegis AI – Neon DB Validation")
    print(f"  DB driver : {settings.DATABASE_URL.split('://')[0]}")
    print(f"  DB host   : {host_hint}")
    print(f"{'='*60}\n")

    if db_type == "sqlite":
        print("WARNING: DATABASE_URL points to SQLite, not Neon PostgreSQL.")
        print("Set DATABASE_URL to your Neon connection string before running.")
        sys.exit(1)

    async with engine.connect() as conn:
        # 1. Tables present
        result = await conn.execute(
            __import__("sqlalchemy").text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema = 'public' ORDER BY table_name"
            )
        )
        found_tables = {row[0] for row in result}
        print(f"Tables found ({len(found_tables)}):")
        for t in sorted(found_tables):
            status = "OK" if t in EXPECTED_TABLES else "EXTRA"
            print(f"  [{status}] {t}")

        missing = EXPECTED_TABLES - found_tables
        if missing:
            print(f"\n  MISSING tables: {sorted(missing)}")
        else:
            print(f"\n  All {len(EXPECTED_TABLES)} expected tables present.")

        # 2. Alembic version
        if "alembic_version" in found_tables:
            result = await conn.execute(
                __import__("sqlalchemy").text("SELECT version_num FROM alembic_version")
            )
            versions = [row[0] for row in result]
            print(f"\nAlembic version(s) in DB: {versions}")
        else:
            print("\nalembic_version table NOT found (migration not yet applied)")

        # 3. ENUM types (PostgreSQL only)
        result = await conn.execute(
            __import__("sqlalchemy").text(
                "SELECT typname FROM pg_type "
                "JOIN pg_namespace ON pg_namespace.oid = pg_type.typnamespace "
                "WHERE pg_namespace.nspname = 'public' AND typtype = 'e' "
                "ORDER BY typname"
            )
        )
        found_enums = {row[0] for row in result}
        print(f"\nPostgreSQL ENUM types found ({len(found_enums)}):")
        for e in sorted(found_enums):
            status = "OK" if e in EXPECTED_ENUMS else "EXTRA"
            print(f"  [{status}] {e}")

        missing_enums = EXPECTED_ENUMS - found_enums
        if missing_enums:
            print(f"\n  MISSING enum types: {sorted(missing_enums)}")

        # 4. Hospital count
        if "hospitals" in found_tables:
            result = await conn.execute(
                __import__("sqlalchemy").text("SELECT COUNT(*) FROM hospitals")
            )
            count = result.scalar()
            print(f"\nHospitals in DB: {count}")
        else:
            print("\nHospitals table not yet created.")

    await engine.dispose()
    print(f"\n{'='*60}")
    if not missing:
        print("  RESULT: Database looks GOOD.")
    else:
        print(f"  RESULT: {len(missing)} table(s) missing – run 'alembic upgrade head'")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    asyncio.run(main())
