<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale, t } = useI18n();

function scrollToTop() {
	window.scrollTo({ top: 0, behavior: 'smooth' });
}

const visible = ref(false);

function updateBackButtonVisibility() {
	visible.value = window.scrollY > 32;
}

function handleKey(e) {
	if (e.key === 'Home') scrollToTop();
}

onMounted(() => {
	window.addEventListener('keyup', handleKey);
	window.addEventListener('scroll', updateBackButtonVisibility, { passive: true });
	updateBackButtonVisibility();
});

onBeforeUnmount(() => {
	window.removeEventListener('keyup', handleKey);
	window.removeEventListener('scroll', updateBackButtonVisibility);
});

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
// sidebar collapse state
const sidebarCollapsed = ref(false);

function toggleSidebar() {
	sidebarCollapsed.value = !sidebarCollapsed.value;
 	try {
 		document.documentElement.classList.toggle('sidebar-collapsed', sidebarCollapsed.value);
 		localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value ? '1' : '0');
 	} catch (e) {}
}

onMounted(() => {
	try {
		const stored = localStorage.getItem('sidebarCollapsed');
		if (stored === '1') {
			sidebarCollapsed.value = true;
			document.documentElement.classList.add('sidebar-collapsed');
		}
	} catch (e) {}
});
</script>

<template>
	<div class="float-container fixed bottom-5 right-5 !z-[99999] w-16 h-auto max-[640px]:bottom-3 max-[640px]:right-3 max-[640px]:w-10" :class="{ 'has-back': visible }" aria-hidden="false">
		<!-- language option buttons (expand left) -->
		<div class="lang-options" :class="{ open: langPanelOpen }">
			<button
				v-for="(l, idx) in langs"
				:key="l.code"
				class="lang-btn btt-button"
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
				<!-- replaced gear icon (blue stroke) -->
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
						<path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" stroke="#4ea8ff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06A2 2 0 114.28 16.9l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09c.7 0 1.28-.39 1.51-1A1.65 1.65 0 004.28 6.1l-.06-.06A2 2 0 116.99 3.2l.06.06c.5.5 1.2.66 1.82.33.58-.3 1-.9 1-1.51V3a2 2 0 114 0v.09c0 .61.42 1.21 1 1.51.62.33 1.32.17 1.82-.33l.06-.06A2 2 0 1119.4 8.1l-.06.06c-.3.58-.3 1.3.0 1.82.3.5.9 1 1.51 1H21a2 2 0 110 4h-.09c-.61 0-1.21.42-1.51 1z" stroke="#4ea8ff" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
			</button>

			<!-- sidebar collapse toggle (moved into settings column, below language toggle) -->
			<button
				class="btt-button sidebar-toggle max-[640px]:!hidden"
				:class="{ active: sidebarCollapsed }"
				@click="toggleSidebar"
				:aria-label="t('float.toggleSidebar')"
				:title="t('float.toggleSidebar')"
			>
				<!-- horizontal arrows icon (fa-arrows-alt-h like) -->
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
					<path d="M3 12h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M7 8L3 12l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M17 8l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</button>

			<Transition name="back-pop">
				<button
					v-if="visible"
					class="btt-button back-button"
					@click="scrollToTop"
					:title="t('backToTop')"
					aria-label="Back to top"
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
						<path d="M12 20V4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M5 11L12 4L19 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</button>
			</Transition>

		<!-- (sidebar toggle moved up into settings column) -->
	</div>
</template>

<style scoped>
.float-container {
	/* CSS variable definitions for button sizing/spacing (used in calc() throughout) */
	--btn-size: 44px;
	--btn-padding: 6px;
	--float-gap: 8px;
	--float-step: calc(var(--btn-size) + var(--float-gap));
	/* slot indices (overridden by .has-back) */
	--back-slot: -1;
	--sidebar-slot: 0;
	--settings-slot: 1;
	--lang-slot: 2;
	--clean-slot: 3;
}

@media (max-width: 640px) {
  .float-container {
    --sidebar-slot: -1;
    --settings-slot: 0;
    --lang-slot: 1;
    --clean-slot: 2;
  }
}

.float-container.has-back {
	--back-slot: 0;
	--sidebar-slot: 1;
	--settings-slot: 2;
	--lang-slot: 3;
	--clean-slot: 4;
}

@media (max-width: 640px) {
  .float-container.has-back {
    --back-slot: 0;
    --sidebar-slot: -1;
    --settings-slot: 1;
    --lang-slot: 2;
    --clean-slot: 3;
  }
}

	.btt-button {
		color: rgba(255, 255, 255, 0.96);
	}

	.btt-button svg path { stroke: currentColor !important; }

/* stacking order */
.btt-button { z-index: 100000 !important; }
.settings-button { z-index: 1202; }
.lang-toggle { z-index: 1203; }
.lang-options { z-index: 1204; }
.lang-options .lang-btn { z-index: 1205; }

/* base glass style for all float buttons */
.btt-button {
	width: var(--btn-size);
	height: var(--btn-size);
	padding: var(--btn-padding);
	border-radius: 10px;
	background: rgba(255,255,255,0.12);
	border: 1px solid rgba(255,255,255,0.18);
	color: rgba(255, 255, 255, 0.96);
	box-shadow: 0 8px 30px rgba(6,10,20,0.18), inset 0 1px 0 rgba(255,255,255,0.04);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: bottom 380ms cubic-bezier(.22,1,.36,1), transform 220ms cubic-bezier(.2,.9,.2,1), box-shadow 220ms ease, background-color 180ms ease, opacity 120ms ease, border-color 180ms ease;
	position: absolute;
	right: 0;
	backdrop-filter: blur(8px) saturate(120%);
	-webkit-backdrop-filter: blur(8px) saturate(120%);
}

/* pink/purple glow effect */
.btt-button {
	position: absolute; /* ensure pseudo-element positioned correctly */
}
.btt-button::after {
	content: '';
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%) scale(0.9);
	width: 120%;
	height: 120%;
	pointer-events: none;
	border-radius: 14px;
	background: radial-gradient(40% 40% at 20% 20%, rgba(255,160,200,0.22), transparent 20%), radial-gradient(30% 30% at 80% 80%, rgba(255,120,190,0.12), transparent 20%);
	filter: blur(10px) saturate(150%);
	opacity: 0;
	transition: opacity 240ms ease, transform 240ms ease;
}
.btt-button:hover::after,
.btt-button:focus::after {
	opacity: 1;
	transform: translate(-50%, -50%) scale(1.02);
}

/* unified click effect: match sidebar-toggle active scale */
.btt-button:active {
	transform: scale(0.82) !important;
}

.settings-button { background: rgba(255,255,255,0.06); color: rgba(255, 255, 255, 0.96); border-color: rgba(255,255,255,0.12); }
.settings-button:hover { transform: scale(1.06); box-shadow: 0 18px 42px rgba(255, 120, 182, 0.24); background: rgba(255, 132, 186, 0.18); color: rgba(255, 229, 240, 0.98); border-color: rgba(255, 172, 209, 0.46); }
.settings-button svg path { stroke: currentColor !important; stroke-width: 1.2 !important; }

/* language toggle show/hide animation */
.lang-toggle {
	opacity: 0;
	transform: translateY(8px) scale(0.92);
	transition: bottom 380ms cubic-bezier(.22,1,.36,1), transform 260ms cubic-bezier(.2,.9,.2,1), opacity 200ms ease;
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
	transition: bottom 380ms cubic-bezier(.22,1,.36,1), transform 260ms cubic-bezier(.2,.9,.2,1), opacity 200ms ease;
	pointer-events: none;
}
.clean-toggle.visible {
	opacity: 1;
	transform: translateY(0) scale(1);
	pointer-events: auto;
}



.back-button { bottom: calc(var(--float-step) * var(--back-slot)); }
/* reorder buttons to avoid overlap: use 56px step (48px button + 8px gap) */
.sidebar-toggle { bottom: calc(var(--float-step) * var(--sidebar-slot)); }
.sidebar-toggle svg {
	transition: transform 420ms cubic-bezier(.34,1.56,.64,1);
}
.sidebar-toggle.active svg {
	transform: rotate(180deg) scale(0.85);
}
/* bounce-in when toggled */
.sidebar-toggle {
	transition: bottom 380ms cubic-bezier(.22,1,.36,1),
							transform 360ms cubic-bezier(.34,1.56,.64,1),
              box-shadow 260ms ease,
              background-color 260ms ease,
              opacity 160ms ease;
}
.sidebar-toggle:active {
  transform: scale(0.82) !important;
}
/* pulse ring on state change via pseudo-element */
.sidebar-toggle::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 16px;
  border: 2px solid rgba(255,255,255,0.35);
  opacity: 0;
  transform: scale(0.85);
  transition: opacity 300ms ease, transform 400ms cubic-bezier(.34,1.56,.64,1);
  pointer-events: none;
}
.sidebar-toggle.active::after {
  opacity: 1;
  transform: scale(1.12);
  animation: sidebarPulse 600ms ease-out forwards;
}
@keyframes sidebarPulse {
  0%   { opacity: 0.7; transform: scale(0.9); }
  50%  { opacity: 0.4; transform: scale(1.18); }
  100% { opacity: 0;   transform: scale(1.3); }
}
.settings-button { bottom: calc(var(--float-step) * var(--settings-slot)); }
.lang-toggle { bottom: calc(var(--float-step) * var(--lang-slot)); }

/* clean-mode toggle placed above language toggle */
.clean-toggle { bottom: calc(var(--float-step) * var(--clean-slot)); }
.clean-toggle.active { background: rgba(255,255,255,0.06); }

.float-container.has-back .sidebar-toggle,
.float-container.has-back .settings-button,
.float-container.has-back .lang-toggle,
.float-container.has-back .clean-toggle {
	animation: controlLift 420ms cubic-bezier(.22,1,.36,1);
}

@media (hover: hover) {
	.btt-button:hover, .btt-button:focus {
		transform: scale(1.06);
		box-shadow: 0 18px 42px rgba(255, 120, 182, 0.24);
		background: rgba(255, 132, 186, 0.18);
		border-color: rgba(255, 172, 209, 0.46);
		color: rgba(255, 229, 240, 0.98);
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
.lang-options { position: absolute; right: 0; bottom: calc(var(--float-step) * var(--lang-slot)); height: 44px; pointer-events: none; transition: bottom 380ms cubic-bezier(.22,1,.36,1); }
.lang-options.open { pointer-events: auto; }
.lang-options .lang-btn {
	position: absolute;
	/* place buttons to the left of the language toggle: first button sits just left of the toggle */
	right: calc(var(--float-step) * (var(--i) + 1));
	bottom: 0;
	transform-origin: 100% 50%;
	width: var(--btn-size);
	height: var(--btn-size);
	padding: var(--btn-padding);
	border-radius: 10px;
	background: rgba(255,255,255,0.08);
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
	/* hover: slightly enlarge rather than shift up */
	animation: none;
	transform: scale(1.06) !important;
	box-shadow: 0 14px 30px rgba(6,10,20,0.12);
}

@keyframes float {
	from { transform: translateX(0) translateY(0) scale(1); }
	to { transform: translateX(0) translateY(-6px) scale(1.02); }
}
.lang-btn.active { background: linear-gradient(135deg, rgba(78,168,255,0.95), rgba(102,150,255,0.95)); color: #fff; }

.back-pop-enter-active {
	animation: backPressIn 420ms cubic-bezier(.18,.9,.24,1.24);
}

.back-pop-leave-active {
	animation: backPressOut 240ms ease forwards;
}

@keyframes backPressIn {
	0% {
		opacity: 0;
		transform: translateY(24px) scale(0.72);
		filter: blur(4px);
	}
	55% {
		opacity: 1;
		transform: translateY(-8px) scale(1.06);
		filter: blur(0);
	}
	100% {
		opacity: 1;
		transform: translateY(0) scale(1);
		filter: blur(0);
	}
}

@keyframes backPressOut {
	0% {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
	100% {
		opacity: 0;
		transform: translateY(18px) scale(0.88);
	}
}

@keyframes controlLift {
	0% {
		transform: translateY(0) scale(1);
	}
	40% {
		transform: translateY(-6px) scale(1.03);
	}
	100% {
		transform: translateY(0) scale(1);
	}
}

/* reduced motion respect */
@media (prefers-reduced-motion: reduce) {
	.settings-button.rotating svg { animation: none; }
	.btt-button, .lang-btn { transition: none !important; }
	.back-pop-enter-active,
	.back-pop-leave-active,
	.float-container.has-back .sidebar-toggle,
	.float-container.has-back .settings-button,
	.float-container.has-back .lang-toggle,
	.float-container.has-back .clean-toggle { animation: none !important; }
}

@media (max-width: 768px) {
	.float-container {
		right: 6px;
		bottom: 6px;
		--btn-size: 36px;
		--btn-padding: 4px;
		--float-gap: 5px;
	}

	.lang-options .lang-btn {
		font-size: 12px;
	}

	.btt-button svg {
		width: 15px;
		height: 15px;
	}
}

</style>

<style>
/* Clean Mode Hide UI */
html.clean-mode .z-10 > header,
html.clean-mode .z-10 > div.mx-auto,
html.clean-mode .z-10 > footer {
    opacity: 0 !important;
    pointer-events: none !important;
}

.z-10 > header,
.z-10 > div.mx-auto,
.z-10 > footer {
    transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
