<template>
  <v-navigation-drawer
      permanent
      v-model="drawer"
      class="app-nav"
  >
    <div class="app-nav__hero">
      <span class="app-nav__hero-icon">
        <v-icon size="22" icon="mdi-compass-outline" />
      </span>
      <div class="app-nav__hero-text">
        <div class="app-nav__hero-title">Wise Task</div>
        <div class="app-nav__hero-caption">Навигация</div>
      </div>
    </div>

    <v-list nav class="app-nav__list">
      <div class="app-nav__section">Разделы</div>
      <v-list-item
          prepend-icon="mdi-pen"
          title="Задачи"
          :active="isActive('/tasks')"
          @click="showTaskList"
      ></v-list-item>
      <v-list-item
          v-if="profileStore.activeUser"
          prepend-icon="mdi-relation-one-to-one"
          title="Бинарные отношения"
          :active="isActive('/relations')"
          @click="showBinaryRelationshipsPage"
      ></v-list-item>

      <template v-if="isUserAdminOrAuthor">
        <div class="app-nav__section">Управление</div>
        <v-list-item
            prepend-icon="mdi-graph"
            title="Конструктор задач"
            :active="isActive('/taskconstructor')"
            @click="showTaskConstructor"
        ></v-list-item>
        <v-list-item
            prepend-icon="mdi-toy-brick-plus"
            title="Плагины"
            :active="isActive('/plugins')"
            @click="showPluginPage"
        ></v-list-item>
        <v-list-item
            prepend-icon="mdi-library"
            title="Библиотека графов"
            :active="isActive('/graph')"
            @click="showGraphLibrary"
        ></v-list-item>
        <v-list-item
            prepend-icon="mdi-account-group"
            title="Пользователи"
            :active="isActive('/profiles')"
            @click="showProfileList"
        ></v-list-item>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue"
import { useRoute, useRouter } from "vue-router"
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
    const route = useRoute()
    const profileStore = useProfileStore()

    ensureActiveUser()

    const isUserAdminOrAuthor = computed(() => {
      return profileStore.activeUser?.role === "ADMIN" || profileStore.activeUser?.role === "AUTHOR"
    })

    const isActive = (basePath: string) => {
      if (basePath === "root") {
        return route.path === "/"
      }
      return route.path.startsWith(basePath)
    }

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
      isActive,
      showTaskConstructor,
      showTaskList,
      showPluginPage,
      showProfileList,
      showGraphLibrary,
      showExamPage,
      showBinaryRelationshipsPage,
      profileStore
    }
  },
})
</script>

<style scoped>
.app-nav {
  background: linear-gradient(160deg, #1565c0 0%, #1976d2 45%, #42a5f5 100%) !important;
}

.app-nav__hero {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.16);
}

.app-nav__hero-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.24);
  color: #ffffff;
  flex-shrink: 0;
}

.app-nav__hero-title {
  font-size: 17px;
  font-weight: 700;
  color: #ffffff;
}

.app-nav__hero-caption {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.78);
}

.app-nav__list {
  padding: 0 8px;
}

.app-nav__section {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
  padding: 10px 12px 4px;
}

.app-nav__list :deep(.v-list-item) {
  border-radius: 10px;
  min-height: 40px;
  color: rgba(255, 255, 255, 0.92);
}

.app-nav__list :deep(.v-list-item:hover) {
  background: rgba(255, 255, 255, 0.12);
}

.app-nav__list :deep(.v-list-item--active) {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.app-nav__list :deep(.v-list-item--active .v-list-item-title) {
  font-weight: 600;
  color: #ffffff;
}
</style>
