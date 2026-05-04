import { createContext, useState } from 'react';

export const AuthContext = createContext();

const readStoredAuth = () => {
  try {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      return { user: null, isAuthenticated: false };
    }

    return {
      user: JSON.parse(storedUser),
      isAuthenticated: true,
    };
  } catch {
    return { user: null, isAuthenticated: false };
  }
};

export const AuthProvider = ({ children }) => {
  const initialAuth = readStoredAuth();
  const [user, setUser] = useState(initialAuth.user);
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth.isAuthenticated);

  const login = (token, userData) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};