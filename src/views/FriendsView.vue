<template>
  <section class="page-surface">
    <div class="friends-grid">
      <FriendCard
        v-for="friend in visibleFriends"
        :key="friend.id"
        :friend="friend"
        :overflow-count="friendOverflowCount(friend)"
      />
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import FriendCard from '../components/content/FriendCard.vue'
import { friends } from '../data'
import { hiddenCardCount, limitCardGroup, overflowCountForItem } from '../utils/cardGroups'

const visibleFriends = computed(() => limitCardGroup(friends))
const friendsHiddenCount = computed(() => hiddenCardCount(friends))

function friendOverflowCount(friend) {
  return overflowCountForItem(friend, visibleFriends.value, friendsHiddenCount.value)
}
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
