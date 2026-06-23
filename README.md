# aboutty

aboutty is an animated SVG generator for terminal-style command demos in GitHub READMEs and other static documentation. It turns a JSON description of commands, prompts, output, timing, and terminal styling into a portable SVG that can be generated in a repository, committed by GitHub Actions, and embedded as a normal image.

![aboutty repository stats](./assets/aboutty.svg)

Studio: https://gateway.irys.xyz/BLEEZ1t375uaFjkNPd3tTKSGC3TTsMzrYgpaAoKGnDdU

## Releases

Releases are managed with Changesets. Run `pnpm changeset` for release-impacting changes, then merge the generated release PR to publish `@aboutty/core` and `@aboutty/cli` to npm. The Studio app and GitHub Action are versioned and tagged, but not published to npm.

Irys deployment is intentionally manual because it costs fees:

```sh
pnpm deploy:irys
```

Use a local `.env` file to point at a Solana keypair file without storing the key
inside the repository:

```env
IRYS_PRIVATE_KEY_FILE=~/.config/solana/id.json
IRYS_DEPLOY_DIR=apps/studio/dist
IRYS_INDEX_FILE=index.html
```

The deploy script prints the estimated Irys upload cost and current Irys balance
before uploading. Type `deploy` at the prompt to continue.
