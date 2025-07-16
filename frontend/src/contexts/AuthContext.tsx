import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'GARCOM';
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('@restaurante:token');
    
    if (token) {
      api.defaults.headers.authorization = `Bearer ${token}`;
      
      api.get('/auth/me')
        .then(response => {
          setUser(response.data.user);
        })
        .catch(() => {
          localStorage.removeItem('@restaurante:token');
          localStorage.removeItem('@restaurante:user');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { user, token } = response.data;

      localStorage.setItem('@restaurante:token', token);
      localStorage.setItem('@restaurante:user', JSON.stringify(user));

      api.defaults.headers.authorization = `Bearer ${token}`;

      setUser(user);
      
      toast.success(`Bem-vindo(a), ${user.name}!`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao fazer login';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('@restaurante:token');
    localStorage.removeItem('@restaurante:user');
    
    api.defaults.headers.authorization = '';
    
    setUser(null);
    
    toast.success('Logout realizado com sucesso!');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}