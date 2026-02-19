#!/usr/bin/env bash
set -e

cd infra
API_BASE=$(terraform output -raw api_base_url)
SITE_URL=$(terraform output -raw site_url)

SITE_BUCKET=$(echo $SITE_URL | sed 's|http://||' | cut -d'.' -f1)

cd ../app/site

# Create temp file with injected API
sed "s|__API_BASE__|$API_BASE|g" app.js > app.generated.js

# Upload files
aws s3 cp index.html s3://$SITE_BUCKET/
aws s3 cp styles.css s3://$SITE_BUCKET/
aws s3 cp app.generated.js s3://$SITE_BUCKET/app.js

# Clean up
rm app.generated.js

echo "Frontend deployed to: $SITE_URL"
