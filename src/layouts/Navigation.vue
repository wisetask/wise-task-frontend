<template>
  <v-navigation-drawer
      image="https://cdn.vuetifyjs.com/images/backgrounds/bg-2.jpg"
      permanent
      v-model="drawer"
      theme="dark"
  >
    <v-list nav>
      <v-list-item v-if="isUserAdminOrAuthor"
          prepend-icon="mdi-graph"
          title="Конструктор задач"
          value="inbox"
          @click="showTaskConstructor"
      ></v-list-item>
      <v-list-item
          prepend-icon="mdi-pen"
          title="Задачи"
          value="supervisors"
          @click="showTaskList"
      ></v-list-item>
      <v-list-item v-if="isUserAdminOrAuthor"
          prepend-icon="mdi-toy-brick-plus"
          title="Плагины"
          value="plugin"
          @click="showPluginPage"
      ></v-list-item>
      <v-list-item
          prepend-icon="mdi-library"
          title="Библиотека графов"
          value="graphLibrary"
          @click="showGraphLibrary"
      ></v-list-item>
      <v-list-item
          v-if="isUserAdminOrAuthor"
          prepend-icon="mdi-account-group"
          title="Пользователи"
          value="profiles"
          @click="showProfileList"
      ></v-list-item>
<!--      <v-list-item-->
<!--          prepend-icon="mdi-school"-->
<!--          title="Экзамен"-->
<!--          value="exam"-->
<!--          @click="showExamPage"-->
<!--      ></v-list-item>-->
      <v-list-item
          v-if="profileStore.activeUser",
          prepend-icon="mdi-relation-one-to-one"
          title="Бинарные отношения"
          value="binaryRelationships"
          @click="showBinaryRelationshipsPage"
      ></v-list-item>
      <v-list-item
          prepend-icon="mdi-file-document-outline"
          title="Материалы"
          value="materials"
          @click="showMaterialPage"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue"
import { useRouter } from "vue-router"
import { useProfileStore } from "@/store/profile"
import { ensureActiveUser } from "@/entities/user/lib/ensureActiveUser"

export default defineComponent({
  props: {
    drawer: {
      type: Boolean,
      default: true
    }
  },
  emits: ["hideMenu"],
  setup(props, { emit }) {
    const router = useRouter()
    const profileStore = useProfileStore()

    ensureActiveUser()

    const isUserAdminOrAuthor = computed(() => {
      return profileStore.activeUser?.role === "ADMIN" || profileStore.activeUser?.role === "AUTHOR"
    })


    const showTaskConstructor = () => {
      router.push("/taskconstructor")
      emit("hideMenu")
    }

    const showTaskList = () => {
      router.push("/tasks")
      emit("hideMenu")
    }

    const showPluginPage = () => {
      router.push("/plugins")
      emit("hideMenu")
    }

    const showProfileList = () => {
      router.push("/profiles")
      emit("hideMenu")
    }

    const showGraphLibrary = () => {
      router.push("/graph/library")
      emit("hideMenu")
    }

    const showMaterialPage = () => {
      router.push("/")
      emit("hideMenu")
    }

    const showExamPage = () => {
      router.push("/exam")
      emit("hideMenu")
    }

    const showBinaryRelationshipsPage = () => {

      router.push("/relations/demonstration")
      emit("hideMenu")
    }

    return {
      isUserAdminOrAuthor,
      showTaskConstructor,
      showTaskList,
      showPluginPage,
      showProfileList,
      showGraphLibrary,
      showMaterialPage,
      showExamPage,
      showBinaryRelationshipsPage,
      profileStore
    }
  },
})
</script>

