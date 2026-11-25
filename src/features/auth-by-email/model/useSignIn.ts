import { useMutation } from "@vue/apollo-composable";
import { useUserStore } from "@/entities/user";
import { SignInMutation } from "../api/mutations";

export function useSignIn() {
  const userStore = useUserStore();
  const { mutate, loading, error } = useMutation(SignInMutation, {
    throws: "never",
    context: { skipAuth: true },
  });

  async function signIn(email: string, password: string): Promise<boolean> {
    const result = await mutate({ request: { email, password } });
    const token = result?.data?.signIn.accessToken;
    if (!token) {
      return false;
    }
    await userStore.logIn(token);
    return true;
  }

  return { signIn, loading, error };
}
