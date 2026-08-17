<template>
  <section class="page-surface">
    <section v-if="isConsole" class="console-friends" aria-label="Friend links">
      <header class="console-friends__summary">
        <strong>{{ friends.length }} links</strong>
      </header>
      <div class="console-friends__rows">
        <a
          v-for="friend in friends"
          :key="friend.id"
          class="console-friends__row"
          :href="friend.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          <code>{{ friend.id }}</code>
          <strong>{{ friend.name }}</strong>
          <span>{{ friend.description }}</span>
          <span>{{ friend.url }}</span>
        </a>
      </div>
    </section>

    <div v-else class="friends-grid">
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
import { useDisplayModePreference } from '../composables/useDisplayModePreference'

const { isConsole } = useDisplayModePreference()
const visibleFriends = computed(() => limitCardGroup(friends))
const friendsHiddenCount = computed(() => hiddenCardCount(friends))

function friendOverflowCount(friend) {
  return overflowCountForItem(friend, visibleFriends.value, friendsHiddenCount.value)
}
</script>

<style scoped>
.console-friends {
  display: grid;
  gap: 10px;
  color: var(--console-text, var(--site-text));
  font-family: var(--console-font, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
}

.console-friends__summary {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  min-height: 38px;
  padding: 7px 0;
  border-bottom: 1px solid var(--console-border, var(--site-border));
}

.console-friends__summary strong {
  color: var(--console-muted, var(--site-muted));
  font-size: 0.78rem;
  font-weight: 500;
}

.console-friends__rows {
  display: grid;
  gap: 2px;
}

.console-friends__row {
  display: grid;
  grid-template-columns: 130px minmax(130px, 0.7fr) minmax(160px, 1fr) minmax(220px, 1.2fr);
  align-items: baseline;
  gap: 14px;
  min-height: 36px;
  padding: 6px 8px;
  border: 1px solid transparent;
  color: var(--console-muted, var(--site-muted));
  text-decoration: none;
}

.console-friends__row:hover,
.console-friends__row:focus-visible {
  border-color: var(--console-border-strong, var(--site-accent));
  color: var(--console-text, var(--site-text));
  background: var(--console-selection, transparent);
  outline: none;
}

.console-friends__row code {
  overflow: hidden;
  color: var(--console-accent, var(--site-accent));
  font: inherit;
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.console-friends__row strong,
.console-friends__row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.console-friends__row strong {
  color: var(--console-text, var(--site-text));
  font-weight: 600;
}

.console-friends__row span {
  font-size: 0.78rem;
}

@media (max-width: 1100px) {
  .console-friends__row {
    grid-template-columns: 100px minmax(110px, 0.7fr) minmax(130px, 1fr) minmax(150px, 1fr);
    gap: 9px;
  }
}

@media (max-width: 900px) {
  .console-friends {
    display: none;
  }
}

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
