// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Atau getDatabase untuk Realtime Database

// Your web app's Firebase configuration
// GANTI DENGAN KONFIGURASI PROYEK FIREBASE ANDA
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_AUTH_DOMAIN_HERE",
  projectId: "YOUR_PROJECT_ID_HERE",
  storageBucket: "YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "YOUR_APP_ID_HERE",
  // measurementId: "YOUR_MEASUREMENT_ID_HERE" // Jika Anda menggunakan Google Analytics
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app); // Untuk Cloud Firestore

// Jika Anda menggunakan Realtime Database, gunakan ini:
// import { getDatabase } from 'firebase/database';
// export const db = getDatabase(app);
