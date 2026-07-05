// Splits a pasted blob of one-or-more LinkedIn posts into individual post
// texts. Posts are expected to be separated by a line/run of 3+ dashes
// (e.g. "---", "------"), which is a common convention for pasting multiple
// items into one text field. A single post with no delimiter returns as a
// one-element array, unchanged.
const DELIMITER = /-{3,}/g;

export function splitPosts(rawText: string): string[] {
  return rawText
    .split(DELIMITER)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);
}
