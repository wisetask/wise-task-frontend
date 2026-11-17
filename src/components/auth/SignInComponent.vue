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
                    type="submit"
                    @click="signUp"
                    block
                    color="primary"
                    text="Регистрация"
                    variant="outlined"
                  ></v-btn>
                </v-col>
              </v-row>
              <v-divider class="my-2">или</v-divider>
              <div
                style="
                  position: relative;
                  width: 100%;
                  height: 40px;
                  overflow: hidden;
                  margin-top: 16px;"
              >
                <v-btn
                  block
                  color="primary"
                  variant="outlined"
                  tabindex="-1"
                  aria-hidden="true"
                  :ripple="false"
                  style="
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 40px;
                    pointer-events: none;
                    text-transform: none;"
                >
                  <v-icon start>mdi-google</v-icon>
                  Войти через Google
                </v-btn>
                <div
                  ref="googleButton"
                  style="
                    position: absolute;
                    inset: 0;
                    z-index: 2;
                    width: 100%;
                    height: 40px;
                    opacity: 0;
                    cursor: pointer;"
                ></div>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { useProfileStore } from "@/store/profile";
import { SIGN_IN } from "@/api/Mutations";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { defineComponent } from "vue";
import { UserStorageSetters } from "@/entities/user/storage/setters";
import { initializeGoogleButton } from "@/entities/user/lib/googleOAuth";

export default defineComponent({
  data() {
    return {
      loading: false,
      email: "",
      password: "",
      profileStore: useProfileStore(),
      visible: false,
    };
  },
  methods: {
    signIn(event: any) {
      UserStorageSetters.removeToken();
      this.loading = true;
      const { mutate: signIn, onDone, onError } = useMutation(SIGN_IN);

      const request = {
        signInRequest: {
          email: this.email,
          password: this.password,
        },
      };

      signIn(request);

      onDone((response) => {
        this.loading = false;
        const accessToken = response.data.signIn.accessToken;
        UserStorageSetters.setToken(accessToken);
        setTimeout(() => this.$router.push("/tasks"), 30);
      });

      onError(({ networkError, graphQLErrors }) => {
        this.loading = false;
        if (graphQLErrors) {
          graphQLErrors.map(({ message }) => {
            if (message === "NOT_FOUND") {
              console.log("profile not found");
            }
          });
        }
      });
    },
    signUp() {
      this.$router.push("/auth/signup");
    },
  },
  async mounted() {
    const element = this.$refs.googleButton as HTMLElement | undefined;
    if (!element) {
      console.error("[Google Auth] Button element not found");
      return;
    }
    try {
      await initializeGoogleButton(element);
      console.log("[Google Auth] Google button initialized");
    } catch (error) {
      console.error("[Google Auth] Initialization failed:", error);
    }
  },
});
</script>
