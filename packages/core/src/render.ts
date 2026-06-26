import {
  type AbouttyConfig,
  type AbouttyCursorStyle,
  type AbouttyFrame,
  type AbouttyFramesTextSegment,
  type AbouttyTextSegment,
  type AbouttyValueTextSegment,
  resolveConfig
} from "./config.js";
import { escapeXml } from "./escape.js";
import {
  getSegmentAnimationDurationMs,
  getFrameValue,
  getSegmentFrameIntervalMs,
  getSegmentFrames,
  getSegmentRepeat,
  getSegmentRepeatDelayMs,
  getSegmentTextLength,
  getSegmentValue,
  isFramesSegment
} from "./text.js";
import { createTimeline, type TimelineLine } from "./timeline.js";
import { validateConfig } from "./validate.js";

const chromeHeight = 36;
const defaultLoopPauseMs = 1200;
const instantAnimationTiming = "step-end";
// Keep non-loop text in an active animation instead of relying on fill-mode after a 1ms animation.
// SVGs embedded as <img> can drop long-finished CSS forwards states.
const nonLoopAppearDurationMs = 24 * 60 * 60 * 1000;
const monospaceCharacterWidthEm = 0.6;
const cursorBlinkAnimationName = "aboutty-cursor-blink";
// Approximate alphabetic baseline position within the monospace font box.
const textBaselineRatio = 0.8;

interface AnimationContext {
  appearAnimationsByStartMs: Map<string, string>;
  keyframes: string[];
  loopDurationMs: number | undefined;
  nextId: number;
}

interface RenderedLineSegments {
  inline: string;
  overlays: string[];
}

interface CursorSpan {
  blink: boolean;
  column: number;
  startMs: number;
  endMs: number;
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

  if (resolved.cursor.enabled) {
    animationContext.keyframes.push(createCursorBlinkKeyframes());
  }

  const lineCount = Math.max(timeline.length, 1);
  const textBaselineOffset = getTextBaselineOffset(resolved.fontSize, resolved.lineHeight);
  const height = chromeHeight + resolved.padding * 2 + lineCount * resolved.lineHeight;

  const text = timeline
    .map((line, index) => {
      const y = chromeHeight + resolved.padding + textBaselineOffset + index * resolved.lineHeight;
      const fill = line.kind === "command" ? resolved.theme.command : resolved.theme.output;
      const promptPrefixLength = line.kind === "command"
        ? getPromptPrefixTextLength(resolved, line.cwd)
        : 0;
      const prefix =
        line.kind === "command"
          ? renderPromptPrefix(
              resolved,
              line.cwd,
              line.startMs,
              animationContext
            )
          : "";
      const contents = renderLineSegments(
        line.segments,
        line.contentStartMs,
        line.typingIntervalMs,
        animationContext,
        {
          fallbackFill: fill,
          fontSize: resolved.fontSize,
          x: resolved.padding,
          y
        }
      );
      const cursor =
        line.kind === "command" && resolved.cursor.enabled
          ? renderCommandCursor(
              line,
              resolved,
              y,
              promptPrefixLength,
              timeline[index + 1]?.startMs,
              animationContext
            )
          : "";

      return [
        `<text x="${resolved.padding}" y="${formatNumber(y)}" fill="${fill}" xml:space="preserve">`,
        prefix,
        `${contents.inline}`,
        "</text>",
        ...contents.overlays,
        cursor
      ].join("");
    })
    .join("\n");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${resolved.width}" height="${height}" viewBox="0 0 ${resolved.width} ${height}" role="img" aria-label="${escapeXml(resolved.title)}">`,
    "<style>",
    "@keyframes appear { from { opacity: 1; } to { opacity: 1; } }",
    ...animationContext.keyframes,
    "text { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-variant-ligatures: none; white-space: pre; }",
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

function renderCommandCursor(
  line: TimelineLine,
  config: ReturnType<typeof resolveConfig>,
  y: number,
  promptPrefixLength: number,
  nextLineStartMs: number | undefined,
  animationContext: AnimationContext
): string {
  const fallbackEndMs = animationContext.loopDurationMs ?? nonLoopAppearDurationMs;
  const endMs = nextLineStartMs ?? fallbackEndMs;
  const spans = createCursorSpans(line, endMs);

  return spans.map((span) =>
    renderCursorSpan(span, config, y, promptPrefixLength, animationContext)
  ).join("");
}

function renderCursorSpan(
  span: CursorSpan,
  config: ReturnType<typeof resolveConfig>,
  y: number,
  promptPrefixLength: number,
  animationContext: AnimationContext
): string {
  if (span.endMs <= span.startMs) {
    return "";
  }

  const animationName = `aboutty-cursor-${animationContext.nextId++}`;
  const animationDurationMs = animationContext.loopDurationMs ?? nonLoopAppearDurationMs;
  const x = getColumnX(config.padding, config.fontSize, promptPrefixLength + span.column);

  animationContext.keyframes.push(
    createCursorVisibilityKeyframes(animationName, span.startMs, span.endMs, animationDurationMs)
  );

  const fillMode = animationContext.loopDurationMs === undefined ? "forwards" : "infinite";
  const cursor = renderCursorShape(
    config.cursor.style,
    config.theme.cursor,
    x,
    y,
    config.fontSize,
    config.cursor.blinkIntervalMs,
    span.blink
  );

  return `<g opacity="0" style="animation: ${animationName} ${formatNumber(animationDurationMs)}ms ${instantAnimationTiming} 0ms ${fillMode}">${cursor}</g>`;
}

function renderCursorShape(
  style: AbouttyCursorStyle,
  color: string,
  x: number,
  y: number,
  fontSize: number,
  blinkIntervalMs: number,
  blink: boolean
): string {
  const characterWidth = getCharacterWidth(fontSize);
  const top = y - fontSize * textBaselineRatio;
  const height = fontSize;
  const strokeWidth = Math.max(1, fontSize * 0.08);
  const thinWidth = Math.max(1.5, fontSize * 0.12);
  const blinkAnimation = `animation: ${cursorBlinkAnimationName} ${formatNumber(blinkIntervalMs)}ms ${instantAnimationTiming} 0ms infinite`;
  const base = blink
    ? [`opacity="1"`, `style="${blinkAnimation}"`]
    : [`opacity="1"`];

  if (style === "outline") {
    return `<rect ${[
      `x="${formatNumber(x)}"`,
      `y="${formatNumber(top)}"`,
      `width="${formatNumber(characterWidth)}"`,
      `height="${formatNumber(height)}"`,
      `fill="none"`,
      `stroke="${escapeXml(color)}"`,
      `stroke-width="${formatNumber(strokeWidth)}"`,
      ...base
    ].join(" ")} />`;
  }

  if (style === "bar") {
    return `<rect ${[
      `x="${formatNumber(x)}"`,
      `y="${formatNumber(top)}"`,
      `width="${formatNumber(thinWidth)}"`,
      `height="${formatNumber(height)}"`,
      `fill="${escapeXml(color)}"`,
      ...base
    ].join(" ")} />`;
  }

  if (style === "underline") {
    const underlineHeight = thinWidth;

    return `<rect ${[
      `x="${formatNumber(x)}"`,
      `y="${formatNumber(top + height - underlineHeight)}"`,
      `width="${formatNumber(characterWidth)}"`,
      `height="${formatNumber(underlineHeight)}"`,
      `fill="${escapeXml(color)}"`,
      ...base
    ].join(" ")} />`;
  }

  return `<rect ${[
    `x="${formatNumber(x)}"`,
    `y="${formatNumber(top)}"`,
    `width="${formatNumber(characterWidth)}"`,
    `height="${formatNumber(height)}"`,
    `fill="${escapeXml(color)}"`,
    ...base
  ].join(" ")} />`;
}

function createCursorSpans(line: TimelineLine, endMs: number): CursorSpan[] {
  const points: Array<{ blink: boolean; timeMs: number; column: number }> = [];
  let cursorMs = line.contentStartMs;
  let column = 0;

  addCursorPoint(points, line.startMs, column, true);

  for (const segment of line.segments) {
    if (isFramesSegment(segment)) {
      addCursorPoint(points, cursorMs, column, false);
      cursorMs += getSegmentAnimationDurationMs(segment, line.typingIntervalMs);
      column += getSegmentTextLength(segment);
      addCursorPoint(points, cursorMs, column, false);
      continue;
    }

    const value = getSegmentValue(segment);
    const intervalMs = segment.typingIntervalMs ?? line.typingIntervalMs;

    if (getSegmentRepeat(segment) > 1) {
      addCursorPoint(points, cursorMs, column, false);
      cursorMs += getSegmentAnimationDurationMs(segment, line.typingIntervalMs);
      column += Array.from(value).length;
      addCursorPoint(points, cursorMs, column, false);
      continue;
    }

    for (const _character of Array.from(value)) {
      column += 1;
      addCursorPoint(points, cursorMs, column, false);
      cursorMs += intervalMs;
    }
  }

  addCursorPoint(points, cursorMs, column, true);
  addCursorPoint(points, Math.max(endMs, cursorMs), column, true);

  return points.flatMap((point, index) => {
    const next = points[index + 1];

    if (!next || next.timeMs <= point.timeMs) {
      return [];
    }

    return [{
      blink: point.blink,
      column: point.column,
      startMs: point.timeMs,
      endMs: next.timeMs
    }];
  });
}

function addCursorPoint(
  points: Array<{ blink: boolean; timeMs: number; column: number }>,
  timeMs: number,
  column: number,
  blink: boolean
): void {
  const last = points.at(-1);

  if (last && last.timeMs === timeMs) {
    last.column = column;
    last.blink = blink;
    return;
  }

  points.push({ blink, timeMs, column });
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
    .map((part) =>
      `<tspan ${[
        `fill="${part.color}"`,
        ...createTextAdvanceAttributes(part.value, config.fontSize),
        animation.trim()
      ].join(" ")}>${escapeXml(part.value)}</tspan>`
    )
    .join("");
}

function renderLineSegments(
  segments: AbouttyTextSegment[],
  startMs: number,
  typingIntervalMs: number,
  animationContext: AnimationContext,
  options: { fallbackFill: string; fontSize: number; x: number; y: number }
): RenderedLineSegments {
  let cursorMs = startMs;
  let column = 0;
  let usesAbsolutePositioning = false;
  const inline: string[] = [];
  const overlays: string[] = [];

  for (const segment of segments) {
    if (isFramesSegment(segment)) {
      const renderedFrame = renderFrameSegment(segment, cursorMs, animationContext, {
        ...options,
        x: getColumnX(options.x, options.fontSize, column)
      });

      inline.push(renderedFrame.inline);
      overlays.push(...renderedFrame.overlays);
      cursorMs += getSegmentAnimationDurationMs(segment, typingIntervalMs);
      column += getSegmentTextLength(segment);
      usesAbsolutePositioning = true;
      continue;
    }

    const attributes = createSegmentAttributes(segment);
    const intervalMs = segment.typingIntervalMs ?? typingIntervalMs;
    const repeat = getSegmentRepeat(segment);
    const value = getSegmentValue(segment);

    if (repeat > 1) {
      inline.push(renderRepeatingTypewriterSegment(
        segment,
        value,
        cursorMs,
        intervalMs,
        animationContext,
        usesAbsolutePositioning
          ? { fontSize: options.fontSize, startColumn: column, x: options.x }
          : undefined
      ));
      cursorMs += getSegmentAnimationDurationMs(segment, typingIntervalMs);
      column += Array.from(value).length;
      continue;
    }

    for (const character of Array.from(value)) {
      inline.push(
        `<tspan ${[
          ...attributes,
          ...createAbsolutePositionAttributes(usesAbsolutePositioning, options.x, options.fontSize, column),
          `opacity="0"`,
          ...createTextAdvanceAttributes(character, options.fontSize),
          `style="${createAppearAnimation(cursorMs, animationContext)}"`
        ].join(" ")}>${escapeXml(character)}</tspan>`
      );
      cursorMs += intervalMs;
      column += 1;
    }
  }

  return { inline: inline.join(""), overlays };
}

function renderRepeatingTypewriterSegment(
  segment: AbouttyValueTextSegment,
  value: string,
  startMs: number,
  intervalMs: number,
  animationContext: AnimationContext,
  position: { fontSize: number; startColumn: number; x: number } | undefined
): string {
  const attributes = createSegmentAttributes(segment);
  const totalDurationMs = getSegmentAnimationDurationMs(segment, intervalMs);

  if (totalDurationMs <= 0) {
    return Array.from(value)
      .map((character, characterIndex) =>
        `<tspan ${[
          ...attributes,
          ...createAbsolutePositionAttributes(
            position !== undefined,
            position?.x ?? 0,
            position?.fontSize ?? 0,
            (position?.startColumn ?? 0) + characterIndex
          ),
          `opacity="0"`,
          ...createTextAdvanceAttributes(character, position?.fontSize ?? 0),
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
        ...createAbsolutePositionAttributes(
          position !== undefined,
          position?.x ?? 0,
          position?.fontSize ?? 0,
          (position?.startColumn ?? 0) + characterIndex
        ),
        `opacity="0"`,
        ...createTextAdvanceAttributes(character, position?.fontSize ?? 0),
        `style="animation: ${animationName} ${formatNumber(animationDurationMs)}ms ${instantAnimationTiming} ${animationContext.loopDurationMs === undefined ? `${formatNumber(startMs)}ms forwards` : "0ms infinite"}"`
      ].join(" ")}>${escapeXml(character)}</tspan>`;
    })
    .join("");
}

function renderFrameSegment(
  segment: AbouttyFramesTextSegment,
  startMs: number,
  animationContext: AnimationContext,
  options: { fallbackFill: string; fontSize: number; x: number; y: number }
): RenderedLineSegments {
  const frames = getSegmentFrames(segment);
  const intervalMs = getSegmentFrameIntervalMs(segment);
  const totalDurationMs = getSegmentAnimationDurationMs(segment, intervalMs);
  const inline = "";

  if (totalDurationMs <= 0) {
    const finalFrame = frames.at(-1) ?? "";
    const attributes = createFrameTextAttributes(segment, finalFrame, options.fallbackFill);

    return {
      inline,
      overlays: [`<text ${[
        `x="${formatNumber(options.x)}"`,
        `y="${formatNumber(options.y)}"`,
        ...attributes,
        `xml:space="preserve"`,
        ...createTextAdvanceAttributes(getFrameValue(finalFrame), options.fontSize),
        `opacity="0"`,
        `style="${createAppearAnimation(startMs, animationContext)}"`
      ].join(" ")}>${escapeXml(getFrameValue(finalFrame))}</text>`]
    };
  }

  const animationDurationMs = animationContext.loopDurationMs ?? totalDurationMs;

  return {
    inline,
    overlays: frames.map((frame, frameIndex) => {
      const animationName = `aboutty-frame-${animationContext.nextId++}`;
      const attributes = createFrameTextAttributes(segment, frame, options.fallbackFill);

      animationContext.keyframes.push(
        createFrameKeyframes(animationName, frameIndex, segment, intervalMs, {
          keyframeDurationMs: animationDurationMs,
          offsetMs: animationContext.loopDurationMs === undefined ? 0 : startMs
        })
      );

      return `<text ${[
        `x="${formatNumber(options.x)}"`,
        `y="${formatNumber(options.y)}"`,
        ...attributes,
        `xml:space="preserve"`,
        ...createTextAdvanceAttributes(getFrameValue(frame), options.fontSize),
        `opacity="0"`,
        `style="animation: ${animationName} ${formatNumber(animationDurationMs)}ms ${instantAnimationTiming} ${animationContext.loopDurationMs === undefined ? `${formatNumber(startMs)}ms forwards` : "0ms infinite"}"`
      ].join(" ")}>${escapeXml(getFrameValue(frame))}</text>`;
    })
  };
}

function createRepeatKeyframes(
  name: string,
  characterIndex: number,
  value: string,
  intervalMs: number,
  segment: AbouttyValueTextSegment,
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

function createFrameKeyframes(
  name: string,
  frameIndex: number,
  segment: AbouttyFramesTextSegment,
  intervalMs: number,
  options: { keyframeDurationMs?: number; offsetMs?: number } = {}
): string {
  const frameCount = segment.frames.length;
  const passDurationMs = frameCount * intervalMs;
  const repeatDelayMs = getSegmentRepeatDelayMs(segment);
  const cycleDurationMs = passDurationMs + repeatDelayMs;
  const segmentDurationMs = getSegmentAnimationDurationMs(segment, intervalMs);
  const keyframeDurationMs = options.keyframeDurationMs ?? segmentDurationMs;
  const offsetMs = options.offsetMs ?? 0;
  const repeat = getSegmentRepeat(segment);
  const instantMs = Math.max(keyframeDurationMs / 100000, 0.001);
  const isLastFrame = frameIndex === frameCount - 1;
  const points = new Map<number, 0 | 1>();

  setOpacityPoint(points, 0, 0, keyframeDurationMs);

  for (let cycle = 0; cycle < repeat; cycle += 1) {
    const cycleStartMs = offsetMs + cycle * cycleDurationMs;
    const showMs = cycleStartMs + frameIndex * intervalMs;
    const hideMs = isLastFrame ? cycleStartMs + cycleDurationMs : showMs + intervalMs;
    const isLastCycle = cycle === repeat - 1;

    if (showMs <= 0) {
      setOpacityPoint(points, 0, 1, keyframeDurationMs);
    } else {
      setOpacityPoint(points, showMs, 0, keyframeDurationMs);
      setOpacityPoint(points, showMs + instantMs, 1, keyframeDurationMs);
    }

    if (!isLastCycle || !isLastFrame) {
      setOpacityPoint(points, hideMs, 1, keyframeDurationMs);
      setOpacityPoint(points, hideMs + instantMs, 0, keyframeDurationMs);
    }
  }

  setOpacityPoint(points, offsetMs + segmentDurationMs, isLastFrame ? 1 : 0, keyframeDurationMs);
  setOpacityPoint(points, keyframeDurationMs, isLastFrame ? 1 : 0, keyframeDurationMs);

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
    return `animation: appear ${formatNumber(nonLoopAppearDurationMs)}ms ${instantAnimationTiming} ${formatNumber(startMs)}ms forwards`;
  }

  const cacheKey = formatNumber(startMs);
  const cachedAnimationName = animationContext.appearAnimationsByStartMs.get(cacheKey);

  if (cachedAnimationName) {
    return `animation: ${cachedAnimationName} ${formatNumber(animationContext.loopDurationMs)}ms ${instantAnimationTiming} 0ms infinite`;
  }

  const animationName = `aboutty-loop-${animationContext.nextId++}`;

  animationContext.appearAnimationsByStartMs.set(cacheKey, animationName);

  animationContext.keyframes.push(
    createAppearKeyframes(animationName, startMs, animationContext.loopDurationMs)
  );

  return `animation: ${animationName} ${formatNumber(animationContext.loopDurationMs)}ms ${instantAnimationTiming} 0ms infinite`;
}

function createCursorBlinkKeyframes(): string {
  return `@keyframes ${cursorBlinkAnimationName} { 0% { opacity: 1; } 49.999% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 0; } }`;
}

function createCursorVisibilityKeyframes(
  name: string,
  startMs: number,
  endMs: number,
  totalDurationMs: number
): string {
  const instantMs = Math.min(Math.max(totalDurationMs / 100000, 0.001), 1);
  const points = new Map<number, 0 | 1>();

  setOpacityPoint(points, 0, startMs <= 0 ? 1 : 0, totalDurationMs);

  if (startMs > 0) {
    setOpacityPoint(points, startMs, 0, totalDurationMs);
    setOpacityPoint(points, startMs + instantMs, 1, totalDurationMs);
  }

  if (endMs < totalDurationMs) {
    setOpacityPoint(points, endMs, 1, totalDurationMs);
    setOpacityPoint(points, endMs + instantMs, 0, totalDurationMs);
    setOpacityPoint(points, totalDurationMs, 0, totalDurationMs);
  } else {
    setOpacityPoint(points, totalDurationMs, 1, totalDurationMs);
  }

  const keyframes = [...points.entries()]
    .sort(([left], [right]) => left - right)
    .map(([timeMs, opacity]) => {
      const percent = formatPercent((timeMs / totalDurationMs) * 100);

      return `${percent}% { opacity: ${opacity}; }`;
    })
    .join(" ");

  return `@keyframes ${name} { ${keyframes} }`;
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
    return Math.max(endMs, getLineContentEndMs(line));
  }, 0);

  return Math.max(animationEndMs + defaultLoopPauseMs, 1);
}

function getLineContentEndMs(line: TimelineLine): number {
  return line.segments.reduce(
    (endMs, segment) => endMs + getSegmentAnimationDurationMs(segment, line.typingIntervalMs),
    line.contentStartMs
  );
}

function getTextBaselineOffset(fontSize: number, lineHeight: number): number {
  return (lineHeight - fontSize) / 2 + fontSize * textBaselineRatio;
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

function formatPercent(value: number): string {
  return Number(value.toFixed(6)).toString();
}

function createAbsolutePositionAttributes(
  enabled: boolean,
  x: number,
  fontSize: number,
  column: number
): string[] {
  if (!enabled) {
    return [];
  }

  return [`x="${formatNumber(getColumnX(x, fontSize, column))}"`];
}

function getCharacterWidth(fontSize: number): number {
  return fontSize * monospaceCharacterWidthEm;
}

function getColumnX(x: number, fontSize: number, column: number): number {
  return x + column * getCharacterWidth(fontSize);
}

function createTextAdvanceAttributes(value: string, fontSize: number): string[] {
  const characterCount = Array.from(value).length;

  if (characterCount === 0 || fontSize <= 0) {
    return [];
  }

  return [
    `textLength="${formatNumber(characterCount * getCharacterWidth(fontSize))}"`,
    `lengthAdjust="spacingAndGlyphs"`
  ];
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

function createFrameTextAttributes(
  segment: AbouttyFramesTextSegment,
  frame: string | AbouttyFrame,
  fallbackFill: string
): string[] {
  const frameStyle = typeof frame === "string" ? undefined : frame;
  const attributes = [`fill="${escapeXml(frameStyle?.color ?? segment.color ?? fallbackFill)}"`];

  if (frameStyle?.bold ?? segment.bold) {
    attributes.push('font-weight="700"');
  }

  if (frameStyle?.italic ?? segment.italic) {
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

function getPromptPrefixTextLength(
  config: ReturnType<typeof resolveConfig>,
  cwd: string | undefined
): number {
  return createPromptPrefixParts(config, cwd).reduce(
    (length, part) => length + Array.from(part.value).length,
    0
  );
}

function isNonEmptyString(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}
