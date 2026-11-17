// настройки для программы codegen

import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./schema/*.graphqls",
  documents: ["src/**/*.{ts,vue}"],
  ignoreNoDocuments: true,
  generates: {
    "./src/shared/api/generated/": {
      preset: "client",
      config: {
        useTypeImports: true,
        scalars: { Long: "number" },
      },
    },
  },
};

export default config;
