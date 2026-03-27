<template>
  <div class="view today-view">
    <div class="today-header">
      <h1 class="view__title">{{ todayLabel }}</h1>
      <button v-if="state === 'saved'" class="btn btn--secondary today-redo" @click="handleRedo">
        重新整理
      </button>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="today-error">{{ error }}</div>

    <!-- 已保存：展示结果 -->
    <div v-if="state === 'saved'" class="result-display">
      <pre class="result-display__content">{{ saved.formatted }}</pre>
    </div>

    <!-- 输入/整理中 -->
    <DiaryEditor
      v-if="state === 'editing' || state === 'formatting'"
      v-model:content="rawContent"
      :loading="state === 'formatting'"
      @format="handleFormat"
    />

    <!-- 整理完成，等待保存 -->
    <DiaryResult
      v-if="state === 'formatted'"
      v-model:formatted="formattedContent"
      @save="handleSave"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DiaryEditor from '../components/DiaryEditor.vue'
import DiaryResult from '../components/DiaryResult.vue'
import { getDiary, saveDiary, getApiKey } from '../utils/storage.js'
import { streamDiary } from '../utils/deepseek.js'

// 今天日期，格式 YYYY-MM-DD
function getToday() {
  return new Date().toLocaleDateString('sv-SE') // sv-SE locale 输出 YYYY-MM-DD
}

const today = getToday()
const todayLabel = computed(() => {
  // 直接拆字符串避免 new Date("YYYY-MM-DD") 的 UTC 时区 off-by-one 问题
  const [, m, d] = today.split('-')
  return `${Number(m)}月${Number(d)}日`
})

// 状态：'editing' | 'formatting' | 'formatted' | 'saved'
const state = ref('editing')
const rawContent = ref('')
const formattedContent = ref('')
const saved = ref(null)
const error = ref('')

onMounted(() => {
  const existing = getDiary(today)
  if (existing) {
    saved.value = existing
    state.value = 'saved'
  }
})

function handleRedo() {
  rawContent.value = saved.value?.raw || ''
  formattedContent.value = ''
  error.value = ''
  state.value = 'editing'
}

async function handleFormat() {
  const apiKey = getApiKey()
  if (!apiKey) {
    error.value = '请先在「设置」页填写 DeepSeek API Key'
    return
  }

  error.value = ''
  formattedContent.value = ''
  state.value = 'formatting'

  await streamDiary(rawContent.value, apiKey, {
    onChunk(text) {
      formattedContent.value += text
    },
    onDone() {
      state.value = 'formatted'
    },
    onError(err) {
      error.value = `整理失败：${err.message}。请检查 API Key 或网络连接。`
      formattedContent.value = ''
      state.value = 'editing'
    },
  })
}

function handleSave() {
  saveDiary({ date: today, raw: rawContent.value, formatted: formattedContent.value })
  saved.value = getDiary(today)
  state.value = 'saved'
}
</script>
