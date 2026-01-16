#!/bin/sh
set -e
# update_and_restart.sh
# Pull latest image and restart application using docker compose in the app directory.

APP_DIR="/home/${DEPLOY_USER:-ubuntu}/app"
REPO_OWNER=${REPO_OWNER:-"your-ghcr-owner"}
IMAGE_NAME=${IMAGE_NAME:-"intellitask-ai"}
IMAGE_TAG=${IMAGE_TAG:-"latest"}

echo "Updating image ${REPO_OWNER}/${IMAGE_NAME}:${IMAGE_TAG}"

if [ -n "${GHCR_USER}" ] && [ -n "${GHCR_TOKEN}" ]; then
  echo "Logging into GHCR as ${GHCR_USER}"
  echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USER}" --password-stdin
fi

docker pull ghcr.io/${REPO_OWNER}/${IMAGE_NAME}:${IMAGE_TAG}

if [ -f "${APP_DIR}/docker-compose.yml" ]; then
  cd ${APP_DIR}
  docker compose pull || true
  docker compose up -d --remove-orphans
  docker image prune -f || true
  echo "Update complete"
else
  echo "No docker-compose.yml found in ${APP_DIR}. Skipping compose steps."
fi
