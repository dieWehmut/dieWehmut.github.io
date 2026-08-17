<template>
  <header class="console-overview" aria-label="Nexus Console overview">
    <div class="console-overview__portrait">
      <img
        class="console-overview__avatar"
        :src="avatarUrl"
        :alt="`${config.owner} GitHub avatar`"
        decoding="async"
      />
    </div>

    <div class="console-overview__dashboard">
      <section class="console-overview__section console-overview__section--lead">
        <div class="console-overview__section-title">SITE</div>
        <div class="console-overview__title-line">
          <strong>&gt;_ {{ config.title }}</strong>
          <span class="console-overview__ready">READY</span>
        </div>
        <p>{{ config.subtitle || config.description }}</p>
        <p class="console-overview__description">{{ config.description }}</p>
      </section>

      <section class="console-overview__section">
        <div class="console-overview__section-title">WORKSPACE</div>
        <dl class="console-overview__rows">
          <div><dt>owner</dt><dd>{{ config.owner }}</dd></div>
          <div><dt>repository</dt><dd><a :href="repositoryUrl" target="_blank" rel="noopener noreferrer">{{ config.githubUser }}/{{ config.githubRepo }}</a></dd></div>
          <div><dt>route</dt><dd><code>{{ route.fullPath || '/' }}</code></dd></div>
          <div><dt>site</dt><dd><a :href="config.siteUrl" target="_blank" rel="noopener noreferrer">{{ config.siteUrl }}</a></dd></div>
          <div><dt>layout</dt><dd>desktop / nexus-console</dd></div>
        </dl>
      </section>

      <section class="console-overview__section">
        <div class="console-overview__section-title">CONTENT</div>
        <div class="console-overview__stats">
          <RouterLink v-for="stat in stats" :key="stat.key" :to="stat.path">
            <span>{{ stat.label }}</span>
            <strong>{{ stat.value ?? '...' }}</strong>
            <code>{{ stat.path }}</code>
          </RouterLink>
        </div>
        <dl class="console-overview__rows console-overview__rows--compact">
          <div><dt>indexed entries</dt><dd>{{ contentSummary.entries }}</dd></div>
          <div><dt>document words</dt><dd>{{ formattedWords }}</dd></div>
          <div><dt>reading time</dt><dd>{{ formattedReadingMinutes }} min</dd></div>
          <div><dt>latest content</dt><dd>{{ contentSummary.latest || 'n/a' }}</dd></div>
        </dl>
      </section>

      <section class="console-overview__section">
        <div class="console-overview__section-title">CONTACT</div>
        <dl class="console-overview__rows">
          <div><dt>email</dt><dd><a :href="`mailto:${config.email}`">{{ config.email }}</a></dd></div>
          <div><dt>github</dt><dd><a :href="githubProfileUrl" target="_blank" rel="noopener noreferrer">{{ githubProfileUrl }}</a></dd></div>
          <div v-for="link in config.links" :key="link.url"><dt>{{ link.label }}</dt><dd><a :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.url }}</a></dd></div>
        </dl>
      </section>

      <section class="console-overview__section">
        <div class="console-overview__section-title">RUNTIME</div>
        <dl class="console-overview__rows">
          <div><dt>started</dt><dd>{{ config.startedAt }}</dd></div>
          <div class="console-overview__uptime"><dt>uptime</dt><dd>{{ uptime.days }}d {{ uptime.hours }}h {{ uptime.minutes }}m {{ uptime.seconds }}s</dd></div>
          <div class="console-overview__copyright"><dt>copyright</dt><dd>{{ footerMeta.copyrightText }}</dd></div>
          <div class="console-overview__icp"><dt>icp</dt><dd><a v-if="footerMeta.icp" :href="footerMeta.icp.href" target="_blank" rel="noopener noreferrer">{{ footerMeta.icp.text }}</a><span v-else>not configured</span></dd></div>
        </dl>
      </section>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useSiteOverview } from '../../composables/useSiteOverview'
import { getGitHubAvatarUrl } from '../../utils/githubAvatar'

const route = useRoute()
const {
  config,
  stats,
  contentSummary,
  footerMeta,
  uptime,
  repositoryUrl,
  githubProfileUrl,
} = useSiteOverview()
const avatarUrl = `${getGitHubAvatarUrl(config.githubUser)}?size=1024`
const numberFormatter = new Intl.NumberFormat('en-US')
const formattedWords = computed(() => numberFormatter.format(contentSummary.value.totalWords))
const formattedReadingMinutes = computed(() => numberFormatter.format(contentSummary.value.readingMinutes))
</script>

<style scoped>
.console-overview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  box-sizing: border-box;
  width: 100%;
  min-height: min(620px, calc(100vh - 94px));
  margin: 0;
  border-top: 1px solid var(--console-border-strong);
  border-bottom: 1px solid var(--console-border-strong);
  color: var(--console-text);
  background: var(--console-bg);
  font-family: var(--console-font);
}

.console-overview__portrait {
  position: relative;
  display: block;
  min-width: 0;
  min-height: 360px;
  align-self: stretch;
  overflow: hidden;
  border-right: 1px solid var(--console-border-strong);
  background: var(--console-surface);
}

.console-overview__avatar {
  position: sticky;
  top: 0;
  display: block;
  width: 100%;
  height: auto;
  max-height: none;
  object-fit: contain;
  filter: grayscale(1);
  image-rendering: auto;
}

.console-overview__dashboard {
  min-width: 0;
  padding: 18px 20px 20px;
}

.console-overview__section + .console-overview__section {
  margin-top: 15px;
  padding-top: 12px;
  border-top: 1px solid var(--console-border);
}

.console-overview__section-title {
  margin-bottom: 7px;
  color: var(--console-accent);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0;
}

.console-overview__title-line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.console-overview__title-line strong {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 1.35rem;
}

.console-overview__ready {
  flex: 0 0 auto;
  color: var(--console-accent);
  font-size: 0.72rem;
  font-weight: 800;
}

.console-overview p {
  margin: 5px 0 0;
  color: var(--console-muted);
  font-size: 0.82rem;
  line-height: 1.45;
}

.console-overview__description {
  color: var(--console-dim) !important;
}

.console-overview__rows {
  display: grid;
  gap: 4px;
  margin: 0;
  font-size: 0.76rem;
}

.console-overview__rows div {
  display: grid;
  grid-template-columns: minmax(92px, 0.32fr) minmax(0, 1fr);
  gap: 12px;
}

.console-overview__rows dt {
  color: var(--console-dim);
}

.console-overview__rows dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}

.console-overview__rows--compact {
  margin-top: 9px;
}

.console-overview__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid var(--console-border);
  border-left: 1px solid var(--console-border);
}

.console-overview__stats a {
  display: grid;
  min-width: 0;
  min-height: 62px;
  padding: 7px 8px;
  border-right: 1px solid var(--console-border);
  border-bottom: 1px solid var(--console-border);
  color: var(--console-muted);
  text-decoration: none;
}

.console-overview__stats a:hover,
.console-overview__stats a:focus-visible {
  color: var(--console-text);
  background: var(--console-selection);
  outline: 1px solid var(--console-border-strong);
  outline-offset: -1px;
}

.console-overview__stats span,
.console-overview__stats code {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.66rem;
}

.console-overview__stats strong {
  color: var(--console-accent);
  font-size: 1.05rem;
  line-height: 1.1;
}

.console-overview a {
  color: inherit;
}

.console-overview a:hover,
.console-overview a:focus-visible {
  color: var(--console-accent);
}

@media (min-width: 901px) and (max-width: 1100px) {
  .console-overview__dashboard {
    padding: 14px;
  }

  .console-overview__portrait {
    min-height: 330px;
  }

  .console-overview__section + .console-overview__section {
    margin-top: 10px;
    padding-top: 9px;
  }

  .console-overview__rows {
    font-size: 0.7rem;
  }

  .console-overview__rows div {
    grid-template-columns: 84px minmax(0, 1fr);
    gap: 8px;
  }
}
</style>
