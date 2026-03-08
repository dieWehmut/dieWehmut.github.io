<template>
  <div class="footer max-w-[1080px] mx-auto px-3 pt-[18px] pb-7 text-center !bg-transparent max-[640px]:px-1">
    <div class="footer-meta flex flex-col items-center gap-1.5">
    <div class="survival-time inline-flex flex-wrap items-center justify-center gap-1 text-[15px] leading-none !text-[#3b4cb8] max-[640px]:text-[12px]">
      <svg class="h-[18px] w-[18px] shrink-0 fill-current max-[640px]:h-[14px] max-[640px]:w-[14px]" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm1 11.59V7a1 1 0 00-2 0v6a1 1 0 00.29.71l3 3a1 1 0 001.41-1.41z" />
      </svg>
      <span>{{ t('footer.uptime') }}:</span>
      <span class="font-bold">{{ time.days }}</span>d
      <span class="font-bold">{{ time.hours }}</span>h
      <span class="font-bold">{{ time.minutes }}</span>m
      <span class="font-bold">{{ time.seconds }}</span>s
      <span class="inline-flex items-center gap-1 shrink-0">|</span>
      <svg class="h-[18px] w-[18px] shrink-0 fill-current max-[640px]:h-[14px] max-[640px]:w-[14px]" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5c-5.05 0-9.27 3.11-11 7 1.73 3.89 5.95 7 11 7s9.27-3.11 11-7c-1.73-3.89-5.95-7-11-7zm0 12a5 5 0 110-10 5 5 0 010 10zm0-2.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
      </svg>
      <span>{{ t('footer.visitors') }}:</span>
      <span class="font-bold">{{ visitorCountText }}</span>
    </div>

    <LastUpdatedRow v-if="showLastUpdated" class="!mt-0" placement="footer" />

    <div class="copyright inline-flex items-center gap-1 text-[15px] text-[#3b4cb8]/80 font-medium leading-none max-[640px]:text-[12px]">
      <span>©</span>
      <span>{{ copyrightYear }} {{ githubUser }}.All Rights Reserved.</span>
      <span class="inline-flex items-center shrink-0 max-[640px]:hidden">|</span>
      <a href="https://icp.gov.moe/?keyword=20260803" target="_blank" rel="noopener" class="shrink-0 whitespace-nowrap max-[640px]:hidden">萌ICP备20260803</a>
    </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive, ref, computed } from "vue";
import { useI18n } from 'vue-i18n';
import { getBackendApiUrl } from '../api/backendApi'
import LastUpdatedRow from '../ui/LastUpdatedRow.vue'

defineProps({
  showLastUpdated: {
    type: Boolean,
    default: false,
  },
})

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
const visitorCount = ref(null)
const visitorCountText = computed(() => (visitorCount.value == null ? '--' : String(visitorCount.value)))

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

async function requestVisitorStats(path, init) {
  const response = await fetch(getBackendApiUrl(path), {
    headers: {
      Accept: 'application/json',
    },
    ...init,
  })

  if (!response.ok) {
    throw new Error(`Visitor request failed: ${response.status}`)
  }

  return response.json()
}

async function syncVisitorCount() {
  try {
    const visitSessionKey = 'nexus:visit-tracked'
    const hasTrackedVisit = window.sessionStorage.getItem(visitSessionKey) === '1'

    if (!hasTrackedVisit) {
      const tracked = await requestVisitorStats('/api/stats/visit', { method: 'POST' })
      visitorCount.value = Number(tracked?.visitors ?? 0)
      window.sessionStorage.setItem(visitSessionKey, '1')
      return
    }

    const stats = await requestVisitorStats('/api/stats')
    visitorCount.value = Number(stats?.visitors ?? 0)
  } catch {
    visitorCount.value = null
  }
}

onMounted(() => {
  tick();
  timer = setInterval(tick, 1000);
  syncVisitorCount()

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
  text-shadow: 0 1px 2px rgba(180,160,220,0.2) !important;
}

.footer-meta {
  text-shadow: 0 1px 2px rgba(180,160,220,0.14);
}

/* copyright text-shadow */
.copyright,
.record {
  text-shadow: 0 1px 4px rgba(180,160,220,0.15);
}
.survival-time a {
  color: inherit;
  text-decoration: none;
}
.survival-time a:hover {
  text-decoration: underline;
}
.copyright a {
  color: inherit;
  text-decoration: none;
}
.copyright a:hover {
  text-decoration: underline;
}
.record a {
  color: inherit;
  text-decoration: none;
}
.record a:hover {
  text-decoration: underline;
}
</style>
