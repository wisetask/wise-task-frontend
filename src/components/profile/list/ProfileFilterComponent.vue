<template>
    <v-card>
      <v-card-title>Фильтр профилей</v-card-title>
      <v-card-text>
        <v-form validate-on="submit lazy" @submit.prevent="search">
          <v-text-field
            density="compact"
            variant="outlined"
            label="Имя"
            color="primary"
            v-model="firstName"
          >
          </v-text-field>
          <v-text-field
            label="Фамилия"
            color="primary"
            v-model="lastName"
            density="compact"
            variant="outlined"
          >
          </v-text-field>
          <v-text-field
            label="Отчество"
            color="primary"
            v-model="patronymic"
            density="compact"
            variant="outlined"
          >
          </v-text-field>
          <v-text-field
            label="Email"
            color="primary"
            v-model="email"
            density="compact"
            variant="outlined"
          >
          </v-text-field>
          <v-select
            label="Роль"
            :items="roleItems"
            v-model="role"
            variant="outlined"
            density="compact"
            hide-details="auto"
          ></v-select>

          <v-row class="mt-6">
            <v-col>
              <v-btn
                :loading="loading"
                type="submit"
                block
                @click="search"
                color="primary"
                text="Найти"
                variant="outlined"
              ></v-btn>
            </v-col>
          </v-row>
        </v-form>		
      </v-card-text>
    </v-card>
</template>

<script lang="ts">
import {defineComponent} from 'vue'
import {useProfileStore} from '@/store/profile'
import {Role} from '@/common/Role'

export default defineComponent({
  computed: {
    roleItems() {
      return [
        { title: 'Все', value: '' },
        ...Object.values(Role).map((value) => ({ title: value, value })),
      ]
    },
  },
  data () {
    return {
      loading: false,
      email:'',
      firstName: '',
      lastName: '',
      patronymic: '',
      role: '' as string,
      profileStore: useProfileStore(),
    }
  },
  methods: {
    search() {
      this.profileStore.filterState = {
        email: this.email,
        firstName: this.firstName,
        lastName: this.lastName,
        patronymic: this.patronymic,
        role: this.role ?? '',
      }
    }
  }
})
</script>
