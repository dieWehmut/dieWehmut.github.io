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

      <SideBar />

      <el-main class="app__main">
        <Home
          ref="homeRef"
          :query="query"
        />
      </el-main>

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
  min-height: 100vh;
  background: #fafafa;
  color: #2c2c2c;
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
}

.app__footer {
  background: #ffffff;
  border-top: 1px solid #eee;
}
</style>