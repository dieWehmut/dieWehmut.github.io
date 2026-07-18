<template>
  <div
    ref="cursorRef"
    v-show="visible"
    class="heart-bounce-cursor"
    aria-hidden="true"
  >
    <div class="heart-bounce-cursor__icon">
      <div class="ripple" aria-hidden="true"></div>
    </div>
  </div>
  <canvas
    ref="dotsCanvasRef"
    v-show="visible"
    class="heart-dots-canvas"
    aria-hidden="true"
  ></canvas>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useMotionPreferences } from '../../composables/useMotionPreferences'
import { useColorSchemePreference } from '../../composables/useColorSchemePreference'

const cursorRef = ref(null)
const dotsCanvasRef = ref(null)
const visible = ref(false)
const { canUsePointerEffects } = useMotionPreferences()
const { colorScheme } = useColorSchemePreference()

// ── 弹性点环（仿 cnblogs type:12 / mouseType3）─────────────────────────────
// 头点跟随爱心中心，多条链沿角度放射，每个点弹性追踪父点
// 点的颜色跟随当前主题的 accent 色（绿/紫/粉随配色切换而变）
const RING_SPEED   = 4     // 追踪阻尼（越大越滞后柔软）
const RING_ANIM_R  = 2     // 弹簧系数
const RING_ANGLE_STEP = 30 // 每条链的角度间隔（度）→ 12 条
const RING_R_MIN   = 10    // 链上点的最小半径
const RING_R_MAX   = 34    // 链上点的最大半径
const RING_R_STEP  = 2     // 半径步进（越大点越少）→ 每链 12 点
const RING_DOT_SIZE = 2.5   // 点直径 px
const RING_SPIN_SPEED = 0.012 // 自旋角速度（rad/帧）→ 60fps 下约一圈 8.7s
const RING_TRAIL_LEN = 7      // 尾点流线长度 px（沿切向）
const RING_TRAIL_WIDTH = 1    // 流线宽度 px
const RING_FALLBACK_COLOR = '#ff69b4' // 读不到主题色时的兜底（爱心粉）
let ringColor = RING_FALLBACK_COLOR   // 当前点环颜色，来自 --site-accent

/** 从主题 CSS 变量读取当前 accent 色，主题切换时刷新 */
function refreshRingColor() {
  if (typeof document === 'undefined') return
  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue('--site-accent')
    .trim()
  ringColor = accent || RING_FALLBACK_COLOR
}

let dotsCtx = null
let dotsW = 0
let dotsH = 0
let dotsDpr = 1
let ringNodes = []          // 弹性点节点
// 上一帧点环包围盒（逻辑坐标），脏矩形清除用，避免全屏 clearRect
let prevDirty = null
let ringAnimId = null
// 头点目标（爱心中心，逻辑坐标）
const ringTarget = { x: -9999, y: -9999 }

// 全局自旋角（每帧递增），让点环静止时也缓慢绕中心自转
let ringSpin = 0

/** 一个弹性点节点：以极坐标 (baseRad, offR) 存相对父点的偏移，便于整体旋转 */
function makeRingNode(parent, baseRad, offR) {
  return {
    parent, baseRad, offR,
    cx: 0, cy: 0, // 每帧由 baseRad + ringSpin 重算
    ddx: 0, ddy: 0, px: 0, py: 0, x: 0, y: 0,
    isTail: false,
  }
}

function buildRing() {
  ringNodes = []
  // 头点（index 0）：直接跟随爱心中心，无偏移
  const head = makeRingNode(null, 0, 0)
  ringNodes.push(head)
  for (let ang = 0; ang < 360; ang += RING_ANGLE_STEP) {
    const rad = (ang * Math.PI) / 180
    let prev = head
    let tail = null
    for (let r = RING_R_MIN; r < RING_R_MAX; r += RING_R_STEP) {
      // 偏移半径 = r/4（与样例一致），角度随全局自旋旋转
      const node = makeRingNode(prev, rad, r / 4)
      ringNodes.push(node)
      prev = node
      tail = node
    }
    // 每条链最外侧的点：旋转时拖一条细小切向流线
    if (tail) tail.isTail = true
  }
}

function resizeDots() {
  const canvas = dotsCanvasRef.value
  if (!canvas) return
  dotsDpr = window.devicePixelRatio || 1
  dotsW = window.innerWidth
  dotsH = window.innerHeight
  canvas.width = dotsW * dotsDpr
  canvas.height = dotsH * dotsDpr
  canvas.style.width = dotsW + 'px'
  canvas.style.height = dotsH + 'px'
  dotsCtx = canvas.getContext('2d', { alpha: true })
  dotsCtx.setTransform(1, 0, 0, 1, 0, 0)
  dotsCtx.scale(dotsDpr, dotsDpr)
  prevDirty = null // 画布尺寸变了，旧脏矩形失效
}

function stepRing() {
  // 每帧推进全局自旋角，保持在 [0, 2π) 避免浮点无限增长
  ringSpin += RING_SPIN_SPEED
  if (ringSpin >= Math.PI * 2) ringSpin -= Math.PI * 2

  const n = ringNodes.length
  for (let i = 0; i < n; i++) {
    const node = ringNodes[i]
    // 头点（无 parent）不旋转；其余按 baseRad + 自旋角实时重算偏移目标
    if (node.parent) {
      const ang = node.baseRad + ringSpin
      node.cx = node.offR * Math.cos(ang)
      node.cy = node.offR * Math.sin(ang)
    }
    const x0 = node.parent ? node.parent.x : ringTarget.x
    const y0 = node.parent ? node.parent.y : ringTarget.y
    node.ddx += (x0 - node.px - node.ddx + node.cx) / RING_ANIM_R
    node.ddy += (y0 - node.py - node.ddy + node.cy) / RING_ANIM_R
    node.px += node.ddx / RING_SPEED
    node.py += node.ddy / RING_SPEED
    node.x = node.px
    node.y = node.py
  }
}

// 上一帧点环包围盒（逻辑坐标），用于脏矩形清除，避免全屏 clearRect
function drawRing() {
  if (!dotsCtx) return
  const half = RING_DOT_SIZE / 2
  const n = ringNodes.length

  // 只清除上一帧绘制过的区域，而不是整块全屏画布
  if (prevDirty) {
    dotsCtx.clearRect(prevDirty.x, prevDirty.y, prevDirty.w, prevDirty.h)
  }

  // 一趟计算包围盒并绘制（单一主题色）
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  dotsCtx.fillStyle = ringColor
  dotsCtx.strokeStyle = ringColor
  dotsCtx.lineWidth = RING_TRAIL_WIDTH
  dotsCtx.lineCap = 'round'
  const acc = (x, y) => {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  for (let i = 1; i < n; i++) {
    const node = ringNodes[i]
    const x = node.x, y = node.y
    dotsCtx.fillRect(x - half, y - half, RING_DOT_SIZE, RING_DOT_SIZE)
    acc(x, y)
    // 尾点：沿切向反方向拖一条细流线（旋转的瞬时速度反向 = 拖尾）
    if (node.isTail) {
      const ang = node.baseRad + ringSpin
      // 切向 = 半径方向 +90°；自旋角递增，拖尾指向切向反方向
      const tx = Math.sin(ang)
      const ty = -Math.cos(ang)
      const ex = x + tx * RING_TRAIL_LEN
      const ey = y + ty * RING_TRAIL_LEN
      dotsCtx.beginPath()
      dotsCtx.moveTo(x, y)
      dotsCtx.lineTo(ex, ey)
      dotsCtx.stroke()
      acc(ex, ey)
    }
  }

  // 记录本帧脏矩形（含点尺寸 + 1px 余量），供下一帧清除
  if (maxX >= minX) {
    prevDirty = {
      x: minX - half - 1,
      y: minY - half - 1,
      w: (maxX - minX) + RING_DOT_SIZE + 2,
      h: (maxY - minY) + RING_DOT_SIZE + 2,
    }
  } else {
    prevDirty = null
  }
}

function ringLoop() {
  stepRing()
  drawRing()
  ringAnimId = requestAnimationFrame(ringLoop)
}

function seedRingAtTarget() {
  // 把所有节点初始位置对齐到当前目标，避免从 (0,0) 飞入的突兀感
  if (ringTarget.x < 0) return
  for (let i = 0; i < ringNodes.length; i++) {
    const node = ringNodes[i]
    // 先按当前自旋角算好偏移，否则 cx/cy 尚为 0 会让点先堆在中心再炸开
    if (node.parent) {
      const ang = node.baseRad + ringSpin
      node.cx = node.offR * Math.cos(ang)
      node.cy = node.offR * Math.sin(ang)
    }
    node.px = node.x = ringTarget.x + node.cx
    node.py = node.y = ringTarget.y + node.cy
    node.ddx = 0
    node.ddy = 0
  }
}

function startRing() {
  if (ringAnimId != null) return
  resizeDots()
  refreshRingColor()
  if (!ringNodes.length) buildRing()
  seedRingAtTarget()
  ringLoop()
}

function stopRing() {
  if (ringAnimId != null) {
    cancelAnimationFrame(ringAnimId)
    ringAnimId = null
  }
  if (dotsCtx) dotsCtx.clearRect(0, 0, dotsW, dotsH)
  prevDirty = null
}

const CLICKABLE_SELECTOR = [
  'button',
  'a',
  '[role="button"]',
  '.clickable',
  '.action-btn',
  '.repo-link',
  '.repo-button',
  '.link-button',
  '.copy-btn',
  '.nav-btn',
  '.github-btn',
  '.tool-row',
].join(',')

function isTextInputLike(el) {
  if (!el) return false
  if (el.matches?.('input, textarea, select, option, [contenteditable="true"]')) return true
  return !!el.closest?.('input, textarea, select, [contenteditable="true"]')
}

let rafId = null
let _lastTarget = null
let pendingX = -9999
let pendingY = -9999
let eventsBound = false

function updateHoverState(target) {
  const root = document.documentElement
  // 全局显示：除文本输入区外，任意位置都显示爱心 + 点环
  if (!target || isTextInputLike(target)) {
    visible.value = false
    root.classList.remove('heart-bounce-active')
    return
  }
  visible.value = true
  root.classList.add('heart-bounce-active')
}

function onMouseMove(e) {
  pendingX = e.clientX
  pendingY = e.clientY

  // 点环头点目标 = 爱心中心（图标 24×24，锚点在 x-12,y-20 → 中心约 x, y-8）
  ringTarget.x = pendingX
  ringTarget.y = pendingY - 8

  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    const el = cursorRef.value
    if (el) {
      el.style.transform = `translate3d(${pendingX - 12}px, ${pendingY - 20}px, 0)`
    }
  })

  // Check hover state only when the target element actually changes
  if (e.target !== _lastTarget) {
    _lastTarget = e.target
    updateHoverState(e.target)
  }
}

function onMouseLeave() {
  _lastTarget = null
  visible.value = false
  document.documentElement.classList.remove('heart-bounce-active')
}

function bindEvents() {
  if (eventsBound || !canUsePointerEffects.value) return
  window.addEventListener('mousemove', onMouseMove, { passive: true })
  window.addEventListener('mouseleave', onMouseLeave, { passive: true })
  eventsBound = true
}

function unbindEvents() {
  if (!eventsBound) return
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseleave', onMouseLeave)
  eventsBound = false
}

function syncPointerEffects() {
  if (!canUsePointerEffects.value) {
    visible.value = false
    _lastTarget = null
    document.documentElement.classList.remove('heart-bounce-active')
    unbindEvents()
    stopRing()
    return
  }
  bindEvents()
}

watch(canUsePointerEffects, syncPointerEffects, { immediate: true })

// 点环随爱心显隐启停
watch(visible, (v) => {
  if (v && canUsePointerEffects.value) startRing()
  else stopRing()
})

// 主题配色切换时，点环颜色同步刷新
watch(colorScheme, () => {
  refreshRingColor()
})

let ringResizeTimer = null
function onRingResize() {
  clearTimeout(ringResizeTimer)
  ringResizeTimer = setTimeout(() => {
    if (ringAnimId != null) resizeDots()
  }, 120)
}

onMounted(() => {
  syncPointerEffects()
  window.addEventListener('resize', onRingResize, { passive: true })
})

onBeforeUnmount(() => {
  unbindEvents()
  document.documentElement.classList.remove('heart-bounce-active')
  if (rafId) cancelAnimationFrame(rafId)
  stopRing()
  window.removeEventListener('resize', onRingResize)
  clearTimeout(ringResizeTimer)
})
</script>

<style scoped>
.heart-bounce-cursor {
  position: fixed;
  left: 0;
  top: 0;
  width: 24px;
  height: 24px;
  transform: translate3d(-9999px, -9999px, 0);
  pointer-events: none;
  z-index: 2147483647 !important;
  will-change: transform;
  contain: layout style paint;
}

.heart-dots-canvas {
  position: fixed;
  left: 0;
  top: 0;
  pointer-events: none;
  z-index: 2147483646; /* 紧贴爱心之下 */
  will-change: transform;
}

.heart-bounce-cursor__icon {
  position: relative;
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  background-size: contain;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' fill='%23ff69b4'/%3E%3C/svg%3E");
  animation: heartBounce 560ms ease-in-out infinite;
  will-change: transform;
}

.heart-bounce-cursor .ripple {
  position: absolute;
  left: 50%;
  top: 100%;
  width: 10px;
  height: 4px;
  transform: translate(-50%, -6px) scale(0);
  border-radius: 50%;
  background: rgba(255,40,40,0.95);
  opacity: 0;
  filter: blur(0.6px);
  pointer-events: none;
  animation: heartRipple 560ms ease-out infinite;
  transform-origin: center;
}

@keyframes heartRipple {
  0%, 78% { opacity: 0; transform: translate(-50%, -6px) scale(0); }
  86% { opacity: 0.65; transform: translate(-50%, -2px) scale(0.6); }
  100% { opacity: 0; transform: translate(-50%, 0px) scale(2.2); }
}

@keyframes heartBounce {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  35% { transform: translate3d(0, -4px, 0) scale(1.08); }
  60% { transform: translate3d(0, 2px, 0) scale(0.96); }
}

/* 全局隐藏原生光标，只保留爱心 + 点环（文本输入区除外，见下方恢复规则）*/
:global(html.heart-bounce-active),
:global(html.heart-bounce-active *) {
  cursor: none !important;
}

/* 文本输入区恢复原生光标，方便编辑 */
:global(html.heart-bounce-active input),
:global(html.heart-bounce-active textarea),
:global(html.heart-bounce-active select),
:global(html.heart-bounce-active [contenteditable="true"]) {
  cursor: auto !important;
}
</style>
