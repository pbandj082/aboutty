import { describe, expect, it } from "vitest";
import { renderSvg } from "./render.js";

describe("renderSvg", () => {
  it("renders command and output text as escaped SVG", () => {
    const svg = renderSvg({
      steps: [
        { type: "command", text: "echo <aboutty>" },
        { type: "output", text: "ok & done" }
      ]
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain("&lt;");
    expect(svg).toContain("&gt;");
    expect(svg).toContain("&amp;");
  });

  it("renders username and hostname before the prompt", () => {
    const svg = renderSvg({
      username: "aboutty",
      usernameSeparator: "@",
      hostname: "dev",
      cwd: "",
      prompt: "$",
      theme: {
        username: "#111111",
        hostname: "#222222",
        separator: "#444444",
        prompt: "#333333"
      },
      steps: [{ type: "command", text: "pnpm build" }]
    });

    expect(svg).toContain('fill="#111111"');
    expect(svg).toContain(">aboutty</tspan>");
    expect(svg).toContain('fill="#444444"');
    expect(svg).toContain(">@</tspan>");
    expect(svg).toContain('fill="#222222"');
    expect(svg).toContain(">dev</tspan>");
    expect(svg).toContain('fill="#333333"');
    expect(svg).toContain("> $ </tspan>");
  });

  it("defaults the current working directory to home", () => {
    const svg = renderSvg({
      hostname: "dev",
      prompt: "$",
      steps: [{ type: "command", text: "pnpm build" }]
    });

    expect(svg).toContain(">dev</tspan>");
    expect(svg).toContain(">:</tspan>");
    expect(svg).toContain(">~</tspan>");
    expect(svg).toContain("> $ </tspan>");
  });

  it("renders the current working directory with configurable separator and colors", () => {
    const svg = renderSvg({
      username: "aboutty",
      usernameSeparator: " at ",
      hostname: "dev",
      cwd: "~/workspace/aboutty",
      cwdSeparator: " :: ",
      prompt: "$",
      theme: {
        usernameSeparator: "#444444",
        cwd: "#555555",
        cwdSeparator: "#666666",
        prompt: "#333333"
      },
      steps: [{ type: "command", text: "pnpm build" }]
    });

    expect(svg).toContain(">aboutty</tspan>");
    expect(svg).toContain('fill="#444444"');
    expect(svg).toContain("> at </tspan>");
    expect(svg).toContain(">dev</tspan>");
    expect(svg).toContain('fill="#666666"');
    expect(svg).toContain("> :: </tspan>");
    expect(svg).toContain('fill="#555555"');
    expect(svg).toContain(">~/workspace/aboutty</tspan>");
    expect(svg).toContain('fill="#333333"');
    expect(svg).toContain("> $ </tspan>");
  });

  it("allows command steps to override the current working directory", () => {
    const svg = renderSvg({
      hostname: "dev",
      cwd: "~",
      steps: [
        { type: "command", cwd: "~/workspace/aboutty", text: "pwd" },
        { type: "output", text: "/home/aboutty/workspace/aboutty" },
        { type: "command", text: "ls" }
      ]
    });

    expect(svg).toContain(">~/workspace/aboutty</tspan>");
    expect(svg).toContain(">~</tspan>");
  });

  it("rejects current working directories on output steps", () => {
    expect(() =>
      renderSvg({
        steps: [{ type: "output", cwd: "~", text: "done" }]
      })
    ).toThrow("steps[0].cwd is only supported for command steps");
  });

  it("uses theme text as the default command and output color", () => {
    const svg = renderSvg({
      theme: {
        text: "#eeeeee"
      },
      steps: [
        { type: "command", text: "pnpm build" },
        { type: "output", text: "done" }
      ]
    });

    expect(svg.match(/fill="#eeeeee"/g)?.length).toBe(2);
  });

  it("renders styled text segments", () => {
    const svg = renderSvg({
      steps: [
        {
          type: "output",
          text: [
            { value: "ok", color: "#27c93f", bold: true },
            { value: " done", italic: true }
          ]
        }
      ]
    });

    expect(svg).toContain('fill="#27c93f" font-weight="700" opacity="0"');
    expect(svg).toContain('font-style="italic" opacity="0"');
  });

  it("renders characters with staggered animation", () => {
    const svg = renderSvg({
      typingIntervalMs: 40,
      steps: [{ type: "command", text: "ab", delayMs: 100 }]
    });

    expect(svg).toContain('style="animation: appear 1ms linear 100ms forwards"');
    expect(svg).toContain('style="animation: appear 1ms linear 140ms forwards"');
    expect(svg).toContain(">a</tspan>");
    expect(svg).toContain(">b</tspan>");
  });

  it("uses the step interval before every step", () => {
    const svg = renderSvg({
      stepIntervalMs: 500,
      typingIntervalMs: 0,
      steps: [
        { type: "output", text: "a" },
        { type: "output", text: "b" }
      ]
    });

    expect(svg).toContain('style="animation: appear 1ms linear 500ms forwards">a</tspan>');
    expect(svg).toContain('style="animation: appear 1ms linear 1000ms forwards">b</tspan>');
  });

  it("renders multiline segment text for ASCII art", () => {
    const svg = renderSvg({
      steps: [
        {
          type: "output",
          text: [{ value: "about\n tty", color: "#6ee7b7" }]
        }
      ]
    });

    expect(svg).toContain("about");
    expect(svg).toContain("> </tspan>");
    expect(svg).toContain(">y</tspan>");
    expect(svg.match(/<text x=/g)?.length).toBe(3);
  });

  it("uses the step typing interval for multiline output line timing", () => {
    const svg = renderSvg({
      steps: [{ type: "output", delayMs: 100, typingIntervalMs: 0, text: "a\nb" }]
    });

    expect(svg).toContain('style="animation: appear 1ms linear 100ms forwards">a</tspan>');
    expect(svg).toContain('style="animation: appear 1ms linear 100ms forwards">b</tspan>');
    expect(svg).not.toContain("276ms");
  });

  it("replays repeated segment animations with segment typing interval", () => {
    const svg = renderSvg({
      typingIntervalMs: 10,
      steps: [
        {
          type: "output",
          delayMs: 100,
          text: [
            { value: "Loading" },
            { value: "...", repeat: 3, repeatDelayMs: 300, typingIntervalMs: 200, color: "#6ee7b7" }
          ]
        }
      ]
    });

    expect(svg.split('fill="#6ee7b7" opacity="0"').length - 1).toBe(3);
    expect(svg).toContain("@keyframes aboutty-repeat-0");
    expect(svg).toContain("@keyframes aboutty-repeat-1");
    expect(svg).toContain("@keyframes aboutty-repeat-2");
    expect(svg).toContain('style="animation: aboutty-repeat-0 2400ms linear 170ms forwards"');
    expect(svg).toContain("25.001% { opacity: 0; }");
    expect(svg).toContain("37.5% { opacity: 0; }");
    expect(svg).toContain("37.501% { opacity: 1; }");
  });

  it("renders looped animation keyframes when loop is enabled", () => {
    const svg = renderSvg({
      loop: true,
      typingIntervalMs: 40,
      steps: [{ type: "command", text: "ab", delayMs: 100 }]
    });

    expect(svg).toContain("@keyframes aboutty-loop-");
    expect(svg).toContain("infinite");
    expect(svg).toContain('style="animation: aboutty-loop-');
    expect(svg).not.toContain('style="animation: appear 1ms linear 100ms forwards"');
  });
});
