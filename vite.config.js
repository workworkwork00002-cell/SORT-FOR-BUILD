import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // относительные пути: нужно для Capacitor, иначе в приложении
  // ресурсы ищутся от корня файловой системы и не находятся
  base: "./",
  build: {
    outDir: "dist",
    // three.js весит немало, предупреждение о размере тут не по делу
    chunkSizeWarningLimit: 1500,
  },
  server: {
    host: true, // чтобы открывать с телефона в той же сети
    port: 5173,
  },
});
