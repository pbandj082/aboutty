---
name: git-commit
description: Create, amend, or inspect Git commits with disciplined staging and Conventional Commit messages. Use when the user asks Codex to commit changes, amend a commit, rewrite a commit message, split staged work, review commit scope, or prepare Git history for sharing.
---

# Git Commit

## Overview

Use this skill to make Git commits intentionally: inspect the worktree, stage only the requested changes, write a Conventional Commit message, and verify the final repository state.

## Workflow

1. Inspect the current state with `git status --short`.
2. Review relevant diffs before staging:
   - Use `git diff -- <path>` for unstaged changes.
   - Use `git diff --cached -- <path>` for staged changes.
   - Use `git log -1 --oneline` before amending.
3. Identify which changes belong to the user's requested commit.
4. Stage only those files or hunks. Do not stage unrelated user changes.
5. Re-check `git status --short` and `git diff --cached --stat`.
6. Commit with a Conventional Commit message.
7. Verify with `git status --short` and `git log -1 --oneline`.

## Conventional Commits

Prefer this format:

```text
<type>[optional scope]: <description>
```

Use these common types:

- `feat`: add user-facing behavior or capability
- `fix`: correct a bug
- `docs`: change documentation only
- `style`: change formatting without behavior changes
- `refactor`: restructure code without behavior changes
- `test`: add or update tests
- `build`: change build system, dependencies, packaging, or generated artifacts
- `ci`: change CI or GitHub Actions behavior
- `chore`: change maintenance files, metadata, or repository housekeeping

Keep the subject lowercase after the type, imperative, concise, and under roughly 72 characters when practical.

## Scope Control

Before committing, separate changes into three groups:

- requested changes to include
- existing user changes to preserve but not include
- generated or incidental files that need explicit justification

If unrelated changes are present, leave them unstaged and mention them in the final response. If a file contains both requested and unrelated changes, use patch staging when practical; otherwise ask before committing that file.

## Amending

When the user asks to amend:

1. Confirm the target is the current `HEAD` unless they specify otherwise.
2. Inspect `git log -1 --oneline` and staged changes.
3. Use `git commit --amend -m "<message>"` for message-only or staged-content amendments.
4. Verify the new commit hash and message.
5. Mention if the commit hash changed and whether the worktree is clean.

## Final Response

Report the resulting commit hash and subject. Include whether the worktree is clean. If any relevant files were intentionally left uncommitted, state that clearly.
