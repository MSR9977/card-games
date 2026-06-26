"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useFirebaseUser } from "./FirebaseProvider";

export default function UserPanel() {
  const { user, loading, loginWithGoogle, logout, adjustBalance } = useFirebaseUser();
  const [authBusy, setAuthBusy] = useState(false);

  const handleLogin = async () => {
    if (authBusy || loading) return;
    setAuthBusy(true);
    try {
      await loginWithGoogle();
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    if (authBusy || loading) return;
    setAuthBusy(true);
    try {
      await logout();
    } finally {
      setAuthBusy(false);
    }
  };

  return (
    <section
      className="user-panel"
      style={{
        width: "100%",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        padding: "8px 12px",
        margin: "0 auto 10px",
        background: "rgba(8, 12, 18, 0.82)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            overflow: "hidden",
            border: "1px solid rgba(124,229,204,0.55)",
            background: "#111319",
            flexShrink: 0,
          }}
        >
          {user?.photoURL ? (
            <Image
              src={user.photoURL}
              alt={user.displayName}
              width={36}
              height={36}
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "grid",
                placeItems: "center",
                color: "#7ce5cc",
                fontWeight: 700,
                fontSize: "0.9rem",
              }}
            >
              ؟
            </div>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <h2
            style={{
              maxWidth: "min(48vw, 260px)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: "0.9rem",
              lineHeight: 1.25,
              fontWeight: 800,
              color: "#ffffff",
            }}
          >
            {user ? user.displayName : "الدخول"}
          </h2>
          {user?.isAdmin ? (
            <span
              style={{
                display: "inline-flex",
                marginTop: 2,
                padding: "2px 6px",
                borderRadius: 999,
                background: "rgba(124,229,204,0.14)",
                color: "#7ce5cc",
                fontSize: "0.7rem",
                lineHeight: 1.2,
              }}
            >
              ADMIN
            </span>
          ) : null}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
        {user ? (
          <>
            <div style={balancePillStyle}>
              كارد: <span style={{ color: "#f8fafc" }}>${user.balances.cards.toLocaleString()}</span>
              {user.isAdmin ? (
                <span style={{ display: "inline-flex", gap: 4, marginInlineStart: 4 }}>
                  <button onClick={() => adjustBalance("cards", 100)} style={miniButtonStyle}>
                    +
                  </button>
                  <button onClick={() => adjustBalance("cards", -100)} style={miniButtonStyle}>
                    -
                  </button>
                </span>
              ) : null}
            </div>
            <div style={balancePillStyle}>
              روليت: <span style={{ color: "#f8fafc" }}>${user.balances.roulette.toLocaleString()}</span>
              {user.isAdmin ? (
                <span style={{ display: "inline-flex", gap: 4, marginInlineStart: 4 }}>
                  <button onClick={() => adjustBalance("roulette", 100)} style={miniButtonStyle}>
                    +
                  </button>
                  <button onClick={() => adjustBalance("roulette", -100)} style={miniButtonStyle}>
                    -
                  </button>
                </span>
              ) : null}
            </div>
          </>
        ) : (
          <button
            onClick={handleLogin}
            disabled={authBusy || loading}
            style={{
              ...navButtonStyle,
              border: "1px solid rgba(124,229,204,0.45)",
              background: "rgba(124,229,204,0.12)",
              color: "#e2e8f0",
              opacity: authBusy || loading ? 0.65 : 1,
            }}
          >
            <Image
              src="/google-login-dark.svg"
              alt="Google login"
              width={18}
              height={18}
              style={{ display: "block", flexShrink: 0 }}
            />
            دخول Google
          </button>
        )}

        {user ? (
          <>
            <Link href="/" style={navLinkStyle}>
              الرئيسية
            </Link>
            <Link
              href="/user"
              style={{
                ...navLinkStyle,
                border: "1px solid rgba(96,165,250,0.45)",
                background: "rgba(96,165,250,0.12)",
              }}
            >
              المستخدم
            </Link>
            <button
              onClick={handleLogout}
              disabled={authBusy || loading}
              style={{
                ...navButtonStyle,
                border: "1px solid rgba(248, 113, 113, 0.35)",
                background: "rgba(248, 113, 113, 0.12)",
                color: "#fee2e2",
                opacity: authBusy || loading ? 0.65 : 1,
              }}
            >
              خروج
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}

const balancePillStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  minHeight: 34,
  padding: "6px 10px",
  borderRadius: 9,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#94a3b8",
  fontSize: "0.78rem",
  fontWeight: 700,
};

const navButtonStyle = {
  minHeight: 34,
  padding: "6px 10px",
  borderRadius: 9,
  fontSize: "0.8rem",
  fontWeight: 800,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  whiteSpace: "nowrap" as const,
};

const navLinkStyle = {
  ...navButtonStyle,
  border: "1px solid rgba(56,189,248,0.45)",
  background: "rgba(56,189,248,0.12)",
  color: "#dbeafe",
  textDecoration: "none",
};

const miniButtonStyle = {
  width: 22,
  height: 22,
  borderRadius: 7,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.06)",
  color: "#ffffff",
  fontWeight: 800,
  cursor: "pointer",
  lineHeight: 1,
};
