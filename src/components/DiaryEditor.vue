<template>
  <div class="editor">
    <textarea
      :value="localContent"
      class="editor__textarea"
      placeholder="今天发生了什么？随便写，口语化就行…"
      rows="8"
      @input="handleInput"
    />
    <button
      class="btn btn--primary editor__btn"
      :disabled="!localContent.trim() || loading"
      @click="$emit('format')"
    >
      {{ loading ? 'AI 整理中…' : 'AI 整理' }}
    </button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  content: { type: String, default: '' },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['update:content', 'format'])

const localContent = ref(props.content)
watch(() => props.content, (val) => { localContent.value = val })

function handleInput(e) {
  localContent.value = e.target.value
  emit('update:content', e.target.value)
}
</script>
