import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/* Один код — три среды: браузер Яндекс Игр, APK через Capacitor,
   локальный dev. Различие ровно одно — тег SDK, поэтому вместо
   отдельной ветки кода держим плейсхолдер в index.html и
   подставляем скрипт только в сборке под Яндекс.

   Тащить SDK в APK нельзя: скрипт лежит на домене Яндекса, в
   приложении он не загрузится и подарит игроку зависшую сотню
   миллисекунд на старте. */
const yandexSdk = (isYandex) => ({
  name: "yandex-sdk-tag",
  transformIndexHtml(html) {
    return html.replace(
      "<!--YANDEX_SDK-->",
      isYandex ? '<script src="https://yandex.ru/games/sdk/v2"></script>' : ""
    );
  },
});

export default defineConfig(({ mode }) => ({
  plugins: [react(), yandexSdk(mode === "yandex")],
  // относительные пути: нужно для Capacitor, иначе в приложении
  // ресурсы ищутся от корня файловой системы и не находятся.
  // Яндексу они тоже подходят — игра живёт в своей поддиректории.
  base: "./",
  build: {
    outDir: mode === "yandex" ? "dist-yandex" : "dist",
    // three.js весит немало, предупреждение о размере тут не по делу
    chunkSizeWarningLimit: 1500,
  },
  server: {
    host: true, // чтобы открывать с телефона в той же сети
    port: 5173,
  },
}));
