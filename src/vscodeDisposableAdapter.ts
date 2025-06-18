import * as vscode from "vscode";
import { IDisposable } from "./disposable";

// Adapter to make vscode.Disposable compatible with IDisposable
export class VSCodeDisposableAdapter implements IDisposable {
  constructor(private vscodeDisposable: vscode.Disposable) {}

  dispose(): void {
    this.vscodeDisposable.dispose();
  }
}

// Helper function to adapt vscode.Disposable to IDisposable
export function toIDisposable(
  vscodeDisposable: vscode.Disposable,
): IDisposable {
  return new VSCodeDisposableAdapter(vscodeDisposable);
}
