import { AccountMenu, type AccountMenuProps } from "~/components/account/AccountMenu";

export type AvatarDropdownProps = AccountMenuProps;

/**
 * AvatarDropdown: the editor's top-right user menu. It is the shared
 * {@link AccountMenu} under the editor's `AvatarButton` trigger; the name
 * stays so the editor route and its tests keep reading naturally.
 */
export function AvatarDropdown(props: AvatarDropdownProps) {
  return <AccountMenu {...props} />;
}
