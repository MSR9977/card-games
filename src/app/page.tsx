"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import UserPanel from "./components/UserPanel";
import { AnimatedCircularProgressBar } from "./components/AnimatedCircularProgressBar";

export default function Home() {
  const router = useRouter();
  const [isLoadingRoulette, setIsLoadingRoulette] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleRouletteClick = () => {
    if (isLoadingRoulette) return;
    setIsLoadingRoulette(true);
  };

  // يُستدعى بعد انتهاء اللفة الكاملة → ننتقل للروليت
  const handleSpinComplete = useCallback(() => {
    startTransition(() => {
      router.push("/roulette");
    });
  }, [router, startTransition]);

  return (
    <div className="casino-bg min-h-screen relative">
      {/* Felt pattern overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(255,255,255,0.012) 2px,rgba(255,255,255,0.012) 4px)",
        }}
      />

         <main className="relative z-10 flex flex-col">
          {/* ── HEADER ── */}
        <header
          className="text-center border-b-2 relative"
          style={{
            padding: "clamp(28px,6vw,60px) 20px clamp(20px,4vw,40px)",
            borderColor: "rgba(245,197,24,0.3)",
          }}
        >
          <div
            className="absolute bottom-[-1px] left-1/2 h-0.5 w-48"
            style={{
              transform: "translateX(-50%)",
              background: "linear-gradient(90deg,transparent,#f5c518,transparent)",
            }}
          />
          <div className="flex items-center justify-center gap-3 mb-2">
            <span
              className="text-3xl sm:text-4xl"
              style={{ letterSpacing: "4px" }}
            >
              ♠️♥️♣️♦️
            </span>
          </div>
          <h1
            className="font-playfair font-black text-yellow-400 animate-title-glow"
            style={{
              fontSize: "clamp(28px,8vw,58px)",
              letterSpacing: "2px",
              textShadow: "0 0 30px rgba(245,197,24,0.5),0 4px 20px rgba(0,0,0,0.8)",
            }}
          >
            CASINO GAMES PRO
          </h1>
          <p
            className="text-slate-500 uppercase mt-1"
            style={{ fontSize: "clamp(11px,2.5vw,16px)", letterSpacing: "3px" }}
          >
            منصة الألعاب الورقية الاحترافية
          </p>
        </header>

        <UserPanel />

        {/* ── STATS STRIP ── */}
        <div
          className="flex justify-center border-b"
          style={{
            gap: "clamp(8px,3vw,24px)",
            padding: "clamp(14px,3vw,24px) 20px",
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          {[
            { num: "4", lbl: "لعبة احترافية" },
            { num: "∞", lbl: "جولات لعب" },
            { num: "100%", lbl: "متعة بدون توقف" },
          ].map((s) => (
            <div
              key={s.lbl}
              className="flex flex-col items-center border rounded-2xl"
              style={{
                background: "rgba(245,197,24,0.07)",
                borderColor: "rgba(245,197,24,0.25)",
                padding: "clamp(8px,2vw,14px) clamp(14px,4vw,28px)",
              }}
            >
              <div
                className="font-playfair font-black text-yellow-400 leading-none"
                style={{ fontSize: "clamp(20px,6vw,36px)" }}
              >
                {s.num}
              </div>
              <div
                className="text-slate-500 mt-0.5 whitespace-nowrap"
                style={{ fontSize: "clamp(9px,2vw,12px)" }}
              >
                {s.lbl}
              </div>
            </div>
          ))}
        </div>

        {/* ── CHIPS DECORATION ── */}
        <div
          className="flex justify-center"
          style={{ gap: "clamp(6px,2vw,12px)", padding: "clamp(10px,3vw,20px) 20px" }}
        >
          {[
            { label: "$5", img: "/assets/5_chip.svg", delay: "0s" },
            { label: "$10", img: "/assets/10_chip.svg", delay: "-0.5s" },
            { label: "$25", img: "/assets/25_chip.svg", delay: "-1s" },
            { label: "$50", img: "/assets/50_chip.svg", delay: "-1.5s" },
            { label: "$100", img: "/assets/100_chip.svg", delay: "-2s" },
          ].map((c) => (
            <div
              key={c.label}
              className="animate-chip-float"
              style={{
                width: "clamp(28px,7vw,44px)",
                height: "clamp(28px,7vw,44px)",
                animationDelay: c.delay,
              }}
            >
              <Image
                src={c.img}
                alt={c.label}
                width={44}
                height={44}
                className="w-full h-full object-contain"
              />
            </div>
          ))}
        </div>

        {/* ── GAMES GRID ── */}
        <div
          className="grid gap-10 mx-auto"
          style={{
            gridTemplateColumns: "repeat(4,minmax(160px,1fr))",
            maxWidth: "2000px",
            margin: "clamp(2px,25vw,28px) auto",
            padding: "0 clamp(8px,2.5vw,18px)",
          }}
        >
          <GameCard
            href="/high-card"
            icon="🎯"
            title="High Card"
            desc="تنافس لاعبان — من يملك أعلى ورقة يأخذ الرهان!"
            iconDelay="0s"
            features={[
              "بطاقات حقيقية من أصل 52 ورقة",
              "نظام رهانات بالفيش الملوّن",
              "فيش دائري بتصميم كازينو",
              "تأثيرات وانيميشن احترافية",
              "بدون تمرير — ملاءم للموبايل",
            ]}
            btnLabel="🎮 العب الآن"
          />
          <GameCard
            href="/blackjack"
            icon="🎰"
            title="Black Jack PRO"
            desc="بلاك جاك احترافي — فيش، رهانات، وطاولة كازينو حقيقية!"
            iconDelay="-2s"
            features={[
              "بطاقات حقيقية بخلفية بيضاء واضحة",
              "فيش دائري بألوان الكازينو",
              "ميزة Hit، Stand، Double Down",
              "انيميشن ربح وخسارة احترافي",
              "شاشة كاملة بدون سكرول",
            ]}
            btnLabel="💰 العب الآن"
          />
          <GameCard
            href="/baccarat-royal"
            icon="👑"
            title="Baccarat Royal"
            desc="باكارات ملكي — اختر بين Player أو Banker أو Tie!"
            iconDelay="-1s"
            features={[
              "بطاقات حقيقية من أصل 4 رزم",
              "ثلاث خيارات رهان (Player, Banker, Tie)",
              "قواعد الورقة الثالثة الاحترافية",
              "نظام تتبع النتائج التاريخية",
              "واجهة ملكية بتصميم احترافي",
            ]}
            btnLabel="👑 العب الآن"
          />
          <GameCard
            href="/roulette"
            icon="🎡"
            title="Roulette PRO"
            desc="لعبة روليت احترافية — طاولة رهان تفاعلية وعجلة دوارة حقيقية!"
            iconDelay="-1.5s"
            features={[
              "عجلة روليت أوروبية تفاعلية",
              "نظام رهان كامل بالفيش الملوّن",
              "انيميشن دوران العجلة بالكامل",
              "تتبع تاريخ الأرقام الفائزة الأخيرة",
              "واجهة مستخدم متجاوبة تماماً",
            ]}
            btnLabel="🎡 العب الآن"
            onClick={handleRouletteClick}
            disabled={isLoadingRoulette || isPending}
          />
        </div>
      </main>

      {/* ── LOADING OVERLAY ── */}
      {(isLoadingRoulette || isPending) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-6"
          style={{ backdropFilter: "blur(10px)" }}
        >
          <div className="flex flex-col items-center gap-6 text-center text-white">
            <AnimatedCircularProgressBar
              gaugePrimaryColor="#f5c518"
              gaugeSecondaryColor="#1e293b"
              gifSrc="/wheel.gif"
              gifAlt="تحميل الروليت"
              size={320}
              duration={10000}
              onComplete={handleSpinComplete}
            />
            <p
              className="text-slate-300"
              style={{ fontSize: "clamp(15px,3vw,20px)", maxWidth: 360 }}
            >
              جاري تحميل لعبة الروليت…
            </p>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer
        className="text-center border-t"
        style={{
          padding: "clamp(16px,4vw,28px) 20px",
          borderColor: "rgba(255,255,255,0.06)",
          color: "#334155",
          fontSize: "clamp(10px,2.2vw,13px)",
        }}
      >
        تم تطويره بعناية | جميع الحقوق محفوظة © 2026 |{" "}
        <span className="text-yellow-400">Casino Games Pro</span>
      </footer>
    </div>
  );
}

function GameCard({
  href,
  icon,
  title,
  desc,
  features,
  btnLabel,
  iconDelay,
  onClick,
  disabled,
}: {
  href: string;
  icon: string;
  title: string;
  desc: string;
  features: string[];
  btnLabel: string;
  iconDelay: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const content = (
    <>
      <div
        className="absolute top-0 left-0 right-0 h-0.5 opacity-0 hover:opacity-100"
        style={{ background: "linear-gradient(90deg,transparent,#f5c518,transparent)" }}
      />
      <span
        className="block animate-float-icon mb-2"
        style={{ fontSize: "clamp(32px,10vw,52px)", animationDelay: iconDelay }}
      >
        {icon}
      </span>
      <div
        className="font-playfair font-black mb-2"
        style={{ fontSize: "clamp(18px,5vw,28px)" }}
      >
        {title}
      </div>
      <div
        className="text-slate-400 mb-4"
        style={{ fontSize: "clamp(11px,2.5vw,13px)", lineHeight: 1.6 }}
      >
        {desc}
      </div>
      <ul
        className="text-right rounded-xl mb-4"
        style={{
          background: "rgba(0,0,0,0.3)",
          padding: "clamp(8px,2vw,12px) clamp(10px,2.5vw,16px)",
          borderRight: "3px solid #f5c518",
          listStyle: "none",
        }}
      >
        {features.map((f) => (
          <li
            key={f}
            className="text-slate-400 py-0.5 flex items-center gap-2"
            style={{ fontSize: "clamp(10px,2.2vw,12px)" }}
          >
            <span className="text-green-400 font-black text-sm flex-shrink-0">✓</span>
            {f}
          </li>
        ))}
      </ul>
      <div
        className="inline-block font-black rounded-full"
        style={{
          background: "linear-gradient(135deg,#f5c518,#d4a017)",
          color: "#000",
          fontSize: "clamp(11px,2.5vw,14px)",
          padding: "clamp(8px,2vw,12px) clamp(18px,4vw,32px)",
          letterSpacing: "1px",
          boxShadow: "0 4px 20px rgba(245,197,24,0.35)",
        }}
      >
        {btnLabel}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="game-card-link block text-white no-underline rounded-2xl text-center cursor-pointer relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg,#0f1f0f,#0a1510)",
          border: "1.5px solid rgba(255,255,255,0.08)",
          padding: "clamp(10px,2.5vw,16px) clamp(10px,3vw,18px)",
          transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1),border-color 0.3s,box-shadow 0.3s",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            const el = e.currentTarget;
            el.style.transform = "translateY(-10px) scale(1.02)";
            el.style.borderColor = "rgba(245,197,24,0.6)";
            el.style.boxShadow = "0 20px 50px rgba(0,0,0,0.7),0 0 30px rgba(245,197,24,0.15)";
          }
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.transform = "";
          el.style.borderColor = "rgba(255,255,255,0.08)";
          el.style.boxShadow = "";
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className="game-card-link block text-white no-underline rounded-2xl text-center cursor-pointer relative overflow-hidden"
      style={{
        background: "linear-gradient(145deg,#0f1f0f,#0a1510)",
        border: "1.5px solid rgba(255,255,255,0.08)",
        padding: "clamp(10px,2.5vw,16px) clamp(10px,3vw,18px)",
        transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1),border-color 0.3s,box-shadow 0.3s",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(-10px) scale(1.02)";
        el.style.borderColor = "rgba(245,197,24,0.6)";
        el.style.boxShadow = "0 20px 50px rgba(0,0,0,0.7),0 0 30px rgba(245,197,24,0.15)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = "";
        el.style.borderColor = "rgba(255,255,255,0.08)";
        el.style.boxShadow = "";
      }}
    >
      {content}
    </Link>
  );
}
