#!/bin/sh
set -e
# remote_bootstrap_example.sh
# One-file script that performs the README steps on a remote Ubuntu host.
# Usage: sudo ./scripts/remote_bootstrap_example.sh [deploy_user]
# Example: sudo ./scripts/remote_bootstrap_example.sh ubuntu

DEPLOY_USER=${1:-ubuntu}
APP_DIR="/home/${DEPLOY_USER}/app"

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root: sudo $0 [deploy_user]"
  exit 1
fi

echo "== IntelliTask remote bootstrap (user=${DEPLOY_USER}) =="

echo "1) Update and install prerequisites"
apt-get update
apt-get install -y ca-certificates curl gnupg lsb-release

echo "2) Install Docker and Compose plugin if not present"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable docker --now
else
  echo "Docker already installed"
fi

echo "3) Ensure deploy user exists and is in docker group"
if id "${DEPLOY_USER}" >/dev/null 2>&1; then
  usermod -aG docker ${DEPLOY_USER} || true
else
  echo "Creating user ${DEPLOY_USER}"
  adduser --disabled-password --gecos "" ${DEPLOY_USER}
  usermod -aG docker ${DEPLOY_USER} || true
fi

echo "4) Prepare app dir"
mkdir -p ${APP_DIR}
chown ${DEPLOY_USER}:${DEPLOY_USER} ${APP_DIR}
chmod 750 ${APP_DIR}

echo "5) Place docker-compose.yml into ${APP_DIR}"
if [ -f ./docker-compose.yml ]; then
  cp ./docker-compose.yml ${APP_DIR}/docker-compose.yml
  chown ${DEPLOY_USER}:${DEPLOY_USER} ${APP_DIR}/docker-compose.yml
  echo "Copied local docker-compose.yml to ${APP_DIR}"
else
  echo "No local docker-compose.yml found. Please place one at ${APP_DIR}/docker-compose.yml or git clone your deployment tree into ${APP_DIR}."
fi

echo "6) Create .env file (if variables provided via environment)"
if [ -n "${VITE_SUPABASE_URL}" ] || [ -n "${VITE_SUPABASE_KEY}" ] || [ -n "${VITE_API_KEY}" ]; then
  cat > ${APP_DIR}/.env <<EOF
VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
VITE_SUPABASE_KEY=${VITE_SUPABASE_KEY}
VITE_API_KEY=${VITE_API_KEY}
GHCR_USER=${GHCR_USER}
GHCR_TOKEN=${GHCR_TOKEN}
EOF
  chmod 600 ${APP_DIR}/.env
  chown ${DEPLOY_USER}:${DEPLOY_USER} ${APP_DIR}/.env
  echo "Wrote ${APP_DIR}/.env"
else
  echo "Environment variables VITE_SUPABASE_* or VITE_API_KEY not provided; skipping .env creation. You can create ${APP_DIR}/.env manually."
fi

echo "7) Optional: login to GHCR if GHCR_USER and GHCR_TOKEN provided"
if [ -n "${GHCR_USER}" ] && [ -n "${GHCR_TOKEN}" ]; then
  echo "Logging into GHCR as ${GHCR_USER}"
  echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USER}" --password-stdin
fi

echo "8) Deploy: pull image and start compose"
cd ${APP_DIR}
if [ -f docker-compose.yml ]; then
  docker compose pull || true
  docker compose up -d --remove-orphans
  echo "Deployment triggered"
else
  echo "docker-compose.yml missing in ${APP_DIR}; cannot start."
fi

echo "Bootstrap finished. Check service logs with: sudo journalctl -u intellitask-updater.service -f" 
