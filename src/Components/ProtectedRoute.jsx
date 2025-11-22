import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { auth } from '../firebaseConfig';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  // Wait for authentication state to initialize before rendering
  if (loading) return null;

  // Allow access if Firebase auth is in progress to prevent redirect race conditions
  // This handles the brief moment between Firebase sign-in and user profile loading
  if (!user) {
    if (auth && auth.currentUser) {
      return children;
    }
    return <Navigate to="/LogIn" replace />;
  }
  return children;
}
