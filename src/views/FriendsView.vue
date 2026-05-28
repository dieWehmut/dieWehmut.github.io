<template>
  <section class="page-surface">
    <PageHeading title="Friends" description="Those written into this small corner of the web." :icon="Connection" />

    <div class="friends-grid">
      <FriendCard v-for="friend in friends" :key="friend.id" :friend="friend" />
    </div>
  </section>
</template>

<script setup>
import { Connection } from '@element-plus/icons-vue'
import PageHeading from '../components/content/PageHeading.vue'
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
