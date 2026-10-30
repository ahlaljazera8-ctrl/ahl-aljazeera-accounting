#!/usr/bin/env bash
# Run the Firebase emulator CLI with a throwaway config. The copy adds the
# Auth and Firestore emulator origins to the hosting CSP. firebase.json is not modified.
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
copy="$root/firebase.emulator.json"
node "$root/scripts/emulator-csp-config.js" "$copy"
cleanup() { rm -f "$copy"; }
trap cleanup EXIT
cd "$root"
npx --no-install firebase --config firebase.emulator.json emulators:exec "$@"
