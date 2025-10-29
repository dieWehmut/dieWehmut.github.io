<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale, t } = useI18n();

function scrollToTop() {
	window.scrollTo({ top: 0, behavior: 'smooth' });
}

const visible = ref(true);

function handleKey(e) {
	if (e.key === 'Home') scrollToTop();
}

onMounted(() => window.addEventListener('keyup', handleKey));
onBeforeUnmount(() => window.removeEventListener('keyup', handleKey));

// UI state

// UI state
const settingsOpen = ref(false);
const langPanelOpen = ref(false);
// clean background mode: hide main UI, leaving only FloatButton visible
const cleanMode = ref(false);

function toggleSettings() {
	settingsOpen.value = !settingsOpen.value;
	if (!settingsOpen.value) langPanelOpen.value = false;
}

function toggleLangPanel() {
	langPanelOpen.value = !langPanelOpen.value;
}

function selectLang(code) {
	locale.value = code;
	try { localStorage.setItem('locale', code); } catch (e) {}
	// keep panels open per user's preference
}

function toggleCleanMode() {
	cleanMode.value = !cleanMode.value;
	try {
		document.documentElement.classList.toggle('clean-mode', cleanMode.value);
		localStorage.setItem('cleanMode', cleanMode.value ? '1' : '0');
	} catch (e) {}
}

onMounted(() => {
  try {
    const stored = localStorage.getItem('cleanMode');
    if (stored === '1') {
      cleanMode.value = true;
      document.documentElement.classList.add('clean-mode');
    }
  } catch (e) {}
});

const langs = [
	// Order is arranged so that when buttons expand to the left,
	// visual left-to-right sequence becomes: 拉, 德, 日, 英, 繁, 简
	{ code: 'zh', label: '简' },
	{ code: 'zh_tw', label: '繁' },
	{ code: 'en', label: '英' },
	{ code: 'ja', label: '日' },
	{ code: 'de', label: '德' },
	{ code: 'la', label: '拉' }
];
</script>

<template>
	<div class="float-container" aria-hidden="false">
		<!-- language option buttons (expand left) -->
		<div class="lang-options" :class="{ open: langPanelOpen }">
			<button
				v-for="(l, idx) in langs"
				:key="l.code"
				class="lang-btn"
				:class="{ active: locale === l.code }"
				:style="{ '--i': idx, '--delay': (idx * 70) + 'ms' }"
				@click="selectLang(l.code)"
				:title="t('languages.' + l.code)"
				:aria-label="t('languages.' + l.code)"
			>
				{{ l.label }}
			</button>
		</div>

		<!-- clean-mode toggle (appears when settings open) -->
			<button
			class="btt-button clean-toggle"
			:class="{ visible: settingsOpen, active: cleanMode }"
			@click="toggleCleanMode"
			:title="t('float.cleanMode')"
			aria-label="Toggle clean background"
			>
				<!-- simple eye/eye-off icon: uses a circle to represent visibility -->
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
					<path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
					<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.2"/>
				</svg>
			</button>

		<!-- language toggle button (appears above settings) -->
			<button
			class="btt-button lang-toggle"
			:class="{ visible: settingsOpen }"
			@click="toggleLangPanel"
			:title="t('language')"
				aria-label="Language toggle"
			>
				<!-- globe icon -->
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
					<path d="M12 2a10 10 0 100 20 10 10 0 000-20z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M2 12h20" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M12 2c2.2 4 2.2 12 0 16M22 12c-4 2.2-12 2.2-16 0" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</button>

		<!-- settings button (rotating) -->
			<button
				class="btt-button settings-button"
				@click="toggleSettings"
				:title="t('settings')"
				aria-label="Settings"
				:class="{ rotating: !false }"
			>
				<!-- gear icon -->
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
					<path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06A2 2 0 114.28 16.9l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09c.7 0 1.28-.39 1.51-1A1.65 1.65 0 004.28 6.1l-.06-.06A2 2 0 116.99 3.2l.06.06c.5.5 1.2.66 1.82.33.58-.3 1-.9 1-1.51V3a2 2 0 114 0v.09c0 .61.42 1.21 1 1.51.62.33 1.32.17 1.82-.33l.06-.06A2 2 0 1119.4 8.1l-.06.06c-.3.58-.3 1.3.0 1.82.3.5.9 1 1.51 1H21a2 2 0 110 4h-.09c-.61 0-1.21.42-1.51 1z" stroke="currentColor" stroke-width="0.6" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</button>

		<!-- back to top button (bottom) -->
		<button
			class="btt-button back-button"
			@click="scrollToTop"
			:title="t('backToTop')"
			aria-label="Back to top"
			v-if="visible"
		>
			<!-- Arrow icon -->
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
				<path d="M12 20V4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M5 11L12 4L19 11" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</button>
	</div>
</template>

<style scoped>
.float-container {
	position: fixed;
	bottom: 20px;
	right: 20px;
	z-index: 99999 !important; /* ensure float controls always sit above other UI */
	width: 64px; /* allow horizontal space for slide-out */
	height: auto;
}

.btt-button {
	width: 48px;
	height: 48px;
	padding: 8px;
	border-radius: 12px;
	background: #000000;
	border: none;
	color: #fff;
	box-shadow: 0 8px 20px rgba(0,0,0,0.24);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: transform 160ms cubic-bezier(.2,.9,.2,1), box-shadow 160ms ease, background-color 160ms ease, opacity 160ms ease;
	position: absolute;
	right: 0;
}

.btt-button svg path { stroke: currentColor !important; }

/* ensure correct stacking so language buttons are not obscured */
.float-container { z-index: 99999 !important; }
.btt-button { z-index: 100000 !important; }
.settings-button { z-index: 1202; }
.lang-toggle { z-index: 1203; }
.lang-options { z-index: 1204; }
.lang-options .lang-btn { z-index: 1205; }

/* settings button: black background, white icon */
.settings-button { background: #000; color: #fff; }
.settings-button:hover { background: #0b0b0b; }

/* make settings icon absolutely white and more visible */
.settings-button svg path { stroke: #fff !important; stroke-width: 1.2 !important; }

/* language toggle show/hide animation */
.lang-toggle {
	opacity: 0;
	transform: translateY(8px) scale(0.92);
	transition: transform 260ms cubic-bezier(.2,.9,.2,1), opacity 200ms ease;
	pointer-events: none;
}
.lang-toggle.visible {
	opacity: 1;
	transform: translateY(0) scale(1);
	pointer-events: auto;
}

/* keep clean-toggle hidden until settings are opened (same behavior as lang-toggle) */
.clean-toggle {
	opacity: 0;
	transform: translateY(8px) scale(0.92);
	transition: transform 260ms cubic-bezier(.2,.9,.2,1), opacity 200ms ease;
	pointer-events: none;
}
.clean-toggle.visible {
	opacity: 1;
	transform: translateY(0) scale(1);
	pointer-events: auto;
}

.back-button { bottom: 0; }
.settings-button { bottom: 56px; }
.lang-toggle { bottom: 112px; }

/* clean-mode toggle placed between settings and language toggle */
.clean-toggle { bottom: 168px; }
.clean-toggle.active { background: rgba(255,255,255,0.06); }

@media (hover: hover) {
	.btt-button:hover, .btt-button:focus {
		transform: translateY(-6px) scale(1.02);
		box-shadow: 0 20px 44px rgba(0,0,0,0.28);
		background-color: #0b0b0b;
		outline: none;
	}
}

/* rotating gear */
.settings-button svg { transform-origin: 50% 50%; }
.settings-button.rotating svg {
	animation: spin 2s linear infinite;
}
.settings-button.rotating:hover svg {
	animation-play-state: paused;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* language options container (absolute positioned inside float) */
.lang-options { position: absolute; right: 0; bottom: 112px; height: 48px; pointer-events: none; }
.lang-options.open { pointer-events: auto; }
.lang-options .lang-btn {
	position: absolute;
	/* place buttons to the left of the language toggle: first button sits just left of the toggle */
	right: calc(56px * (var(--i) + 1));
	bottom: 0;
	transform-origin: 100% 50%;
	width: 48px;
	height: 48px;
	padding: 8px;
	border-radius: 12px;
	background: #000;
	color: #fff;
	border: none;
	opacity: 0;
	transition: transform 220ms cubic-bezier(.2,.9,.2,1), opacity 160ms linear;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	font-size: 14px;
}
.lang-options.open .lang-btn {
	opacity: 1;
	transform: translateX(0) scale(1);
	transition-delay: var(--delay, 0ms);
}
.lang-btn {
	/* initial hidden state: slightly shifted toward the toggle and scaled down */
	transform: translateX(12px) scale(0.92);
}

/* hover/floating animation for individual language buttons */
.lang-btn:hover {
	animation: float 600ms ease-in-out infinite alternate;
	transform: translateX(0) translateY(-6px) scale(1.03) !important;
	box-shadow: 0 14px 30px rgba(0,0,0,0.28);
}

@keyframes float {
	from { transform: translateX(0) translateY(0) scale(1); }
	to { transform: translateX(0) translateY(-6px) scale(1.02); }
}
.lang-btn.active { background: #e415d3; }

/* reduced motion respect */
@media (prefers-reduced-motion: reduce) {
	.settings-button.rotating svg { animation: none; }
	.btt-button, .lang-btn { transition: none !important; }
}

</style>
