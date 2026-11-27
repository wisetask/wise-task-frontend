import { useMutation } from "@vue/apollo-composable";
import { useUserStore } from "@/entities/user";
import { ResetPasswordMutation } from "../api/mutations";

export function useResetPassword() {
  const userStore = useUserStore();
  const { mutate, loading, error } = useMutation(ResetPasswordMutation, {
    throws: "never",
    context: { skipAuth: true },
  });

  // recoveryToken приходит в ссылке из письма. После смены пароля бэк сразу выдаёт токен входа.
  async function resetPassword(recoveryToken: string, newPassword: string): Promise<boolean> {
    const result = await mutate({ request: { recoveryToken, newPassword } });
    const token = result?.data?.resetPassword.accessToken;
    if (!token) {
      return false;
    }
    await userStore.logIn(token);
    return true;
  }

  return { resetPassword, loading, error };
}
