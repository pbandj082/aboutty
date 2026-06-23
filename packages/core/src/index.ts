export type {
  AbouttyConfig,
  AbouttyStep,
  AbouttyStepType,
  AbouttyText,
  AbouttyTextSegment,
  AbouttyTheme,
  ResolvedAbouttyConfig
} from "./config.js";
export { defaultConfig, defaultTheme, resolveConfig } from "./config.js";
export { renderSvg } from "./render.js";
export {
  defaultRepeatDelayMs,
  expandSegmentValue,
  getSegmentAnimationDurationMs,
  getSegmentRepeat,
  getSegmentRepeatDelayMs,
  getSegmentValue,
  normalizeText,
  splitTextIntoLines,
  textToString
} from "./text.js";
export { createTimeline } from "./timeline.js";
export { validateConfig } from "./validate.js";
