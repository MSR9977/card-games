import type { Metadata } from "next";
import "./globals.css";
import AppProviders from "./components/AppProviders";

export const metadata: Metadata = {
  title: "🎰 Casino Games Pro",
  description: "منصة الألعاب الورقية الاحترافية - High Card, Blackjack, Baccarat Royal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <body className="h-full font-cairo">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
