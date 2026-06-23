import type { AbouttyStep, ResolvedAbouttyConfig } from "./config.js";
import { getSegmentAnimationDurationMs, splitTextIntoLines } from "./text.js";

export interface TimelineLine {
  kind: AbouttyStep["type"];
  segments: ReturnType<typeof splitTextIntoLines>[number];
  startMs: number;
  typingIntervalMs: number;
}

const defaultDelayMs = 350;

export function createTimeline(config: ResolvedAbouttyConfig): TimelineLine[] {
  let cursor = 0;
  const lines: TimelineLine[] = [];

  for (const step of config.steps) {
    cursor += step.delayMs ?? defaultDelayMs;

    const typingIntervalMs = step.typingIntervalMs ?? config.stepIntervalMs;
    const stepLines = splitTextIntoLines(step.text);

    for (const [lineIndex, segments] of stepLines.entries()) {
      lines.push({
        kind: step.type,
        segments,
        startMs: cursor,
        typingIntervalMs
      });

      const typingDurationMs = getTypingDurationMs(segments, typingIntervalMs);
      cursor += typingDurationMs;

      if (lineIndex < stepLines.length - 1) {
        cursor += typingIntervalMs;
      }
    }
  }

  return lines;
}

function getTypingDurationMs(
  segments: ReturnType<typeof splitTextIntoLines>[number],
  fallbackIntervalMs: number
): number {
  return segments.reduce(
    (durationMs, segment) => durationMs + getSegmentAnimationDurationMs(segment, fallbackIntervalMs),
    0
  );
}
