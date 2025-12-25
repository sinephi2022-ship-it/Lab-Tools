import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// NOTE: This is safe to ship to the client. Security is enforced by Firestore/Storage rules.
const firebaseConfig = {
  apiKey: "AIzaSyDcOJyJEpVsc-asPeYvqaKnZF0oa7J3xfI",
  authDomain: "labtool-5eb5e.firebaseapp.com",
  projectId: "labtool-5eb5e",
  storageBucket: "labtool-5eb5e.firebasestorage.app",
  messagingSenderId: "686046008242",
  appId: "1:686046008242:web:b5516ebf4eedea5afa4aab",
  measurementId: "G-86F1TSWE56",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
