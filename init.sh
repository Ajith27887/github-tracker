#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

INSTALL_CMD=(npm install)
SERVER_INSTALL_CMD=(npm install --prefix server)
VERIFY_CMD=(npx tsc --noEmit)
START_CMD=(npm run dev)
SERVER_START_CMD=(npm run dev --prefix server)

echo "==> Working directory: $PWD"

echo "==> Installing frontend dependencies"
"${INSTALL_CMD[@]}"

echo "==> Installing server dependencies"
"${SERVER_INSTALL_CMD[@]}"

echo "==> Running baseline type-check (frontend)"
"${VERIFY_CMD[@]}"

echo ""
echo "==> Startup commands"
echo "    Frontend : $(printf '%q ' "${START_CMD[@]}")"
echo "    Server   : $(printf '%q ' "${SERVER_START_CMD[@]}")"
echo ""

if [ "${RUN_START_COMMAND:-0}" = "1" ]; then
  echo "==> Starting frontend (background) and server"
  "${START_CMD[@]}" &
  exec "${SERVER_START_CMD[@]}"
fi

echo "Set RUN_START_COMMAND=1 to launch both frontend and server."
