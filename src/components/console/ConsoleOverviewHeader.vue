<template>
  <header class="console-overview" aria-label="Nexus Console overview">
    <button
      class="console-overview__portrait"
      type="button"
      :aria-label="t('console.overview.iconCycle', { form: iconForm })"
      :title="t('console.overview.iconForm', { form: iconForm })"
      @click="cycleIconForm()"
    >
      <img
        class="console-overview__avatar"
        :class="`console-overview__avatar--${iconForm}`"
        :src="avatarUrl"
        :alt="`${config.owner} Console icon`"
        decoding="async"
      />
    </button>

    <div class="console-overview__dashboard">
      <div class="console-overview__chrome">
        <div class="console-overview__brand">
          <span aria-hidden="true">&gt;_</span>
          <strong>{{ config.title }}</strong>
        </div>
        <button
          class="console-button"
          type="button"
          aria-label="Switch to classic mode"
          title="Switch to classic mode"
          @click="setDisplayMode('standard')"
        >classic</button>
      </div>

      <section class="console-overview__section">
        <div class="console-overview__section-title">LINKS</div>
        <dl class="console-overview__rows console-overview__links">
          <div><dt>github</dt><dd><a :href="githubProfileUrl" target="_blank" rel="noopener noreferrer">{{ githubProfileUrl }}</a></dd></div>
          <div><dt>template</dt><dd><a :href="repositoryUrl" target="_blank" rel="noopener noreferrer">{{ repositoryUrl }}</a></dd></div>
        </dl>
      </section>

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
          <div class="console-overview__copyright"><dt>copyright</dt><dd>&copy; {{ footerMeta.copyrightYear }} <a class="console-overview__owner" :href="footerMeta.githubProfileUrl" target="_blank" rel="noopener noreferrer">{{ footerMeta.displayName }}</a></dd></div>
          <div class="console-overview__icp"><dt>icp</dt><dd><a v-if="footerMeta.icp" :href="footerMeta.icp.href" target="_blank" rel="noopener noreferrer">{{ footerMeta.icp.text }}</a><span v-else>not configured</span></dd></div>
        </dl>
      </section>
    </div>
  </header>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSiteOverview } from '../../composables/useSiteOverview'
import { useDisplayModePreference } from '../../composables/useDisplayModePreference'
import { useConsoleIconPreference } from '../../composables/useConsoleIconPreference'
import { getGitHubAvatarUrl } from '../../utils/githubAvatar'

const { t } = useI18n()
const {
  config,
  stats,
  footerMeta,
  uptime,
  githubProfileUrl,
  repositoryUrl,
} = useSiteOverview()
const { setDisplayMode } = useDisplayModePreference()
const { iconForm, cycleIconForm } = useConsoleIconPreference()
const configuredIcon = String(config.console?.icon || '').trim()
const avatarUrl = configuredIcon || `${getGitHubAvatarUrl(config.githubUser)}?size=1024`
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
  display: grid;
  place-items: center;
  min-width: 0;
  height: 100%;
  min-height: 0;
  align-self: stretch;
  overflow: clip;
  padding: 0;
  border: 0;
  border-right: 1px solid var(--console-border-strong);
  /* The plate reads as part of the banner, not as a panel laid on it, so it
     takes the page background in both themes rather than the raised surface. */
  background: var(--console-bg);
  /* It is a button so the form can be cycled by clicking the artwork itself,
     which is the whole affordance — the plate must still look like a plate. */
  color: inherit;
  font: inherit;
  cursor: pointer;
}

/* Console mode draws no rules, so the plate marks hover and focus the way every
   other console control does — by shifting its fill rather than ringing itself.
   Only the sliver of plate around the inset artwork carries the shift, which is
   enough to place the cursor without putting a line back on the page. */
.console-overview__portrait:hover,
.console-overview__portrait:focus-visible {
  background: var(--console-control-strong);
  outline: none;
}

.console-overview__avatar {
  /* The inset of the artwork inside its plate, and the pixel size the coarse form
     resamples to. Two numbers, so a fork retunes both from here. */
  --console-icon-inset: 94%;
  --console-icon-pixel: 14;
  display: block;
  /*
   * The plate is sized by the banner row; only the artwork inside it is inset.
   * Resizing the icon therefore cannot move the column edges. Centring the box
   * splits the remaining sliver evenly instead of pooling it on two sides.
   */
  width: var(--console-icon-inset);
  height: var(--console-icon-inset);
  max-height: none;
  object-fit: contain;
  filter: none;
  image-rendering: auto;
}

/*
 * The four forms `/icon` and the plate itself cycle. They answer in either theme,
 * so none of them may depend on one — which the silhouette does, and resolves by
 * inverting per theme rather than by switching itself off.
 */
.console-overview__avatar--grayscale {
  filter: grayscale(1);
}

.console-overview__avatar--original {
  filter: none;
}

/* Flat ink, drawn in whichever direction the page background is not. */
.console-overview__avatar--whiten {
  filter: brightness(0) invert(1);
}

:global(html[data-theme="light"]) .console-overview__avatar--whiten {
  filter: brightness(0);
}

/*
 * Pixelation has no CSS primitive. The artwork is laid out at a fraction of its
 * footprint so the browser downsamples it, then scaled back to full size with
 * nearest-neighbour sampling — the divisor is therefore the pixel size. The plate
 * centres the box, so scaling from the centre lands it back where it started.
 */
.console-overview__avatar--pixelated {
  width: calc(var(--console-icon-inset) / var(--console-icon-pixel));
  height: calc(var(--console-icon-inset) / var(--console-icon-pixel));
  transform: scale(var(--console-icon-pixel));
  image-rendering: pixelated;
}

.console-overview__dashboard {
  display: flex;
  flex-direction: column;
  /*
   * The sections sit at their own margins rather than being spread to fill the
   * banner. `space-between` used to distribute the slack between them, which made
   * the gaps a function of how much the banner happened to be taller than its
   * contents — so trimming a row widened every gap instead of tightening the
   * column. Pooling the slack after the last section keeps the spacing below the
   * property of the margins alone.
   */
  justify-content: flex-start;
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

.console-overview__section {
  margin-right: 20px;
  margin-left: 20px;
}

.console-overview__chrome + .console-overview__section {
  margin-top: 9px;
}

.console-overview__section + .console-overview__section {
  margin-top: 8px;
  margin-bottom: 8px;
  padding-top: 8px;
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

/* URLs are long enough to wrap the row in two; the banner has a fixed height, so
   they are truncated instead of allowed to push the sections below out of it. */
.console-overview__links dd {
  overflow: hidden;
  overflow-wrap: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
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
