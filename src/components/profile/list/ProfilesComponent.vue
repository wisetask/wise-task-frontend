<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" sm="9">
        <profiles-table-component/>
      </v-col>
      <v-col cols="12" sm="3">
        <profile-filter-component/>
      </v-col>
    </v-row>
  </v-container>
  
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import ProfileFilterComponent from "@/components/profile/list/ProfileFilterComponent.vue";

export default defineComponent({
  components: {ProfileFilterComponent},
  setup() {
      
  },
})
</script>
