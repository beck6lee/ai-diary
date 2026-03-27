<template>
  <div class="view settings-view">
    <h1 class="view__title">设置</h1>

    <section class="settings-section">
      <label class="settings-label">DeepSeek API Key</label>
      <input
        v-model="apiKey"
        type="password"
        class="settings-input"
        placeholder="sk-xxxxxxxxxxxxxxxx"
        @blur="handleSave"
      />
      <p class="settings-hint">Key 保存在本地，不会上传到任何服务器。</p>
    </section>

    <section class="settings-section">
      <button class="btn btn--danger" @click="handleClear">清除所有数据</button>
      <p class="settings-hint">将删除所有日记和设置，不可恢复。</p>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getApiKey, saveApiKey, clearAll } from '../utils/storage.js'

const apiKey = ref(getApiKey() || '')

function handleSave() {
  saveApiKey(apiKey.value.trim())
}

function handleClear() {
  if (confirm('确定要清除所有数据吗？此操作不可恢复。')) {
    clearAll()
    apiKey.value = ''
  }
}
</script>
