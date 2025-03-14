import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import config from "@igorf/configuration";

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        ignores: ["dist"]
    },
    {
        files: ["**/*.{js,mjs,cjs,ts}"]
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            semi: ["error", "always"],
            quotes: ["error", "double"],
        }
    },
    config.eslint,
    {
        rules: {
            "switch-colon-spacing": ["warn", { "after": true, "before": false }],
            "semi": ["warn", "always"],
        }
    }
];
