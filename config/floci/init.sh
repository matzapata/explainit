#!/bin/sh
set -eu

ENDPOINT="${AWS_ENDPOINT_URL:-http://floci:4566}"
BUCKET="${S3_BUCKET:-explainit}"

echo "Waiting for Floci at ${ENDPOINT}..."
i=0
while [ "$i" -lt 60 ]; do
  if aws s3api list-buckets --endpoint-url "$ENDPOINT" >/dev/null 2>&1; then
    break
  fi
  i=$((i + 1))
  sleep 1
done
if [ "$i" -eq 60 ]; then
  echo "Floci did not become ready" >&2
  exit 1
fi

if aws s3api head-bucket --bucket "$BUCKET" --endpoint-url "$ENDPOINT" >/dev/null 2>&1; then
  echo "S3 bucket ${BUCKET} already exists"
else
  echo "Creating S3 bucket ${BUCKET}"
  aws s3api create-bucket --bucket "$BUCKET" --endpoint-url "$ENDPOINT"
fi

aws s3api put-bucket-cors \
  --bucket "$BUCKET" \
  --cors-configuration file:///cors.json \
  --endpoint-url "$ENDPOINT"

echo "Floci ready: bucket=${BUCKET}"
