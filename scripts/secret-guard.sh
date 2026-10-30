#!/usr/bin/env bash
# Fail if any committed file is a key/PEM, a service-account JSON,
# or contains a private key field. Scans tracked files only.
set -euo pipefail

bad=0
shopt -s nocasematch

while IFS= read -r -d '' f; do
  base=${f##*/}
  case "$base" in
    *.pem|*.key)
      echo "secret-guard: forbidden file $f"
      bad=1
      ;;
    *service-account*.json|*service_account*.json|*serviceaccount*.json)
      echo "secret-guard: service-account file $f"
      bad=1
      ;;
  esac
done < <(git ls-files -z)

pk=$(printf '%s_%s' private key)
if git grep -n -I -F -e "$pk" -- .; then
  echo "secret-guard: found ${pk}"
  bad=1
fi

if git grep -n -I -E -e '-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----' -- .; then
  echo "secret-guard: found a PEM private key"
  bad=1
fi

if git grep -n -I -E -e '"type"[[:space:]]*:[[:space:]]*"service_account"' -- .; then
  echo "secret-guard: found a service-account JSON"
  bad=1
fi

if [[ "$bad" -ne 0 ]]; then
  exit 1
fi

echo "secret-guard: ok"
