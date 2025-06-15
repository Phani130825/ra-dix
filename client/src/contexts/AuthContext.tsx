import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  _id: string;
  name: string;
  email: string;
  userType: 'Doctor' | 'User';
  age?: string;
  weight?: string;
  height?: string;
  questions?: {
    medicalTerminology: string;
    patientCare: string;
    licensedPractitioner: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signup: (userData: {
    email: string;
    password: string;
    name: string;
    age: string;
    weight: string;
    height: string;
    questions: {
      medicalTerminology: string;
      patientCare: string;
      licensedPractitioner: string;
    };
    userType: 'Doctor' | 'User';
  }) => Promise<void>;
  signin: (email: string, password: string) => Promise<void>;
  signout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(response.data);
    } catch (err) {
      console.error('Auth status check failed:', err);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData: {
    email: string;
    password: string;
    name: string;
    age: string;
    weight: string;
    height: string;
    questions: {
      medicalTerminology: string;
      patientCare: string;
      licensedPractitioner: string;
    };
    userType: 'Doctor' | 'User';
  }) => {
    try {
      setError(null);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/signup`, userData);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to create account');
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    }
  };

  const signin = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/signin`, {
        email,
        password,
      });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to sign in');
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    }
  };

  const signout = async () => {
    try {
      setError(null);
      localStorage.removeItem('token');
      setUser(null);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to sign out');
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    signup,
    signin,
    signout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 