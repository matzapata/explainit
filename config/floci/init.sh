#!/bin/sh
set -eu

ENDPOINT="${AWS_ENDPOINT_URL:-http://floci:4566}"
DOC_BUCKET="${S3_BUCKET:-explainit}"
CDN_BUCKET="${LAUNCHER_S3_BUCKET:-explainit-cdn}"

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

ensure_bucket() {
  bucket="$1"
  if aws s3api head-bucket --bucket "$bucket" --endpoint-url "$ENDPOINT" >/dev/null 2>&1; then
    echo "S3 bucket ${bucket} already exists"
  else
    echo "Creating S3 bucket ${bucket}"
    aws s3api create-bucket --bucket "$bucket" --endpoint-url "$ENDPOINT"
  fi
  aws s3api put-bucket-cors \
    --bucket "$bucket" \
    --cors-configuration file:///cors.json \
    --endpoint-url "$ENDPOINT"
}

ensure_bucket "$DOC_BUCKET"
ensure_bucket "$CDN_BUCKET"

# Host pages load launcher.js with a classic <script src>. Anonymous GET.
cat >/tmp/cdn-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadLauncher",
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::${CDN_BUCKET}/*"
    }
  ]
}
EOF
aws s3api put-bucket-policy \
  --bucket "$CDN_BUCKET" \
  --policy file:///tmp/cdn-policy.json \
  --endpoint-url "$ENDPOINT"

# Pasted text resources are public citation URLs (resources/{chatId}/{id}.md).
cat >/tmp/doc-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadTextResources",
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::${DOC_BUCKET}/resources/*"
    }
  ]
}
EOF
aws s3api put-bucket-policy \
  --bucket "$DOC_BUCKET" \
  --policy file:///tmp/doc-policy.json \
  --endpoint-url "$ENDPOINT"

echo "Floci ready: buckets=${DOC_BUCKET},${CDN_BUCKET}"
