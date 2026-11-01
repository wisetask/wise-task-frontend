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


const GOOGLE_CLIENT_ID = "";

export default defineComponent({
  name: "GoogleAuthCallback",
  data() {
    return {
      loading: true,
      message: "Обрабатываем ответ Google",
      error: "",
    };
  },

  async mounted() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const googleError = params.get("error");
    const savedState = sessionStorage.getItem("google_oauth_state");
    const codeVerifier = sessionStorage.getItem(
      "google_oauth_code_verifier",
    );

    sessionStorage.removeItem("google_oauth_state");
    sessionStorage.removeItem("google_oauth_code_verifier");

    if (googleError) {
      this.loading = false;
      this.error = `Google не завершил авторизацию: ${googleError}`;
      return;
    }

    if (!code) {
      this.loading = false;
      this.error = "Google не вернул код авторизации.";
      return;
    }

    if (!state || !savedState || state !== savedState) {
      this.loading = false;
      this.error = "Проверка OAuth state не пройдена.";
      return;
    }

    if (!codeVerifier) {
      this.loading = false;
      this.error = "Не найден PKCE code verifier.";
      return;
    }

    try {
      const response = await fetch(
        "https://oauth2.googleapis.com/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            
            code,
            code_verifier: codeVerifier,
            redirect_uri: `${window.location.origin}/auth/google`,
            grant_type: "authorization_code",
          }),
        },
      );

      const tokenData = await response.json();

      if (!response.ok) {
        throw new Error(
          tokenData.error_description ||
            tokenData.error ||
            "Google не смог обменять код авторизации.",
        );
      }

      if (!tokenData.id_token) {
        throw new Error("Google не вернул ID token.");
      }

      this.message =
        "Google выдал ID token.";
    } catch (error: unknown) {
      this.error =
        error instanceof Error
          ? error.message
          : "Не удалось обменять код авторизации.";

      console.error("Google OAuth token exchange failed:", error);
    } finally {
      this.loading = false;
    }
  },
});
</script>
