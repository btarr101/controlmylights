import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { ValidateEnv } from "@julr/vite-plugin-validate-env"
import * as fs from "fs";

if (!fs.existsSync(".env")) {
  fs.copyFileSync(".env.example", ".env", fs.constants.COPYFILE_EXCL);
  console.log("🆕 Created default .env file ✅");
} 

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({
    babel: {
      plugins:[["babel-plugin-react-compiler"]]
    }
  }), tailwindcss(), ValidateEnv({
    validator: "zod"
  })],
})
