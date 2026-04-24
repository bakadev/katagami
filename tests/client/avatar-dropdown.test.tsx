// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AvatarButton } from "../../src/components/header/AvatarButton";
import { AvatarDropdown } from "../../src/components/avatar-menu/AvatarDropdown";
import { ThemeTriState } from "../../src/components/avatar-menu/ThemeTriState";
import { RenameModal } from "../../src/components/avatar-menu/RenameModal";

describe("AvatarButton", () => {
  it("renders the first letter of the name (uppercased)", () => {
    render(<AvatarButton name="sakura" color="#ff66aa" active={false} />);
    expect(screen.getByText("S")).toBeTruthy();
  });

  it("applies the identity color as background", () => {
    const { container } = render(<AvatarButton name="Sakura" color="#ff66aa" active={false} />);
    const btn = container.querySelector("button");
    expect(btn).not.toBeNull();
    expect(btn!.style.backgroundColor).toBeTruthy();
  });
});

describe("AvatarDropdown", () => {
  function renderDropdown(props: Partial<React.ComponentProps<typeof AvatarDropdown>> = {}) {
    const trigger = <AvatarButton name="Sakura" color="#ff66aa" active={false} />;
    return render(
      <AvatarDropdown
        identity={{ name: "Sakura", color: "#ff66aa" }}
        theme="system"
        onThemeChange={() => {}}
        onRenameClick={() => {}}
        onDownloadClick={() => {}}
        trigger={trigger}
        defaultOpen
        {...props}
      />,
    );
  }

  it("shows the user name in the header row", () => {
    renderDropdown();
    expect(screen.getByText("Sakura")).toBeTruthy();
  });

  it("calls onRenameClick when Rename is activated", async () => {
    const onRenameClick = vi.fn();
    renderDropdown({ onRenameClick });
    const renameItem = screen.getByRole("menuitem", { name: /Rename/i });
    fireEvent.click(renameItem);
    await waitFor(() => expect(onRenameClick).toHaveBeenCalled());
  });

  it("calls onDownloadClick when Download as Markdown is activated", async () => {
    const onDownloadClick = vi.fn();
    renderDropdown({ onDownloadClick });
    const dl = screen.getByRole("menuitem", { name: /Download as Markdown/i });
    fireEvent.click(dl);
    await waitFor(() => expect(onDownloadClick).toHaveBeenCalled());
  });
});

describe("RenameModal", () => {
  it("calls onSave with the trimmed name when the form is submitted", () => {
    const onSave = vi.fn();
    render(<RenameModal open={true} initialName="Sakura" onSave={onSave} onCancel={() => {}} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "  Hanami  " } });
    fireEvent.submit(input.closest("form")!);
    expect(onSave).toHaveBeenCalledWith("Hanami");
  });

  it("rejects names shorter than 1 or longer than 40 chars", () => {
    const onSave = vi.fn();
    render(<RenameModal open={true} initialName="Sakura" onSave={onSave} onCancel={() => {}} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    const form = input.closest("form")!;
    // empty
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.submit(form);
    expect(onSave).not.toHaveBeenCalled();
    // too long
    fireEvent.change(input, { target: { value: "a".repeat(41) } });
    fireEvent.submit(form);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("calls onCancel when Cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(<RenameModal open={true} initialName="Sakura" onSave={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});

describe("ThemeTriState", () => {
  it("calls onChange('dark') when the Moon button is clicked", () => {
    const onChange = vi.fn();
    render(<ThemeTriState value="system" onChange={onChange} />);
    const dark = screen.getByRole("button", { name: /Dark/i });
    fireEvent.click(dark);
    expect(onChange).toHaveBeenCalledWith("dark");
  });

  it("marks the active button with aria-pressed=true", () => {
    render(<ThemeTriState value="dark" onChange={() => {}} />);
    const dark = screen.getByRole("button", { name: /Dark/i });
    expect(dark.getAttribute("aria-pressed")).toBe("true");
    const light = screen.getByRole("button", { name: /Light/i });
    expect(light.getAttribute("aria-pressed")).toBe("false");
  });
});
