"use client";

import Image from "next/image";
import Link from "next/link";
import { useFirebaseUser } from "./FirebaseProvider";

export default function UserPanel() {
  const { user, loading, loginWithGoogle, logout, adjustBalance } = useFirebaseUser();

  return (
    <section
      className="user-panel"
      style={{
        width: "100%",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "18px 20px",
        marginBottom: "16px",
        background: "rgba(15, 20, 28, 0.9)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            overflow: "hidden",
            border: "2px solid rgba(124,229,204,0.7)",
            background: "#111319",
            flexShrink: 0,
          }}
        >
          {user?.photoURL ? (
            <Image
              src={user.photoURL}
              alt={user.displayName}
              width={56}
              height={56}
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
              }}
            >
              ؟
            </div>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              minWidth: 0,
            }}
          >
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 800,
                color: "#ffffff",
                whiteSpace: "nowrap",
              }}
            >
              {user ? `أهلاً ${user.displayName}` : "مرحباً بك في الكازينو"}
            </h2>
            {user?.isAdmin ? (
              <span
                style={{
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: "rgba(124,229,204,0.14)",
                  color: "#7ce5cc",
                  fontSize: "0.85rem",
                }}
              >
                ADMIN
              </span>
            ) : null}
          </div>
          <div style={{ color: "#a8b1c2", fontSize: "0.85rem", marginTop: 3 }}>
            {user
              ? `عضو منذ ${new Date(user.memberSince).toLocaleDateString("ar-EG")} · آخر دخول ${new Date(
                  user.lastLogin,
                ).toLocaleString("ar-EG")} · ${user.online ? "أونلاين" : "أوفلاين"}`
              : "سجّل دخول بحساب Google لتخزين الرصيد والعضوية"}
          </div>
          {user ? (
            <div style={{ color: "#cbd5e1", fontSize: "0.82rem", marginTop: 6 }}>
              الرقم التسلسلي: <span style={{ color: "#7ce5cc" }}>{user.serial}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        {user ? (
          <>
            <div
              style={{
                minWidth: 170,
                padding: "10px 14px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>رصيد الكارد قيمز</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                <span style={{ fontWeight: 700, color: "#f8fafc" }}>${user.balances.cards.toLocaleString()}</span>
                {user.isAdmin ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => adjustBalance("cards", 100)}
                      style={buttonStyle}
                    >
                      +
                    </button>
                    <button
                      onClick={() => adjustBalance("cards", -100)}
                      style={buttonStyle}
                    >
                      -
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            <div
              style={{
                minWidth: 170,
                padding: "10px 14px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>رصيد الروليت</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                <span style={{ fontWeight: 700, color: "#f8fafc" }}>${user.balances.roulette.toLocaleString()}</span>
                {user.isAdmin ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => adjustBalance("roulette", 100)}
                      style={buttonStyle}
                    >
                      +
                    </button>
                    <button
                      onClick={() => adjustBalance("roulette", -100)}
                      style={buttonStyle}
                    >
                      -
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <button
            onClick={loginWithGoogle}
            style={{
              padding: "12px 18px",
              borderRadius: 14,
              border: "1px solid rgba(124,229,204,0.45)",
              background: "rgba(124,229,204,0.12)",
              color: "#e2e8f0",
              fontWeight: 700,
              cursor: "pointer",
              minWidth: 190,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Image
              src="/google-login-dark.svg"
              alt="Google login"
              width={24}
              height={24}
              style={{ display: "block" }}
            />
            تسجيل الدخول باستخدام Google
          </button>
        )}

        {user ? (
          <>
            <Link
              href="/"
              style={{
                padding: "12px 18px",
                borderRadius: 14,
                border: "1px solid rgba(56,189,248,0.45)",
                background: "rgba(56,189,248,0.12)",
                color: "#dbeafe",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              الرئيسية
            </Link>
            <Link
              href="/user"
              style={{
                padding: "12px 18px",
                borderRadius: 14,
                border: "1px solid rgba(96,165,250,0.45)",
                background: "rgba(96,165,250,0.12)",
                color: "#dbeafe",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              صفحة المستخدم
            </Link>
            <button
              onClick={logout}
              style={{
                padding: "12px 18px",
                borderRadius: 14,
                border: "1px solid rgba(248, 113, 113, 0.35)",
                background: "rgba(248, 113, 113, 0.12)",
                color: "#fee2e2",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              تسجيل الخروج
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}

const buttonStyle = {
  width: 30,
  height: 30,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.06)",
  color: "#ffffff",
  fontWeight: 700,
  cursor: "pointer",
};
