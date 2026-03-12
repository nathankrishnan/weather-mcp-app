import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";

const INPUT = process.env.INPUT;
if (!INPUT) throw new Error("INPUT environment variable not set");

export default defineConfig({
    plugins: [react(), viteSingleFile()],
    build: {
        rollupOptions: {
            input: INPUT,
        },
        outDir: "dist",
        emptyOutDir: false, // Don't wipe dist/ between the two builds
    },
    resolve: {
        alias: {
            // Lets you write: import { WeatherData } from "@shared/types"
            // instead of:    import { WeatherData } from "../../shared/types"
            "@shared": path.resolve(__dirname, "src/shared"),
        },
    },
});