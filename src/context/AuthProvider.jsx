import React from 'react';
import { auth } from '../firebaseConfig';
import { getUserProfile } from '../services/users';
import { setCurrentUser } from '../utils/store';

const AuthContext = React.createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (u) {
        // Inform the store about the current user as early as possible so listeners
        // subscribe with the correct ownerId and don't show other users' data.
        setCurrentUser(u.uid);
        // try to load profile
        const profile = await getUserProfile(u.uid);
        setUser({ uid: u.uid, email: u.email, ...(profile || {}) });
      } else {
        // clear store listeners first
        setCurrentUser(null);
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const value = React.useMemo(() => ({ user, loading }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
