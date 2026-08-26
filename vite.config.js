import { cloudflare } from "@cloudflare/vite-plugin";
import { sites } from "@openai/sites-vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    sites(),
    cloudflare({
      config: {
        main: "./worker/index.js",
        compatibility_date: "2026-08-26",
        assets: { binding: "ASSETS" },
      },
    }),
  ],
});
