import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/PC_Replacement_Checklist/" : "/",
  server: {
    proxy: {
      "/api": "http://localhost:3001"
    }
  },
  plugins: [react()]
});
