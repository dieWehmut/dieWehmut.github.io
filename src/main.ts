import { createApp } from "vue";
import { ElConfigProvider, ElIcon } from "element-plus";
import "element-plus/theme-chalk/base.css";
import "element-plus/theme-chalk/el-config-provider.css";
import "element-plus/theme-chalk/el-icon.css";
import "./tailwind.css";
import "./styles/index.scss";
import "./styles/markdown/index.scss";
import "katex/dist/katex.min.css";

import App from "./App.vue";
import i18n from "./i18n";
import router from "./router";
import { initThemePreference } from "./composables/useThemePreference";
import { siteConfig } from "./data/site/config";
import { getGitHubAvatarUrl } from "./utils/githubAvatar";

initThemePreference();

document.title = siteConfig.title;
const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
if (favicon) favicon.href = getGitHubAvatarUrl(siteConfig.githubUser);

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
app.use(ElConfigProvider);
app.use(ElIcon);
app.use(i18n);
app.use(router);

app.mount("#app");
