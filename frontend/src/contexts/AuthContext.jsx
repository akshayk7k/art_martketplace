import { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const auth = getAuth();

  const signup = async (email, password, username) => {
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with username
      await updateProfile(user, {
        displayName: username
      });

      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        username: username,
        createdAt: serverTimestamp(),
        isAdmin: email === 'tarakakaking@gmail.com', // Make this email an admin
        lastLogin: serverTimestamp()
      });

      // Set the current user with admin status
      const isAdmin = email === 'tarakakaking@gmail.com';
      setCurrentUser({ ...user, isAdmin });

      return user;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const isAdmin = userData?.isAdmin || false;

      // Update last login time
      await setDoc(doc(db, 'users', user.uid), {
        lastLogin: serverTimestamp()
      }, { merge: true });

      // Set the current user with admin status
      setCurrentUser({ ...user, isAdmin });

      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Check if user is admin
  const checkAdminStatus = async (user) => {
    if (!user) return false;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      return userDoc.exists() ? userDoc.data().isAdmin : false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  // Add refreshUser function
  const refreshUser = async () => {
    if (auth.currentUser) {
      const isAdmin = await checkAdminStatus(auth.currentUser);
      setCurrentUser({ ...auth.currentUser, isAdmin });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const isAdmin = await checkAdminStatus(user);
        setCurrentUser({ ...user, isAdmin });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [auth]);

  const value = {
    currentUser,
    isAdmin: currentUser?.isAdmin || false,
    isAuthenticated: !!currentUser,
    login,
    signup,
    logout,
    error,
    setError,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 