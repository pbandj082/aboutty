# Examples

These JSON files can be rendered with the CLI:

```sh
pnpm --filter @aboutty/cli build
node packages/cli/dist/index.js examples/basic.json --out examples/basic.svg
```

Available examples:

- `basic.json` - default aboutty demo with ASCII art and repeated dots.
- `npm-install.json` - short package installation flow.
- `user-profile.json` - README profile-style intro animation.
- `docker-tutorial.json` - Docker build and run quickstart.
- `git-tutorial.json` - Git branch, commit, and push workflow.
- `hacker-console.json` - cinematic local signal console demo.
