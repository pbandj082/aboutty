export type AbouttyStepType = "command" | "output";

export interface AbouttyTextSegmentStyle {
  color?: string;
  bold?: boolean;
  italic?: boolean;
}

export interface AbouttyValueTextSegment extends AbouttyTextSegmentStyle {
  value: string;
  repeat?: number;
  repeatDelayMs?: number;
  typingIntervalMs?: number;
}

export interface AbouttyFramesTextSegment extends AbouttyTextSegmentStyle {
  frames: string[];
  frameIntervalMs?: number;
  repeat?: number;
  repeatDelayMs?: number;
}

export type AbouttyTextSegment = AbouttyValueTextSegment | AbouttyFramesTextSegment;

export type AbouttyText = string | AbouttyTextSegment[];

export interface AbouttyStep {
  type: AbouttyStepType;
  text: AbouttyText;
  cwd?: string;
  delayMs?: number;
  typingIntervalMs?: number;
}

export interface AbouttyTheme {
  background: string;
  border: string;
  title: string;
  username: string;
  usernameSeparator: string;
  hostname: string;
  cwdSeparator: string;
  cwd: string;
  prompt: string;
  text: string;
  command: string;
  output: string;
  separator?: string;
}

export interface AbouttyConfig {
  "$schema"?: string;
  title?: string;
  width?: number;
  padding?: number;
  fontSize?: number;
  lineHeight?: number;
  username?: string;
  usernameSeparator?: string;
  hostname?: string;
  cwdSeparator?: string;
  cwd?: string;
  prompt?: string;
  loop?: boolean;
  stepIntervalMs?: number;
  typingIntervalMs?: number;
  theme?: Partial<AbouttyTheme>;
  steps: AbouttyStep[];
}

export interface ResolvedAbouttyConfig {
  title: string;
  width: number;
  padding: number;
  fontSize: number;
  lineHeight: number;
  username?: string;
  usernameSeparator: string;
  hostname?: string;
  cwdSeparator: string;
  cwd: string;
  prompt: string;
  loop: boolean;
  stepIntervalMs: number;
  typingIntervalMs: number;
  theme: AbouttyTheme;
  steps: AbouttyStep[];
}

export const defaultTheme: AbouttyTheme = {
  background: "#101418",
  border: "#2a3138",
  title: "#d7dee6",
  username: "#6ee7b7",
  usernameSeparator: "#8bd5ca",
  hostname: "#93c5fd",
  cwdSeparator: "#7dd3fc",
  cwd: "#a7f3d0",
  prompt: "#5eead4",
  text: "#f8fafc",
  command: "#f8fafc",
  output: "#b8c1cc",
  separator: "#8bd5ca"
};

export const defaultConfig: ResolvedAbouttyConfig = {
  title: "aboutty",
  width: 800,
  padding: 24,
  fontSize: 14,
  lineHeight: 22,
  usernameSeparator: "@",
  cwdSeparator: ":",
  cwd: "~",
  prompt: "$",
  loop: false,
  stepIntervalMs: 350,
  typingIntervalMs: 35,
  theme: defaultTheme,
  steps: []
};

export function resolveConfig(config: AbouttyConfig): ResolvedAbouttyConfig {
  return {
    ...defaultConfig,
    ...config,
    theme: resolveTheme(config.theme),
    stepIntervalMs: config.stepIntervalMs ?? defaultConfig.stepIntervalMs,
    typingIntervalMs: config.typingIntervalMs ?? defaultConfig.typingIntervalMs,
    steps: config.steps
  };
}

function resolveTheme(theme: Partial<AbouttyTheme> | undefined): AbouttyTheme {
  return {
    background: theme?.background ?? defaultTheme.background,
    border: theme?.border ?? defaultTheme.border,
    title: theme?.title ?? defaultTheme.title,
    username: theme?.username ?? defaultTheme.username,
    usernameSeparator: theme?.usernameSeparator ?? theme?.separator ?? defaultTheme.usernameSeparator,
    hostname: theme?.hostname ?? defaultTheme.hostname,
    cwdSeparator: theme?.cwdSeparator ?? theme?.separator ?? theme?.prompt ?? defaultTheme.cwdSeparator,
    cwd: theme?.cwd ?? theme?.prompt ?? defaultTheme.cwd,
    prompt: theme?.prompt ?? defaultTheme.prompt,
    text: theme?.text ?? defaultTheme.text,
    command: theme?.command ?? theme?.text ?? defaultTheme.command,
    output: theme?.output ?? theme?.text ?? defaultTheme.output,
    separator: theme?.usernameSeparator ?? theme?.separator ?? defaultTheme.usernameSeparator
  };
}
