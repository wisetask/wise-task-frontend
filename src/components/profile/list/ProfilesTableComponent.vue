<template>
  <div class="lv-page">
    <div v-if="loading" class="lv-loading">
      <v-progress-circular indeterminate size="20" width="2" />
      Загрузка...
    </div>

    <div v-else-if="profileStore.userList.length === 0" class="lv-empty">
      <v-icon icon="mdi-magnify" />
      Пользователи не найдены
    </div>

    <v-row v-else dense>
      <v-col v-for="profile in profileStore.userList" :key="profile.id" cols="12" sm="6" md="4">
        <div class="lv-card">
          <div class="lv-card__header">
            <v-avatar size="38" :color="avatarColor(profile)" class="text-uppercase text-caption font-weight-bold">
              {{ avatarInitials(profile) }}
            </v-avatar>
            <div class="lv-card__title" :title="fullName(profile)">{{ fullName(profile) }}</div>
          </div>

          <div class="lv-card__row">
            <v-icon size="14" icon="mdi-email-outline" />
            <span class="lv-card__row-text">{{ profile.email }}</span>
          </div>

          <div class="lv-card__chips">
            <v-chip size="x-small" variant="tonal" :color="roleColor(profile.profileRole)">
              {{ mapRole(profile.profileRole) }}
            </v-chip>
          </div>

          <div class="lv-card__footer">
            <v-btn size="small" rounded="lg" color="#1976d2" variant="flat" prepend-icon="mdi-eye"
                @click="toProfile(profile.id)">
              Открыть
            </v-btn>
            <v-spacer />
            <v-btn v-if="isUserAdmin" size="small" variant="text" color="#e53935" icon="mdi-delete"
                @click="deleteProfile(profile.id)" />
          </div>
        </div>
      </v-col>
    </v-row>

    <div class="lv-footer">
      <span class="lv-footer__total">Всего: {{ totalCount }}</span>
      <v-pagination
          v-model="page"
          :length="pageCount"
          :total-visible="7"
          density="comfortable"
          rounded="circle"
          class="lv-pagination"
      />
      <v-select
          v-model="pageSize"
          :items="[5, 10, 25, 50, 100]"
          label="На странице"
          density="comfortable"
          variant="outlined"
          hide-details
          class="lv-page-size"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileStore } from '@/store/profile'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { GET_ALL_PROFILES_QUERY } from '@/api/Queries'
import { getKeyByValue } from '@/common/Role'
import { Profile } from '@/__generated__/graphql'
import { DELETE_PROFILE } from "@/api/Mutations"
import { ensureActiveUser } from "@/entities/user/lib/ensureActiveUser"

const AVATAR_COLORS = ["#1976d2", "#26a69a", "#ef6c00", "#8e24aa", "#43a047", "#f06292", "#6d4c41", "#1e88e5"]

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "blue",
  AUTHOR: "teal",
  USER: "grey",
}

export default defineComponent({
  setup() {
    const router = useRouter()
    const profileStore = useProfileStore()

    const totalCount = ref(0)
    const page = ref(1)
    const pageSize = ref(10)

    const requestVariables = computed(() => {
      const { email, firstName, lastName, patronymic, role } = profileStore.filterState
      return {
        request: {
          pagination: {
            page: page.value - 1,
            pageSize: pageSize.value,
          },
          filter: {
            email: email || undefined,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            patronymic: patronymic || undefined,
            profileRole: role ? [role] : undefined,
          },
        },
      }
    })

    const { loading, onResult, refetch } = useQuery(
        GET_ALL_PROFILES_QUERY,
        requestVariables,
    )

    onMounted(async () => {
      await ensureActiveUser()
    })

    onResult(queryResult => {
      if (!queryResult.loading) {
        profileStore.userList =
            queryResult.data?.getAllProfiles?.items ?? []
        totalCount.value =
            queryResult.data?.getAllProfiles?.pagination?.totalCount ??
            profileStore.userList.length
      }
    })

    watch([page, pageSize], () => {
      refetch(requestVariables.value)
    })

    let searchTimeout: number | undefined

    watch(() => ({ ...profileStore.filterState }), () => {
      if (searchTimeout) {
        window.clearTimeout(searchTimeout)
      }
      searchTimeout = window.setTimeout(() => {
        if (page.value !== 1) {
          page.value = 1
        } else {
          refetch(requestVariables.value)
        }
      }, 300)
    }, { deep: true })

    const isUserAdmin = computed(() => {
      return profileStore.activeUser?.role === "ADMIN"
    })

    const pageCount = computed(() =>
        Math.max(1, Math.ceil(totalCount.value / pageSize.value))
    )

    const mapRole = (role: string) => {
      return getKeyByValue(role)
    }

    const roleColor = (role: string) => ROLE_COLORS[role] ?? 'grey'

    const fullName = (profile: Profile) => {
      return [profile.lastName, profile.firstName, profile.patronymic]
          .filter((part) => part && part.length > 0)
          .join(' ') || profile.email
    }

    const avatarInitials = (profile: Profile) => {
      const initials = `${profile.lastName?.[0] ?? ''}${profile.firstName?.[0] ?? ''}`
      return initials ? initials : '?'
    }

    const avatarColor = (profile: Profile) => {
      const hash = [...(profile.email || profile.id)].reduce(
          (acc, char) => acc + char.charCodeAt(0), 0
      )
      return AVATAR_COLORS[hash % AVATAR_COLORS.length]
    }

    const toProfile = (id: string) => {
      router.push('/profiles/' + id)
    }

    const deleteProfile = async (id: string) => {
      try {
        const { mutate } = useMutation(DELETE_PROFILE)
        await mutate({ id: id })
        profileStore.userList = profileStore.userList.filter(
            (profile: Profile) => profile.id !== id
        )
        totalCount.value = Math.max(0, totalCount.value - 1)
      } catch(error) {
        console.error("Ошибка при удалении профиля:", error)
      }
    }

    return {
      profileStore,
      loading,
      totalCount,
      page,
      pageSize,
      pageCount,
      isUserAdmin,
      mapRole,
      roleColor,
      fullName,
      avatarInitials,
      avatarColor,
      toProfile,
      deleteProfile,
    }
  }
})
</script>

<style>
@import "@/components/common/listViewStyles.css";
</style>
