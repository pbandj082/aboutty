import type { AbouttyConfig } from "@aboutty/core";
import { cloneConfig } from "./config-copy";
import { defaultStudioConfig } from "./default-config";

export interface StudioTemplate {
  id: string;
  label: string;
}

interface StudioTemplateDefinition extends StudioTemplate {
  config: AbouttyConfig;
}

const commonPrompt = {
  usernameSeparator: "@",
  cwdSeparator: ":",
  cwd: "~",
  stepIntervalMs: 350
} satisfies Partial<AbouttyConfig>;

const defaultPromptTheme = {
  background: "#101418",
  username: "#6ee7b7",
  usernameSeparator: "#8bd5ca",
  hostname: "#93c5fd",
  cwdSeparator: "#7dd3fc",
  cwd: "#a7f3d0",
  prompt: "#5eead4",
  text: "#f8fafc"
} satisfies NonNullable<AbouttyConfig["theme"]>;

const templateDefinitions: StudioTemplateDefinition[] = [
  {
    id: "basic",
    label: "Basic demo",
    config: defaultStudioConfig
  },
  {
    id: "npm-install",
    label: "NPM install",
    config: {
      title: "install",
      username: "pbandj082",
      hostname: "aboutty",
      prompt: "$",
      typingIntervalMs: 35,
      theme: defaultPromptTheme,
      ...commonPrompt,
      steps: [
        { type: "command", text: "pnpm add -D aboutty" },
        { type: "output", typingIntervalMs: 6, text: "Packages: +1\nDone" },
        { type: "command", text: "pnpm aboutty ./aboutty.json --out ./assets/aboutty.svg" }
      ]
    }
  },
  {
    id: "user-profile",
    label: "User profile",
    config: {
      title: "profile",
      username: "aboutty",
      hostname: "profile",
      prompt: "$",
      typingIntervalMs: 28,
      theme: {
        background: "#0f1412",
        username: "#8bd5ca",
        usernameSeparator: "#94e2d5",
        hostname: "#a6e3a1",
        cwdSeparator: "#b4f8c8",
        cwd: "#c3e88d",
        prompt: "#89dceb",
        text: "#f4f7f2"
      },
      ...commonPrompt,
      steps: [
        { type: "command", text: "whoami" },
        {
          type: "output",
          typingIntervalMs: 0,
          text: [
            { value: "name: ", color: "#a6adc8" },
            { value: "aboutty maintainer", color: "#f4f7f2", bold: true }
          ]
        },
        { type: "command", text: "cat ./profile.md" },
        {
          type: "output",
          text: [
            { value: "Building terminal-flavored README animations\n", color: "#f4f7f2" },
            { value: "Stack: TypeScript, SVG, GitHub Actions\n", color: "#8bd5ca" },
            { value: "Focus: tiny dependencies, static hosting, clean docs", color: "#a6e3a1" }
          ]
        },
        { type: "command", text: "aboutty --profile --out ./assets/profile.svg" },
        {
          type: "output",
          text: [
            { value: "Writing profile animation", color: "#f4f7f2" },
            { frames: ["", ".", "..", "..."], frameIntervalMs: 160, repeat: 2, repeatDelayMs: 280, color: "#a6e3a1" }
          ]
        },
        { type: "output", typingIntervalMs: 0, text: "Done ./assets/profile.svg" }
      ]
    }
  },
  {
    id: "docker-tutorial",
    label: "Docker tutorial",
    config: {
      title: "docker quickstart",
      username: "dev",
      hostname: "container-lab",
      prompt: "$",
      typingIntervalMs: 26,
      theme: {
        background: "#0b1220",
        username: "#7dd3fc",
        usernameSeparator: "#67e8f9",
        hostname: "#93c5fd",
        cwdSeparator: "#38bdf8",
        cwd: "#bae6fd",
        prompt: "#0ea5e9",
        text: "#e5eefb"
      },
      ...commonPrompt,
      steps: [
        { type: "command", text: "docker --version" },
        { type: "output", typingIntervalMs: 0, text: "Docker version 27.x" },
        { type: "command", text: "cat Dockerfile" },
        {
          type: "output",
          typingIntervalMs: 2,
          text: "FROM node:24-alpine\nWORKDIR /app\nCOPY package.json pnpm-lock.yaml ./\nRUN corepack enable && pnpm install --frozen-lockfile\nCOPY . .\nCMD [\"pnpm\", \"start\"]"
        },
        { type: "command", text: "docker build -t aboutty-demo ." },
        {
          type: "output",
          text: [
            { value: "Sending build context\n", color: "#cbd5e1" },
            {
              frames: [
                "base   [=   ]\ndeps   [    ]\napp    [    ]",
                "base   [==  ]\ndeps   [=   ]\napp    [    ]",
                "base   [=== ]\ndeps   [==  ]\napp    [=   ]",
                "base   [====]\ndeps   [====]\napp    [====]"
              ],
              frameIntervalMs: 180,
              repeat: 1,
              color: "#38bdf8"
            }
          ]
        },
        { type: "output", typingIntervalMs: 0, text: "Successfully tagged aboutty-demo:latest" },
        { type: "command", text: "docker run --rm -p 3000:3000 aboutty-demo" },
        { type: "output", typingIntervalMs: 0, text: "Server listening on http://localhost:3000" }
      ]
    }
  },
  {
    id: "git-tutorial",
    label: "Git tutorial",
    config: {
      title: "git workflow",
      username: "docs",
      hostname: "repo",
      prompt: "$",
      typingIntervalMs: 30,
      theme: {
        background: "#111111",
        username: "#facc15",
        usernameSeparator: "#fbbf24",
        hostname: "#fb923c",
        cwdSeparator: "#fdba74",
        cwd: "#fed7aa",
        prompt: "#f97316",
        text: "#f8fafc"
      },
      ...commonPrompt,
      steps: [
        { type: "command", text: "git status --short" },
        { type: "output", typingIntervalMs: 0, text: " M README.md\n?? assets/aboutty.svg" },
        { type: "command", text: "git checkout -b docs/aboutty-demo" },
        { type: "output", typingIntervalMs: 0, text: "Switched to a new branch 'docs/aboutty-demo'" },
        { type: "command", text: "git add README.md assets/aboutty.svg && git commit -m \"docs: add terminal demo\"" },
        {
          type: "output",
          typingIntervalMs: 0,
          text: "[docs/aboutty-demo 8f4c21a] docs: add terminal demo\n 2 files changed, 12 insertions(+)"
        }
      ]
    }
  },
  {
    id: "hacker-console",
    label: "Signal console",
    config: {
      title: "signal console",
      username: "operator",
      hostname: "node-07",
      prompt: ">",
      loop: true,
      typingIntervalMs: 18,
      theme: {
        background: "#020403",
        border: "#163d2a",
        title: "#68d391",
        username: "#22c55e",
        usernameSeparator: "#4ade80",
        hostname: "#16a34a",
        cwdSeparator: "#86efac",
        cwd: "#bbf7d0",
        prompt: "#15803d",
        text: "#d1fae5",
        command: "#bbf7d0",
        output: "#86efac"
      },
      ...commonPrompt,
      steps: [
        {
          type: "output",
          typingIntervalMs: 0,
          text: [
            { value: "SIGNAL // NODE-07\n", color: "#4ade80", bold: true },
            { value: "local monitor online", color: "#86efac" }
          ]
        },
        { type: "command", text: "scan --scope local --format table" },
        {
          type: "output",
          typingIntervalMs: 0,
          text: "SEGMENT    KIND       CONFIDENCE\nalpha      text       0.98\nbeta       prompt     0.97\ngamma      timing     0.94"
        },
        { type: "command", text: "trace beta --watch" },
        {
          type: "output",
          text: [
            { value: "locking trace " },
            { frames: ["|", "/", "-", "\\"], frameIntervalMs: 80, color: "#4ade80" }
          ]
        },
        { type: "output", typingIntervalMs: 0, text: "trace complete  status=green" }
      ]
    }
  }
];

const schema = defaultStudioConfig["$schema"];

export const studioTemplates: StudioTemplate[] = templateDefinitions.map(({ id, label }) => ({ id, label }));

export function createTemplateConfig(id: string): AbouttyConfig | undefined {
  const template = templateDefinitions.find((definition) => definition.id === id);

  if (!template) {
    return undefined;
  }

  const config = cloneConfig(template.config);

  if (schema) {
    config["$schema"] = schema;
  }

  return config;
}
