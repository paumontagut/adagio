import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'viewer' | 'analyst';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

interface AdminContextType {
  adminUser: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (requiredRole: 'admin' | 'viewer' | 'analyst') => boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const ROLE_HIERARCHY = {
  admin: 3,
  analyst: 2,
  viewer: 1
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const sessionToken = localStorage.getItem('admin_session_token');
      if (!sessionToken) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('validate_admin_session', {
        token: sessionToken
      });

      if (error || !data || data.length === 0) {
        localStorage.removeItem('admin_session_token');
        setAdminUser(null);
      } else {
        setAdminUser(data[0].admin_user);
      }
    } catch (error) {
      console.error('Error checking admin session:', error);
      localStorage.removeItem('admin_session_token');
      setAdminUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.rpc('validate_admin_login', {
        login_email: email,
        login_password: password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data && data.length > 0) {
        const sessionData = data[0];
        localStorage.setItem('admin_session_token', sessionData.session_token);
        setAdminUser(sessionData.admin_user);
        
        // Log activity
        await logActivity('admin_login', 'session', null, { email });
        
        toast({
          title: "Login exitoso",
          description: `Bienvenido, ${sessionData.admin_user.full_name}`,
        });
        
        return { success: true };
      } else {
        return { success: false, error: 'Credenciales incorrectas' };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Error de login' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (adminUser) {
        await logActivity('admin_logout', 'session', null, {});
      }
      localStorage.removeItem('admin_session_token');
      setAdminUser(null);
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const hasPermission = (requiredRole: 'admin' | 'viewer' | 'analyst'): boolean => {
    if (!adminUser || !adminUser.is_active) return false;
    return ROLE_HIERARCHY[adminUser.role] >= ROLE_HIERARCHY[requiredRole];
  };

  const logActivity = async (action: string, resourceType: string, resourceId: string | null, details: any) => {
    try {
      await supabase.from('admin_activity_log').insert({
        admin_user_id: adminUser?.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        ip_address: null, // Could be populated from a service
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const value: AdminContextType = {
    adminUser,
    isLoading,
    login,
    logout,
    hasPermission
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};