import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithRedirect, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
  onAuthStateChanged, 
  sendPasswordResetEmail,
  updateProfile,
  getRedirectResult
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// Sign in with email and password
export const signInWithEmail = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Create user with email and password
export const createUser = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// Sign in with Google
export const signInWithGoogle = () => {
  return signInWithRedirect(auth, googleProvider);
};

// Sign in with GitHub
export const signInWithGitHub = () => {
  return signInWithRedirect(auth, githubProvider);
};

// Sign out
export const logOut = () => {
  return signOut(auth);
};

// Reset password
export const resetPassword = (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

// Update profile
export const updateUserProfile = (displayName: string, photoURL?: string) => {
  if (!auth.currentUser) return Promise.reject(new Error("No user is signed in."));
  return updateProfile(auth.currentUser, {
    displayName,
    photoURL
  });
};

// Handle redirect result
export const handleAuthRedirect = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    
    const user = result.user;
    const credential = result.providerId === 'google.com' 
      ? GoogleAuthProvider.credentialFromResult(result)
      : GithubAuthProvider.credentialFromResult(result);
      
    // Get provider-specific data
    const provider = result.providerId === 'google.com' ? 'google' : 'github';
    const providerId = user.uid;
    const { email, displayName } = user;
    
    if (!email) {
      throw new Error('Email is required but not provided by the authentication provider');
    }
    
    // Parse displayName into first/last name
    let firstName = null;
    let lastName = null;
    
    if (displayName) {
      const nameParts = displayName.split(' ');
      firstName = nameParts[0] || null;
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
    }
    
    // Send data to backend
    const response = await fetch(`/api/auth/${provider}-callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        firstName,
        lastName,
        providerId,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to authenticate with backend');
    }
    
    // Return user data from backend
    return await response.json();
  } catch (error) {
    console.error('Authentication redirect error:', error);
    throw error;
  }
};

// Export auth for use in components
export { auth, onAuthStateChanged, getRedirectResult };
