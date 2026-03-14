import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type Auth, type User } from 'firebase/auth'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAATeJh8V3yUTe-H6sKJ0aq6uwzXw8ttlY",
  authDomain: "jarvis-ai-c5aa3.firebaseapp.com",
  projectId: "jarvis-ai-c5aa3",
  storageBucket: "jarvis-ai-c5aa3.appspot.com",
  messagingSenderId: "910988984009",
  appId: "1:910988984009:web:195d3890348731c40c9718",
  measurementId: "G-FX5Y0HLFJL"
};

// Initialize Firebase only once
let app: FirebaseApp
let auth: Auth

if (!getApps().length) {
  app = initializeApp(firebaseConfig)
  console.log('Firebase initialized')
} else {
  app = getApps()[0]
  console.log('Firebase app already exists')
}

auth = getAuth(app)
console.log('Firebase Auth ready')

const googleProvider = new GoogleAuthProvider()

export { app, auth, googleProvider }

// Auth functions
export async function signInWithGoogle(): Promise<User | null> {
  try {
    console.log('Starting Google sign-in...')
    const result = await signInWithPopup(auth, googleProvider)
    console.log('Sign-in successful:', result.user)
    return result.user
  } catch (error: any) {
    console.error('Error signing in with Google:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    return null
  }
}

export async function logOut(): Promise<void> {
  try {
    await signOut(auth)
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken()
}

export async function getIdTokenResult() {
  const user = auth.currentUser
  if (!user) return null
  return user.getIdTokenResult()
}
