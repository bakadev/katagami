// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
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
    // The menu links to /signin, so it needs a router.
    return render(
      <MemoryRouter>
        <AvatarDropdown
          identity={{ name: "Sakura", color: "#ff66aa" }}
          theme="system"
          onThemeChange={() => {}}
          onNameChange={() => {}}
          onColorChange={() => {}}
          trigger={trigger}
          __testDefaultOpen
          {...props}
        />
      </MemoryRouter>,
    );
  }

  it("shows the user name in the header row", () => {
    renderDropdown();
    expect(screen.getByText("Sakura")).toBeTruthy();
  });

  it("no longer offers the Markdown download (export has its own button)", () => {
    renderDropdown();
    expect(screen.queryByRole("menuitem", { name: /Download as Markdown/i })).toBeNull();
  });

  it("swaps the dropdown content to a rename form when Change name is selected", () => {
    renderDropdown();
    fireEvent.click(screen.getByRole("menuitem", { name: /Change name/i }));
    // After click, the menu items are gone and a textbox appears
    expect(screen.getByRole("textbox")).toBeTruthy();
    expect(screen.queryByRole("menuitem", { name: /Change colour/i })).toBeNull();
  });

  it("calls onNameChange with the trimmed value when the form is submitted", () => {
    const onNameChange = vi.fn();
    renderDropdown({ onNameChange });
    fireEvent.click(screen.getByRole("menuitem", { name: /Change name/i }));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "  Hanami  " } });
    fireEvent.submit(input.closest("form")!);
    expect(onNameChange).toHaveBeenCalledWith("Hanami");
  });

  it("rejects empty + over-40-char names without calling onNameChange", () => {
    const onNameChange = vi.fn();
    renderDropdown({ onNameChange });
    fireEvent.click(screen.getByRole("menuitem", { name: /Change name/i }));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    const form = input.closest("form")!;
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.submit(form);
    expect(onNameChange).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "a".repeat(41) } });
    fireEvent.submit(form);
    expect(onNameChange).not.toHaveBeenCalled();
  });

  it("Cancel returns to the menu view without saving", () => {
    const onNameChange = vi.fn();
    renderDropdown({ onNameChange });
    fireEvent.click(screen.getByRole("menuitem", { name: /Change name/i }));
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    // Menu items are back
    expect(screen.getByRole("menuitem", { name: /Change colour/i })).toBeTruthy();
    expect(onNameChange).not.toHaveBeenCalled();
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
