import { renderSvg, type AbouttyConfig } from "@aboutty/core";
import abouttySchema from "../../../schema/aboutty.schema.json";
import { createConfigControls } from "./controls";
import { defaultStudioConfig } from "./default-config";
import { downloadText, workflowTemplate } from "./downloads";
import { escapeHtml } from "./html";
import { dropdownTriangleIcon, icon, iconButton, npmLogoLabel } from "./icons";
import { createPreview } from "./preview";
import { createTemplateConfig, studioTemplates } from "./templates";

type CodeTab = "config" | "workflow" | "schema";

const schemaJson = JSON.stringify(abouttySchema, null, 2);

export function mountApp(target: HTMLElement): void {
  let currentSvg = "";
  let currentConfig = defaultStudioConfig;
  let currentJson = JSON.stringify(defaultStudioConfig, null, 2);
  let currentWorkflow = workflowTemplate();
  let activeCodeTab: CodeTab = "config";
  let controlsDialogOpen = false;
  let templateMenuOpen = false;
  let jsonParseTimer: number | undefined;
  const mobileControlsQuery = window.matchMedia("(max-width: 860px)");

  target.innerHTML = `
    <main class="app-shell" data-app-shell>
      <header class="app-header">
        <div>
          <h1>aboutty</h1>
        </div>
        <nav class="header-actions" aria-label="Project links">
          <a class="external-link npm-link" href="https://www.npmjs.com/org/aboutty" target="_blank" rel="noreferrer" aria-label="Open aboutty on npm">
            ${npmLogoLabel()}
          </a>
          <a class="external-link github-link" href="https://github.com/pbandj082/aboutty" target="_blank" rel="noreferrer" aria-label="Open aboutty on GitHub">
            ${iconButton("github", "GitHub")}
          </a>
        </nav>
      </header>
      <section class="workspace" aria-label="aboutty generator">
        <div class="editor-pane" id="controls-dialog" data-controls-dialog aria-labelledby="controls-title" tabindex="-1">
          <div class="pane-header">
            <button type="button" class="controls-close-button icon-button" data-action="close-controls" data-controls-close aria-label="Close controls">
              ${icon("x")}
            </button>
            <h2 id="controls-title">Controls</h2>
            <div class="template-menu" data-template-menu>
              <button type="button" class="template-button outline-button" data-action="toggle-template-menu" data-template-button aria-haspopup="menu" aria-expanded="false">
                <span class="button-label">Template</span>
                ${dropdownTriangleIcon()}
              </button>
              <div class="template-list" data-template-list role="menu" hidden>
                ${studioTemplates.map((template) => `
                  <button type="button" class="template-item" data-action="apply-template" data-template-id="${escapeHtml(template.id)}" role="menuitem">
                    ${escapeHtml(template.label)}
                  </button>
                `).join("")}
              </div>
            </div>
          </div>
          <div class="editor-scroll">
            <div data-controls></div>
          </div>
          <p class="error" data-error hidden></p>
        </div>
        <div class="output-column">
          <section class="preview-pane">
            <div class="pane-header">
              <h2>Preview</h2>
              <button type="button" data-action="download-svg">${iconButton("download", "Download SVG")}</button>
            </div>
            <div class="preview-body">
              <div class="preview-stage">
                <div class="preview-frame" data-preview></div>
                <div class="preview-controls">
                  <label class="switch-label preview-loop-switch">
                    <input type="checkbox" data-loop-toggle />
                    <span class="switch-text">Loop</span>
                    <span class="switch-track" aria-hidden="true"></span>
                  </label>
                </div>
              </div>
            </div>
          </section>
          <section class="code-pane">
            <div class="pane-header">
              <h2>Configuration</h2>
            </div>
            <div class="code-tabs-row">
              <div class="tabs" role="tablist" aria-label="code views">
                <button type="button" class="tab-button" data-action="select-code-tab" data-code-tab="config">aboutty.json</button>
                <button type="button" class="tab-button" data-action="select-code-tab" data-code-tab="workflow">aboutty.yml</button>
                <button type="button" class="tab-button" data-action="select-code-tab" data-code-tab="schema">schema.json</button>
              </div>
            </div>
            <div class="code-block">
              <div class="code-actions">
                <button type="button" class="text-button" data-action="copy-code" data-copy-code>${iconButton("copy", "Copy")}</button>
                <button type="button" class="outline-button" data-action="download-code" data-download-code>${iconButton("download", "Download")}</button>
              </div>
              <textarea class="json-editor" data-json-editor spellcheck="false" aria-label="Edit aboutty.json"></textarea>
              <pre data-code-pre><code data-code-output></code></pre>
            </div>
          </section>
        </div>
      </section>
      <button type="button" class="controls-fab" data-action="open-controls" data-controls-fab aria-controls="controls-dialog" aria-expanded="false">
        ${iconButton("tune", "Controls")}
      </button>
      <footer class="app-footer">
        <p>Copyright 2026 pbandj082</p>
      </footer>
    </main>
  `;

  const errorElement = target.querySelector<HTMLElement>("[data-error]");
  const appShell = target.querySelector<HTMLElement>("[data-app-shell]");
  const controlsDialog = target.querySelector<HTMLElement>("[data-controls-dialog]");
  const controlsFab = target.querySelector<HTMLButtonElement>("[data-controls-fab]");
  const controlsCloseButton = target.querySelector<HTMLButtonElement>("[data-controls-close]");
  const controlsRoot = target.querySelector<HTMLElement>("[data-controls]");
  const previewRoot = target.querySelector<HTMLElement>("[data-preview]");
  const codeOutput = target.querySelector<HTMLElement>("[data-code-output]");
  const codePre = target.querySelector<HTMLPreElement>("[data-code-pre]");
  const jsonEditor = target.querySelector<HTMLTextAreaElement>("[data-json-editor]");
  const downloadCodeButton = target.querySelector<HTMLButtonElement>("[data-download-code]");
  const copyCodeButton = target.querySelector<HTMLButtonElement>("[data-copy-code]");
  const loopToggle = target.querySelector<HTMLInputElement>("[data-loop-toggle]");
  const templateButton = target.querySelector<HTMLButtonElement>("[data-template-button]");
  const templateList = target.querySelector<HTMLElement>("[data-template-list]");
  const tabButtons = target.querySelectorAll<HTMLButtonElement>("[data-code-tab]");

  if (
    !errorElement ||
    !appShell ||
    !controlsDialog ||
    !controlsFab ||
    !controlsCloseButton ||
    !controlsRoot ||
    !previewRoot ||
    !codeOutput ||
    !codePre ||
    !jsonEditor ||
    !downloadCodeButton ||
    !copyCodeButton ||
    !loopToggle ||
    !templateButton ||
    !templateList
  ) {
    throw new Error("Failed to mount aboutty app.");
  }

  const errorRoot = errorElement;
  const appShellRoot = appShell;
  const controlsDialogRoot = controlsDialog;
  const controlsFabRoot = controlsFab;
  const controlsCloseRoot = controlsCloseButton;
  const codeRoot = codeOutput;
  const codePreRoot = codePre;
  const jsonEditorRoot = jsonEditor;
  const downloadRoot = downloadCodeButton;
  const copyRoot = copyCodeButton;
  const loopRoot = loopToggle;
  const templateButtonRoot = templateButton;
  const templateListRoot = templateList;
  const preview = createPreview(previewRoot);
  const controls = createConfigControls(controlsRoot, currentConfig, (nextConfig) => {
    currentConfig = nextConfig;
    currentJson = JSON.stringify(currentConfig, null, 2);
    renderCurrent(currentConfig);
  });

  function renderCurrent(config: AbouttyConfig): void {
    try {
      currentSvg = renderSvg(config);
      preview.update(currentSvg);
      updateCodePane();
      syncLoopToggle(loopRoot, config);
      errorRoot.hidden = true;
      errorRoot.textContent = "";
    } catch (caught) {
      showError(caught);
    }
  }

  function showError(caught: unknown): void {
    errorRoot.hidden = false;
    errorRoot.textContent = caught instanceof Error ? caught.message : String(caught);
  }

  function updateCodePane(): void {
    currentWorkflow = workflowTemplate();
    const isConfigTab = activeCodeTab === "config";

    jsonEditorRoot.hidden = !isConfigTab;
    codePreRoot.hidden = isConfigTab;

    if (isConfigTab) {
      if (document.activeElement !== jsonEditorRoot || jsonEditorRoot.value !== currentJson) {
        jsonEditorRoot.value = currentJson;
      }

      resizeJsonEditor();
    } else {
      codeRoot.textContent = getActiveCode();
    }

    setButtonLabel(downloadRoot, "Download");

    for (const button of tabButtons) {
      const selected = button.dataset.codeTab === activeCodeTab;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
    }
  }

  function setTemplateMenuOpen(open: boolean): void {
    templateMenuOpen = open;
    templateListRoot.hidden = !open;
    templateButtonRoot.setAttribute("aria-expanded", String(open));
  }

  function setControlsDialogOpen(open: boolean): void {
    const nextOpen = mobileControlsQuery.matches && open;

    controlsDialogOpen = nextOpen;
    appShellRoot.classList.toggle("is-controls-dialog-open", nextOpen);
    controlsFabRoot.setAttribute("aria-expanded", String(nextOpen));
    controlsDialogRoot.setAttribute("aria-hidden", String(!nextOpen && mobileControlsQuery.matches));
    document.body.classList.toggle("has-controls-dialog-open", nextOpen);

    if (!nextOpen) {
      setTemplateMenuOpen(false);
    }
  }

  function syncControlsDialogMode(): void {
    if (mobileControlsQuery.matches) {
      controlsDialogRoot.setAttribute("role", "dialog");
      controlsDialogRoot.setAttribute("aria-modal", "true");
      controlsDialogRoot.setAttribute("aria-hidden", String(!controlsDialogOpen));
      controlsFabRoot.setAttribute("aria-expanded", String(controlsDialogOpen));
      return;
    }

    controlsDialogOpen = false;
    appShellRoot.classList.remove("is-controls-dialog-open");
    document.body.classList.remove("has-controls-dialog-open");
    controlsDialogRoot.removeAttribute("role");
    controlsDialogRoot.removeAttribute("aria-modal");
    controlsDialogRoot.removeAttribute("aria-hidden");
    controlsFabRoot.setAttribute("aria-expanded", "false");
  }

  function resizeJsonEditor(): void {
    if (jsonEditorRoot.hidden) {
      return;
    }

    jsonEditorRoot.style.height = "auto";
    jsonEditorRoot.style.height = `${jsonEditorRoot.scrollHeight}px`;
  }

  function trapControlsDialogFocus(event: KeyboardEvent): void {
    const focusableElements = Array.from(
      controlsDialogRoot.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => element.offsetParent !== null || element === document.activeElement);

    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (!firstElement || !lastElement) {
      event.preventDefault();
      controlsDialogRoot.focus();
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  function applyJsonEditorValue(value: string): void {
    try {
      const parsedConfig = JSON.parse(value) as AbouttyConfig;
      const nextSvg = renderSvg(parsedConfig);

      currentConfig = parsedConfig;
      currentSvg = nextSvg;
      preview.update(currentSvg);
      controls.update(currentConfig);
      syncLoopToggle(loopRoot, currentConfig);
      updateCodePane();
      errorRoot.hidden = true;
      errorRoot.textContent = "";
    } catch (caught) {
      showError(caught);
    }
  }

  function getActiveCode(): string {
    if (activeCodeTab === "config") {
      return currentJson;
    }

    if (activeCodeTab === "workflow") {
      return currentWorkflow;
    }

    return schemaJson;
  }

  target.addEventListener("click", async (event) => {
    const targetElement = event.target as HTMLElement;

    if (templateMenuOpen && !targetElement.closest("[data-template-menu]")) {
      setTemplateMenuOpen(false);
    }

    const button = targetElement.closest<HTMLButtonElement>("button[data-action]");

    if (!button) {
      return;
    }

    if (button.dataset.action === "toggle-template-menu") {
      setTemplateMenuOpen(!templateMenuOpen);
      return;
    }

    if (button.dataset.action === "open-controls") {
      setControlsDialogOpen(true);
      controlsCloseRoot.focus();
      return;
    }

    if (button.dataset.action === "close-controls") {
      setControlsDialogOpen(false);
      controlsFabRoot.focus();
      return;
    }

    if (button.dataset.action === "apply-template") {
      const nextConfig = createTemplateConfig(button.dataset.templateId ?? "");

      if (nextConfig) {
        if (jsonParseTimer !== undefined) {
          window.clearTimeout(jsonParseTimer);
          jsonParseTimer = undefined;
        }

        currentConfig = nextConfig;
        currentJson = JSON.stringify(currentConfig, null, 2);
        controls.update(currentConfig);
        renderCurrent(currentConfig);
      }

      setTemplateMenuOpen(false);
      return;
    }

    if (button.dataset.action === "select-code-tab") {
      activeCodeTab = getCodeTab(button.dataset.codeTab);
      updateCodePane();
    }

    if (button.dataset.action === "download-svg") {
      downloadText("aboutty.svg", "image/svg+xml", currentSvg);
    }

    if (button.dataset.action === "download-code") {
      if (activeCodeTab === "config") {
        downloadText("aboutty.json", "application/json", currentJson);
      } else if (activeCodeTab === "workflow") {
        downloadText("aboutty.yml", "text/yaml", currentWorkflow);
      } else {
        downloadText("aboutty.schema.json", "application/json", schemaJson);
      }
    }

    if (button.dataset.action === "copy-code") {
      await copyText(getActiveCode());
      setButtonLabel(copyRoot, "Copied");
      window.setTimeout(() => {
        setButtonLabel(copyRoot, "Copy");
      }, 1200);
    }
  });

  target.addEventListener("keydown", (event) => {
    if (event.key === "Tab" && controlsDialogOpen) {
      trapControlsDialogFocus(event);
      return;
    }

    if (event.key !== "Escape") {
      return;
    }

    if (templateMenuOpen) {
      setTemplateMenuOpen(false);

      if (controlsDialogOpen) {
        templateButtonRoot.focus();
      }

      return;
    }

    if (controlsDialogOpen) {
      setControlsDialogOpen(false);
      controlsFabRoot.focus();
    }
  });

  mobileControlsQuery.addEventListener("change", syncControlsDialogMode);

  target.addEventListener("change", (event) => {
    const element = event.target as HTMLElement;

    if (!(element instanceof HTMLInputElement) || element !== loopRoot) {
      return;
    }

    currentConfig = setLoop(currentConfig, element.checked);
    currentJson = JSON.stringify(currentConfig, null, 2);
    controls.update(currentConfig);
    renderCurrent(currentConfig);
  });

  target.addEventListener("input", (event) => {
    const element = event.target as HTMLElement;

    if (!(element instanceof HTMLTextAreaElement) || element !== jsonEditorRoot) {
      return;
    }

    currentJson = element.value;
    resizeJsonEditor();

    if (jsonParseTimer !== undefined) {
      window.clearTimeout(jsonParseTimer);
    }

    jsonParseTimer = window.setTimeout(() => {
      jsonParseTimer = undefined;
      applyJsonEditorValue(currentJson);
    }, 250);
  });

  syncControlsDialogMode();
  renderCurrent(currentConfig);
}

function syncLoopToggle(toggle: HTMLInputElement, config: AbouttyConfig): void {
  toggle.checked = config.loop ?? false;
}

function setLoop(config: AbouttyConfig, enabled: boolean): AbouttyConfig {
  if (enabled) {
    return { ...config, loop: true };
  }

  const { loop: _loop, ...nextConfig } = config;
  return nextConfig;
}

function getCodeTab(value: string | undefined): CodeTab {
  return value === "workflow" || value === "schema" ? value : "config";
}

function setButtonLabel(button: HTMLButtonElement, label: string): void {
  const labelElement = button.querySelector<HTMLElement>(".button-label");

  if (labelElement) {
    labelElement.textContent = label;
    return;
  }

  button.textContent = label;
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}
