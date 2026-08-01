"use client";

import { useState, useEffect } from "react";

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const login = (userId: string, role: string, expiresAt: Date) => {
    const newToken = crypto.randomUUID();
    const expiresIn = expiresAt.getTime() - Date.now();
    sessions.set(newToken, {
      id: newToken,
      userId,
      role: role as "client" | "kasir" | "admin",
      expiresAt,
    });
    localStorage.setItem("auth_token", newToken);
    setToken(newToken);
    return newToken;
  };

  const logout = () => {
    if (token) sessions.delete(token);
    localStorage.removeItem("auth_token");
    setToken(null);
  };

  return { token, login, logout };
}
