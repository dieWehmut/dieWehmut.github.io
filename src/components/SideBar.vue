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
              <svg class="icon icon--people" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-1.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.95 1.97 3.45V20h6v-1.5C23 14.17 18.33 13 16 13z" />
              </svg>
              <span class="follow-text">{{ profile.followers ?? 0 }} followers</span>
            </div>


            <div class="contact-meta">
              <div class="meta-item">
                <svg class="icon icon--pin" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                </svg>
                <span>Suzhou, China</span>
              </div>
              <div class="meta-item">
                <svg class="icon icon--mail" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                <a class="email-link" href="mailto:diesehnsucht0@gmail.com">diesehnsucht0@gmail.com</a>
              </div>
            </div>
          </div>
      </div>
    </div>

    <!-- Navigation buttons are moved into a reusable component. Show in sidebar only on desktop. -->
    <nav class="nav-list" aria-label="sections" v-if="!isMobile">
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
.sidebar {
  /* participate in layout (sticky) so left+main(+right) align as a group */
  position: sticky;
  /* align so sidebar top sits below the header and layout padding (header + layout padding-top)
    use a shared variable so changes to layout padding keep both columns aligned */
  top: calc(var(--header-height, 80px) + var(--layout-padding-top, 20px));
  width: 300px; /* increased width for bigger avatar */
  /* fully transparent background so dynamic video shows through */
  background: transparent !important;
  border: none !important;
  border-radius: 14px;
  padding: 18px;
  /* push shadow to left only so right edge appears flush with main content */
  box-shadow: none !important;
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
  box-shadow: 0 8px 20px rgba(64,158,255,0.12);
  transition: transform 260ms cubic-bezier(.2,.9,.2,1), box-shadow 260ms ease, filter 260ms ease;
  will-change: transform, box-shadow;
}

/* 悬浮时有轻微抬起、放大和光泽效果（仅对支持悬浮的设备） */
@media (hover: hover) {
  .avatar:hover {
    transform: translateY(-8px) scale(1.03) rotate(-0.6deg);
    box-shadow: 0 18px 42px rgba(20,40,80,0.38);
    filter: saturate(1.05) contrast(1.03);
  }
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
  color: rgba(255,255,255,0.96);
  margin: 8px 0 6px 0;
}

.bio {
  font-size: 13px;
  color: rgba(255,255,255,0.88);
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
  background: transparent !important;
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
  /* make button background transparent so nothing blocks video */
  background: transparent !important;
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
  background: transparent !important;
  padding: 2px 6px;
  border-radius: 999px;
  font-weight: 600;
}
.follow-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255,255,255,0.86);
  font-size: 13px;
}
.follow-text {
  color: rgba(255,255,255,0.86);
}
.contact-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: rgba(255,255,255,0.86);
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

.icon {
  width: 18px;
  height: 18px;
  fill: rgba(255,255,255,0.88);
  flex: 0 0 18px;
  display: inline-block;
}
.icon--people,
.icon--pin,
.icon--mail {
  width: 18px;
  height: 18px;
}

/* Responsive overrides for sidebar on small screens */
@media (max-width: 1000px) {
  .sidebar {
    position: static; /* participate in normal flow so it stacks above main */
    top: auto;
    width: 100%;
    max-width: none;
    margin-left: 0;
    margin-right: 0;
    border-top-right-radius: 14px;
    border-bottom-right-radius: 14px;
    border-right: 1px solid #eee;
    box-shadow: 0 6px 18px rgba(0,0,0,0.04);
  }

  .avatar {
    /* reduce avatar size on small screens so it doesn't dominate layout */
    width: 140px;
    height: 140px;
  }

  .about-content {
    max-width: none;
    padding: 0 8px;
  }

  .nav-list ul {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
