<template>
  <nav class="sidebar sticky w-[300px] shrink-0 !bg-white/[0.48] !border !border-white/40 rounded-3xl px-[18px] py-[14px] overflow-hidden !shadow-none z-[1100] mr-0 will-change-[opacity,transform]" :class="{ 'entering': enterReady }" aria-label="目录">
    <!-- About Me Section -->
    <div class="about-me mb-3 flex flex-col items-center max-[1000px]:items-stretch max-[1000px]:gap-3 max-[1000px]:mb-0">
      <div class="mobile-top-row max-[1000px]:grid max-[1000px]:items-start max-[1000px]:gap-4">
      <div class="avatar-container mb-2 shrink-0 max-[1000px]:mb-0">
        <img :src="avatarUrl" alt="Avatar" class="avatar w-[240px] h-[240px] rounded-full shadow-[0_8px_20px_rgba(59,76,184,0.12)] transition-[transform,box-shadow,filter] duration-[260ms] will-change-[transform,box-shadow]" />
      </div>
      <div class="about-content px-2 w-full m-0 text-left flex-1 min-w-0 max-[1000px]:px-0 max-[1000px]:pt-0">
            <h3 class="name text-[28px] font-bold !text-[#3b4cb8] mt-2 mb-1.5 max-[1000px]:mt-0">dieWehmut</h3>
              <p class="bio text-[13px] !text-[#3b4cb8]/70 leading-[1.45] mb-3">{{ t('sidebar.bio') }}</p>

          <!-- Contact / GitHub block -->
          <div class="contact mt-2.5 flex flex-col gap-2 items-start w-full max-[1000px]:mt-0">
            <a class="github-btn hidden min-[1001px]:inline-flex items-center justify-center gap-1.5 bg-white/[0.48] border border-white/40 text-[#3b4cb8] px-3.5 py-2 rounded-xl no-underline font-semibold text-[15px] backdrop-blur-sm shadow-[0_8px_30px_rgba(180,160,220,0.14)] w-full box-border transition-all duration-100 hover:bg-[#7c3aed]/8 hover:border-[#7c3aed]/22 hover:text-[#7c3aed]" href="https://github.com/dieWehmut" target="_blank" rel="noopener noreferrer">
              <!-- GitHub icon (simple) -->
              <span class="icon github-icon inline-flex items-center" aria-hidden="true">
                <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.56 7.56 0 018 4.6c.68.003 1.36.092 1.99.27 1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              </span>
              <span class="label text-[16px] leading-none">GitHub</span>
            </a>

            <div class="follow-row hidden items-center justify-start gap-2 !text-[#3b4cb8]/70 text-[13px] min-[1001px]:flex">
              <svg class="icon icon--people w-[18px] h-[18px] !fill-[#3b4cb8]/70 flex-none" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-1.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.95 1.97 3.45V20h6v-1.5C23 14.17 18.33 13 16 13z" />
              </svg>
              <span class="follow-text !text-[#3b4cb8]/70">{{ t('sidebar.followers', { count: profile.followers ?? 0 }) }}</span>
            </div>
            <div class="contact-meta hidden flex-col gap-1.5 text-[13px] !text-[#3b4cb8]/70 items-start w-full min-[1001px]:flex">
              <div class="meta-item flex items-center gap-2">
                <svg class="icon icon--mail w-[18px] h-[18px] !fill-[#3b4cb8]/70 flex-none" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                <a class="email-link text-inherit underline" href="mailto:diesehnsucht0@gmail.com">diesehnsucht0@gmail.com</a>
              </div>
              <LastUpdatedRow v-if="showLastUpdated" class="mt-1" />
            </div>
          </div>
      </div>
      </div>
      <div class="mobile-bottom-row hidden max-[1000px]:grid max-[1000px]:items-end max-[1000px]:gap-4">
        <div class="mobile-meta flex flex-col gap-1.5 text-[13px] !text-[#3b4cb8]/70 items-start pl-0">
          <div class="follow-row flex items-center justify-start gap-2 !text-[#3b4cb8]/70 text-[13px]">
            <svg class="icon icon--people w-[18px] h-[18px] !fill-[#3b4cb8]/70 flex-none" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-1.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.95 1.97 3.45V20h6v-1.5C23 14.17 18.33 13 16 13z" />
            </svg>
            <span class="follow-text !text-[#3b4cb8]/70">{{ t('sidebar.followers', { count: profile.followers ?? 0 }) }}</span>
          </div>
          <div class="contact-meta flex flex-col gap-1.5 text-[13px] !text-[#3b4cb8]/70 items-start w-full">
            <div class="meta-item flex items-center gap-2">
              <svg class="icon icon--mail w-[18px] h-[18px] !fill-[#3b4cb8]/70 flex-none" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
              <a class="email-link text-inherit underline" href="mailto:diesehnsucht0@gmail.com">diesehnsucht0@gmail.com</a>
            </div>
            <LastUpdatedRow v-if="showLastUpdated" class="mt-1" />
          </div>
        </div>
        <a class="github-btn mobile-github inline-flex items-center justify-center gap-1.5 self-end bg-white/[0.48] border border-white/40 text-[#3b4cb8] px-3.5 py-2 rounded-xl no-underline font-semibold text-[15px] backdrop-blur-sm shadow-[0_8px_30px_rgba(180,160,220,0.14)] w-full box-border transition-all duration-100 hover:bg-[#7c3aed]/8 hover:border-[#7c3aed]/22 hover:text-[#7c3aed]" href="https://github.com/dieWehmut" target="_blank" rel="noopener noreferrer">
          <span class="icon github-icon inline-flex items-center" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.56 7.56 0 018 4.6c.68.003 1.36.092 1.99.27 1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          </span>
          <span class="label text-[16px] leading-none">GitHub</span>
        </a>
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
import { onMounted, ref, watch } from 'vue';
import { fetchWithCache } from '../api/apiCache';
import { getBackendApiUrl } from '../api/backendApi';
import LastUpdatedRow from '../ui/LastUpdatedRow.vue';
const props = defineProps({
  enterReady: { type: Boolean, default: true },
  showLastUpdated: { type: Boolean, default: true },
});
import { useI18n } from 'vue-i18n';

const avatarUrl = ref('https://github.com/dieWehmut.png');
const profile = ref({});
const sidebarDataLoaded = ref(false);

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
  if (props.enterReady) {
    scheduleSidebarDataLoad();
  }
});

function scheduleSidebarDataLoad() {
  if (sidebarDataLoaded.value) {
    return;
  }

  sidebarDataLoaded.value = true;
  Promise.allSettled([fetchGitHub()]);
}

watch(
  () => props.enterReady,
  (ready) => {
    if (ready) {
      scheduleSidebarDataLoad();
    }
  },
  { immediate: true },
);

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
  width: 300px;
  min-width: 300px;
  margin-left: calc(-1 * var(--sidebar-left-gap, 32px));
  transform-origin: left center;
  transition: none;
}

/* Collapsed sidebar state: triggered by adding `sidebar-collapsed` to <html>.
   Layout props (width, padding, margin) are set WITHOUT transition so the reflow
   happens once instantly. Only transform + opacity are animated for smooth visuals. */
html.sidebar-collapsed .sidebar {
  width: 0;
  min-width: 0;
  max-width: 0;
  padding: 0;
  margin-left: 0;
  margin-right: 0;
  opacity: 0;
  transform: translateX(-10px);
  border-color: transparent !important;
  box-shadow: none !important;
  pointer-events: none;
  overflow: hidden;
  clip-path: inset(0 100% 0 0);
}
html.sidebar-collapsed .avatar {
  width: 0;
  height: 0;
}

/* avatar hover lift (media query required) */
@media (hover: hover) {
  .avatar:hover {
    transform: translateY(-8px) scale(1.03) rotate(-0.6deg);
    box-shadow: 0 18px 42px rgba(124,58,237,0.2);
    filter: saturate(1.05) contrast(1.03);
  }
}

/* github button hover/transition */
.github-btn {
  transition: background 180ms ease, border-color 180ms ease, color 180ms ease, transform 160ms cubic-bezier(.2,.9,.2,1), box-shadow 180ms ease;
}
@media (hover: hover) {
  .github-btn:hover,
  .github-btn:focus {
    background: rgba(124, 58, 237, 0.08) !important;
    border-color: rgba(124, 58, 237, 0.22) !important;
    color: #7c3aed !important;
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(124,58,237,0.16);
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
    min-width: 0;
    margin-left: 0;
    margin-right: 0;
    border-radius: 24px;
    box-shadow: none;
  }
  .avatar {
    width: clamp(120px, 34vw, 152px);
    height: clamp(120px, 34vw, 152px);
  }
  .mobile-top-row {
    grid-template-columns: minmax(144px, 1fr) minmax(0, 0.7fr);
    align-items: start;
  }
  .mobile-bottom-row {
    grid-template-columns: minmax(144px, 1fr) minmax(0, 0.7fr);
  }
  .about-content {
    max-width: none;
    display: flex;
    min-height: 100%;
    flex-direction: column;
    justify-content: flex-start;
  }
  .avatar-container {
    align-self: start;
    display: flex;
    min-height: 100%;
    align-items: flex-start;
    justify-content: flex-start;
  }
  .name {
    margin-top: 0;
    font-size: 24px;
    line-height: 1.1;
  }
  .bio {
    margin-bottom: 10px;
  }
  .mobile-meta {
    margin-left: 0;
    align-self: end;
    min-height: 100%;
    justify-content: flex-end;
  }
  .mobile-github {
    align-self: end;
    justify-content: center;
    min-height: 42px;
  }
}

@media (max-width: 720px) {
  .mobile-top-row {
    grid-template-columns: minmax(136px, 1fr) minmax(0, 0.68fr);
    gap: 12px;
  }
  .mobile-bottom-row {
    grid-template-columns: minmax(136px, 1fr) minmax(0, 0.68fr);
    gap: 12px;
  }
}

@media (max-width: 520px) {
  .mobile-top-row {
    grid-template-columns: minmax(128px, 1fr) minmax(0, 0.64fr);
    gap: 10px;
  }
  .mobile-bottom-row {
    grid-template-columns: minmax(128px, 1fr) minmax(0, 0.64fr);
    gap: 10px;
  }
  .name {
    font-size: 22px;
  }
}
</style>
