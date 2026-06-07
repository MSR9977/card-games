"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  auth,
  database,
  provider,
} from "../../lib/firebase";
import {
  GoogleAuthProvider,
  deleteUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  get,
  onValue,
  ref,
  remove,
  set,
  update,
  onDisconnect,
} from "firebase/database";

const ADMIN_EMAIL = "mmalromaihi99@gmail.com";

type GameKey = "roulette" | "cards";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  serial: string;
  memberSince: string;
  lastLogin: string;
  online: boolean;
  isAdmin: boolean;
  balances: {
    roulette: number;
    cards: number;
  };
}

interface FirebaseContextValue {
  user: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateBalance: (game: GameKey, amount: number) => Promise<void>;
  adjustBalance: (game: GameKey, diff: number) => Promise<void>;
  updateProfilePhoto: (photoURL: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function useFirebaseUser(): FirebaseContextValue {
  const ctx = useContext(FirebaseContext);
  if (!ctx) throw new Error("useFirebaseUser must be used inside FirebaseProvider");
  return ctx;
}

function normalizeNumber(value: any, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let userRefUnsubscribe: (() => void) | null = null;
    const authUnsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (userRefUnsubscribe) {
        userRefUnsubscribe();
        userRefUnsubscribe = null;
      }

      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const uid = fbUser.uid;
      const userRef = ref(database, `users/${uid}`);
      const now = new Date().toISOString();
      const email = fbUser.email || "guest@casino.local";
      const displayName = fbUser.displayName || "لاعب";
      const photoURL = fbUser.photoURL || "/assets/default_profile.png";
      const serial = `CAS-${uid.slice(0, 8).toUpperCase()}`;
      const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      const snapshot = await get(userRef);
      const baseProfile: UserProfile = {
        uid,
        email,
        displayName,
        photoURL,
        serial,
        memberSince: now,
        lastLogin: now,
        online: true,
        isAdmin,
        balances: {
          roulette: 2000,
          cards: 2000,
        },
      };

      const persistedPhotoURL = snapshot.exists()
        ? snapshot.val().photoURL || photoURL
        : photoURL;

      const nextProfile: UserProfile = snapshot.exists()
        ? {
            ...snapshot.val(),
            email,
            displayName,
            photoURL: persistedPhotoURL,
            lastLogin: now,
            online: true,
            isAdmin,
            serial: snapshot.val().serial || serial,
            memberSince: snapshot.val().memberSince || now,
            balances: {
              roulette: normalizeNumber(snapshot.val()?.balances?.roulette, 2000),
              cards: normalizeNumber(snapshot.val()?.balances?.cards, 2000),
            },
          }
        : baseProfile;

      await set(userRef, nextProfile);
      const onlineRef = ref(database, `users/${uid}/online`);
      onDisconnect(onlineRef).set(false);

      userRefUnsubscribe = onValue(userRef, (snap) => {
        if (!snap.exists()) return;
        const value = snap.val();
        setUser({
          uid: value.uid,
          email: value.email,
          displayName: value.displayName,
          photoURL: value.photoURL,
          serial: value.serial,
          memberSince: value.memberSince,
          lastLogin: value.lastLogin,
          online: Boolean(value.online),
          isAdmin: Boolean(value.isAdmin),
          balances: {
            roulette: normalizeNumber(value.balances?.roulette, 2000),
            cards: normalizeNumber(value.balances?.cards, 2000),
          },
        });
        setLoading(false);
      });
    });

    return () => {
      authUnsubscribe();
      if (userRefUnsubscribe) userRefUnsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, provider as GoogleAuthProvider);
  };

  const logout = async () => {
    const fbUser = auth.currentUser;
    if (fbUser) {
      const userOnlineRef = ref(database, `users/${fbUser.uid}/online`);
      await update(userOnlineRef, false as any);
    }
    await firebaseSignOut(auth);
    setUser(null);
  };

  const updateBalance = async (game: GameKey, amount: number) => {
    if (!user) return;
    const gameKey = game === "roulette" ? "roulette" : "cards";
    const updateRef = ref(database, `users/${user.uid}/balances`);
    await update(updateRef, { [gameKey]: amount });
  };

  const adjustBalance = async (game: GameKey, diff: number) => {
    if (!user) return;
    const current = user.balances?.[game] ?? 0;
    await updateBalance(game, current + diff);
  };

  const updateProfilePhoto = async (photoURL: string) => {
    if (!user) return;
    const updateRef = ref(database, `users/${user.uid}`);
    await update(updateRef, { photoURL });
  };

  const deleteAccount = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const userRef = ref(database, `users/${currentUser.uid}`);

    try {
      await remove(userRef);
      await deleteUser(currentUser);
      setUser(null);
    } catch (error) {
      console.error("Failed to delete account:", error);
      throw error;
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      loginWithGoogle,
      logout,
      updateBalance,
      adjustBalance,
      updateProfilePhoto,
      deleteAccount,
    }),
    [user, loading],
  );

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
}
