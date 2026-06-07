import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCrEQKR5Tg8aY5La6QAn4wyFy8PEUFG40I",
  authDomain: "my-casino-bh.firebaseapp.com",
  databaseURL: "https://my-casino-bh-default-rtdb.firebaseio.com",
  projectId: "my-casino-bh",
  storageBucket: "my-casino-bh.firebasestorage.app",
  messagingSenderId: "443104159190",
  appId: "1:443104159190:web:7f9ee92db3333cb2423077",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const database = getDatabase(app);

export { app, auth, provider, database };