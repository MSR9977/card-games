"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

/* ─── Card Data ─── */
const SUITS = ["spades", "hearts", "clubs", "diamonds"] as const;
const RANKS = [
  ["2", 2], ["3", 3], ["4", 4], ["5", 5], ["6", 6],
  ["7", 7], ["8", 8], ["9", 9], ["10", 10],
  ["jack", 11], ["queen", 12], ["king", 13], ["ace", 14],
] as const;
const DISPLAY: Record<string, string> = {
  "2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9","10":"10",
  jack:"Jack",queen:"Queen",king:"King",ace:"Ace",
};
const SUIT_EMOJI: Record<string, string> = {
  spades:"♠️",hearts:"♥️",clubs:"♣️",diamonds:"♦️",
};

type Card = { img: string; val: number; label: string };

function buildDeck(): Card[] {
  const deck: Card[] = [];
  SUITS.forEach((suit) =>
    RANKS.forEach(([rank, val]) => {
      deck.push({
        img: `/assets/${rank}_of_${suit}.png`,
        val: val as number,
        label: `${DISPLAY[rank]} ${SUIT_EMOJI[suit]}`,
      });
    })
  );
  return deck;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initDeck(): Card[] {
  return shuffle([...buildDeck(), ...buildDeck()]);
}

type ResultState = "idle" | "win1" | "win2" | "draw";

interface GameState {
  deck: Card[];
  score1: number;
  score2: number;
  rounds: number;
  bal1: number;
  bal2: number;
  currentBet: number;
  playing: boolean;
}

/* ─── Confetti ─── */
function spawnConfetti(primaryColor: string) {
  const colors = [primaryColor, "#f5c518", "#ffffff", "#4ade80", primaryColor];
  for (let i = 0; i < 30; i++) {
    const el = document.createElement("div");
    el.className = "confetti";
    el.style.cssText = `
      position:fixed;left:${Math.random()*100}vw;top:-10px;
      background:${colors[i%colors.length]};
      --dur:${0.8+Math.random()*1.4}s;
      animation:confettiFall var(--dur) linear forwards;
      animation-delay:${Math.random()*0.4}s;
      width:${5+Math.random()*9}px;height:${5+Math.random()*9}px;
      border-radius:2px;pointer-events:none;z-index:999;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }
}

const CHIPS = [
  { val: 5,   cls: "chip-5",   label: "$5",   img: "/assets/5_chip.svg" },
  { val: 10,  cls: "chip-10",  label: "$10",  img: "/assets/10_chip.svg" },
  { val: 25,  cls: "chip-25",  label: "$25",  img: "/assets/25_chip.svg" },
  { val: 50,  cls: "chip-50",  label: "$50",  img: "/assets/50_chip.svg" },
  { val: 100, cls: "chip-100", label: "$100", img: "/assets/100_chip.svg" },
];

export default function HighCard() {
  const [gs, setGs] = useState<GameState>({
    deck: initDeck(), score1: 0, score2: 0, rounds: 0,
    bal1: 500, bal2: 500, currentBet: 0, playing: false,
  });
  const [card1, setCard1] = useState<Card | null>(null);
  const [card2, setCard2] = useState<Card | null>(null);
  const [revealed1, setRevealed1] = useState(false);
  const [revealed2, setRevealed2] = useState(false);
  const [frame1Class, setFrame1Class] = useState("");
  const [frame2Class, setFrame2Class] = useState("");
  const [result, setResult] = useState<ResultState>("idle");
  const [resultMsg, setResultMsg] = useState("اضغط Draw Cards للعب!");
  const [placedChips, setPlacedChips] = useState<{ cls: string; val: number; id: number }[]>([]);
  const [selectedChip, setSelectedChip] = useState("chip-25");
  const [winOverlay, setWinOverlay] = useState<{ text: string; color: string } | null>(null);
  const chipId = useRef(0);

  const deal = useCallback((deck: Card[]): [Card, Card[]] => {
    let d = deck;
    if (d.length < 5) d = initDeck();
    return [d[d.length - 1], d.slice(0, -1)];
  }, []);

  const addBet = (val: number, cls: string) => {
    if (gs.playing) return;
    setSelectedChip(cls);
    const maxAdd = Math.min(val, gs.bal1, gs.bal2);
    if (maxAdd <= 0) return;
    setGs((g) => ({ ...g, currentBet: g.currentBet + maxAdd }));
    const id = chipId.current++;
    setPlacedChips((prev) => [...prev, { cls, val: maxAdd, id }]);
  };

  const clearBet = () => {
    if (gs.playing) return;
    setGs((g) => ({ ...g, currentBet: 0 }));
    setPlacedChips([]);
  };

  const drawCards = () => {
    if (gs.playing) return;
    setGs((g) => ({ ...g, playing: true }));
    setCard1(null); setCard2(null);
    setRevealed1(false); setRevealed2(false);
    setFrame1Class(""); setFrame2Class("");
    setResult("idle"); setResultMsg("...");

    let deck = gs.deck;
    let c1: Card, c2: Card;
    [c1, deck] = deal(deck);
    [c2, deck] = deal(deck);

    setTimeout(() => {
      setCard1(c1);
      setRevealed1(true);
    }, 300);

    setTimeout(() => {
      setCard2(c2);
      setRevealed2(true);

      setTimeout(() => {
        // Judge
        let newGs = { ...gs, deck, playing: false, rounds: gs.rounds + 1 };
        let msg = ""; let cls: ResultState = "idle"; let winColor = "#f5c518";

        if (c1.val > c2.val) {
          newGs.score1++; newGs.bal1 += gs.currentBet; newGs.bal2 -= gs.currentBet;
          setFrame1Class("winner"); setFrame2Class("loser");
          msg = "🎉 Player 1 Wins! 🎉"; cls = "win1"; winColor = "#60a5fa";
          setWinOverlay({ text: "🔵 WIN!", color: "#60a5fa" });
          spawnConfetti("#60a5fa");
        } else if (c2.val > c1.val) {
          newGs.score2++; newGs.bal2 += gs.currentBet; newGs.bal1 -= gs.currentBet;
          setFrame1Class("loser"); setFrame2Class("winner");
          msg = "🎉 Player 2 Wins! 🎉"; cls = "win2"; winColor = "#f87171";
          setWinOverlay({ text: "🔴 WIN!", color: "#f87171" });
          spawnConfetti("#f87171");
        } else {
          msg = "🤝 تعادل! 🤝"; cls = "draw";
        }
        newGs.currentBet = 0;
        setGs(newGs);
        setResult(cls);
        setResultMsg(msg);
        setPlacedChips([]);
        if (winColor !== "#f5c518") setTimeout(() => setWinOverlay(null), 1300);
      }, 500);
    }, 600);
  };

  const resetGame = () => {
    setGs({ deck: initDeck(), score1: 0, score2: 0, rounds: 0, bal1: 500, bal2: 500, currentBet: 0, playing: false });
    setCard1(null); setCard2(null); setRevealed1(false); setRevealed2(false);
    setFrame1Class(""); setFrame2Class("");
    setResult("idle"); setResultMsg("اضغط Draw Cards للعب!");
    setPlacedChips([]); setWinOverlay(null);
  };

  const resultStyles: Record<ResultState, { border: string; color: string; bg: string }> = {
    idle: { border: "#333", color: "#888", bg: "rgba(0,0,0,0.3)" },
    win1: { border: "#60a5fa", color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
    win2: { border: "#f87171", color: "#f87171", bg: "rgba(248,113,113,0.15)" },
    draw: { border: "#f5c518", color: "#f5c518", bg: "rgba(245,197,24,0.1)" },
  };
  const rs = resultStyles[result];

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        height: "100dvh",
        background: "linear-gradient(160deg,#0a0f0a 0%,#0d2818 50%,#0a0f0a 100%)",
      }}
    >
      {/* ─── HEADER ─── */}
      <div
        className="flex-shrink-0 flex items-center justify-between border-b-2"
        style={{
          padding: "6px 12px",
          background: "linear-gradient(90deg,#0d2818,#1a4d2e,#0d2818)",
          borderColor: "#f5c518",
        }}
      >
        <Link
          href="/"
          className="rounded-lg text-gray-300 no-underline"
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1.5px solid #555",
            padding: "4px 10px",
            fontSize: "11px",
            fontFamily: "'Cairo',sans-serif",
          }}
        >
          ⬅ الرئيسية
        </Link>
        <h1
          className="font-playfair text-yellow-400"
          style={{
            fontSize: "clamp(14px,4vw,22px)",
            textShadow: "0 0 15px rgba(245,197,24,0.6)",
          }}
        >
          🎯 HIGH CARD
        </h1>
        <div style={{ width: "72px" }} />
      </div>

      {/* ─── SCOREBOARD ─── */}
      <div
        className="flex-shrink-0 flex justify-center gap-3 border-b"
        style={{ padding: "6px 12px", background: "rgba(0,0,0,0.4)", borderColor: "rgba(245,197,24,0.2)" }}
      >
        <ScorePill color="#60a5fa" name="🔵 Player 1" score={gs.score1} />
        <div className="flex flex-col items-center justify-center text-gray-500" style={{ fontSize: "clamp(9px,2vw,12px)" }}>
          <div>جولة</div>
          <span className="text-blue-400 font-bold">{gs.rounds}</span>
        </div>
        <ScorePill color="#f87171" name="🔴 Player 2" score={gs.score2} />
      </div>

      {/* ─── ARENA ─── */}
      <div
        className="flex-1 flex flex-row items-center justify-center min-h-0"
        style={{ gap: "clamp(10px,4vw,40px)", padding: "8px 12px" }}
      >
        {/* P1 */}
        <PlayerSlot
          name="🔵 Player 1" nameColor="#60a5fa"
          card={card1} revealed={revealed1}
          frameClass={frame1Class}
          label={card1 ? card1.label : "—"}
          balance={`$${Math.max(0, gs.bal1)}`}
        />

        {/* VS */}
        <div className="flex flex-col items-center gap-1">
          <div
            className="font-playfair font-black text-yellow-400 leading-none"
            style={{ fontSize: "clamp(20px,7vw,42px)", textShadow: "0 0 20px rgba(245,197,24,0.6)" }}
          >
            VS
          </div>
        </div>

        {/* P2 */}
        <PlayerSlot
          name="🔴 Player 2" nameColor="#f87171"
          card={card2} revealed={revealed2}
          frameClass={frame2Class}
          label={card2 ? card2.label : "—"}
          balance={`$${Math.max(0, gs.bal2)}`}
        />
      </div>

      {/* ─── RESULT BANNER ─── */}
      <div
        className="flex-shrink-0 text-center font-black flex items-center justify-center rounded-2xl mx-3"
        style={{
          fontSize: "clamp(13px,4vw,20px)",
          padding: "6px 20px",
          minHeight: "38px",
          border: `2px solid ${rs.border}`,
          color: rs.color,
          background: rs.bg,
          animation: result !== "idle" ? "bannerPop 0.5s ease" : "none",
          transition: "all 0.3s ease",
        }}
      >
        {resultMsg}
      </div>

      {/* ─── BET CHIPS AREA ─── */}
      <div
        className="flex-shrink-0 flex items-center justify-center gap-2 flex-wrap"
        style={{ minHeight: "clamp(40px,10vw,60px)", padding: "4px 12px" }}
      >
        <div
          className="flex items-center gap-1.5 rounded-2xl"
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1.5px dashed rgba(245,197,24,0.4)",
            padding: "3px 12px",
          }}
        >
          <span className="text-gray-500" style={{ fontSize: "9px" }}>الرهان:</span>
          <span className="font-black text-yellow-400" style={{ fontSize: "clamp(12px,3vw,17px)" }}>
            ${gs.currentBet}
          </span>
        </div>
        <div className="flex gap-1 flex-wrap items-center">
          {placedChips.map((c) => {
            const chipInfo = CHIPS.find((ch) => ch.cls === c.cls);
            return (
              <Image
                key={c.id}
                src={chipInfo?.img || "/assets/5_chip.svg"}
                alt={`$${c.val}`}
                width={28}
                height={28}
                className="animate-chip-fly-in"
                style={{ width: "28px", height: "28px" }}
              />
            );
          })}
        </div>
      </div>

      {/* ─── CHIP TRAY ─── */}
      <div
        className="flex-shrink-0 flex justify-center"
        style={{ gap: "clamp(8px,2.5vw,18px)", padding: "4px 8px" }}
      >
        {CHIPS.map((c) => (
          <Image
            key={c.val}
            src={c.img}
            alt={c.label}
            width={56}
            height={56}
            className={`chip-img ${selectedChip === c.cls ? "selected" : ""}`}
            style={{ width: "clamp(40px,10.5vw,56px)", height: "clamp(40px,10.5vw,56px)" }}
            onClick={() => addBet(c.val, c.cls)}
          />
        ))}
      </div>

      {/* ─── ACTIONS ─── */}
      <div
        className="flex-shrink-0 flex justify-center flex-wrap"
        style={{ gap: "clamp(5px,2vw,12px)", padding: "4px 8px" }}
      >
        <CasinoBtn onClick={drawCards} grad="linear-gradient(135deg,#22c55e,#15803d)" disabled={gs.playing}>
          🎴 Draw Cards
        </CasinoBtn>
        <CasinoBtn onClick={clearBet} grad="linear-gradient(135deg,#ef4444,#991b1b)" disabled={gs.playing}>
          🗑 مسح الرهان
        </CasinoBtn>
        <CasinoBtn onClick={resetGame} grad="linear-gradient(135deg,#64748b,#334155)">
          🔄 Reset
        </CasinoBtn>
      </div>

      {/* ─── FOOTER ─── */}
      <div
        className="flex-shrink-0 text-center border-t"
        style={{ padding: "3px", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <Link href="/" className="no-underline" style={{ fontSize: "9px", color: "#555" }}>
          Casino Games Pro © 2026
        </Link>
      </div>

      {/* ─── WIN OVERLAY ─── */}
      {winOverlay && (
        <div className="fixed inset-0 flex justify-center items-center pointer-events-none z-50">
          <div
            className="font-playfair font-black text-center animate-big-win"
            style={{ fontSize: "clamp(40px,14vw,90px)", color: winOverlay.color }}
          >
            {winOverlay.text}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */
function ScorePill({ name, score, color }: { name: string; score: number; color: string }) {
  return (
    <div
      className="flex flex-col items-center rounded-2xl text-center"
      style={{
        background: "rgba(0,0,0,0.6)",
        border: "1.5px solid #f5c518",
        padding: "3px 18px",
        minWidth: "90px",
      }}
    >
      <div className="text-gray-400 font-semibold" style={{ fontSize: "clamp(9px,2.2vw,12px)" }}>{name}</div>
      <div className="font-black leading-none" style={{ fontSize: "clamp(18px,6vw,30px)", color }}>{score}</div>
    </div>
  );
}

function PlayerSlot({
  name, nameColor, card, revealed, frameClass, label, balance,
}: {
  name: string; nameColor: string; card: Card | null;
  revealed: boolean; frameClass: string; label: string; balance: string;
}) {
  const isWinner = frameClass === "winner";
  const isLoser  = frameClass === "loser";

  return (
    <div className="flex flex-col items-center gap-2 flex-1" style={{ maxWidth: "200px" }}>
      <div className="font-bold" style={{ fontSize: "clamp(11px,3vw,16px)", color: nameColor, letterSpacing: "1px" }}>
        {name}
      </div>
      <div
        className="rounded-xl relative"
        style={{
          background: "white",
          padding: "6px",
          width: "clamp(90px,28vw,145px)",
          transition: "transform 0.3s ease",
          boxShadow: isWinner
            ? "0 0 0 4px #4ade80,0 8px 30px rgba(74,222,128,0.5)"
            : isLoser
            ? "0 0 0 3px #ef4444,0 4px 15px rgba(239,68,68,0.4)"
            : "0 6px 24px rgba(0,0,0,0.7),0 0 0 2px rgba(255,255,255,0.15)",
          animation: isWinner ? "winnerGlow 1s ease infinite alternate" : isLoser ? "loserShake 0.6s ease" : "none",
          filter: isLoser ? "brightness(0.7)" : "none",
        }}
      >
        {card && revealed ? (
          <Image
            src={card.img}
            alt={card.label}
            width={145}
            height={200}
            className="w-full block rounded-md animate-card-reveal"
            onError={(e) => {
              const t = e.currentTarget;
              t.style.display = "none";
              if (t.parentElement) {
                t.parentElement.innerHTML = `<div style="width:100%;aspect-ratio:5/7;background:#f8f8f8;display:flex;align-items:center;justify-content:center;border-radius:6px;color:#222;font-size:22px;font-weight:900">${card.label}</div>`;
              }
            }}
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-md"
            style={{
              width: "100%",
              aspectRatio: "5/7",
              background: "linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 50%,#1e3a8a 100%)",
              fontSize: "clamp(28px,12vw,56px)",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            🂠
          </div>
        )}
      </div>
      <div
        className="font-bold text-center text-white"
        style={{ fontSize: "clamp(10px,2.5vw,14px)", minHeight: "18px" }}
      >
        {label}
      </div>
      <div
        className="rounded-xl"
        style={{
          fontSize: "clamp(9px,2.2vw,12px)",
          background: "rgba(0,0,0,0.5)",
          padding: "2px 12px",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        رصيد: <span className="font-bold text-green-400">{balance}</span>
      </div>
    </div>
  );
}

function CasinoBtn({
  onClick, grad, children, disabled = false,
}: {
  onClick: () => void; grad: string; children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="font-bold rounded-xl cursor-pointer border-0 font-cairo"
      style={{
        padding: "clamp(7px,2vw,11px) clamp(12px,4vw,24px)",
        fontSize: "clamp(10px,2.8vw,14px)",
        background: grad,
        color: "white",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
    >
      {children}
    </button>
  );
}
