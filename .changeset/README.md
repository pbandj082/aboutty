# Changesets

Run `pnpm changeset` in feature branches to describe release-impacting changes.

The release workflow opens a version PR on `main`. Merging that PR publishes npm packages and creates release tags for versioned packages. Irys deploys remain local-only via `pnpm deploy:irys`.
