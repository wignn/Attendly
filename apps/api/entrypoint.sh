#!/bin/sh
set -e

# Run database migrations automatically if binary and migrations exist
if [ -x "/app/migrate" ] && [ -d "/app/db/migrations" ]; then
    echo "[komas-api] Applying database migrations..."
    /app/migrate up || echo "[komas-api] Notice: migrations already at latest version or completed."
fi

exec "$@"
