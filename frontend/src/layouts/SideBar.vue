<template>
  <nav class="sidebar sticky w-[300px] !bg-black/30 !border !border-white/[0.04] rounded-3xl px-[18px] py-[14px] overflow-visible !shadow-none z-[1100] mr-0 transition-[opacity,transform] duration-[460ms] will-change-[opacity,transform]" :class="{ 'entering': enterReady }" aria-label="目录">
    <!-- About Me Section -->
    <div class="about-me mb-3 text-left flex flex-col items-start">
      <div class="avatar-container mb-2">
        <img :src="avatarUrl" alt="Avatar" class="avatar w-[240px] h-[240px] rounded-full shadow-[0_8px_20px_rgba(64,158,255,0.12)] transition-[transform,box-shadow,filter] duration-[260ms] will-change-[transform,box-shadow]" />
      </div>
      <div class="about-content px-2 max-w-[240px] m-0 text-left">
            <h3 class="name text-[28px] font-bold !text-white mt-2 mb-1.5">dieWehmut</h3>
              <p class="bio text-[13px] !text-white/[0.92] leading-[1.45] mb-3 max-w-[240px]">{{ t('sidebar.bio') }}</p>

          <!-- Contact / GitHub block -->
          <div class="contact mt-2.5 flex flex-col gap-2">
            <a class="github-btn inline-flex items-center justify-center gap-[3px] !bg-black/[0.36] !text-white px-3 py-[7px] rounded-lg no-underline font-bold w-full box-border" href="https://github.com/dieWehmut" target="_blank" rel="noopener noreferrer">
              <!-- GitHub icon (simple) -->
              <span class="icon github-icon inline-flex items-center" aria-hidden="true">
                <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.56 7.56 0 018 4.6c.68.003 1.36.092 1.99.27 1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              </span>
              <span class="label">GitHub</span>
            </a>

            <div class="follow-row flex items-center gap-2 !text-white/[0.92] text-[13px]">
              <svg class="icon icon--people w-[18px] h-[18px] !fill-white/[0.95] flex-none" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-1.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.95 1.97 3.45V20h6v-1.5C23 14.17 18.33 13 16 13z" />
              </svg>
              <span class="follow-text !text-white/[0.92]">{{ t('sidebar.followers', { count: profile.followers ?? 0 }) }}</span>
            </div>


            <div class="contact-meta flex flex-col gap-1.5 text-[13px] !text-white/[0.92]">
              <div class="meta-item flex items-center gap-2">
                <svg class="icon icon--pin w-[18px] h-[18px] !fill-white/[0.95] flex-none" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                </svg>
                <span>{{ t('sidebar.location') }}</span>
              </div>
              <div class="meta-item flex items-center gap-2">
                <svg class="icon icon--mail w-[18px] h-[18px] !fill-white/[0.95] flex-none" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                <a class="email-link text-inherit underline" href="mailto:diesehnsucht0@gmail.com">diesehnsucht0@gmail.com</a>
              </div>
              <div class="meta-item last-updated-row grid grid-cols-[20px_1fr] gap-x-2 items-center mt-1 !text-white/[0.85] text-[13px]" v-if="lastUpdated">
                  <svg class="icon icon--clock w-4 h-4 !fill-white/[0.85]" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm1 11.59V7a1 1 0 00-2 0v6a1 1 0 00.29.71l3 3a1 1 0 001.41-1.41z" />
                  </svg>
                  <div class="last-updated-content flex gap-2 items-center flex-wrap">
                    <span class="last-updated-label flex-initial">{{ t('sidebar.lastUpdated') }}</span>
                    <span class="last-updated whitespace-nowrap">{{ lastUpdated }}</span>
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
import { fetchWithCache } from '../api/apiCache';
import { getBackendApiUrl } from '../api/backendApi';
const props = defineProps({ enterReady: { type: Boolean, default: true } });
import { useI18n } from 'vue-i18n';

const avatarUrl = ref('https://github.com/dieWehmut.png');
const profile = ref({});
const lastUpdated = ref('');

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

async function fetchGitHub() {
  try {
    // cache profile for 1 hour
    const data = await fetchWithCache(
      getBackendApiUrl('/api/github/user/dieWehmut'),
      {},
      1000 * 60 * 60
    )
    profile.value = data;
    if (data.avatar_url) avatarUrl.value = data.avatar_url;
  } catch (e) {
    // ignore network errors
  }
}

onMounted(() => {
  fetchGitHub();
});

async function fetchLatestCommit() {
  try {
    // Repo: dieWehmut/dieWehmut.github.io (site repo)
    // cache latest commit for 1 hour
    const commits = await fetchWithCache(
      getBackendApiUrl('/api/github/repos/dieWehmut/dieWehmut.github.io/commits/latest'),
      {},
      1000 * 60 * 60
    )
    if (commits && commits.commit) {
      const c = commits;
      const dateStr = c?.commit?.committer?.date || c?.commit?.author?.date;
      if (dateStr) {
        lastUpdated.value = formatDateTime(dateStr);
      }
    }
  } catch (e) {
    // ignore
  }
}

function formatDateTime(d) {
  try {
    const dt = new Date(d);
    if (isNaN(dt.valueOf())) return d;
    // format: YYYY-MM-DD (no time)
    const Y = dt.getFullYear();
    const M = String(dt.getMonth() + 1).padStart(2, '0');
    const D = String(dt.getDate()).padStart(2, '0');
    return `${Y}-${M}-${D}`;
  } catch {
    return d;
  }
}

onMounted(() => {
  fetchLatestCommit();
});

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

/* CSS variable-based positioning (cannot be expressed as static Tailwind utilities) */
.sidebar {
  top: calc(var(--header-height, 80px) + 8px);
  max-height: calc(100vh - var(--header-height, 80px) - 16px);
  margin-left: calc(-1 * var(--sidebar-left-gap, 32px));
}

/* Collapsed sidebar state: triggered by adding `sidebar-collapsed` to <html> */
html.sidebar-collapsed .sidebar {
  width: 0;
  min-width: 0;
  padding: 0;
  margin-left: 0;
  margin-right: 0;
  border: none !important;
  border-radius: 0;
  box-shadow: none !important;
  opacity: 0;
  transform: translateX(-18px);
  pointer-events: none;
  overflow: hidden;
  max-height: 0;
}
html.sidebar-collapsed .about-me,
html.sidebar-collapsed .avatar-container,
html.sidebar-collapsed .about-content,
html.sidebar-collapsed .name,
html.sidebar-collapsed .bio,
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
html.sidebar-collapsed .avatar {
  width: 0;
  height: 0;
  border-radius: 0;
  box-shadow: none;
}

/* avatar hover lift (media query required) */
@media (hover: hover) {
  .avatar:hover {
    transform: translateY(-8px) scale(1.03) rotate(-0.6deg);
    box-shadow: 0 18px 42px rgba(20,40,80,0.38);
    filter: saturate(1.05) contrast(1.03);
  }
}

/* github button hover/transition */
.github-btn {
  transition: background 180ms ease, transform 160ms cubic-bezier(.2,.9,.2,1);
}
@media (hover: hover) {
  .github-btn:hover,
  .github-btn:focus {
    background: transparent !important;
    transform: translateY(-4px);
    outline: none;
  }
}

/* Responsive overrides */
@media (max-width: 1000px) {
  .sidebar {
    position: static;
    top: auto;
    width: 100%;
    max-width: none;
    margin-left: 0;
    margin-right: 0;
    border-radius: 24px;
    box-shadow: none;
  }
  .avatar {
    width: 140px;
    height: 140px;
  }
  .about-content {
    max-width: none;
  }
}
</style>
