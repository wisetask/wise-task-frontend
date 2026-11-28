import { graphql } from "@/shared/api";

export const ChangePasswordMutation = graphql(`
  mutation ChangePassword($id: ID!, $oldPassword: String!, $newPassword: String!) {
    changePassword(id: $id, oldPassword: $oldPassword, newPassword: $newPassword)
  }
`);
