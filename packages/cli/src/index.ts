#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { renderSvg, type AbouttyConfig } from "@aboutty/core";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    config: {
      type: "string",
      short: "c"
    },
    out: {
      type: "string",
      short: "o"
    }
  }
});

const configPath = values.config ?? positionals[0];
const outputPath = values.out;

if (!configPath || !outputPath) {
  console.error("Usage: aboutty <config.json> --out <output.svg>");
  process.exit(1);
}

const resolvedConfigPath = resolve(configPath);
const resolvedOutputPath = resolve(outputPath);
const config = JSON.parse(await readFile(resolvedConfigPath, "utf8")) as AbouttyConfig;
const svg = renderSvg(config);

await mkdir(dirname(resolvedOutputPath), { recursive: true });
await writeFile(resolvedOutputPath, svg);

console.log(`Generated ${resolvedOutputPath}`);

