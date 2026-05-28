import { createApp } from "vue";
import ElementPlus from "element-plus";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import "element-plus/dist/index.css";
import "./tailwind.css";
import "./styles/index.scss";
import "./styles/markdown/index.scss";

import App from "./App.vue";
import i18n from "./i18n";
import router from "./router";
import { initThemePreference } from "./composables/useThemePreference";
import { siteConfig } from "./data/site/config";

initThemePreference();

document.title = siteConfig.title;
const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
if (favicon) favicon.href = `https://github.com/${siteConfig.githubUser}.png`;

if (siteConfig.googleAnalyticsId) {
  const gaScript = document.createElement("script");
  gaScript.async = true;
  gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${siteConfig.googleAnalyticsId}`;
  document.head.appendChild(gaScript);
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) { (window as any).dataLayer.push(args); }
  gtag("js", new Date());
  gtag("config", siteConfig.googleAnalyticsId, { anonymize_ip: true });
}

const app = createApp(App);
app.use(ElementPlus);
app.use(i18n);
app.use(router);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.mount("#app");
