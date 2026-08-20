import CryptoJS from 'crypto-js';
import { useCallback, useMemo, useState } from 'react';
import { logout as logoutAPI } from '../api/auth';
import {
  canAccessPermission,
  isAdminUser,
  normalizePermissions,
} from '../utils/permissions';
import { AuthContext } from './AuthContextCore';

const ENCRYPTION_KEY = import.meta.env.VITE_USER_ENCRYPTION_KEY?.trim();

const readStoredUser = () => {
  try {
    const encryptedUser = localStorage.getItem('user');
    if (!encryptedUser || !ENCRYPTION_KEY) return null;

    const bytes = CryptoJS.AES.decrypt(encryptedUser, ENCRYPTION_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) return null;

    const user = JSON.parse(decryptedText);
    return {
      ...user,
      permissions: normalizePermissions(user.permissions),
    };
  } catch {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(() => readStoredUser());
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));

  const setUser = useCallback((nextUser) => {
    setUserState(
      nextUser
        ? { ...nextUser, permissions: normalizePermissions(nextUser.permissions) }
        : null
    );
    setToken(localStorage.getItem('authToken'));
  }, []);

  const refreshUser = useCallback(() => {
    const storedUser = readStoredUser();
    setUserState(storedUser);
    setToken(localStorage.getItem('authToken'));
    return storedUser;
  }, []);

  const logout = useCallback(() => {
    logoutAPI();
    setUserState(null);
    setToken(null);
  }, []);

  /**
   * hasPermission(module, access?, subModule?)
   *
   * Examples:
   *   hasPermission('product')                  → view check, no sub_module
   *   hasPermission('order', 'view', 'system')  → sub_module-aware check
   *   hasPermission('order', 'update', 'bulk')
   */
  const hasPermission = useCallback(
    (module, access = 'view', subModule = null) =>
      canAccessPermission(user, module, access, subModule),
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isAdmin: isAdminUser(user),
      permissions: user?.permissions || [],
      employeeId: user?.employeeId || null,
      roleName: user?.roleName || null,
      setUser,
      refreshUser,
      logout,
      hasPermission,
    }),
    [hasPermission, logout, refreshUser, setUser, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};