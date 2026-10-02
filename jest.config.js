/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  // Solo pruebas unitarias en __tests__ (los E2E de Playwright viven en /e2e).
  testMatch: ["<rootDir>/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1", // resuelve el alias @/ igual que tsconfig
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      { tsconfig: { module: "commonjs", jsx: "react-jsx", esModuleInterop: true } },
    ],
  },
};
