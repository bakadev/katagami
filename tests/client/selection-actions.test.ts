// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  registerSelectionAction,
  unregisterSelectionAction,
  getSelectionActions,
  clearSelectionActions,
  type SelectionAction,
} from "../../src/lib/editor/selection-actions";

function dummyAction(id: string): SelectionAction {
  return {
    id,
    label: id,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onInvoke: () => {},
  };
}

describe("selection-actions registry", () => {
  beforeEach(() => clearSelectionActions());

  it("returns empty when nothing registered", () => {
    expect(getSelectionActions()).toEqual([]);
  });

  it("registers and returns in insertion order", () => {
    registerSelectionAction(dummyAction("a"));
    registerSelectionAction(dummyAction("b"));
    expect(getSelectionActions().map((a) => a.id)).toEqual(["a", "b"]);
  });

  it("unregisters by id", () => {
    registerSelectionAction(dummyAction("a"));
    registerSelectionAction(dummyAction("b"));
    unregisterSelectionAction("a");
    expect(getSelectionActions().map((a) => a.id)).toEqual(["b"]);
  });

  it("re-registering an existing id replaces it", () => {
    registerSelectionAction({ ...dummyAction("a"), label: "original" });
    registerSelectionAction({ ...dummyAction("a"), label: "updated" });
    const actions = getSelectionActions();
    expect(actions).toHaveLength(1);
    expect(actions[0].label).toBe("updated");
  });
});
