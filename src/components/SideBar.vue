<template>
  <nav class="sidebar" :class="{ 'entering': enterReady }" aria-label="目录">
    <!-- About Me Section -->
    <div class="about-me">
      <div class="avatar-container">
        <img :src="avatarUrl" alt="Avatar" class="avatar" />
      </div>
      <div class="about-content">
            <h3 class="name">{{ displayName }}</h3>

          <!-- Contact / GitHub block -->
          <div class="contact">
            <a class="github-btn" :href="githubUrl" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <!-- GitHub icon (simple) -->
              <span class="icon github-icon" aria-hidden="true">
                <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.56 7.56 0 018 4.6c.68.003 1.36.092 1.99.27 1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              </span>
              <span class="github-text">GitHub</span>
            </a>




            <div class="contact-meta">
              <div class="meta-item">
                <svg class="icon icon--mail" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                <a class="email-link" href="mailto:diesehnsucht0@gmail.com">diesehnsucht0@gmail.com</a>
              </div>
              <div class="meta-item last-updated-row" v-if="lastUpdated">
                  <svg class="icon icon--clock" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm1 11.59V7a1 1 0 00-2 0v6a1 1 0 00.29.71l3 3a1 1 0 001.41-1.41z" />
                  </svg>
                  <!-- Wrap label and time into a single content container so grid can align
                       the text column; this ensures when the time wraps it aligns with the
                       label's left edge (not with the icon). -->
                  <div class="last-updated-content">
                    <span class="last-updated-label">{{ t('sidebar.lastUpdated') }}</span>
                    <span class="last-updated">{{ lastUpdated }}</span>
                  </div>
                </div>
            </div>
          </div>
      </div>
    </div>

    <!-- Navigation buttons moved to search area; keep markup disabled here to avoid duplication -->
    <nav class="nav-list" aria-label="sections" v-if="false">
      <ul>
        <li><button class="nav-btn" @click="go('pages')">{{ t('nav.pages') }}</button></li>
        <li><button class="nav-btn" @click="go('tools')">{{ t('nav.tools') }}</button></li>
        <li><button class="nav-btn" @click="go('games')">{{ t('nav.games') }}</button></li>
        <li><button class="nav-btn" @click="go('apps')">{{ t('nav.apps') }}</button></li>
        <li><button class="nav-btn" @click="go('files')">{{ t('nav.files') }}</button></li>
      </ul>
    </nav>
  </nav>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useProfile } from '../composables/useProfile';
const props = defineProps({ enterReady: { type: Boolean, default: true } });
import { useI18n } from 'vue-i18n';

const { avatarUrl, displayName, lastUpdated, githubUrl } = useProfile();

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const headerOffset = 90; // header height + a little spacing
  const rect = el.getBoundingClientRect();
  const docTop = window.pageYOffset || document.documentElement.scrollTop;
  const top = rect.top + docTop - headerOffset;
  window.scrollTo({ top, behavior: 'smooth' });
}

function go(name) {
  const map = {
    pages: 'section-pages',
    games: 'section-games',
    apps: 'section-apps',
    tools: 'section-tools',
    files: 'section-files',
  };
  const id = map[name];
  if (!id) return;
  try {
    window.dispatchEvent(new CustomEvent('open-section', { detail: name }));
  } catch (e) {}
  setTimeout(() => scrollToSection(id), 120);
}


const { t } = useI18n();

// responsive flag: hide nav buttons in sidebar on mobile (match CSS breakpoint)
const isMobile = ref(false);
onMounted(() => {
  const mq = window.matchMedia('(max-width: 1000px)');
  const update = () => (isMobile.value = mq.matches);
  update();
  if (mq.addEventListener) mq.addEventListener('change', update);
  else mq.addListener(update);
});
</script>

<style scoped>
/* entry animation: hidden until .entering is applied */
.sidebar {
  transition: opacity 460ms cubic-bezier(.16,.9,.2,1), transform 460ms cubic-bezier(.16,.9,.2,1);
  will-change: opacity, transform;
  position: fixed;
  left: calc(-1 * var(--sidebar-left-gap, 32px));
  top: 0;
  bottom: 0;
  height: 100vh;
  overflow: auto;
  z-index: 1100;
}

.sidebar:not(.entering) {
  opacity: 0;
  transform: translateX(-12px);
  pointer-events: none;
}

.sidebar.entering {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.sidebar {
  /* participate in layout (sticky) so left+main(+right) align as a group */
  position: fixed;
  left: 0;
  /* pin sidebar to the top of the viewport and fill height */
  top: 0;
  bottom: 0;
  width: var(--sidebar-width, 300px);
  /* translucent background (lightened) to improve legibility over video without being too dark */
  background: rgba(0,0,0,0.30) !important;
  border: 1px solid rgba(255,255,255,0.04) !important;
  border-radius: 14px;
  padding: 14px 18px;
  /* ensure all content is visible and the sidebar fills viewport height */
  overflow: auto;
  max-height: 100vh;
  /* push shadow to left only so right edge appears flush with main content */
  box-shadow: none !important;
  z-index: 1100;
  /* pull the sidebar flush to the left edge of the page */
  margin-left: 0;
  /* remove right side rounding so it can visually butt up against the main content */
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  /* remove right border so there's no visible seam; keep left/top/bottom border */
  border-right: none;
  /* ensure no extra gap on the right */
  margin-right: 0;
}

/* Collapsed sidebar state: triggered by adding `sidebar-collapsed` to <html>
   Hide sidebar fully (no visible sliver or shadow) while keeping layout vars adjusted. */
html.sidebar-collapsed .sidebar {
  width: 0 !important;
  padding: 0 !important;
  margin-left: calc(-1 * var(--sidebar-left-gap, 32px));
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
  overflow: hidden !important;
  transform: translateX(-110%) !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

/* hide text content so only a small avatar/icon remains */
html.sidebar-collapsed .about-content,
html.sidebar-collapsed .name,
html.sidebar-collapsed .contact,
html.sidebar-collapsed .nav-list,
html.sidebar-collapsed .follow-row,
html.sidebar-collapsed .contact-meta,
html.sidebar-collapsed .last-updated-content,
html.sidebar-collapsed .meta-item .email-link,
html.sidebar-collapsed .label,
html.sidebar-collapsed .follow-text {
  display: none !important;
}

/* reduce avatar to a compact icon */
html.sidebar-collapsed .avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  box-shadow: none;
}

.about-me {
  margin-bottom: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-container {
  margin-bottom: 8px;
}

.avatar {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  box-shadow: 0 8px 20px rgba(64,158,255,0.12);
  transition: transform 260ms cubic-bezier(.2,.9,.2,1), box-shadow 260ms ease, filter 260ms ease;
  will-change: transform, box-shadow;
}

/* 悬浮时有轻微抬起、放大和光泽效果（仅对支持悬浮的设备） */
@media (hover: hover) {
  .avatar:hover {
    transform: translateY(-8px) scale(1.03) rotate(-0.6deg);
    box-shadow: 0 18px 42px rgba(20,40,80,0.38);
    filter: saturate(1.05) contrast(1.03);
  }
}

.about-content {
  padding: 0 8px;
  /* keep about text tidy and readable */
  max-width: 240px;
  margin: 0 auto;
  text-align: center;
}

.name {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff !important;
  margin: 8px 0 6px 0;
  text-align: center;
}

.exposed-section h4 {
  font-size: 14px;
  color: #333;
  margin-bottom: 6px;
  font-weight: 600;
}

.tech-list {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
}

.tech-list li {
  font-size: 12px;
  color: #666;
  line-height: 1.6;
  padding: 1px 0;
}

.nav-list {
  margin-top: 12px;
}
.nav-list ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: row; /* horizontal buttons */
  gap: 8px;
  align-items: center;
  flex-wrap: wrap; /* allow buttons to wrap to next line when space is limited */
}
.nav-list li {
  width: auto;
  flex: 0 0 auto; /* keep natural button width and allow wrapping */
}
.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center; /* center for horizontal buttons */
  gap: 8px;
  width: 100%;
  background: transparent;
  border: none;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  color: #ffffff !important;
  text-align: left;
}
.nav-btn:hover,
.nav-btn:focus {
  background: rgba(255,255,255,0.04) !important;
  outline: none;
}
.nav-btn:focus-visible {
  box-shadow: 0 0 0 3px rgba(64,158,255,0.14);
}

/* Contact block */
.contact {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  text-align: center;
}
  .github-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center; /* center content inside button */
  gap: 3px;
  /* 黑色半透明背景，默认在侧边栏上更耐看 */
  background: rgba(0,0,0,0.36) !important;
  color: #ffffff !important;
  padding: 7px 12px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 700;
  width: 100%; /* fill container so text centering is visible */
  box-sizing: border-box;
  transition: background 180ms ease, transform 160ms cubic-bezier(.2,.9,.2,1);
}

/* 悬浮时变为无色透明，保持图标与文字颜色不变并稍微抬起 */
@media (hover: hover) {
  .github-btn:hover,
  .github-btn:focus {
    background: transparent !important;
    transform: translateY(-4px);
    outline: none;
  }
}
.github-btn .icon {
  display: inline-flex;
  align-items: center;
}
.github-btn .follower {
  margin-left: auto;
  background: transparent !important;
  padding: 2px 6px;
  border-radius: 999px;
  font-weight: 600;
}
.follow-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(255,255,255,0.92) !important;
  font-size: 13px;
}
.follow-text {
  color: rgba(255,255,255,0.92) !important;
}
.contact-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: rgba(255,255,255,0.92) !important;
  align-items: center;
  text-align: center;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}
.email-link {
  color: inherit;
  text-decoration: underline;
}

.last-updated-row {
  margin-top: 4px;
  color: rgba(255,255,255,0.85) !important;
  font-size: 13px;
  /* Use grid so icon occupies left column and text occupies right column.
     Center the whole row visually. */
  display: grid;
  grid-template-columns: 20px auto;
  column-gap: 8px;
  align-items: center;
  justify-content: center;
  width: auto;
}
.last-updated-row .icon--clock {
  width: 16px;
  height: 16px;
  fill: rgba(255,255,255,0.85) !important;
}
.last-updated-content {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap; /* let label and timestamp wrap as a unit inside the text column */
}
.last-updated {
  /* keep the timestamp as a single non-breaking unit so it never splits across lines */
  white-space: nowrap;
}
.last-updated-label {
  /* label may wrap or truncate normally */
  flex: 0 1 auto;
}

.icon {
  width: 18px;
  height: 18px;
  fill: rgba(255,255,255,0.95) !important;
  flex: 0 0 18px;
  display: inline-block;
}
.icon--people,
.icon--pin,
.icon--mail {
  width: 18px;
  height: 18px;
}

/* Responsive overrides for sidebar on small screens */
@media (max-width: 1000px) {
  .sidebar {
    position: static; /* participate in normal flow so it stacks above main */
    top: auto;
    width: 100%;
    max-width: none;
    margin-left: 0;
    margin-right: 0;
    border-top-right-radius: 14px;
    border-bottom-right-radius: 14px;
    border-right: 1px solid #eee;
    box-shadow: 0 6px 18px rgba(0,0,0,0.04);
  }

  .avatar {
    /* reduce avatar size on small screens so it doesn't dominate layout */
    width: 140px;
    height: 140px;
  }

  .about-content {
    max-width: none;
    padding: 0 8px;
  }

  .nav-list ul {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
