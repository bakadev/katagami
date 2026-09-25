import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MeResponse, SessionUser, WorkspaceSummary } from "../../../shared/types";
import { getMe, signOut as apiSignOut } from "~/lib/api/auth";

/**
 * Who is signed in, app-wide. Fetched once on mount; `refresh()` after
 * anything that changes it (creating a workspace, claiming documents).
 * `loading` is true only until the first answer arrives, so pages that
 * need a user can wait before redirecting to /signin.
 */

export interface AuthState {
  loading: boolean;
  user: SessionUser | null;
  workspaces: WorkspaceSummary[];
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({
  children,
  initial,
}: {
  children: ReactNode;
  /** Test seam: skip the network and start from this state. */
  initial?: MeResponse | null;
}) {
  const [loading, setLoading] = useState(initial === undefined);
  const [me, setMe] = useState<MeResponse | null>(initial ?? null);

  const refresh = useCallback(async () => {
    try {
      setMe(await getMe());
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initial === undefined) void refresh();
  }, [initial, refresh]);

  const signOut = useCallback(async () => {
    await apiSignOut();
    setMe(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      user: me?.user ?? null,
      workspaces: me?.workspaces ?? [],
      refresh,
      signOut,
    }),
    [loading, me, refresh, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const SIGNED_OUT: AuthState = {
  loading: false,
  user: null,
  workspaces: [],
  refresh: async () => undefined,
  signOut: async () => undefined,
};

/** Works outside the provider too (tests, storybook-style renders): signed out. */
export function useAuth(): AuthState {
  return useContext(AuthContext) ?? SIGNED_OUT;
}
