import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAIB2wYV4ztfge3jrVizQ3QZh0l4jeR_gI",
  authDomain: "diseno-ui-ux.firebaseapp.com",
  projectId: "diseno-ui-ux",
  storageBucket: "diseno-ui-ux.firebasestorage.app",
  messagingSenderId: "129353710035",
  appId: "1:129353710035:web:868a3653712fe402a65726",
  measurementId: "G-MF8NGJ6CVN"
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)

// Analytics solo si está soportado en el entorno
isSupported().then((supported) => {
  if (supported) {
    getAnalytics(app)
  }
}).catch(() => {})


