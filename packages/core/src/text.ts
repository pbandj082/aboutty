import type { AbouttyText, AbouttyTextSegment } from "./config.js";

export const defaultRepeatDelayMs = 300;

export function normalizeText(text: AbouttyText): AbouttyTextSegment[] {
  if (typeof text === "string") {
    return [{ value: text }];
  }

  return text.map((segment) => ({ ...segment }));
}

export function splitTextIntoLines(text: AbouttyText): AbouttyTextSegment[][] {
  const lines: AbouttyTextSegment[][] = [[]];

  for (const segment of normalizeText(text)) {
    const parts = getSegmentValue(segment).split("\n");

    for (const [index, part] of parts.entries()) {
      if (index > 0) {
        lines.push([]);
      }

      if (part.length > 0) {
        lines.at(-1)?.push({
          ...segment,
          value: part
        });
      }
    }
  }

  return lines.length === 0 ? [[]] : lines;
}

export function getTextLength(segments: AbouttyTextSegment[]): number {
  return segments.reduce((length, segment) => length + Array.from(getSegmentValue(segment)).length, 0);
}

export function textToString(text: AbouttyText): string {
  return normalizeText(text)
    .map(getSegmentValue)
    .join("");
}

export function expandSegmentValue(segment: AbouttyTextSegment): string {
  return getSegmentValue(segment);
}

export function getSegmentValue(segment: AbouttyTextSegment): string {
  return segment.value;
}

export function getSegmentRepeat(segment: AbouttyTextSegment): number {
  return segment.repeat ?? 1;
}

export function getSegmentRepeatDelayMs(segment: AbouttyTextSegment): number {
  return segment.repeatDelayMs ?? defaultRepeatDelayMs;
}

export function getSegmentAnimationDurationMs(
  segment: AbouttyTextSegment,
  fallbackIntervalMs: number
): number {
  const intervalMs = segment.typingIntervalMs ?? fallbackIntervalMs;
  const typingDurationMs = Array.from(getSegmentValue(segment)).length * intervalMs;
  const repeat = getSegmentRepeat(segment);

  if (repeat <= 1) {
    return typingDurationMs;
  }

  return (typingDurationMs + getSegmentRepeatDelayMs(segment)) * (repeat - 1) + typingDurationMs;
}
