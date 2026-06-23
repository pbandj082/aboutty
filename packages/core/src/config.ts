export type AbouttyStepType = "command" | "output";

export interface AbouttyTextSegment {
  value: string;
  repeat?: number;
  repeatDelayMs?: number;
  typingIntervalMs?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
}

export type AbouttyText = string | AbouttyTextSegment[];

export interface AbouttyStep {
  type: AbouttyStepType;
  text: AbouttyText;
  delayMs?: number;
  typingIntervalMs?: number;
}

export interface AbouttyTheme {
  background: string;
  border: string;
  title: string;
  username: string;
  hostname: string;
  separator: string;
  prompt: string;
  text: string;
  command: string;
  output: string;
}

export interface AbouttyConfig {
  "$schema"?: string;
  title?: string;
  width?: number;
  padding?: number;
  fontSize?: number;
  lineHeight?: number;
  username?: string;
  hostname?: string;
  prompt?: string;
  loop?: boolean;
  stepIntervalMs?: number;
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
  hostname?: string;
  prompt: string;
  loop: boolean;
  stepIntervalMs: number;
  theme: AbouttyTheme;
  steps: AbouttyStep[];
}

export const defaultTheme: AbouttyTheme = {
  background: "#101418",
  border: "#2a3138",
  title: "#d7dee6",
  username: "#6ee7b7",
  hostname: "#93c5fd",
  separator: "#6ee7b7",
  prompt: "#6ee7b7",
  text: "#f8fafc",
  command: "#f8fafc",
  output: "#b8c1cc"
};

export const defaultConfig: ResolvedAbouttyConfig = {
  title: "aboutty",
  width: 800,
  padding: 24,
  fontSize: 14,
  lineHeight: 22,
  prompt: "$",
  loop: false,
  stepIntervalMs: 35,
  theme: defaultTheme,
  steps: []
};

export function resolveConfig(config: AbouttyConfig): ResolvedAbouttyConfig {
  return {
    ...defaultConfig,
    ...config,
    theme: resolveTheme(config.theme),
    stepIntervalMs: config.stepIntervalMs ?? defaultConfig.stepIntervalMs,
    steps: config.steps
  };
}

function resolveTheme(theme: Partial<AbouttyTheme> | undefined): AbouttyTheme {
  return {
    background: theme?.background ?? defaultTheme.background,
    border: theme?.border ?? defaultTheme.border,
    title: theme?.title ?? defaultTheme.title,
    username: theme?.username ?? defaultTheme.username,
    hostname: theme?.hostname ?? defaultTheme.hostname,
    separator: theme?.separator ?? defaultTheme.separator,
    prompt: theme?.prompt ?? defaultTheme.prompt,
    text: theme?.text ?? defaultTheme.text,
    command: theme?.command ?? theme?.text ?? defaultTheme.command,
    output: theme?.output ?? theme?.text ?? defaultTheme.output
  };
}
