import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // BRITT's adapter is intentionally CommonJS (BRITT runs on CJS + node:sqlite);
    // it ships to the BRITT repo and is linted there, not by the Next config.
    "integrations/britt/pixdrift-oidc.js",
    ".worktrees/**",
    // Locked design proofs: vendored HTML/JS, not app code.
    "docs/design/referens/**",
  ]),
]);

export default eslintConfig;
