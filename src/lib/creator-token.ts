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
