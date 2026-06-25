import { isFramesSegment, type AbouttyConfig, type AbouttyText } from "@aboutty/core";

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

  return cloned;
}

function cloneText(text: AbouttyText): AbouttyText {
  if (typeof text === "string") {
    return text;
  }

  return text.map((segment) =>
    isFramesSegment(segment) ? { ...segment, frames: [...segment.frames] } : { ...segment }
  );
}
