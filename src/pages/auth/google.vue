<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-card class="pa-6" max-width="520" width="100%">
      <v-card-title>Вход через Google</v-card-title>
      <v-card-text>
        <v-progress-linear
          v-if="loading"
          indeterminate
          color="primary"
          class="mb-4"
        />
        <p>{{ message }}</p>
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mt-4"
        >
          {{ error }}
        </v-alert>
        <v-btn
          v-if="error"
          class="mt-4"
          to="/auth/signIn"
          color="primary"
        > Вернуться ко входу
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { eventsApi } from "@/api/rest";
import { UserStorageKeys } from "@/entities/user/storage/config";
import { useProfileStore } from "@/store/profile";
import { useApolloClient } from "@vue/apollo-composable";
import { GET_MY_PROFILE } from "@/api/Queries";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "GoogleAuthCallback",
  setup() {
    const { resolveClient } = useApolloClient();
    return {
      client: resolveClient(),
      profileStore: useProfileStore(),
      router: useRouter(),
    };
  },
  data() {
    return {
      loading: true,
      message: "Обрабатываем ответ Google",
      error: "",
    };
  },

  async mounted() {
    const idToken = sessionStorage.getItem("google_id_token");
    sessionStorage.removeItem("google_id_token");

    if (!idToken) {
      this.loading = false;
      this.error = "Google не вернул ID token. Попробуйте войти ещё раз.";
      console.error("[Google Auth] ID token отсутствует");
      return;
    }

    try {
      console.log("[Google Auth] ID token получен");

      // Сохраняем Google ID token для запросов к backend
      localStorage.setItem(UserStorageKeys.Token, idToken);
      eventsApi.setToken(idToken);

      this.message = "Получаем профиль пользователя...";

      console.log("[Google Auth] Отправляем запрос getMyProfile");

      const result = await this.client.query({
        query: GET_MY_PROFILE,
        fetchPolicy: "network-only",
        errorPolicy: "all",
      });
      console.log("[Google Auth] GraphQL response:", result);
      if (result.errors?.length) {
        console.error("[Google Auth] GraphQL errors:", result.errors);
        throw new Error(
          result.errors.map((item) => item.message).join("; ")
        );
      }

      const profile = result.data?.getMyProfile;
      if (!profile) {
        throw new Error("Backend не вернул профиль пользователя.");
      }
      console.log("[Google Auth] Профиль получен:", profile);
      // Сохраняем пользователя в Pinia
      this.profileStore.activeUser = {
        id: profile.id,
        email: profile.email,
        role: profile.role,
      };

      this.profileStore.currentUser = profile;
      this.message = "Вход выполнен. Перенаправляем...";
      await this.router.push("/tasks");
    } catch (error: unknown) {
      console.error("[Google Auth] Ошибка:", error);

      if (error instanceof Error) {
        console.error("Тип ошибки:", error.name);
        console.error("Сообщение:", error.message);
        console.error("Подробности:", error.stack);

        this.error = error.message;
      } else {
        this.error = "Не удалось получить профиль пользователя.";
      }

      localStorage.removeItem(UserStorageKeys.Token);
      eventsApi.setToken("");

      this.profileStore.activeUser = null;
      this.profileStore.currentUser = null;
    } finally {
      this.loading = false;
    }
  },
});
</script>
