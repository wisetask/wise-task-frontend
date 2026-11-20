<script setup lang="ts">
import { onMounted, ref } from "vue";

const props = defineProps<{
  left: number;
  top: number;
  value: string;
}>();

const emit = defineEmits<{
  commit: [text: string];
  cancel: [];
}>();

const text = ref(props.value);
const input = ref<HTMLInputElement | null>(null);
let isDone = false;

onMounted(() => {
  if (input.value !== null) {
    input.value.focus();
    input.value.select();
  }
});

function commit() {
  if (isDone) {
    return;
  }
  isDone = true;
  emit("commit", text.value);
}

function cancel() {
  if (isDone) {
    return;
  }
  isDone = true;
  emit("cancel");
}
</script>

<template>
  <input
    ref="input"
    v-model="text"
    class="graph-rename"
    type="text"
    aria-label="Новая подпись"
    :style="{ left: left + 'px', top: top + 'px' }"
    @keydown.enter.prevent="commit"
    @keydown.esc.prevent="cancel"
    @blur="commit"
    @pointerdown.stop
    @dblclick.stop
  />
</template>

<style scoped>
.graph-rename {
  position: absolute;
  z-index: 5;
  width: 96px;
  height: var(--control-height-sm);
  padding: 0 var(--space-2);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: var(--font-size-md);
  text-align: center;
  transform: translate(-50%, -50%);
  box-shadow: var(--shadow-popover);
}

.graph-rename:focus {
  outline: 2px solid var(--color-focus);
  outline-offset: 1px;
}
</style>
