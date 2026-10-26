<template>
    <v-app-bar
        color="primary"
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
        <v-card min-width="280">
          <v-card-title>Статистика</v-card-title>
          <v-card-text>
            <div v-if="profileStatsLoading" class="d-flex align-center justify-center">
              <v-progress-circular indeterminate size="20" width="2" class="mr-2" />
              <span class="text-caption">Загрузка...</span>
            </div>
            <v-list v-else lines="one" density="compact">
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
          </v-card-text>
        </v-card>
      </v-menu>

      <v-btn
        v-if="activeUser != null"
        density="comfortable"
        icon="mdi-logout"
        @click="logout"
        >
      </v-btn>
    </v-app-bar>
    <navigation :drawer="drawer" @hideMenu="drawer = !drawer"></navigation>
</template>

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
