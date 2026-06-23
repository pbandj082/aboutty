export function syncColorField(input: HTMLInputElement): void {
  const role = input.dataset.colorRole;

  if (role !== "picker" && role !== "code") {
    return;
  }

  const field = input.closest<HTMLElement>(".color-field");

  if (!field) {
    return;
  }

  const picker = field.querySelector<HTMLInputElement>('[data-color-role="picker"]');
  const code = field.querySelector<HTMLInputElement>('[data-color-role="code"]');

  if (!picker || !code) {
    return;
  }

  if (role === "picker") {
    code.value = picker.value;
    return;
  }

  const normalized = normalizeHexColor(code.value);

  if (normalized) {
    code.value = normalized;
    picker.value = normalized;
  }
}

export function isColorInputValue(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

export function normalizeHexColor(value: string): string | undefined {
  const trimmed = value.trim();

  if (!isColorInputValue(trimmed)) {
    return undefined;
  }

  return trimmed.toLowerCase();
}
