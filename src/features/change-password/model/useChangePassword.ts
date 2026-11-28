import { useMutation } from "@vue/apollo-composable";
import { useUserStore } from "@/entities/user";
import { ChangePasswordMutation } from "../api/changePassword";

export function useChangePassword() {
  const userStore = useUserStore();
  const mutation = useMutation(ChangePasswordMutation, {
    throws: "never",
    context: { keepSession: true },
  });

  async function changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
    const user = userStore.user;
    if (user === null) {
      return false;
    }
    const result = await mutation.mutate({
      id: user.id,
      oldPassword: oldPassword,
      newPassword: newPassword,
    });
    return Boolean(result?.data?.changePassword);
  }

  return { changePassword: changePassword, loading: mutation.loading, error: mutation.error };
}
