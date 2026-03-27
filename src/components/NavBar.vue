<template>
  <nav class="navbar">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="navbar__item"
      :class="{ 'navbar__item--active': activeTab === tab.key }"
      @click="$emit('change', tab.key)"
    >
      <span class="navbar__icon">{{ tab.icon }}</span>
      <span class="navbar__label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<script setup>
defineProps({
  activeTab: { type: String, required: true },
})
defineEmits(['change'])

const tabs = [
  { key: 'today', icon: '📝', label: '今日' },
  { key: 'history', icon: '📅', label: '历史' },
  { key: 'settings', icon: '⚙️', label: '设置' },
]
</script>
