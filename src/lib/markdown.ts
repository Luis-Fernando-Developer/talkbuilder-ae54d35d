export const normalizeMarkdown = (value: string): string => {
  return String(value ?? "")
    .replace(/\\([\\`*_{}\[\]()#+\-.!>])/g, "$1")
    .replace(/\r\n/g, "\n");
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const safeHref = (value: string) => {
  const raw = value.replace(/&amp;/g, "&").trim();
  if (!raw) return "#";
  if (/^(https?:|mailto:|tel:)/i.test(raw)) return escapeHtml(raw);
  if (!/^[a-z][a-z0-9+.-]*:/i.test(raw)) return escapeHtml(`https://${raw}`);
  return "#";
};

export const markdownToSafeHtml = (value: string): string => {
  let html = escapeHtml(normalizeMarkdown(value));

  html = html.replace(/`([^`\n]+)`/g, '<code class="px-1 py-0.5 bg-black/10 rounded text-xs">$1</code>');
  html = html.replace(/\[([^\]]+)]\(([^)\s]+)\)/g, (_, label, href) => {
    return `<a href="${safeHref(href)}" target="_blank" rel="noopener noreferrer" class="underline">${label}</a>`;
  });
  html = html.replace(/\*\*([\s\S]*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([\s\S]*?)__/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  html = html.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, "$1<em>$2</em>");

  return html;
};