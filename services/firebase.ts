import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6XwGDntMEpwBpViKpskAOMi0V9sM2t7Q",
  authDomain: "mindguard-c94e9.firebaseapp.com",
  projectId: "mindguard-c94e9",
  storageBucket: "mindguard-c94e9.firebasestorage.app",
  messagingSenderId: "70315253374",
  appId: "1:70315253374:web:dd14e2b441777bb56f422f"
};

// Initialize Firebase directly
let app;
let authInstance;
let dbInstance;

try {
  app = initializeApp(firebaseConfig);
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase Initialization Error:", error);
}

export const auth = authInstance;
export const db = dbInstance;