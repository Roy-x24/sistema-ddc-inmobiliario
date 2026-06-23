#!/bin/sh
set -e

python - <<'PY'
import os
import time
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

database_url = os.environ["DATABASE_URL"]
engine = create_engine(database_url)

for intento in range(1, 31):
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("Base de datos lista.")
        break
    except OperationalError:
        print(f"Esperando base de datos... intento {intento}/30")
        time.sleep(2)
else:
    raise SystemExit("No se pudo conectar a la base de datos.")
PY

if [ "${RUN_DEMO_SEED:-true}" = "true" ]; then
  python seed_demo.py
fi

exec "$@"
