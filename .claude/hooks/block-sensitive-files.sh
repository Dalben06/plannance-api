#!/usr/bin/env bash
set -euo pipefail

INPUT_JSON="$(cat)"

TOOL_NAME="$(printf '%s' "$INPUT_JSON" | jq -r '.tool_name // empty')"

# Alguns tools usam file_path, outros pattern ou path.
FILE_PATH="$(printf '%s' "$INPUT_JSON" | jq -r '
  .tool_input.file_path //
  .tool_input.path //
  .tool_input.pattern //
  .tool_input.absolute_path //
  ""
')"

# Lista de padrões sensíveis
if printf '%s' "$FILE_PATH" | grep -Eiq '(^|/)\.env($|\.|/)|(^|/)\.env\.[^/]+$|(^|/)secrets?($|/)|(^|/)credentials?($|/)|(^|/)id_rsa($|/)|(^|/)id_ed25519($|/)|(^|/)private[-_.]?key($|/)|(^|/)key\.pem($|/)|(^|/)cert\.pem($|/)|(^|/)firebase-adminsdk.*\.json$|(^|/)service-account.*\.json$'; then
  jq -n --arg reason "Blocked: access to sensitive files is not allowed (.env, secrets, credentials, private keys, service accounts)." \
    '{ ok: false, reason: $reason }'
  exit 0
fi

jq -n '{ ok: true }'