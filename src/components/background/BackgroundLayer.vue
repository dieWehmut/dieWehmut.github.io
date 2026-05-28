<template>
  <div class="background-layer" aria-hidden="true">
    <template v-if="shouldRender">
      <ParticleCanvas />
      <SakuraCanvas />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ParticleCanvas from './ParticleCanvas.vue'
import SakuraCanvas from './SakuraCanvas.vue'
import { useBackgroundPreference } from '../../composables/useBackgroundPreference'
import { useMotionPreferences } from '../../composables/useMotionPreferences'

const { dynamicBackgroundEnabled } = useBackgroundPreference()
const { canAnimate } = useMotionPreferences()

const shouldRender = computed(() => dynamicBackgroundEnabled.value && canAnimate.value)
</script>

<style scoped>
.background-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
</style>
