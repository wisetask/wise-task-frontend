import { graphql } from "@/shared/api";

export const MyProfileQuery = graphql(`
  query MyProfile {
    getMyProfile {
      id
      email
      firstName
      lastName
      patronymic
      profileRole
    }
  }
`);
