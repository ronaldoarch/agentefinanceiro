import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Configurar axios com token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Verificar token ao carregar
  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadUser() {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      logout(); // Token inválido, fazer logout
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      
      if (response.data.success) {
        const { token: newToken, user: newUser } = response.data;
        
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        return { success: true };
      }
      
      return { success: false, error: 'Login falhou' };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao fazer login'
      };
    }
  }

  async function register(email, password, name, taxId = null, phone = null) {
    try {
      const response = await axios.post('/api/auth/register', { 
        email, 
        password, 
        name,
        taxId,
        phone
      });
      
      if (response.data.success) {
        const { token: newToken, user: newUser } = response.data;
        
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        return { success: true };
      }
      
      return { success: false, error: 'Registro falhou' };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao registrar'
      };
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  }

  // Função para recarregar dados do usuário
  async function refreshUser() {
    try {
      const response = await axios.get('/api/auth/me');
      const userData = response.data.user;
      
      // Verificar se há atualização de plano pendente no localStorage
      const localPlan = localStorage.getItem('user_plan');
      const localPlanUpdated = localStorage.getItem('user_plan_updated_at');
      
      if (localPlan && localPlanUpdated) {
        const updatedAt = new Date(localPlanUpdated);
        const now = new Date();
        const diffMinutes = (now - updatedAt) / 1000 / 60;
        
        // Se foi atualizado há menos de 5 minutos e difere do banco
        if (diffMinutes < 5 && userData.plan !== localPlan) {
          console.log('🔄 Usando plano do localStorage (atualização recente):', localPlan);
          userData.plan = localPlan; // Override com localStorage
        }
      }
      
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Erro ao recarregar usuário:', error);
      
      // Fallback: usar dados do localStorage
      const localPlan = localStorage.getItem('user_plan');
      if (localPlan && user) {
        console.warn('⚠️ Usando plano do localStorage como fallback');
        const updatedUser = { ...user, plan: localPlan };
        setUser(updatedUser);
        return updatedUser;
      }
      
      return null;
    }
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

