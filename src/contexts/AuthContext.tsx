import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../services/firebase';

interface AuthState {
  readonly user: User | null;
  readonly loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { readonly children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState({ user, loading: false });
    });
    return unsubscribe;
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
};
