import {
  defaultTheme,
  normalizeText,
  textToString,
  type AbouttyConfig,
  type AbouttyStepType,
  type AbouttyText,
  type AbouttyTextSegment
} from "@aboutty/core";
import { syncColorField, isColorInputValue } from "./color-fields";
import { cloneConfig } from "./config-copy";
import { escapeHtml } from "./html";
import { icon, iconButton } from "./icons";
import {
  clampStepIndex,
  moveStep,
  updateIndexAfterMove,
  updateIndexAfterRemoval
} from "./step-order";

export interface ConfigControls {
  update(config: AbouttyConfig): void;
}

type TextField = "title" | "username" | "hostname" | "prompt";
type NumberField =
  | "width"
  | "padding"
  | "fontSize"
  | "lineHeight"
  | "stepIntervalMs";
type ThemeField = "background" | "username" | "hostname" | "separator" | "text";
type StepField = "type" | "text" | "delayMs" | "typingIntervalMs";
type SegmentField =
  | "value"
  | "color"
  | "repeat"
  | "repeatDelayMs"
  | "typingIntervalMs"
  | "bold"
  | "italic";

const textFields: TextField[] = ["title", "username", "hostname", "prompt"];
const numberFields: NumberField[] = [
  "width",
  "padding",
  "fontSize",
  "lineHeight",
  "stepIntervalMs"
];
const themeFields: ThemeField[] = ["background", "username", "hostname", "separator", "text"];

export function createConfigControls(
  target: HTMLElement,
  initialConfig: AbouttyConfig,
  onChange: (config: AbouttyConfig) => void
): ConfigControls {
  let config = cloneConfig(initialConfig);
  let editingStepIndex: number | undefined;
  let draggedStepIndex: number | undefined;

  target.innerHTML = `
    <section class="control-section">
      <h2>Settings</h2>
      <div class="settings-grid">
        ${textInput("title", "Title")}
        ${textInput("username", "Username")}
        ${textInput("hostname", "Hostname")}
        ${textInput("prompt", "Prompt")}
        ${numberInput("width", "Width")}
        ${numberInput("padding", "Padding")}
        ${numberInput("fontSize", "Font size")}
        ${numberInput("lineHeight", "Line height")}
        ${numberInput("stepIntervalMs", "Step interval", 0)}
      </div>
    </section>
    <section class="control-section">
      <h2>Theme</h2>
      <div class="settings-grid">
        ${themeColorInput("background", "Terminal background")}
        ${themeColorInput("username", "Username color")}
        ${themeColorInput("hostname", "Hostname color")}
        ${themeColorInput("separator", "Separator color")}
        ${themeColorInput("text", "Default text color")}
      </div>
    </section>
    <section class="control-section">
      <h2>Steps</h2>
      <div class="steps-list" data-steps></div>
    </section>
  `;

  const stepsRoot = target.querySelector<HTMLElement>("[data-steps]");

  if (!stepsRoot) {
    throw new Error("Failed to mount aboutty controls.");
  }

  target.addEventListener("input", (event) => {
    const element = event.target as HTMLElement;

    if (element instanceof HTMLInputElement && element.dataset.field) {
      config = readSettings(target, config);
      onChange(cloneConfig(config));
      return;
    }

    if (element instanceof HTMLInputElement && element.dataset.themeField) {
      syncColorField(element);
      config = readSettings(target, config);
      onChange(cloneConfig(config));
      return;
    }

    if (isStepControl(element)) {
      updateStepFromElement(element, config);
      onChange(cloneConfig(config));
      return;
    }

    if (isSegmentControl(element)) {
      if (element instanceof HTMLInputElement && element.dataset.segmentField === "color") {
        syncColorField(element);
      }
      updateSegmentFromElement(element, config);
      onChange(cloneConfig(config));
    }
  });

  target.addEventListener("change", (event) => {
    const element = event.target as HTMLElement;

    if (isStepControl(element)) {
      updateStepFromElement(element, config);
      onChange(cloneConfig(config));
      return;
    }

    if (isSegmentControl(element)) {
      if (element instanceof HTMLInputElement && element.dataset.segmentField === "color") {
        syncColorField(element);
      }
      updateSegmentFromElement(element, config);
      onChange(cloneConfig(config));
    }
  });

  target.addEventListener("click", (event) => {
    const targetElement = event.target as HTMLElement;
    const button = targetElement.closest<HTMLButtonElement>("button[data-action]");

    if (!button) {
      const stepCard = targetElement.closest<HTMLElement>("[data-edit-step-index]");

      if (stepCard && !targetElement.closest(".step-card-actions")) {
        editingStepIndex = Number(stepCard.dataset.editStepIndex);
        renderSteps(stepsRoot, config, editingStepIndex);
      }

      return;
    }

    if (button.dataset.action === "done-step") {
      editingStepIndex = undefined;
      renderSteps(stepsRoot, config, editingStepIndex);
      return;
    }

    if (button.dataset.action === "add-step") {
      const nextStepIndex = config.steps.length;

      config.steps = [...config.steps, { type: "output", text: "Done" }];
      editingStepIndex = nextStepIndex;
      renderSteps(stepsRoot, config, editingStepIndex);
      onChange(cloneConfig(config));
    }

    if (button.dataset.action === "remove-step") {
      const index = Number(button.dataset.stepIndex);

      if (Number.isInteger(index) && config.steps.length > 1) {
        config.steps = config.steps.filter((_, stepIndex) => stepIndex !== index);
        editingStepIndex = updateIndexAfterRemoval(editingStepIndex, index);
        renderSteps(stepsRoot, config, editingStepIndex);
        onChange(cloneConfig(config));
      }
    }

    if (button.dataset.action === "add-segment") {
      const index = Number(button.dataset.stepIndex);
      const step = config.steps[index];

      if (step) {
        step.text = [...normalizeText(step.text), { value: "text" }];
        renderSteps(stepsRoot, config, editingStepIndex);
        onChange(cloneConfig(config));
      }
    }

    if (button.dataset.action === "remove-segment") {
      const stepIndex = Number(button.dataset.stepIndex);
      const segmentIndex = Number(button.dataset.segmentIndex);
      const step = config.steps[stepIndex];

      if (step) {
        const segments = normalizeText(step.text);

        if (segments.length > 1) {
          step.text = segments.filter((_, index) => index !== segmentIndex);
          renderSteps(stepsRoot, config, editingStepIndex);
          onChange(cloneConfig(config));
        }
      }
    }
  });

  target.addEventListener("dragstart", (event) => {
    const targetElement = event.target as HTMLElement;
    const stepCard = targetElement.closest<HTMLElement>("[data-drag-step-index]");

    if (!stepCard || targetElement.closest(".step-card-actions")) {
      event.preventDefault();
      return;
    }

    draggedStepIndex = Number(stepCard.dataset.dragStepIndex);

    if (!Number.isInteger(draggedStepIndex)) {
      event.preventDefault();
      draggedStepIndex = undefined;
      return;
    }

    if (event.dataTransfer) {
      event.dataTransfer.setData("text/plain", String(draggedStepIndex));
      event.dataTransfer.effectAllowed = "move";
      setStepDragImage(event.dataTransfer, stepCard);
    }

    stepCard.classList.add("is-dragging");
  });

  target.addEventListener("dragover", (event) => {
    if (draggedStepIndex === undefined) {
      return;
    }

    const targetElement = event.target as HTMLElement;
    const stepCard = targetElement.closest<HTMLElement>("[data-drag-step-index]");

    if (!stepCard) {
      return;
    }

    const targetIndex = Number(stepCard.dataset.dragStepIndex);

    if (!Number.isInteger(targetIndex) || targetIndex === draggedStepIndex) {
      clearStepDropClasses(stepsRoot);
      return;
    }

    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }

    const bounds = stepCard.getBoundingClientRect();
    const dropAfter = event.clientY > bounds.top + bounds.height / 2;

    clearStepDropClasses(stepsRoot);
    stepCard.classList.toggle("is-drop-before", !dropAfter);
    stepCard.classList.toggle("is-drop-after", dropAfter);
  });

  target.addEventListener("dragleave", (event) => {
    const targetElement = event.target as HTMLElement;
    const stepCard = targetElement.closest<HTMLElement>("[data-drag-step-index]");
    const relatedTarget = event.relatedTarget as Node | null;

    if (stepCard && relatedTarget && stepCard.contains(relatedTarget)) {
      return;
    }

    stepCard?.classList.remove("is-drop-before", "is-drop-after");
  });

  target.addEventListener("drop", (event) => {
    if (draggedStepIndex === undefined) {
      return;
    }

    const targetElement = event.target as HTMLElement;
    const stepCard = targetElement.closest<HTMLElement>("[data-drag-step-index]");

    if (!stepCard) {
      return;
    }

    event.preventDefault();

    const targetIndex = Number(stepCard.dataset.dragStepIndex);

    if (!Number.isInteger(targetIndex)) {
      clearStepDragState(stepsRoot);
      draggedStepIndex = undefined;
      return;
    }

    const insertionIndex = targetIndex + (stepCard.classList.contains("is-drop-after") ? 1 : 0);
    const moved = moveStep(config, draggedStepIndex, insertionIndex);

    if (moved) {
      editingStepIndex = updateIndexAfterMove(editingStepIndex, moved.fromIndex, moved.toIndex);
      renderSteps(stepsRoot, config, editingStepIndex);
      onChange(cloneConfig(config));
    } else {
      clearStepDragState(stepsRoot);
    }

    draggedStepIndex = undefined;
  });

  target.addEventListener("dragend", () => {
    draggedStepIndex = undefined;
    clearStepDragState(stepsRoot);
  });

  updateControls(target, stepsRoot, config, editingStepIndex);

  return {
    update(nextConfig: AbouttyConfig): void {
      config = cloneConfig(nextConfig);
      editingStepIndex = clampStepIndex(editingStepIndex, config);
      updateControls(target, stepsRoot, config, editingStepIndex);
    }
  };
}

function updateControls(
  target: HTMLElement,
  stepsRoot: HTMLElement,
  config: AbouttyConfig,
  editingStepIndex: number | undefined
): void {
  for (const field of textFields) {
    const input = target.querySelector<HTMLInputElement>(`[data-field="${field}"]`);

    if (input) {
      input.value = config[field] ?? "";
    }
  }

  for (const field of numberFields) {
    const input = target.querySelector<HTMLInputElement>(`[data-field="${field}"]`);

    if (input) {
      input.value = config[field] === undefined ? "" : String(config[field]);
    }
  }

  for (const field of themeFields) {
    const inputs = target.querySelectorAll<HTMLInputElement>(`[data-theme-field="${field}"]`);
    const value = getThemeInputValue(config, field);

    for (const input of inputs) {
      input.value = value;
    }
  }

  renderSteps(stepsRoot, config, editingStepIndex);
}

function renderSteps(
  target: HTMLElement,
  config: AbouttyConfig,
  editingStepIndex: number | undefined
): void {
  target.innerHTML = [
    ...config.steps.map((step, index) =>
      index === editingStepIndex
        ? renderEditableStep(index, config)
        : renderReadonlyStep(index, config)
    ),
    `<button class="inline-add-button" type="button" data-action="add-step">${iconButton("plus", "Add Step")}</button>`
  ].join("");
}

function renderReadonlyStep(stepIndex: number, config: AbouttyConfig): string {
  const step = config.steps[stepIndex];

  if (!step) {
    return "";
  }

  const deleteDisabled = config.steps.length <= 1 ? " disabled" : "";
  const segments = normalizeText(step.text);

  return `
    <article class="step-card" draggable="true" data-drag-step-index="${stepIndex}" data-edit-step-index="${stepIndex}">
      <div class="step-card-header">
        <div class="step-summary-title">
          <span class="step-type-badge">${step.type}</span>
          <span class="step-index-label">Step ${stepIndex + 1}</span>
        </div>
        <div class="step-card-actions">
          <button class="icon-button" type="button" data-action="remove-step" data-step-index="${stepIndex}" aria-label="Remove Step"${deleteDisabled}>
            ${icon("trash")}
          </button>
        </div>
      </div>
      <pre class="step-preview">${escapeHtml(createStepPreview(step.text))}</pre>
      <div class="step-meta" aria-label="Step metadata">
        <span>Delay ${formatMs(step.delayMs)}</span>
        <span>Interval ${formatMs(step.typingIntervalMs)}</span>
        <span>${segments.length} segment${segments.length === 1 ? "" : "s"}</span>
      </div>
    </article>
  `;
}

function renderEditableStep(stepIndex: number, config: AbouttyConfig): string {
  const step = config.steps[stepIndex];

  if (!step) {
    return "";
  }

  return `
    <article class="step-row is-editing">
      <div class="step-row-header">
        <label class="step-type-field">
          <span>Type</span>
          <select data-step-index="${stepIndex}" data-step-field="type">
            <option value="command"${step.type === "command" ? " selected" : ""}>command</option>
            <option value="output"${step.type === "output" ? " selected" : ""}>output</option>
          </select>
        </label>
      </div>
      <div class="step-timing-grid">
        <label>
          <span>Delay</span>
          <input type="number" min="0" step="50" value="${step.delayMs ?? ""}" data-step-index="${stepIndex}" data-step-field="delayMs" />
        </label>
        <label>
          <span>Interval</span>
          <input type="number" min="0" step="5" value="${step.typingIntervalMs ?? ""}" data-step-index="${stepIndex}" data-step-field="typingIntervalMs" />
        </label>
      </div>
      <div class="segment-section">
        <h2>Segments</h2>
        <div class="segments-list">
          ${renderSegments(stepIndex, normalizeText(step.text))}
        </div>
        <button class="inline-add-button" type="button" data-action="add-segment" data-step-index="${stepIndex}">${iconButton("plus", "Add Segment")}</button>
      </div>
      <div class="step-edit-actions">
        <button type="button" data-action="done-step" data-step-index="${stepIndex}">Done</button>
      </div>
    </article>
  `;
}

function createStepPreview(text: AbouttyText): string {
  const lines = textToString(text).split(/\r?\n/);
  const previewLines = lines.slice(0, 2);

  if (lines.length > 2) {
    previewLines.push("...");
  }

  return previewLines.join("\n");
}

function formatMs(value: number | undefined): string {
  return value === undefined ? "default" : `${value}ms`;
}

function clearStepDropClasses(target: HTMLElement): void {
  for (const element of target.querySelectorAll<HTMLElement>(".step-card")) {
    element.classList.remove("is-drop-before", "is-drop-after");
  }
}

function clearStepDragState(target: HTMLElement): void {
  for (const element of target.querySelectorAll<HTMLElement>(".step-card")) {
    element.classList.remove("is-dragging", "is-drop-before", "is-drop-after");
  }
}

function setStepDragImage(dataTransfer: DataTransfer, stepCard: HTMLElement): void {
  const dragImage = stepCard.cloneNode(true) as HTMLElement;
  const bounds = stepCard.getBoundingClientRect();

  dragImage.classList.add("drag-preview");
  dragImage.style.width = `${bounds.width}px`;
  dragImage.style.position = "fixed";
  dragImage.style.top = "-1000px";
  dragImage.style.left = "-1000px";
  dragImage.style.opacity = "0.16";
  dragImage.style.pointerEvents = "none";
  document.body.append(dragImage);

  dataTransfer.setDragImage(dragImage, bounds.width / 2, Math.min(bounds.height / 2, 48));

  requestAnimationFrame(() => {
    dragImage.remove();
  });
}

function renderSegments(stepIndex: number, segments: AbouttyTextSegment[]): string {
  return segments
    .map((segment, segmentIndex) => {
      const deleteDisabled = segments.length <= 1 ? " disabled" : "";

      return `
        <article class="segment-row">
          <div class="segment-row-header">
            <span>Segment ${segmentIndex + 1}</span>
            <button class="icon-button segment-remove-button" type="button" data-action="remove-segment" data-step-index="${stepIndex}" data-segment-index="${segmentIndex}" aria-label="Remove Segment"${deleteDisabled}>
              ${icon("x")}
            </button>
          </div>
          <label class="segment-value">
            <span>Value</span>
            <textarea rows="2" data-step-index="${stepIndex}" data-segment-index="${segmentIndex}" data-segment-field="value">${escapeHtml(segment.value)}</textarea>
          </label>
          <div class="segment-options">
            <label>
              <span>Color</span>
              ${segmentColorInput(stepIndex, segmentIndex, segment.color)}
            </label>
            <label>
              <span>Repeat count</span>
              <input type="number" min="1" step="1" value="${segment.repeat ?? ""}" data-step-index="${stepIndex}" data-segment-index="${segmentIndex}" data-segment-field="repeat" />
            </label>
            <label>
              <span>Repeat delay</span>
              <input type="number" min="0" step="50" value="${segment.repeatDelayMs ?? ""}" data-step-index="${stepIndex}" data-segment-index="${segmentIndex}" data-segment-field="repeatDelayMs" />
            </label>
            <label>
              <span>Interval</span>
              <input type="number" min="0" step="5" value="${segment.typingIntervalMs ?? ""}" data-step-index="${stepIndex}" data-segment-index="${segmentIndex}" data-segment-field="typingIntervalMs" />
            </label>
            <label class="checkbox-label">
              <input type="checkbox"${segment.bold ? " checked" : ""} data-step-index="${stepIndex}" data-segment-index="${segmentIndex}" data-segment-field="bold" />
              <span>Bold</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox"${segment.italic ? " checked" : ""} data-step-index="${stepIndex}" data-segment-index="${segmentIndex}" data-segment-field="italic" />
              <span>Italic</span>
            </label>
          </div>
        </article>
      `;
    })
    .join("");
}

function readSettings(target: HTMLElement, config: AbouttyConfig): AbouttyConfig {
  const next = cloneConfig(config);

  for (const field of textFields) {
    const input = target.querySelector<HTMLInputElement>(`[data-field="${field}"]`);

    if (!input) {
      continue;
    }

    assignOptionalString(next, field, input.value);
  }

  for (const field of numberFields) {
    const input = target.querySelector<HTMLInputElement>(`[data-field="${field}"]`);

    if (!input) {
      continue;
    }

    assignOptionalNumber(next, field, input.value);
  }

  for (const field of themeFields) {
    const input = target.querySelector<HTMLInputElement>(
      `[data-theme-field="${field}"][data-color-role="code"]`
    );

    if (!input) {
      continue;
    }

    assignThemeString(next, field, input.value);
  }

  return next;
}

function updateStepFromElement(element: StepControlElement, config: AbouttyConfig): void {
  const index = Number(element.dataset.stepIndex);
  const field = element.dataset.stepField as StepField | undefined;
  const step = config.steps[index];

  if (!step || !field) {
    return;
  }

  if (field === "type" && element instanceof HTMLSelectElement) {
    step.type = element.value as AbouttyStepType;
  }

  if (field === "text" && element instanceof HTMLTextAreaElement) {
    step.text = element.value;
  }

  if ((field === "delayMs" || field === "typingIntervalMs") && element instanceof HTMLInputElement) {
    if (element.value === "") {
      delete step[field];
    } else {
      step[field] = Number(element.value);
    }
  }
}

function updateSegmentFromElement(element: SegmentControlElement, config: AbouttyConfig): void {
  const stepIndex = Number(element.dataset.stepIndex);
  const segmentIndex = Number(element.dataset.segmentIndex);
  const field = element.dataset.segmentField as SegmentField | undefined;
  const step = config.steps[stepIndex];

  if (!step || !field) {
    return;
  }

  const segments = normalizeText(step.text);
  const segment = segments[segmentIndex];

  if (!segment) {
    return;
  }

  if (field === "value" && element instanceof HTMLTextAreaElement) {
    segment.value = element.value;
  }

  if (field === "color" && element instanceof HTMLInputElement) {
    if (element.value === "") {
      delete segment.color;
    } else if (isColorInputValue(element.value)) {
      segment.color = element.value.toLowerCase();
    } else {
      return;
    }
  }

  if (
    (field === "repeat" || field === "repeatDelayMs" || field === "typingIntervalMs") &&
    element instanceof HTMLInputElement
  ) {
    if (element.value === "") {
      delete segment[field];
    } else {
      segment[field] = Number(element.value);
    }
  }

  if ((field === "bold" || field === "italic") && element instanceof HTMLInputElement) {
    if (element.checked) {
      segment[field] = true;
    } else {
      delete segment[field];
    }
  }

  step.text = segments;
}

function textInput(field: TextField, label: string): string {
  return `
    <label>
      <span>${label}</span>
      <input type="text" data-field="${field}" />
    </label>
  `;
}

function numberInput(field: NumberField, label: string, min = 1): string {
  return `
    <label>
      <span>${label}</span>
      <input type="number" min="${min}" step="1" data-field="${field}" />
    </label>
  `;
}

function themeColorInput(field: ThemeField, label: string): string {
  return `
    <label>
      <span>${label}</span>
      <span class="color-field">
        <input class="color-picker" type="color" data-theme-field="${field}" data-color-role="picker" aria-label="${label} picker" />
        <input class="color-code" type="text" data-theme-field="${field}" data-color-role="code" spellcheck="false" aria-label="${label} hex code" />
      </span>
    </label>
  `;
}

function segmentColorInput(stepIndex: number, segmentIndex: number, color: string | undefined): string {
  const pickerValue = color && isColorInputValue(color) ? color : defaultTheme.text;
  const codeValue = color ?? "";

  return `
    <span class="color-field">
      <input class="color-picker" type="color" value="${escapeHtml(pickerValue)}" data-step-index="${stepIndex}" data-segment-index="${segmentIndex}" data-segment-field="color" data-color-role="picker" aria-label="Segment color picker" />
      <input class="color-code" type="text" placeholder="default" value="${escapeHtml(codeValue)}" data-step-index="${stepIndex}" data-segment-index="${segmentIndex}" data-segment-field="color" data-color-role="code" spellcheck="false" aria-label="Segment color hex code" />
    </span>
  `;
}

function assignOptionalString(config: AbouttyConfig, field: TextField, value: string): void {
  if (value === "") {
    delete config[field];
    return;
  }

  config[field] = value;
}

function assignOptionalNumber(config: AbouttyConfig, field: NumberField, value: string): void {
  if (value === "") {
    delete config[field];
    return;
  }

  config[field] = Number(value);
}

function assignThemeString(config: AbouttyConfig, field: ThemeField, value: string): void {
  config.theme = { ...config.theme };

  if (value === "") {
    delete config.theme[field];
  } else if (isColorInputValue(value)) {
    config.theme[field] = value.toLowerCase();
  } else {
    return;
  }

  if (Object.keys(config.theme).length === 0) {
    delete config.theme;
  }
}

function getThemeInputValue(config: AbouttyConfig, field: ThemeField): string {
  const value = config.theme?.[field] ?? defaultTheme[field];

  return isColorInputValue(value) ? value : defaultTheme[field];
}

type StepControlElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type SegmentControlElement = HTMLInputElement | HTMLTextAreaElement;

function isStepControl(element: HTMLElement): element is StepControlElement {
  return (
    (element instanceof HTMLInputElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLTextAreaElement) &&
    element.dataset.stepIndex !== undefined &&
    element.dataset.stepField !== undefined
  );
}

function isSegmentControl(element: HTMLElement): element is SegmentControlElement {
  return (
    (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) &&
    element.dataset.stepIndex !== undefined &&
    element.dataset.segmentIndex !== undefined &&
    element.dataset.segmentField !== undefined
  );
}
