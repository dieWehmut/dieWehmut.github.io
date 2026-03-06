<template>
  <Home />
</template>

<script setup>
import Home from './pages/Home.vue'
</script>

<style>
:root {
  color-scheme: light;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-synthesis: none;
  line-height: 1.5;
  text-rendering: optimizeLegibility;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body,
#app {
  margin: 0;
  min-height: 100vh;
}

body {
  background: #020617;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input,
textarea,
select {
  font: inherit;
}
</style>