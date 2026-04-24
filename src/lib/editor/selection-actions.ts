import type { Editor } from "@tiptap/core";
import type { ComponentType } from "react";

export interface SelectionActionContext {
  editor: Editor;
  from: number;
  to: number;
  selectedText: string;
}

export interface SelectionAction {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  onInvoke: (ctx: SelectionActionContext) => void;
  /** Return false to hide this action for the current selection. */
  visibleWhen?: (ctx: SelectionActionContext) => boolean;
}

const actions = new Map<string, SelectionAction>();

export function registerSelectionAction(action: SelectionAction): void {
  actions.set(action.id, action);
}

export function unregisterSelectionAction(id: string): void {
  actions.delete(id);
}

export function getSelectionActions(): SelectionAction[] {
  return Array.from(actions.values());
}

/** For tests only. */
export function clearSelectionActions(): void {
  actions.clear();
}
