<template>
  <section class="about-view page-surface">
    <PageHeading title="About" :icon="User" />

    <div class="about-card">
      <img class="about-card__avatar" :src="avatarUrl" alt="avatar" />
      <div class="about-card__body">
        <h2>{{ displayName }}</h2>
        <p class="about-card__bio" v-html="bioHtml" />
      </div>
    </div>

    <dl class="about-meta">
      <div>
        <dt>Latest commit</dt>
        <dd>{{ lastUpdated }}</dd>
      </div>
    </dl>

    <section class="about-contact">
      <h3>Contact Me</h3>
      <div class="about-contact__links">
        <a :href="githubUrl" target="_blank" rel="noopener noreferrer">
          <el-icon><Link /></el-icon>
          <span>GitHub</span>
        </a>
        <a :href="`mailto:${siteProfile.email}`">
          <el-icon><Message /></el-icon>
          <span>Email</span>
        </a>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { User, Link, Message } from '@element-plus/icons-vue'
import PageHeading from '../components/content/PageHeading.vue'
import { useProfile } from '../composables/useProfile'
import { siteProfile } from '../data'

const { avatarUrl, displayName, lastUpdated, githubUrl } = useProfile()

const bio = `A developer, tinkerer, and lifelong learner.

Building things for the web, exploring infrastructure, and writing about technology, languages, and the occasional stray thought.`

const bioHtml = computed(() =>
  bio
    .split('\n\n')
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('')
)
</script>

<style scoped>
.about-card {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 24px 0 34px;
  border-bottom: 1px solid var(--site-border);
}

.about-card__avatar {
  flex-shrink: 0;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  object-fit: cover;
}

h2 {
  margin: 0;
  color: var(--site-text);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 36px;
}

.about-card__bio :deep(p) {
  margin: 10px 0 0;
  max-width: 640px;
  color: var(--site-muted);
  font-size: 17px;
  line-height: 1.7;
}

.about-meta {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin: 28px 0;
}

.about-meta > div {
  padding: 14px;
  border: 1px solid var(--site-border);
  border-radius: 8px;
}

dt {
  color: var(--site-muted);
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

dd {
  margin: 6px 0 0;
  color: var(--site-text);
  font-weight: 800;
}

.about-contact {
  margin-top: 34px;
}

h3 {
  margin: 0 0 14px;
  color: var(--site-text);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 24px;
}

.about-contact__links {
  display: flex;
  gap: 14px;
}

.about-contact__links a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  color: var(--site-text);
  text-decoration: none;
  font-weight: 800;
  transition: color 160ms ease, border-color 160ms ease;
}

.about-contact__links a:hover,
.about-contact__links a:focus-visible {
  color: var(--site-accent);
  border-color: rgba(31, 196, 31, 0.45);
  outline: none;
}

.about-contact__links .el-icon {
  font-size: 18px;
}

@media (max-width: 640px) {
  .about-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .about-card__avatar {
    width: 112px;
    height: 112px;
  }
}
</style>
