<template>
    <v-container fluid>
        <v-row>
            <v-col cols="12" sm="9">
                <v-card>
                    <TaskTableComponent />
                </v-card>
            </v-col>
            <v-col cols="12" sm="3">
                <task-filter-component />
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import TaskFilterComponent from "@/components/task/TaskFilterComponent.vue";

export default {
    components: { TaskFilterComponent },
};
</script>
