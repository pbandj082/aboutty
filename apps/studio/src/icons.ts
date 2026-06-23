export type IconName = "copy" | "download" | "github" | "plus" | "trash" | "x";

const paths: Record<IconName, string> = {
  copy: '<path d="M8 8h8v8H8z"/><path d="M5 13H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v1"/>',
  download: '<path d="M12 3v10"/><path d="m8 9 4 4 4-4"/><path d="M4 17h16"/>',
  github: '<path d="M12 2.8a9.2 9.2 0 0 0-2.9 17.9c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.1-3.4-1.1-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 0 1.6 1.1 1.6 1.1.9 1.5 2.4 1.1 2.9.8.1-.7.4-1.1.7-1.4-2.2-.2-4.6-1.1-4.6-5A3.9 3.9 0 0 1 7 8.2c-.1-.3-.4-1.3.1-2.7 0 0 .9-.3 2.8 1a9.5 9.5 0 0 1 5.1 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.8-4.6 5 .4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5A9.2 9.2 0 0 0 12 2.8z"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  trash: '<path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12"/><path d="M9 7V4h6v3"/>',
  x: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>'
};

export function icon(name: IconName): string {
  return `<svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
}

export function iconButton(iconName: IconName, label: string): string {
  return `${icon(iconName)}<span class="button-label">${label}</span>`;
}
