import { useMutation } from "@vue/apollo-composable";
import { SendResetLinkMutation } from "../api/mutations";

export function useSendResetLink() {
  const { mutate, loading, error } = useMutation(SendResetLinkMutation, {
    throws: "never",
    context: { skipAuth: true },
  });

  async function sendResetLink(email: string): Promise<boolean> {
    const result = await mutate({ email });
    return Boolean(result?.data?.sendResetPasswordEmail);
  }

  return { sendResetLink, loading, error };
}
