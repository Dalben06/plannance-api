#!/usr/bin/env bash
set -euo pipefail

cd "$CLAUDE_PROJECT_DIR"

INPUT_JSON="$(cat)"
TOOL_NAME="$(printf '%s' "$INPUT_JSON" | jq -r '.tool_name // empty')"
FILE_PATH="$(printf '%s' "$INPUT_JSON" | jq -r '.tool_input.file_path // empty')"

echo "Tool: $TOOL_NAME"
echo "File: $FILE_PATH"

case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.vue|*.json|*.css|*.scss|*.md)
    ;;
  *)
    echo "Skipping checks for non-code file."
    exit 0
    ;;
esac

echo "Running post-edit checks..."

if npm run | grep -q " format"; then
  echo "→ npm run format"
  npm run format
fi

if npm run | grep -q " lint"; then
  echo "→ npm run lint"
  npm run lint
fi

echo "→ npx tsc --noEmit"
npx tsc --noEmit

echo "Post-edit checks passed."