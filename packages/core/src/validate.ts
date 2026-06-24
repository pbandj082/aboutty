import type { AbouttyConfig } from "./config.js";

export function validateConfig(config: AbouttyConfig): string[] {
  const errors: string[] = [];

  if (!Array.isArray(config.steps)) {
    errors.push("steps must be an array");
    return errors;
  }

  for (const [index, step] of config.steps.entries()) {
    if (step.type !== "command" && step.type !== "output") {
      errors.push(`steps[${index}].type must be "command" or "output"`);
    }

    errors.push(...validateText(step.text, `steps[${index}].text`));

    if (step.delayMs !== undefined && (!Number.isFinite(step.delayMs) || step.delayMs < 0)) {
      errors.push(`steps[${index}].delayMs must be a non-negative number`);
    }

    if (
      step.typingIntervalMs !== undefined &&
      (!Number.isFinite(step.typingIntervalMs) || step.typingIntervalMs < 0)
    ) {
      errors.push(`steps[${index}].typingIntervalMs must be a non-negative number`);
    }

    if (step.cwd !== undefined && typeof step.cwd !== "string") {
      errors.push(`steps[${index}].cwd must be a string`);
    }

    if (step.type === "output" && step.cwd !== undefined) {
      errors.push(`steps[${index}].cwd is only supported for command steps`);
    }
  }

  for (const key of ["width", "padding", "fontSize", "lineHeight"] as const) {
    const value = config[key];

    if (value !== undefined && (!Number.isFinite(value) || value <= 0)) {
      errors.push(`${key} must be a positive number`);
    }
  }

  for (const key of ["stepIntervalMs", "typingIntervalMs"] as const) {
    const value = config[key];

    if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
      errors.push(`${key} must be a non-negative number`);
    }
  }

  for (const key of [
    "$schema",
    "title",
    "username",
    "usernameSeparator",
    "hostname",
    "cwdSeparator",
    "cwd",
    "prompt"
  ] as const) {
    const value = config[key];

    if (value !== undefined && typeof value !== "string") {
      errors.push(`${key} must be a string`);
    }
  }

  if (config.loop !== undefined && typeof config.loop !== "boolean") {
    errors.push("loop must be a boolean");
  }

  if (config.theme !== undefined) {
    errors.push(...validateTheme(config.theme));
  }

  return errors;
}

function validateTheme(theme: unknown): string[] {
  const errors: string[] = [];

  if (!theme || typeof theme !== "object" || Array.isArray(theme)) {
    errors.push("theme must be an object");
    return errors;
  }

  const candidate = theme as Record<string, unknown>;

  for (const key of [
    "background",
    "border",
    "title",
    "username",
    "usernameSeparator",
    "hostname",
    "cwdSeparator",
    "cwd",
    "prompt",
    "text",
    "command",
    "output",
    "separator"
  ] as const) {
    if (candidate[key] !== undefined && typeof candidate[key] !== "string") {
      errors.push(`theme.${key} must be a string`);
    }
  }

  return errors;
}

function validateText(text: unknown, path: string): string[] {
  const errors: string[] = [];

  if (typeof text === "string") {
    if (text.length === 0) {
      errors.push(`${path} must be a non-empty string or segment array`);
    }

    return errors;
  }

  if (!Array.isArray(text)) {
    errors.push(`${path} must be a non-empty string or segment array`);
    return errors;
  }

  if (text.length === 0) {
    errors.push(`${path} must include at least one segment`);
    return errors;
  }

  for (const [index, segment] of text.entries()) {
    if (!segment || typeof segment !== "object" || Array.isArray(segment)) {
      errors.push(`${path}[${index}] must be an object`);
      continue;
    }

    const candidate = segment as Record<string, unknown>;

    if (typeof candidate.value !== "string" || candidate.value.length === 0) {
      errors.push(`${path}[${index}].value must be a non-empty string`);
    }

    if (candidate.color !== undefined && typeof candidate.color !== "string") {
      errors.push(`${path}[${index}].color must be a string`);
    }

    if (candidate.repeat !== undefined) {
      if (
        typeof candidate.repeat !== "number" ||
        !Number.isInteger(candidate.repeat) ||
        candidate.repeat <= 0
      ) {
        errors.push(`${path}[${index}].repeat must be a positive integer`);
      }
    }

    if (candidate.repeatDelayMs !== undefined) {
      if (
        typeof candidate.repeatDelayMs !== "number" ||
        !Number.isFinite(candidate.repeatDelayMs) ||
        candidate.repeatDelayMs < 0
      ) {
        errors.push(`${path}[${index}].repeatDelayMs must be a non-negative number`);
      }
    }

    if (candidate.typingIntervalMs !== undefined) {
      if (
        typeof candidate.typingIntervalMs !== "number" ||
        !Number.isFinite(candidate.typingIntervalMs) ||
        candidate.typingIntervalMs < 0
      ) {
        errors.push(`${path}[${index}].typingIntervalMs must be a non-negative number`);
      }
    }

    if (candidate.bold !== undefined && typeof candidate.bold !== "boolean") {
      errors.push(`${path}[${index}].bold must be a boolean`);
    }

    if (candidate.italic !== undefined && typeof candidate.italic !== "boolean") {
      errors.push(`${path}[${index}].italic must be a boolean`);
    }
  }

  return errors;
}
