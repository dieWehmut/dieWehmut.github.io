<template>
  <HomeView v-if="!isConsole" />
</template>

<script setup lang="ts">
import HomeView from './HomeView.vue'
import { useDisplayModePreference } from '../composables/useDisplayModePreference'

const { isConsole } = useDisplayModePreference()
</script>
