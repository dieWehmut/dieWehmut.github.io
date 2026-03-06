<template>
  <Home />
  <CenterToast />
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import Home from './pages/Home.vue'

const CenterToast = defineAsyncComponent({
  loader: () => import('./layouts/CenterToast.vue'),
  delay: 0,
  suspensible: false,
})
</script>
