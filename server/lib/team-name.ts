/** "priya@acme.co" → "Acme"; personal mailboxes fall back to the first name. */
const PERSONAL = new Set([
  "gmail", "googlemail", "yahoo", "outlook", "hotmail", "live", "icloud", "me", "proton",
  "protonmail", "aol", "msn", "fastmail", "hey", "pm",
]);

export function guessTeamName(email: string, name: string): string {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  const label = domain.split(".")[0] ?? "";
  if (label && !PERSONAL.has(label)) {
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  const first = name.trim().split(/\s+/)[0] || "My";
  return `Team ${first}`;
}
