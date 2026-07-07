import { Fragment } from "react";

// Echelon is instructed to speak plainly, but models still emit
// **markdown bold** markers. Render those as real emphasis instead of
// showing literal asterisks — without shipping a full markdown engine
// into the chat surface.

// Render inline **bold** within a single line of text.
function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
    ) : (
      <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>
    ),
  );
}

// A markdown horizontal rule: a line of only ---, *** or ___ (3+).
const HR_LINE = /^\s*([-*_])\1{2,}\s*$/;

export function renderEmphasis(text: string) {
  // Legacy worksheet content carries literal <br/> tags — render them
  // as the line breaks they were always meant to be.
  const normalized = text.replace(/<br\s*\/?>/gi, "\n");

  // Models sometimes emit a markdown horizontal rule (`---`) as a section
  // divider. Left as text it renders as literal dashes in Echelon's cards, so
  // draw it as an actual divider instead of showing the raw markers.
  const lines = normalized.split("\n");
  return lines.map((line, i) => {
    const isLast = i === lines.length - 1;
    if (HR_LINE.test(line)) {
      return <hr key={`hr-${i}`} className="my-2 border-border/40" />;
    }
    return (
      <Fragment key={`ln-${i}`}>
        {renderInline(line, `ln-${i}`)}
        {!isLast && "\n"}
      </Fragment>
    );
  });
}
