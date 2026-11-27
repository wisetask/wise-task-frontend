<script setup lang="ts">
import type { PluginType } from "../model/plugin";

defineProps<{ type: PluginType }>();
</script>

<template>
  <svg class="plugin-type-icon" viewBox="0 0 24 24" aria-hidden="true">
    <template v-if="type === 'GRAPH_CHARACTERISTIC'">
      <circle cx="6" cy="17" r="2.5" />
      <circle cx="18" cy="17" r="2.5" />
      <circle cx="12" cy="6" r="2.5" />
      <path d="M8 15.5 L10.6 8.2 M16 15.5 L13.4 8.2" />
      <path class="plugin-type-icon__accent" d="M9 21 H15" />
    </template>
    <template v-else-if="type === 'GRAPH_NEW_GRAPH'">
      <circle cx="5" cy="8" r="2" />
      <circle cx="5" cy="16" r="2" />
      <path d="M5 10 V14" />
      <path class="plugin-type-icon__accent" d="M9 12 H14 M12 9.5 L14.5 12 L12 14.5" />
      <circle cx="19" cy="7" r="2" />
      <circle cx="19" cy="17" r="2" />
      <path d="M19 9 V15" />
    </template>
    <template v-else-if="type === 'GRAPH_STRING'">
      <path d="M4 18 L8 6 L12 18 M5.5 14 H10.5" />
      <path class="plugin-type-icon__accent" d="M15 10 H20 M15 14 H20 M15 18 H18" />
    </template>
    <template v-else>
      <circle cx="12" cy="12" r="8" />
      <path class="plugin-type-icon__accent" d="M8 12.5 L11 15.5 L16.5 9" />
    </template>
  </svg>
</template>

<style scoped>
.plugin-type-icon {
  flex: none;
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.plugin-type-icon__accent {
  stroke-width: 2.2;
}
</style>
