import React from "react";

interface RenderOptions {
  variableClassName?: string;
  linkClassName?: string;
}

type Segment =
  | { type: "text"; value: string }
  | { type: "variable"; name: string }
  | { type: "link"; text: string; url: string };

/**
 * Tokenize text containing {{variable}} and [text](url) markers
 * into a list of segments for safe rendering.
 */
function tokenize(input: string): Segment[] {
  const segments: Segment[] = [];
  if (!input) return segments;

  // Combined regex: variable or link
  const regex = /\{\{\s*([\w.-]+)\s*\}\}|\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: input.slice(lastIndex, match.index) });
    }
    if (match[1]) {
      segments.push({ type: "variable", name: match[1] });
    } else if (match[2] && match[3]) {
      segments.push({ type: "link", text: match[2], url: match[3] });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < input.length) {
    segments.push({ type: "text", value: input.slice(lastIndex) });
  }

  return segments;
}

/**
 * Render a string with {{variable}} and [text](url) markers as React nodes.
 * Used by NodeItem previews and TestPanel chat bubbles.
 */
export function renderTextSegments(
  text: string,
  options: RenderOptions = {},
): React.ReactNode {
  const {
    variableClassName = "bg-primary/10 text-primary px-1 rounded",
    linkClassName = "text-blue-600 underline",
  } = options;

  const segments = tokenize(text ?? "");
  return segments.map((seg, idx) => {
    if (seg.type === "text") return <span key={idx}>{seg.value}</span>;
    if (seg.type === "variable") {
      return (
        <span key={idx} className={variableClassName}>
          {`{{${seg.name}}}`}
        </span>
      );
    }
    return (
      <a
        key={idx}
        href={seg.url}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        {seg.text}
      </a>
    );
  });
}
