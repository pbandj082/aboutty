export type {
  AbouttyConfig,
  AbouttyFrame,
  AbouttyFramesTextSegment,
  AbouttyStep,
  AbouttyStepType,
  AbouttyText,
  AbouttyTextSegment,
  AbouttyTextSegmentStyle,
  AbouttyTheme,
  AbouttyValueTextSegment,
  ResolvedAbouttyConfig
} from "./config.js";
export { defaultConfig, defaultTheme, resolveConfig } from "./config.js";
export { renderSvg } from "./render.js";
export type { AbouttyTextLineGroup } from "./text.js";
export {
  defaultFrameIntervalMs,
  defaultFrameRepeatDelayMs,
  defaultRepeatDelayMs,
  expandSegmentValue,
  getFrameValue,
  getSegmentAnimationDurationMs,
  getSegmentFrameIntervalMs,
  getSegmentFrames,
  getSegmentRepeat,
  getSegmentRepeatDelayMs,
  getSegmentValue,
  getSegmentTextLength,
  isFramesSegment,
  isValueSegment,
  normalizeText,
  splitTextIntoLineGroups,
  splitTextIntoLines,
  textToString
} from "./text.js";
export { createTimeline } from "./timeline.js";
export { validateConfig } from "./validate.js";
