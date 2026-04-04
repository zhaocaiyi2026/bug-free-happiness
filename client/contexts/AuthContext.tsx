import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_STORAGE_KEY = 'user';

interface User {
  id: number;
  phone: string;
  nickname: string;
  avatar: string | null;
  vip_level: number;
  vip_expire_at: string | null;
  points: number;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化时从本地存储加载用户信息
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userStr = await AsyncStorage.getItem(USER_STORAGE_KEY);
      console.log('[AuthContext] loadUser - userStr:', userStr ? 'found' : 'not found');
      if (userStr) {
        const userData = JSON.parse(userStr);
        console.log('[AuthContext] loadUser - userData:', userData.phone);
        setUser(userData);
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (userData: User) => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('保存用户信息失败:', error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('[AuthContext] logout - clearing user data');
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      console.log('[AuthContext] logout - user cleared');
    } catch (error) {
      console.error('清除用户信息失败:', error);
    }
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const newUser = { ...prev, ...userData };
      AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser)).catch(console.error);
      return newUser;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: user.phone }),
        }
      );
      const data = await res.json();
      
      if (data.success && data.data) {
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.data));
        setUser(data.data);
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error);
    }
  }, [user?.id, user?.phone]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
