import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';

interface FirebaseConfig {
  apiKey: string | undefined;
  authDomain: string | undefined;
  projectId: string | undefined;
  storageBucket: string | undefined;
  messagingSenderId: string | undefined;
  appId: string | undefined;
  measurementId?: string | undefined;
}

const firebaseConfig: FirebaseConfig = {
  apiKey: process.env['REACT_APP_FIREBASE_API_KEY'],
  authDomain: process.env['REACT_APP_FIREBASE_AUTH_DOMAIN'],
  projectId: process.env['REACT_APP_FIREBASE_PROJECT_ID'],
  storageBucket: process.env['REACT_APP_FIREBASE_STORAGE_BUCKET'],
  messagingSenderId: process.env['REACT_APP_FIREBASE_MESSAGING_SENDER_ID'],
  appId: process.env['REACT_APP_FIREBASE_APP_ID'],
  measurementId: process.env['REACT_APP_FIREBASE_MEASUREMENT_ID'],
};

const app: FirebaseApp = initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app, 'places');
export const auth: Auth = getAuth(app);
export const googleProvider: GoogleAuthProvider = new GoogleAuthProvider();
export const facebookProvider: FacebookAuthProvider = new FacebookAuthProvider();
export const twitterProvider: TwitterAuthProvider = new TwitterAuthProvider();

void setPersistence(auth, browserLocalPersistence);

export default app;