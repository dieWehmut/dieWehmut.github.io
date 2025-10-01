<template>
  <div class="footer">
    <div class="survival-time">
      Uptime
      <span class="time-number">{{ time.days }}</span> d
      <span class="time-number">{{ time.hours }}</span> h
      <span class="time-number">{{ time.minutes }}</span> m
      <span class="time-number">{{ time.seconds }}</span> s 🕒
    </div>


    <div class="hub-buttons">
      <a
        href="https://github.com/dieSehnsucht0"
        target="_blank"
        rel="noopener"
        class="hub-button github"
        title="dieSehnsucht0 の GitHub"
      >
        <svg viewBox="0 0 24 24" class="social-icon" aria-hidden="true">
          <path
            d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604C8.11 16.72 5.308 15.691 5.308 12.094c0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.559 21.394 24 16.897 24 11.597 24 4.97 18.627 0 12 0z"
          />
        </svg>
      </a>

      <a
        href="https://git.nju.edu.cn/dieSehnsucht"
        target="_blank"
        rel="noopener"
        class="hub-button gitlab"
        title="dieSehnsucht の JiHu GitLab"
      >
        <svg viewBox="0 0 24 24" class="social-icon" aria-hidden="true">
          <path
            d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"
          />
        </svg>
      </a>

      <a
        href="https://github.com/dieWehmut"
        target="_blank"
        rel="noopener"
        class="hub-button github"
        title="dieWehmut の GitHub"
      >
        <svg viewBox="0 0 24 24" class="social-icon" aria-hidden="true">
          <path
            d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
          />
        </svg>
      </a>
    </div>

    <div class="copyright">© 2025 hc-dsw</div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive } from "vue";

// 设置建站起始时间（按需修改）
const startAt = new Date("2025-08-24T22:00:00+08:00").getTime();

const time = reactive({
  days: "0",
  hours: "00",
  minutes: "00",
  seconds: "00",
});

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
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.footer {
  max-width: 1080px;
  margin: 0 auto;
  padding: 18px 12px 28px;
  text-align: center;
}
.survival-time {
  margin-bottom: 6px;
  color: #333;
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
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e5e5;
  background: #fff;
  transition: all 0.2s ease;
}
.hub-button:hover {
  border-color: #dcdcdc;
  transform: translateY(-1px);
}
.hub-button.github:hover {
  background-color: #24292e;
  border-color: #24292e;
}
.hub-button.github:hover .social-icon {
  fill: #fff;
}
.hub-button.gitlab:hover {
  background-color: #fc6d26;
  border-color: #fc6d26;
}
.hub-button.gitlab:hover .social-icon {
  fill: #fff;
}
.social-icon {
  width: 18px;
  height: 18px;
  fill: #333;
  transition: fill 0.2s ease;
}
.copyright {
  font-size: 12px;
  color: #888;
}
</style>
