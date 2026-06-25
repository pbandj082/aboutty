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
  stepIntervalMs: 350,
  cursor: {
    enabled: true,
    style: "block",
    blinkIntervalMs: 650
  }
} satisfies Partial<AbouttyConfig>;

const defaultPromptTheme = {
  background: "#101418",
  username: "#6ee7b7",
  usernameSeparator: "#8bd5ca",
  hostname: "#93c5fd",
  cwdSeparator: "#7dd3fc",
  cwd: "#a7f3d0",
  prompt: "#5eead4",
  text: "#f8fafc",
  cursor: "#f8fafc"
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
      cursor: { enabled: true, style: "bar", blinkIntervalMs: 550 },
      steps: [
        { type: "command", text: "pnpm add -D @aboutty/cli" },
        {
          type: "output",
          typingIntervalMs: 0,
          text: [
            { value: "Packages: +1\n", color: "#f8fafc" },
            { value: "+\n", color: "#6ee7b7" },
            {
              frames: [
                "Progress: resolved 12, reused 10, downloaded 0, added 0  [==>-------]",
                "Progress: resolved 28, reused 24, downloaded 1, added 0  [=====>----]",
                "Progress: resolved 42, reused 38, downloaded 1, added 1  [========>-]",
                "Progress: resolved 42, reused 38, downloaded 1, added 1  [==========]"
              ],
              frameIntervalMs: 220,
              color: "#6ee7b7"
            },
            { value: "\nInstalling @aboutty/cli ", color: "#f8fafc" },
            {
              frames: [
                "| resolving peer deps",
                "/ fetching tarball",
                "- linking bin",
                "\\ building package",
                "done"
              ],
              frameIntervalMs: 140,
              color: "#6ee7b7"
            },
            { value: "\n\ndevDependencies:\n", color: "#f8fafc" },
            { value: "+ @aboutty/cli\n", color: "#6ee7b7" },
            { value: "Done in 1.8s", color: "#94a3b8" }
          ]
        },
        { type: "command", text: "pnpm exec aboutty aboutty.json --out assets/aboutty.svg" },
        {
          type: "output",
          typingIntervalMs: 0,
          text: [
            { value: "rendering ", color: "#94a3b8" },
            {
              frames: ["|", "/", "-", "\\", "done"],
              frameIntervalMs: 120,
              color: "#6ee7b7"
            },
            { value: "\n", color: "#f8fafc" },
            { value: "aboutty.json ", color: "#94a3b8" },
            { value: "-> ", color: "#f8fafc" },
            { value: "assets/aboutty.svg\n", color: "#6ee7b7" },
            { value: "Generated in 124ms", color: "#94a3b8" }
          ]
        }
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
      cursor: { enabled: true, style: "outline", blinkIntervalMs: 700 },
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
        { type: "command", text: "gh api users/aboutty" },
        {
          type: "output",
          typingIntervalMs: 0,
          text: [
            { value: "login:      ", color: "#a6adc8" },
            { value: "aboutty\n", color: "#f4f7f2", bold: true },
            { value: "followers:  ", color: "#a6adc8" },
            { value: "128\n", color: "#a6e3a1", bold: true },
            { value: "following:  ", color: "#a6adc8" },
            { value: "24", color: "#8bd5ca", bold: true }
          ]
        },
        { type: "command", text: "gh api graphql -f query=@profile.graphql" },
        {
          type: "output",
          text: [
            { value: "collecting profile data\n", color: "#f4f7f2" },
            {
              frames: [
                "activity      pending\nlanguages     pending\nrecent events  pending",
                "activity      ok\nlanguages     pending\nrecent events  pending",
                "activity      ok\nlanguages     ok\nrecent events  pending",
                "activity      ok\nlanguages     ok\nrecent events  ok"
              ],
              frameIntervalMs: 200,
              color: "#a6e3a1"
            }
          ]
        },
        {
          type: "output",
          typingIntervalMs: 0,
          text: "CONTRIBUTIONS  1,248\nTOP LANGUAGE   TypeScript\nRECENT         pushed aboutty@main"
        },
        { type: "command", text: "aboutty profile.json --out assets/profile.svg" },
        {
          type: "output",
          text: [
            {
              frames: [
                "write profile header   [####------]",
                "write activity block   [######----]",
                "write language summary [########>-]",
                "write language summary [==========]"
              ],
              frameIntervalMs: 160,
              color: "#a6e3a1"
            },
            { value: "\nGenerated assets/profile.svg", color: "#f4f7f2" }
          ]
        }
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
      cursor: { enabled: true, style: "underline", blinkIntervalMs: 420 },
      steps: [
        { type: "command", text: "docker --version" },
        { type: "output", typingIntervalMs: 0, text: "Docker version 27.x" },
        { type: "command", text: "cat Dockerfile" },
        {
          type: "output",
          typingIntervalMs: 2,
          text: "FROM node:24-alpine\nWORKDIR /app\nCOPY package.json pnpm-lock.yaml ./\nRUN corepack enable && pnpm install --frozen-lockfile\nCOPY . .\nCMD [\"pnpm\", \"start\"]"
        },
        { type: "command", text: "DOCKER_BUILDKIT=1 docker build -t aboutty-demo ." },
        {
          type: "output",
          text: [
            {
              frames: [
                "[+] Building 0.2s (2/8)\n => [internal] load build definition from Dockerfile\n => transferring dockerfile: 234B",
                "[+] Building 0.7s (4/8)\n => [internal] load build definition from Dockerfile\n => [internal] load metadata for docker.io/library/node:24-alpine\n => [1/5] FROM docker.io/library/node:24-alpine",
                "[+] Building 1.4s (6/8)\n => CACHED [2/5] WORKDIR /app\n => [3/5] COPY package.json pnpm-lock.yaml ./\n => [4/5] RUN corepack enable && pnpm install --frozen-lockfile",
                "[+] Building 2.1s (8/8)\n => [5/5] COPY . .\n => exporting to image\n => naming to docker.io/library/aboutty-demo"
              ],
              frameIntervalMs: 260,
              color: "#38bdf8"
            }
          ]
        },
        {
          type: "output",
          typingIntervalMs: 0,
          text: [
            { value: "exporting layers\n", color: "#cbd5e1" },
            {
              frames: [
                { value: "layer sha256:1a2b █████░░░░░░░░░░░░░░░ 24%", color: "#7dd3fc" },
                { value: "layer sha256:1a2b ██████████░░░░░░░░░░ 52%", color: "#38bdf8" },
                { value: "layer sha256:1a2b █████████████████░░░ 84%", color: "#0ea5e9" },
                { value: "layer sha256:1a2b ████████████████████ 100%", color: "#22c55e", bold: true }
              ],
              frameIntervalMs: 160,
              color: "#38bdf8"
            },
            { value: "\n", color: "#cbd5e1" },
            { value: "Successfully built ", color: "#cbd5e1" },
            { value: "8f41c2d9a6ab\n", color: "#38bdf8" },
            { value: "Successfully tagged aboutty-demo:latest", color: "#cbd5e1" }
          ]
        },
        { type: "command", text: "docker run --rm -p 3000:3000 aboutty-demo" },
        {
          type: "output",
          typingIntervalMs: 0,
          text: "ready - started server on 0.0.0.0:3000\nurl   - http://localhost:3000"
        }
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
      cursor: { enabled: true, style: "bar", blinkIntervalMs: 600 },
      steps: [
        { type: "command", text: "git status --short" },
        { type: "output", typingIntervalMs: 0, text: " M README.md\n?? assets/aboutty.svg" },
        { type: "command", text: "git switch -c docs/aboutty-demo" },
        { type: "output", typingIntervalMs: 0, text: "Switched to a new branch 'docs/aboutty-demo'" },
        { type: "command", text: "git add README.md assets/aboutty.svg" },
        { type: "command", text: "git commit -m \"docs: add terminal demo\"" },
        {
          type: "output",
          text: [
            { value: "husky - pre-commit\n", color: "#fed7aa" },
            {
              frames: [
                "[STARTED] Backing up original state...",
                "[COMPLETED] Backed up original state in git stash",
                "[STARTED] Running tasks for staged files...",
                "[STARTED] eslint --fix\n[STARTED] prettier --write",
                "[COMPLETED] eslint --fix\n[COMPLETED] prettier --write",
                "[COMPLETED] Running tasks for staged files..."
              ],
              frameIntervalMs: 180,
              color: "#facc15"
            }
          ]
        },
        {
          type: "output",
          typingIntervalMs: 0,
          text: "[docs/aboutty-demo 8f4c21a] docs: add terminal demo\n 2 files changed, 12 insertions(+)"
        },
        { type: "command", text: "git push -u origin docs/aboutty-demo" },
        {
          type: "output",
          text: [
            {
              frames: [
                "Enumerating objects: 5, done.\nCounting objects:  20% (1/5)",
                "Enumerating objects: 5, done.\nCounting objects: 100% (5/5), done.",
                "Delta compression using up to 8 threads\nCompressing objects:  33% (1/3)",
                "Delta compression using up to 8 threads\nCompressing objects: 100% (3/3), done.",
                "Writing objects:  33% (1/3), 512 bytes | 512.00 KiB/s",
                "Writing objects: 100% (3/3), 1.42 KiB | 1.42 MiB/s, done."
              ],
              frameIntervalMs: 180,
              color: "#f8fafc"
            },
            { value: "\nremote: Create a pull request for docs/aboutty-demo", color: "#fed7aa" }
          ]
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
      cursor: { enabled: true, style: "outline", blinkIntervalMs: 650 },
      steps: [
        {
          type: "output",
          typingIntervalMs: 0,
          text: [
            { value: "SIGNAL // NODE-07\n", color: "#4ade80", bold: true },
            { value: "local monitor online", color: "#86efac" }
          ]
        },
        { type: "command", text: "systemctl --user status aboutty-monitor --no-pager" },
        {
          type: "output",
          typingIntervalMs: 0,
          text: "aboutty-monitor.service - Local terminal signal monitor\n   Loaded: loaded\n   Active: active (running)\n Main PID: 4217 (node)"
        },
        { type: "command", text: "journalctl --user -u aboutty-monitor -n 4 --no-pager" },
        {
          type: "output",
          text: [
            {
              frames: [
                "Jun 25 19:21:03 node-07 monitor[4217]: loading config ./ops/signal-console.toml",
                "Jun 25 19:21:03 node-07 monitor[4217]: renderer cache warm",
                "Jun 25 19:21:04 node-07 monitor[4217]: accepted local read-only session",
                "Jun 25 19:21:04 node-07 monitor[4217]: wrote heartbeat to /tmp/aboutty.sock"
              ],
              frameIntervalMs: 180,
              color: "#4ade80"
            }
          ]
        },
        { type: "command", text: "curl -sS http://127.0.0.1:8787/health | jq ." },
        {
          type: "output",
          text: [
            { value: "requesting health endpoint ", color: "#86efac" },
            {
              frames: ["|", "/", "-", "\\", "ok"],
              frameIntervalMs: 120,
              color: "#22c55e"
            },
            { value: "\n", color: "#86efac" },
            { value: "{\n  \"status\": ", color: "#86efac" },
            { value: "\"ok\"", color: "#22c55e", bold: true },
            { value: ",\n  \"queueDepth\": 0,\n  \"latencyMs\": 12\n}", color: "#86efac" }
          ]
        },
        { type: "command", text: "scan --local ./signals --limit 4" },
        {
          type: "output",
          text: [
            {
              frames: [
                "scan ./signals [###-----------------] 07-A",
                "scan ./signals [########------------] 07-B",
                "scan ./signals [##############------] 07-C",
                "scan ./signals [####################] complete"
              ],
              frameIntervalMs: 150,
              color: "#4ade80"
            },
            { value: "\n07-A clean  12ms\n07-B clean  18ms\n07-C clean  09ms", color: "#d1fae5" }
          ]
        },
        { type: "command", text: "sha256sum ./assets/signal-console.svg" },
        {
          type: "output",
          typingIntervalMs: 0,
          text: "7b4f7d1c8d1c3c5c  ./assets/signal-console.svg"
        },
        { type: "command", text: "openssl dgst -sha256 ./reports/session.txt" },
        {
          type: "output",
          typingIntervalMs: 0,
          text: "SHA2-256(./reports/session.txt)= 2f8b8a5b6a0d9e21"
        }
      ]
    }
  },
  {
    id: "terraform-plan",
    label: "Terraform plan",
    config: {
      title: "terraform plan",
      username: "infra",
      hostname: "workspace",
      prompt: "$",
      typingIntervalMs: 28,
      theme: {
        background: "#0f1020",
        border: "#3b2f66",
        title: "#ddd6fe",
        username: "#c4b5fd",
        usernameSeparator: "#a78bfa",
        hostname: "#93c5fd",
        cwdSeparator: "#818cf8",
        cwd: "#bfdbfe",
        prompt: "#8b5cf6",
        text: "#f8fafc",
        command: "#ede9fe",
        output: "#dbeafe"
      },
      ...commonPrompt,
      steps: [
        { type: "command", text: "terraform init" },
        {
          type: "output",
          text: [
            { value: "Initializing the backend...\n", color: "#dbeafe" },
            { value: "Initializing provider plugins...\n", color: "#dbeafe" },
            {
              frames: [
                "- Finding hashicorp/aws versions matching \"~> 5.0\"...",
                "\\ Installing hashicorp/aws provider...",
                "| Installing hashicorp/aws provider...",
                "/ Installed hashicorp/aws provider (signed by HashiCorp)"
              ],
              frameIntervalMs: 180,
              color: "#c4b5fd"
            }
          ]
        },
        {
          type: "output",
          typingIntervalMs: 0,
          text: "Terraform has been successfully initialized!"
        },
        { type: "command", text: "terraform plan -out=tfplan" },
        {
          type: "output",
          text: [
            {
              frames: [
                "module.web.aws_vpc.main: Refreshing state... [id=vpc-0a12]",
                "module.web.aws_subnet.public[0]: Refreshing state... [id=subnet-04d1]",
                "module.web.aws_security_group.app: Refreshing state... [id=sg-089e]",
                "data.aws_ami.alpine: Reading...",
                "data.aws_ami.alpine: Read complete after 1s [id=ami-0a1b2c3d]"
              ],
              frameIntervalMs: 170,
              color: "#93c5fd"
            }
          ]
        },
        {
          type: "output",
          typingIntervalMs: 0,
          text: [
            { value: "Terraform will perform the following actions:\n\n", color: "#dbeafe" },
            { value: "  # aws_instance.web will be updated in-place\n", color: "#c4b5fd" },
            { value: "  ~ resource \"aws_instance\" \"web\" {\n", color: "#dbeafe" },
            { value: "      ~ instance_type = \"t3.micro\" -> \"t3.small\"\n", color: "#facc15" },
            { value: "      - monitoring    = false -> null\n", color: "#f87171" },
            { value: "      + tags          = {\n          + \"Service\" = \"aboutty\"\n        }\n", color: "#86efac" },
            { value: "    }\n\n", color: "#dbeafe" },
            {
              frames: [
                { value: "plan graph ████░░░░░░░░░░░░ 25%", color: "#818cf8" },
                { value: "plan graph ████████████░░░░ 72%", color: "#c4b5fd" },
                { value: "plan graph ████████████████ 100%", color: "#86efac", bold: true },
                { value: "Plan: 0 to add, 1 to change, 0 to destroy.", color: "#c4b5fd" },
                { value: "Saved the plan to: tfplan", color: "#93c5fd" }
              ],
              frameIntervalMs: 180,
              color: "#c4b5fd"
            }
          ]
        }
      ]
    }
  },
  {
    id: "kubectl-rollout",
    label: "Kubectl rollout",
    config: {
      title: "kubectl rollout",
      username: "ops",
      hostname: "cluster",
      prompt: "$",
      typingIntervalMs: 28,
      theme: {
        background: "#07111f",
        border: "#1e3a5f",
        title: "#bfdbfe",
        username: "#38bdf8",
        usernameSeparator: "#7dd3fc",
        hostname: "#93c5fd",
        cwdSeparator: "#60a5fa",
        cwd: "#bfdbfe",
        prompt: "#0ea5e9",
        text: "#e0f2fe",
        command: "#dbeafe",
        output: "#bae6fd"
      },
      ...commonPrompt,
      steps: [
        { type: "command", text: "kubectl get deploy,pods -n web" },
        {
          type: "output",
          typingIntervalMs: 0,
          text: "NAME                         READY   UP-TO-DATE   AVAILABLE   AGE\ndeployment.apps/aboutty-web   2/2     2            2           4d\n\nNAME                              READY   STATUS    RESTARTS   AGE\npod/aboutty-web-6bd9d7f8c7-8kw2l   1/1     Running   0          2d\npod/aboutty-web-6bd9d7f8c7-qgm5m   1/1     Running   0          2d"
        },
        { type: "command", text: "kubectl rollout restart deploy/aboutty-web -n web" },
        { type: "output", typingIntervalMs: 0, text: "deployment.apps/aboutty-web restarted" },
        { type: "command", text: "kubectl rollout status deploy/aboutty-web -n web" },
        {
          type: "output",
          text: [
            {
              frames: [
                "Waiting for deployment \"aboutty-web\" rollout to finish: 0 of 2 updated replicas are available...",
                "Waiting for deployment \"aboutty-web\" rollout to finish: 1 of 2 updated replicas are available...",
                "Waiting for deployment \"aboutty-web\" rollout to finish: 2 of 2 updated replicas are available...",
                "deployment \"aboutty-web\" successfully rolled out"
              ],
              frameIntervalMs: 220,
              color: "#38bdf8"
            }
          ]
        },
        { type: "command", text: "kubectl top pods -n web" },
        {
          type: "output",
          text: [
            {
              frames: [
                "collecting metrics |",
                "collecting metrics /",
                "collecting metrics -",
                "collecting metrics ok"
              ],
              frameIntervalMs: 120,
              color: "#7dd3fc"
            },
            {
              value: "\nNAME                              CPU(cores)   MEMORY(bytes)\naboutty-web-7cfc9b8d6c-24j8w       21m          84Mi\naboutty-web-7cfc9b8d6c-kp9dv       18m          79Mi",
              typingIntervalMs: 0,
              color: "#e0f2fe"
            }
          ]
        }
      ]
    }
  },
  {
    id: "test-runner",
    label: "Test runner",
    config: {
      title: "vitest",
      username: "ci",
      hostname: "runner",
      prompt: "$",
      typingIntervalMs: 24,
      theme: {
        background: "#101418",
        border: "#28323d",
        title: "#d7dee6",
        username: "#86efac",
        usernameSeparator: "#6ee7b7",
        hostname: "#93c5fd",
        cwdSeparator: "#7dd3fc",
        cwd: "#a7f3d0",
        prompt: "#22c55e",
        text: "#f8fafc",
        command: "#f8fafc",
        output: "#d1d5db"
      },
      ...commonPrompt,
      steps: [
        { type: "command", text: "pnpm test -- --coverage" },
        {
          type: "output",
          text: [
            { value: " RUN  v4.1.9 /workspace/aboutty\n\n", color: "#94a3b8" },
            {
              frames: [
                " ❯ packages/core/src/render.test.ts  (21 tests | 0 failed)",
                " ✓ packages/core/src/render.test.ts  (21 tests) 84ms",
                " ✓ packages/cli/src/index.test.ts   (4 tests) 31ms",
                " ✓ apps/studio/src/config.test.ts    (6 tests) 42ms"
              ],
              frameIntervalMs: 180,
              color: "#86efac"
            }
          ]
        },
        {
          type: "output",
          typingIntervalMs: 0,
          text: [
            { value: "\n Test Files  ", color: "#94a3b8" },
            { value: "3 passed", color: "#86efac", bold: true },
            { value: "\n      Tests  ", color: "#94a3b8" },
            { value: "31 passed", color: "#86efac", bold: true },
            { value: "\n   Duration  1.28s", color: "#94a3b8" }
          ]
        },
        {
          type: "output",
          text: [
            {
              frames: [
                "+-------------------+----------+----------+----------+\n| File              | Stmts    | Branch   | Funcs    |\n+-------------------+----------+----------+----------+\n| render.ts         | ███████░ | 86.4%    | 92.1%    |\n+-------------------+----------+----------+----------+",
                "+-------------------+----------+----------+----------+\n| File              | Stmts    | Branch   | Funcs    |\n+-------------------+----------+----------+----------+\n| render.ts         | ████████ | 91.8%    | 96.0%    |\n+-------------------+----------+----------+----------+",
                "+-------------------+----------+----------+----------+\n| File              | Stmts    | Branch   | Funcs    |\n+-------------------+----------+----------+----------+\n| All files         | ████████ | 90.2%    | 95.4%    |\n+-------------------+----------+----------+----------+"
              ],
              frameIntervalMs: 220,
              color: "#d1d5db"
            }
          ]
        }
      ]
    }
  },
  {
    id: "github-actions",
    label: "GitHub Actions",
    config: {
      title: "github actions",
      username: "gh",
      hostname: "actions",
      prompt: "$",
      typingIntervalMs: 26,
      theme: {
        background: "#0d1117",
        border: "#30363d",
        title: "#c9d1d9",
        username: "#58a6ff",
        usernameSeparator: "#79c0ff",
        hostname: "#a5d6ff",
        cwdSeparator: "#79c0ff",
        cwd: "#c9d1d9",
        prompt: "#3fb950",
        text: "#c9d1d9",
        command: "#f0f6fc",
        output: "#c9d1d9"
      },
      ...commonPrompt,
      steps: [
        { type: "command", text: "gh run watch 482913654 --compact" },
        {
          type: "output",
          text: [
            {
              frames: [
                "Refreshing run status |",
                "Refreshing run status /",
                "Refreshing run status -",
                "Refreshing run status \\",
                "Refreshing run status ok"
              ],
              frameIntervalMs: 120,
              color: "#58a6ff"
            }
          ]
        },
        {
          type: "output",
          text: [
            {
              frames: [
                "+----------------------+----------+---------+\n| Job                  | Status   | Time    |\n+----------------------+----------+---------+\n| build                | running  | 00:18   |\n| test                 | queued   | --      |\n| release-dry-run      | queued   | --      |\n+----------------------+----------+---------+",
                "+----------------------+----------+---------+\n| Job                  | Status   | Time    |\n+----------------------+----------+---------+\n| build                | success  | 00:32   |\n| test                 | running  | 00:11   |\n| release-dry-run      | queued   | --      |\n+----------------------+----------+---------+",
                "+----------------------+----------+---------+\n| Job                  | Status   | Time    |\n+----------------------+----------+---------+\n| build                | success  | 00:32   |\n| test                 | success  | 00:45   |\n| release-dry-run      | running  | 00:09   |\n+----------------------+----------+---------+",
                "+----------------------+----------+---------+\n| Job                  | Status   | Time    |\n+----------------------+----------+---------+\n| build                | success  | 00:32   |\n| test                 | success  | 00:45   |\n| release-dry-run      | success  | 00:21   |\n+----------------------+----------+---------+"
              ],
              frameIntervalMs: 240,
              color: "#c9d1d9"
            }
          ]
        },
        {
          type: "output",
          typingIntervalMs: 0,
          text: [
            { value: "\n✓ ", color: "#3fb950", bold: true },
            { value: "Workflow completed successfully", color: "#c9d1d9" }
          ]
        }
      ]
    }
  },
  {
    id: "database-migration",
    label: "DB migration",
    config: {
      title: "migration",
      username: "data",
      hostname: "primary",
      prompt: "$",
      typingIntervalMs: 24,
      theme: {
        background: "#0e141b",
        border: "#314155",
        title: "#dbeafe",
        username: "#67e8f9",
        usernameSeparator: "#22d3ee",
        hostname: "#93c5fd",
        cwdSeparator: "#38bdf8",
        cwd: "#bae6fd",
        prompt: "#06b6d4",
        text: "#e2e8f0",
        command: "#f8fafc",
        output: "#cbd5e1"
      },
      ...commonPrompt,
      steps: [
        { type: "command", text: "pnpm prisma migrate deploy" },
        {
          type: "output",
          text: [
            {
              frames: [
                "Prisma schema loaded from prisma/schema.prisma",
                "Datasource \"db\": PostgreSQL database \"app\", schema \"public\"",
                "3 migrations found in prisma/migrations"
              ],
              frameIntervalMs: 180,
              color: "#93c5fd"
            }
          ]
        },
        {
          type: "output",
          typingIntervalMs: 0,
          text: [
            { value: "┌─ migration plan ─────────────────────────┐\n", color: "#64748b" },
            { value: "│ ", color: "#64748b" },
            { value: "+ create table sessions                 ", color: "#86efac" },
            { value: "│\n│ ", color: "#64748b" },
            { value: "~ alter index users_email_key           ", color: "#facc15" },
            { value: "│\n│ ", color: "#64748b" },
            { value: "- drop column users.temp_token           ", color: "#f87171" },
            { value: "│\n└──────────────────────────────────────────┘", color: "#64748b" }
          ]
        },
        { type: "command", text: "psql \"$DATABASE_URL\" -f migrations/20260625_sessions.sql" },
        {
          type: "output",
          text: [
            {
              frames: [
                "applying 20260625_sessions ████░░░░░░░░░░░░ 25%",
                "applying 20260625_sessions █████████░░░░░░░ 58%",
                "applying 20260625_sessions ████████████████ 100%"
              ],
              frameIntervalMs: 180,
              color: "#67e8f9"
            }
          ]
        },
        {
          type: "output",
          typingIntervalMs: 0,
          text: "+-------------------+---------+--------+\n| Migration         | Status  | Time   |\n+-------------------+---------+--------+\n| 20260625_sessions | applied | 118ms  |\n| 20260625_indexes  | applied | 47ms   |\n+-------------------+---------+--------+"
        }
      ]
    }
  },
  {
    id: "release-pipeline",
    label: "Release pipeline",
    config: {
      title: "release",
      username: "ship",
      hostname: "registry",
      prompt: "$",
      typingIntervalMs: 24,
      theme: {
        background: "#111318",
        border: "#3a4250",
        title: "#f8fafc",
        username: "#fbbf24",
        usernameSeparator: "#f59e0b",
        hostname: "#fca5a5",
        cwdSeparator: "#fb7185",
        cwd: "#fde68a",
        prompt: "#f97316",
        text: "#f8fafc",
        command: "#fff7ed",
        output: "#e5e7eb"
      },
      ...commonPrompt,
      steps: [
        {
          type: "output",
          typingIntervalMs: 0,
          text: "   ____      __                    \n  / __ \\___ / /__ ___ ____ ___ ___ \n / /_/ / -_) / -_) _ `(_-</ -_) -_)\n/ .___/\\__/_/\\__/\\_,_/___/\\__/\\__/ \n/_/                                   "
        },
        { type: "command", text: "pnpm changeset version && pnpm release:dry-run" },
        {
          type: "output",
          typingIntervalMs: 0,
          text: "+-----------------+------------+--------+\n| Package         | Action     | Access |\n+-----------------+------------+--------+\n| @aboutty/core   | publish    | public |\n| @aboutty/cli    | publish    | public |\n| @aboutty/action | tag update | public |\n+-----------------+------------+--------+"
        },
        {
          type: "output",
          text: [
            {
              frames: [
                { value: "packing @aboutty/core   ███░░░░░░░░░░░░░ 18%", color: "#fca5a5" },
                { value: "packing @aboutty/cli    ████████░░░░░░░░ 48%", color: "#fbbf24" },
                { value: "packing @aboutty/action █████████████░░░ 82%", color: "#f59e0b" },
                { value: "packing artifacts       ████████████████ 100%", color: "#86efac", bold: true }
              ],
              frameIntervalMs: 180,
              color: "#fbbf24"
            }
          ]
        },
        {
          type: "output",
          text: [
            { value: "verifying registry metadata ", color: "#e5e7eb" },
            {
              frames: ["|", "/", "-", "\\", "ok"],
              frameIntervalMs: 110,
              color: "#f97316"
            },
            { value: "\n", color: "#e5e7eb" },
            {
              value: "+----------------+----------+---------+\n| Artifact       | Size     | Result  |\n+----------------+----------+---------+\n| core.tgz       | 11.3 kB  | ready   |\n| cli.tgz        | 8.7 kB   | ready   |\n| action archive | 4.1 kB   | ready   |\n+----------------+----------+---------+",
              typingIntervalMs: 0,
              color: "#e5e7eb"
            }
          ]
        }
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
