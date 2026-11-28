import { graphql } from "@/shared/api";

export const SignInMutation = graphql(`
  mutation SignIn($request: SignInRequest!) {
    signIn(signInRequest: $request) {
      accessToken
    }
  }
`);

export const SendResetLinkMutation = graphql(`
  mutation SendResetLink($email: String!) {
    sendResetPasswordEmail(email: $email)
  }
`);

export const ResetPasswordMutation = graphql(`
  mutation ResetPassword($request: ResetPasswordRequest!) {
    resetPassword(resetPasswordRequest: $request) {
      accessToken
    }
  }
`);

export const SignUpMutation = graphql(`
  mutation SignUp($request: SignUpRequest!) {
    signUp(signUpRequest: $request) {
      accessToken
    }
  }
`);
