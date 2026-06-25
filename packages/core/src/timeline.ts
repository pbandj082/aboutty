import type { AbouttyStep, ResolvedAbouttyConfig } from "./config.js";
import { getSegmentAnimationDurationMs, splitTextIntoLineGroups } from "./text.js";

export interface TimelineLine {
  kind: AbouttyStep["type"];
  cwd: string | undefined;
  segments: ReturnType<typeof splitTextIntoLineGroups>[number]["lines"][number];
  startMs: number;
  contentStartMs: number;
  typingIntervalMs: number;
}

export function createTimeline(config: ResolvedAbouttyConfig): TimelineLine[] {
  let cursor = 0;
  const lines: TimelineLine[] = [];

  for (const step of config.steps) {
    const delayMs = step.delayMs ?? config.stepIntervalMs;
    const lineStartMs = step.type === "command" ? cursor : cursor + delayMs;
    const contentStartMs = step.type === "command" ? lineStartMs + delayMs : lineStartMs;

    cursor = contentStartMs;

    const typingIntervalMs = step.typingIntervalMs ?? config.typingIntervalMs;
    const lineGroups = splitTextIntoLineGroups(step.text);

    for (const [groupIndex, group] of lineGroups.entries()) {
      for (const segments of group.lines) {
        lines.push({
          kind: step.type,
          cwd: step.type === "command" ? step.cwd ?? config.cwd : undefined,
          segments,
          startMs: groupIndex === 0 ? lineStartMs : cursor,
          contentStartMs: cursor,
          typingIntervalMs
        });
      }

      const typingDurationMs = group.lines.reduce(
        (durationMs, segments) => Math.max(durationMs, getTypingDurationMs(segments, typingIntervalMs)),
        0
      );
      cursor += typingDurationMs;

      if (groupIndex < lineGroups.length - 1) {
        cursor += typingIntervalMs;
      }
    }
  }

  return lines;
}

function getTypingDurationMs(
  segments: ReturnType<typeof splitTextIntoLineGroups>[number]["lines"][number],
  fallbackIntervalMs: number
): number {
  return segments.reduce(
    (durationMs, segment) => durationMs + getSegmentAnimationDurationMs(segment, fallbackIntervalMs),
    0
  );
}
