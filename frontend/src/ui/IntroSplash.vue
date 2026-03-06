<template>
  <div class="intro-splash fixed inset-0 z-[6000] flex items-center justify-center overflow-hidden" @click="$emit('skip')" role="dialog" aria-label="Entry animation">
    <div class="splash-layer relative w-full max-w-[1100px] px-4 py-6 max-[640px]:px-3 max-[640px]:py-4 box-border" :class="{ ready: backgroundReady }">
        <!-- Two concentric semi-ring arcs -->
        <div class="rings absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <span class="semi-ring outer absolute rounded-full"></span>
          <span class="semi-ring inner absolute rounded-full"></span>
        </div>

        <div class="splash-inner text-center text-white" aria-hidden="false">
          <div class="splash-emblem mb-[18px] max-[640px]:mb-3 opacity-95 flex justify-center" aria-hidden="true">
            <svg class="w-[88px] h-[88px] max-[640px]:w-[56px] max-[640px]:h-[56px]" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="44" cy="44" r="20" fill="rgba(255,255,255,0.08)" />
              <circle cx="44" cy="44" r="36" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
            </svg>
          </div>

          <div class="splash-logo text-[44px] max-[640px]:text-[28px] font-[800] tracking-[0.6px] mb-1.5 inline-block relative" aria-hidden="false">
            <template v-for="(ch, i) in titleChars" :key="i">
              <span class="char inline-block" :style="{ 'animationDelay': (i * 45) + 'ms' }">{{ ch }}</span>
            </template>
          </div>

          <div class="splash-sub text-[14px] max-[640px]:text-[12px] opacity-[0.92]">{{ t('intro.subtitle') }}</div>

          <div class="splash-loader flex gap-2.5 justify-center mt-[18px] max-[640px]:mt-3" aria-hidden="true">
            <div class="dot" />
            <div class="dot" />
            <div class="dot" />
          </div>
        </div>

        <ul class="float-particles absolute inset-0 m-0 p-0 list-none pointer-events-none" aria-hidden="true">
          <li v-for="n in 22" :key="n" :style="particleStyle(n)"></li>
        </ul>
      </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
const props = defineProps({ backgroundReady: { type: Boolean, default: false } });
const emit = defineEmits(['skip']);
const { t } = useI18n();

import { computed, onMounted, onBeforeUnmount, ref } from 'vue';

// per-character title
const titleChars = computed(() => {
  const txt = (t('intro.title') || '').toString();
  return txt.split('');
});

// responsive particle count (based on window width)
const particleCount = ref(22);
function updateParticleCount() {
  if (typeof window === 'undefined') return;
  const w = window.innerWidth || 1024;
  // roughly one particle per ~50-80px, capped
  const approx = Math.floor(w / 50);
  particleCount.value = Math.min(40, Math.max(10, approx));
}

// choose a shape for particle by index
function shapeFor(i) {
  const mod = i % 6;
  if (mod === 0) return 'line';
  if (mod === 1 || mod === 4) return 'diamond';
  if (mod === 2) return 'spark';
  return 'circle';
}

function particleStyle(i) {
  // richer variety for particles
  const total = 22;
  const left = Math.round((i / total) * 100) + ((i % 5) - 2) * 2; // staggered horizontal start
  const delay = (i % 7) * 160 + Math.floor(Math.random() * 220);
  const size = 4 + (i % 6) * 3; // 4..19
  const dur = 4200 + (i % 7) * 900 + Math.floor(Math.random() * 2200); // var duration
  const opacity = (0.04 + (i % 6) * 0.08).toFixed(2);
  const drift = Math.round((Math.random() * 120 - 60)); // -60 .. 60 px
  const blur = Math.random() < 0.22 ? Math.round(Math.random() * 6) + 'px' : '0px';
  const hue = 200 + (i % 8) * 6; // bluish hues
  const color = `rgba(${220 - (i%6)*8}, ${230 - (i%5)*6}, 255, ${Math.max(0.25, parseFloat(opacity))})`;
  const rot = Math.round(Math.random() * 360) + 'deg';
  return {
    left: left + '%',
    animationDelay: delay + 'ms',
    width: size + 'px',
    height: size + 'px',
    opacity: opacity,
    ['--dur']: dur + 'ms',
    ['--drift']: drift + 'px',
    ['--blur']: blur,
    ['--color']: color,
    ['--rot']: rot,
  };
}

function handleKey(e) {
  if (e.key === 'Escape' || e.key === 'Esc') emit('skip');
}

onMounted(() => {
  updateParticleCount();
  window.addEventListener('resize', updateParticleCount);
  window.addEventListener('keydown', handleKey);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateParticleCount);
  window.removeEventListener('keydown', handleKey);
});
</script>

<style scoped>
/* background overlay */
.intro-splash {
  background: linear-gradient(180deg, rgba(0,0,0,0.72), rgba(0,0,0,0.36));
  backdrop-filter: blur(10px) saturate(1.05);
}
.splash-inner { transform-origin: center center; animation: splashIn 900ms cubic-bezier(.16,.9,.2,1) both }
.splash-logo { text-shadow: 0 6px 18px rgba(0,0,0,0.6); display:inline-block; position: relative }

.splash-emblem svg { filter: drop-shadow(0 8px 24px rgba(0,0,0,0.5)) }

.splash-loader .dot { width:10px; height:10px; background: linear-gradient(180deg,#fff,#e6f3ff); border-radius:50%; opacity:0.95; transform: translateY(0); animation: loaderBounce 1000ms infinite cubic-bezier(.2,.9,.2,1) }
.splash-loader .dot:nth-child(2){ animation-delay: 120ms }
.splash-loader .dot:nth-child(3){ animation-delay: 260ms }
.splash-layer.ready .dot { animation-play-state: paused; opacity:0.6; transform: scale(0.9) }
.splash-logo { animation: titleIn 900ms cubic-bezier(.16,.9,.2,1) both }
.splash-sub { animation: subIn 900ms cubic-bezier(.2,.9,.2,1) both; animation-delay: 120ms }
.splash-layer.ready .splash-inner { animation: splashExit 700ms ease forwards; animation-delay: 260ms }
.splash-logo .char { display:inline-block; opacity:0; transform: translateY(8px) scale(0.98); font-weight:800 }
.splash-logo .char:nth-child(odd) { color: #fff }
.splash-logo .char:nth-child(even) { color: #f3f9ff }
.splash-logo .char { animation: charIn 700ms cubic-bezier(.16,.9,.2,1) both }

/* shimmer overlay */
.splash-logo::after { content: ''; display:block; position:absolute; left:50%; top:50%; width:380px; height:60px; transform: translate(-50%,-50%) rotate(12deg); background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.14) 48%, rgba(255,255,255,0) 100%); opacity:0.06; pointer-events:none; animation: shimmer 2.6s linear infinite }

/* subtle logo pulse */
.splash-logo { animation: titlePulse 2200ms ease-in-out infinite; }

@keyframes titleIn { 0% { opacity:0; transform: translateY(10px) scale(0.98) } 60% { opacity:1; transform: translateY(-6px) scale(1.02) } 100% { opacity:1; transform: translateY(0) scale(1) } }
@keyframes subIn { 0% { opacity:0; transform: translateY(6px) } 100% { opacity:1; transform: translateY(0) } }
@keyframes titlePulse { 0% { transform: scale(1) } 50% { transform: scale(1.02) } 100% { transform: scale(1) } }

@keyframes splashExit { 0% { opacity:1; transform: translateY(0) scale(1) } 60% { opacity:0.9; transform: translateY(-16px) scale(1.06) } 100% { opacity:0; transform: translateY(-40px) scale(1.12) } }

@keyframes charIn { 0% { opacity:0; transform: translateY(8px) scale(0.98) } 60% { opacity:1; transform: translateY(-6px) scale(1.02) } 100% { opacity:1; transform: translateY(0) scale(1) } }

@keyframes shimmer { 0% { transform: translate(-120%,-50%) rotate(14deg) } 100% { transform: translate(120%,-50%) rotate(14deg) } }

/* concentric semi-ring arcs */
.semi-ring {
  border-style: solid;
  border-radius: 50%;
  transform-origin: center;
}
.semi-ring.outer {
  width: 460px; height: 460px;
  border-width: 4px;
  border-color: rgba(81, 214, 255, 0.95) rgba(81, 214, 255, 0.95) transparent transparent;
  clip-path: inset(0 0 50% 0);
  box-shadow: 0 0 32px rgba(81, 214, 255, 0.28);
  animation: spinCW 7s linear infinite;
}
.semi-ring.inner {
  width: 320px; height: 320px;
  border-width: 4px;
  border-color: transparent transparent rgba(255, 161, 95, 0.95) rgba(255, 161, 95, 0.95);
  clip-path: inset(50% 0 0 0);
  box-shadow: 0 0 28px rgba(255, 161, 95, 0.24);
  animation: spinCCW 10s linear infinite;
}

@keyframes spinCW { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
@keyframes spinCCW { from { transform: rotate(0deg) } to { transform: rotate(-360deg) } }

/* mobile: larger rings with more visible color contrast */
@media (max-width: 640px) {
  .semi-ring.outer {
    width: 320px;
    height: 320px;
    border-width: 3px;
  }

  .semi-ring.inner {
    width: 230px;
    height: 230px;
    border-width: 3px;
  }
}

@keyframes loaderBounce { 0% { transform: translateY(0); opacity: 0.8 } 50% { transform: translateY(-12px); opacity:1 } 100% { transform: translateY(0); opacity:0.8 } }

@keyframes splashIn { 0% { opacity:0; transform: translateY(12px) scale(0.98) } 60% { opacity:1; transform: translateY(-6px) scale(1.02) } 100% { opacity:1; transform: translateY(0) scale(1) } }

/* floating particle accents */
.float-particles li {
  position:absolute;
  bottom:-8%;
  border-radius:50%;
  background: var(--color, rgba(255,255,255,0.06));
  animation: floatUp var(--dur, 7000ms) linear infinite;
  filter: blur(var(--blur, 0px));
  transform-origin: center;
}
.float-particles li:nth-child(odd) { background: var(--color, rgba(255,255,255,0.08)) }

/* different shapes */
.float-particles li[data-shape="line"] { width: calc(var(--line-w, 28px)); height: 2px; border-radius:2px; background: linear-gradient(90deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06)); }
.float-particles li[data-shape="diamond"] { width: 10px; height: 10px; transform: rotate(45deg); background: linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06)); }
.float-particles li[data-shape="spark"] { width: 6px; height: 6px; background: radial-gradient(circle at 40% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.18)); box-shadow: 0 6px 14px rgba(120,160,255,0.18); }
.float-particles li[data-shape="circle"] { border-radius:50%; }

.float-particles li { animation-timing-function: ease-in-out }
.float-particles li { --rot-step: var(--rot, 0deg); }
.float-particles li { transform: translateZ(0) rotate(var(--rot-step)); }
.float-particles li[data-shape="line"] { transform: rotate(calc(var(--rot, 0deg) + -6deg)); }

@keyframes floatUp {
  0% { transform: translateY(0) translateX(0) scale(0.8) rotate(var(--rot, 0deg)); opacity:0 }
  8% { opacity:0.9 }
  30% { transform: translateY(-28vh) translateX(calc(var(--drift) * 0.5)) scale(1) rotate(calc(var(--rot, 0deg) + 8deg)); opacity:0.95 }
  65% { transform: translateY(-68vh) translateX(calc(var(--drift) * -0.2)) scale(1.05) rotate(calc(var(--rot, 0deg) - 6deg)); opacity:0.85 }
  100% { transform: translateY(-120vh) translateX(calc(var(--drift) * -0.6)) scale(1.2) rotate(calc(var(--rot, 0deg) + 12deg)); opacity:0 }
}

/* respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .splash-inner { animation-duration: 220ms !important }
  .semi-ring,.float-particles li,.splash-loader .dot,.splash-logo .char,.splash-logo::after { animation: none !important }
  .float-particles li { transition: none !important; transform: none !important }
}
</style>
