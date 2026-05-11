import { createContext, useState } from 'react';
import { loginRequest } from '../api/endpoints';

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

  const login = async (email, password) => {
    const response = await loginRequest({ email, password });
    const { token, user: userData } = response;

    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};