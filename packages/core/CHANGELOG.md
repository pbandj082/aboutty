# @aboutty/core

## 0.4.2

### Patch Changes

- 59b2eaa: Fix iOS SVG text rendering by positioning command text on fixed columns without using textLength or lengthAdjust, while preserving cursor alignment across browsers.

## 0.4.1

### Patch Changes

- e989d27: Fix command cursor spacing so generated SVGs keep text and cursor alignment consistent across browsers.

  Refine the Studio configuration file tabs so hover states use a subtle state layer and the active tab appears connected to the code editor.

## 0.4.0

### Minor Changes

- 8b66f43: Add configurable command cursors with block, outline, bar, and underline styles. Cursors blink while idle and stay solid while command text is being typed.

## 0.3.1

### Patch Changes

- 67e8f44: Render command prompt prefixes immediately while applying command delays only to typed command text.

## 0.3.0

### Minor Changes

- 8e445ea: Add richer frame animation support for terminal output, including per-frame color and text emphasis styling.

  Refresh the built-in templates with more realistic terminal timelines, richer progress output, tables, and command examples.

  Fix SVG text baseline alignment so command output and frame animations render consistently without dropped or shifted characters.

## 0.2.0

### Minor Changes

- 1b23dbf: Add configurable prompt working directories, typing defaults, Studio templates, and responsive mobile controls.

  Package the README aboutty updater as a workspace script package.

## 0.1.0

### Minor Changes

- c47be0c: Prepare the initial aboutty release with the core renderer, CLI, GitHub Action, and Studio app.
