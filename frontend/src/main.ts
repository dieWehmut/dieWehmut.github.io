import { createApp } from "vue";
import "./tailwind.css";
import "./styles/index.scss";

import App from "./App.vue";
import i18n from "./utils/i18n";

function loadOptionalUiFont() {
  if (typeof window === "undefined") {
    return;
  }

  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;

  const slowConnection =
    connection?.saveData ||
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g";
  const isSmallScreen = window.matchMedia?.("(max-width: 640px)").matches;

  if (slowConnection || isSmallScreen) {
    return;
  }

  const loadFontStyles = () => {
    import("./styles/fonts/index.scss")
      .then(() => {
        document.documentElement.classList.add("fonts-loaded");
      })
      .catch(() => {});
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(loadFontStyles, { timeout: 3000 });
    return;
  }

  window.setTimeout(loadFontStyles, 1800);
}

const app = createApp(App);
app.use(i18n);

app.mount("#app");
loadOptionalUiFont();
