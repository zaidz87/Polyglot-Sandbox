import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  email: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, email: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pg_token'));
  const [user, setUser] = useState<User | null>(() => {
    const email = localStorage.getItem('pg_email');
    return email ? { email } : null;
  });

  // Sync to localStorage whenever token/user change
  useEffect(() => {
    if (token) localStorage.setItem('pg_token', token);
    else localStorage.removeItem('pg_token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('pg_email', user.email);
    else localStorage.removeItem('pg_email');
  }, [user]);

  const login = (newToken: string, email: string) => {
    setToken(newToken);
    setUser({ email });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
