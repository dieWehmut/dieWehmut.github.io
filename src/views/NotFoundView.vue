<template>
  <section class="not-found page-surface">
    <div v-if="isConsole" class="console-not-found" aria-live="polite">
      <div class="console-not-found__status">
        <code>404</code>
        <strong>route not found</strong>
      </div>
      <p>The requested path is not registered in this workspace.</p>
      <RouterLink class="console-not-found__link" to="/home">/home</RouterLink>
    </div>
    <template v-else>
      <PageHeading title="Not Found" :icon="Warning" />
      <RouterLink class="not-found__link" to="/home">Return home</RouterLink>
    </template>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { Warning } from '@element-plus/icons-vue'
import PageHeading from '../components/content/PageHeading.vue'
import { useDisplayModePreference } from '../composables/useDisplayModePreference'

const { isConsole } = useDisplayModePreference()
</script>

<style scoped>
.console-not-found {
  display: grid;
  gap: 12px;
  color: var(--console-text, var(--site-text));
  font-family: var(--console-font, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
}

.console-not-found__status {
  display: flex;
  align-items: baseline;
  gap: 14px;
  min-height: 42px;
  padding: 8px 0;
  border-top: 1px solid var(--console-border, var(--site-border));
  border-bottom: 1px solid var(--console-border, var(--site-border));
}

.console-not-found__status code {
  color: var(--console-accent, var(--site-accent));
  font: inherit;
  font-weight: 700;
}

.console-not-found__status strong {
  font-weight: 600;
}

.console-not-found p {
  margin: 0;
  color: var(--console-muted, var(--site-muted));
}

.console-not-found__link {
  width: fit-content;
  min-height: 34px;
  padding: 6px 9px;
  border: 1px solid var(--console-border-strong, var(--site-accent));
  color: var(--console-accent, var(--site-accent));
  text-decoration: none;
}

.console-not-found__link:hover,
.console-not-found__link:focus-visible {
  color: var(--console-text, var(--site-text));
  background: var(--console-selection, transparent);
  outline: none;
}

@media (max-width: 900px) {
  .console-not-found {
    display: none;
  }
}

.not-found__link {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  padding: 0 16px;
  border: 1px solid rgb(var(--site-accent-rgb) / 0.4);
  border-radius: 8px;
  color: var(--site-accent);
  font-weight: 800;
  text-decoration: none;
}
</style>
