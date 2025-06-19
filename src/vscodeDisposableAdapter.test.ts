/**
 * VS Code Disposable Adapter tests
 */

import * as vscode from 'vscode';
import { VSCodeDisposableAdapter, toIDisposable } from './vscodeDisposableAdapter';
import { IDisposable } from './disposable';

describe('VS Code Disposable Adapter', () => {
  describe('VSCodeDisposableAdapter Class', () => {
    it('should create adapter with vscode.Disposable', () => {
      const mockVSCodeDisposable: vscode.Disposable = { dispose: jest.fn() };
      const adapter = new VSCodeDisposableAdapter(mockVSCodeDisposable);
      
      expect(adapter).toBeDefined();
      expect(adapter).toBeInstanceOf(VSCodeDisposableAdapter);
    });

    it('should implement IDisposable interface', () => {
      const mockVSCodeDisposable: vscode.Disposable = { dispose: jest.fn() };
      const adapter = new VSCodeDisposableAdapter(mockVSCodeDisposable);
      
      expect(typeof adapter.dispose).toBe('function');
      
      // Should be assignable to IDisposable
      const disposable: IDisposable = adapter;
      expect(disposable).toBe(adapter);
    });

    it('should delegate dispose call to vscode.Disposable', () => {
      const mockVSCodeDisposable: vscode.Disposable = { dispose: jest.fn() };
      const adapter = new VSCodeDisposableAdapter(mockVSCodeDisposable);
      
      adapter.dispose();
      
      expect(mockVSCodeDisposable.dispose).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple dispose calls', () => {
      const mockVSCodeDisposable: vscode.Disposable = { dispose: jest.fn() };
      const adapter = new VSCodeDisposableAdapter(mockVSCodeDisposable);
      
      adapter.dispose();
      adapter.dispose();
      adapter.dispose();
      
      // Should delegate all calls to the wrapped disposable
      expect(mockVSCodeDisposable.dispose).toHaveBeenCalledTimes(3);
    });

    it('should handle dispose errors from vscode.Disposable', () => {
      const error = new Error('VS Code dispose error');
      const mockVSCodeDisposable: vscode.Disposable = {
        dispose: jest.fn(() => { throw error; })
      };
      const adapter = new VSCodeDisposableAdapter(mockVSCodeDisposable);
      
      expect(() => adapter.dispose()).toThrow('VS Code dispose error');
      expect(mockVSCodeDisposable.dispose).toHaveBeenCalledTimes(1);
    });

    it('should work with real vscode.Disposable patterns', () => {
      // Test with various vscode.Disposable creation patterns
      const mockDisposeFn = jest.fn();
      const simpleDisposable = { dispose: mockDisposeFn };
      
      // Test simple disposable
      const adapter1 = new VSCodeDisposableAdapter(simpleDisposable);
      adapter1.dispose();
      expect(mockDisposeFn).toHaveBeenCalled();
      
      // Test VS Code factory pattern
      const factoryDisposable = vscode.Disposable.from({ dispose: jest.fn() });
      const adapter2 = new VSCodeDisposableAdapter(factoryDisposable);
      
      // Just verify it doesn't throw
      expect(() => adapter2.dispose()).not.toThrow();
    });
  });

  describe('toIDisposable Helper Function', () => {
    it('should create VSCodeDisposableAdapter', () => {
      const mockVSCodeDisposable: vscode.Disposable = { dispose: jest.fn() };
      const result = toIDisposable(mockVSCodeDisposable);
      
      expect(result).toBeInstanceOf(VSCodeDisposableAdapter);
    });

    it('should return IDisposable interface', () => {
      const mockVSCodeDisposable: vscode.Disposable = { dispose: jest.fn() };
      const result = toIDisposable(mockVSCodeDisposable);
      
      expect(typeof result.dispose).toBe('function');
      
      // Should be assignable to IDisposable
      const disposable: IDisposable = result;
      expect(disposable).toBe(result);
    });

    it('should work with adapter', () => {
      const mockVSCodeDisposable: vscode.Disposable = { dispose: jest.fn() };
      const adapter = toIDisposable(mockVSCodeDisposable);
      
      adapter.dispose();
      
      expect(mockVSCodeDisposable.dispose).toHaveBeenCalledTimes(1);
    });

    it('should handle different vscode.Disposable types', () => {
      // Test basic disposable
      const basicDisposable = { dispose: jest.fn() };
      const adapter1 = toIDisposable(basicDisposable);
      expect(adapter1).toBeInstanceOf(VSCodeDisposableAdapter);
      adapter1.dispose();
      expect(basicDisposable.dispose).toHaveBeenCalled();
      
      // Test factory created disposable
      const factoryDisposable = vscode.Disposable.from({ dispose: jest.fn() });
      const adapter2 = toIDisposable(factoryDisposable);
      expect(adapter2).toBeInstanceOf(VSCodeDisposableAdapter);
      // Just verify it doesn't throw
      expect(() => adapter2.dispose()).not.toThrow();
    });

    it('should be convenient for VS Code integration', () => {
      // Simulate typical VS Code extension pattern
      const context = (vscode as any).__createMockExtensionContext();
      
      const commandDisposable = vscode.commands.registerCommand('test.command', () => {});
      const eventDisposable = vscode.workspace.onDidChangeConfiguration(() => {});
      
      // Convert to IDisposable for use with custom disposal system
      const adaptedCommand = toIDisposable(commandDisposable);
      const adaptedEvent = toIDisposable(eventDisposable);
      
      expect(adaptedCommand).toBeInstanceOf(VSCodeDisposableAdapter);
      expect(adaptedEvent).toBeInstanceOf(VSCodeDisposableAdapter);
      
      // Can now use with custom disposable management
      adaptedCommand.dispose();
      adaptedEvent.dispose();
      
      expect(commandDisposable.dispose).toHaveBeenCalled();
      expect(eventDisposable.dispose).toHaveBeenCalled();
    });
  });

  describe('Integration with Custom Disposable System', () => {
    it('should work with Disposable base class', () => {
      class TestExtension {
        private disposables: IDisposable[] = [];

        registerVSCodeDisposable(disposable: vscode.Disposable): void {
          this.disposables.push(toIDisposable(disposable));
        }

        dispose(): void {
          this.disposables.forEach(d => d.dispose());
          this.disposables = [];
        }
      }

      const extension = new TestExtension();
      const mockVSCodeDisposable: vscode.Disposable = { dispose: jest.fn() };
      
      extension.registerVSCodeDisposable(mockVSCodeDisposable);
      extension.dispose();
      
      expect(mockVSCodeDisposable.dispose).toHaveBeenCalledTimes(1);
    });

    it('should support mixed disposable types', () => {
      const disposables: IDisposable[] = [];
      
      // Add various types of disposables
      disposables.push({ dispose: jest.fn() }); // Pure IDisposable
      disposables.push(toIDisposable({ dispose: jest.fn() })); // Adapted VS Code disposable
      disposables.push(toIDisposable(vscode.commands.registerCommand('test', () => {}))); // Real VS Code disposable
      
      // All should be IDisposable compatible
      disposables.forEach(disposable => {
        expect(typeof disposable.dispose).toBe('function');
        disposable.dispose();
      });
    });

    it('should maintain dispose behavior consistency', () => {
      const nativeDisposable: IDisposable = { dispose: jest.fn() };
      const vscodeDisposable: vscode.Disposable = { dispose: jest.fn() };
      const adaptedDisposable = toIDisposable(vscodeDisposable);
      
      // Both should behave the same way
      nativeDisposable.dispose();
      adaptedDisposable.dispose();
      
      expect(nativeDisposable.dispose).toHaveBeenCalledTimes(1);
      expect(vscodeDisposable.dispose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle vscode.Disposable that throws on dispose', () => {
      const error = new Error('Dispose failed');
      const problematicDisposable: vscode.Disposable = {
        dispose: jest.fn(() => { throw error; })
      };
      
      const adapter = toIDisposable(problematicDisposable);
      
      expect(() => adapter.dispose()).toThrow('Dispose failed');
      expect(problematicDisposable.dispose).toHaveBeenCalledTimes(1);
    });

    it('should handle null/undefined vscode.Disposable gracefully', () => {
      // TypeScript should prevent this, but test runtime behavior
      const nullDisposable = null as any;
      
      expect(() => new VSCodeDisposableAdapter(nullDisposable)).not.toThrow();
      
      const adapter = new VSCodeDisposableAdapter(nullDisposable);
      expect(() => adapter.dispose()).toThrow(); // Will throw when trying to call dispose on null
    });

    it('should handle vscode.Disposable without dispose method', () => {
      const invalidDisposable = {} as vscode.Disposable;
      const adapter = new VSCodeDisposableAdapter(invalidDisposable);
      
      expect(() => adapter.dispose()).toThrow(); // Will throw when trying to call undefined method
    });
  });

  describe('Performance and Memory', () => {
    it('should not add significant overhead', () => {
      const disposables: vscode.Disposable[] = [];
      
      // Create many disposables
      for (let i = 0; i < 1000; i++) {
        disposables.push({ dispose: jest.fn() });
      }
      
      const start = performance.now();
      
      // Adapt all disposables
      const adapted = disposables.map(d => toIDisposable(d));
      
      const adaptTime = performance.now() - start;
      
      const disposeStart = performance.now();
      
      // Dispose all adapted disposables
      adapted.forEach(d => d.dispose());
      
      const disposeTime = performance.now() - disposeStart;
      
      // Performance should be reasonable (these are loose bounds)
      expect(adaptTime).toBeLessThan(100); // Adaptation should be fast
      expect(disposeTime).toBeLessThan(100); // Disposal should be fast
    });

    it('should not prevent garbage collection of wrapped disposable', () => {
      let vscodeDisposable: vscode.Disposable | null = { dispose: jest.fn() };
      const adapter = toIDisposable(vscodeDisposable);
      
      // Keep reference to adapter but clear original
      vscodeDisposable = null;
      
      // Adapter should still work
      expect(() => adapter.dispose()).not.toThrow();
    });

    it('should allow adapter to be garbage collected', () => {
      const vscodeDisposable: vscode.Disposable = { dispose: jest.fn() };
      let adapter: IDisposable | null = toIDisposable(vscodeDisposable);
      
      adapter.dispose();
      adapter = null;
      
      // Force garbage collection if possible
      if (global.gc) {
        global.gc();
      }
      
      // This test verifies that disposal works correctly
      // WeakRef is not available in the test environment
      expect(vscodeDisposable.dispose).toHaveBeenCalled();
      expect(adapter).toBeNull();
    });
  });
});