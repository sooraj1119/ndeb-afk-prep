import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBlFgf1yhOz5_3UIBi2FpUYf0a13hlUuaM",
  authDomain: "ndeb-afk-prep.firebaseapp.com",
  projectId: "ndeb-afk-prep",
  storageBucket: "ndeb-afk-prep.firebasestorage.app",
  messagingSenderId: "872651575265",
  appId: "1:872651575265:web:7371cc935cb780ecf58ca0",
  measurementId: "G-GH0TK73HC1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
