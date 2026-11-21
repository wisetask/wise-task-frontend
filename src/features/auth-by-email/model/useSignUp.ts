import { useMutation } from "@vue/apollo-composable";
import { useUserStore } from "@/entities/user";
import { SignUpMutation } from "../api/mutations";

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  patronymic: string;
}

export function useSignUp() {
  const userStore = useUserStore();
  const { mutate, loading, error } = useMutation(SignUpMutation, { throws: "never" });

  async function signUp(data: SignUpData): Promise<boolean> {
    const result = await mutate({
      request: {
        profile: {
          email: data.email,
          profilePassword: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          patronymic: data.patronymic || null,
        },
      },
    });
    const token = result?.data?.signUp.accessToken;
    if (!token) {
      return false;
    }
    await userStore.logIn(token);
    return true;
  }

  return { signUp, loading, error };
}
