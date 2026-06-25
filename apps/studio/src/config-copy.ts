import {
  isFramesSegment,
  type AbouttyConfig,
  type AbouttyFrame,
  type AbouttyText
} from "@aboutty/core";

export function cloneConfig(config: AbouttyConfig): AbouttyConfig {
  const cloned: AbouttyConfig = {
    ...config,
    steps: config.steps.map((step) => ({
      ...step,
      text: cloneText(step.text)
    }))
  };

  if (config.theme) {
    cloned.theme = { ...config.theme };
  }

  if (config.cursor) {
    cloned.cursor = { ...config.cursor };
  }

  return cloned;
}

function cloneText(text: AbouttyText): AbouttyText {
  if (typeof text === "string") {
    return text;
  }

  return text.map((segment) =>
    isFramesSegment(segment)
      ? { ...segment, frames: segment.frames.map(cloneFrame) }
      : { ...segment }
  );
}

function cloneFrame(frame: string | AbouttyFrame): string | AbouttyFrame {
  return typeof frame === "string" ? frame : { ...frame };
}
