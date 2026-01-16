#!/bin/sh
set -e

# bootstrap_server.sh
# Usage: sudo ./scripts/bootstrap_server.sh <deploy_user>
# This script installs Docker, the compose plugin, creates helper scripts and systemd units
# to auto-update and restart the app.

DEPLOY_USER=${1:-$(logname 2>/dev/null || echo ubuntu)}
APP_DIR="/home/${DEPLOY_USER}/app"

echo "Bootstrap start: deploy user=${DEPLOY_USER}, app dir=${APP_DIR}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root: sudo $0 [deploy_user]"
  exit 1
fi

apt-get update
apt-get install -y ca-certificates curl gnupg lsb-release

if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker..."
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable docker --now
else
  echo "Docker already installed"
fi

# Add deploy user to docker group (non-root docker usage)
if id "${DEPLOY_USER}" >/dev/null 2>&1; then
  usermod -aG docker ${DEPLOY_USER} || true
else
  echo "User ${DEPLOY_USER} does not exist; create with 'adduser ${DEPLOY_USER}' and re-run to grant docker access."
fi

mkdir -p ${APP_DIR}
chown ${DEPLOY_USER}:${DEPLOY_USER} ${APP_DIR}

echo "Installing helper scripts..."
install -m 0755 -D scripts/update_and_restart.sh /usr/local/bin/intellitask-update.sh
install -m 0755 -D scripts/deploy_app.sh /usr/local/bin/intellitask-deploy.sh

echo "Installing systemd unit and timer..."
install -m 0644 -D scripts/systemd/intellitask-updater.service /etc/systemd/system/intellitask-updater.service
install -m 0644 -D scripts/systemd/intellitask-updater.timer /etc/systemd/system/intellitask-updater.timer

systemctl daemon-reload
systemctl enable --now intellitask-updater.timer

echo "Bootstrap complete."
echo "Next: place your project's docker-compose.yml into ${APP_DIR} (git clone or copy), create ~/app/.env with runtime vars, then run:"
echo "  sudo /usr/local/bin/intellitask-deploy.sh"
