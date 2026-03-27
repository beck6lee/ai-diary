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

      <!-- todos section (idle only, has diary content) -->
      <div v-if="state === 'idle' && formattedContent" class="today-todos">
        <!-- header row -->
        <div class="today-todos__header">
          <span class="today-todos__title">今日待办</span>
          <button
            class="today-todos__gen-btn"
            :disabled="isGeneratingTodos"
            @click="handleGenerateTodos"
          >
            {{ isGeneratingTodos ? '生成中…' : todos.length ? '更新待办' : '+ 生成待办' }}
          </button>
        </div>

        <!-- pending todo list -->
        <ul v-if="pendingTodos.length" class="today-todos__list">
          <li
            v-for="todo in pendingTodos"
            :key="todo.id"
            class="today-todo-item"
            @click="handleToggleTodo(todo.id)"
          >
            <span class="today-todo-item__check">
              <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
            </span>
            <span class="today-todo-item__text">{{ todo.text }}</span>
          </li>
        </ul>

        <!-- done todos toggle -->
        <button
          v-if="doneTodos.length"
          class="today-todos__done-toggle"
          @click="showDoneTodos = !showDoneTodos"
        >
          {{ showDoneTodos ? '隐藏已完成' : `查看已完成（${doneTodos.length}）` }}
        </button>

        <!-- done todo list -->
        <ul v-if="showDoneTodos && doneTodos.length" class="today-todos__list">
          <li
            v-for="todo in doneTodos"
            :key="todo.id"
            class="today-todo-item today-todo-item--done"
          >
            <span class="today-todo-item__check">
              <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
            </span>
            <span class="today-todo-item__text">{{ todo.text }}</span>
            <span v-if="todo.doneAt" class="today-todo-item__time">{{ todo.doneAt }}</span>
          </li>
        </ul>
      </div>

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
import { streamDiary, extractTodosIncremental } from '../utils/deepseek.js'

// ✅ 已完成 section 标题，统一管理避免多处硬编码
const DONE_SECTION = '## ✅ 已完成'

function getToday() {
  return new Date().toLocaleDateString('sv-SE')
}

function formatHHMM(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
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

// todos
const todos = ref([])
const isGeneratingTodos = ref(false)
const showDoneTodos = ref(false)

const pendingTodos = computed(() => todos.value.filter(t => !t.done))
const doneTodos = computed(() => todos.value.filter(t => t.done))

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
    todos.value = existing.todos || []
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
  saveDiary({ date: today, raw: rawAccumulated.value, formatted: editedContent.value, todos: todos.value })
  state.value = 'idle'
  // 内容变更后静默更新 todos
  updateTodos(rawAccumulated.value)
}

// ── Todos ──────────────────────────────────────────────

async function updateTodos(rawContent, isManual = false) {
  const apiKey = getApiKey()
  if (!apiKey) {
    if (isManual) error.value = '请先在「设置」页填写 DeepSeek API Key'
    return
  }
  if (isManual) error.value = ''
  isGeneratingTodos.value = true
  try {
    const pending = todos.value.filter(t => !t.done)
    const { add, complete } = await extractTodosIncremental(rawContent, pending, apiKey)

    const timeStr = formatHHMM(new Date())

    complete.forEach(text => {
      const match = todos.value.find(t => !t.done && t.text === text)
      if (match) { match.done = true; match.doneAt = timeStr }
    })

    add.forEach(text => {
      if (!todos.value.some(t => t.text === text)) {
        todos.value.push({ id: `${Date.now()}-${Math.random()}`, text, done: false, doneAt: null })
      }
    })

    saveDiary({ date: today, raw: rawAccumulated.value, formatted: formattedContent.value, todos: todos.value })
  } catch (err) {
    if (isManual) error.value = `生成待办失败：${err.message}`
  } finally {
    isGeneratingTodos.value = false
  }
}

function handleGenerateTodos() {
  updateTodos(rawAccumulated.value, true)
}

function handleToggleTodo(id) {
  const todo = todos.value.find(t => t.id === id)
  if (!todo || todo.done) return

  const timeStr = formatHHMM(new Date())
  todo.done = true
  todo.doneAt = timeStr

  // 将完成条目插入 DONE_SECTION。
  // DONE_SECTION 由本函数负责创建并始终在文档末尾，所以直接追加到末尾即可。
  const line = `- (${timeStr}) ${todo.text}`
  const sectionIdx = formattedContent.value.lastIndexOf(DONE_SECTION)
  if (sectionIdx !== -1) {
    // section 已存在：找到 section 后的下一个 ## 标题，在其之前插入；否则追加到末尾
    const afterSection = formattedContent.value.slice(sectionIdx + DONE_SECTION.length)
    const nextHeading = afterSection.match(/\n##\s/)
    if (nextHeading) {
      const insertAt = sectionIdx + DONE_SECTION.length + nextHeading.index
      formattedContent.value =
        formattedContent.value.slice(0, insertAt).trimEnd() + `\n${line}` +
        formattedContent.value.slice(insertAt)
    } else {
      formattedContent.value = formattedContent.value.trimEnd() + `\n${line}`
    }
  } else {
    formattedContent.value = formattedContent.value.trimEnd() + `\n\n${DONE_SECTION}\n${line}`
  }

  saveDiary({ date: today, raw: rawAccumulated.value, formatted: formattedContent.value, todos: todos.value })
}

// ── Streaming ──────────────────────────────────────────

async function runStream(rawToSend, prevRaw, existingDiary = null, prevInput = '') {
  const apiKey = getApiKey()
  if (!apiKey) {
    error.value = '请先在「设置」页填写 DeepSeek API Key'
    rawAccumulated.value = prevRaw
    newInput.value = prevInput
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
      saveDiary({ date: today, raw: rawAccumulated.value, formatted: formattedContent.value, todos: todos.value })
      cardDimmed.value = false
      state.value = 'idle'
    },
    onError(err) {
      error.value = `整理失败：${err.message}。请检查 API Key 或网络连接。`
      rawAccumulated.value = prevRaw
      newInput.value = prevInput  // 恢复用户输入，避免内容丢失
      formattedContent.value = getDiary(today)?.formatted || ''
      cardDimmed.value = false
      state.value = 'idle'
    },
  }, existingDiary)
}

async function handleFormat() {
  if (state.value !== 'idle') return  // 防重入

  const inputText = newInput.value.trim()
  const timeTag = `【${formatHHMM(new Date())}】`

  const prevRaw = rawAccumulated.value
  const newRawEntry = timeTag + inputText
  const separator = prevRaw ? '\n\n---\n\n' : ''
  rawAccumulated.value = prevRaw + separator + newRawEntry
  newInput.value = ''

  await runStream(newRawEntry, prevRaw, formattedContent.value || null, inputText)
  // 整理完成后用全量 raw 增量更新 todos（让 AI 有完整上下文判断完成情况）
  await updateTodos(rawAccumulated.value)
}

async function handleReformat() {
  await runStream(rawAccumulated.value, rawAccumulated.value)
}
</script>
