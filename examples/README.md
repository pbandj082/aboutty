# Examples

These JSON files can be rendered with the CLI:

```sh
pnpm --filter @aboutty/cli build
node packages/cli/dist/index.js examples/basic.json --out examples/basic.svg
```

Available examples:

- `basic.json` - getting-started flow for rendering and embedding an aboutty SVG.
- `database-migration.json` - database migration plan with boxed output, colored diffs, and filled progress bars.
- `npm-install.json` - pnpm install output with package resolution, progress, and spinner frames.
- `user-profile.json` - GitHub profile metadata collection and README SVG generation.
- `docker-tutorial.json` - Docker BuildKit-style build, layer export progress, and run quickstart.
- `git-tutorial.json` - Git branch, commit hook, and push workflow with percentage frames.
- `github-actions.json` - GitHub Actions run watcher with spinner frames and job status tables.
- `hacker-console.json` - local monitor diagnostics with systemctl, journalctl, curl, scan progress, and checksum output.
- `kubectl-rollout.json` - Kubernetes deployment restart, rollout status frames, and pod metrics table.
- `release-pipeline.json` - release dry-run with ASCII art, package plan panel, artifact table, and spinner frames.
- `terraform-plan.json` - Terraform init and plan flow with provider spinner and state refresh frames.
- `test-runner.json` - test runner output with coverage table and filled progress bars.
