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
      hostname: "dev",
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
      stepIntervalMs: 40,
      steps: [{ type: "command", text: "ab", delayMs: 100 }]
    });

    expect(svg).toContain('style="animation: appear 1ms linear 100ms forwards"');
    expect(svg).toContain('style="animation: appear 1ms linear 140ms forwards"');
    expect(svg).toContain(">a</tspan>");
    expect(svg).toContain(">b</tspan>");
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

  it("uses the step interval for multiline output line timing", () => {
    const svg = renderSvg({
      stepIntervalMs: 20,
      steps: [{ type: "output", delayMs: 100, typingIntervalMs: 0, text: "a\nb" }]
    });

    expect(svg).toContain('style="animation: appear 1ms linear 100ms forwards">a</tspan>');
    expect(svg).toContain('style="animation: appear 1ms linear 100ms forwards">b</tspan>');
    expect(svg).not.toContain("276ms");
  });

  it("replays repeated segment animations with segment typing interval", () => {
    const svg = renderSvg({
      stepIntervalMs: 10,
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
      stepIntervalMs: 40,
      steps: [{ type: "command", text: "ab", delayMs: 100 }]
    });

    expect(svg).toContain("@keyframes aboutty-loop-");
    expect(svg).toContain("infinite");
    expect(svg).toContain('style="animation: aboutty-loop-');
    expect(svg).not.toContain('style="animation: appear 1ms linear 100ms forwards"');
  });
});
