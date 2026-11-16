// настройки для программы codegen

import type { CodegenConfig } from "@graphql-codegen/cli";

process.loadEnvFile(".env");
const schemaUrl = process.env.VITE_GRAPHQL_URL;

const config: CodegenConfig = {
    schema: schemaUrl,
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
