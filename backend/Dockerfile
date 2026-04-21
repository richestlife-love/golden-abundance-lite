# syntax=docker/dockerfile:1.7

# -------- build stage --------
FROM python:3.14-slim AS build

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

RUN pip install --no-cache-dir uv==0.11.7

WORKDIR /app

# Copy manifests first for layer caching: a source-only change doesn't bust the deps layer.
COPY pyproject.toml uv.lock ./

RUN uv sync --frozen --no-dev --no-install-project

# Now copy the project + sync again to install the project itself.
COPY . .
RUN uv sync --frozen --no-dev

# -------- runtime stage --------
FROM python:3.14-slim AS runtime

# libpq for psycopg (binary wheel bundles libpq but not the shared system dep on slim).
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Non-root user — Railway doesn't require it but it's cheap hygiene.
RUN useradd --create-home --uid 1000 app
USER app

COPY --from=build --chown=app:app /app /app

ENV PATH="/app/.venv/bin:${PATH}" \
    PYTHONPATH="/app/src" \
    PYTHONUNBUFFERED=1 \
    PORT=8000

EXPOSE 8000

# Alembic runs migrations idempotently on every container start. If the migration
# fails, the container exits non-zero → Railway keeps the previous deployment live.
CMD ["sh", "-c", "alembic upgrade head && uvicorn backend.server:app --host 0.0.0.0 --port ${PORT}"]
