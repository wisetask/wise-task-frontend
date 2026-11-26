<script setup lang="ts">
import { useId } from "vue";
import { GraphCanvas } from "@/widgets/graph-editor";
import type { TaskView } from "../lib/taskView";

defineProps<{
  view: TaskView;
  hints: string[];
}>();

const graphTitleId = useId();
const checksTitleId = useId();
</script>

<template>
  <aside class="task-condition">
    <span v-if="view.category !== ''" class="task-condition__muted">{{ view.category }}</span>
    <h1 class="task-condition__name">{{ view.name }}</h1>
    <span v-if="view.author !== ''" class="task-condition__muted">Автор: {{ view.author }}</span>
    <p class="task-condition__description">{{ view.description }}</p>
    <ul v-if="hints.length > 0" class="task-condition__hints">
      <li v-for="hint in hints" :key="hint">{{ hint }}</li>
    </ul>
    <section
      v-if="view.graph !== null"
      class="task-condition__section"
      :aria-labelledby="graphTitleId"
    >
      <h2 :id="graphTitleId" class="task-condition__title">Граф задачи</h2>
      <p v-if="view.skippedEdges > 0" class="task-condition__muted">
        Часть рёбер не показана: редактор пока не умеет кратные рёбра.
      </p>
      <div class="task-condition__canvas">
        <GraphCanvas :graph="view.graph" readonly />
      </div>
    </section>
    <section
      v-if="view.checks.length > 0"
      class="task-condition__section"
      :aria-labelledby="checksTitleId"
    >
      <h2 :id="checksTitleId" class="task-condition__title">Что проверяется</h2>
      <ol class="task-condition__checks">
        <li v-for="item in view.checks" :key="item.pluginId + item.text">{{ item.text }}</li>
      </ol>
    </section>
  </aside>
</template>

<style scoped>
.task-condition {
  flex: none;
  width: 380px;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
}

.task-condition__muted {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.task-condition__name {
  margin: 0;
  font-size: var(--font-size-xl);
}

.task-condition__description {
  margin: 0;
  line-height: 1.55;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.task-condition__hints {
  margin: 0;
  padding: var(--space-2) var(--space-3) var(--space-2) var(--space-5);
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.task-condition__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.task-condition__title {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: 600;
}

.task-condition__canvas {
  height: 260px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.task-condition__checks {
  margin: 0;
  padding-left: var(--space-5);
  font-size: var(--font-size-md);
}
</style>
