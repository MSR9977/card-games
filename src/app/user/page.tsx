"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useFirebaseUser } from "../components/FirebaseProvider";

export default function UserProfilePage() {
  const {
    user,
    loading,
    loginWithGoogle,
    logout,
    updateProfilePhoto,
    deleteAccount,
    adjustBalance,
  } = useFirebaseUser();
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);

  const handlePhotoUpdate = async () => {
    if (!photoUrl.trim() || !user) return;
    try {
      await updateProfilePhoto(photoUrl.trim());
      setPhotoMessage("تم تحديث الصورة بنجاح");
      setPhotoUrl("");
    } catch (error) {
      console.error(error);
      setPhotoMessage("حدث خطأ أثناء تحديث الصورة. حاول مرة أخرى.");
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    const confirmed = window.confirm("هل أنت متأكد أنك تريد حذف حسابك نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.");
    if (!confirmed) return;

    try {
      await deleteAccount();
      alert("تم حذف الحساب بنجاح.");
    } catch (error) {
      console.error(error);
      alert("فشل حذف الحساب. تأكد من تسجيل الدخول مؤخراً وحاول مرة أخرى.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6" style={{ minHeight: "100vh", background: "#0f172a", color: "#f8fafc" }}>
        <div className="text-center max-w-md">
          <p className="text-xl font-bold">جاري تحميل بيانات المستخدم...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 gap-6" style={{ minHeight: "100vh", background: "#0b1220", color: "#edf2f7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px", padding: "24px" }}>
        <div className="text-center max-w-xl">
          <h1 className="text-3xl font-extrabold mb-3">صفحة المستخدم</h1>
          <p className="text-slate-400">سجّل الدخول أولاً حتى تتمكن من عرض حسابك، تعديل الصورة، أو حذف الحساب.</p>
        </div>
        <button
          onClick={loginWithGoogle}
          className="inline-flex items-center gap-3 rounded-2xl border border-cyan-400/50 bg-cyan-500/10 px-6 py-3 text-white font-semibold"
        >
          <Image src="/google-login-dark.svg" alt="Google login" width={24} height={24} />
          تسجيل الدخول بـ Google
        </button>
        <Link href="/" className="text-cyan-300 underline">العودة للصفحة الرئيسية</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020b10] text-slate-100 p-6 flex flex-col gap-6" style={{ minHeight: "100vh", background: "#020b10", color: "#e2e8f0", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="flex flex-col gap-4 max-w-6xl mx-auto w-full">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1200px", width: "100%", margin: "0 auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(100, 116, 139, 0.3)", borderRadius: "28px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "96px", height: "96px", borderRadius: "100%", overflow: "hidden", border: "2px solid rgba(56, 189, 248, 0.5)", background: "#07121f" }}>
                <Image src={user.photoURL} alt={user.displayName} width={96} height={96} className="object-cover" />
              </div>
              <div>
                <p style={{ color: "#94a3b8", marginBottom: "8px" }}>مرحباً بك،</p>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>{user.displayName}</h1>
                <p style={{ color: "#94a3b8", marginTop: "8px" }}>{user.email}</p>
              </div>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-600 bg-slate-800/80 px-5 py-3 text-sm font-semibold text-cyan-200 hover:bg-slate-700"
              style={{ alignSelf: "flex-start", textDecoration: "none", padding: "12px 18px", borderRadius: "16px", border: "1px solid rgba(148, 163, 184, 0.3)", background: "rgba(30, 41, 59, 0.9)", color: "#bae6fd", fontWeight: 600 }}
            >
              العودة للصفحة الرئيسية
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-900/80 border border-slate-700 rounded-[28px] p-5">
          <div className="flex items-center gap-4">
            <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-cyan-400/50 bg-slate-800">
              <Image src={user.photoURL} alt={user.displayName} width={96} height={96} className="object-cover" />
            </div>
            <div>
              <p className="text-slate-300">مرحباً بك،</p>
              <h1 className="text-3xl font-black">{user.displayName}</h1>
              <p className="text-sm text-slate-500 mt-1">{user.email}</p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-600 bg-slate-800/80 px-5 py-3 text-sm font-semibold text-cyan-200 hover:bg-slate-700"
          >
            العودة للصفحة الرئيسية
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-[28px] border border-slate-700 bg-slate-900/90 p-5" style={{ borderRadius: "28px", border: "1px solid rgba(71, 85, 105, 0.45)", background: "rgba(15, 23, 42, 0.92)", padding: "20px" }}>
            <h2 className="text-xl font-bold text-cyan-200 mb-3">رصيد الألعاب</h2>
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-4 flex items-center justify-between gap-3">
                <div style={{ borderRadius: "24px", border: "1px solid rgba(71, 85, 105, 0.35)", background: "rgba(15, 23, 42, 0.85)", padding: "18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", width: "100%" }}>
                  <div>
                    <p className="text-sm text-slate-400">رصيد روليت</p>
                    <p className="text-2xl font-black text-white">${user.balances.roulette.toLocaleString()}</p>
                  </div>
                  {user.isAdmin && (
                    <div className="flex gap-2">
                      <button onClick={() => adjustBalance("roulette", 100)} className="rounded-2xl bg-cyan-500 px-3 py-2 text-sm font-semibold">+</button>
                      <button onClick={() => adjustBalance("roulette", -100)} className="rounded-2xl bg-slate-700 px-3 py-2 text-sm font-semibold">-</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-4 flex items-center justify-between gap-3">
                <div style={{ borderRadius: "24px", border: "1px solid rgba(71, 85, 105, 0.35)", background: "rgba(15, 23, 42, 0.85)", padding: "18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", width: "100%" }}>
                  <div>
                    <p className="text-sm text-slate-400">رصيد كارد قيمز</p>
                    <p className="text-2xl font-black text-white">${user.balances.cards.toLocaleString()}</p>
                  </div>
                  {user.isAdmin && (
                    <div className="flex gap-2">
                      <button onClick={() => adjustBalance("cards", 100)} className="rounded-2xl bg-cyan-500 px-3 py-2 text-sm font-semibold">+</button>
                      <button onClick={() => adjustBalance("cards", -100)} className="rounded-2xl bg-slate-700 px-3 py-2 text-sm font-semibold">-</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-700 bg-slate-900/90 p-5" style={{ borderRadius: "28px", border: "1px solid rgba(71, 85, 105, 0.45)", background: "rgba(15, 23, 42, 0.92)", padding: "20px" }}>
            <h2 className="text-xl font-bold text-cyan-200 mb-3">بيانات الحساب</h2>
            <div className="space-y-3 text-slate-300">
              <p>الرقم التسلسلي: <span className="text-white">{user.serial}</span></p>
              <p>عضو منذ: <span className="text-white">{new Date(user.memberSince).toLocaleDateString("ar-EG")}</span></p>
              <p>آخر دخول: <span className="text-white">{new Date(user.lastLogin).toLocaleString("ar-EG")}</span></p>
              <p>الحالة: <span className="text-cyan-300">{user.online ? "أونلاين" : "أوفلاين"}</span></p>
            </div>
          </section>
        </div>

        <section className="rounded-[28px] border border-slate-700 bg-slate-900/90 p-5" style={{ borderRadius: "28px", border: "1px solid rgba(71, 85, 105, 0.45)", background: "rgba(15, 23, 42, 0.92)", padding: "20px" }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-cyan-200">تعديل الصورة الشخصية</h2>
              <p className="text-slate-400">أدخل رابط صورة جديد ليتم حفظها في ملفك الشخصي.</p>
            </div>
            <button
              onClick={handlePhotoUpdate}
              className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950"
            >
              حفظ الصورة
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_160px]">
            <input
              value={photoUrl}
              onChange={(event) => setPhotoUrl(event.target.value)}
              placeholder="https://..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
            />
            <button
              onClick={() => setPhotoUrl("")}
              className="rounded-2xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm text-slate-200"
            >
              مسح
            </button>
          </div>
          {photoMessage ? (
            <p className="mt-3 text-sm text-cyan-200">{photoMessage}</p>
          ) : null}
        </section>

        <section className="rounded-[28px] border border-rose-500/20 bg-rose-500/5 p-5" style={{ borderRadius: "28px", border: "1px solid rgba(244, 63, 94, 0.2)", background: "rgba(251, 113, 133, 0.08)", padding: "20px" }}>
          <h2 className="text-xl font-bold text-rose-200 mb-3">حذف الحساب</h2>
          <p className="text-slate-400 mb-4">يمكنك حذف حسابك من Firebase. سيؤدي ذلك إلى إزالة بياناتك من القاعدة وحسابك من المصادقة.</p>
          <button
            onClick={handleDelete}
            className="rounded-2xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/20"
          >
            حذف الحساب نهائياً
          </button>
        </section>
      </div>
    </div>
  );
}
