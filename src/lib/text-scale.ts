// Global text-size preference. Tailwind sizes everything in rem, so
// scaling the root font-size scales the whole app proportionally.

export type TextScale = "standard" | "large" | "xl";

const KEY = "neuroverse_text_scale";

const ROOT_SIZE: Record<TextScale, string> = {
  standard: "", // browser default (16px)
  large: "112.5%", // 18px
  xl: "125%", // 20px
};

export const TEXT_SCALE_LABELS: Record<TextScale, string> = {
  standard: "Standard",
  large: "Large",
  xl: "Extra Large",
};

export function getTextScale(): TextScale {
  const stored = localStorage.getItem(KEY);
  return stored === "large" || stored === "xl" ? stored : "standard";
}

export function applyTextScale(scale?: TextScale): void {
  document.documentElement.style.fontSize = ROOT_SIZE[scale ?? getTextScale()];
}

export function setTextScale(scale: TextScale): void {
  localStorage.setItem(KEY, scale);
  applyTextScale(scale);
}
