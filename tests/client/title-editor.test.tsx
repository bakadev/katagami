// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TitleEditor } from "~/components/header/TitleEditor";

describe("TitleEditor", () => {
  it("renders idle state showing the title", () => {
    render(<TitleEditor title="Hello" onSave={() => {}} readOnly={false} />);
    expect(screen.getByText("Hello")).toBeTruthy();
  });

  it("renders placeholder when title is null", () => {
    render(<TitleEditor title={null} onSave={() => {}} readOnly={false} />);
    expect(screen.getByText(/Untitled/i)).toBeTruthy();
  });

  it("switches to input on click and saves on Enter", () => {
    const onSave = vi.fn();
    render(<TitleEditor title="Hello" onSave={onSave} readOnly={false} />);
    fireEvent.click(screen.getByText("Hello"));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "World" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSave).toHaveBeenCalledWith("World");
  });

  it("saves null when title is cleared to empty string", () => {
    const onSave = vi.fn();
    render(<TitleEditor title="Hello" onSave={onSave} readOnly={false} />);
    fireEvent.click(screen.getByText("Hello"));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSave).toHaveBeenCalledWith(null);
  });

  it("reverts on Escape", () => {
    const onSave = vi.fn();
    render(<TitleEditor title="Hello" onSave={onSave} readOnly={false} />);
    fireEvent.click(screen.getByText("Hello"));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "World" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("Hello")).toBeTruthy();
  });

  it("rejects titles over 120 chars and stays in edit mode", () => {
    const onSave = vi.fn();
    render(<TitleEditor title="Hello" onSave={onSave} readOnly={false} />);
    fireEvent.click(screen.getByText("Hello"));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "a".repeat(121) } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox")).toBeTruthy();
  });

  it("does not switch to input when readOnly", () => {
    render(<TitleEditor title="Hello" onSave={() => {}} readOnly={true} />);
    fireEvent.click(screen.getByText("Hello"));
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
