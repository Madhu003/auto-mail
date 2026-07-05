// Renders plain-text body (with **bold** markdown and bare URLs) into HTML
// for the email's html part — the text part keeps the raw markdown as-is.
export function renderHtml(body: string): string {
  const escaped = body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(https?:\/\/[^\s<)]+)/g, '<a href="$1">$1</a>')
    .replace(/\n/g, '<br>');
}
