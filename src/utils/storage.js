const SETTINGS_KEY = 'settings'
const INDEX_KEY = 'diary_index'
const DIARY_PREFIX = 'diary_'

function diaryKey(date) {
  return `${DIARY_PREFIX}${date}`
}

export function getApiKey() {
  const raw = localStorage.getItem(SETTINGS_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw).apiKey || null
  } catch {
    return null
  }
}

export function saveApiKey(key) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ apiKey: key }))
}

export function getDiary(date) {
  const raw = localStorage.getItem(diaryKey(date))
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveDiary({ date, raw, formatted, todos }) {
  const existing = getDiary(date) || {}
  const entry = {
    date,
    raw,
    formatted,
    todos: todos !== undefined ? todos : (existing.todos || []),
    updatedAt: Date.now(),
  }
  localStorage.setItem(diaryKey(date), JSON.stringify(entry))

  // 维护 diary_index：去重 + 倒序，每次都写入保证一致性
  const index = getDiaryIndex()
  const withoutDate = index.filter((d) => d !== date)
  withoutDate.unshift(date)
  withoutDate.sort((a, b) => (a > b ? -1 : 1))
  localStorage.setItem(INDEX_KEY, JSON.stringify(withoutDate))
}

export function getDiaryIndex() {
  const raw = localStorage.getItem(INDEX_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function clearAll() {
  const index = getDiaryIndex()
  index.forEach((date) => localStorage.removeItem(diaryKey(date)))
  localStorage.removeItem(INDEX_KEY)
  localStorage.removeItem(SETTINGS_KEY)
}
