export function downloadText(filename: string, type: string, contents: string): void {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

export function workflowTemplate(configPath = "aboutty.json", outputPath = "assets/aboutty.svg"): string {
  return `name: Generate aboutty SVG

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: write

jobs:
  aboutty:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pbandj082/aboutty/packages/action@main
        with:
          config: ${configPath}
          output: ${outputPath}
          commit: "true"
          push: "true"
`;
}

