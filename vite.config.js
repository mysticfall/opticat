// noinspection JSUnusedGlobalSymbols

import {defineConfig} from "vite"
import path from "path"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
    plugins: [tsconfigPaths()], build: {
        lib: {
            entry: path.resolve(__dirname, "src/index.ts"),
            name: "opticat",
            fileName: (format) => `opticat.${format}.js`
        }, rollupOptions: {
            external: [],
            output: {
                globals: {}
            }
        }
    },
    test: {
        coverage: {
            provider: "v8",
            reporter: ["json-summary", "html"],
            exclude: ["docs"]
        }
    }
})
