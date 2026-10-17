#!/usr/bin/env bash
# .github/guard.sh: repo guard run by .github/workflows/guard.yml on every pull request and push to main
# (rules in CONTRIBUTING.md). Also runs locally.
# Usage: bash .github/guard.sh <base-ref> [head-ref] [actor]
#   Everyone: no tool/editor/dependency files, no file over 20 MB, selfcheck all PASS, both app greps empty.
#   Anyone but the owner: no change to protected paths, no delete or rename of an existing note.
set -u
BASE="${1:?base ref}"; HEAD="${2:-HEAD}"; ACTOR="${3:-unknown}"
OWNER="nurkhangarifolla"
MAX_BYTES=$((20 * 1024 * 1024))
fail=0
bad() { if [ -n "${GITHUB_ACTIONS:-}" ]; then printf '::error::%s\n' "$*"; else printf 'FAIL: %s\n' "$*"; fi; fail=1; }
ok() { printf 'ok:   %s\n' "$*"; }

# Paths only the owner changes (prefix match; a trailing / means the whole folder)
PROTECTED="CLAUDE.md
DESIGN.md
00 Index.md
CONTRIBUTING.md
.gitignore
.gitattributes
.github/
.obsidian/
Sessions/
Sources/
Originals/
Projects/Wabtec – IGBT Test Cell/Tickets.md
igbt-test-cell/NOTES-FOR-NURKHAN.md"
# Files nobody commits (extended regex on the path)
FORBIDDEN='(^|/)(node_modules|\.vscode|\.idea|\.cursor|\.claude)/|(^|/)(package\.json|package-lock\.json|yarn\.lock|pnpm-lock\.yaml|\.mcp\.json|\.cursorrules|AGENTS\.md|\.env|\.DS_Store)$|^(dist|graphify-out)/|.+/CLAUDE\.md$'

# A missing base (first push, force push) falls back to the parent commit
if ! git cat-file -e "$BASE^{commit}" 2>/dev/null; then BASE="$HEAD~1"; fi
echo "guard: $BASE..$HEAD by $ACTOR"

changes=$(git -c core.quotepath=false diff --name-status -M "$BASE" "$HEAD") || { bad "cannot diff $BASE..$HEAD"; exit 1; }
n_changed=0
while IFS=$'\t' read -r st p1 p2; do
  [ -z "$st" ] && continue
  n_changed=$((n_changed + 1))
  path="${p2:-$p1}"
  case "$st" in
    D) touched="$p1" ;;
    R*) touched="$p1"$'\n'"$p2" ;;
    *) touched="$path" ;;
  esac
  # Everyone: forbidden files (added, modified or renamed into place)
  if [ "$st" != "D" ] && printf '%s\n' "$path" | grep -qE "$FORBIDDEN"; then bad "forbidden file committed: $path (see CONTRIBUTING.md §4)"; fi
  # Everyone: size limit
  if [ "$st" != "D" ]; then
    size=$(git cat-file -s "$HEAD:$path" 2>/dev/null || echo 0)
    [ "$size" -gt "$MAX_BYTES" ] && bad "file over 20 MB: $path ($size bytes)"
  fi
  if [ "$ACTOR" != "$OWNER" ]; then
    # Protected paths
    while IFS= read -r t; do
      while IFS= read -r p; do
        case "$p" in
          */) case "$t" in "$p"*) bad "protected path changed: $t (ask Nurkhan; CONTRIBUTING.md §3)" ;; esac ;;
          *) [ "$t" = "$p" ] && bad "protected file changed: $t (ask Nurkhan; CONTRIBUTING.md §3)" ;;
        esac
      done <<< "$PROTECTED"
    done <<< "$touched"
    # Existing notes keep their names (Obsidian links)
    case "$st" in
      D) case "$p1" in *.md) bad "note deleted: $p1 (Obsidian links point to it)" ;; esac ;;
      R*) case "$p1" in *.md) bad "note renamed or moved: $p1 → $p2 (Obsidian links point to it)" ;; esac ;;
    esac
  fi
done <<< "$changes"
ok "$n_changed changed path(s) checked"

# App checks on the head tree (run from the repo root)
if out=$(node igbt-test-cell/dev/selfcheck-node.js 2>&1); then
  ok "selfcheck $(printf '%s\n' "$out" | grep -m1 '^Total:')"
else
  printf '%s\n' "$out" | grep -E '^FAIL|^Total' | head -20
  bad "selfcheck has failing cases (node igbt-test-cell/dev/selfcheck-node.js)"
fi
if hits=$(grep -nE '\bS[0-9]+b?\b|CUSTOM' igbt-test-cell/js/engine.js igbt-test-cell/js/models.js igbt-test-cell/js/sequencer.js); then
  printf '%s\n' "$hits"; bad "scenario ID in engine.js / models.js / sequencer.js"
else ok "no scenario IDs in engine, models, sequencer"; fi
if hits=$(grep -rnE 'fetch\(|type="module"|https?://' igbt-test-cell); then
  printf '%s\n' "$hits"; bad "network or module use in igbt-test-cell (offline Method A)"
else ok "offline: no fetch, modules or URLs in igbt-test-cell"; fi

if [ "$fail" -ne 0 ]; then echo "guard: FAILED (rules in CONTRIBUTING.md)"; exit 1; fi
echo "guard: passed"
