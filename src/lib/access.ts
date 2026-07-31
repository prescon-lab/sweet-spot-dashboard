import { useAuth } from "./auth";

export type AccessRole = "admin" | "guardian";

/** Papel atual do usuário logado (admin quando tem o papel de administrador). */
export function useAccessRole(): AccessRole {
  const { role } = useAuth();
  return role;
}
