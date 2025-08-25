#!/usr/bin/env bash
# ------------------------------------------------------------
# Creates an annotated Git tag for every commit that touches any file
# inside the .kiro/ directory.
# ------------------------------------------------------------

set -euo pipefail

TAG_PREFIX="v0.0."
COUNT=1
DRY_RUN=false
COMPARE=false
prev=main

# ---------- parse options ----------
while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry*) DRY_RUN=true; shift ;;
        -n) DRY_RUN=true; shift ;;
        -d) DRY_RUN=true; shift ;;
        -c) COMPARE=true; shift ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

# ---------- main logic ----------
echo "Scanning commits that modify any file under .kiro/ …"

git log --reverse --pretty=format:%H .kiro | while read -r commit ; do
    # Build the tag name (zero‑padded for lexical order)
    TAG="${TAG_PREFIX}$(printf '%03d' "$COUNT")"

    if $DRY_RUN; then
        printf 'Would create tag %s at %s\n' "$TAG" "$commit"
    else
        echo "Tagging commit $commit as $TAG"
        git tag -a "$TAG" "$commit" -m "change to .kiro file #$COUNT"
    fi
    git diff --numstat $commit..$prev -- .kiro
    prev="$commit"


    COUNT=$((COUNT + 1))
done

echo "Done – processed $((COUNT-1)) commits."
