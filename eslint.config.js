import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist/**", "coverage/**", "node_modules/**"] },
  js.configs.recommended,
  // TypeScript source — full type-aware strict checking
  {
    files: ["**/*.ts"],
    extends: tseslint.configs.strictTypeChecked,
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      "no-console": "off"
    }
  },
  // JavaScript / ESM scripts — disable type-aware rules (no tsconfig coverage)
  {
    files: ["**/*.js", "**/*.mjs"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      "no-console": "off"
    }
  },
  eslintConfigPrettier
);
