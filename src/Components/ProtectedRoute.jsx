import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { auth } from '../firebaseConfig';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  // While the auth provider is determining state, don't render anything.
  if (loading) return null; // or a spinner

  // If context says no user, but Firebase's auth has a currentUser (sign-in in progress
  // or profile still loading), allow access to avoid a redirect race.
  if (!user) {
    if (auth && auth.currentUser) {
      return children;
    }
    return <Navigate to="/LogIn" replace />;
  }
  return children;
}
