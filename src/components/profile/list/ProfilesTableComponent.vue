<template>
  <v-card>
    <v-data-table-server
        :headers="headers"
        :items="profileStore.userList"
        density="compact"
        :loading="loading"
        :items-length="totalCount"
        v-model:page="page"
        v-model:items-per-page="pageSize"
        :items-per-page-options="[5, 10, 25, 50, 100]"
    >
      <template v-slot:item.patronymic="{ value }">
        {{ (value as string)?.length === 0 ? '-' : value }}
      </template>
      <template v-slot:item.profileRole="{ value }">
        {{ mapRole(value as string) }}
      </template>
      <template v-slot:item.actions="{ item }">
        <v-icon
            size="small"
            @click="toProfile((item as Profile).id)"
        >
          mdi-eye
        </v-icon>
        <v-icon
            v-if="isUserAdmin"
            class="me-2"
            size="small"
            @click="deleteProfile((item as Profile).id)"
        >
          mdi-delete
        </v-icon>
      </template>
    </v-data-table-server>
  </v-card>
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

export default defineComponent({
  setup() {
    const router = useRouter()
    const profileStore = useProfileStore()

    const totalCount = ref(0)
    const page = ref(1)
    const pageSize = ref(10)

    const headers = [
      { title: 'Имя', align: 'start' as const, key: 'firstName' },
      { title: 'Фамилия', align: 'start' as const, key: 'lastName' },
      { title: 'Отчество', align: 'start' as const, key: 'patronymic' },
      { title: 'E-mail', align: 'start' as const, key: 'email' },
      { title: 'Роль', align: 'start' as const, key: 'profileRole' },
      { title: 'Действия', align: 'start' as const, key: 'actions', sortable: false }
    ]

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

    const mapRole = (role: string) => {
      return getKeyByValue(role)
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
      headers,
      isUserAdmin,
      mapRole,
      toProfile,
      deleteProfile,
    }
  }
})
</script>