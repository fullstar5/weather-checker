import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthed } from '../utils/authStorage';

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!isAuthed()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
