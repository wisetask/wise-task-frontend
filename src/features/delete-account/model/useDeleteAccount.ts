import { useMutation } from "@vue/apollo-composable";
import { useUserStore } from "@/entities/user";
import { DeleteProfileMutation } from "../api/deleteProfile";

export function useDeleteAccount() {
  const userStore = useUserStore();
  const mutation = useMutation(DeleteProfileMutation, { throws: "never" });

  async function deleteAccount(): Promise<boolean> {
    const user = userStore.user;
    if (user === null) {
      return false;
    }
    const result = await mutation.mutate({ id: user.id });
    if (!result?.data?.deleteProfile) {
      return false;
    }
    await userStore.logOut();
    return true;
  }

  return { deleteAccount: deleteAccount, loading: mutation.loading, error: mutation.error };
}
