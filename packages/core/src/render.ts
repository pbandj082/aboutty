import { type AbouttyConfig, type AbouttyTextSegment, resolveConfig } from "./config.js";
import { escapeXml } from "./escape.js";
import {
  getSegmentAnimationDurationMs,
  getSegmentRepeat,
  getSegmentRepeatDelayMs,
  getSegmentValue
} from "./text.js";
import { createTimeline } from "./timeline.js";
import { validateConfig } from "./validate.js";

const chromeHeight = 36;
const defaultLoopPauseMs = 1200;

interface AnimationContext {
  appearAnimationsByStartMs: Map<string, string>;
  keyframes: string[];
  loopDurationMs: number | undefined;
  nextId: number;
}

export function renderSvg(config: AbouttyConfig): string {
  const errors = validateConfig(config);

  if (errors.length > 0) {
    throw new Error(`Invalid aboutty config:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }

  const resolved = resolveConfig(config);
  const timeline = createTimeline(resolved);
  const animationContext: AnimationContext = {
    appearAnimationsByStartMs: new Map(),
    keyframes: [],
    loopDurationMs: resolved.loop ? getLoopDurationMs(timeline) : undefined,
    nextId: 0
  };
  const height = Math.max(
    chromeHeight + resolved.padding + resolved.lineHeight,
    chromeHeight + resolved.padding * 2 + timeline.length * resolved.lineHeight
  );

  const text = timeline
    .map((line, index) => {
      const y = chromeHeight + resolved.padding + index * resolved.lineHeight;
      const fill = line.kind === "command" ? resolved.theme.command : resolved.theme.output;
      const prefix =
        line.kind === "command"
          ? renderPromptPrefix(
              resolved,
              line.cwd,
              line.startMs,
              animationContext
            )
          : "";
      const contents = renderTypewriterSegments(line.segments, line.startMs, line.typingIntervalMs, animationContext);

      return [
        `<text x="${resolved.padding}" y="${y}" fill="${fill}">`,
        `${prefix}${contents}`,
        "</text>"
      ].join("");
    })
    .join("\n");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${resolved.width}" height="${height}" viewBox="0 0 ${resolved.width} ${height}" role="img" aria-label="${escapeXml(resolved.title)}">`,
    "<style>",
    "@keyframes appear { to { opacity: 1; } }",
    ...animationContext.keyframes,
    "text { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; white-space: pre; }",
    "</style>",
    `<rect width="100%" height="100%" rx="8" fill="${resolved.theme.background}" />`,
    `<rect x="0.5" y="0.5" width="${resolved.width - 1}" height="${height - 1}" rx="7.5" fill="none" stroke="${resolved.theme.border}" />`,
    `<circle cx="18" cy="18" r="5" fill="#ff5f56" />`,
    `<circle cx="36" cy="18" r="5" fill="#ffbd2e" />`,
    `<circle cx="54" cy="18" r="5" fill="#27c93f" />`,
    `<text x="${resolved.width / 2}" y="23" text-anchor="middle" font-size="12" fill="${resolved.theme.title}">${escapeXml(resolved.title)}</text>`,
    `<g font-size="${resolved.fontSize}">`,
    text,
    "</g>",
    "</svg>"
  ].join("\n");
}

function renderPromptPrefix(
  config: ReturnType<typeof resolveConfig>,
  cwd: string | undefined,
  startMs: number,
  animationContext: AnimationContext
): string {
  const animation = ` opacity="0" style="${createAppearAnimation(startMs, animationContext)}"`;
  const parts = createPromptPrefixParts(config, cwd);

  return parts
    .map((part) => `<tspan fill="${part.color}"${animation}>${escapeXml(part.value)}</tspan>`)
    .join("");
}

function renderTypewriterSegments(
  segments: AbouttyTextSegment[],
  startMs: number,
  typingIntervalMs: number,
  animationContext: AnimationContext
): string {
  let cursorMs = startMs;
  const output: string[] = [];

  for (const segment of segments) {
    const attributes = createSegmentAttributes(segment);
    const intervalMs = segment.typingIntervalMs ?? typingIntervalMs;
    const repeat = getSegmentRepeat(segment);
    const value = getSegmentValue(segment);

    if (repeat > 1) {
      output.push(renderRepeatingTypewriterSegment(segment, value, cursorMs, intervalMs, animationContext));
      cursorMs += getSegmentAnimationDurationMs(segment, typingIntervalMs);
      continue;
    }

    for (const character of Array.from(value)) {
      output.push(
        `<tspan ${[
          ...attributes,
          `opacity="0"`,
          `style="${createAppearAnimation(cursorMs, animationContext)}"`
        ].join(" ")}>${escapeXml(character)}</tspan>`
      );
      cursorMs += intervalMs;
    }
  }

  return output.join("");
}

function renderRepeatingTypewriterSegment(
  segment: AbouttyTextSegment,
  value: string,
  startMs: number,
  intervalMs: number,
  animationContext: AnimationContext
): string {
  const attributes = createSegmentAttributes(segment);
  const totalDurationMs = getSegmentAnimationDurationMs(segment, intervalMs);

  if (totalDurationMs <= 0) {
    return Array.from(value)
      .map((character) =>
        `<tspan ${[
          ...attributes,
          `opacity="0"`,
          `style="${createAppearAnimation(startMs, animationContext)}"`
        ].join(" ")}>${escapeXml(character)}</tspan>`
      )
      .join("");
  }

  return Array.from(value)
    .map((character, characterIndex) => {
      const animationName = `aboutty-repeat-${animationContext.nextId++}`;
      const animationDurationMs = animationContext.loopDurationMs ?? totalDurationMs;

      animationContext.keyframes.push(
        createRepeatKeyframes(animationName, characterIndex, value, intervalMs, segment, {
          keyframeDurationMs: animationDurationMs,
          offsetMs: animationContext.loopDurationMs === undefined ? 0 : startMs
        })
      );

      return `<tspan ${[
        ...attributes,
        `opacity="0"`,
        `style="animation: ${animationName} ${formatNumber(animationDurationMs)}ms linear ${animationContext.loopDurationMs === undefined ? `${formatNumber(startMs)}ms forwards` : "0ms infinite"}"`
      ].join(" ")}>${escapeXml(character)}</tspan>`;
    })
    .join("");
}

function createRepeatKeyframes(
  name: string,
  characterIndex: number,
  value: string,
  intervalMs: number,
  segment: AbouttyTextSegment,
  options: { keyframeDurationMs?: number; offsetMs?: number } = {}
): string {
  const characterCount = Array.from(value).length;
  const passDurationMs = characterCount * intervalMs;
  const repeat = getSegmentRepeat(segment);
  const repeatDelayMs = getSegmentRepeatDelayMs(segment);
  const cycleDurationMs = passDurationMs + repeatDelayMs;
  const segmentDurationMs = getSegmentAnimationDurationMs(segment, intervalMs);
  const keyframeDurationMs = options.keyframeDurationMs ?? segmentDurationMs;
  const offsetMs = options.offsetMs ?? 0;
  const instantMs = Math.max(keyframeDurationMs / 100000, 0.001);
  const points = new Map<number, 0 | 1>();

  setOpacityPoint(points, 0, 0, keyframeDurationMs);

  for (let cycle = 0; cycle < repeat; cycle += 1) {
    const cycleStartMs = offsetMs + cycle * cycleDurationMs;
    const appearMs = cycleStartMs + characterIndex * intervalMs;

    if (appearMs <= 0) {
      setOpacityPoint(points, 0, 1, keyframeDurationMs);
    } else {
      setOpacityPoint(points, appearMs, 0, keyframeDurationMs);
      setOpacityPoint(points, appearMs + instantMs, 1, keyframeDurationMs);
    }

    if (cycle < repeat - 1) {
      const hideMs = cycleStartMs + passDurationMs;

      setOpacityPoint(points, hideMs, 1, keyframeDurationMs);
      setOpacityPoint(points, hideMs + instantMs, 0, keyframeDurationMs);
    }
  }

  setOpacityPoint(points, offsetMs + segmentDurationMs, 1, keyframeDurationMs);
  setOpacityPoint(points, keyframeDurationMs, 1, keyframeDurationMs);

  const keyframes = [...points.entries()]
    .sort(([left], [right]) => left - right)
    .map(([timeMs, opacity]) => {
      const percent = formatNumber((timeMs / keyframeDurationMs) * 100);

      return `${percent}% { opacity: ${opacity}; }`;
    })
    .join(" ");

  return `@keyframes ${name} { ${keyframes} }`;
}

function createAppearAnimation(startMs: number, animationContext: AnimationContext): string {
  if (animationContext.loopDurationMs === undefined) {
    return `animation: appear 1ms linear ${formatNumber(startMs)}ms forwards`;
  }

  const cacheKey = formatNumber(startMs);
  const cachedAnimationName = animationContext.appearAnimationsByStartMs.get(cacheKey);

  if (cachedAnimationName) {
    return `animation: ${cachedAnimationName} ${formatNumber(animationContext.loopDurationMs)}ms linear 0ms infinite`;
  }

  const animationName = `aboutty-loop-${animationContext.nextId++}`;

  animationContext.appearAnimationsByStartMs.set(cacheKey, animationName);

  animationContext.keyframes.push(
    createAppearKeyframes(animationName, startMs, animationContext.loopDurationMs)
  );

  return `animation: ${animationName} ${formatNumber(animationContext.loopDurationMs)}ms linear 0ms infinite`;
}

function createAppearKeyframes(name: string, startMs: number, totalDurationMs: number): string {
  const instantMs = Math.max(totalDurationMs / 100000, 0.001);
  const points = new Map<number, 0 | 1>();

  setOpacityPoint(points, 0, 0, totalDurationMs);

  if (startMs <= 0) {
    setOpacityPoint(points, 0, 1, totalDurationMs);
  } else {
    setOpacityPoint(points, startMs, 0, totalDurationMs);
    setOpacityPoint(points, startMs + instantMs, 1, totalDurationMs);
  }

  setOpacityPoint(points, totalDurationMs, 1, totalDurationMs);

  const keyframes = [...points.entries()]
    .sort(([left], [right]) => left - right)
    .map(([timeMs, opacity]) => {
      const percent = formatNumber((timeMs / totalDurationMs) * 100);

      return `${percent}% { opacity: ${opacity}; }`;
    })
    .join(" ");

  return `@keyframes ${name} { ${keyframes} }`;
}

function getLoopDurationMs(timeline: ReturnType<typeof createTimeline>): number {
  const animationEndMs = timeline.reduce((endMs, line) => {
    const lineDurationMs = line.segments.reduce(
      (durationMs, segment) => durationMs + getSegmentAnimationDurationMs(segment, line.typingIntervalMs),
      0
    );

    return Math.max(endMs, line.startMs + lineDurationMs);
  }, 0);

  return Math.max(animationEndMs + defaultLoopPauseMs, 1);
}

function setOpacityPoint(
  points: Map<number, 0 | 1>,
  timeMs: number,
  opacity: 0 | 1,
  totalDurationMs: number
): void {
  points.set(Math.min(Math.max(timeMs, 0), totalDurationMs), opacity);
}

function formatNumber(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function createSegmentAttributes(segment: AbouttyTextSegment): string[] {
  const attributes: string[] = [];

  if (segment.color) {
    attributes.push(`fill="${escapeXml(segment.color)}"`);
  }

  if (segment.bold) {
    attributes.push('font-weight="700"');
  }

  if (segment.italic) {
    attributes.push('font-style="italic"');
  }

  return attributes;
}

function createPromptPrefixParts(
  config: ReturnType<typeof resolveConfig>,
  cwd: string | undefined
): { color: string; value: string }[] {
  const parts: { color: string; value: string }[] = [];

  if (isNonEmptyString(config.username)) {
    parts.push({ color: config.theme.username, value: config.username });
  }

  if (
    isNonEmptyString(config.username) &&
    isNonEmptyString(config.usernameSeparator) &&
    isNonEmptyString(config.hostname)
  ) {
    parts.push({ color: config.theme.usernameSeparator, value: config.usernameSeparator });
  }

  if (isNonEmptyString(config.hostname)) {
    parts.push({ color: config.theme.hostname, value: config.hostname });
  }

  if (isNonEmptyString(cwd)) {
    if (isNonEmptyString(config.hostname) && isNonEmptyString(config.cwdSeparator)) {
      parts.push({ color: config.theme.cwdSeparator, value: config.cwdSeparator });
    } else if (parts.length > 0) {
      parts.push({ color: config.theme.prompt, value: " " });
    }

    parts.push({ color: config.theme.cwd, value: cwd });
  }

  if (parts.length > 0) {
    parts.push({ color: config.theme.prompt, value: ` ${config.prompt} ` });
    return parts;
  }

  return [{ color: config.theme.prompt, value: `${config.prompt} ` }];
}

function isNonEmptyString(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}
