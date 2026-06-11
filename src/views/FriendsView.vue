<template>
  <section class="page-surface">
    <div class="friends-grid">
      <FriendCard v-for="friend in friends" :key="friend.id" :friend="friend" />
    </div>
  </section>
</template>

<script setup>
import FriendCard from '../components/content/FriendCard.vue'
import { friends } from '../data'
</script>

<style scoped>
.friends-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 760px) {
  .friends-grid {
    grid-template-columns: 1fr;
  }
}
</style>
