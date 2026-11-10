#!/usr/bin/env bash
# Reprint public JavaScript with tsc and Prettier and compare two git refs.
# A comment or a cast that does not change the tree matches. sw.js may move
# aj-p0-v55 to aj-p0-v56 and nothing else.
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "public-canon-diff: usage: public-canon-diff.sh <base> <head>" >&2
  exit 1
fi

base_ref=$1
head_ref=$2
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
repo=$(git rev-parse --show-toplevel)
cd "$repo"
tsc="$script_dir/../node_modules/typescript/lib/tsc.js"
prettier="$script_dir/../node_modules/prettier/bin/prettier.cjs"

fail() {
  echo "public-canon-diff: $1" >&2
  exit 1
}

list_public() {
  git ls-tree -r --name-only "$1" -- public | LC_ALL=C sort
}

base_list=$(list_public "$base_ref")
head_list=$(list_public "$head_ref")
if [[ "$base_list" != "$head_list" ]]; then
  first=$(comm -3 <(printf '%s\n' "$base_list") <(printf '%s\n' "$head_list") | head -1 | sed 's/^\t//')
  fail "${first:-public}"
fi

while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  case "$path" in
    *.js) ;;
    *) fail "$path" ;;
  esac
done < <(git diff --name-only "$base_ref" "$head_ref" -- public)

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

copy_js() {
  local ref=$1 dest=$2
  while IFS= read -r path; do
    [[ "$path" == *.js ]] || continue
    mkdir -p "$dest/$(dirname "$path")"
    git show "$ref:$path" > "$dest/$path"
  done <<< "$base_list"
}

copy_js "$base_ref" "$work/base"
copy_js "$head_ref" "$work/head"

emit_tree() {
  local src=$1 dest=$2
  while IFS= read -r path; do
    [[ "$path" == *.js ]] || continue
    local one
    one=$(mktemp -d)
    if ! (cd "$src" && node "$tsc" --ignoreConfig --allowJs --removeComments --noCheck --target esnext --module preserve --outDir "$one" "$path") >"$one/log" 2>&1; then
      cat "$one/log" >&2 || true
      rm -rf "$one"
      fail "$path"
    fi
    local emitted
    emitted=$(find "$one" -name '*.js' -print)
    if [[ -z "$emitted" || "$(printf '%s\n' "$emitted" | wc -l | tr -d ' ')" != 1 ]]; then
      rm -rf "$one"
      fail "$path"
    fi
    mkdir -p "$dest/$(dirname "$path")"
    cp "$emitted" "$dest/$path"
    rm -rf "$one"
  done <<< "$base_list"
}

emit_tree "$work/base" "$work/base-emit"
emit_tree "$work/head" "$work/head-emit"

reprint() {
  node "$prettier" --no-config --parser babel "$1"
}

while IFS= read -r path; do
  [[ "$path" == *.js ]] || continue
  if ! base_print=$(reprint "$work/base-emit/$path"); then
    fail "$path"
  fi
  if ! head_print=$(reprint "$work/head-emit/$path"); then
    fail "$path"
  fi
  if [[ "$path" == public/sw.js ]]; then
    if ! head_print=$(printf '%s\n' "$head_print" | python3 -c '
import sys
text = sys.stdin.read()
if text.count("aj-p0-v56") != 1:
    sys.exit(1)
sys.stdout.write(text.replace("aj-p0-v56", "aj-p0-v55", 1))
'); then
      fail "$path"
    fi
  fi
  if [[ "$base_print" != "$head_print" ]]; then
    fail "$path"
  fi
done <<< "$base_list"

python3 - "$work/base" "$work/head" << 'PY'
import pathlib, sys
base_root, head_root = sys.argv[1:]
files = sorted(p.relative_to(base_root).as_posix() for p in pathlib.Path(base_root).rglob('*.js'))
for rel in files:
    base = (pathlib.Path(base_root) / rel).read_text()
    head = (pathlib.Path(head_root) / rel).read_text()
    if base.count("'use strict'") != head.count("'use strict'") or base.count('"use strict"') != head.count('"use strict"'):
        sys.stderr.write(f"public-canon-diff: {rel}\n")
        sys.exit(1)
    base_line = base.splitlines()[0] if base.splitlines() else ''
    head_line = head.splitlines()[0] if head.splitlines() else ''
    if rel == 'public/sw.js':
        if base_line != "const VERSION = 'aj-p0-v55';" or head_line != "const VERSION = 'aj-p0-v56';":
            sys.stderr.write(f"public-canon-diff: {rel}\n")
            sys.exit(1)
    elif base_line != head_line:
        sys.stderr.write(f"public-canon-diff: {rel}\n")
        sys.exit(1)
PY

echo "public-canon-diff: ok"
