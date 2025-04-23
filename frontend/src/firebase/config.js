import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBiFmKgbHCZOkDlHSlAxsQ54XtADNa_eqk",
  authDomain: "photography-e9190.firebaseapp.com",
  projectId: "photography-e9190",
  storageBucket: "photography-e9190.firebasestorage.app",
  messagingSenderId: "963934805485",
  appId: "1:963934805485:web:ad83c6d6ddd669badb5be4",
  measurementId: "G-WLTX8W9VFV"
  };
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);



