<template>
  <section class="about-view page-surface">
    <PageHeading title="About" :icon="User" />

    <div class="about-layout">
      <div class="about-content">
        <section id="contact-me" class="about-section">
          <h2>Contact Me</h2>
          <ul class="about-contact-list">
            <li>
              <svg class="about-contact-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              <span>GitHub</span>
              <a :href="githubUrl" target="_blank" rel="noopener noreferrer">{{ githubUrl }}</a>
            </li>
            <li>
              <el-icon class="about-contact-icon"><Message /></el-icon>
              <span>Email</span>
              <a :href="`mailto:${siteProfile.email}`">{{ siteProfile.email }}</a>
            </li>
          </ul>
        </section>

        <section id="about-blog" class="about-section">
          <h2>About This Blog</h2>
          <p>
            本站开发提取有模板，欢迎
            star:
          </p>
          <p>
            <a :href="repoUrl" target="_blank" rel="noopener noreferrer">{{ repoUrl }}</a>
          </p>
        </section>

        <section id="copyright" class="about-section">
          <h2>Copyright</h2>
          <p>本站内容除特殊说明外，默认遵循署名与非商业使用的转载约定。</p>
        </section>

        <section id="footnote" class="about-section">
          <h2>脚注</h2>
          <p>写作是一种缓慢的自我整理，也是与时间和解的方式。</p>
        </section>
      </div>

      <ScrollSpySidebar class="about-aside" root-selector=".about-content" heading-selector="h2" />
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { Message, User } from '@element-plus/icons-vue'
import PageHeading from '../components/content/PageHeading.vue'
import ScrollSpySidebar from '../components/system/ScrollSpySidebar.vue'
import { useProfile } from '../composables/useProfile'
import { siteProfile } from '../data'

const { githubUrl } = useProfile()
const repoUrl = computed(() => `${githubUrl.value}/dieWehmut.github.io`)
</script>

<style scoped>
.about-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 44px;
  align-items: start;
}

.about-content {
  min-width: 0;
}

.about-section {
  margin-top: 34px;
}

.about-section h2 {
  margin: 0 0 12px;
  color: var(--site-text);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 26px;
  scroll-margin-top: 120px;
}

.about-section p {
  margin: 0 0 14px;
  color: var(--site-muted);
  font-size: 16px;
  line-height: 1.75;
}

.about-contact-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.about-contact-icon {
  width: 18px;
  height: 18px;
  font-size: 18px;
  color: var(--site-accent);
  flex-shrink: 0;
}

.about-contact-list li {
  display: grid;
  grid-template-columns: 22px 80px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--site-border);
}

.about-contact-list li:last-child {
  border-bottom: 0;
}

.about-contact-list span {
  color: var(--site-muted);
  font-weight: 800;
}

.about-contact-list a,
.about-section a {
  color: var(--site-accent);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.about-contact-list a:hover,
.about-contact-list a:focus-visible,
.about-section a:hover,
.about-section a:focus-visible {
  text-decoration: underline;
  text-underline-offset: 3px;
  outline: none;
}

.about-aside {
  align-self: start;
}

@media (max-width: 900px) {
  .about-layout {
    grid-template-columns: 1fr;
  }

  .about-aside {
    display: none;
  }
}

@media (max-width: 640px) {
  .about-section h2 {
    font-size: 22px;
  }

  .about-contact-list li {
    grid-template-columns: 22px 1fr;
    gap: 8px;
  }

  .about-contact-list span {
    grid-column: 2;
  }

  .about-contact-list a {
    grid-column: 1 / -1;
  }
}
</style>
