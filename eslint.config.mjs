import js from "@eslint/js";

export default [
  {
    ignores: [
      "coverage/**",
      "dist/**",
      "build/**",
      "node_modules/**",
      "reports/**",
      "package-lock.json",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        URL: "readonly",
      },
    },
    rules: {
      "no-console": "off",
    },
  },
];
