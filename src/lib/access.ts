import { useEffect, useState } from "react";

export type AccessRole = "admin" | "guardian";

const STORAGE_KEY = "painel-access-role";

/** Resolve o papel atual a partir da URL (?acesso=guardiao|admin) ou do armazenamento local. */
export function resolveAccessRole(): AccessRole {
  if (typeof window === "undefined") return "admin";

  try {
    const param = new URLSearchParams(window.location.search).get("acesso");
    if (param === "guardiao") {
      localStorage.setItem(STORAGE_KEY, "guardian");
      return "guardian";
    }
    if (param === "admin") {
      localStorage.setItem(STORAGE_KEY, "admin");
      return "admin";
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "guardian" ? "guardian" : "admin";
  } catch {
    return "admin";
  }
}

/** Hook seguro para SSR: assume admin no servidor e resolve o papel real após a hidratação. */
export function useAccessRole(): AccessRole {
  const [role, setRole] = useState<AccessRole>("admin");

  useEffect(() => {
    setRole(resolveAccessRole());
  }, []);

  return role;
}

export function buildGuardianLink(): string {
  if (typeof window === "undefined") return "/?acesso=guardiao";
  return `${window.location.origin}/?acesso=guardiao`;
}

export function buildAdminLink(): string {
  if (typeof window === "undefined") return "/?acesso=admin";
  return `${window.location.origin}/?acesso=admin`;
}
