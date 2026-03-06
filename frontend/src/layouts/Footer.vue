<template>
  <div class="footer max-w-[1080px] mx-auto px-3 pt-[18px] pb-7 text-center !bg-transparent">
    <div class="survival-time mb-1.5 !text-white">
      {{ t('footer.uptime') }}:
      <span class="font-bold px-1">{{ time.days }}</span>d
      <span class="font-bold px-1">{{ time.hours }}</span>h
      <span class="font-bold px-1">{{ time.minutes }}</span>m
      <span class="font-bold px-1">{{ time.seconds }}</span>s

    </div>


    <div class="hub-buttons flex gap-2.5 items-center justify-center mb-2 flex-wrap">
            <a
        href="https://github.com/dieWehmut"
        target="_blank"
        rel="noopener"
        class="hub-button x w-11 h-11 rounded-lg inline-flex items-center justify-center transition-all duration-200 bg-white/[0.04] border border-white/[0.04]"
        title="dieWehmut の GitHub"
      >
        <svg viewBox="0 0 24 24" class="social-icon w-6 h-6 max-w-7 max-h-7 block fill-white/[0.95] transition-[fill,transform] duration-200" aria-hidden="true">
          <path d="M12 .296a12 12 0 00-3.797 23.4c.6.11.82-.26.82-.577 0-.285-.01-1.04-.016-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.755-1.333-1.755-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.335-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.304-.536-1.527.117-3.183 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 016 0c2.29-1.552 3.297-1.23 3.297-1.23.655 1.656.243 2.879.12 3.183.77.84 1.235 1.91 1.235 3.22 0 4.61-2.803 5.62-5.475 5.92.43.37.814 1.096.814 2.21 0 1.595-.014 2.88-.014 3.275 0 .32.216.694.825.576A12 12 0 0012 .296z"/>
        </svg>
      </a>
      <!-- Instagram first -->
      <a
        href="https://www.instagram.com/"
        target="_blank"
        rel="noopener"
        class="hub-button instagram w-11 h-11 rounded-lg inline-flex items-center justify-center transition-all duration-200 bg-white/[0.04] border border-white/[0.04]"
        title="dieWehmut の Instagram"
      >
        <svg viewBox="0 0 24 24" class="social-icon w-6 h-6 max-w-7 max-h-7 block fill-white/[0.95] transition-[fill,transform] duration-200" aria-hidden="true">
          <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm5 5.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5zm5.25-.75a1.125 1.125 0 1 1-1.125 1.125A1.125 1.125 0 0 1 17.25 6.75zM12 9.25A2.75 2.75 0 1 0 14.75 12 2.75 2.75 0 0 0 12 9.25z"/>
        </svg>
      </a>

      <!-- X (middle) -->
      <a
        href="https://x.com/"
        target="_blank"
        rel="noopener"
        class="hub-button x w-11 h-11 rounded-lg inline-flex items-center justify-center transition-all duration-200 bg-white/[0.04] border border-white/[0.04]"
        title="dieWehmut の X"
      >
        <svg viewBox="0 0 24 24" class="social-icon w-6 h-6 max-w-7 max-h-7 block fill-white/[0.95] transition-[fill,transform] duration-200" aria-hidden="true">
          <path d="M18.3 5.71a1 1 0 0 0-1.42-1.42L12 9.17 7.12 4.29a1 1 0 0 0-1.42 1.42L10.59 10.6 5.7 15.49a1 1 0 1 0 1.42 1.42L12 12.02l4.88 4.89a1 1 0 0 0 1.42-1.42L13.41 10.6l4.89-4.89z"/>
        </svg>
      </a>

      <!-- Facebook last (replaces GitHub) -->
      <a
        href="https://www.facebook.com/"
        target="_blank"
        rel="noopener"
        class="hub-button facebook w-11 h-11 rounded-lg inline-flex items-center justify-center transition-all duration-200 bg-white/[0.04] border border-white/[0.04]"
        title="dieWehmut の Facebook"
      >
        <svg viewBox="0 0 24 24" class="social-icon w-6 h-6 max-w-7 max-h-7 block fill-white/[0.95] transition-[fill,transform] duration-200" aria-hidden="true">
          <path d="M22 12.07C22 6.48 17.52 2 11.93 2S2 6.48 2 12.07C2 17.03 5.66 21.16 10.44 21.95v-6.98H8.08v-2.9h2.36V9.41c0-2.33 1.38-3.61 3.5-3.61.99 0 2.03.18 2.03.18v2.23h-1.14c-1.13 0-1.48.7-1.48 1.42v1.71h2.52l-.4 2.9h-2.12v6.98C18.34 21.16 22 17.03 22 12.07z"/>
        </svg>
      </a>
      <!-- GitHub (middle) -->
      <a
        href="https://github.com/dieSehnsucht"
        target="_blank"
        rel="noopener"
        class="hub-button x w-11 h-11 rounded-lg inline-flex items-center justify-center transition-all duration-200 bg-white/[0.04] border border-white/[0.04]"
        title="dieSehnsucht の GitHub"
      >
        <svg viewBox="0 0 24 24" class="social-icon w-6 h-6 max-w-7 max-h-7 block fill-white/[0.95] transition-[fill,transform] duration-200" aria-hidden="true">
          <path d="M12 .296a12 12 0 00-3.797 23.4c.6.11.82-.26.82-.577 0-.285-.01-1.04-.016-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.755-1.333-1.755-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.335-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.304-.536-1.527.117-3.183 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 016 0c2.29-1.552 3.297-1.23 3.297-1.23.655 1.656.243 2.879.12 3.183.77.84 1.235 1.91 1.235 3.22 0 4.61-2.803 5.62-5.475 5.92.43.37.814 1.096.814 2.21 0 1.595-.014 2.88-.014 3.275 0 .32.216.694.825.576A12 12 0 0012 .296z"/>
        </svg>
      </a>
    </div>

    <div class="copyright text-xs text-white/[0.92] font-medium">
      © {{ copyrightYear }} {{ githubUser }} |
      <a href="https://icp.gov.moe/?keyword=20260803" target="_blank" rel="noopener">萌ICP备20260803号</a>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive, ref, computed } from "vue";
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// 设置建站起始时间（按需修改）
const startAt = new Date("2025-08-24T22:00:00+08:00").getTime();

const time = reactive({
  days: "0",
  hours: "00",
  minutes: "00",
  seconds: "00",
});

// 版权年份处理：从 startAt 年到当前年，若相同则只显示单年
const startYear = new Date(startAt).getFullYear();
const currentYear = ref(new Date().getFullYear());
const copyrightYear = computed(() =>
  startYear === currentYear.value ? String(startYear) : `${startYear}–${currentYear.value}`
);

// 自动推断 GitHub 用户名：优先从 hostname（如 github.io 的子域名）推断，若失败回退到原值
const githubUser = ref("dieWehmut");

let timer = null;
function tick() {
  const now = Date.now();
  let diff = Math.max(0, Math.floor((now - startAt) / 1000));

  const days = Math.floor(diff / 86400);
  diff -= days * 86400;
  const hours = Math.floor(diff / 3600);
  diff -= hours * 3600;
  const minutes = Math.floor(diff / 60);
  const seconds = diff - minutes * 60;

  time.days = String(days);
  time.hours = String(hours).padStart(2, "0");
  time.minutes = String(minutes).padStart(2, "0");
  time.seconds = String(seconds).padStart(2, "0");
}

onMounted(() => {
  tick();
  timer = setInterval(tick, 1000);

  // 试图从 location.host 推断 GitHub Pages 的用户名（例如 dieWehmut.github.io -> dieWehmut）
  try {
    const host = (window.location && window.location.hostname) || "";
    if (host && host.endsWith("github.io")) {
      const user = host.split(".")[0];
      if (user) githubUser.value = user;
    } else {
      // 可选：寻找页面 meta[name="github-username"] 以便在非 github.io 场景下显式注入用户名
      const meta = document.querySelector('meta[name="github-username"]');
      if (meta && meta.getAttribute("content")) githubUser.value = meta.getAttribute("content");
    }
  } catch (e) {
    // 不影响主逻辑，保持回退值
  }
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
/* text-shadow can't be expressed as Tailwind utility */
.survival-time {
  text-shadow: 0 1px 2px rgba(0,0,0,0.6) !important;
}
/* per-brand hover colors and child SVG fill override */
.hub-button:hover {
  border-color: rgba(255,255,255,0.12);
  transform: translateY(-1px);
}
.hub-button.instagram:hover { background-color: #e4405f; border-color: #e4405f; }
.hub-button.instagram:hover .social-icon { fill: #fff !important; }
.hub-button.x:hover { background-color: #000; border-color: #000; }
.hub-button.x:hover .social-icon { fill: #fff !important; }
.hub-button.facebook:hover { background-color: #1877f2; border-color: #1877f2; }
.hub-button.facebook:hover .social-icon { fill: #fff !important; }
.hub-button:hover .social-icon {
  transform: translateY(-1px) scale(1.05);
}

/* Subtle continuous floating animation */
@keyframes float {
  0% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
  100% { transform: translateY(0); }
}
.hub-button .social-icon {
  animation: float 6s ease-in-out infinite;
  will-change: transform;
}
/* Stagger animation delays */
.hub-buttons .hub-button:nth-child(1) .social-icon { animation-delay: 0s; }
.hub-buttons .hub-button:nth-child(2) .social-icon { animation-delay: 0.12s; }
.hub-buttons .hub-button:nth-child(3) .social-icon { animation-delay: 0.24s; }
.hub-buttons .hub-button:nth-child(4) .social-icon { animation-delay: 0.36s; }
.hub-buttons .hub-button:nth-child(5) .social-icon { animation-delay: 0.48s; }
@media (prefers-reduced-motion: reduce) {
  .hub-button .social-icon { animation: none !important; }
}

/* copyright text-shadow */
.copyright {
  text-shadow: 0 2px 6px rgba(0,0,0,0.6);
}
.copyright a {
  color: inherit;
  text-decoration: none;
}
.copyright a:hover {
  text-decoration: underline;
}
</style>
