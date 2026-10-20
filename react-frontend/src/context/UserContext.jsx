import { useCallback, useEffect, useState } from "react";
import { UserContext } from "./UserContext.js";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, { credentials: "include", ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { throw new Error(`Backend returned a non-JSON response (${response.status})`); }
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  }, []);
  useEffect(() => { request("/api/user").then(data => setUser(data.user)).catch(() => setUser(null)).finally(() => setLoading(false)); }, [request]);
  const login = async credentials => { const data = await request("/api/auth/login", { method: "POST", body: JSON.stringify(credentials) }); setUser(data.user); return data.user; };
  const logout = async () => { try { await request("/api/auth/logout", { method: "POST" }); } finally { setUser(null); } };
  return <UserContext.Provider value={{ user, loading, login, logout, request }}>{children}</UserContext.Provider>;
}
