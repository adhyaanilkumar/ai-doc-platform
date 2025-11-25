import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import api from "../services/api";
import { User } from "../types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { email: string; password: string; full_name?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const fetchProfile = async (): Promise<User> => {
  const { data } = await api.get<User>("/api/auth/me");
  return data;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await fetchProfile();
      setUser(profile);
    } catch (error) {
      console.error("Auth bootstrap failed", error);
      localStorage.removeItem("token");
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email: string, password: string) => {
    const params = new URLSearchParams();
    params.append("username", email);
    params.append("password", password);
    params.append("grant_type", "password");

    const { data } = await api.post<{ access_token: string }>("/api/auth/login", params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
    const profile = await fetchProfile();
    setUser(profile);
  }, []);

  const register = useCallback(
    async ({ email, password, full_name }: { email: string; password: string; full_name?: string }) => {
      try {
        await api.post("/api/auth/register", { email, password, full_name });
        await login(email, password);
      } catch (error: any) {
        // Re-throw the error so the component can handle it
        throw error;
      }
    },
    [login],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
    }),
    [user, token, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }
  return context;
};

