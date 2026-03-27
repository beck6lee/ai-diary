<template>
  <div class="today-view">
    <!-- header -->
    <div class="today-view__header">
      <span class="today-view__date">{{ todayLabel }}</span>
      <button v-if="state === 'saved'" class="today-view__redo" @click="handleRedo">
        重新整理
      </button>
    </div>

    <!-- scrollable content area -->
    <div class="today-view__content">
      <!-- error -->
      <div v-if="error" class="today-error">{{ error }}</div>

      <!-- empty hint (editing, no text yet) -->
      <div v-if="state === 'editing' && !rawContent" class="today-empty">
        <div class="today-empty__icon">📖</div>
        <p class="today-empty__title">今天发生了什么？</p>
        <p class="today-empty__sub">随便写，口语化就行</p>
      </div>

      <!-- streaming result -->
      <div v-if="state === 'formatting'" class="today-card">
        <pre class="today-card__text">{{ formattedContent }}<span class="today-card__cursor"></span></pre>
      </div>

      <!-- formatted result: editable -->
      <textarea
        v-if="state === 'formatted'"
        :value="formattedContent"
        class="today-result-textarea"
        @input="e => (formattedContent = e.target.value)"
      />

      <!-- saved content -->
      <div v-if="state === 'saved'" class="today-card">
        <pre class="today-card__text">{{ saved?.formatted }}</pre>
      </div>
    </div>

    <!-- bottom action bar -->
    <div class="today-view__bottom">
      <!-- editing: input + send -->
      <div v-if="state === 'editing'" class="today-input-bar">
        <textarea
          :value="rawContent"
          class="today-input-bar__textarea"
          placeholder="随便写，口语化就行…"
          rows="2"
          @input="handleRawInput"
        />
        <button
          class="today-input-bar__send"
          :disabled="!rawContent.trim()"
          @click="handleFormat"
        >
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4l8 8H14v8h-4v-8H4z"/>
          </svg>
        </button>
      </div>

      <!-- formatting: loading hint -->
      <p v-if="state === 'formatting'" class="today-loading-hint">
        AI 整理中，请稍候…
      </p>

      <!-- formatted: save bar -->
      <div v-if="state === 'formatted'" class="today-save-bar">
        <button class="btn btn--secondary" @click="handleReformat">重新输入</button>
        <button
          class="btn btn--primary"
          :disabled="!formattedContent.trim()"
          @click="handleSave"
        >保存日记</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getDiary, saveDiary, getApiKey } from '../utils/storage.js'
import { streamDiary } from '../utils/deepseek.js'

function getToday() {
  return new Date().toLocaleDateString('sv-SE')
}

const today = getToday()
const todayLabel = computed(() => {
  const [, m, d] = today.split('-')
  return `${Number(m)}月${Number(d)}日`
})

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

function handleRawInput(e) {
  rawContent.value = e.target.value
}

function handleRedo() {
  rawContent.value = saved.value?.raw || ''
  formattedContent.value = ''
  error.value = ''
  state.value = 'editing'
}

function handleReformat() {
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
    onChunk(text) { formattedContent.value += text },
    onDone() { state.value = 'formatted' },
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
