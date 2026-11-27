<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import type { Graph } from "@/entities/graph";
import { loadThumbGraph } from "../lib/thumbGraph";
import GraphMiniature from "./GraphMiniature.vue";

const props = defineProps<{
  taskId: string;
}>();

const root = ref<HTMLElement | null>(null);
const shown = shallowRef<Graph | null>(null);
const loading = ref(false);
const started = ref(false);
let observer: IntersectionObserver | null = null;

async function load() {
  if (started.value) {
    return;
  }
  started.value = true;
  loading.value = true;
  shown.value = await loadThumbGraph(props.taskId);
  loading.value = false;
}

function stopWatching() {
  if (observer !== null) {
    observer.disconnect();
    observer = null;
  }
}

onMounted(() => {
  if (typeof IntersectionObserver !== "function" || root.value === null) {
    load();
    return;
  }
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        stopWatching();
        load();
      }
    },
    { rootMargin: "200px" },
  );
  observer.observe(root.value);
});

onBeforeUnmount(stopWatching);
</script>

<template>
  <span ref="root" class="task-thumb" :class="{ 'task-thumb--waiting': !started }">
    <GraphMiniature :graph="shown" :loading="loading" />
  </span>
</template>

<style scoped>
.task-thumb {
  display: block;
}

.task-thumb--waiting {
  width: 96px;
  height: 64px;
}
</style>
