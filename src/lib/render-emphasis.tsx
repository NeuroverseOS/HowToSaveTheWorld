import { Fragment } from "react";

// Echelon is instructed to speak plainly, but models still emit
// **markdown bold** markers. Render those as real emphasis instead of
// showing literal asterisks — without shipping a full markdown engine
// into the chat surface.
export function renderEmphasis(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
