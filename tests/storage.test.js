import { describe, it, expect, beforeEach } from 'vitest'
import {
  getApiKey,
  saveApiKey,
  getDiary,
  saveDiary,
  getDiaryIndex,
  clearAll,
} from '../src/utils/storage.js'

beforeEach(() => {
  localStorage.clear()
})

describe('getApiKey / saveApiKey', () => {
  it('returns null when no key saved', () => {
    expect(getApiKey()).toBeNull()
  })

  it('returns saved key', () => {
    saveApiKey('sk-test123')
    expect(getApiKey()).toBe('sk-test123')
  })
})

describe('saveDiary / getDiary', () => {
  it('returns null for unsaved date', () => {
    expect(getDiary('2026-03-27')).toBeNull()
  })

  it('saves and retrieves diary entry', () => {
    saveDiary({ date: '2026-03-27', raw: '今天很忙', formatted: '## 今日工作\n- 很忙' })
    const entry = getDiary('2026-03-27')
    expect(entry.date).toBe('2026-03-27')
    expect(entry.raw).toBe('今天很忙')
    expect(entry.formatted).toBe('## 今日工作\n- 很忙')
    expect(entry.updatedAt).toBeTypeOf('number')
  })

  it('overwrites existing entry on same date', () => {
    saveDiary({ date: '2026-03-27', raw: '第一次', formatted: 'v1' })
    const t1 = getDiary('2026-03-27').updatedAt
    saveDiary({ date: '2026-03-27', raw: '第二次', formatted: 'v2' })
    const entry = getDiary('2026-03-27')
    expect(entry.raw).toBe('第二次')
    expect(entry.formatted).toBe('v2')
    expect(entry.updatedAt).toBeGreaterThanOrEqual(t1)
  })
})

describe('getDiaryIndex', () => {
  it('returns empty array when no diaries', () => {
    expect(getDiaryIndex()).toEqual([])
  })

  it('returns dates in reverse chronological order', () => {
    saveDiary({ date: '2026-03-25', raw: 'a', formatted: 'a' })
    saveDiary({ date: '2026-03-27', raw: 'c', formatted: 'c' })
    saveDiary({ date: '2026-03-26', raw: 'b', formatted: 'b' })
    expect(getDiaryIndex()).toEqual(['2026-03-27', '2026-03-26', '2026-03-25'])
  })

  it('does not duplicate date when saving same date twice', () => {
    saveDiary({ date: '2026-03-27', raw: 'v1', formatted: 'v1' })
    saveDiary({ date: '2026-03-27', raw: 'v2', formatted: 'v2' })
    expect(getDiaryIndex()).toEqual(['2026-03-27'])
  })

  it('returns null for corrupt JSON in localStorage', () => {
    localStorage.setItem('diary_2026-03-27', 'not-json')
    expect(getDiary('2026-03-27')).toBeNull()
  })

  it('returns null api key for corrupt settings JSON', () => {
    localStorage.setItem('settings', '{broken')
    expect(getApiKey()).toBeNull()
  })
})

describe('clearAll', () => {
  it('removes all diary data', () => {
    saveApiKey('sk-test')
    saveDiary({ date: '2026-03-27', raw: 'test', formatted: 'test' })
    clearAll()
    expect(getApiKey()).toBeNull()
    expect(getDiary('2026-03-27')).toBeNull()
    expect(getDiaryIndex()).toEqual([])
  })
})
