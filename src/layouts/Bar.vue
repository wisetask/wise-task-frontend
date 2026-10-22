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

      <v-chip
        v-if="activeUser != null"
        class="mr-2"
        prepend-icon="mdi-account-circle"
        :title="'Вы вошли как ' + activeUser.email"
      >
        {{ activeUserFullName }} ({{ activeUserRole }})
      </v-chip>

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
    }
  },
  mounted () {
    ensureActiveUser()
  },
  methods: {
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
