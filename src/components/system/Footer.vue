<template>
  <footer class="footer">
    <div class="footer__copyright">
      &copy; {{ footerMeta.copyrightYear }}
      <a :href="footerMeta.githubProfileUrl" target="_blank" rel="noopener noreferrer">
        {{ footerMeta.displayName }}
      </a>
      <template v-if="footerMeta.icp">
        <span>|</span>
        <a :href="footerMeta.icp.href" target="_blank" rel="noopener noreferrer">
          {{ footerMeta.icp.text }}
        </a>
      </template>
    </div>
    <div class="footer__uptime">
      Uptime:
      <span>{{ uptime.days }}</span>d
      <span>{{ uptime.hours }}</span>h
      <span>{{ uptime.minutes }}</span>m
      <span>{{ uptime.seconds }}</span>s
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useSiteOverview } from '../../composables/useSiteOverview'

const { footerMeta, uptime } = useSiteOverview()
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
  font-size: 13px;
  font-weight: 400;
}

.footer__uptime span {
  color: var(--site-text);
  font-weight: 400;
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

@media (min-width: 901px) {
  .footer {
    width: min(
      var(--site-content-width),
      calc(100vw - var(--site-sidebar-width) - var(--site-desktop-content-gutter) - var(--site-desktop-content-end-gutter))
    );
    margin: 0 auto 0 var(--site-desktop-content-gutter);
  }
}
</style>
