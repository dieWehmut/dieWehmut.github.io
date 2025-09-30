<script setup>
import { computed, ref } from "vue";
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
    repoUrl: "https://github.com/dieWehmut/myFirstAIWebApp",
    versions: [
      {
        date: "2025-06-03",
        log: "Project initialization",
        url: "https://diesehnsucht0.github.io/kotobahitomi/#/",
      },
    ],
  },
  {
    name: "chatto",
    repoUrl: "https://github.com/dieWehmut/chatto",
    versions: [
      {
        date: "2025-08-28",
        log: "Project initialization",
        url: "https://diewehmut.github.io/chatto1.0.0/#/",
      },
    ],
  },

  {
    name: "HCBlog",
    repoUrl: "https://github.com/diewehmut/myBlog",
    versions: [
      {
        date: "2025-08-20",
        log: "Project initialization",
        url: "https://diewehmut.github.io/HCBlog/",
      },
    ],
  },
  {
    name: "HCPWP",
    repoUrl: "https://github.com/diewehmut/myPWP",
    versions: [
      {
        version: "v1.1.1",
        date: "2025-08-24",
        log: "Optimized the page styles",
        url: "https://diewehmut.github.io/dieSWPWP1.1.1/#/",
      },
      {
        version: "v1.1.0",
        date: "2025-08-20",
        log: "Added Notes",
        url: "https://diewehmut.github.io/dieSWPWP1.1/#/",
      },
      {
        version: "v1.0.0",
        date: "2025-08-15",
        log: "Project initialization",
        url: "https://diewehmut.github.io/dieSWPWP/",
      },
    ],
  },
]);

// Games data
const games = ref([
  {
    name: "PhantomGenesis",
    repoUrl: "https://git.nju.edu.cn/dieSehnsucht/mygame0",
    versions: [
      {
        version: "v1.3",
        date: "2025-06-30",
        log: "Third game release",
        url: "https://github.com/dieWehmut/projectRelease/releases/download/PhantomGenesis/PhantomGenesis1.3.zip",
      },
      {
        version: "v1.2",
        date: "2025-06-30",
        log: "Second game release",
        url: "https://github.com/dieWehmut/projectRelease/releases/download/PhantomGenesis/PhantomGenesis1.2.zip",
      },
    ],
  },
  {
    name: "SugisarishiKage",
    repoUrl: "https://github.com/dieWehmut/projectRelease/releases/tag/SugisarishiKage",
    versions: [
      {
        version: "v1.0",
        date: "2025-09-11",
        log: "My first VN--Windows",
        url: "https://github.com/dieWehmut/projectRelease/releases/download/SugisarishiKage/SugisarishiKage_win.7z",
      },
      {
        version: "v1.0",
        date: "2025-09-11",
        log: "My first VN--Android",
        url: "https://github.com/dieWehmut/projectRelease/releases/download/SugisarishiKage/SugisarishiKage_android.apk.1",
      },
    ],
  },
]);

// Apps data
const apps = ref([
  {
    name: "kotobahitomi_android",
    repoUrl: "https://github.com/dieWehmut/myFirstAIWebApp",
    versions: [
      {
        version: "v1.0.0",
        date: "2025-06-03",
        log: "First app release",
        url: "https://github.com/dieWehmut/projectRelease/releases/download/kotobahitomi/kotobahitomi.apk",
      },
    ],
  },
    {
    name: "SugisarishiKage_android",
    repoUrl: "https://github.com/dieWehmut/projectRelease/releases/tag/SugisarishiKage",
    versions: [
      {
        version: "v1.0",
        date: "2025-09-11",
        log: "My first VN--Android",
        url: "https://github.com/dieWehmut/projectRelease/releases/download/SugisarishiKage/SugisarishiKage_android.apk.1",
      },
    ],
  },
]);

// Files data (只有仓库链接)
const files = ref([
  {
    name: "My High School Notes",
    repoUrl: "https://github.com/dieWehmut/myHighSchoolNotes",
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
    <el-card v-if="filteredPages.length > 0" shadow="never" class="home__card">
      <template #header>
        <div class="card-header">
          <span>My Pages</span>
          <el-text size="small" type="info">
            Total {{ totalCount }} items
            <template v-if="query">
              , matched
              <el-text type="primary">{{ matchedCount }}</el-text> items
            </template>
          </el-text>
        </div>
      </template>

      <div>
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
                    <span>Repository</span>
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
    </el-card>

    <!-- My Games Section -->
    <el-card v-if="filteredGames.length > 0" shadow="never" class="home__card">
      <template #header>
        <div class="card-header">
          <span>My Games</span>
          <el-text size="small" type="info">
            Total {{ totalGamesCount }} items
            <template v-if="query">
              , matched
              <el-text type="primary">{{ matchedGamesCount }}</el-text> items
            </template>
          </el-text>
        </div>
      </template>

      <div>
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
                    <span>Repository</span>
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
    </el-card>

    <!-- My Apps Section -->
    <el-card v-if="filteredApps.length > 0" shadow="never" class="home__card">
      <template #header>
        <div class="card-header">
          <span>My Apps</span>
          <el-text size="small" type="info">
            Total {{ totalAppsCount }} items
            <template v-if="query">
              , matched
              <el-text type="primary">{{ matchedAppsCount }}</el-text> items
            </template>
          </el-text>
        </div>
      </template>

      <div>
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
                    <span>Repository</span>
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
    </el-card>

    <!-- My Files Section -->
    <el-card v-if="filteredFiles.length > 0" shadow="never" class="home__card">
      <template #header>
        <div class="card-header">
          <span>My Files</span>
          <el-text size="small" type="info">
            Total {{ totalFilesCount }} items
            <template v-if="query">
              , matched
              <el-text type="primary">{{ matchedFilesCount }}</el-text> items
            </template>
          </el-text>
        </div>
      </template>

      <div>
        <FileItem
          v-for="file in filteredFiles"
          :key="file.name"
          :file-name="file.name"
          :repo-url="file.repoUrl"
          :description="file.description"
        />
      </div>
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
</style>
