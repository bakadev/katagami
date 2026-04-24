// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SnapshotCard } from "~/components/history/SnapshotCard";
import { SnapshotList } from "~/components/history/SnapshotList";
import type { SnapshotRecord } from "../../shared/types";

// Radix Popover + Tooltip measure nodes with ResizeObserver which jsdom
// doesn't ship. Silence via a no-op stub.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(window as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
  ResizeObserverStub;

function fakeSnap(over: Partial<SnapshotRecord> = {}): SnapshotRecord {
  return {
    id: "s1",
    name: null,
    takenAt: new Date().toISOString(),
    takenByName: null,
    preview: "First 80 chars of the doc content…",
    ...over,
  };
}

const defaultCardProps = {
  readOnly: false,
  onRestore: () => {},
  onRename: () => {},
  onDelete: () => {},
  onSaveAsNamed: () => {},
};

describe("SnapshotCard", () => {
  it("renders 'Auto-snapshot' label for null name", () => {
    render(<SnapshotCard snapshot={fakeSnap()} {...defaultCardProps} />);
    expect(screen.getByText(/Auto-snapshot/i)).toBeTruthy();
  });

  it("renders the snapshot name when set", () => {
    render(
      <SnapshotCard snapshot={fakeSnap({ name: "Spec v1" })} {...defaultCardProps} />,
    );
    expect(screen.getByText("Spec v1")).toBeTruthy();
  });

  it("expands to show Restore action when the header is clicked", () => {
    render(
      <SnapshotCard
        snapshot={fakeSnap({ preview: "Full preview text here" })}
        {...defaultCardProps}
      />,
    );
    const header = screen.getByRole("button", { name: /Expand snapshot/i });
    fireEvent.click(header);
    expect(screen.getByRole("button", { name: /Restore this snapshot/i })).toBeTruthy();
  });

  it("shows Save-as-named on auto-snapshots after expanding", () => {
    render(<SnapshotCard snapshot={fakeSnap()} {...defaultCardProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Expand snapshot/i }));
    expect(
      screen.getByRole("button", { name: /Save this auto-snapshot as named/i }),
    ).toBeTruthy();
  });

  it("shows Rename on named snapshots after expanding", () => {
    render(
      <SnapshotCard snapshot={fakeSnap({ name: "v1" })} {...defaultCardProps} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Expand snapshot/i }));
    expect(screen.getByRole("button", { name: /Rename this snapshot/i })).toBeTruthy();
  });

  it("suppresses all mutating actions when readOnly", () => {
    render(
      <SnapshotCard
        snapshot={fakeSnap({ name: "v1" })}
        {...defaultCardProps}
        readOnly={true}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Expand snapshot/i }));
    expect(screen.queryByRole("button", { name: /Restore this snapshot/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Rename this snapshot/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Delete this snapshot/i })).toBeNull();
  });

  it("calls onRestore when Restore is clicked", () => {
    const onRestore = vi.fn();
    render(
      <SnapshotCard
        snapshot={fakeSnap({ name: "v1" })}
        {...defaultCardProps}
        onRestore={onRestore}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Expand snapshot/i }));
    fireEvent.click(screen.getByRole("button", { name: /Restore this snapshot/i }));
    expect(onRestore).toHaveBeenCalled();
  });
});

describe("SnapshotList", () => {
  it("renders a card for each snapshot", () => {
    const snaps: SnapshotRecord[] = [
      fakeSnap({ id: "a", name: "v1" }),
      fakeSnap({ id: "b", name: null }),
      fakeSnap({ id: "c", name: "v2" }),
    ];
    render(
      <SnapshotList
        snapshots={snaps}
        readOnly={false}
        onRestore={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onSaveAsNamed={() => {}}
      />,
    );
    expect(screen.getByText("v1")).toBeTruthy();
    expect(screen.getByText("v2")).toBeTruthy();
    expect(screen.getByText(/Auto-snapshot/i)).toBeTruthy();
  });
});
