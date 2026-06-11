<template>
  <section class="about-view page-surface">
    <div class="about-layout">
      <div class="about-content">
        <div class="about-contact">
          <h2 id="contact-me">Contact Me</h2>
          <div class="about-contact__list">
            <div class="about-contact__item">
              <div class="about-contact__label">
                <svg class="about-contact__icon about-contact__icon--github" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                <span>GitHub</span>
              </div>
              <a :href="`https://github.com/${siteConfig.githubUser}`" target="_blank" rel="noopener">
                https://github.com/{{ siteConfig.githubUser }}
              </a>
            </div>
            <div class="about-contact__divider"></div>
            <div class="about-contact__item">
              <div class="about-contact__label">
                <el-icon class="about-contact__icon about-contact__icon--email"><Message /></el-icon>
                <span>Email</span>
              </div>
              <a :href="`mailto:${siteConfig.email}`">
                {{ siteConfig.email }}
              </a>
            </div>
          </div>
        </div>

        <MarkdownContent class="markdown-body" :source="aboutRaw" />
      </div>

      <ScrollSpySidebar class="about-aside" root-selector=".about-content" heading-selector="h2" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { Message } from '@element-plus/icons-vue'
import MarkdownContent from '../components/content/MarkdownContent.vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import { siteConfig } from '../data/site/config'
import aboutRaw from '../data/site/about.md?raw'
</script>

<style scoped>
.about-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--site-scroll-spy-width);
  gap: var(--site-view-aside-gap);
  align-items: start;
}

.about-content {
  min-width: 0;
}

.about-aside {
  align-self: start;
}

.about-contact {
  margin-bottom: 48px;
}

.about-contact h2 {
  font-size: 1.5em;
  font-weight: 700;
  margin-bottom: 20px;
  color: var(--site-text);
}

.about-contact__list {
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.about-contact__item {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 18px 0;
  font-size: 15px;
}

.about-contact__label {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 140px;
  color: var(--site-text);
  font-weight: 500;
  font-size: 16px;
}

.about-contact__divider {
  height: 1px;
  background: var(--site-border, rgba(255, 255, 255, 0.12));
}

.about-contact__item a {
  color: var(--site-accent, #1fc41f);
  text-decoration: none;
  transition: opacity 0.2s;
}

.about-contact__item a:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.about-contact__icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  color: var(--site-muted, #999);
}

.about-contact__icon--email {
  width: 22px;
  height: 22px;
  font-size: 22px;
}

.about-contact__item {
  cursor: var(--cursor-pointer);
}

.about-contact__item a {
  cursor: var(--cursor-pointer);
}

.about-content :deep(h2) {
  font-size: 1.5em;
  font-weight: 700;
  margin-top: 40px;
  margin-bottom: 16px;
  color: var(--site-text);
}

.about-content :deep(p) {
  color: var(--site-muted, #aaa);
  line-height: 1.8;
  margin-bottom: 12px;
}

.about-content :deep(a) {
  color: var(--site-accent, #1fc41f);
  text-decoration: none;
}

.about-content :deep(a:hover) {
  text-decoration: underline;
  opacity: 0.85;
}

@media (max-width: 900px) {
  .about-layout {
    grid-template-columns: 1fr;
  }

  .about-aside {
    display: none;
  }
}
</style>
