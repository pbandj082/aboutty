import type { AbouttyConfig, AbouttyStep } from "@aboutty/core";

export function updateIndexAfterRemoval(
  currentIndex: number | undefined,
  removedIndex: number
): number | undefined {
  if (currentIndex === undefined) {
    return undefined;
  }

  if (currentIndex === removedIndex) {
    return undefined;
  }

  if (currentIndex > removedIndex) {
    return currentIndex - 1;
  }

  return currentIndex;
}

export function moveStep(
  config: AbouttyConfig,
  fromIndex: number,
  insertionIndex: number
): { fromIndex: number; toIndex: number } | undefined {
  if (
    !Number.isInteger(fromIndex) ||
    fromIndex < 0 ||
    fromIndex >= config.steps.length
  ) {
    return undefined;
  }

  const boundedInsertionIndex = Math.max(0, Math.min(config.steps.length, insertionIndex));
  const toIndex = fromIndex < boundedInsertionIndex ? boundedInsertionIndex - 1 : boundedInsertionIndex;

  if (toIndex === fromIndex) {
    return undefined;
  }

  const steps = [...config.steps];
  const [movedStep] = steps.splice(fromIndex, 1) as [AbouttyStep | undefined];

  if (!movedStep) {
    return undefined;
  }

  steps.splice(toIndex, 0, movedStep);
  config.steps = steps;

  return { fromIndex, toIndex };
}

export function updateIndexAfterMove(
  currentIndex: number | undefined,
  fromIndex: number,
  toIndex: number
): number | undefined {
  if (currentIndex === undefined || fromIndex === toIndex) {
    return currentIndex;
  }

  if (currentIndex === fromIndex) {
    return toIndex;
  }

  if (fromIndex < toIndex && currentIndex > fromIndex && currentIndex <= toIndex) {
    return currentIndex - 1;
  }

  if (fromIndex > toIndex && currentIndex >= toIndex && currentIndex < fromIndex) {
    return currentIndex + 1;
  }

  return currentIndex;
}

export function clampStepIndex(
  currentIndex: number | undefined,
  config: AbouttyConfig
): number | undefined {
  if (currentIndex === undefined) {
    return undefined;
  }

  if (currentIndex < 0 || currentIndex >= config.steps.length) {
    return undefined;
  }

  return currentIndex;
}
