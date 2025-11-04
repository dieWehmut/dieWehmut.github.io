<script setup>
import { computed, ref, watch, onBeforeUnmount } from "vue";
import { useI18n } from 'vue-i18n';
import { Collection, Link, ArrowUp } from "@element-plus/icons-vue";
import PageItem from "../components/PageItem.vue";
import PagesAutoLoader from "../components/PagesAutoLoader.vue";
import GameItem from "../components/GameItem.vue";
import AppItem from "../components/AppItem.vue";
import FileItem from "../components/FileItem.vue";

import Tools from "../components/Tools.vue";
import { ElMessage } from "element-plus";
import { showCenteredToast } from '../utils/centerToast'

const props = defineProps({
  query: {
    type: String,
    default: "",
  },
  enterReady: {
    type: Boolean,
    default: true,
  },
});
import { useContent } from "../data/content";

const { games, apps, files } = useContent();

// helpers: parse dates and get latest version date for an item
function parseDateSafe(d) {
  try {
    const dt = new Date(d);
    return isNaN(dt.valueOf()) ? null : dt;
  } catch {
    return null;
  }
}

function latestVersionDate(item) {
  if (!item || !Array.isArray(item.versions) || item.versions.length === 0) return new Date(0);
  let max = 0;
  item.versions.forEach((v) => {
    const dt = parseDateSafe(v.date);
    if (dt) {
      const t = dt.valueOf();
      if (t > max) max = t;
    }
  });
  return new Date(max || 0);
}




const totalGamesCount = computed(() =>
  games.value.reduce((sum, g) => sum + g.versions.length, 0)
);

const totalAppsCount = computed(() =>
  apps.value.reduce((sum, a) => sum + a.versions.length, 0)
);

const totalFilesCount = computed(() => files.value.length);

const normalizedQuery = computed(() => props.query.trim().toLowerCase());



function matchVersion(v, q) {
  return (
    (v.version || "").toLowerCase().includes(q) ||
    (v.log || "").toLowerCase().includes(q) ||
    (v.date || "").toLowerCase().includes(q)
  );
}

const filteredGames = computed(() => {
  const q = normalizedQuery.value;
  let result;
  if (!q) {
    result = games.value.map((g) => ({
      ...g,
      versions: (g.versions || []).slice().sort((x, y) => new Date(y.date) - new Date(x.date)),
    }));
  } else {
    result = games.value
      .map((g) => ({
        ...g,
        versions: (g.versions || []).filter((v) => matchVersion(v, q) || g.name.toLowerCase().includes(q)).slice().sort((x, y) => new Date(y.date) - new Date(x.date)),
      }))
      .filter((g) => g.versions.length > 0);
  }

  return result.sort((a, b) => latestVersionDate(b) - latestVersionDate(a));
});

const filteredApps = computed(() => {
  const q = normalizedQuery.value;
  let result;
  if (!q) {
    result = apps.value.map((a) => ({
      ...a,
      versions: (a.versions || []).slice().sort((x, y) => new Date(y.date) - new Date(x.date)),
    }));
  } else {
    result = apps.value
      .map((a) => ({
        ...a,
        versions: (a.versions || []).filter((v) => matchVersion(v, q) || a.name.toLowerCase().includes(q)).slice().sort((x, y) => new Date(y.date) - new Date(x.date)),
      }))
      .filter((a) => a.versions.length > 0);
  }

  return result.sort((a, b) => latestVersionDate(b) - latestVersionDate(a));
});

const filteredFiles = computed(() => {
  const q = normalizedQuery.value;
  if (!q) {
    return files.value;
  }
  return files.value
    .filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.description || "").toLowerCase().includes(q)
    )
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
});

const matchedGamesCount = computed(() =>
  filteredGames.value.reduce((sum, g) => sum + g.versions.length, 0)
);

const matchedAppsCount = computed(() =>
  filteredApps.value.reduce((sum, a) => sum + a.versions.length, 0)
);

const matchedFilesCount = computed(() => filteredFiles.value.length);

// Tools: read child component (Tools.vue) exposed data via ref
const toolsRef = ref(null)
const toolsList = computed(() => toolsRef.value?.tools || [])
const filteredTools = computed(() => {
  const q = normalizedQuery.value
  if (!q) return toolsList.value
  return (toolsList.value || []).filter((t) => t.name.toLowerCase().includes(q))
})
const totalToolsCount = computed(() => (toolsList.value || []).length)
const matchedToolsCount = computed(() => (filteredTools.value || []).length)

// Pages: read PagesAutoLoader exposed data
const pagesAutoLoaderRef = ref(null)
const totalPagesCount = computed(() => pagesAutoLoaderRef.value?.pagesCount || 0)

const activeGames = ref(
  filteredGames.value.filter((g) => g.versions.length > 1).map((g) => g.name)
);

const activeApps = ref(
  filteredApps.value.filter((a) => a.versions.length > 1).map((a) => a.name)
);

const showPages = ref(true);
const showGames = ref(true);
const showApps = ref(true);
const showFiles = ref(true);
const showTools = ref(true);

function handleOpenSection(e) {
  const name = e?.detail;
  if (!name) return;
  if (name === 'pages') showPages.value = true;
  if (name === 'games') showGames.value = true;
  if (name === 'apps') showApps.value = true;
  if (name === 'files') showFiles.value = true;
  if (name === 'tools') showTools.value = true;
}

if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('open-section', handleOpenSection);
}

onBeforeUnmount(() => {
  if (typeof window !== 'undefined' && window.removeEventListener) {
    window.removeEventListener('open-section', handleOpenSection);
  }
});

watch(normalizedQuery, (q) => {
  try {
    if (q && q.length > 0) {
      showPages.value = true;
      showGames.value = true;
      showApps.value = true;
      showFiles.value = true;
      showTools.value = true;
    }
  } catch (e) {
    // ignore
  }
});

function openPage(url) {
  if (url) window.open(url, "_blank", "noopener");
}

function openFirstResult() {
  const first = firstVersion();
  if (first) {
    window.open(first.url, "_blank", "noopener");
  } else {
    ElMessage.info("No result to open");
  }
}

function copyFirstResult() {
  const first = firstVersion();
  if (first) {
      navigator.clipboard.writeText(first.url).then(() => {
      showCenteredToast('action.first_result_copied', { type: 'success', duration: 2500 });
    });
  } else {
    ElMessage.info("No result to copy");
  }
}

function firstVersion() {
  // Check games first
  const g = filteredGames.value[0];
  if (g && g.versions && g.versions[0]) {
    return g.versions[0];
  }
  // Then apps
  const a = filteredApps.value[0];
  if (a && a.versions && a.versions[0]) {
    return a.versions[0];
  }
  return null;
}

function formatDate(d) {
  try {
    const date = new Date(d);
    if (!isNaN(date.valueOf())) {
      const y = date.getFullYear();
      const m = date.getMonth() + 1;
      const day = date.getDate();
      return `${y}-${m}-${day}`;
    }
  } catch {}
  return d;
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

defineExpose({ openFirstResult, copyFirstResult });

// i18n helper for template
const { t } = useI18n();
</script>

<template>
  <div class="home" :class="{ 'entering': enterReady }">




    <el-card id="section-pages" v-if="!query || showPages" shadow="never" class="home__card">
      <template #header>
        <div class="card-header" @click="showPages = !showPages" style="cursor: pointer;">
            <div class="card-header-left">
            <span>{{ t('nav.pages') }}</span>
            <el-text size="small" type="info">
              {{ t('common.totalFormat', { count: totalPagesCount }) }}
            </el-text>
          </div>
          <el-button type="text" size="small" style="margin-left:8px">
            <el-icon>
              <ArrowUp v-if="showPages" />
              <Collection v-else />
            </el-icon>
          </el-button>
        </div>
      </template>

      <transition name="section-toggle">
        <div v-show="showPages" class="section-body">
          <PagesAutoLoader ref="pagesAutoLoaderRef" />
        </div>
      </transition>
    </el-card>

  <el-card id="section-tools" v-if="!normalizedQuery || filteredTools.length > 0" shadow="never" class="home__card">
      <template #header>
        <div class="card-header" @click="showTools = !showTools" style="cursor: pointer;">
            <div class="card-header-left">
            <span>{{ t('nav.tools') }}</span>
            <el-text size="small" type="info">
              {{ t('common.totalFormat', { count: totalToolsCount }) }}
              <template v-if="query">
                , {{ t('common.matchedFormat', { count: matchedToolsCount }) }}
              </template>
            </el-text>
          </div>
          <el-button type="text" size="small" style="margin-left:8px">
            <el-icon>
              <ArrowUp v-if="showTools" />
              <Collection v-else />
            </el-icon>
          </el-button>
        </div>
      </template>

      <transition name="section-toggle">
        <div v-show="showTools" class="section-body">
          <Tools ref="toolsRef" />
        </div>
      </transition>
    </el-card>

    <el-card id="section-games" v-if="filteredGames.length > 0" shadow="never" class="home__card">
      <template #header>
        <div class="card-header" @click="showGames = !showGames" style="cursor: pointer;">
            <div class="card-header-left">
            <span>{{ t('nav.games') }}</span>
            <el-text size="small" type="info">
              {{ t('common.totalFormat', { count: totalGamesCount }) }}
              <template v-if="query">
                , {{ t('common.matchedFormat', { count: matchedGamesCount }) }}
              </template>
            </el-text>
          </div>
          <el-button type="text" size="small" style="margin-left:8px">
            <el-icon>
              <ArrowUp v-if="showGames" />
              <Collection v-else />
            </el-icon>
          </el-button>
        </div>
      </template>

      <transition name="section-toggle">
        <div v-show="showGames" class="section-body">
        <template v-for="game in filteredGames" :key="game.name">
          <template v-if="game.versions.length === 1">
            <GameItem
              :game-name="game.name"
              :version="game.versions[0]"
              :repo-url="game.repoUrl"
            />
          </template>
          <el-collapse v-else v-model="activeGames" class="collapse" accordion>
            <el-collapse-item :name="game.name">
              <template #title>
                <div class="page-title">
                  <el-icon><Collection /></el-icon>
                  <span>{{ game.name }}</span>
                  <el-tag size="small" effect="plain"
                    >{{ t('common.versionsCount', { count: game.versions.length }) }}</el-tag
                  >
                  <a
                    class="repo-link"
                    :href="game.repoUrl"
                    target="_blank"
                    rel="noopener"
                    @click.stop
                  >
                    <el-icon class="repo-icon"><Link /></el-icon>
                    <span>{{ $t('action.repo') }}</span>
                  </a>
                </div>
              </template>
              <div>
                <GameItem
                  v-for="ver in game.versions"
                  :key="game.name + '@' + (ver.version || ver.date)"
                  :version="ver"
                />
              </div>
            </el-collapse-item>
          </el-collapse>
        </template>
        </div>
      </transition>
    </el-card>

    <el-card id="section-apps" v-if="filteredApps.length > 0" shadow="never" class="home__card">
      <template #header>
        <div class="card-header" @click="showApps = !showApps" style="cursor: pointer;">
            <div class="card-header-left">
            <span>{{ t('nav.apps') }}</span>
            <el-text size="small" type="info">
              {{ t('common.totalFormat', { count: totalAppsCount }) }}
              <template v-if="query">
                , {{ t('common.matchedFormat', { count: matchedAppsCount }) }}
              </template>
            </el-text>
          </div>
          <el-button type="text" size="small" style="margin-left:8px">
            <el-icon>
              <ArrowUp v-if="showApps" />
              <Collection v-else />
            </el-icon>
          </el-button>
        </div>
      </template>

      <transition name="section-toggle">
        <div v-show="showApps" class="section-body">
        <template v-for="app in filteredApps" :key="app.name">
          <template v-if="app.versions.length === 1">
            <AppItem
              :app-name="app.name"
              :version="app.versions[0]"
              :repo-url="app.repoUrl"
            />
          </template>
          <el-collapse v-else v-model="activeApps" class="collapse" accordion>
            <el-collapse-item :name="app.name">
              <template #title>
                <div class="page-title">
                  <el-icon><Collection /></el-icon>
                  <span>{{ app.name }}</span>
                  <el-tag size="small" effect="plain"
                    >{{ t('common.versionsCount', { count: app.versions.length }) }}</el-tag
                  >
                  <a
                    class="repo-link"
                    :href="app.repoUrl"
                    target="_blank"
                    rel="noopener"
                    @click.stop
                  >
                    <el-icon class="repo-icon"><Link /></el-icon>
                    <span>{{ $t('action.repo') }}</span>
                  </a>
                </div>
              </template>
              <div>
                <AppItem
                  v-for="ver in app.versions"
                  :key="app.name + '@' + (ver.version || ver.date)"
                  :version="ver"
                />
              </div>
            </el-collapse-item>
          </el-collapse>
        </template>
        </div>
      </transition>
    </el-card>

    <el-card id="section-files" v-if="filteredFiles.length > 0" shadow="never" class="home__card">
      <template #header>
        <div class="card-header" @click="showFiles = !showFiles" style="cursor: pointer;">
            <div class="card-header-left">
            <span>{{ t('nav.files') }}</span>
            <el-text size="small" type="info">
              {{ t('common.totalFiles', { count: totalFilesCount }) }}
              <template v-if="query">
                , {{ t('common.matchedFormat', { count: matchedFilesCount }) }}
              </template>
            </el-text>
          </div>
          <el-button type="text" size="small" style="margin-left:8px">
            <el-icon>
              <ArrowUp v-if="showFiles" />
              <Collection v-else />
            </el-icon>
          </el-button>
        </div>
      </template>

      <transition name="section-toggle">
        <div v-show="showFiles" class="section-body">
        <FileItem
          v-for="file in filteredFiles"
          :key="file.name"
          :file-name="file.name"
          :repo-url="file.repoUrl"
          :description="file.description"
        />
        </div>
      </transition>
    </el-card>

  

    <el-card
      v-if="
        query &&
        filteredGames.length === 0 &&
        filteredApps.length === 0 &&
        filteredFiles.length === 0
      "
      shadow="never"
      class="home__card"
    >
      <el-empty description="No matching content found" />
    </el-card>

  <!-- FloatButton moved to App.vue to make it global (viewport-fixed) -->
  </div>
</template>

<style scoped>
.home {
  /* remove top padding so the first card lines up with sidebar top (below header/layout padding) */
  padding: 0 0 0px;
  /* 保证主内容左右不带额外间距，与侧边栏无缝衔接 */
  margin: 0;
  padding-left: 0;
  padding-right: 0;
}

.github-card .github-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.github-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* align content to the left */
  padding: 12px 14px; /* tighten internal padding a bit */
}
.github-card .card-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start; /* place header title on the left */
  padding-bottom: 6px;
}
.github-card .github-body {
  width: 100%;
  max-width: 760px; /* constrain large images/cards so the layout looks tidy */
  margin: 0; /* align to left of the card */
  align-items: flex-start;
}
.github-stats {
  justify-content: flex-start;
  gap: 12px;
}
.github-widgets .widgets-row {
  gap: 24px;
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
}
.contrib-img {
  width: 100%;
  height: auto;
  max-width: 480px; /* avoid extremely wide images */
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.04);
}

/* Narrow screens: stack widgets vertically and tighten spacing */
@media (max-width: 600px) {
  .github-card {
    padding: 10px;
  }
  .github-widgets .widgets-row {
    gap: 12px;
    flex-direction: column;
    align-items: center;
  }
  .contrib-img {
    max-width: 360px;
  }
}
.github-stats {
  display: flex;
  gap: 1px;
  font-size: 13px;
  color: #444;
}
.contrib-img {
  width: 100%;
  height: auto;
  max-width: 100%;
}

.github-widgets img {
  max-width: 100%;
  height: auto;
}

.widgets-row {
  display: inline-flex;
  gap: 60px;
  align-items: center;
}

.contrib-count {
  font-weight: 600;
  margin-bottom: 8px;
}
.contrib-note {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}
.contrib-official {
  margin-top: 8px;
}
.activity-section {
  margin-top: 12px;
  border-top: 1px solid #eee;
  padding-top: 12px;
}
.activity-month {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.activity-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.activity-icon {
  color: #409eff;
  margin-top: 3px;
}
.activity-text {
  color: #333;
}
.created-list a {
  display: block;
  color: #409eff;
  text-decoration: none;
}

.home__card {
  border-radius: 10px;

}

/* entry animation for main content when intro finishes */
.home {
  transition: opacity 520ms cubic-bezier(.16,.9,.2,1), transform 520ms cubic-bezier(.16,.9,.2,1);
  will-change: opacity, transform;
}
.home:not(.entering) {
  opacity: 0;
  transform: translateY(12px);
  pointer-events: none;
}
.home.entering {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
.home__card { transition: opacity 420ms ease, transform 420ms cubic-bezier(.16,.9,.2,1); }
.home:not(.entering) .home__card { opacity: 0; transform: translateY(8px); }
.home.entering .home__card:nth-of-type(1) { transition-delay: 120ms }
.home.entering .home__card:nth-of-type(2) { transition-delay: 200ms }
.home.entering .home__card:nth-of-type(3) { transition-delay: 260ms }
.home.entering .home__card:nth-of-type(4) { transition-delay: 320ms }
.home.entering .home__card:nth-of-type(5) { transition-delay: 380ms }
.home.entering .home__card:nth-of-type(6) { transition-delay: 440ms }

/* Make the Tools card body transparent so the card itself is colorless; individual rows manage their own backgrounds */
#section-tools :deep(.el-card__body) {
  background: transparent !important;
  border: none !important;
  padding: 0; /* allow inner component to control padding */
}

.card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

/* Make the header area clearly clickable and span the full width (especially for GitHub activity card) */
.github-card .card-header {
  cursor: pointer;
  width: 100%;
  padding: 10px 0;
}
.card-header-left {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  width: 100%;
}
.repo-link {
  color: #6ba3f5;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  padding: 2px 6px;
  border-radius: 4px;
}
.repo-link:hover {
  color: #4a90e2;
  background: transparent !important;
}
.repo-icon {
  font-size: 12px;
}
.collapse :deep(.el-collapse-item__wrap) {
  background: transparent;
}
.single-title {
  font-weight: 600;
  font-size: 16px;
}
.single-date {
  color: #888;
  font-size: 13px;
}
.single-log {
  color: #2f3235;
  margin-left: 8px;
  font-size: 13px;
}



.section-body {
  overflow: hidden;
}

.section-toggle-enter-from,
.section-toggle-leave-to {
  max-height: 0;
  opacity: 0;
}

.section-toggle-enter-active,
.section-toggle-leave-active {
  transition: max-height 300ms ease, opacity 250ms ease;
}

.section-toggle-enter-to,
.section-toggle-leave-from {
  max-height: 1200px;
  opacity: 1;
}

/* Hover elevation for home cards (only on devices that support hover) */
@media (hover: hover) {
  .home__card {
    transition: transform 0.14s ease, box-shadow 0.18s ease;
    will-change: transform, box-shadow;
  }

  .home__card:hover {
    transform: translateY(-6px);
    box-shadow: 0 14px 40px rgba(0,0,0,0.28);
  }
}
</style>
