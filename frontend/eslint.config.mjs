import js from "@eslint/js";
import nextPlugin from "eslint-config-next";

export default [
  js.configs.recommended,
  ...nextPlugin(),
  {
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn"
    }
  }
];

