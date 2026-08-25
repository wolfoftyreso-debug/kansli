import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: [
      "packages/**/test/**/*.test.ts",
      "packages/**/src/__tests__/**/*.test.ts",
      "integrations/**/test/**/*.test.ts",
      "src/**/*.test.ts",
    ],
    testTimeout: 20000,
  },
});
