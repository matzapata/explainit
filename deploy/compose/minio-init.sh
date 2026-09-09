#!/bin/sh
set -eu

ENDPOINT="${MINIO_ENDPOINT:-http://minio:9000}"
DOC_BUCKET="${S3_BUCKET:-explainit}"
ROOT_USER="${MINIO_ROOT_USER:-explainit}"
ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-explainitsecret}"

echo "Waiting for MinIO at ${ENDPOINT}..."
i=0
while [ "$i" -lt 60 ]; do
  if mc alias set local "$ENDPOINT" "$ROOT_USER" "$ROOT_PASSWORD" >/dev/null 2>&1 \
    && mc ready local >/dev/null 2>&1; then
    break
  fi
  i=$((i + 1))
  sleep 1
done
if [ "$i" -eq 60 ]; then
  echo "MinIO did not become ready" >&2
  exit 1
fi

if mc ls "local/${DOC_BUCKET}" >/dev/null 2>&1; then
  echo "S3 bucket ${DOC_BUCKET} already exists"
else
  echo "Creating S3 bucket ${DOC_BUCKET}"
  mc mb "local/${DOC_BUCKET}"
fi

# Anonymous GET for citation markdown under resources/{chatId}/{id}.md
# (community MinIO CORS is global via MINIO_API_CORS_ALLOW_ORIGIN on the server)
mc anonymous set download "local/${DOC_BUCKET}/resources" >/dev/null 2>&1 || true

echo "MinIO ready: bucket=${DOC_BUCKET} public_url=${PUBLIC_URL:-http://localhost}/${DOC_BUCKET}/"
