import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  username: string;
  role: 'HR' | 'Finance' | 'Legal' | 'Technical' | 'Admin';
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: User[] = [
  { id: '1', username: 'admin', role: 'Admin', email: 'admin@cognifile.com' },
  { id: '2', username: 'hr_manager', role: 'HR', email: 'hr@cognifile.com' },
  { id: '3', username: 'finance_lead', role: 'Finance', email: 'finance@cognifile.com' },
  { id: '4', username: 'legal_counsel', role: 'Legal', email: 'legal@cognifile.com' },
  { id: '5', username: 'tech_lead', role: 'Technical', email: 'tech@cognifile.com' },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    const foundUser = mockUsers.find(u => u.username === username);
    if (foundUser && password === 'password123') {
      setUser(foundUser);
      localStorage.setItem('user', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}