#!/usr/bin/env bash
set -euo pipefail

# Post-update hardening for production deploys.
# - clears stale Twig compiled cache (except .gitkeep)
# - ensures storage writable by web user/group

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_USER="www-data"
WEB_GROUP="www-data"
SKIP_CHOWN=0

usage() {
  cat <<'USAGE'
Usage:
  scripts/deploy-post-update.sh [--project-root PATH] [--web-user USER] [--web-group GROUP] [--skip-chown]

Options:
  --project-root PATH  Raiz do projeto (default: auto-detect)
  --web-user USER      Usuario do processo web (default: www-data)
  --web-group GROUP    Grupo do processo web (default: www-data)
  --skip-chown         Nao executa chown/chmod (somente limpeza de cache Twig)
  --help               Mostra esta ajuda
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-root)
      PROJECT_ROOT="${2:-}"
      shift 2
      ;;
    --web-user)
      WEB_USER="${2:-}"
      shift 2
      ;;
    --web-group)
      WEB_GROUP="${2:-}"
      shift 2
      ;;
    --skip-chown)
      SKIP_CHOWN=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "[error] argumento desconhecido: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$PROJECT_ROOT" ]]; then
  echo "[error] --project-root vazio" >&2
  exit 1
fi

STORAGE_DIR="$PROJECT_ROOT/storage"
TWIG_CACHE_DIR="$STORAGE_DIR/cache/twig"
LOG_DIR="$STORAGE_DIR/logs"
RATE_LIMIT_DIR="$STORAGE_DIR/rate-limit"

run_privileged() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
    return
  fi

  if command -v sudo >/dev/null 2>&1; then
    sudo "$@"
    return
  fi

  echo "[error] sudo nao encontrado e usuario atual nao e root; execute como root ou instale sudo." >&2
  exit 1
}

run_writable() {
  if "$@" 2>/dev/null; then
    return
  fi
  run_privileged "$@"
}

echo "[info] project root: $PROJECT_ROOT"
echo "[step] Garantindo estrutura de storage"
run_writable mkdir -p "$TWIG_CACHE_DIR" "$LOG_DIR" "$RATE_LIMIT_DIR"
run_writable touch "$TWIG_CACHE_DIR/.gitkeep" "$LOG_DIR/.gitkeep"

echo "[step] Limpando cache compilado do Twig"
run_writable find "$TWIG_CACHE_DIR" -type f ! -name '.gitkeep' -delete
run_writable find "$TWIG_CACHE_DIR" -mindepth 1 -type d -empty -delete

if [[ "$SKIP_CHOWN" -eq 0 ]]; then
  echo "[step] Ajustando ownership/permissoes em storage"
  run_privileged chown -R "${WEB_USER}:${WEB_GROUP}" "$STORAGE_DIR"
  run_privileged find "$STORAGE_DIR" -type d -exec chmod 2775 {} +
  run_privileged find "$STORAGE_DIR" -type f -exec chmod 0664 {} +
else
  echo "[skip] --skip-chown ativo; ownership/permissoes nao alterados"
fi

echo "[ok  ] post-update finalizado."
