const PREFIX = "katagami:creator-token:";

export function storeCreatorToken(projectId: string, token: string) {
  localStorage.setItem(PREFIX + projectId, token);
}

export function getCreatorToken(projectId: string): string | null {
  return localStorage.getItem(PREFIX + projectId);
}

export function clearCreatorToken(projectId: string) {
  localStorage.removeItem(PREFIX + projectId);
}

/** Every project this browser created and still holds the key for. */
export function listCreatorTokens(): { projectId: string; token: string }[] {
  const out: { projectId: string; token: string }[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      const token = localStorage.getItem(key);
      if (token) out.push({ projectId: key.slice(PREFIX.length), token });
    }
  } catch {
    // storage blocked: nothing to claim
  }
  return out;
}
