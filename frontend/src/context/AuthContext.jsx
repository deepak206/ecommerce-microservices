
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { loginUser, registerUser } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const login = useCallback(async (credentials) => {
    const data = await loginUser(credentials);

    if (!data.token) {
      throw new Error("Login response did not contain a token");
    }

    setToken(data.token);
    setUser(data.user ?? null);

    return data;
  }, []);

  const register = useCallback(async (userData) => {
    const data = await registerUser(userData);

    // Register may return a token, depending on your API.
    if (data.token) {
      setToken(data.token);
      setUser(data.user ?? null);
    }

    return data;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
    }),
    [token, user, login, register, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
