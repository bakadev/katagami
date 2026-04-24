import { JAPANESE_NAMES, CURSOR_COLORS } from "./names";

const STORAGE_KEY = "katagami:identity";

export interface Identity {
  name: string;
  color: string;
}

function randomFrom<T>(pool: readonly T[]): T {
  return pool[Math.floor(Math.random() * pool.length)];
}

function generate(): Identity {
  return {
    name: randomFrom(JAPANESE_NAMES),
    color: randomFrom(CURSOR_COLORS),
  };
}

export function getOrCreateIdentity(): Identity {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Identity>;
      if (
        typeof parsed.name === "string" &&
        parsed.name.length >= 1 &&
        parsed.name.length <= 40 &&
        typeof parsed.color === "string" &&
        parsed.color.length > 0
      ) {
        return { name: parsed.name, color: parsed.color };
      }
    }
  } catch {
    // fall through to regenerate
  }
  const identity = generate();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // non-fatal: session still gets an identity, just not persisted
  }
  return identity;
}

export function storeIdentity(identity: Identity): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // non-fatal: storage might be blocked (private mode, etc.)
  }
}
