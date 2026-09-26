import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AccountMenu } from "~/components/account/AccountMenu";
import { StencilMark } from "~/components/site/StencilMark";
import { useAuth } from "~/lib/auth/AuthProvider";
import { getOrCreateIdentity, storeIdentity } from "~/lib/user/identity";
import { initialsOf } from "~/lib/user/initials";
import { SERIF } from "./serif";

/**
 * The signed-in app header: wordmark linking to the documents home, and on
 * the right the person's initials opening the shared account menu.
 */
export function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  // The local editing identity, so name/colour edits here carry into the
  // editor too. The account's saved values win when present.
  const [identity, setIdentity] = useState(() => getOrCreateIdentity());
  useEffect(() => {
    if (!user) return;
    setIdentity((prev) => {
      const next = { name: user.name, color: user.color ?? prev.color };
      if (next.name === prev.name && next.color === prev.color) return prev;
      storeIdentity(next);
      return next;
    });
  }, [user]);

  const onNameChange = useCallback((name: string) => {
    setIdentity((prev) => {
      const next = { ...prev, name };
      storeIdentity(next);
      return next;
    });
  }, []);
  const onColorChange = useCallback((color: string) => {
    setIdentity((prev) => {
      const next = { ...prev, color };
      storeIdentity(next);
      return next;
    });
  }, []);

  const onSignOut = async () => {
    try {
      await signOut();
    } finally {
      navigate("/");
    }
  };

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5 md:px-10">
      <Link to="/documents" className="flex items-center gap-2.5" aria-label="Your documents">
        <StencilMark />
        <span style={{ fontFamily: SERIF }} className="text-xl">
          Katagami
        </span>
      </Link>
      {user && (
        <AccountMenu
          identity={identity}
          onNameChange={onNameChange}
          onColorChange={onColorChange}
          onSignOut={() => void onSignOut()}
          trigger={
            <button
              type="button"
              aria-label="Account menu"
              style={{ fontFamily: SERIF }}
              className="notch-sm flex size-9 items-center justify-center bg-brand-tint text-sm text-brand-ink outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
            >
              {initialsOf(user.name)}
            </button>
          }
        />
      )}
    </header>
  );
}
