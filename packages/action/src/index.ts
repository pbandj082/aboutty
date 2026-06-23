import * as core from "@actions/core";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { renderSvg, type AbouttyConfig } from "@aboutty/core";

const exec = promisify(execFile);

async function run(): Promise<void> {
  const configPath = core.getInput("config") || "aboutty.json";
  const outputPath = core.getInput("output") || "assets/aboutty.svg";
  const shouldCommit = core.getBooleanInput("commit");
  const shouldPush = core.getBooleanInput("push");
  const resolvedOutputPath = resolve(outputPath);

  const config = JSON.parse(await readFile(resolve(configPath), "utf8")) as AbouttyConfig;
  const svg = renderSvg(config);

  await mkdir(dirname(resolvedOutputPath), { recursive: true });
  await writeFile(resolvedOutputPath, svg);

  core.setOutput("svg-path", outputPath);
  core.info(`Generated ${outputPath}`);

  if (shouldCommit) {
    await commitGeneratedSvg(outputPath, shouldPush);
  }
}

async function commitGeneratedSvg(outputPath: string, shouldPush: boolean): Promise<void> {
  const status = await exec("git", ["status", "--short", "--", outputPath]);

  if (status.stdout.trim().length === 0) {
    core.info("No generated SVG changes to commit.");
    return;
  }

  await exec("git", ["config", "user.name", "github-actions[bot]"]);
  await exec("git", ["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"]);
  await exec("git", ["add", outputPath]);
  await exec("git", ["commit", "-m", "chore: update aboutty svg"]);

  if (shouldPush) {
    await exec("git", ["push"]);
  }
}

run().catch((error: unknown) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});

