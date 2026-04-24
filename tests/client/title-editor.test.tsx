// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TitleEditor } from "~/components/header/TitleEditor";

// Radix Popover measures nodes via ResizeObserver — jsdom doesn't ship one.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(window as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
  ResizeObserverStub;

describe("TitleEditor", () => {
  it("renders idle state showing the title", () => {
    render(<TitleEditor title="Hello" onSave={() => {}} readOnly={false} />);
    expect(screen.getByText("Hello")).toBeTruthy();
  });

  it("renders placeholder when title is null", () => {
    render(<TitleEditor title={null} onSave={() => {}} readOnly={false} />);
    expect(screen.getByText(/Untitled/i)).toBeTruthy();
  });

  it("opens popover on title click and saves on Enter", () => {
    const onSave = vi.fn();
    render(<TitleEditor title="Hello" onSave={onSave} readOnly={false} />);
    // Click the title text — it's a popover trigger button
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

  it("closes popover on Escape without saving", () => {
    const onSave = vi.fn();
    render(<TitleEditor title="Hello" onSave={onSave} readOnly={false} />);
    fireEvent.click(screen.getByText("Hello"));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "World" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onSave).not.toHaveBeenCalled();
  });

  it("rejects titles over 120 chars and keeps the popover open", () => {
    const onSave = vi.fn();
    render(<TitleEditor title="Hello" onSave={onSave} readOnly={false} />);
    fireEvent.click(screen.getByText("Hello"));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "a".repeat(121) } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSave).not.toHaveBeenCalled();
    // Input still present (popover still open)
    expect(screen.getByRole("textbox")).toBeTruthy();
  });

  it("does not open the popover when readOnly", () => {
    render(<TitleEditor title="Hello" onSave={() => {}} readOnly={true} />);
    fireEvent.click(screen.getByText("Hello"));
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
