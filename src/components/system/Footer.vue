<template>
  <footer class="footer">
    <div class="footer__uptime">
      Uptime:
      <span>{{ time.days }}</span>d
      <span>{{ time.hours }}</span>h
      <span>{{ time.minutes }}</span>m
      <span>{{ time.seconds }}</span>s
    </div>

    <div class="footer__copyright">
      ©  {{ copyrightYear }}
      <a :href="githubProfileUrl" target="_blank" rel="noopener noreferrer">{{ siteConfig.displayName }}</a>
      <template v-if="siteConfig.icpNumber">
        <span>|</span>
        <a :href="`https://icp.gov.moe/?keyword=${siteConfig.icpNumber}`" target="_blank" rel="noopener noreferrer">{{ siteConfig.icpText }}</a>
      </template>
    </div>
  </footer>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { siteConfig } from '../../data/site/config'

const startAt = new Date(siteConfig.startedAt).getTime()
const currentYear = ref(new Date().getFullYear())
const githubUser = ref(siteConfig.githubUser)

const time = reactive({
  days: '0',
  hours: '00',
  minutes: '00',
  seconds: '00',
})

const copyrightYear = computed(() => String(currentYear.value))
const githubProfileUrl = computed(() => `https://github.com/${githubUser.value}`)

let timer = null

function tick() {
  const now = Date.now()
  let diff = Math.max(0, Math.floor((now - startAt) / 1000))

  const days = Math.floor(diff / 86400)
  diff -= days * 86400
  const hours = Math.floor(diff / 3600)
  diff -= hours * 3600
  const minutes = Math.floor(diff / 60)
  const seconds = diff - minutes * 60

  time.days = String(days)
  time.hours = String(hours).padStart(2, '0')
  time.minutes = String(minutes).padStart(2, '0')
  time.seconds = String(seconds).padStart(2, '0')
  currentYear.value = new Date().getFullYear()
}

onMounted(() => {
  tick()
  timer = window.setInterval(tick, 1000)

  try {
    const host = window.location?.hostname || ''
    if (host.endsWith('github.io')) {
      const user = host.split('.')[0]
      if (user) githubUser.value = user
    }
  } catch {}
})

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<style scoped>
.footer {
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: 22px 18px 34px;
  color: var(--site-muted);
  text-align: center;
}

.footer__uptime,
.footer__copyright {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
}

.footer__uptime {
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 800;
}

.footer__uptime span {
  color: var(--site-text);
}

.footer__copyright {
  font-size: 13px;
}

a {
  color: inherit;
  text-decoration: none;
}

a:hover,
a:focus-visible {
  color: var(--site-accent);
  text-decoration: underline;
  outline: none;
}
</style>
