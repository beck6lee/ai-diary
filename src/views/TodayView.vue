<template>
  <div class="today-view">
    <!-- header -->
    <div class="today-view__header">
      <span class="today-view__date">{{ todayLabel }}</span>
      <button
        v-if="state === 'editing-result'"
        class="today-view__header-btn"
        @click="handleCancelEdit"
      >取消</button>
      <button
        v-else-if="state === 'idle' && formattedContent"
        class="today-view__header-btn"
        @click="handleStartEdit"
      >编辑</button>
    </div>

    <!-- scrollable content area -->
    <div class="today-view__content" ref="contentEl">
      <!-- error -->
      <div v-if="error" class="today-error">{{ error }}</div>

      <!-- empty hint -->
      <div v-if="!formattedContent && state !== 'editing-result'" class="today-empty">
        <div class="today-empty__icon">📖</div>
        <p class="today-empty__title">今天发生了什么？</p>
        <p class="today-empty__sub">随便写，口语化就行</p>
      </div>

      <!-- formatted diary (read-only, idle/formatting) -->
      <div
        v-if="formattedContent && state !== 'editing-result'"
        class="today-card"
        :class="{ 'today-card--dimmed': cardDimmed }"
      >
        <div class="today-card__text markdown-body" v-html="renderedContent"></div>
      </div>

      <!-- editable textarea (editing-result state) -->
      <textarea
        v-if="state === 'editing-result'"
        :value="editedContent"
        class="today-result-textarea"
        @input="e => (editedContent = e.target.value)"
      />

      <!-- raw records (collapsible, idle only) -->
      <div v-if="state === 'idle' && rawEntries.length" class="today-raw-section">
        <button class="today-raw-toggle" @click="showRaw = !showRaw">
          <span>原始记录（{{ rawEntries.length }} 条）</span>
          <span class="today-raw-toggle__arrow" :class="{ 'today-raw-toggle__arrow--open': showRaw }">▼</span>
        </button>
        <div v-if="showRaw" class="today-raw-list">
          <div v-for="(entry, i) in rawEntries" :key="i" class="today-raw-entry">
            <pre class="today-raw-entry__text">{{ entry }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- bottom action bar -->
    <div class="today-view__bottom">
      <!-- idle: input bar -->
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

      <!-- formatting: loading hint -->
      <p v-if="state === 'formatting'" class="today-loading-hint">AI 整理中，请稍候…</p>

      <!-- editing-result: reformat + save -->
      <div v-if="state === 'editing-result'" class="today-save-bar">
        <button class="btn btn--secondary" :disabled="!rawAccumulated" @click="handleReformat">
          重新整理
        </button>
        <button class="btn btn--primary" :disabled="!editedContent.trim()" @click="handleSaveEdit">
          保存修改
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { marked } from 'marked'
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

// state: 'idle' | 'formatting' | 'editing-result'
const state = ref('idle')
const rawAccumulated = ref('')
const formattedContent = ref('')
const editedContent = ref('')
const newInput = ref('')
const error = ref('')
const contentEl = ref(null)
const cardDimmed = ref(false)
const showRaw = ref(false)

const rawEntries = computed(() =>
  rawAccumulated.value
    ? rawAccumulated.value.split('\n\n---\n\n').filter(s => s.trim())
    : []
)

const renderedContent = computed(() => {
  const text = state.value === 'formatting'
    ? formattedContent.value + '▌'
    : formattedContent.value
  return marked.parse(text)
})

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

function handleStartEdit() {
  editedContent.value = formattedContent.value
  state.value = 'editing-result'
}

function handleCancelEdit() {
  state.value = 'idle'
}

function handleSaveEdit() {
  formattedContent.value = editedContent.value
  saveDiary({ date: today, raw: rawAccumulated.value, formatted: editedContent.value })
  state.value = 'idle'
}

// shared stream runner used by both handleFormat and handleReformat
async function runStream(rawToSend, prevRaw) {
  const apiKey = getApiKey()
  if (!apiKey) {
    error.value = '请先在「设置」页填写 DeepSeek API Key'
    rawAccumulated.value = prevRaw
    state.value = 'idle'
    return
  }

  error.value = ''
  cardDimmed.value = true
  state.value = 'formatting'
  let firstChunk = true

  await streamDiary(rawToSend, apiKey, {
    onChunk(text) {
      if (firstChunk) {
        firstChunk = false
        formattedContent.value = ''
        cardDimmed.value = false
      }
      formattedContent.value += text
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
      rawAccumulated.value = prevRaw
      formattedContent.value = getDiary(today)?.formatted || ''
      cardDimmed.value = false
      state.value = 'idle'
    },
  })
}

async function handleFormat() {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const timeTag = `【${hh}:${mm}】`

  const prevRaw = rawAccumulated.value
  const separator = prevRaw ? '\n\n---\n\n' : ''
  rawAccumulated.value = prevRaw + separator + timeTag + newInput.value.trim()
  newInput.value = ''

  await runStream(rawAccumulated.value, prevRaw)
}

async function handleReformat() {
  await runStream(rawAccumulated.value, rawAccumulated.value)
}
</script>
