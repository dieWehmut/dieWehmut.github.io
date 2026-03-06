<template>
  <canvas ref="canvasRef" class="particle-canvas" aria-hidden="true" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasRef = ref(null)
let animId = null
let ctx = null
let W = 0
let H = 0
let dpr = 1

// ── tuning ─────────────────────────────────────────────────────────────────
const COUNT        = 260    // 雪的密度
const AREA         = 420    // density reference area (px²/particle)
const MIN_R        = 2.1    // min radius px (logical)
const MAX_R        = 6.8    // max radius px (logical)
const SPEED_BASE   = 0.78   // base fall speed (logical px/frame) – gentle drift
const GRAB_DIST    = 180    // mouse grab distance (logical px)
const GRAB_OPACITY = 0.68   // line opacity at distance=0
const LINE_WIDTH   = 1.25   // grab line width px
// ───────────────────────────────────────────────────────────────────────────

// mouse in logical coords
const mouse = { x: -99999, y: -99999, active: false }

let particles = []

function rand(a, b) { return a + Math.random() * (b - a) }

/** create one snowflake, optionally place it at a random y (on init) or at top (respawn) */
function mkParticle(initY = false) {
  const r  = rand(MIN_R, MAX_R)
  const sp = rand(SPEED_BASE * 0.5, SPEED_BASE * 1.6)
  return {
    x:  rand(0, W / dpr),
    y:  initY ? rand(-20, H / dpr) : rand(-20, -r),
    r,
    vy: sp,                          // always positive → downward
    vx: rand(-0.85, 0.85),            // slight horizontal drift
    sway: rand(0.008, 0.028),
    swayAmp: rand(0.25, 1.4),
    phase: rand(0, Math.PI * 2),
    glow: rand(0.18, 0.45),
    opacity: rand(0.58, 0.98),
  }
}

function targetCount() {
  const area = (W / dpr) * (H / dpr)
  return Math.round(COUNT * area / (AREA * 1000))
}

function init() {
  const canvas = canvasRef.value
  if (!canvas) return
  dpr = window.devicePixelRatio || 1
  W   = window.innerWidth  * dpr
  H   = window.innerHeight * dpr
  canvas.width  = W
  canvas.height = H
  canvas.style.width  = window.innerWidth  + 'px'
  canvas.style.height = window.innerHeight + 'px'
  ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  const n = targetCount()
  particles = Array.from({ length: n }, () => mkParticle(true))
}

function dist2(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by
  return dx * dx + dy * dy
}

function frame() {
  const lW = W / dpr
  const lH = H / dpr
  ctx.clearRect(0, 0, lW, lH)

  // ── update positions ──
  for (const p of particles) {
    p.phase += p.sway
    p.x += p.vx + Math.sin(p.phase) * p.swayAmp
    p.y += p.vy

    // wrap left/right
    if (p.x < -p.r)      p.x = lW + p.r
    if (p.x > lW + p.r)  p.x = -p.r
    // respawn at top when fallen off bottom
    if (p.y - p.r > lH) {
      p.x = rand(0, lW)
      p.y = rand(-20, -p.r)
    }
  }

  // ── grab lines (mouse → nearby particles) ──
  if (mouse.active) {
    const mx = mouse.x, my = mouse.y
    const gd2 = GRAB_DIST * GRAB_DIST
    for (const p of particles) {
      const d2 = dist2(mx, my, p.x, p.y)
      if (d2 > gd2) continue
      const ratio = 1 - d2 / gd2
      const alpha = (GRAB_OPACITY * ratio).toFixed(3)
      ctx.beginPath()
      ctx.moveTo(mx, my)
      ctx.lineTo(p.x, p.y)
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`
      ctx.lineWidth   = LINE_WIDTH
      ctx.stroke()
    }
  }

  // ── draw snowflakes ──
  for (const p of particles) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r * 2.4, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${(p.glow * 0.26).toFixed(2)})`
    ctx.fill()

    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${p.opacity.toFixed(2)})`
    ctx.fill()
  }

  animId = requestAnimationFrame(frame)
}

function onMouseMove(e) {
  mouse.x = e.clientX
  mouse.y = e.clientY
  mouse.active = true
}
function onMouseLeave() {
  mouse.active = false
}

let resizeTimer = null
function onResize() {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    if (!canvasRef.value) return
    dpr = window.devicePixelRatio || 1
    W   = window.innerWidth  * dpr
    H   = window.innerHeight * dpr
    canvasRef.value.width  = W
    canvasRef.value.height = H
    canvasRef.value.style.width  = window.innerWidth  + 'px'
    canvasRef.value.style.height = window.innerHeight + 'px'
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)
    // re-balance particle count
    const want = targetCount()
    while (particles.length < want) particles.push(mkParticle(true))
    if (particles.length > want) particles.length = want
  }, 120)
}

onMounted(() => {
  init()
  animId = requestAnimationFrame(frame)
  window.addEventListener('mousemove',  onMouseMove,  { passive: true })
  window.addEventListener('mouseleave', onMouseLeave, { passive: true })
  window.addEventListener('resize',     onResize,     { passive: true })
})

onBeforeUnmount(() => {
  if (animId) cancelAnimationFrame(animId)
  window.removeEventListener('mousemove',  onMouseMove)
  window.removeEventListener('mouseleave', onMouseLeave)
  window.removeEventListener('resize',     onResize)
  clearTimeout(resizeTimer)
})
</script>

<style scoped>
/* Layout styles moved to src/styles/animation/snow/index.scss */
</style>
