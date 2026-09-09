import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  // Upstream Bklit uses imperative refs for animation/portal measurements.
  // Keep its source intact; these React Compiler diagnostics are not applicable
  // to this non-Compiler build. App components retain all standard checks.
  {
    files: ["src/components/charts/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["src/components/charts/loading-sweep.tsx"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
  globalIgnores([".next/**", "dist/**", ".vercel/**"]),
]);
