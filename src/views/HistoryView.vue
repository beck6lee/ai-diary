<template>
  <div class="view history-view">
    <h1 class="view__title">历史</h1>

    <div v-if="index.length === 0" class="history-empty">
      还没有日记，去今日页记录第一篇吧。
    </div>

    <div v-for="date in index" :key="date" class="history-item">
      <button class="history-item__header" @click="toggle(date)">
        <span class="history-item__date">{{ formatDate(date) }}</span>
        <span class="history-item__arrow">{{ expanded[date] ? '▲' : '▼' }}</span>
      </button>
      <div v-if="expanded[date]" class="history-item__body">
        <pre class="history-item__content">{{ getDiary(date)?.formatted || '内容加载失败' }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onActivated } from 'vue'
import { getDiaryIndex, getDiary } from '../utils/storage.js'

const index = ref(getDiaryIndex())
const expanded = ref({})

onActivated(() => { index.value = getDiaryIndex() })

function toggle(date) {
  expanded.value[date] = !expanded.value[date]
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-')
  return `${year}年${parseInt(month)}月${parseInt(day)}日`
}
</script>
