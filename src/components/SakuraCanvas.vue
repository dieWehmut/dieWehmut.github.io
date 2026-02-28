<template>
  <canvas ref="canvasRef" class="sakura-canvas" aria-hidden="true" />
</template>

<script setup>
/**
 * SakuraCanvas – realistic cherry-blossom petals drifting down.
 * Bezier-curve petal shapes with gradient fills, 3D rotation simulation,
 * vein details, and natural physics.
 *
 * Interaction:
 * - Petals auto-collect when the cursor is near them.
 * - Clicking ANYWHERE scatters all collected petals (no threshold).
 * - Canvas is always pointer-events:none so clicks pass through to UI.
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasRef = ref(null)
let animId = null
let ctx = null
let W = 0, H = 0, dpr = 1

// ── tuning ─────────────────────────────────────────────────────────────
const PETAL_COUNT      = 35
const MIN_SIZE         = 10
const MAX_SIZE         = 24
const FALL_SPEED       = 0.45
const DRIFT_SPEED      = -0.35
const ROTATION_SP      = 0.01
const PICK_DIST        = 34
const HOVER_DIST       = 40
const CLUSTER_RADIUS   = 26
const CLUSTER_LERP     = 0.15
// ───────────────────────────────────────────────────────────────────────

const mouse = { x: -99999, y: -99999 }
let petals = []
let collected = []
let burstPetals = []
let hoveringPetal = false
let pickCooldown = 0

function rand(a, b) { return a + Math.random() * (b - a) }

function mkPetal(initScatter = false) {
  const size = rand(MIN_SIZE, MAX_SIZE)
  const lW = W / dpr, lH = H / dpr
  return {
    x: initScatter ? rand(0, lW) : rand(lW * 0.3, lW + 40),
    y: initScatter ? rand(-30, lH) : rand(-60, -size),
    size,
    vy: rand(FALL_SPEED * 0.5, FALL_SPEED * 1.4),
    vx: rand(DRIFT_SPEED * 1.5, DRIFT_SPEED * 0.3),
    angle: rand(0, Math.PI * 2),
    va: rand(-ROTATION_SP, ROTATION_SP) || ROTATION_SP,
    // 3D tumble simulation
    tilt3d: rand(0, Math.PI * 2),
    tiltSpeed: rand(0.008, 0.022),
    wobbleAmp: rand(0.3, 1.1),
    wobbleSpeed: rand(0.008, 0.022),
    wobblePhase: rand(0, Math.PI * 2),
    tick: 0,
    opacity: rand(0.6, 0.95),
    hue: rand(-8, 12),          // color variation around pink
    lightness: rand(80, 92),
    // per-petal shape variation
    notchDepth: rand(0.12, 0.28), // V-notch at tip
    asymmetry: rand(-0.06, 0.06), // slight left/right asymmetry
    // cluster target (when collected)
    cx: 0, cy: 0,
    sx: 0, sy: 0,
    clusterPhase: rand(0, Math.PI * 2),
    clusterSpeed: rand(0.8, 1.4),
    clusterFloat: rand(1.6, 4.8),
  }
}

function dist(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by
  return Math.sqrt(dx * dx + dy * dy)
}

// ── draw a realistic cherry-blossom petal with bezier curves ──
function drawPetalShape(p, x, y, scale) {
  const s = (scale || 1) * p.size / 2
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(p.angle)

  // 3D tumble: vary horizontal scale to simulate the petal rotating in space
  const tilt = 0.22 + 0.78 * Math.abs(Math.cos(p.tilt3d))
  ctx.scale(tilt, 1)

  const h = 340 + p.hue
  const nd = p.notchDepth
  const asym = p.asymmetry

  // ── petal outline via bezier curves ──
  ctx.beginPath()
  // Start at stem (bottom, narrow end)
  ctx.moveTo(0, s * 0.88)
  // Right edge: curve from stem up toward tip
  ctx.bezierCurveTo(
    s * (0.48 + asym), s * 0.32,
    s * (0.62 + asym), -s * 0.12,
    s * 0.3, -s * (0.68 - nd * 0.3)
  )
  // Right side of the V-notch at tip
  ctx.bezierCurveTo(
    s * 0.16, -s * (0.82 + nd * 0.12),
    s * 0.06, -s * (0.72 + nd * 0.15),
    0, -s * (0.58 + nd * 0.12)
  )
  // Left side of the notch
  ctx.bezierCurveTo(
    -s * 0.06, -s * (0.72 + nd * 0.15),
    -s * 0.16, -s * (0.82 + nd * 0.12),
    -s * 0.3, -s * (0.68 - nd * 0.3)
  )
  // Left edge: curve back down to stem
  ctx.bezierCurveTo(
    -s * (0.62 - asym), -s * 0.12,
    -s * (0.48 - asym), s * 0.32,
    0, s * 0.88
  )
  ctx.closePath()

  // ── radial gradient: lighter center, richer edges ──
  const grad = ctx.createRadialGradient(0, -s * 0.05, s * 0.04, 0, 0, s * 0.88)
  grad.addColorStop(0,    `hsla(${h}, 85%, 96%, ${p.opacity})`)
  grad.addColorStop(0.35, `hsla(${h}, 78%, ${p.lightness + 3}%, ${p.opacity})`)
  grad.addColorStop(0.72, `hsla(${h}, 72%, ${p.lightness}%, ${p.opacity})`)
  grad.addColorStop(1,    `hsla(${h}, 65%, ${p.lightness - 6}%, ${p.opacity * 0.72})`)
  ctx.fillStyle = grad
  ctx.fill()

  // ── center vein (crease) ──
  ctx.strokeStyle = `hsla(${h}, 42%, ${p.lightness - 18}%, ${p.opacity * 0.22})`
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.moveTo(0, s * 0.6)
  ctx.quadraticCurveTo(s * 0.01, 0, 0, -s * 0.42)
  ctx.stroke()

  // ── secondary veins ──
  ctx.strokeStyle = `hsla(${h}, 38%, ${p.lightness - 12}%, ${p.opacity * 0.1})`
  ctx.lineWidth = 0.3
  ctx.beginPath()
  ctx.moveTo(0, s * 0.28)
  ctx.quadraticCurveTo(s * 0.14, -s * 0.08, s * 0.2, -s * 0.38)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(0, s * 0.28)
  ctx.quadraticCurveTo(-s * 0.14, -s * 0.08, -s * 0.2, -s * 0.38)
  ctx.stroke()

  // ── edge highlight (light catching one side) ──
  ctx.strokeStyle = `hsla(${h}, 60%, 97%, ${p.opacity * 0.12})`
  ctx.lineWidth = 0.6
  ctx.beginPath()
  ctx.moveTo(0, s * 0.88)
  ctx.bezierCurveTo(
    s * (0.48 + asym), s * 0.32,
    s * (0.62 + asym), -s * 0.12,
    s * 0.3, -s * (0.68 - nd * 0.3)
  )
  ctx.stroke()

  ctx.restore()
}

// ── assign cluster positions (tight pile around cursor) ──
function assignClusterPositions() {
  const n = collected.length
  if (n === 0) return
  for (let i = 0; i < n; i++) {
    const angle = i * 2.399963 // golden angle
    const r = Math.min(CLUSTER_RADIUS, 8 + Math.sqrt(i) * 5.4)
    collected[i].cx = Math.cos(angle) * r
    collected[i].cy = Math.sin(angle) * r + 2
  }
}

// ── burst / scatter all collected petals ──
function triggerBurst() {
  const mx = mouse.x, my = mouse.y
  for (let i = 0; i < collected.length; i++) {
    const c = collected[i]
    const scatterAngle = rand(0, Math.PI * 2)
    const speed = rand(3, 10)
    burstPetals.push({
      ...c,
      x: c.sx, y: c.sy,
      bvx: Math.cos(scatterAngle) * speed,
      bvy: Math.sin(scatterAngle) * speed - 1.5,
      life: 1.0,
      decay: rand(0.006, 0.016),
    })
  }
  // extra sparkle petals
  const sparkles = Math.min(18, collected.length * 3)
  for (let i = 0; i < sparkles; i++) {
    const p = mkPetal(false)
    p.size = rand(5, 14)
    const sa = rand(0, Math.PI * 2)
    const sp = rand(2, 8)
    burstPetals.push({
      ...p,
      x: mx, y: my,
      bvx: Math.cos(sa) * sp,
      bvy: Math.sin(sa) * sp - 1,
      life: 1.0,
      decay: rand(0.008, 0.022),
    })
  }
  collected = []
  document.documentElement.classList.remove('sakura-grabbing')
}

function init() {
  const canvas = canvasRef.value
  if (!canvas) return
  dpr = window.devicePixelRatio || 1
  W = window.innerWidth * dpr
  H = window.innerHeight * dpr
  canvas.width = W
  canvas.height = H
  canvas.style.width  = window.innerWidth  + 'px'
  canvas.style.height = window.innerHeight + 'px'
  ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  petals = Array.from({ length: PETAL_COUNT }, () => mkPetal(true))
}

function frame() {
  if (pickCooldown > 0) pickCooldown--
  const lW = W / dpr, lH = H / dpr
  ctx.clearRect(0, 0, lW, lH)

  const mx = mouse.x, my = mouse.y
  let foundHover = false

  // ── update & draw falling petals ──
  for (let i = petals.length - 1; i >= 0; i--) {
    const p = petals[i]
    p.tick++
    p.tilt3d += p.tiltSpeed // 3D tumble rotation

    const wobble = Math.sin(p.tick * p.wobbleSpeed + p.wobblePhase) * p.wobbleAmp
    p.x += p.vx + wobble
    p.y += p.vy
    p.angle += p.va

    // respawn off-screen petals
    if (p.y - p.size > lH || p.x + p.size < -10) {
      p.x = rand(lW * 0.3, lW + 40)
      p.y = rand(-60, -p.size)
      p.tick = 0
      p.tilt3d = rand(0, Math.PI * 2)
    }

    // auto-collect on proximity
    if (mx > -9999) {
      const d = dist(mx, my, p.x, p.y)
      if (d < HOVER_DIST) foundHover = true
      if (d < PICK_DIST && pickCooldown <= 0) {
        pickCooldown = 4
        const [picked] = petals.splice(i, 1)
        picked.sx = picked.x
        picked.sy = picked.y
        collected.push(picked)
        petals.push(mkPetal(false))
        assignClusterPositions()
        continue
      }
    }

    drawPetalShape(p, p.x, p.y)
  }

  // ── draw collected petals at cursor ──
  for (let i = 0; i < collected.length; i++) {
    const c = collected[i]
    c.tick++
    const floatX = Math.cos(c.tick * 0.05 * c.clusterSpeed + c.clusterPhase) * c.clusterFloat
    const floatY = Math.sin(c.tick * 0.06 * c.clusterSpeed + c.clusterPhase) * c.clusterFloat
    const tx = mx + c.cx + floatX
    const ty = my + c.cy + floatY
    c.sx += (tx - c.sx) * CLUSTER_LERP
    c.sy += (ty - c.sy) * CLUSTER_LERP
    c.angle += c.va * 0.4
    c.tilt3d += c.tiltSpeed * 0.3
    drawPetalShape(c, c.sx, c.sy, 0.75)
  }

  // ── draw burst particles ──
  for (let i = burstPetals.length - 1; i >= 0; i--) {
    const b = burstPetals[i]
    b.x += b.bvx
    b.y += b.bvy
    b.bvy += 0.1
    b.bvx *= 0.988
    b.angle += b.va * 1.8
    b.tilt3d += b.tiltSpeed * 2
    b.life -= b.decay
    if (b.life <= 0) {
      burstPetals.splice(i, 1)
      continue
    }
    const origOp = b.opacity
    b.opacity = origOp * b.life
    drawPetalShape(b, b.x, b.y, 0.5 + b.life * 0.6)
    b.opacity = origOp
  }

  // ── cursor class management ──
  if (collected.length > 0) {
    if (!document.documentElement.classList.contains('sakura-grabbing')) {
      document.documentElement.classList.add('sakura-grabbing')
      document.documentElement.classList.remove('sakura-hover')
    }
  } else if (foundHover !== hoveringPetal) {
    hoveringPetal = foundHover
    if (foundHover) {
      document.documentElement.classList.add('sakura-hover')
    } else {
      document.documentElement.classList.remove('sakura-hover')
    }
  } else if (!foundHover && collected.length === 0) {
    document.documentElement.classList.remove('sakura-hover', 'sakura-grabbing')
  }

  animId = requestAnimationFrame(frame)
}

function onMouseMove(e) {
  mouse.x = e.clientX
  mouse.y = e.clientY
}
function onMouseLeave() {
  mouse.x = -99999
  mouse.y = -99999
  hoveringPetal = false
  document.documentElement.classList.remove('sakura-hover')
}

// Global click: scatter any collected petals (click still passes through to UI)
function onGlobalClick() {
  if (collected.length > 0) {
    triggerBurst()
  }
}

let resizeTimer = null
function onResize() {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    if (!canvasRef.value) return
    dpr = window.devicePixelRatio || 1
    W = window.innerWidth * dpr
    H = window.innerHeight * dpr
    canvasRef.value.width = W
    canvasRef.value.height = H
    canvasRef.value.style.width  = window.innerWidth  + 'px'
    canvasRef.value.style.height = window.innerHeight + 'px'
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)
  }, 120)
}

onMounted(() => {
  init()
  animId = requestAnimationFrame(frame)
  window.addEventListener('mousemove',  onMouseMove,  { passive: true })
  window.addEventListener('mouseleave', onMouseLeave, { passive: true })
  window.addEventListener('resize',     onResize,     { passive: true })
  window.addEventListener('mousedown',  onGlobalClick, { passive: true })
})

onBeforeUnmount(() => {
  if (animId) cancelAnimationFrame(animId)
  window.removeEventListener('mousemove',  onMouseMove)
  window.removeEventListener('mouseleave', onMouseLeave)
  window.removeEventListener('resize',     onResize)
  window.removeEventListener('mousedown',  onGlobalClick)
  clearTimeout(resizeTimer)
  document.documentElement.classList.remove('sakura-hover', 'sakura-grabbing')
})
</script>

<style scoped>
/* Layout styles in src/styles/animation/sakura/index.scss */
</style>
