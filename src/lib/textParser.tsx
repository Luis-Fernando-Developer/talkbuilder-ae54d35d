import React from 'react';

interface TextSegment {
  type: 'text' | 'variable' | 'link';
  content: string;
  url?: string;
}

export const parseTextSegments = (text: string): TextSegment[] => {
  const segments: TextSegment[] = [];
  const combinedRegex = /\{\{([^}]+)\}\}|\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }

    if (match[1]) {
      segments.push({
        type: 'variable',
        content: match[1].trim()
      });
    } else if (match[2] && match[3]) {
      segments.push({
        type: 'link',
        content: match[2].trim(),
        url: match[3].trim()
      });
    }

    lastIndex = combinedRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  return segments;
};

export const renderTextSegments = (
  text: string,
  options?: {
    variableClassName?: string;
    linkClassName?: string;
    onLinkClick?: (url: string) => void;
  }
) => {
  const segments = parseTextSegments(text);

  return segments.map((segment, index) => {
    if (segment.type === 'variable') {
      return (
        <span
          key={index}
          className={options?.variableClassName || "bg-orange-400 px-1 py-0.5 text-white rounded mx-0.5"}
        >
          {segment.content}
        </span>
      );
    } else if (segment.type === 'link') {
      const ensureAbsoluteUrl = (url: string) => {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          return `https://${url}`;
        }
        return url;
      };

      return (
        <a
          key={index}
          href={ensureAbsoluteUrl(segment.url || '')}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault();
            window.open(ensureAbsoluteUrl(segment.url || ''), '_blank');
          }}
          className={options?.linkClassName || "text-blue-600 underline hover:text-blue-800"}
        >
          {segment.content}
        </a>
      );
    } else {
      return <span key={index}>{segment.content}</span>;
    }
  });
};