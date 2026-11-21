import { graphql } from "@/shared/api";

export const SignInMutation = graphql(`
  mutation SignIn($request: SignInRequest!) {
    signIn(signInRequest: $request) {
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
