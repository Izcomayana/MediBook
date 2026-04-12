'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

// ── Types ──────────────────────────────────────────────────────────────────
type Role = 'patient' | 'admin' | null;

type AuthContextType = {
  user: User | null;
  role: Role;
  loading: boolean;
  logout: () => Promise<void>;
};

// ── Context ────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  logout: async () => {},
});

// ── Provider ───────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [role, setRole]       = useState<Role>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Fetch role from Firestore
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userRole: Role = snap.data()?.role === 'admin' ? 'admin' : 'patient';
          setRole(userRole);
        } catch {
          setRole('patient');
        }
      } else {
        setUser(null);
        setRole(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.push('/sign-in');
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);