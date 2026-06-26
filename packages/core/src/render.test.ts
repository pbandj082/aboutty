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

    expect(svg).toContain('style="animation: appear 86400000ms step-end 0ms forwards"> $ </tspan>');
    expect(svg).toContain('style="animation: appear 86400000ms step-end 100ms forwards"');
    expect(svg).toContain('style="animation: appear 86400000ms step-end 140ms forwards"');
    expect(svg).toContain(">a</tspan>");
    expect(svg).toContain(">b</tspan>");
  });

  it("uses the step interval before command text after rendering the prompt", () => {
    const svg = renderSvg({
      stepIntervalMs: 500,
      typingIntervalMs: 0,
      steps: [{ type: "command", text: "a" }]
    });

    expect(svg).toContain('style="animation: appear 86400000ms step-end 0ms forwards"> $ </tspan>');
    expect(svg).toContain('style="animation: appear 86400000ms step-end 500ms forwards">a</tspan>');
  });

  it("renders a cursor that follows command input and only blinks while idle", () => {
    const svg = renderSvg({
      cursor: {
        enabled: true,
        style: "bar",
        blinkIntervalMs: 500
      },
      theme: {
        cursor: "#ff00ff"
      },
      stepIntervalMs: 100,
      typingIntervalMs: 20,
      steps: [
        { type: "command", text: "ab" },
        { type: "output", typingIntervalMs: 0, text: "ok" }
      ]
    });

    expect(svg).toContain("@keyframes aboutty-cursor-blink");
    expect(svg.match(/animation: aboutty-cursor-blink 500ms step-end 0ms infinite/g)).toHaveLength(2);
    expect(svg).not.toContain("aboutty-cursor-visible");
    expect(svg).toContain("86400000ms step-end 0ms forwards");
    expect(svg).toContain("0.000116% { opacity: 1; }");
    expect(svg).toContain("0.000139% { opacity: 1; }");
    expect(svg).toContain('fill="#ff00ff"');
    expect(svg).toContain('style="animation: appear 86400000ms step-end 100ms forwards">a</tspan>');
    expect(svg).toContain('style="animation: appear 86400000ms step-end 120ms forwards">b</tspan>');
    expect(svg).toContain("aboutty-cursor-");
  });

  it("uses fixed command columns without compressing glyphs", () => {
    const svg = renderSvg({
      cursor: {
        enabled: true,
        style: "bar"
      },
      cwd: "",
      fontSize: 20,
      padding: 10,
      prompt: "$",
      stepIntervalMs: 0,
      typingIntervalMs: 0,
      steps: [{ type: "command", text: "ab" }]
    });

    expect(svg).toContain('fill="#5eead4" x="10 22" opacity="0" style="animation: appear 86400000ms step-end 0ms forwards">$ </tspan>');
    expect(svg).toContain('<tspan x="34" opacity="0" style="animation: appear 86400000ms step-end 0ms forwards">a</tspan>');
    expect(svg).toContain('<rect x="58" y="47" width="2.4" height="20" fill="#f8fafc"');
    expect(svg).not.toContain("textLength=");
    expect(svg).not.toContain("lengthAdjust=");
  });

  it("does not render a command cursor by default", () => {
    const svg = renderSvg({
      steps: [{ type: "command", text: "ab" }]
    });

    expect(svg).not.toContain("aboutty-cursor-blink");
    expect(svg).not.toContain("aboutty-cursor-");
  });

  it("renders block, outline, and underline cursor styles", () => {
    const outlineSvg = renderSvg({
      cursor: { enabled: true, style: "outline" },
      steps: [{ type: "command", text: "x" }]
    });
    const underlineSvg = renderSvg({
      cursor: { enabled: true, style: "underline" },
      steps: [{ type: "command", text: "x" }]
    });
    const blockSvg = renderSvg({
      cursor: { enabled: true, style: "block" },
      steps: [{ type: "command", text: "x" }]
    });

    expect(outlineSvg).toContain('fill="none" stroke="#f8fafc"');
    expect(underlineSvg).toContain('height="1.68" fill="#f8fafc"');
    expect(blockSvg).toContain('width="8.4" height="14" fill="#f8fafc"');
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

    expect(svg).toContain('style="animation: appear 86400000ms step-end 500ms forwards">a</tspan>');
    expect(svg).toContain('style="animation: appear 86400000ms step-end 1000ms forwards">b</tspan>');
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

    expect(svg).toContain('style="animation: appear 86400000ms step-end 100ms forwards">a</tspan>');
    expect(svg).toContain('style="animation: appear 86400000ms step-end 100ms forwards">b</tspan>');
    expect(svg).not.toContain("276ms");
  });

  it("positions text baselines inside line-height boxes", () => {
    const svg = renderSvg({
      padding: 10,
      fontSize: 20,
      lineHeight: 40,
      typingIntervalMs: 0,
      steps: [{ type: "output", text: "a\nb" }]
    });

    expect(svg).toContain('height="136"');
    expect(svg).toContain('<text x="10" y="72" fill="#b8c1cc" xml:space="preserve">');
    expect(svg).toContain('<text x="10" y="112" fill="#b8c1cc" xml:space="preserve">');
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
    expect(svg).toContain('style="animation: aboutty-repeat-0 2400ms step-end 170ms forwards"');
    expect(svg).toContain("25.001% { opacity: 0; }");
    expect(svg).toContain("37.5% { opacity: 0; }");
    expect(svg).toContain("37.501% { opacity: 1; }");
  });

  it("renders frame segments at the same text column", () => {
    const svg = renderSvg({
      stepIntervalMs: 0,
      typingIntervalMs: 0,
      steps: [
        {
          type: "output",
          text: [
            { value: "Loading " },
            { frames: ["|", "/", "-", "\\"], frameIntervalMs: 100, repeat: 2, color: "#6ee7b7" }
          ]
        }
      ]
    });

    expect(svg).toContain("@keyframes aboutty-frame-");
    expect(svg).not.toContain('<tspan opacity="0"> </tspan>');
    expect(svg).toContain('<text x="91.2" y="75.2" fill="#6ee7b7" xml:space="preserve" opacity="0"');
    expect(svg).toContain('style="animation: aboutty-frame-0 800ms step-end 0ms forwards"');
    expect(svg.split('fill="#6ee7b7"').length - 1).toBe(4);
  });

  it("allows individual frames to override segment styles", () => {
    const svg = renderSvg({
      stepIntervalMs: 0,
      typingIntervalMs: 0,
      steps: [
        {
          type: "output",
          text: [
            {
              frames: [
                "pending",
                { value: "warning", color: "#facc15", italic: true },
                { value: "ready", color: "#86efac", bold: true }
              ],
              frameIntervalMs: 100,
              color: "#94a3b8"
            }
          ]
        }
      ]
    });

    expect(svg).toContain('fill="#94a3b8"');
    expect(svg).toContain('fill="#facc15" font-style="italic"');
    expect(svg).toContain('fill="#86efac" font-weight="700"');
    expect(svg).toContain(">warning</text>");
    expect(svg).toContain(">ready</text>");
  });

  it("freezes the final frame after one pass when loop is enabled", () => {
    const svg = renderSvg({
      loop: true,
      stepIntervalMs: 0,
      typingIntervalMs: 0,
      steps: [
        {
          type: "output",
          text: [{ frames: ["|", "/"], frameIntervalMs: 100 }]
        }
      ]
    });

    expect(svg).toContain('style="animation: aboutty-frame-0 1400ms step-end 0ms infinite"');
    expect(svg).toContain(
      "@keyframes aboutty-frame-0 { 0% { opacity: 1; } 7.143% { opacity: 1; } 7.144% { opacity: 0; } 14.286% { opacity: 0; } 100% { opacity: 0; } }"
    );
    expect(svg).toContain(
      "@keyframes aboutty-frame-1 { 0% { opacity: 0; } 7.143% { opacity: 0; } 7.144% { opacity: 1; } 14.286% { opacity: 1; } 100% { opacity: 1; } }"
    );
  });

  it("uses frame segment duration before following text", () => {
    const svg = renderSvg({
      stepIntervalMs: 0,
      typingIntervalMs: 0,
      steps: [
        {
          type: "output",
          text: [
            { frames: ["", ".", ".."], frameIntervalMs: 50, repeat: 2, repeatDelayMs: 20 },
            { value: "done" }
          ]
        }
      ]
    });

    expect(svg).not.toContain('<tspan opacity="0">  </tspan>');
    expect(svg).toContain('x="40.8" opacity="0" style="animation: appear 86400000ms step-end 320ms forwards">d</tspan>');
    expect(svg).toContain('style="animation: appear 86400000ms step-end 320ms forwards">d</tspan>');
  });

  it("renders multiline frame segments as synchronized visual lines", () => {
    const svg = renderSvg({
      padding: 10,
      lineHeight: 20,
      stepIntervalMs: 0,
      typingIntervalMs: 0,
      steps: [
        {
          type: "output",
          text: [
            {
              frames: ["a\nb", "aa\nbb"],
              frameIntervalMs: 100,
              color: "#6ee7b7"
            }
          ]
        },
        { type: "output", text: "done" }
      ]
    });

    expect(svg).toContain('height="116"');
    expect(svg.match(/@keyframes aboutty-frame-/g)?.length).toBe(4);
    expect(svg).toContain(">aa</text>");
    expect(svg).toContain(">bb</text>");
    expect(svg).toContain('style="animation: appear 86400000ms step-end 200ms forwards">d</tspan>');
  });

  it("preserves object frame styles across multiline frame rows", () => {
    const svg = renderSvg({
      padding: 10,
      lineHeight: 20,
      stepIntervalMs: 0,
      typingIntervalMs: 0,
      steps: [
        {
          type: "output",
          text: [
            {
              frames: [
                { value: "a\nb", color: "#f87171" },
                { value: "ok\nok", color: "#86efac", bold: true }
              ],
              frameIntervalMs: 100
            }
          ]
        }
      ]
    });

    expect(svg.match(/fill="#f87171"/g)?.length).toBe(2);
    expect(svg.match(/fill="#86efac" font-weight="700"/g)?.length).toBe(2);
    expect(svg).toContain(">ok</text>");
  });

  it("rejects segments that mix value and frames", () => {
    expect(() =>
      renderSvg({
        steps: [
          {
            type: "output",
            text: [{ value: "x", frames: ["y"] } as never]
          }
        ]
      })
    ).toThrow("steps[0].text[0] must include either value or frames");
  });

  it("rejects frame segments on command steps", () => {
    expect(() =>
      renderSvg({
        steps: [
          {
            type: "command",
            text: [{ frames: ["|", "/"] }]
          }
        ]
      })
    ).toThrow("steps[0].text frames segments are only supported for output steps");
  });

  it("rejects invalid frame objects", () => {
    expect(() =>
      renderSvg({
        steps: [
          {
            type: "output",
            text: [{ frames: [{ value: 1 }] } as never]
          }
        ]
      })
    ).toThrow("steps[0].text[0].frames[0].value must be a string");
  });

  it("rejects invalid cursor settings", () => {
    expect(() =>
      renderSvg({
        cursor: { enabled: true, style: "beam" } as never,
        steps: [{ type: "command", text: "x" }]
      })
    ).toThrow('cursor.style must be "block", "outline", "bar", or "underline"');

    expect(() =>
      renderSvg({
        cursor: { enabled: true, blinkIntervalMs: 50 },
        steps: [{ type: "command", text: "x" }]
      })
    ).toThrow("cursor.blinkIntervalMs must be a number greater than or equal to 100");
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
    expect(svg).not.toContain('style="animation: appear 86400000ms step-end 100ms forwards"');
  });
});
