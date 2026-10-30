#!/usr/bin/env bash
# Fail if any committed file, including files that were later deleted,
# is a key/PEM, a service-account JSON, or contains a private key field.
# Also scans the pull-request diff when GITHUB_BASE_REF is set.
set -euo pipefail

bad=0
shopt -s nocasematch

if [[ "$(git rev-parse --is-shallow-repository 2>/dev/null || echo false)" == "true" ]]; then
  git fetch --unshallow --quiet origin || true
fi

check_name() {
  local f="$1"
  local base=${f##*/}
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
}

scan_tree() {
  local label="$1"
  shift
  if git grep -n -I -F -e "$pk" "$@"; then
    echo "secret-guard: found ${pk} in ${label}"
    bad=1
  fi
  if git grep -n -I -E -e '-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----' "$@"; then
    echo "secret-guard: found a PEM private key in ${label}"
    bad=1
  fi
  if git grep -n -I -E -e '"type"[[:space:]]*:[[:space:]]*"service_account"' "$@"; then
    echo "secret-guard: found a service-account JSON in ${label}"
    bad=1
  fi
}

scan_text() {
  local label="$1"
  local file="$2"
  if grep -n -F -e "$pk" "$file"; then
    echo "secret-guard: found ${pk} in ${label}"
    bad=1
  fi
  if grep -n -E -e '-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----' "$file"; then
    echo "secret-guard: found a PEM private key in ${label}"
    bad=1
  fi
  if grep -n -E -e '"type"[[:space:]]*:[[:space:]]*"service_account"' "$file"; then
    echo "secret-guard: found a service-account JSON in ${label}"
    bad=1
  fi
}

while IFS= read -r -d '' f; do
  check_name "$f"
done < <(git ls-files -z)

while IFS= read -r rev; do
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    check_name "${rev}:${f}"
  done < <(git ls-tree -r --name-only "$rev")
done < <(git rev-list --all)

pk=$(printf '%s_%s' private key)
scan_tree "worktree" -- .
while IFS= read -r rev; do
  scan_tree "$rev" "$rev" -- .
done < <(git rev-list --all)

if [[ -n "${GITHUB_BASE_REF:-}" ]] && git rev-parse --verify --quiet "origin/${GITHUB_BASE_REF}" >/dev/null; then
  diff_file=$(mktemp)
  git diff -U0 "origin/${GITHUB_BASE_REF}...HEAD" >"$diff_file" || true
  scan_text "PR diff against ${GITHUB_BASE_REF}" "$diff_file"
  rm -f "$diff_file"
fi

if [[ "$bad" -ne 0 ]]; then
  exit 1
fi

echo "secret-guard: ok"
