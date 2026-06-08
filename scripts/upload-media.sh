#!/usr/bin/env bash
# Sync staged videos in site/local-media/ to the bekofc-com-media S3 bucket.
# Bucket and CloudFront cache behavior are pre-provisioned (infra/s3.tf, infra/cloudfront.tf).
# Per project binding constraint: only the `default` AWS profile.
set -euo pipefail

BUCKET="bekofc-com-media"
SRC_DIR="site/local-media"
PROFILE="default"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "Missing source dir $SRC_DIR — run scripts/import-assets.mjs first."
  exit 1
fi

# Verify default profile is the right account
ACCOUNT_ID=$(aws sts get-caller-identity --profile "$PROFILE" --query Account --output text)
echo "Using AWS account: $ACCOUNT_ID (profile: $PROFILE)"
read -p "Continue with sync to s3://$BUCKET/ ? [y/N] " confirm
[[ "$confirm" == "y" || "$confirm" == "Y" ]] || { echo "Aborted."; exit 1; }

aws s3 sync "$SRC_DIR/" "s3://$BUCKET/" \
  --profile "$PROFILE" \
  --content-type "video/mp4" \
  --cache-control "public, max-age=86400"

echo "✓ Sync complete."
echo "Verify a file is reachable: curl -I https://bekofc.com/media/01-clip.mp4"
