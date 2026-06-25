import type {
  AbouttyFrame,
  AbouttyFramesTextSegment,
  AbouttyText,
  AbouttyTextSegment,
  AbouttyValueTextSegment
} from "./config.js";

export const defaultFrameIntervalMs = 120;
export const defaultFrameRepeatDelayMs = 0;
export const defaultRepeatDelayMs = 300;

export interface AbouttyTextLineGroup {
  lines: AbouttyTextSegment[][];
}

export function normalizeText(text: AbouttyText): AbouttyTextSegment[] {
  if (typeof text === "string") {
    return [{ value: text }];
  }

  return text.map((segment) =>
    isFramesSegment(segment)
      ? { ...segment, frames: segment.frames.map(cloneFrame) }
      : { ...segment }
  );
}

export function splitTextIntoLines(text: AbouttyText): AbouttyTextSegment[][] {
  return splitTextIntoLineGroups(text).flatMap((group) => group.lines);
}

export function splitTextIntoLineGroups(text: AbouttyText): AbouttyTextLineGroup[] {
  let currentLines: AbouttyTextSegment[][] = [[]];
  const groups: AbouttyTextLineGroup[] = [{ lines: currentLines }];

  for (const segment of normalizeText(text)) {
    if (isFramesSegment(segment)) {
      appendFramesSegment(currentLines, segment);
      continue;
    }

    const parts = segment.value.split("\n");

    for (const [index, part] of parts.entries()) {
      if (index > 0) {
        currentLines = [[]];

        groups.push({ lines: currentLines });
      }

      if (part.length > 0) {
        currentLines[0]?.push({
          ...segment,
          value: part
        });
      }
    }
  }

  return groups;
}

export function getTextLength(segments: AbouttyTextSegment[]): number {
  return segments.reduce((length, segment) => length + getSegmentTextLength(segment), 0);
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
  if (isFramesSegment(segment)) {
    return getFrameValue(segment.frames.at(-1) ?? "");
  }

  return segment.value;
}

export function getSegmentFrames(segment: AbouttyFramesTextSegment): Array<string | AbouttyFrame> {
  return segment.frames;
}

export function getFrameValue(frame: string | AbouttyFrame): string {
  return typeof frame === "string" ? frame : frame.value;
}

export function getSegmentFrameIntervalMs(segment: AbouttyFramesTextSegment): number {
  return segment.frameIntervalMs ?? defaultFrameIntervalMs;
}

export function getSegmentRepeat(segment: AbouttyTextSegment): number {
  return segment.repeat ?? 1;
}

export function getSegmentRepeatDelayMs(segment: AbouttyTextSegment): number {
  if (isFramesSegment(segment)) {
    return segment.repeatDelayMs ?? defaultFrameRepeatDelayMs;
  }

  return segment.repeatDelayMs ?? defaultRepeatDelayMs;
}

export function getSegmentAnimationDurationMs(
  segment: AbouttyTextSegment,
  fallbackIntervalMs: number
): number {
  const baseDurationMs = isFramesSegment(segment)
    ? segment.frames.length * getSegmentFrameIntervalMs(segment)
    : Array.from(segment.value).length * (segment.typingIntervalMs ?? fallbackIntervalMs);
  const repeat = getSegmentRepeat(segment);

  if (repeat <= 1) {
    return baseDurationMs;
  }

  return (baseDurationMs + getSegmentRepeatDelayMs(segment)) * (repeat - 1) + baseDurationMs;
}

export function getSegmentTextLength(segment: AbouttyTextSegment): number {
  if (isFramesSegment(segment)) {
    return segment.frames.reduce(
      (length, frame) => Math.max(length, getFrameTextLength(frame)),
      0
    );
  }

  return Array.from(segment.value).length;
}

export function isFramesSegment(segment: AbouttyTextSegment): segment is AbouttyFramesTextSegment {
  return Array.isArray((segment as Partial<AbouttyFramesTextSegment>).frames);
}

export function isValueSegment(segment: AbouttyTextSegment): segment is AbouttyValueTextSegment {
  return !isFramesSegment(segment);
}

function appendFramesSegment(lines: AbouttyTextSegment[][], segment: AbouttyFramesTextSegment): void {
  const frameRows = segment.frames.map(splitFrameLines);
  const rowCount = frameRows.reduce((count, rows) => Math.max(count, rows.length), 1);

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    lines[rowIndex] ??= [];
    lines[rowIndex]?.push({
      ...segment,
      frames: frameRows.map((rows) => rows[rowIndex] ?? "")
    });
  }
}

function splitFrameLines(frame: string | AbouttyFrame): Array<string | AbouttyFrame> {
  const lines = getFrameValue(frame).split(/\r?\n/);

  if (typeof frame === "string") {
    return lines;
  }

  return lines.map((value) => ({ ...frame, value }));
}

function getFrameTextLength(frame: string | AbouttyFrame): number {
  return splitFrameLines(frame).reduce(
    (length, line) => Math.max(length, Array.from(getFrameValue(line)).length),
    0
  );
}

function cloneFrame(frame: string | AbouttyFrame): string | AbouttyFrame {
  return typeof frame === "string" ? frame : { ...frame };
}
