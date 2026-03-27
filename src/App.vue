<template>
  <div class="app">
    <KeepAlive>
      <component :is="currentView" />
    </KeepAlive>
    <NavBar :activeTab="currentTab" @change="currentTab = $event" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import NavBar from './components/NavBar.vue'
import TodayView from './views/TodayView.vue'
import HistoryView from './views/HistoryView.vue'
import SettingsView from './views/SettingsView.vue'

const currentTab = ref('today')

const currentView = computed(() => {
  return { today: TodayView, history: HistoryView, settings: SettingsView }[currentTab.value]
})
</script>
