#!/bin/sh
set -e
# deploy_app.sh
# Run a one-time deploy (write .env from environment if provided and start compose).

APP_DIR="/home/${DEPLOY_USER:-ubuntu}/app"
mkdir -p ${APP_DIR}
chown ${DEPLOY_USER:-ubuntu}:${DEPLOY_USER:-ubuntu} ${APP_DIR} || true

# If runtime env variables are provided to this script, write them to .env
cat > ${APP_DIR}/.env <<EOF
VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
VITE_SUPABASE_KEY=${VITE_SUPABASE_KEY}
VITE_API_KEY=${VITE_API_KEY}
EOF

if [ -f "${APP_DIR}/docker-compose.yml" ]; then
  cd ${APP_DIR}
  docker compose pull || true
  docker compose up -d --remove-orphans
  echo "App deployed"
else
  echo "Please place your docker-compose.yml into ${APP_DIR} then rerun this script."
fi
