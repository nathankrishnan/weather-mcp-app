import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        environment: "node",
        include: ["tests/**/*.test.ts"],
    },
    resolve: {
        alias: {
            "@server": path.resolve(__dirname, "src/server"),
            "@shared": path.resolve(__dirname, "src/shared"),
        },
    },
});
