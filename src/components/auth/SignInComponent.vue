<template>
  <v-container class="fill-height" fluid>
    <v-row>
      <v-col>
        <v-img
          class="mx-auto my-6"
          max-width="228"
          src="https://etu.ru/assets/files/ru/universitet/korporativnyj-stil/logo-leti-sin-rus-2017.png"
        ></v-img>
        <v-card
          class="mx-auto pa-12 pb-8"
          elevation="8"
          max-width="448"
          rounded="lg"
        >
          <v-card-title>Вход</v-card-title>
          <v-card-text>
            <v-form validate-on="submit lazy" @submit.prevent="signIn">
              <v-text-field
                density="compact"
                placeholder="Введите email"
                prepend-inner-icon="mdi-email-outline"
                variant="outlined"
                color="primary"
                v-model="email"
              >
              </v-text-field>
              <v-text-field
                :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                :type="visible ? 'text' : 'password'"
                density="compact"
                variant="outlined"
                placeholder="Введите пароль"
                prepend-inner-icon="mdi-lock-outline"
                @click:append-inner="visible = !visible"
                color="primary"
                v-model="password"
              >
              </v-text-field>
              <v-row>
                <v-col cols="6">
                  <v-btn
                    :loading="loading"
                    type="submit"
                    block
                    color="primary"
                    text="Вход"
                    variant="outlined"
                  ></v-btn>
                </v-col>
                <v-col cols="6">
                  <v-btn
                    :loading="loading"
                    type="button"
                    @click="signUp"
                    block
                    color="primary"
                    text="Регистрация"
                    variant="outlined"
                  ></v-btn>
                </v-col>
              </v-row>       
            <v-divider class="my-4">или</v-divider>
              <v-btn
                block
                color="primary"
                variant="outlined"
                @click="signInWithGoogle"
              >
                Войти через Google
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useRouter } from "vue-router";
import { useApolloClient } from "@vue/apollo-composable";

import { useProfileStore } from "@/store/profile";
import { SIGN_IN } from "@/api/Mutations";
import { UserStorageSetters } from "@/entities/user/storage/setters";
import { UserStorageKeys } from "@/entities/user/storage/config";
import { redirectToGoogleOAuth } from "@/entities/user/lib/googleOAuth";

export default defineComponent({
  name: "SignInComponent",
  data() {
    return {
      loading: false,
      email: "",
      password: "",
      profileStore: useProfileStore(),
      visible: false,
    };
  },

  setup() {
    const { client } = useApolloClient();
    const router = useRouter();
    return {
      apolloClient: client,
      router,
    };
  },

  methods: {
    async signInWithGoogle() {
      await redirectToGoogleOAuth();
    },
    async signIn() {
      if (this.loading) return;
      this.loading = true;
      UserStorageSetters.removeToken();
      try {
        const result = await this.apolloClient.mutate({
          mutation: SIGN_IN,
          variables: {
            signInRequest: {
              email: this.email,
              password: this.password,
            },
          },
        });
        const token = result.data?.signIn?.token;
        if (!token) {
          throw new Error("Сервер не вернул токен авторизации.");
        }

        UserStorageSetters.setToken(token);
        await this.router.push("/tasks");
      } catch (error: unknown) {
        console.error("Sign-in failed:", error);
      } finally {
        this.loading = false;
      }
    },
    async signUp() {
      await this.router.push("/auth/signup");
    },
  },
});
</script>
