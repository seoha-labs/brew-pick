import type { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginPage } from '../../pages/LoginPage';

export const AuthGuard = ({ children }: { readonly children: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
};
