#!/usr/bin/env bash
# Fail when a commit changes public/ without changing the service worker cache name.
set -euo pipefail
base="${1:-}"
if [[ -z "$base" ]]; then
  if [[ -n "${GITHUB_BASE_REF:-}" ]]; then
    git fetch --no-tags origin "$GITHUB_BASE_REF"
    base="origin/$GITHUB_BASE_REF"
  else
    base="HEAD^"
  fi
fi
changed=$(git diff --name-only "$base" HEAD -- public/ || true)
if [[ -z "$changed" ]]; then
  echo "sw-version-guard: public/ unchanged"
  exit 0
fi
old=$(git show "$base:public/sw.js" 2>/dev/null | sed -n "s/^const VERSION = '\\(aj-p0-v[0-9][0-9]*\\)';/\\1/p" | head -1 || true)
new=$(sed -n "s/^const VERSION = '\\(aj-p0-v[0-9][0-9]*\\)';/\\1/p" public/sw.js | head -1 || true)
if [[ -z "$new" ]]; then
  echo "sw-version-guard: public/sw.js has no aj-p0-v VERSION" >&2
  exit 1
fi
if [[ "$old" == "$new" ]]; then
  echo "sw-version-guard: public/ changed but VERSION is still $new" >&2
  echo "$changed" >&2
  exit 1
fi
echo "sw-version-guard: ${old:-none} -> $new"
