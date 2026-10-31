import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('saarthi_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('saarthi_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('saarthi_token')));
  const [isLoading, setIsLoading] = useState(true);

  // Validate active token on initial mount
  useEffect(() => {
    async function verifyAuth() {
      const savedToken = localStorage.getItem('saarthi_token');
      if (!savedToken) {
        setIsLoading(false);
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      try {
        const res = await api.get('/accounts/profile/');
        if (res?.data) {
          setUser(res.data);
          localStorage.setItem('saarthi_user', JSON.stringify(res.data));
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.warn('Stored token is invalid or expired. Resetting session.');
        localStorage.removeItem('saarthi_token');
        localStorage.removeItem('saarthi_user');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }

    verifyAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/accounts/login/', { email, password });
    if (res?.token && res?.user) {
      localStorage.setItem('saarthi_token', res.token);
      localStorage.setItem('saarthi_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      setIsAuthenticated(true);
      return res.user;
    }
    throw new Error('Authentication failed: Missing token or user profile in response.');
  };

  const signup = async (userData) => {
    const res = await api.post('/accounts/register/', userData);
    if (res?.token && res?.user) {
      localStorage.setItem('saarthi_token', res.token);
      localStorage.setItem('saarthi_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      setIsAuthenticated(true);
      return res.user;
    }
    throw new Error('Registration failed: Missing token or user profile in response.');
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/accounts/logout/');
      }
    } catch (err) {
      console.warn('Logout API notification failed, clearing local session anyway.', err);
    } finally {
      localStorage.removeItem('saarthi_token');
      localStorage.removeItem('saarthi_user');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateProfile = async (profileData) => {
    const res = await api.put('/accounts/profile/', profileData);
    if (res?.data) {
      setUser(res.data);
      localStorage.setItem('saarthi_user', JSON.stringify(res.data));
      return res.data;
    }
    return res;
  };

  const uploadProfilePicture = async (file) => {
    const formData = new FormData();
    formData.append('picture', file);
    formData.append('profile_picture', file);
    const res = await api.upload('/accounts/profile/picture/', formData);
    const userData = res?.data || res;
    if (userData) {
      setUser(userData);
      localStorage.setItem('saarthi_user', JSON.stringify(userData));
      return userData;
    }
    return res;
  };

  const removeProfilePicture = async () => {
    const res = await api.delete('/accounts/profile/picture/');
    const userData = res?.data || res;
    if (userData) {
      setUser(userData);
      localStorage.setItem('saarthi_user', JSON.stringify(userData));
      return userData;
    }
    return res;
  };

  const changePassword = async (passwordData) => {
    const res = await api.post('/accounts/change-password/', passwordData);
    if (res?.data?.token) {
      localStorage.setItem('saarthi_token', res.data.token);
      setToken(res.data.token);
    }
    return res;
  };

  const deleteAccount = async (accountData) => {
    const res = await api.post('/accounts/delete-account/', accountData);
    localStorage.removeItem('saarthi_token');
    localStorage.removeItem('saarthi_user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        uploadProfilePicture,
        removeProfilePicture,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export const useAuth = useAuthContext;
export default AuthContext;
