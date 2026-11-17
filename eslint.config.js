import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

const layers = ["app", "pages", "widgets", "features", "entities", "shared"];

const deepImportPatterns = [
  {
    group: ["@/pages/*/*", "@/widgets/*/*", "@/features/*/*", "@/entities/*/*"],
    message: "Импортируй модуль целиком через его index.ts, например @/entities/graph.",
  },
];

function layerRules() {
  const configs = [];
  for (let i = 0; i < layers.length; i++) {
    const forbidden = [];
    for (let j = 0; j < i; j++) {
      forbidden.push("@/" + layers[j]);
      forbidden.push("@/" + layers[j] + "/*");
    }
    const patterns = deepImportPatterns.slice();
    if (forbidden.length > 0) {
      patterns.push({
        group: forbidden,
        message: "Слой " + layers[i] + " может импортировать только из слоёв ниже себя.",
      });
    }
    configs.push({
      files: ["src/" + layers[i] + "/**/*.{ts,vue}"],
      rules: {
        "no-restricted-imports": ["error", { patterns: patterns }],
      },
    });
  }
  return configs;
}

export default defineConfig([
  {
    ignores: ["dist", "node_modules", "coverage", "src/shared/api/generated"],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  pluginVue.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    files: ["src/**/*.{ts,vue}"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ["*.config.{js,ts}"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    rules: {
      "vue/multi-word-component-names": ["error", { ignores: ["App"] }],
    },
  },
  layerRules(),
  prettierConfig,
]);
