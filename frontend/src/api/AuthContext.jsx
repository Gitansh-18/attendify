import React, { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [teacher, setTeacher] = useState(() => {
    const stored = localStorage.getItem('teacher');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('teacher', JSON.stringify(data.teacher));
    setTeacher(data.teacher);
  };

  const signup = async (name, email, password) => {
    const { data } = await api.post('/auth/signup', { name, email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('teacher', JSON.stringify(data.teacher));
    setTeacher(data.teacher);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('teacher');
    setTeacher(null);
  };

  return (
    <AuthContext.Provider value={{ teacher, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
