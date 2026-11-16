<script setup lang="ts">
import { ARROW_NAMES, arrowMarkerId } from "../lib/colors";
</script>

<template>
  <defs>
    <marker
      v-for="name in ARROW_NAMES"
      :id="arrowMarkerId(name)"
      :key="name"
      viewBox="0 0 10 10"
      refX="10"
      refY="5"
      markerWidth="11"
      markerHeight="11"
      markerUnits="userSpaceOnUse"
      orient="auto"
    >
      <path d="M 0 0 L 10 5 L 0 10 z" class="graph-arrow" :class="'graph-arrow--' + name" />
    </marker>
  </defs>
</template>

<style scoped>
.graph-arrow--gray {
  fill: var(--graph-edge);
}

.graph-arrow--red {
  fill: var(--graph-red-stroke);
}

.graph-arrow--green {
  fill: var(--graph-green-stroke);
}

.graph-arrow--blue {
  fill: var(--graph-blue-stroke);
}

.graph-arrow--selected {
  fill: var(--color-accent);
}
</style>
