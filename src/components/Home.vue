<script setup>
import { computed, ref, watch, onBeforeUnmount, onMounted } from "vue";
import { Collection, Link, ArrowUp } from "@element-plus/icons-vue";
import BackToTop from "../components/BackToTop.vue";
import PageItem from "../components/PageItem.vue";
import GameItem from "../components/GameItem.vue";
import AppItem from "../components/AppItem.vue";
import FileItem from "../components/FileItem.vue";
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
        version: "v1.4",
        date: "2025-06-03",
        log: "nihongo AI web app",
        url: "https://kotoba-hitomi.hc-dsw-nexus.me/",
      },
    ],
  },

]);

// GitHub profile for Home (show more GitHub info)
const ghProfile = ref({});

async function fetchGitHubProfile() {
  try {
    const res = await fetch('https://api.github.com/users/dieWehmut');
    if (!res.ok) return;
    const data = await res.json();
    ghProfile.value = data;
  } catch (e) {
    // ignore
  }
}

onMounted(() => {
  fetchGitHubProfile();
});

// additional GitHub data: recent public events
const recentActivity = ref({
  monthLabel: null,
  commitsCount: 0,
  commitReposCount: 0,
  createdReposCount: 0,
  createdRepos: [],
});

// official SVG load state for dev proxy fallback
const officialFailed = ref(false);
function onOfficialError() {
  officialFailed.value = true;
}
// trophy load state
const trophyFailed = ref(false);
function onTrophyError() {
  trophyFailed.value = true;
}


async function fetchRecentEvents() {
  try {
    const res = await fetch('https://api.github.com/users/dieWehmut/events/public');
    if (!res.ok) return;
    const events = await res.json();
    if (!Array.isArray(events) || events.length === 0) return;

    const firstDate = new Date(events[0].created_at);
    const month = firstDate.toLocaleString(undefined, { month: 'long' });
    const year = firstDate.getFullYear();
    const monthLabel = `${month} ${year}`;

    const eventsThisMonth = events.filter((ev) => {
      const d = new Date(ev.created_at);
      return d.getFullYear() === firstDate.getFullYear() && d.getMonth() === firstDate.getMonth();
    });

    let commitsCount = 0;
    const commitRepos = new Set();
    let createdReposCount = 0;
    const createdRepos = [];

    eventsThisMonth.forEach((ev) => {
      if (ev.type === 'PushEvent' && ev.payload && Array.isArray(ev.payload.commits)) {
        commitsCount += ev.payload.commits.length;
        if (ev.repo && ev.repo.name) commitRepos.add(ev.repo.name.split('/').pop());
      }
      if (ev.type === 'CreateEvent' && ev.payload && ev.payload.ref_type === 'repository') {
        createdReposCount += 1;
        if (ev.repo && ev.repo.name) createdRepos.push(ev.repo.name.split('/').pop());
      }
    });

    recentActivity.value = {
      monthLabel,
      commitsCount,
      commitReposCount: commitRepos.size,
      createdReposCount,
      createdRepos,
    };
  } catch (e) {
    // ignore
  }
}

onMounted(() => {
  // fetch additional GitHub info in parallel
  fetchRecentEvents();
});

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
        log: "first version release",
        url: "https://github.com/dieWehmut/showcase/releases/download/PhantomGenesis/PhantomGenesis1.2.zip",
      },
    ],
  },
]);

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

const files = ref([
  {
    name: "High School Notes",
    repoUrl: "https://git.nju.edu.cn/dieSehnsucht/learningmaterials/-/tree/main/HighSchoolNotes?ref_type=heads",
    description: "Math, Physics and Chemistry, etc.",
  },
  {
    name: "Learning Notes",
    repoUrl: "https://git.nju.edu.cn/dieWehmut/learningmaterials/-/tree/main/Blog",
    description: "Personal notes and learning materials",
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

// control whether the GitHub activity card is expanded
const showGitCard = ref(true);

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

const showPages = ref(true);
const showGames = ref(true);
const showApps = ref(true);
const showFiles = ref(true);

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

watch(normalizedQuery, (q) => {
  try {
    if (q && q.length > 0) {
      showPages.value = true;
      showGames.value = true;
      showApps.value = true;
      showFiles.value = true;
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

  <el-card v-if="!normalizedQuery" shadow="never" class="home__card github-card">
      <template #header>
        <div class="card-header">
          <span>GitHub Activity</span>
          <el-button type="text" size="small" @click="showGitCard = !showGitCard" style="margin-left:8px">
            <el-icon>
              <ArrowUp v-if="showGitCard" />
              <Collection v-else />
            </el-icon>
          </el-button>
        </div>
      </template>
      <transition name="section-toggle">
        <div v-show="showGitCard" class="github-body">
        <div class="github-widgets" style="text-align:center">
          <p class="widgets-row" align="center">
            <img height="160" src="https://github-readme-stats.vercel.app/api?username=dieWehmut&show_icons=true&theme=tokyonight&hide_border=true&count_private=true" alt="github-stats" />
            <img height="160" src="https://github-readme-stats.vercel.app/api/top-langs/?username=dieWehmut&layout=compact&theme=tokyonight&hide_border=true" alt="top-langs" />
          </p>

          <p align="center" style="margin-top:8px">
            <img v-if="!trophyFailed" :src="'/api/trophy'" alt="trophy" @error="onTrophyError" />
            
          </p>
        </div>

        <div class="github-contrib">
          <!-- Third-party activity graph (recent activity window, usually ~30 days) -->
          
          <img class="contrib-img" src="https://github-readme-activity-graph.vercel.app/graph?username=dieWehmut&theme=tokyo-night" alt="Contributions calendar" />

          <!-- Official contributions SVG (past year). In local dev this will be fetched via /api/contributions proxy.
               If loading fails (blocked by network/CSP), we show a small note and keep the third-party image as fallback. -->
          <div class="contrib-official">
            <img v-if="!officialFailed" class="contrib-img" :src="'/api/contributions'" alt="Official contributions (past year)" @error="onOfficialError" />
            
          </div>
        </div>

        <!-- Contribution activity section removed as requested -->
        </div>
      </transition>
    </el-card>


    <el-card id="section-pages" v-if="filteredPages.length > 0" shadow="never" class="home__card">
      <template #header>
        <div class="card-header" @click="showPages = !showPages" style="cursor: pointer;">
          <div class="card-header-left">
            <span>Pages</span>
            <el-text size="small" type="info">
              Total {{ totalCount }} items
              <template v-if="query">
                , matched
                <el-text type="primary">{{ matchedCount }}</el-text> items
              </template>
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
        <template v-for="page in filteredPages" :key="page.name">
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

    <el-card id="section-games" v-if="filteredGames.length > 0" shadow="never" class="home__card">
      <template #header>
        <div class="card-header" @click="showGames = !showGames" style="cursor: pointer;">
          <div class="card-header-left">
            <span>Games</span>
            <el-text size="small" type="info">
              Total {{ totalGamesCount }} items
              <template v-if="query">
                , matched
                <el-text type="primary">{{ matchedGamesCount }}</el-text> items
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

    <el-card id="section-apps" v-if="filteredApps.length > 0" shadow="never" class="home__card">
      <template #header>
        <div class="card-header" @click="showApps = !showApps" style="cursor: pointer;">
          <div class="card-header-left">
            <span>Apps</span>
            <el-text size="small" type="info">
              Total {{ totalAppsCount }} items
              <template v-if="query">
                , matched
                <el-text type="primary">{{ matchedAppsCount }}</el-text> items
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

    <el-card id="section-files" v-if="filteredFiles.length > 0" shadow="never" class="home__card">
      <template #header>
        <div class="card-header" @click="showFiles = !showFiles" style="cursor: pointer;">
          <div class="card-header-left">
            <span>Files</span>
            <el-text size="small" type="info">
              Total {{ totalFilesCount }} items
              <template v-if="query">
                , matched
                <el-text type="primary">{{ matchedFilesCount }}</el-text> items
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

    <BackToTop />
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

.card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
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
