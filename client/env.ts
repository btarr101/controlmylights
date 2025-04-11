// Zod validation
import { defineConfig } from "@julr/vite-plugin-validate-env";
import { z } from "zod";

export default defineConfig({
  validator: "zod",
  schema: {
    VITE_API_BASE_URL: z.string(),
    VITE_GITHUB_REPOSITORY_URL: z.string()
  },
});
