#!/usr/bin/env bash
# Controlled Git subtree synchronization for ULTRST Armada.
set -euo pipefail
usage() { echo "Usage: $0 <pull|split> <component> [upstream-ref]" >&2; exit 2; }
[[ $# -ge 2 && $# -le 3 ]] || usage
ACTION=$1 COMPONENT=$2 REF=${3:-main}
case "$COMPONENT" in
  GutTS|KrnlTS|FrnlTS|Kloks|Floks) PREFIX="libraries/$COMPONENT"; REMOTE="dinilmusick/$COMPONENT";;
  Skipo) PREFIX="scaffold/Skipo"; REMOTE="dinilmusick/Skipo";;
  Aiko) PREFIX="apps/Aiko"; REMOTE="dinilmusick/Aiko";;
  SRKL) PREFIX="apps/SRKL"; REMOTE="dinilmusick/Srkl-Engine";;
  Kone) PREFIX="apps/Kone"; REMOTE="dinilmusick/Kone";;
  *) echo "Unknown component: $COMPONENT" >&2; exit 2;;
esac
[[ "$REF" =~ ^[a-zA-Z0-9._/-]+$ && "$REF" != -* ]] || usage
[[ -d "$PREFIX" ]] || { echo "Component not imported: $PREFIX" >&2; exit 1; }
[[ -z "$(git status --porcelain)" ]] || { echo "Refusing dirty working tree" >&2; exit 1; }
[[ "$(git branch --show-current)" != main ]] || { echo "Operate from a feature branch, never main" >&2; exit 1; }
URL="https://github.com/$REMOTE.git"
case "$ACTION" in
  pull)
    git subtree pull --prefix="$PREFIX" "$URL" "$REF" --squash
    echo "Review and open a PR against Armada/main; do not force push."
    ;;
  split)
    SHA=$(git subtree split --prefix="$PREFIX")
    BRANCH="sync/${COMPONENT,,}-$(git rev-parse --short "$SHA")"
    git branch "$BRANCH" "$SHA"
    echo "Created local export branch $BRANCH at $SHA."
    echo "Inspect diff against $REMOTE:$REF; push to a NEW branch on the standalone repo and open a PR. Never push directly to its default branch."
    ;;
  *) usage;;
esac
