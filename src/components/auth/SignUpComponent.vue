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
          <v-card-title>Регистрация</v-card-title>
          <v-card-text>
            <v-form validate-on="submit lazy" @submit.prevent="signUp">
              <v-text-field
                density="compact"
                placeholder="Имя"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                color="primary"
                v-model="firstName"
                :rules="firstNameRules"
              >
              </v-text-field>
              <v-text-field
                density="compact"
                placeholder="Фамилия"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                color="primary"
                v-model="lastName"
              >
              </v-text-field>
              <v-text-field
                density="compact"
                placeholder="Отчество"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                color="primary"
                v-model="patronymic"
              >
              </v-text-field>
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
                placeholder="Введите пароль"
                prepend-inner-icon="mdi-lock-outline"
                variant="outlined"
                @click:append-inner="visible = !visible"
                color="primary"
                v-model="password"
              >
              </v-text-field>
              <v-text-field
                :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                :type="visible ? 'text' : 'password'"
                density="compact"
                placeholder="Повторите пароль"
                prepend-inner-icon="mdi-lock-outline"
                variant="outlined"
                @click:append-inner="visible = !visible"
                color="primary"
                v-model="repeatedPassword"
              >
              </v-text-field>
              <v-row>
                <v-col>
                  <v-btn
                    class="my-4"
                    style="width: 100%"
                    :loading="loading"
                    type="submit"
                    blockd
                    color="primary"
                    text="Зарегистрироваться"
                    variant="outlined"
                  ></v-btn>
                  <v-btn
                    :loading="loading"
                    @click="signIn"
                    block
                    color="primary"
                    text="Аккаунт уже есть. Войти"
                    variant="outlined"
                  ></v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {defineComponent} from "vue";
import {useProfileStore} from "@/store/profile";
import {SIGN_UP} from "@/api/Mutations";
import {useMutation} from "@vue/apollo-composable";
import {UserStorageSetters} from "@/entities/user/storage/setters";

export default defineComponent({
  data() {
    return {
      loading: false,
      email: "",
      firstName: "",
      lastName: "",
      patronymic: "",
      password: "",
      repeatedPassword: "",
      visible: false,
      profileStore: useProfileStore(),
      firstNameRules: [
        (value: string) => {
          if (value?.length > 3) return true;

          return "Имя должно состоять хотя бы из 3 символов";
        },
      ],
    };
  },
  methods: {
    signUp() {
      this.loading = true;
      UserStorageSetters.removeToken();
      const { mutate, onDone, onError } = useMutation(SIGN_UP);

      const request = {
        signUpRequest: {
          profile: {
            email: this.email,
            profilePassword: this.password,
            firstName: this.firstName,
            lastName: this.lastName,
            patronymic: this.patronymic,
          },
        },
      };

      mutate(request);

      onDone((response) => {
        this.loading = false;
        const accessToken = response.data.signUp.accessToken;
        UserStorageSetters.setToken(accessToken);
        const jwtData = accessToken.split(".")[1];
        const decodedJwtJsonData = window.atob(jwtData);
        const decodedJwtData = JSON.parse(decodedJwtJsonData);
        this.profileStore.activeUser = {
          role: decodedJwtData.role,
          id: decodedJwtData.sub ?? decodedJwtData.id,
          email: decodedJwtData.email,
        };
      });
      this.$router.push("/plugins");

      onError(({ graphQLErrors }) => {
        this.loading = false;
        if (graphQLErrors) {
          graphQLErrors.map(({ message }) => {
            console.error(message);
          });
        }
      });
    },
    signIn() {
      this.$router.push("/auth/signin");
    },
  },
});
</script>
