import { Fragment } from "react";

// Echelon is instructed to speak plainly, but models still emit
// **markdown bold** markers. Render those as real emphasis instead of
// showing literal asterisks — without shipping a full markdown engine
// into the chat surface.
export function renderEmphasis(text: string) {
  // Legacy worksheet content carries literal <br/> tags — render them
  // as the line breaks they were always meant to be.
  const normalized = text.replace(/<br\s*\/?>/gi, "\n");
  const parts = normalized.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
