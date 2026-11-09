<template>
    <v-app-bar
        class="app-bar"
        density="compact"
      >
      <template v-slot:prepend>
        <v-app-bar-nav-icon @click.stop="drawer = !drawer">

        </v-app-bar-nav-icon>

      </template>

      <v-app-bar-title>Wise Task</v-app-bar-title>

      <v-menu
        v-if="activeUser != null"
        location="bottom end"
        @update:model-value="onProfileMenuToggle"
      >
        <template v-slot:activator="{ props: menuProps }">
          <v-chip
            v-bind="menuProps"
            class="mr-2"
            prepend-icon="mdi-account-circle"
            :title="'Вы вошли как ' + activeUser.email"
          >
            {{ activeUserFullName }} ({{ activeUserRole }})
          </v-chip>
        </template>
        <v-card class="profile-menu" min-width="320">
          <div class="profile-menu__header">
            <v-avatar size="44" :color="avatarColor" class="text-uppercase text-caption font-weight-bold">
              {{ activeUserInitials }}
            </v-avatar>
            <div class="profile-menu__user">
              <div class="profile-menu__name">{{ activeUserFullName }}</div>
              <div class="profile-menu__email">{{ activeUser.email }}</div>
              <div class="profile-menu__role">{{ activeUserRole }}</div>
            </div>
          </div>

          <v-divider />

          <div class="profile-menu__section">Статистика</div>
          <div v-if="profileStatsLoading" class="profile-menu__loading">
            <v-progress-circular indeterminate size="20" width="2" class="mr-2" />
            <span class="text-caption">Загрузка...</span>
          </div>
          <v-list v-else lines="one" density="compact" class="profile-menu__stats">
            <v-list-item title="Правильно решено задач">
              <template v-slot:append>{{ formatStat(profileStats.solved) }}</template>
            </v-list-item>
            <v-list-item title="Создано вершин">
              <template v-slot:append>{{ formatStat(profileStats.vertices) }}</template>
            </v-list-item>
            <v-list-item title="Создано рёбер">
              <template v-slot:append>{{ formatStat(profileStats.edges) }}</template>
            </v-list-item>
          </v-list>

          <v-divider />

          <div class="profile-menu__actions">
            <v-btn block color="#e53935" variant="flat" prepend-icon="mdi-logout" @click="logout">
              Выйти
            </v-btn>
          </div>
        </v-card>
      </v-menu>
    </v-app-bar>
    <navigation :drawer="drawer" @hideMenu="drawer = !drawer"></navigation>
</template>

<style scoped>
.app-bar {
  background: linear-gradient(135deg, #1565c0 0%, #1976d2 45%, #42a5f5 100%) !important;
  box-shadow: 0 2px 12px rgba(21, 101, 192, 0.3);
}

.app-bar :deep(.v-app-bar-title) {
  color: #ffffff;
  font-size: 17px;
  font-weight: 700;
}

.app-bar :deep(.v-btn) {
  color: #ffffff;
}

.app-bar :deep(.v-chip) {
  background: rgba(13, 71, 161, 0.55);
  color: #ffffff;
  font-weight: 500;
}

.app-bar :deep(.v-chip:hover) {
  background: rgba(13, 71, 161, 0.75);
}

.profile-menu {
  border-radius: 14px !important;
  border: 1px solid #d6e5f5;
  overflow: hidden;
}

.profile-menu__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: linear-gradient(135deg, #e8f2fd 0%, #f7fbff 55%, #eef5fd 100%);
}

.profile-menu__user {
  min-width: 0;
}

.profile-menu__name {
  font-size: 15px;
  font-weight: 600;
  color: #0d47a1;
}

.profile-menu__email {
  font-size: 12px;
  color: #78909c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-menu__role {
  display: inline-block;
  margin-top: 4px;
  padding: 1px 8px;
  border-radius: 8px;
  background: rgba(25, 118, 210, 0.12);
  color: #1976d2;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.profile-menu__section {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: #4a90d9;
  padding: 10px 14px 2px;
}

.profile-menu__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}

.profile-menu__stats {
  padding-bottom: 4px;
}

.profile-menu__actions {
  padding: 12px 14px;
}
</style>

<script lang='ts'>
import { defineComponent } from 'vue'
import { useProfileStore } from '@/store/profile'
import { mapState } from 'pinia'
import Navigation from './Navigation.vue'
import { UserStorageGetters } from "@/entities/user/storage/getters";
import { ensureActiveUser } from "@/entities/user/lib/ensureActiveUser";
import { getKeyByValue } from '@/common/Role'
import { GET_STATISTIC } from '@/api/Queries'
import { useApolloClient } from '@vue/apollo-composable'

interface ProfileStats {
  solved: number | null
  vertices: number | null
  edges: number | null
}

export default defineComponent({
  components: { Navigation },
  computed: {
    ...mapState(useProfileStore, ['activeUser']),
    activeUserInitials(): string {
      const user = this.activeUser
      if (!user) return '?'
      const initials = `${user.lastName?.[0] ?? ''}${user.firstName?.[0] ?? ''}`
      return initials ? initials.toUpperCase() : '?'
    },
    avatarColor(): string {
      const colors = ['#1976d2', '#26a69a', '#ef6c00', '#8e24aa', '#43a047', '#f06292', '#6d4c41', '#1e88e5']
      const source = this.activeUser?.email || this.activeUser?.lastName || 'user'
      const hash = [...source].reduce((acc, char) => acc + char.charCodeAt(0), 0)
      return colors[hash % colors.length]
    },
    activeUserFullName(): string {
      const user = this.activeUser
      if (!user) return ''
      return [user.lastName, user.firstName, user.patronymic]
          .filter((part) => part && part.length > 0)
          .join(' ') || user.email
    },
    activeUserRole(): string {
      return this.activeUser?.role ? getKeyByValue(this.activeUser.role) : ''
    },
  },
  data () {
    return {
      drawer: false,
      profileStats: {
        solved: null,
        vertices: null,
        edges: null,
      } as ProfileStats,
      profileStatsLoading: false,
    }
  },
  mounted () {
    ensureActiveUser()
  },
  methods: {
    async loadProfileStats () {
      const user = this.activeUser
      if (!user?.id || this.profileStatsLoading) return

      this.profileStatsLoading = true
      const { client } = useApolloClient()
      const fetchStat = (eventType: string): Promise<number | null> =>
        client
          .query({
            query: GET_STATISTIC,
            variables: {
              request: {
                type: 'SUM',
                scope: 'USER',
                event_type: eventType,
                user_id: user.id,
              },
            },
            fetchPolicy: 'no-cache',
          })
          .then((response) => response.data?.getStatistic?.value ?? null)
          .catch((error) => {
            console.error('Ошибка загрузки статистики:', eventType, error)
            return null
          })

      try {
        const [solved, vertices, edges] = await Promise.all([
          fetchStat('task_success'),
          fetchStat('node_add'),
          fetchStat('edge_add'),
        ])
        this.profileStats = { solved, vertices, edges }
      } finally {
        this.profileStatsLoading = false
      }
    },

    onProfileMenuToggle (open: boolean) {
      if (open) {
        this.loadProfileStats()
      }
    },

    formatStat (value: number | null): string {
      return value == null ? '—' : String(Math.round(value))
    },

    logout () {
      UserStorageGetters.removeToken()
      useProfileStore().activeUser = null
      this.$router.push('/auth/signin')
    },

    toSelfProfile() {
      this.$router.push('/auth/signin') //TODO: redirect to self profile page
    }
  }
})
</script>
