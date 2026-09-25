import * as arctic from "arctic";
import { env } from "../env.js";

/**
 * OAuth providers behind one small interface so the routes and tests don't
 * depend on arctic directly. A provider turns a callback `code` into a
 * profile; everything after that (users, sessions) is ours.
 */

export type ProviderName = "github" | "google";

export interface OAuthProfile {
  providerId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  avatarUrl: string | null;
}

export interface OAuthProvider {
  name: ProviderName;
  /** Human label for the "via GitHub" line. */
  label: string;
  /** Whether the flow carries a PKCE verifier (Google does, GitHub doesn't). */
  usesPkce: boolean;
  createAuthorizationURL(state: string, codeVerifier: string): URL;
  exchange(code: string, codeVerifier: string): Promise<OAuthProfile>;
}

export type ProviderMap = Partial<Record<ProviderName, OAuthProvider>>;

function callbackUrl(name: ProviderName): string {
  return `${env.API_URL.replace(/\/$/, "")}/api/auth/${name}/callback`;
}

/* ---- GitHub --------------------------------------------------------------- */

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string | null;
  email: string | null;
}
interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

export function githubProvider(clientId: string, clientSecret: string): OAuthProvider {
  const client = new arctic.GitHub(clientId, clientSecret, callbackUrl("github"));
  return {
    name: "github",
    label: "GitHub",
    usesPkce: false,
    createAuthorizationURL(state) {
      return client.createAuthorizationURL(state, ["read:user", "user:email"]);
    },
    async exchange(code) {
      const tokens = await client.validateAuthorizationCode(code);
      const headers = {
        Authorization: `Bearer ${tokens.accessToken()}`,
        "User-Agent": "katagami",
      };
      const [userRes, emailRes] = await Promise.all([
        fetch("https://api.github.com/user", { headers }),
        fetch("https://api.github.com/user/emails", { headers }),
      ]);
      if (!userRes.ok) throw new Error(`GitHub /user failed: ${userRes.status}`);
      const user = (await userRes.json()) as GitHubUser;
      const emails = emailRes.ok ? ((await emailRes.json()) as GitHubEmail[]) : [];
      const primary =
        emails.find((e) => e.primary && e.verified) ?? emails.find((e) => e.verified);
      const email = primary?.email ?? user.email ?? "";
      return {
        providerId: String(user.id),
        email,
        emailVerified: Boolean(primary),
        name: user.name?.trim() || user.login,
        avatarUrl: user.avatar_url,
      };
    },
  };
}

/* ---- Google --------------------------------------------------------------- */

interface GoogleClaims {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export function googleProvider(clientId: string, clientSecret: string): OAuthProvider {
  const client = new arctic.Google(clientId, clientSecret, callbackUrl("google"));
  return {
    name: "google",
    label: "Google",
    usesPkce: true,
    createAuthorizationURL(state, codeVerifier) {
      return client.createAuthorizationURL(state, codeVerifier, ["openid", "email", "profile"]);
    },
    async exchange(code, codeVerifier) {
      const tokens = await client.validateAuthorizationCode(code, codeVerifier);
      const claims = arctic.decodeIdToken(tokens.idToken()) as GoogleClaims;
      return {
        providerId: claims.sub,
        email: claims.email ?? "",
        emailVerified: claims.email_verified === true,
        name: claims.name?.trim() || claims.email?.split("@")[0] || "Someone",
        avatarUrl: claims.picture ?? null,
      };
    },
  };
}

/** Providers configured through the environment. Empty when none are set. */
export function providersFromEnv(): ProviderMap {
  const map: ProviderMap = {};
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    map.github = githubProvider(env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET);
  }
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    map.google = googleProvider(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
  }
  return map;
}
