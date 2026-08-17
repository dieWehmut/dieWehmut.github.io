<template>
  <header class="console-overview" aria-label="Nexus Console overview">
    <div class="console-overview__portrait">
      <img
        class="console-overview__avatar"
        :class="`console-overview__avatar--${darkIconEffect}`"
        :src="avatarUrl"
        :alt="`${config.owner} Console icon`"
        decoding="async"
      />
    </div>

    <div class="console-overview__dashboard">
      <div class="console-overview__chrome">
        <div class="console-overview__brand">
          <span aria-hidden="true">&gt;_</span>
          <strong>{{ config.title }}</strong>
        </div>
        <button
          class="console-overview__classic"
          type="button"
          aria-label="Switch to classic mode"
          title="Switch to classic mode"
          @click="setDisplayMode('standard')"
        >classic</button>
      </div>

      <section class="console-overview__section">
        <div class="console-overview__section-title">CONTENT</div>
        <div class="console-overview__stats">
          <RouterLink v-for="stat in stats" :key="stat.key" :to="stat.path">
            <span>{{ stat.label }}</span>
            <strong>{{ stat.value ?? '...' }}</strong>
          </RouterLink>
        </div>
      </section>

      <section class="console-overview__section">
        <div class="console-overview__section-title">RUNTIME</div>
        <dl class="console-overview__rows">
          <div class="console-overview__uptime"><dt>uptime</dt><dd>{{ uptime.days }}d {{ uptime.hours }}h {{ uptime.minutes }}m {{ uptime.seconds }}s</dd></div>
          <div><dt>theme</dt><dd>{{ theme }}</dd></div>
          <div><dt>color</dt><dd>{{ colorScheme }}</dd></div>
          <div class="console-overview__copyright"><dt>copyright</dt><dd>&copy; {{ footerMeta.copyrightYear }} <a class="console-overview__owner" :href="footerMeta.githubProfileUrl" target="_blank" rel="noopener noreferrer">{{ footerMeta.displayName }}</a></dd></div>
          <div class="console-overview__icp"><dt>icp</dt><dd><a v-if="footerMeta.icp" :href="footerMeta.icp.href" target="_blank" rel="noopener noreferrer">{{ footerMeta.icp.text }}</a><span v-else>not configured</span></dd></div>
        </dl>
      </section>
    </div>
  </header>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useSiteOverview } from '../../composables/useSiteOverview'
import { useDisplayModePreference } from '../../composables/useDisplayModePreference'
import { useThemePreference } from '../../composables/useThemePreference'
import { useColorSchemePreference } from '../../composables/useColorSchemePreference'
import { getGitHubAvatarUrl } from '../../utils/githubAvatar'

const {
  config,
  stats,
  footerMeta,
  uptime,
} = useSiteOverview()
const { setDisplayMode } = useDisplayModePreference()
const { theme } = useThemePreference()
const { colorScheme } = useColorSchemePreference()
const configuredIcon = String(config.console?.icon || '').trim()
const avatarUrl = configuredIcon || `${getGitHubAvatarUrl(config.githubUser)}?size=1024`
const darkIconEffect = ['grayscale', 'whiten', 'original'].includes(config.console?.darkIconEffect || '')
  ? config.console?.darkIconEffect
  : 'grayscale'
</script>

<style scoped>
.console-overview {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  box-sizing: border-box;
  width: 100%;
  height: min(33.333333vw, max(240px, calc(100dvh - 140px)));
  min-height: 0;
  margin: 0;
  aspect-ratio: 3 / 1;
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
  height: 100%;
  min-height: 0;
  align-self: stretch;
  overflow: clip;
  border-right: 1px solid var(--console-border-strong);
  background: var(--console-canvas, var(--console-surface));
}

.console-overview__avatar {
  display: block;
  width: 100%;
  height: 100%;
  max-height: none;
  object-fit: contain;
  object-position: left top;
  filter: none;
  image-rendering: auto;
}

:global(html[data-theme="light"]) .console-overview__avatar {
  filter: none;
}

:global(html[data-theme="dark"]) .console-overview__avatar--grayscale {
  filter: grayscale(1);
}

:global(html[data-theme="dark"]) .console-overview__avatar--whiten {
  filter: brightness(0) invert(1);
}

:global(html[data-theme="dark"]) .console-overview__avatar--original {
  filter: none;
}

.console-overview__dashboard {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
  min-width: 0;
  height: 100%;
  padding: 0;
  overflow-y: auto;
}

.console-overview__chrome {
  display: flex;
  flex: 0 0 40px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  padding: 0 20px;
  border-bottom: 1px solid var(--console-border);
}

.console-overview__brand {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 9px;
}

.console-overview__brand span {
  color: var(--console-accent);
  font-weight: 800;
}

.console-overview__brand strong {
  overflow: hidden;
  color: var(--console-text);
  font-size: 0.78rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.console-overview__classic {
  min-height: 26px;
  padding: 3px 8px;
  border: 1px solid var(--console-border-strong);
  border-radius: 0;
  color: var(--console-muted);
  background: transparent;
  font: inherit;
}

.console-overview__classic:hover,
.console-overview__classic:focus-visible {
  color: var(--console-accent);
  background: var(--console-selection);
  outline: none;
}

.console-overview__section {
  margin-right: 20px;
  margin-left: 20px;
}

.console-overview__chrome + .console-overview__section {
  margin-top: 12px;
}

.console-overview__section + .console-overview__section {
  margin-top: 15px;
  margin-bottom: 16px;
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

.console-overview__owner {
  color: inherit;
  text-decoration: none;
}

.console-overview__owner:hover,
.console-overview__owner:focus-visible {
  color: var(--console-accent);
  text-decoration: underline;
  outline: none;
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

.console-overview__stats span {
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
    padding: 0;
  }

  .console-overview__chrome {
    flex-basis: 34px;
    padding: 0 12px;
  }

  .console-overview__section {
    margin-right: 12px;
    margin-left: 12px;
  }

  .console-overview__chrome + .console-overview__section {
    margin-top: 6px;
  }

  .console-overview__section + .console-overview__section {
    margin-top: 6px;
    margin-bottom: 6px;
    padding-top: 6px;
  }

  .console-overview__rows {
    gap: 2px;
    font-size: 0.66rem;
  }

  .console-overview__rows div {
    grid-template-columns: 84px minmax(0, 1fr);
    gap: 8px;
  }

  .console-overview__section-title {
    margin-bottom: 4px;
  }

  .console-overview__stats a {
    min-height: 50px;
    padding: 4px 6px;
  }
}
</style>
