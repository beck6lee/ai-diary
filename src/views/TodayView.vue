<template>
  <div class="today-view">
    <!-- header -->
    <div class="today-view__header">
      <span class="today-view__date">{{ todayLabel }}</span>
    </div>

    <!-- scrollable content area -->
    <div class="today-view__content" ref="contentEl">
      <!-- error -->
      <div v-if="error" class="today-error">{{ error }}</div>

      <!-- empty hint -->
      <div v-if="!formattedContent" class="today-empty">
        <div class="today-empty__icon">📖</div>
        <p class="today-empty__title">今天发生了什么？</p>
        <p class="today-empty__sub">随便写，口语化就行</p>
      </div>

      <!-- today's diary (streaming or saved) -->
      <div v-if="formattedContent" class="today-card" :class="{ 'today-card--dimmed': cardDimmed }">
        <pre class="today-card__text">{{ formattedContent }}<span v-if="state === 'formatting'" class="today-card__cursor"></span></pre>
      </div>
    </div>

    <!-- bottom input bar -->
    <div class="today-view__bottom">
      <div v-if="state === 'idle'" class="today-input-bar">
        <textarea
          :value="newInput"
          class="today-input-bar__textarea"
          :placeholder="formattedContent ? '再记一条…' : '随便写，口语化就行…'"
          rows="2"
          @input="handleInputChange"
        />
        <button
          class="today-input-bar__send"
          :disabled="!newInput.trim()"
          @click="handleFormat"
        >
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4l8 8H14v8h-4v-8H4z"/>
          </svg>
        </button>
      </div>
      <p v-if="state === 'formatting'" class="today-loading-hint">AI 整理中，请稍候…</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
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

// state: 'idle' | 'formatting'
const state = ref('idle')
const rawAccumulated = ref('')   // all raw text for today (appended each time)
const formattedContent = ref('') // current formatted diary
const newInput = ref('')          // what the user is typing now
const error = ref('')
const contentEl = ref(null)
const cardDimmed = ref(false)    // dims card while waiting for first chunk

onMounted(() => {
  const existing = getDiary(today)
  if (existing) {
    rawAccumulated.value = existing.raw || ''
    formattedContent.value = existing.formatted || ''
  }
})

function handleInputChange(e) {
  newInput.value = e.target.value
}

async function handleFormat() {
  const apiKey = getApiKey()
  if (!apiKey) {
    error.value = '请先在「设置」页填写 DeepSeek API Key'
    return
  }

  // append new input to accumulated raw (separated by --- on new lines)
  const prevRaw = rawAccumulated.value
  const separator = prevRaw ? '\n\n---\n\n' : ''
  rawAccumulated.value = prevRaw + separator + newInput.value.trim()
  newInput.value = ''
  error.value = ''
  // keep existing content visible, just dim it while waiting
  cardDimmed.value = true
  state.value = 'formatting'
  let firstChunk = true

  await streamDiary(rawAccumulated.value, apiKey, {
    onChunk(text) {
      if (firstChunk) {
        firstChunk = false
        formattedContent.value = ''  // swap out old content on first character
        cardDimmed.value = false
      }
      formattedContent.value += text
      // auto-scroll to bottom while streaming
      nextTick(() => {
        if (contentEl.value) contentEl.value.scrollTop = contentEl.value.scrollHeight
      })
    },
    onDone() {
      saveDiary({ date: today, raw: rawAccumulated.value, formatted: formattedContent.value })
      cardDimmed.value = false
      state.value = 'idle'
    },
    onError(err) {
      error.value = `整理失败：${err.message}。请检查 API Key 或网络连接。`
      rawAccumulated.value = prevRaw                          // rollback
      formattedContent.value = getDiary(today)?.formatted || ''
      cardDimmed.value = false
      state.value = 'idle'
    },
  })
}
</script>
