import { UserStorageKeys } from "@/entities/user/storage/config";
import { ActiveUserInfo } from "@/store/profile";

export const getUserFromToken =  (
  token: string | null,
): ActiveUserInfo | null => {
  if(token == null) return null
  const jwtData = token.split(".")[1];
  const decodedJwtJsonData = window.atob(jwtData);
  const decodedJwtData = JSON.parse(decodedJwtJsonData);
  localStorage.setItem(UserStorageKeys.Token, token);
  return {
    role: decodedJwtData.role,
    id: decodedJwtData.id,
    email: decodedJwtData.email,
  };
};
