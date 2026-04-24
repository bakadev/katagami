// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AvatarButton } from "../../src/components/header/AvatarButton";
import { AvatarDropdown } from "../../src/components/avatar-menu/AvatarDropdown";
import { ThemeTriState } from "../../src/components/avatar-menu/ThemeTriState";

describe("AvatarButton", () => {
  it("renders a button with a descriptive aria-label", () => {
    render(<AvatarButton name="Sakura" active={false} />);
    expect(screen.getByRole("button", { name: /Sakura/i })).toBeTruthy();
  });

  it("renders an icon (no text label)", () => {
    const { container } = render(<AvatarButton name="Sakura" active={false} />);
    const btn = container.querySelector("button");
    expect(btn).not.toBeNull();
    expect(btn!.querySelector("svg")).not.toBeNull();
  });
});

describe("AvatarDropdown", () => {
  function renderDropdown(
    props: Partial<React.ComponentProps<typeof AvatarDropdown>> = {},
  ) {
    const trigger = <AvatarButton name="Sakura" active={false} />;
    return render(
      <AvatarDropdown
        identity={{ name: "Sakura", color: "#ff66aa" }}
        theme="system"
        onThemeChange={() => {}}
        onRenameSave={() => {}}
        onDownloadClick={() => {}}
        trigger={trigger}
        __testDefaultOpen
        {...props}
      />,
    );
  }

  it("shows the user name in the header row", () => {
    renderDropdown();
    expect(screen.getByText("Sakura")).toBeTruthy();
  });

  it("calls onDownloadClick when Download as Markdown is activated", async () => {
    const onDownloadClick = vi.fn();
    renderDropdown({ onDownloadClick });
    const dl = screen.getByRole("menuitem", { name: /Download as Markdown/i });
    fireEvent.click(dl);
    await waitFor(() => expect(onDownloadClick).toHaveBeenCalled());
  });

  it("swaps the dropdown content to a rename form when Rename is selected", () => {
    renderDropdown();
    const renameItem = screen.getByRole("menuitem", { name: /Rename/i });
    fireEvent.click(renameItem);
    // After click, the menu items are gone and a textbox appears
    expect(screen.getByRole("textbox")).toBeTruthy();
    expect(screen.queryByRole("menuitem", { name: /Download as Markdown/i })).toBeNull();
  });

  it("calls onRenameSave with the trimmed value when the form is submitted", () => {
    const onRenameSave = vi.fn();
    renderDropdown({ onRenameSave });
    fireEvent.click(screen.getByRole("menuitem", { name: /Rename/i }));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "  Hanami  " } });
    fireEvent.submit(input.closest("form")!);
    expect(onRenameSave).toHaveBeenCalledWith("Hanami");
  });

  it("rejects empty + over-40-char names without calling onRenameSave", () => {
    const onRenameSave = vi.fn();
    renderDropdown({ onRenameSave });
    fireEvent.click(screen.getByRole("menuitem", { name: /Rename/i }));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    const form = input.closest("form")!;
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.submit(form);
    expect(onRenameSave).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "a".repeat(41) } });
    fireEvent.submit(form);
    expect(onRenameSave).not.toHaveBeenCalled();
  });

  it("Cancel returns to the menu view without saving", () => {
    const onRenameSave = vi.fn();
    renderDropdown({ onRenameSave });
    fireEvent.click(screen.getByRole("menuitem", { name: /Rename/i }));
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    // Menu items are back
    expect(screen.getByRole("menuitem", { name: /Download as Markdown/i })).toBeTruthy();
    expect(onRenameSave).not.toHaveBeenCalled();
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
