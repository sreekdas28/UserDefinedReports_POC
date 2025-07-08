import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import path from "path";


export default defineConfig({
  plugins: [react()],
  base: "/", // Use "/" for root path
  publicDir: "public", // Serve static files from public
  server: {
    port: 9200, // Set the development server port
    open: true, // Open the browser automatically

  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/shared": path.resolve(__dirname, "./src/shared"),
    },
  }
});
