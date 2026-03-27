<template>
  <div class="result">
    <textarea
      :value="localFormatted"
      class="result__textarea"
      rows="12"
      @input="handleInput"
    />
    <button class="btn btn--primary result__btn" @click="$emit('save')">
      保存
    </button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  formatted: { type: String, default: '' },
})
const emit = defineEmits(['update:formatted', 'save'])

const localFormatted = ref(props.formatted)
watch(() => props.formatted, (val) => { localFormatted.value = val })

function handleInput(e) {
  localFormatted.value = e.target.value
  emit('update:formatted', e.target.value)
}
</script>
