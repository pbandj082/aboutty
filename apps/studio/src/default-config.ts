import type { AbouttyConfig } from "@aboutty/core";

export const defaultStudioConfig: AbouttyConfig = {
  "$schema": "https://aboutty.dev/schema/aboutty.schema.json",
  title: "aboutty demo",
  username: "aboutty",
  usernameSeparator: "@",
  hostname: "dev",
  cwdSeparator: ":",
  cwd: "~",
  prompt: "$",
  loop: true,
  stepIntervalMs: 350,
  typingIntervalMs: 35,
  theme: {
    background: "#101418",
    username: "#6ee7b7",
    usernameSeparator: "#8bd5ca",
    hostname: "#93c5fd",
    cwdSeparator: "#7dd3fc",
    cwd: "#a7f3d0",
    prompt: "#5eead4",
    text: "#f8fafc"
  },
  steps: [
    {
      type: "output",
      typingIntervalMs: 0,
      text: [
        {
          color: "#6ee7b7",
          value: "      ___.                  __    __          \n_____ \\_ |__   ____  __ ___/  |__/  |_ ___.__.\n\\__  \\ | __ \\ /  _ \\|  |  \\   __\\   __<   |  |\n / __ \\| \\_\\ (  <_> )  |  /|  |  |  |  \\___  |\n(____  /___  /\\____/|____/ |__|  |__|  / ____|\n     \\/    \\/                          \\/     "
        }
      ]
    },
    {
      type: "command",
      text: [
        { value: "npx" },
        { value: " aboutty", color: "#6ee7b7" },
        { value: " ./aboutty.json --out ./assets/aboutty.svg" }
      ]
    },
    {
      type: "output",
      text: [
        { value: "Rendering " },
        { frames: ["|", "/", "-", "\\"], frameIntervalMs: 120, color: "#6ee7b7" }
      ]
    },
    { type: "output", typingIntervalMs: 0, text: "Generated ./assets/aboutty.svg" }
  ]
};
