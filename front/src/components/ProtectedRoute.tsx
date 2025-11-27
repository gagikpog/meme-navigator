import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface IProtectedRoute {
  children: React.ReactElement;
  requireAdmin?: boolean;
  requireCreateMeme?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false, requireCreateMeme = false }: IProtectedRoute) => {
  const { user, loading, canCreateMeme, isAdmin } = useAuth();

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireCreateMeme && !canCreateMeme()) {
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
