// Defensive fixup: small local LLMs occasionally ignore the "no signature/
// sign-off" instruction and end the body with something like "Best regards,\n
// <candidate name>" right before we append the real CANDIDATE_SIGNATURE,
// producing a duplicated name. Since we know the exact candidate name, we can
// safely detect and strip a trailing salutation + name pair.
const SIGN_OFF_PHRASES = /^(best regards|kind regards|warm regards|regards|sincerely|thanks|thank you|cheers)[,!.]?$/i;

export function stripTrailingSignOff(text: string, candidateName: string): string {
  const lines = text.split('\n');

  // Trim trailing blank lines first.
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
  if (lines.length === 0) return text;

  const lastLine = lines[lines.length - 1].trim();
  if (lastLine.toLowerCase() !== candidateName.trim().toLowerCase()) {
    return text;
  }
  lines.pop();

  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
  if (lines.length > 0 && SIGN_OFF_PHRASES.test(lines[lines.length - 1].trim())) {
    lines.pop();
  }

  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
  return lines.join('\n');
}
