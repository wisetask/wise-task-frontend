<template>
  <div>
    <plugin-input-component></plugin-input-component>
    <v-row>
      <v-col cols="9">
        <plugin-table-component></plugin-table-component>
      </v-col>
      <v-col cols="3">
        <plugin-filter-component></plugin-filter-component>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
})
</script>
