import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { apolloClient, getToken, removeToken, setToken } from "@/shared/api";
import { MyProfileQuery } from "../api/myProfile";
import { parseToken } from "../lib/parseToken";
import type { User } from "./types";

export const useUserStore = defineStore("user", () => {
  const user = ref<User | null>(null);
  const isLoading = ref(false);

  const isLoggedIn = computed(() => user.value !== null);

  let loading: Promise<void> | null = null;

  function loadProfile(): Promise<void> {
    loading = fetchProfile();
    return loading;
  }

  // ждем текущей загрузки профиля. пока профиль грузится, роль неизвестна
  function whenReady(): Promise<void> {
    return loading ?? Promise.resolve();
  }

  async function fetchProfile(): Promise<void> {
    const token = getToken();
    const tokenData = token ? parseToken(token) : null;

    if (!tokenData || tokenData.exp * 1000 <= Date.now()) {
      removeToken();
      user.value = null;
      return;
    }

    isLoading.value = true;
    try {
      const { data } = await apolloClient.query({
        query: MyProfileQuery,
        fetchPolicy: "network-only",
      });
      const profile = data.getMyProfile;
      user.value = {
        id: profile.id,
        email: profile.email,
        role: profile.profileRole,
        firstName: profile.firstName,
        lastName: profile.lastName,
        patronymic: profile.patronymic ?? null,
      };
    } catch {
      user.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  async function logIn(token: string): Promise<void> {
    // Если до этого был вошедший пользователь, его данные не должны остаться в кэше.
    await apolloClient.clearStore();
    setToken(token);
    await loadProfile();
  }

  async function logOut(): Promise<void> {
    removeToken();
    user.value = null;
    await apolloClient.clearStore();
  }

  // бэк ответил не авторизован: токен уже стёрт клиентом,
  // а кэш не трогаем, потому что в этот момент ещё идут запросы.
  function clearUser(): void {
    user.value = null;
  }

  return { user, isLoading, isLoggedIn, loadProfile, whenReady, logIn, logOut, clearUser };
});
