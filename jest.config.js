module.exports = {
  automock: false,
  rootDir: "src",
  testEnvironment: "jsdom",
  setupFiles: ["jest-canvas-mock"],
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  collectCoverageFrom: [
    "**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/decoder/wasm/**",
    "!**/__tests__/**",
    "!**/__mocks__/**",
    "!**/node_modules/**"
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 80,
      statements: 80
    }
  },
  testTimeout: 10000,
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  testMatch: [
    "**/__tests__/**/*.(ts|tsx|js)",
    "**/*.(test|spec).(ts|tsx|js)"
  ],
  testPathIgnorePatterns: [
    "<rootDir>/__tests__/mocks/",
    "<rootDir>/__tests__/utils/",
    "<rootDir>/__tests__/setup.ts"
  ],
  moduleNameMapper: {
    "\\.css$": "<rootDir>/__mocks__/styleMock.js",
    "^@/(.*)$": "<rootDir>/$1",
    "^vscode$": "<rootDir>/__tests__/mocks/vscode.ts",
    "^../decoder$": "<rootDir>/__tests__/mocks/decoder.ts"
  }
};
