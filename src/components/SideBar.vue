<template>
  <nav class="sidebar" aria-label="目录">
    <!-- About Me Section -->
    <div class="about-me">
      <div class="avatar-container">
        <img :src="avatarUrl" alt="Avatar" class="avatar" />
      </div>
      <div class="about-content">
        <h3 class="name">dieWehmut</h3>
          <p class="bio">Undergraduate in Intelligent Science and Technology, Nanjing University, Suzhou Campus</p>

          <!-- Contact / GitHub block -->
          <div class="contact">
            <a class="github-btn" href="https://github.com/dieWehmut" target="_blank" rel="noopener noreferrer">
              <!-- GitHub icon (simple) -->
              <span class="icon github-icon" aria-hidden="true">
                <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.56 7.56 0 018 4.6c.68.003 1.36.092 1.99.27 1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              </span>
              <span class="label">GitHub</span>
            </a>

            <div class="follow-row">
              <span class="icon">👥</span>
              <span class="follow-text">{{ profile.followers ?? 0 }} followers</span>
            </div>


            <div class="contact-meta">
              <div class="meta-item">
                <span class="icon">📍</span>
                <span>Suzhou, China</span>
              </div>
              <div class="meta-item">
                <span class="icon">✉️</span>
                <a class="email-link" href="mailto:diesehnsucht0@gmail.com">diesehnsucht0@gmail.com</a>
              </div>
            </div>
          </div>
      </div>
    </div>

    <nav class="nav-list" aria-label="sections">
      <ul>
        <li><button class="nav-btn" @click="go('pages')">Pages</button></li>
        <li><button class="nav-btn" @click="go('games')">Games</button></li>
        <li><button class="nav-btn" @click="go('apps')">Apps</button></li>
        <li><button class="nav-btn" @click="go('files')">Files</button></li>
      </ul>
    </nav>
  </nav>
</template>

<script setup>
import { onMounted, ref } from 'vue';

const avatarUrl = ref('https://github.com/dieWehmut.png');
const profile = ref({});

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
    const res = await fetch('https://api.github.com/users/dieWehmut');
    if (!res.ok) return;
    const data = await res.json();
    profile.value = data;
    if (data.avatar_url) avatarUrl.value = data.avatar_url;
  } catch (e) {
    // ignore network errors
  }
}

onMounted(() => {
  fetchGitHub();
});
</script>

<style scoped>
.sidebar {
  /* participate in layout (sticky) so left+main(+right) align as a group */
  position: sticky;
  /* align so sidebar top sits below the header and layout padding (header + layout padding-top) */
  top: calc(var(--header-height, 80px) + 20px);
  width: 300px; /* increased width for bigger avatar */
  background: rgba(255,255,255,0.98);
  border: 1px solid #eee;
  border-radius: 14px;
  padding: 18px;
  /* push shadow to left only so right edge appears flush with main content */
  box-shadow: -8px 10px 24px rgba(0,0,0,0.04);
  z-index: 1100;
  /* pull the sidebar flush to the left edge of the page, compensating for .app padding */
  margin-left: calc(-1 * var(--sidebar-left-gap, 32px));
  /* remove right side rounding so it can visually butt up against the main content */
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  /* remove right border so there's no visible seam; keep left/top/bottom border */
  border-right: none;
  /* ensure no extra gap on the right */
  margin-right: 0;
}

.about-me {
  margin-bottom: 18px;
  /* 左对齐文字内容 */
  text-align: left;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.avatar-container {
  margin-bottom: 10px;
}

.avatar {
  width: 270px;
  height: 270px;
  border-radius: 50%;
  border: 1px solid #409eff;
  box-shadow: 0 8px 20px rgba(64,158,255,0.12);
}

.about-content {
  padding: 0 8px;
  /* keep about text tidy and readable */
  max-width: 240px;
  margin: 0;
  text-align: left;
}

.name {
  font-size: 28px;
  font-weight: 700;
  color: #222;
  margin: 8px 0 6px 0;
}

.bio {
  font-size: 13px;
  color: #666;
  line-height: 1.45;
  margin-bottom: 12px;
  max-width: 240px;
}

.exposed-section h4 {
  font-size: 14px;
  color: #333;
  margin-bottom: 6px;
  font-weight: 600;
}

.tech-list {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
}

.tech-list li {
  font-size: 12px;
  color: #666;
  line-height: 1.6;
  padding: 1px 0;
}

.nav-list {
  margin-top: 12px;
}
.nav-list ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: row; /* horizontal buttons */
  gap: 8px;
  align-items: center;
}
.nav-list li {
  width: auto;
  flex: 1; /* distribute evenly */
}
.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center; /* center for horizontal buttons */
  gap: 8px;
  width: 100%;
  background: transparent;
  border: none;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  color: #2c2c2c;
  text-align: left;
}
.nav-btn:hover,
.nav-btn:focus {
  background: rgba(64,158,255,0.08);
  outline: none;
}
.nav-btn:focus-visible {
  box-shadow: 0 0 0 3px rgba(64,158,255,0.14);
}

/* Contact block */
.contact {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.github-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center; /* center content inside button */
  gap: 3px;
  background: #000; /* black button */
  color: #fff;
  padding: 7px 12px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 700;
  width: 100%; /* fill container so text centering is visible */
  box-sizing: border-box;
}
.github-btn .icon {
  display: inline-flex;
  align-items: center;
}
.github-btn .follower {
  margin-left: auto;
  background: rgba(255,255,255,0.15);
  padding: 2px 6px;
  border-radius: 999px;
  font-weight: 600;
}
.follow-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 13px;
}
.follow-text {
  color: #666;
}
.contact-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #666;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.email-link {
  color: inherit;
  text-decoration: underline;
}
</style>
