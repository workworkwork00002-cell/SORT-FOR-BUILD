import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { initPlatform } from "./core/platform";

/* SDK поднимаем до первого рендера: чтение сохранения в App
   стартует сразу и должно уже видеть облако. initPlatform не
   бросает исключений и не висит — если платформы нет, промис
   сразу резолвится в false. */
initPlatform().finally(() => {
  createRoot(document.getElementById("root")).render(<App />);
});
