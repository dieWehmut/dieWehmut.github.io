<template>
  <div class="doc-loading" role="status" aria-live="polite">
    <span class="doc-loading__spinner" aria-hidden="true" />
    <span class="doc-loading__text"><slot /></span>
  </div>
</template>

<style scoped>
.doc-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 22px;
  margin-top: 18px;
  color: var(--site-muted);
  font-size: 15px;
  font-weight: 700;
}

.doc-loading__spinner {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--site-accent) 20%, transparent);
  border-top-color: var(--site-accent);
  animation: doc-loading-spin 760ms linear infinite;
}

.doc-loading__text {
  line-height: 1;
}

@keyframes doc-loading-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .doc-loading__spinner {
    animation-duration: 2s;
  }
}
</style>
