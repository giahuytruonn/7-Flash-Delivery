import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const fullName = localStorage.getItem("fullName");

    if (token && role) {
      setUser({ token, role, fullName });
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post("/auth/login", { username, password });
      const { token, role, fullName } = response.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("fullName", fullName);

      setUser({ token, role, fullName });
      return { success: true, role };
    } catch (error) {
      const message = error.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại.";
      return { success: false, message };
    }
  };

  const register = async (username, password, fullName, role) => {
    try {
      const response = await api.post("/auth/register", { username, password, fullName, role });
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.data 
        ? Object.values(error.response.data.data).join(", ") 
        : (error.response?.data?.message || "Đăng ký thất bại.");
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("fullName");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
