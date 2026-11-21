import type { Role } from "@/shared/api";

export interface User {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  patronymic: string | null;
}
