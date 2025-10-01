<template>
  <nav class="sidebar" aria-label="目录">
    <ul>
      <li><button @click="go('pages')">Pages</button></li>
      <li><button @click="go('games')">Games</button></li>
      <li><button @click="go('apps')">Apps</button></li>
      <li><button @click="go('files')">Files</button></li>
    </ul>
  </nav>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';

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
  // map name to element ids used in Home.vue
  const map = {
    pages: 'section-pages',
    games: 'section-games',
    apps: 'section-apps',
    files: 'section-files',
  };
  const id = map[name];
  if (!id) return;
  // dispatch global event so Home.vue can expand the section
  try {
    window.dispatchEvent(new CustomEvent('open-section', { detail: name }));
  } catch (e) {
    // ignore
  }
  // scroll after a tiny delay so expansion can take effect if needed
  setTimeout(() => scrollToSection(id), 120);
}

// Compute left position so sidebar sits flush with main content's left edge
function positionSidebar() {
  const sidebar = document.querySelector('.sidebar');
  // prefer aligning to the .home container (wraps the four sections)
  const homeWrap = document.querySelector('.home');
  const main = document.querySelector('.app__main');
  if (!sidebar || (!homeWrap && !main)) return;
  const baseEl = homeWrap || main;
  const mainRect = baseEl.getBoundingClientRect();
  const sidebarWidth = sidebar.offsetWidth || 140;
  // If screen is narrow, keep a small left margin instead of positioning flush
  if (window.innerWidth < 900) {
    sidebar.style.left = '18px';
    return;
  }
  // place sidebar so its right edge aligns with base element left edge (no gap)
  let left = Math.round(mainRect.left - sidebarWidth);
  // ensure sidebar does not go offscreen entirely
  if (left < 6) left = 6;
  sidebar.style.left = `${left}px`;
}

onMounted(() => {
  positionSidebar();
  window.addEventListener('resize', positionSidebar);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', positionSidebar);
});
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 18px;
  top: 92px; /* below header */
  width: 60px;
  background: rgba(255,255,255,0.9);
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.06);
  z-index: 1100;
}
.sidebar ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sidebar button {
  background: transparent;
  border: none;
  text-align: left;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
.sidebar button:hover {
  background: rgba(74,144,226,0.08);
}
</style>
