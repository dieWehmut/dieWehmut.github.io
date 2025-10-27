<template>
  <el-config-provider :button="{ autoInsertSpace: true }">
    <el-container class="app">
      <el-header class="app__header" height="80px">
        <SearchBar
          ref="searchBarRef"
          v-model="query"
          @submit="openFirst"
          @clear="onClear"
        />
      </el-header>

      <div class="layout">
        <SideBar />

        <el-main>
          <Home
            ref="homeRef"
            :query="query"
          />
        </el-main>

        <!-- right column placeholder (if you add a RightBar, place it here) -->
      </div>

      <el-footer class="app__footer" height="auto">
        <Footer />
      </el-footer>
    </el-container>
  </el-config-provider>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import SearchBar from './components/SearchBar.vue'
import Home from './components/Home.vue'
import Footer from './components/Footer.vue'
import SideBar from './components/SideBar.vue'

const query = ref('')
const searchBarRef = ref(null)
const homeRef = ref(null)

function focusSearch() {
  searchBarRef.value?.focusInput()
}

function openFirst() {
  homeRef.value?.openFirstResult()
}

function onClear() {
  query.value = ''
}

function handleGlobalHotkeys(e) {
  const isTyping =
    ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) ||
    document.activeElement?.getAttribute('contenteditable') === 'true'

  // / 或 Ctrl+K 聚焦搜索框
  if ((e.key === '/' && !isTyping) || (e.key.toLowerCase() === 'k' && e.ctrlKey)) {
    e.preventDefault()
    focusSearch()
    return
  }

  // Enter 在搜索框中 -> 打开首个结果
  if (e.key === 'Enter' && document.activeElement?.id === 'global-search-input') {
    e.preventDefault()
    openFirst()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalHotkeys)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalHotkeys)
})
</script>

<style scoped>
.app {
  /* reserve space for left/right fixed sidebars so they don't overlap main content */
  --sidebar-left-gap: 32px; /* left sidebar occupied width + gap */
  --sidebar-right-gap: 32px; /* placeholder for a right sidebar if present */
  /* header height (used by sidebar sticky offset) */
  --header-height: 80px;
  min-height: 100vh;
  background: #fafafa;
  color: #2c2c2c;
  padding-left: var(--sidebar-left-gap);
  padding-right: var(--sidebar-right-gap);
}

.app__header {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border-bottom: 1px solid #eee;
}

.app__main {
  max-width: 1080px;
  margin: 0 auto;
  width: 100%;
  /* ensure main content stays centered inside the padded area */
  box-sizing: border-box;
}

.layout {
  /* total width roughly = left(320) + main(max 1080) + right(320) */
  max-width: 2000px;
  margin: 0 auto;
  display: flex;
  align-items: flex-start;
  gap: 0px;
  width: 100%;
  box-sizing: border-box;
  padding: 20px 0;
}

/* ensure the main column does not add extra left padding so it can sit flush against the sidebar */
.layout .el-main {
  padding-left: 0;
  margin-left: 0;
  /* ensure el-main occupies remaining space and has no internal left padding that would create a gap */
  box-sizing: border-box;
  /* pull the main area to the right edge by compensating for the app's right gap */
  padding-right: 0;
  margin-right: calc(-1 * var(--sidebar-right-gap, 32px));
}

/* Responsive: collapse side padding on narrower screens so mobile layout works */
@media (max-width: 1400px) {
  .app {
    --sidebar-left-gap: 220px;
    --sidebar-right-gap: 220px;
  }
}

@media (max-width: 1000px) {
  .app {
    --sidebar-left-gap: 18px;
    --sidebar-right-gap: 18px;
    padding-left: 18px;
    padding-right: 18px;
  }
  /* also make the fixed sidebars collapse/stack via their own CSS (they check window width)
     so the main area can take full width on small devices */
}

.app__footer {
  background: #ffffff;
  border-top: 1px solid #eee;
}
</style>