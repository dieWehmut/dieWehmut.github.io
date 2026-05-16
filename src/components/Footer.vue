<template>
  <div class="footer">
    <div class="survival-time">
      {{ t('footer.uptime') }}:
      <span class="time-number">{{ time.days }}</span>d
      <span class="time-number">{{ time.hours }}</span>h
      <span class="time-number">{{ time.minutes }}</span>m
      <span class="time-number">{{ time.seconds }}</span>s

    </div>

    <div class="copyright">
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
.footer {
  width: 100%;
  padding: 18px 12px 28px;
  text-align: center;
  /* translucent background for footer (lightened) to improve readability without heavy darkness */
  background: transparent !important;

}
.survival-time {
  margin-bottom: 6px;
  color: #ffffff !important;
  text-shadow: 0 1px 2px rgba(0,0,0,0.6) !important;
}
.time-number {
  font-weight: 700;
  padding: 0 4px;
}
.hub-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.hub-button {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.04);
}
.hub-button:hover {
  border-color: rgba(255,255,255,0.12);
  transform: translateY(-1px);
}
.hub-button.instagram:hover {
  background-color: #e4405f; /* pink-ish Instagram */
  border-color: #e4405f;
}
.hub-button.instagram:hover .social-icon {
  fill: #fff !important;
}
.hub-button.x:hover {
  background-color: #000; /* black for X on hover as requested */
  border-color: #000;
}
.hub-button.x:hover .social-icon {
  fill: #fff !important;
}
.hub-button.facebook:hover {
  background-color: #1877f2; /* Facebook blue */
  border-color: #1877f2;
}
.hub-button.facebook:hover .social-icon {
  fill: #fff !important;
}
.social-icon {
  width: 24px; /* 缩小图标以匹配较小按钮 */
  height: 24px;
  max-width: 28px;
  max-height: 28px;
  fill: rgba(255,255,255,0.95) !important;
  transition: fill 0.2s ease, transform 0.12s ease;
  display: block;
}
.hub-button:hover .social-icon {
  transform: translateY(-1px) scale(1.05);
}

/* Subtle continuous floating animation when NOT hovered */
@keyframes float {
  0% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
  100% { transform: translateY(0); }
}

/* Apply the floating animation to icons; hover transform will override while hovered */
.hub-button .social-icon {
  animation: float 6s ease-in-out infinite;
  will-change: transform;
}

/* Stagger start times so icons don't move in perfect unison */
.hub-buttons .hub-button:nth-child(1) .social-icon { animation-delay: 0s; }
.hub-buttons .hub-button:nth-child(2) .social-icon { animation-delay: 0.12s; }
.hub-buttons .hub-button:nth-child(3) .social-icon { animation-delay: 0.24s; }
.hub-buttons .hub-button:nth-child(4) .social-icon { animation-delay: 0.36s; }
.hub-buttons .hub-button:nth-child(5) .social-icon { animation-delay: 0.48s; }

/* Respect users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  .hub-button .social-icon {
    animation: none !important;
  }
}
.uptime-icon {
  width: 16px;
  height: 16px;
  fill: rgba(255,255,255,0.95) !important;
  vertical-align: middle;
  margin-left: 6px;
  transition: transform 0.12s ease;
}
.copyright {
  font-size: 12px;
  /* 更明显的对比色并带轻微阴影，便于在动态视频背景上可读 */
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
  font-weight: 500;
}
.copyright a {
  color: inherit;
  text-decoration: none;
}
.copyright a:hover {
  text-decoration: underline;
}
</style>
