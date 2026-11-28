import { graphql } from "@/shared/api";

export const DeleteProfileMutation = graphql(`
  mutation DeleteProfile($id: ID!) {
    deleteProfile(id: $id)
  }
`);
