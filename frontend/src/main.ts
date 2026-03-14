import { createApp } from "vue";
import "./tailwind.css";
import "./styles/index.scss";

import App from "./App.vue";
import i18n from "./utils/i18n";

type NetworkInfo = {
  saveData?: boolean;
  effectiveType?: string;
};

function getNetworkInfo(): NetworkInfo | null {
  if (typeof navigator === "undefined") {
    return null;
  }

  const nav = navigator as Navigator & {
    connection?: NetworkInfo;
    mozConnection?: NetworkInfo;
    webkitConnection?: NetworkInfo;
  };

  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection ?? null;
}

function scheduleIdleTask(task: () => void, timeout = 1800) {
  if (typeof window === "undefined") {
    return;
  }

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(task, { timeout });
    return;
  }

  window.setTimeout(task, Math.min(timeout, 1800));
}

function loadOptionalUiFont() {
  if (typeof window === "undefined") {
    return;
  }

  const connection = getNetworkInfo();

  const slowConnection =
    connection?.saveData ||
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g";

  if (slowConnection) {
    return;
  }

  import("./styles/fonts/index.scss")
    .then(() => {
      document.documentElement.classList.add("fonts-loaded");
    })
    .catch(() => {});
}

function loadAnalytics() {
  if (typeof window === "undefined" || import.meta.env.DEV) {
    return;
  }

  const connection = getNetworkInfo();
  if (
    connection?.saveData ||
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g"
  ) {
    return;
  }

  const measurementId = "G-TZG91QDSZ5";

  const injectAnalytics = () => {
    if (document.querySelector(`script[data-gtag-id="${measurementId}"]`)) {
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.dataset.gtagId = measurementId;
    document.head.appendChild(script);

    const dataLayer = ((window as Window & { dataLayer?: unknown[] }).dataLayer ??=
      []);

    const gtag = (...args: unknown[]) => {
      dataLayer.push(args);
    };

    (window as Window & { gtag?: (...args: unknown[]) => void }).gtag = gtag;
    gtag("js", new Date());
    gtag("config", measurementId, { anonymize_ip: true });
  };

  const scheduleAnalytics = () => scheduleIdleTask(injectAnalytics, 4000);

  if (document.readyState === "complete") {
    scheduleAnalytics();
    return;
  }

  window.addEventListener("load", scheduleAnalytics, { once: true });
}

const app = createApp(App);
app.use(i18n);

app.mount("#app");
scheduleIdleTask(loadOptionalUiFont, 3000);
loadAnalytics();
