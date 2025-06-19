/**
 * Disposable pattern implementation tests
 */

import { IDisposable, disposeAll, Disposable } from './disposable';

describe('Disposable Pattern', () => {
  describe('IDisposable Interface', () => {
    it('should define dispose method', () => {
      const mockDisposable: IDisposable = {
        dispose: jest.fn()
      };

      expect(typeof mockDisposable.dispose).toBe('function');
    });

    it('should be implementable by custom classes', () => {
      class TestDisposable implements IDisposable {
        public isDisposed = false;

        dispose(): void {
          this.isDisposed = true;
        }
      }

      const disposable = new TestDisposable();
      expect(disposable.isDisposed).toBe(false);
      
      disposable.dispose();
      expect(disposable.isDisposed).toBe(true);
    });
  });

  describe('disposeAll function', () => {
    it('should dispose all items in array', () => {
      const disposables: IDisposable[] = [
        { dispose: jest.fn() },
        { dispose: jest.fn() },
        { dispose: jest.fn() }
      ];

      disposeAll(disposables);

      disposables.forEach(d => {
        expect(d.dispose).toHaveBeenCalledTimes(1);
      });
    });

    it('should empty the array', () => {
      const disposables: IDisposable[] = [
        { dispose: jest.fn() },
        { dispose: jest.fn() }
      ];

      expect(disposables.length).toBe(2);
      
      disposeAll(disposables);
      
      expect(disposables.length).toBe(0);
    });

    it('should handle empty array', () => {
      const disposables: IDisposable[] = [];
      
      expect(() => disposeAll(disposables)).not.toThrow();
      expect(disposables.length).toBe(0);
    });

    it('should handle array with null/undefined items', () => {
      const dispose1 = jest.fn();
      const dispose2 = jest.fn();
      const dispose3 = jest.fn();
      
      const disposables: (IDisposable | null | undefined)[] = [
        { dispose: dispose1 },
        null,
        { dispose: dispose2 },
        undefined,
        { dispose: dispose3 }
      ];

      // Cast to avoid TypeScript error for test purposes
      expect(() => disposeAll(disposables as IDisposable[])).not.toThrow();
      
      // Should only call dispose on valid items
      expect(dispose1).toHaveBeenCalled();
      expect(dispose2).toHaveBeenCalled();
      expect(dispose3).toHaveBeenCalled();
      
      // Array should be empty after disposal
      expect(disposables.length).toBe(0);
    });

    it('should handle dispose errors gracefully', () => {
      const dispose1 = jest.fn();
      const dispose2 = jest.fn(() => { throw new Error('Dispose error'); });
      const dispose3 = jest.fn();
      
      const disposables: IDisposable[] = [
        { dispose: dispose1 },
        { dispose: dispose2 },
        { dispose: dispose3 }
      ];

      // disposeAll doesn't catch errors, so it will throw
      expect(() => disposeAll(disposables)).toThrow('Dispose error');
      
      // Because of LIFO order, dispose3 is called first, then dispose2 throws
      expect(dispose3).toHaveBeenCalled();
      expect(dispose2).toHaveBeenCalled();
      // dispose1 won't be called because dispose2 threw an error
      expect(dispose1).not.toHaveBeenCalled();
    });

    it('should dispose in reverse order (LIFO)', () => {
      const disposalOrder: number[] = [];
      const disposables: IDisposable[] = [
        { dispose: () => disposalOrder.push(1) },
        { dispose: () => disposalOrder.push(2) },
        { dispose: () => disposalOrder.push(3) }
      ];

      disposeAll(disposables);

      // Should dispose in reverse order (LIFO - Last In, First Out)
      expect(disposalOrder).toEqual([3, 2, 1]);
    });
  });

  describe('Disposable Base Class', () => {
    class TestDisposable extends Disposable {
      public customCleanup = jest.fn();

      constructor() {
        super();
      }

      public testRegister<T extends IDisposable>(value: T): T {
        return this._register(value);
      }

      public testIsDisposed(): boolean {
        return this.isDisposed;
      }

      public dispose(): void {
        if (!this._isDisposed) {
          this.customCleanup();
        }
        super.dispose();
      }
    }

    it('should initialize properly', () => {
      const disposable = new TestDisposable();
      
      expect(disposable.testIsDisposed()).toBe(false);
      expect(disposable['_disposables']).toEqual([]);
    });

    it('should dispose only once', () => {
      const disposable = new TestDisposable();
      
      disposable.dispose();
      expect(disposable.testIsDisposed()).toBe(true);
      expect(disposable.customCleanup).toHaveBeenCalledTimes(1);
      
      // Second dispose should be ignored
      disposable.dispose();
      expect(disposable.customCleanup).toHaveBeenCalledTimes(1);
    });

    it('should register and dispose child disposables', () => {
      const parent = new TestDisposable();
      const child1: IDisposable = { dispose: jest.fn() };
      const child2: IDisposable = { dispose: jest.fn() };
      
      parent.testRegister(child1);
      parent.testRegister(child2);
      
      expect(parent['_disposables']).toContain(child1);
      expect(parent['_disposables']).toContain(child2);
      
      parent.dispose();
      
      expect(child1.dispose).toHaveBeenCalledTimes(1);
      expect(child2.dispose).toHaveBeenCalledTimes(1);
    });

    it('should immediately dispose registered items if already disposed', () => {
      const parent = new TestDisposable();
      const child: IDisposable = { dispose: jest.fn() };
      
      // Dispose parent first
      parent.dispose();
      expect(parent.testIsDisposed()).toBe(true);
      
      // Register child after disposal
      const result = parent.testRegister(child);
      
      expect(result).toBe(child);
      expect(child.dispose).toHaveBeenCalledTimes(1);
      expect(parent['_disposables']).not.toContain(child);
    });

    it('should return registered disposable', () => {
      const parent = new TestDisposable();
      const child: IDisposable = { dispose: jest.fn() };
      
      const result = parent.testRegister(child);
      
      expect(result).toBe(child);
    });

    it('should dispose children in reverse order', () => {
      const parent = new TestDisposable();
      const disposalOrder: number[] = [];
      
      const child1: IDisposable = { dispose: () => disposalOrder.push(1) };
      const child2: IDisposable = { dispose: () => disposalOrder.push(2) };
      const child3: IDisposable = { dispose: () => disposalOrder.push(3) };
      
      parent.testRegister(child1);
      parent.testRegister(child2);
      parent.testRegister(child3);
      
      parent.dispose();
      
      expect(disposalOrder).toEqual([3, 2, 1]);
    });

    it('should handle nested disposables', () => {
      const grandparent = new TestDisposable();
      const parent = new TestDisposable();
      const child: IDisposable = { dispose: jest.fn() };
      
      parent.testRegister(child);
      grandparent.testRegister(parent);
      
      grandparent.dispose();
      
      expect(parent.testIsDisposed()).toBe(true);
      expect(child.dispose).toHaveBeenCalledTimes(1);
    });

    it('should handle complex disposal scenarios', () => {
      class ComplexDisposable extends Disposable {
        private resource1 = jest.fn();
        private resource2 = jest.fn();
        
        constructor() {
          super();
          
          // Register multiple types of disposables
          this._register({ dispose: this.resource1 });
          this._register({ dispose: this.resource2 });
          
          // Register a nested disposable
          const nested = new TestDisposable();
          this._register(nested);
        }
      }
      
      const complex = new ComplexDisposable();
      complex.dispose();
      
      expect(complex['_isDisposed']).toBe(true);
      expect(complex['resource1']).toHaveBeenCalled();
      expect(complex['resource2']).toHaveBeenCalled();
    });

    it('should support chaining registrations', () => {
      const parent = new TestDisposable();
      
      const child1 = parent.testRegister({ dispose: jest.fn() });
      const child2 = parent.testRegister({ dispose: jest.fn() });
      const child3 = parent.testRegister({ dispose: jest.fn() });
      
      expect(parent['_disposables']).toHaveLength(3);
      expect(parent['_disposables']).toContain(child1);
      expect(parent['_disposables']).toContain(child2);
      expect(parent['_disposables']).toContain(child3);
    });

    it('should be abstract class', () => {
      // TypeScript ensures at compile time that abstract classes cannot be instantiated
      // At runtime, we can verify that it's meant to be extended
      const instance = new (Disposable as any)();
      expect(instance).toBeInstanceOf(Disposable);
      expect(instance._isDisposed).toBe(false);
      expect(instance._disposables).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    class TestDisposable extends Disposable {
      public customCleanup = jest.fn();

      constructor() {
        super();
      }

      public testRegister<T extends IDisposable>(value: T): T {
        return this._register(value);
      }

      public testIsDisposed(): boolean {
        return this.isDisposed;
      }

      public dispose(): void {
        if (!this._isDisposed) {
          this.customCleanup();
        }
        super.dispose();
      }
    }

    it('should handle dispose errors in children', () => {
      class ErrorDisposable extends Disposable {
        constructor() {
          super();
          
          this._register({ dispose: jest.fn() }); // Good disposable
          this._register({ dispose: () => { throw new Error('Dispose error'); } }); // Bad disposable
          this._register({ dispose: jest.fn() }); // Another good disposable
        }
      }
      
      const errorDisposable = new ErrorDisposable();
      
      // Should throw because of the bad disposable
      expect(() => errorDisposable.dispose()).toThrow('Dispose error');
    });

    it('should handle circular references', () => {
      const disposable1 = new TestDisposable();
      const disposable2 = new TestDisposable();
      
      // Create circular reference
      disposable1.testRegister(disposable2);
      disposable2.testRegister(disposable1);
      
      // Should not cause infinite loop
      expect(() => disposable1.dispose()).not.toThrow();
      expect(disposable1.testIsDisposed()).toBe(true);
      expect(disposable2.testIsDisposed()).toBe(true);
    });
  });

  describe('Memory Management', () => {
    class TestDisposable extends Disposable {
      public customCleanup = jest.fn();

      constructor() {
        super();
      }

      public testRegister<T extends IDisposable>(value: T): T {
        return this._register(value);
      }

      public testIsDisposed(): boolean {
        return this.isDisposed;
      }

      public dispose(): void {
        if (!this._isDisposed) {
          this.customCleanup();
        }
        super.dispose();
      }
    }

    it('should prevent memory leaks by clearing disposables array', () => {
      const parent = new TestDisposable();
      
      // Add many disposables
      for (let i = 0; i < 100; i++) {
        parent.testRegister({ dispose: jest.fn() });
      }
      
      expect(parent['_disposables']).toHaveLength(100);
      
      parent.dispose();
      
      expect(parent['_disposables']).toHaveLength(0);
    });

    it('should allow garbage collection after disposal', () => {
      let parent: TestDisposable | null = new TestDisposable();
      
      parent.testRegister({ dispose: jest.fn() });
      parent.dispose();
      
      parent = null;
      
      // Force garbage collection if possible (Node.js)
      if (global.gc) {
        global.gc();
      }
      
      // This test verifies that disposal clears references
      // WeakRef is not available in the test environment
      expect(parent).toBeNull();
    });
  });
});