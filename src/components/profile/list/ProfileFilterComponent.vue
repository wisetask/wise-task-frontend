<template>
  <div class="flt-panel">
    <div class="flt-panel__header">
      <span class="flt-panel__icon">
        <v-icon size="20" icon="mdi-filter-variant" />
      </span>
      <span class="flt-panel__title">Фильтр профилей</span>
    </div>
    <v-form validate-on="submit lazy" @submit.prevent="search">
      <div class="flt-panel__body">
        <v-text-field
          density="comfortable"
          variant="outlined"
          label="Имя"
          color="primary"
          v-model="firstName"
        ></v-text-field>
        <v-text-field
          label="Фамилия"
          color="primary"
          v-model="lastName"
          density="comfortable"
          variant="outlined"
        ></v-text-field>
        <v-text-field
          label="Отчество"
          color="primary"
          v-model="patronymic"
          density="comfortable"
          variant="outlined"
        ></v-text-field>
        <v-text-field
          label="Email"
          color="primary"
          v-model="email"
          density="comfortable"
          variant="outlined"
        ></v-text-field>
        <v-select
          label="Роль"
          :items="roleItems"
          v-model="role"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
        ></v-select>
      </div>
      <div class="flt-panel__actions">
        <v-btn
          :loading="loading"
          type="submit"
          color="#1976d2"
          variant="flat"
          prepend-icon="mdi-magnify"
          @click="search"
        >Найти</v-btn>
        <v-btn color="#5c6470" variant="text" prepend-icon="mdi-filter-remove" @click="resetFilter">
          Сбросить
        </v-btn>
      </div>
    </v-form>
  </div>
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
    },
    resetFilter() {
      this.email = ''
      this.firstName = ''
      this.lastName = ''
      this.patronymic = ''
      this.role = ''
      this.search()
    }
  }
})
</script>

<style>
@import "@/components/common/filterStyles.css";
</style>
