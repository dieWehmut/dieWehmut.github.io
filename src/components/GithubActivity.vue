<template>
  <el-card shadow="never" class="home__card github-card">
    <template #header>
      <div class="card-header" @click="show = !show">
        <div class="card-header-left">
          <span>{{ t('githubActivity') }}</span>
        </div>
        <el-button type="text" size="small" @click.stop="show = !show" class="toggle-btn">
          <el-icon>
            <ArrowUp v-if="show" />
            <Collection v-else />
          </el-icon>
        </el-button>
      </div>
    </template>

    <transition name="section-toggle">
      <div v-show="show" class="github-body">
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
          <img class="contrib-img" src="https://github-readme-activity-graph.vercel.app/graph?username=dieWehmut&theme=tokyo-night" alt="Contributions calendar" />
          <div class="contrib-official">
            <!-- Prefer direct GitHub contributions SVG to avoid dev-proxy timeouts during development.
                 If this fails the existing onOfficialError handler will hide the image. -->
            <img v-if="!officialFailed" class="contrib-img" src="https://github.com/users/dieWehmut/contributions" alt="Official contributions (past year)" @error="onOfficialError" />
          </div>
        </div>
      </div>
    </transition>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Collection, ArrowUp } from '@element-plus/icons-vue';

const show = ref(true);
const officialFailed = ref(false);
const trophyFailed = ref(false);
function onOfficialError() { officialFailed.value = true; }
function onTrophyError() { trophyFailed.value = true; }

// profile and recent activity (moved from Home.vue)
const ghProfile = ref({});
const recentActivity = ref({
  monthLabel: null,
  commitsCount: 0,
  commitReposCount: 0,
  createdReposCount: 0,
  createdRepos: [],
});

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
  fetchGitHubProfile();
  fetchRecentEvents();
});

const { t } = useI18n();
</script>

<style scoped>
.github-card { display:flex; flex-direction:column; align-items:flex-start; padding:12px 14px }
.card-header { width:100%; display:flex; align-items:center; justify-content:flex-start; padding-bottom:6px; cursor:pointer; position:relative }
.card-header-left { display:flex; align-items:center; gap:8px; flex: 1; padding-right:48px }
.toggle-btn { margin-left: 0; position: absolute; right: 12px; top: 50%; transform: translateY(-50%); }
.github-body { width:100%; max-width:760px; margin:0; align-items:flex-start }
.contrib-img { width:100%; height:auto; max-width:480px; border-radius:8px; box-shadow:0 6px 18px rgba(0,0,0,0.04) }

/* Transition for expand/collapse of the card body. Uses max-height so the
   content can smoothly expand while also fading in/out. The max-height value
   is intentionally large to accommodate the content; it's clipped by overflow.
   Scoped to this component via `scoped` attribute. */
.section-toggle-enter-active,
.section-toggle-leave-active {
  transition: max-height 320ms cubic-bezier(.2,.8,.2,1), opacity 220ms ease;
  overflow: hidden;
}
.section-toggle-enter-from,
.section-toggle-leave-to {
  max-height: 0;
  opacity: 0;
}
.section-toggle-enter-to,
.section-toggle-leave-from {
  /* large enough to contain the content; keeps the transition simple */
  max-height: 900px;
  opacity: 1;
}
</style>
