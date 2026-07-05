// Defensive fixup: small local LLMs occasionally ignore the "plain text with
// **bold** markdown, no HTML" instruction and emit raw HTML (e.g. wrapping
// each paragraph in <div style="...">...</div><br>). Strip it back down to
// plain text with paragraph breaks preserved, so renderHtml() (which expects
// plain markdown, not embedded HTML) doesn't double-escape it into visible
// "&lt;div&gt;" text.
export function stripHtml(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div)>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
