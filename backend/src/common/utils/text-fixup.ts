// Defensive fixup: small local LLMs occasionally glue a sentence/paragraph
// straight into the next with zero whitespace (e.g. "Team,I'm reaching out...").
// Insert a space wherever punctuation is immediately followed by an uppercase
// letter — i.e. a genuine new sentence, not an inline token like "Node.js" or
// "e.g." where the next character is lowercase.
export function fixMissingWhitespace(text: string): string {
  return text.replace(/([,.!?:])(?=[A-Z])/g, '$1 ');
}
