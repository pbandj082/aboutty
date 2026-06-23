export interface SvgPreview {
  update(svg: string): void;
}

export function createPreview(target: HTMLElement): SvgPreview {
  const image = document.createElement("img");
  let currentUrl: string | undefined;

  image.className = "svg-preview";
  image.alt = "Generated aboutty SVG preview";
  target.replaceChildren(image);

  return {
    update(svg: string): void {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      currentUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      image.src = currentUrl;
    }
  };
}

