#!/bin/sh
# Merges the main branch of sharevb/it-tools into the current branch.
#
#   sh scripts/fork/sync-upstream.sh
#
# Conflicts that need no thought are resolved here: files the fork deleted stay deleted
# (scripts/fork/upstream-deleted.txt), and a pnpm-lock.yaml conflict is resolved by
# regenerating the lockfile, when package.json merged cleanly. Anything else is left for a
# person, with the merge in progress.
#
# Exit codes: 0 merged, 2 already up to date, 1 conflicts left.
set -eu

UPSTREAM_URL="${UPSTREAM_URL:-https://github.com/sharevb/it-tools}"
# sharevb's main branch; their `main` has not moved since 2025-09.
UPSTREAM_BRANCH="${UPSTREAM_BRANCH:-chore/all-my-stuffs}"

cd "$(git rev-parse --show-toplevel)"
git remote get-url upstream > /dev/null 2>&1 || git remote add upstream "$UPSTREAM_URL"
git fetch --quiet --no-tags upstream "$UPSTREAM_BRANCH"
upstream="upstream/$UPSTREAM_BRANCH"

if git merge-base --is-ancestor "$upstream" HEAD; then
  echo "Already up to date with $upstream"
  exit 2
fi

message="chore: merge upstream sharevb/it-tools ($UPSTREAM_BRANCH)"
if git merge --no-ff --no-edit -m "$message" "$upstream"; then
  echo "Merged $upstream"
  exit 0
fi

deleted="$(grep -v '^#' scripts/fork/upstream-deleted.txt | grep -v '^$')"
for file in $(git diff --name-only --diff-filter=U); do
  if printf '%s\n' "$deleted" | grep -qx "$file"; then
    git rm --quiet "$file"
    echo "Kept deleted: $file"
  fi
done

conflicts="$(git diff --name-only --diff-filter=U)"
if [ "$conflicts" = 'pnpm-lock.yaml' ]; then
  git checkout --ours pnpm-lock.yaml
  pnpm install --lockfile-only --ignore-scripts
  git add pnpm-lock.yaml
  echo 'Regenerated pnpm-lock.yaml'
  conflicts=''
fi

if [ -n "$conflicts" ]; then
  echo 'Conflicts to resolve by hand:'
  printf '  %s\n' $conflicts
  exit 1
fi

git commit --quiet --no-edit -m "$message"
echo "Merged $upstream"
