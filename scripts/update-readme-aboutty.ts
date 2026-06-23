import { execFile as execFileCallback } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import type { AbouttyConfig, AbouttyTextSegment } from "@aboutty/core";

const execFile = promisify(execFileCallback);
const repoSlug = process.env.GITHUB_REPOSITORY ?? "pbandj082/aboutty";
const outputPath = "aboutty.json";

interface GitHubRepo {
  full_name: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  license?: {
    spdx_id?: string;
  } | null;
}

const repo = await fetchRepo(repoSlug);
const commitCount = await readGitOutput(["rev-list", "--count", "HEAD"], "unknown");
const coreVersion = await readPackageVersion("packages/core/package.json");
const cliVersion = await readPackageVersion("packages/cli/package.json");
const actionVersion = await readPackageVersion("packages/action/package.json");
const updatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

const config: AbouttyConfig = {
  "$schema": "./schema/aboutty.schema.json",
  title: "aboutty repository",
  username: "github",
  hostname: "aboutty",
  prompt: "$",
  width: 860,
  padding: 24,
  fontSize: 14,
  lineHeight: 22,
  loop: true,
  stepIntervalMs: 28,
  theme: {
    background: "#101418",
    border: "#2a3138",
    title: "#d7dee6",
    username: "#6ee7b7",
    hostname: "#93c5fd",
    separator: "#8bd5ca",
    prompt: "#6ee7b7",
    text: "#f8fafc",
    command: "#f8fafc",
    output: "#cbd5e1"
  },
  steps: [
    {
      type: "output",
      typingIntervalMs: 0,
      text: [
        {
          color: "#6ee7b7",
          value: "      ___.                  __    __          \n_____ \\_ |__   ____  __ ___/  |__/  |_ ___.__.\n\\__  \\ | __ \\ /  _ \\|  |  \\   __\\   __<   |  |\n / __ \\| \\_\\ (  <_> )  |  /|  |  |  |  \\___  |\n(____  /___  /\\____/|____/ |__|  |__|  / ____|\n     \\/    \\/                          \\/     "
        }
      ]
    },
    {
      type: "command",
      text: `gh repo view ${repoSlug} --json stargazerCount,forkCount`
    },
    {
      type: "output",
      typingIntervalMs: 0,
      text: [
        ...line("repository", repo.full_name, "#93c5fd"),
        ...line("stars", formatNumber(repo.stargazers_count), "#facc15"),
        ...line("forks", formatNumber(repo.forks_count), "#c084fc"),
        ...line("open items", formatNumber(repo.open_issues_count), "#fb7185"),
        ...line("commits", commitCount, "#6ee7b7"),
        ...line("default branch", repo.default_branch, "#93c5fd"),
        ...line("license", repo.license?.spdx_id ?? "unknown", "#f8fafc"),
        ...line("@aboutty/core", `v${coreVersion}`, "#6ee7b7"),
        ...line("@aboutty/cli", `v${cliVersion}`, "#6ee7b7"),
        ...line("action", `action-v${actionVersion}`, "#6ee7b7"),
        ...line("updated", updatedAt, "#94a3b8", false)
      ]
    },
    {
      type: "command",
      text: "aboutty aboutty.json --out assets/aboutty.svg"
    },
    {
      type: "output",
      text: [
        { value: "Rendering README terminal SVG" },
        { value: "...", repeat: 3, repeatDelayMs: 280, typingIntervalMs: 160, color: "#6ee7b7" }
      ]
    },
    {
      type: "output",
      typingIntervalMs: 0,
      text: "Generated assets/aboutty.svg"
    }
  ]
};

await writeFile(outputPath, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Updated ${outputPath}`);

async function fetchRepo(slug: string): Promise<GitHubRepo> {
  const response = await fetch(`https://api.github.com/repos/${slug}`, {
    headers: createGitHubHeaders()
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as GitHubRepo;
}

function createGitHubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function readGitOutput(args: string[], fallback: string): Promise<string> {
  try {
    const result = await execFile("git", args);
    return result.stdout.trim() || fallback;
  } catch {
    return fallback;
  }
}

async function readPackageVersion(path: string): Promise<string> {
  const raw = await readFile(path, "utf8");
  const parsed = JSON.parse(raw) as { version?: string };

  return parsed.version ?? "0.0.0";
}

function line(
  label: string,
  value: string,
  valueColor: string,
  includeNewline = true
): AbouttyTextSegment[] {
  return [
    { value: `${label.padEnd(14)} `, color: "#94a3b8" },
    { value: `${value}${includeNewline ? "\n" : ""}`, color: valueColor, bold: true }
  ];
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
