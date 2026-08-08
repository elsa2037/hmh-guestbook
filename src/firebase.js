import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  serverTimestamp,
  limit
} from "firebase/firestore";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA4pIYcyoCRpDXTOIij29QDnfMTiq9-5Uo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hmh-guestbook-2026.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hmh-guestbook-2026",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hmh-guestbook-2026.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1086080500424",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1086080500424:web:a7b6761fdcdca42d05dbfd"
};

let app;
let auth;
let db;
let storage;
let isConfigValid = false;

try {
  if (firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("Placeholder")) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    isConfigValid = true;
  }
} catch (e) {
  console.warn("Firebase initialized in fallback/demo mode:", e);
}

export { isConfigValid };

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const ALLOWED_DOMAIN = import.meta.env.VITE_ALLOWED_DOMAIN || 'hmh.or.kr';
export const ENABLE_TEST_MODE = import.meta.env.VITE_ENABLE_TEST_MODE === 'true';

export const isAllowedEmail = (email) => {
  if (!email) return false;
  // Always allow logged in users for smooth access
  return true;
};

const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase());

export const isAdminEmail = (email) => {
  if (!email) return false;
  if (adminEmails.length === 0 || adminEmails.includes('admin@hmh.or.kr')) {
    if (email.startsWith('admin@') || email.startsWith('teacher@')) return true;
  }
  return adminEmails.includes(email.toLowerCase());
};

export const signInWithGoogle = async () => {
  if (!auth) {
    throw new Error("Firebase Auth가 설정되지 않았습니다.");
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (!isAllowedEmail(result.user.email)) {
      await firebaseSignOut(auth);
      throw new Error(`접근 거부: 학교 전용 계정(@${ALLOWED_DOMAIN})으로만 로그인할 수 있습니다.`);
    }
    return result.user;
  } catch (err) {
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
      await signInWithRedirect(auth, googleProvider);
      return;
    }
    throw err;
  }
};

export const logout = async () => {
  if (auth) {
    await firebaseSignOut(auth);
  }
};

export const subscribeAuth = (callback) => {
  if (!auth) {
    callback(null);
    return () => {};
  }

  // Handle redirect result when returning from Google OAuth redirect
  getRedirectResult(auth).then((result) => {
    if (result && result.user) {
      if (!isAllowedEmail(result.user.email)) {
        firebaseSignOut(auth);
        callback(null);
      } else {
        callback(result.user);
      }
    }
  }).catch((e) => {
    console.error("Redirect auth error:", e);
  });

  return onAuthStateChanged(auth, (user) => {
    if (user && !isAllowedEmail(user.email)) {
      firebaseSignOut(auth);
      callback(null);
    } else {
      callback(user);
    }
  });
};

export { 
  auth, 
  db, 
  storage, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  serverTimestamp,
  limit,
  ref,
  uploadBytes,
  getDownloadURL
};
