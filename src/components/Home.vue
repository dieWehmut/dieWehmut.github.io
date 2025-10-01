<script setup>
import { computed, ref, watch, onBeforeUnmount } from "vue";
import { Collection, Link, ArrowUp } from "@element-plus/icons-vue";
import PageItem from "./PageItem.vue";
import GameItem from "./GameItem.vue";
import AppItem from "./AppItem.vue";
import FileItem from "./FileItem.vue";
import { ElMessage } from "element-plus";

const props = defineProps({
  query: {
    type: String,
    default: "",
  },
});
const pages = ref([
  {
    name: "kotobahitomi",
    repoUrl: "https://github.com/dieWehmut/kotoba-hitomi",
    versions: [
      {
        date: "2025-06-03",
        log: "nihongo AI web app",
        url: "https://diewehmut.github.io/kotoba-hitomi",
      },
    ],
  },

  {
    name: "Notes",
    repoUrl: "https://github.com/diewehmut/Notes",
    versions: [
      {
        date: "2025-08-20",
        log: "personal notes",
        url: "https://diewehmut.github.io/Notes/",
      },
    ],
  },
  {
    name: "Profile",
    repoUrl: "https://github.com/diewehmut/Profile",
    versions: [
      {
        date: "2025-08-15",
        log: "profile page",
        url: "https://diewehmut.github.io/Profile/",
      },
    ],
  },
]);

// Games data
const games = ref([
  {
    name: "PhantomGenesis",
    repoUrl: "https://github.com/dieWehmut/PhantomGenesis/",
    versions: [
      {
        version: "v1.3",
        date: "2025-06-30",
        log: "modified game",
        url: "https://github.com/dieWehmut/showcase/releases/download/PhantomGenesis/PhantomGenesis1.3.zip",
      },
      {
        version: "v1.2",
        date: "2025-06-30",
        log: "first game",
        url: "https://github.com/dieWehmut/showcase/releases/download/PhantomGenesis/PhantomGenesis1.2.zip",
      },
    ],
  },

  


]);

// Apps data
const apps = ref([
  {
    name: "kotobahitomi_android",
    repoUrl: "https://github.com/dieWehmut/kotoba-hitomi",
    versions: [
      {
        version: "v1.0.0",
        date: "2025-06-03",
        log: "First app release",
        url: "https://github.com/dieWehmut/showcase/releases/download/kotobahitomi/kotobahitomi.apk",
      },
    ],
  },

]);

// Files data 
const files = ref([
  {
    name: "High School Notes",
    repoUrl: "https://git.nju.edu.cn/dieSehnsucht/learningmaterials/-/tree/main/HighSchoolNotes?ref_type=heads",
    description: "Math, Physics and Chemistry, etc.",
  },
]);

const totalCount = computed(() =>
  pages.value.reduce((sum, p) => sum + p.versions.length, 0)
);

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

const filteredPages = computed(() => {
  const q = normalizedQuery.value;
  let result;
  if (!q) {
    result = pages.value;
  } else {
    result = pages.value
      .map((p) => ({
        ...p,
        versions: p.versions.filter(
          (v) => matchVersion(v, q) || p.name.toLowerCase().includes(q)
        ),
      }))
      .filter((p) => p.versions.length > 0);
  }

  // 按页面名称字母顺序排序
  return result.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );
});

const filteredGames = computed(() => {
  const q = normalizedQuery.value;
  let result;
  if (!q) {
    result = games.value;
  } else {
    result = games.value
      .map((g) => ({
        ...g,
        versions: g.versions.filter(
          (v) => matchVersion(v, q) || g.name.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.versions.length > 0);
  }

  return result.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );
});

const filteredApps = computed(() => {
  const q = normalizedQuery.value;
  let result;
  if (!q) {
    result = apps.value;
  } else {
    result = apps.value
      .map((a) => ({
        ...a,
        versions: a.versions.filter(
          (v) => matchVersion(v, q) || a.name.toLowerCase().includes(q)
        ),
      }))
      .filter((a) => a.versions.length > 0);
  }

  return result.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );
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

const matchedCount = computed(() =>
  filteredPages.value.reduce((sum, p) => sum + p.versions.length, 0)
);

const matchedGamesCount = computed(() =>
  filteredGames.value.reduce((sum, g) => sum + g.versions.length, 0)
);

const matchedAppsCount = computed(() =>
  filteredApps.value.reduce((sum, a) => sum + a.versions.length, 0)
);

const matchedFilesCount = computed(() => filteredFiles.value.length);

const activePages = ref(
  filteredPages.value.filter((p) => p.versions.length > 1).map((p) => p.name)
);

const activeGames = ref(
  filteredGames.value.filter((g) => g.versions.length > 1).map((g) => g.name)
);

const activeApps = ref(
  filteredApps.value.filter((a) => a.versions.length > 1).map((a) => a.name)
);

// UI: section visibility toggles (collapsed by default = true -> show)
const showPages = ref(true);
const showGames = ref(true);
const showApps = ref(true);
const showFiles = ref(true);

// Listen for external requests to open a section (from SideBar)
function handleOpenSection(e) {
  const name = e?.detail;
  if (!name) return;
  if (name === 'pages') showPages.value = true;
  if (name === 'games') showGames.value = true;
  if (name === 'apps') showApps.value = true;
  if (name === 'files') showFiles.value = true;
}

if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('open-section', handleOpenSection);
}

onBeforeUnmount(() => {
  if (typeof window !== 'undefined' && window.removeEventListener) {
    window.removeEventListener('open-section', handleOpenSection);
  }
});

// When searching, auto-expand all sections so matches are visible
watch(normalizedQuery, (q) => {
  try {
    if (q && q.length > 0) {
      showPages.value = true;
      showGames.value = true;
      showApps.value = true;
      showFiles.value = true;
    }
    // If query becomes empty, do not force collapse; keep prior user state
  } catch (e) {
    // ignore
  }
});

function openPage(url) {
  if (url) window.open(url, "_blank", "noopener");
}

// Expose for parent (not used now)
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
      ElMessage.success("First result link copied");
    });
  } else {
    ElMessage.info("No result to copy");
  }
}

function firstVersion() {
  const p = filteredPages.value[0];
  if (!p) return null;
  return p.versions[0] || null;
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
</script>

<template>
  <div class="home">
    <el-card id="section-pages" v-if="filteredPages.length > 0" shadow="never" class="home__card">
      <template #header>
        <div class="card-header" @click="showPages = !showPages" style="cursor: pointer;">
          <span>Pages</span>
          <el-text size="small" type="info">
            Total {{ totalCount }} items
            <template v-if="query">
              , matched
              <el-text type="primary">{{ matchedCount }}</el-text> items
            </template>
          </el-text>
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
        <template v-for="page in filteredPages" :key="page.name">
          <!-- 统一用 PageItem 渲染每个版本 -->
          <template v-if="page.versions.length === 1">
            <PageItem
              :page-name="page.name"
              :version="page.versions[0]"
              :repo-url="page.repoUrl"
            />
          </template>
          <el-collapse v-else v-model="activePages" class="collapse" accordion>
            <el-collapse-item :name="page.name">
              <template #title>
                <div class="page-title">
                  <el-icon><Collection /></el-icon>
                  <span>{{ page.name }}</span>
                  <el-tag size="small" effect="plain"
                    >{{ page.versions.length }} versions</el-tag
                  >
                  <a
                    class="repo-link"
                    :href="page.repoUrl"
                    target="_blank"
                    rel="noopener"
                    @click.stop
                  >
                    <el-icon class="repo-icon"><Link /></el-icon>
                    <span>Repo</span>
                  </a>
                </div>
              </template>
              <div>
                <PageItem
                  v-for="ver in page.versions"
                  :key="page.name + '@' + (ver.version || ver.date)"
                  :version="ver"
                />
              </div>
            </el-collapse-item>
          </el-collapse>
        </template>
        </div>
      </transition>
    </el-card>

    <!-- My Games Section -->
  <el-card id="section-games" v-if="filteredGames.length > 0" shadow="never" class="home__card">
      <template #header>
        <div class="card-header" @click="showGames = !showGames" style="cursor: pointer;">
          <span>Games</span>
          <el-text size="small" type="info">
            Total {{ totalGamesCount }} items
            <template v-if="query">
              , matched
              <el-text type="primary">{{ matchedGamesCount }}</el-text> items
            </template>
          </el-text>
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
                    >{{ game.versions.length }} versions</el-tag
                  >
                  <a
                    class="repo-link"
                    :href="game.repoUrl"
                    target="_blank"
                    rel="noopener"
                    @click.stop
                  >
                    <el-icon class="repo-icon"><Link /></el-icon>
                    <span>Repo</span>
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

    <!-- My Apps Section -->
  <el-card id="section-apps" v-if="filteredApps.length > 0" shadow="never" class="home__card">
      <template #header>
        <div class="card-header" @click="showApps = !showApps" style="cursor: pointer;">
          <span>Apps</span>
          <el-text size="small" type="info">
            Total {{ totalAppsCount }} items
            <template v-if="query">
              , matched
              <el-text type="primary">{{ matchedAppsCount }}</el-text> items
            </template>
          </el-text>
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
                    >{{ app.versions.length }} versions</el-tag
                  >
                  <a
                    class="repo-link"
                    :href="app.repoUrl"
                    target="_blank"
                    rel="noopener"
                    @click.stop
                  >
                    <el-icon class="repo-icon"><Link /></el-icon>
                    <span>Repo</span>
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

    <!-- My Files Section -->
  <el-card id="section-files" v-if="filteredFiles.length > 0" shadow="never" class="home__card">
      <template #header>
        <div class="card-header" @click="showFiles = !showFiles" style="cursor: pointer;">
          <span>Files</span>
          <el-text size="small" type="info">
            Total {{ totalFilesCount }} items
            <template v-if="query">
              , matched
              <el-text type="primary">{{ matchedFilesCount }}</el-text> items
            </template>
          </el-text>
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

    <!-- Show message when no results found -->
    <el-card
      v-if="
        query &&
        filteredPages.length === 0 &&
        filteredGames.length === 0 &&
        filteredApps.length === 0 &&
        filteredFiles.length === 0
      "
      shadow="never"
      class="home__card"
    >
      <el-empty description="No matching content found" />
    </el-card>

    <!-- Back to Top Button -->
    <el-button
      class="back-to-top"
      type="info"
      :icon="ArrowUp"
      size="small"
      circle
      @click="scrollToTop"
      title="回到顶部"
    />
  </div>
</template>

<style scoped>
.home {
  padding: 12px 0 24px;
}
.home__card {
  border-radius: 10px;
  border: 1px solid #eee;
}
.card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
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
  background: rgba(106, 163, 245, 0.1);
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
  color: #409eff;
  margin-left: 8px;
  font-size: 13px;
}

.back-to-top {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 6px !important;
  background-color: rgba(144, 147, 153, 0.8) !important;
  border-color: rgba(144, 147, 153, 0.8) !important;
  color: white !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transition: all 0.3s ease;
}

.back-to-top:hover {
  background-color: rgba(144, 147, 153, 1) !important;
  border-color: rgba(144, 147, 153, 1) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* smooth expand/collapse for section body */
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
  max-height: 1200px; /* large enough to accommodate content */
  opacity: 1;
}
</style>
