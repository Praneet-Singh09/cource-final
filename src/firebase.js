import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyD75gnNQA3gd43xQHSVxmEbac6igqbdTpg",
  authDomain: "course-enrollment-app-4d950.firebaseapp.com",
  projectId: "course-enrollment-app-4d950",
  storageBucket: "course-enrollment-app-4d950.firebasestorage.app",
  messagingSenderId: "531025304316",
  appId: "1:531025304316:web:ea74c3eb279679c9d19579"
}

// ✅ FIX: prevent duplicate initialization
const app = getApps().length === 0 
  ? initializeApp(firebaseConfig) 
  : getApp()

export const auth = getAuth(app)
export const db = getFirestore(app)