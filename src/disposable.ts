// Universal Disposable interface that works in both extension and webview contexts

export interface IDisposable {
  dispose(): void;
}

export function disposeAll(disposables: IDisposable[]): void {
  while (disposables.length) {
    const item = disposables.pop();
    if (item) {
      item.dispose();
    }
  }
}

export abstract class Disposable implements IDisposable {
  protected _isDisposed = false;
  protected _disposables: IDisposable[] = [];

  public dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;
    disposeAll(this._disposables);
  }

  protected _register<T extends IDisposable>(value: T): T {
    if (this._isDisposed) {
      value.dispose();
    } else {
      this._disposables.push(value);
    }
    return value;
  }

  protected get isDisposed(): boolean {
    return this._isDisposed;
  }
}
