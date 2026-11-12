import { useQuery } from "@vue/apollo-composable";
import { GET_MY_PROFILE } from "@/api/Queries";
import { useProfileStore, ActiveUserInfo } from "@/store/profile";
import { UserStorageGetters } from "@/entities/user/storage/getters";

/**
 * Восстанавливает текущего пользователя по запросу getMyProfile.
 * В JWT теперь нет роли и id (только sub/email), поэтому права берём из профиля.
 *
 * - если активный пользователь уже загружен (роль известна) — ничего не делает;
 * - если есть токен, но пользователя нет (или роль неизвестна после signUp) —
 *   запрашивает getMyProfile и заполняет стор.
 */
export async function ensureActiveUser(): Promise<ActiveUserInfo | null> {
  const profileStore = useProfileStore();

  if (profileStore.activeUser?.role) {
    return profileStore.activeUser;
  }

  const token = await UserStorageGetters.getToken();
  if (!token) {
    return null;
  }

  return new Promise((resolve) => {
    const { onResult, onError } = useQuery(
        GET_MY_PROFILE,
        null,
        { fetchPolicy: "network-only" },
    );

    onResult((response) => {
      const profile = response.data?.getMyProfile;
      if (!profile) {
        resolve(null);
        return;
      }
      const activeUser: ActiveUserInfo = {
        role: profile.profileRole,
        id: profile.id,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        patronymic: profile.patronymic ?? undefined,
      };
      profileStore.activeUser = activeUser;
      resolve(activeUser);
    });

    onError((error) => {
      console.error("Не удалось загрузить текущий профиль:", error);
      resolve(null);
    });
  });
}