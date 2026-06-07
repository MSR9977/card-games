"use client";

import FirebaseProvider from "./FirebaseProvider";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return <FirebaseProvider>{children}</FirebaseProvider>;
}
