import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lock to prevent duplicate OTP verification calls
  const verifyOTPLock = useRef(false);

  // Initialize auth state from refresh token on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setAccessToken(data.accessToken);
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error('Auth initialization failed:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Request OTP for login
  const requestOTP = useCallback(async (employeeId) => {
    setError(null);
    try {
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to send OTP');
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Verify OTP and complete login
  const verifyOTP = useCallback(async (employeeId, otpCode) => {
    // Prevent duplicate calls - this is the ultimate guard
    if (verifyOTPLock.current) {
      console.log('[AuthContext] verifyOTP blocked - already in progress');
      return { blocked: true };
    }
    verifyOTPLock.current = true;

    setError(null);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ employee_id: employeeId, otp_code: otpCode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Invalid OTP');
      }

      setAccessToken(data.accessToken);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      // Reset lock on both success and error to allow retry
      verifyOTPLock.current = false;
    }
  }, []);

  // Refresh access token
  const refreshAccessToken = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('Token refresh failed');
      }

      setAccessToken(data.accessToken);
      setUser(data.user);
      return data.accessToken;
    } catch (err) {
      // Refresh failed - clear auth state
      setAccessToken(null);
      setUser(null);
      throw err;
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      if (accessToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          credentials: 'include'
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setAccessToken(null);
      setUser(null);
      verifyOTPLock.current = false; // Reset lock so user can log in again
    }
  }, [accessToken]);

  // Logout from all devices
  const logoutAll = useCallback(async () => {
    try {
      if (accessToken) {
        await fetch('/api/auth/logout-all', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          credentials: 'include'
        });
      }
    } catch (err) {
      console.error('Logout all error:', err);
    } finally {
      setAccessToken(null);
      setUser(null);
      verifyOTPLock.current = false; // Reset lock so user can log in again
    }
  }, [accessToken]);

  // Authenticated fetch helper with automatic token refresh
  const authFetch = useCallback(async (url, options = {}) => {
    let token = accessToken;

    // If no token, try to refresh first
    if (!token) {
      try {
        token = await refreshAccessToken();
      } catch {
        throw new Error('Authentication required');
      }
    }

    // Make the request
    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });

    // If 401, try to refresh token and retry once
    if (response.status === 401) {
      try {
        token = await refreshAccessToken();
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });
      } catch {
        throw new Error('Session expired');
      }
    }

    return response;
  }, [accessToken, refreshAccessToken]);

  // Check if user has required role(s)
  const hasRole = useCallback((roles) => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  }, [user]);

  // Check specific roles
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff' || user?.role === 'admin';
  const isViewer = user?.role === 'viewer' || isStaff;

  const value = {
    user,
    accessToken,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin,
    isStaff,
    isViewer,
    requestOTP,
    verifyOTP,
    logout,
    logoutAll,
    authFetch,
    hasRole,
    refreshAccessToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
