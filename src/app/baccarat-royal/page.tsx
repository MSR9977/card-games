"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import UserPanel from "../components/UserPanel";
import { useFirebaseUser } from "../components/FirebaseProvider";

/* ─── Card Data ─── */
const SUITS = ["spades", "hearts", "clubs", "diamonds"] as const;
const RANKS = ["2","3","4","5","6","7","8","9","10","jack","queen","king","ace"] as const;
const BVAL: Record<string, number> = {
  "2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"10":0,jack:0,queen:0,king:0,ace:1,
};
const DISP: Record<string, string> = {
  "2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9","10":"10",jack:"J",queen:"Q",king:"K",ace:"A",
};

type Card = { img: string; bv: number; label: string };
type Side = "player" | "banker" | "tie";
type HistType = "p" | "b" | "t";
type StatusCls = "" | "win" | "lose" | "tie";

function buildDeck(): Card[] {
  const d: Card[] = [];
  SUITS.forEach((s) =>
    RANKS.forEach((r) =>
      d.push({ img: `/assets/${r}_of_${s}.png`, bv: BVAL[r], label: `${DISP[r]}${s[0].toUpperCase()}` })
    )
  );
  return d;
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function buildFullDeck(): Card[] {
  const d: Card[] = [];
  for (let i = 0; i < 4; i++) d.push(...buildDeck());
  return shuffle(d);
}
function bacScore(hand: Card[]): number {
  return hand.reduce((a, c) => a + c.bv, 0) % 10;
}

const pause = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const CHIPS = [
  { val: 5,   cls: "chip-5",   label: "$5",   img: "/assets/5_chip.svg" },
  { val: 10,  cls: "chip-10",  label: "$10",  img: "/assets/10_chip.svg" },
  { val: 25,  cls: "chip-25",  label: "$25",  img: "/assets/25_chip.svg" },
  { val: 50,  cls: "chip-50",  label: "$50",  img: "/assets/50_chip.svg" },
  { val: 100, cls: "chip-100", label: "$100", img: "/assets/100_chip.svg" },
];

function spawnConfetti(primary: string) {
  const cols = [primary,"#f5c518","#fff","#4ade80",primary];
  for (let i = 0; i < 30; i++) {
    const el = document.createElement("div");
    el.style.cssText = `
      position:fixed;left:${Math.random()*100}vw;top:-10px;
      background:${cols[i%cols.length]};
      --dur:${0.9+Math.random()*1.3}s;--delay:${Math.random()*0.4}s;
      animation:confettiFall var(--dur) linear var(--delay) forwards;
      width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;
      border-radius:2px;pointer-events:none;z-index:999;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }
}

export default function BaccaratRoyal() {
  const [deck, setDeck] = useState<Card[]>(buildFullDeck);
  const [balance, setBalance] = useState(2000);
  const [bet, setBet] = useState(0);
  const [side, setSide] = useState<Side>("player");
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [bankerHand, setBankerHand] = useState<Card[]>([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [bankerScore, setBankerScore] = useState(0);
  const [playerNatural, setPlayerNatural] = useState(false);
  const [bankerNatural, setBankerNatural] = useState(false);
  const [status, setStatus] = useState("اختر الجانب ← ضع فيش ← ابدأ");
  const [statusCls, setStatusCls] = useState<StatusCls>("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<HistType[]>([]);
  const [pwins, setPwins] = useState(0);
  const [bwins, setBwins] = useState(0);
  const [ties, setTies] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [placedChips, setPlacedChips] = useState<{ cls: string; val: number; id: number }[]>([]);
  const [selectedChip, setSelectedChip] = useState("chip-25");
  const [winOverlay, setWinOverlay] = useState<{ text: string; color: string } | null>(null);
  const chipIdRef = { current: 0 };

  const dealCard = useCallback((d: Card[]): [Card, Card[]] => {
    if (d.length < 10) d = buildFullDeck();
    return [d[d.length - 1], d.slice(0, -1)];
  }, []);

  const setStatusMsg = (t: string, c: StatusCls = "") => { setStatus(t); setStatusCls(c); };

  const addBet = (val: number, cls: string) => {
    if (busy) return;
    setSelectedChip(cls);
    const add = Math.min(val, balance);
    if (!add) return;
    setBet((b) => b + add);
    setBalance((b) => b - add);
    const id = Date.now() + Math.random();
    setPlacedChips((prev) => [...prev, { cls, val: add, id }]);
  };

  const clearBet = () => {
    if (busy || bet === 0) return;
    setBalance((b) => b + bet);
    setBet(0);
    setPlacedChips([]);
  };

  const dealRound = async () => {
    if (busy) return;
    if (bet === 0) { setStatusMsg("ضع رهاناً أولاً!", "lose"); return; }
    setBusy(true);

    setPlayerHand([]); setBankerHand([]);
    setPlayerScore(0); setBankerScore(0);
    setPlayerNatural(false); setBankerNatural(false);
    setStatusMsg("يتم توزيع البطاقات...");

    let d = deck;
    const deal = (): [Card, Card[]] => {
      if (d.length < 10) d = buildFullDeck();
      const c = d[d.length - 1];
      d = d.slice(0, -1);
      return [c, d];
    };

    let ph: Card[] = [], bh: Card[] = [];
    let c: Card;
    [c, d] = deal(); ph = [c];
    [c, d] = deal(); ph = [...ph, c];
    [c, d] = deal(); bh = [c];
    [c, d] = deal(); bh = [...bh, c];

    let ps = bacScore(ph), bs = bacScore(bh);
    const pNat = ps >= 8, bNat = bs >= 8;

    await pause(200); setPlayerHand([ph[0]]);
    await pause(300); setBankerHand([bh[0]]);
    await pause(300); setPlayerHand([...ph]);
    await pause(300); setBankerHand([...bh]);
    setPlayerScore(ps); setBankerScore(bs);
    setPlayerNatural(pNat); setBankerNatural(bNat);
    await pause(400);

    // Third card rules
    if (!pNat && !bNat) {
      if (ps <= 5) {
        [c, d] = deal(); ph = [...ph, c]; ps = bacScore(ph);
        setPlayerHand([...ph]); setPlayerScore(ps); await pause(400);
      }

      const p3 = ph.length === 3 ? ph[2] : null;
      if (p3 === null) {
        if (bs <= 5) {
          [c, d] = deal(); bh = [...bh, c]; bs = bacScore(bh);
          setBankerHand([...bh]); setBankerScore(bs); await pause(400);
        }
      } else {
        const pv = p3.bv;
        const bankerDraws =
          bs <= 2 ||
          (bs === 3 && pv !== 8) ||
          (bs === 4 && pv >= 2 && pv <= 7) ||
          (bs === 5 && pv >= 4 && pv <= 7) ||
          (bs === 6 && pv >= 6 && pv <= 7);
        if (bankerDraws) {
          [c, d] = deal(); bh = [...bh, c]; bs = bacScore(bh);
          setBankerHand([...bh]); setBankerScore(bs); await pause(400);
        }
      }
    }

    setPlayerScore(ps); setBankerScore(bs);
    setPlayerNatural(pNat); setBankerNatural(bNat);
    setDeck(d);

    // Result
    const winner: Side = ps > bs ? "player" : bs > ps ? "banker" : "tie";
    let gain = 0, msg = "", cls: StatusCls = "";
    const newRounds = rounds + 1;
    let nPw = pwins, nBw = bwins, nTi = ties;
    const newHistory: HistType[] = [...history, winner === "tie" ? "t" : winner === "player" ? "p" : "b"];
    if (newHistory.length > 20) newHistory.shift();

    if (winner === "tie") {
      nTi++;
      if (side === "tie") {
        gain = bet * 8;
        msg = `🟢 Tie! فزت $${gain}!`; cls = "win";
        spawnConfetti("#22c55e");
        setWinOverlay({ text: "🟢 TIE WIN!", color: "#22c55e" });
        setTimeout(() => setWinOverlay(null), 1300);
      } else {
        gain = bet;
        msg = "🤝 تعادل! الرهان مُرتجَع"; cls = "tie";
      }
    } else if (winner === side) {
      winner === "player" ? nPw++ : nBw++;
      const odds = (side as string) === "tie" ? 8 : 1;
      gain = bet * (1 + odds);
      msg = `🎉 ${winner === "player" ? "Player" : "Banker"} فاز! ربحت $${bet}!`; cls = "win";
      const color = side === "player" ? "#60a5fa" : "#f87171";
      spawnConfetti(color);
      setWinOverlay({ text: winner === "player" ? "🔵 WIN!" : "🔴 WIN!", color });
      setTimeout(() => setWinOverlay(null), 1300);
    } else {
      winner === "player" ? nPw++ : nBw++;
      msg = `😢 ${winner === "player" ? "Player" : "Banker"} فاز — خسرت!`; cls = "lose";
      gain = 0;
    }

    if (winner === "tie" && side !== "tie") gain = bet;
    setBalance((b) => b + gain);
    setBet(0); setPlacedChips([]);
    setStatusMsg(msg, cls);
    setRounds(newRounds);
    setPwins(nPw); setBwins(nBw); setTies(nTi);
    setHistory(newHistory);
    setBusy(false);
  };

  const resetGame = () => {
    setBalance(2000); setBet(0); setSide("player");
    setPlayerHand([]); setBankerHand([]);
    setPlayerScore(0); setBankerScore(0);
    setPlayerNatural(false); setBankerNatural(false);
    setPlacedChips([]); setHistory([]);
    setPwins(0); setBwins(0); setTies(0); setRounds(0);
    setBusy(false);
    setStatusMsg("اختر الجانب ← ضع فيش ← ابدأ");
  };

  const statusStyle: Record<StatusCls, { color: string; bg: string; border: string }> = {
    "":    { color: "#60a5fa", bg: "rgba(96,165,250,.1)",    border: "#555" },
    win:   { color: "#4ade80", bg: "rgba(74,222,128,.12)",   border: "#4ade80" },
    lose:  { color: "#f87171", bg: "rgba(248,113,113,.12)", border: "#f87171" },
    tie:   { color: "#f5c518", bg: "rgba(245,197,24,.1)",   border: "#f5c518" },
  };
  const ss = statusStyle[statusCls];

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: "100dvh", background: "linear-gradient(160deg,#050810 0%,#0a1528 50%,#050810 100%)" }}
    >
      {/* HEADER */}
      <div className="flex-shrink-0 flex items-center justify-between border-b-2"
        style={{ padding: "6px 12px", background: "linear-gradient(90deg,#0a1528,#1a2a4a,#0a1528)", borderColor: "#f5c518" }}>
        <Link href="/" className="rounded-lg text-gray-300 no-underline"
          style={{ background: "rgba(0,0,0,0.4)", border: "1.5px solid #555", padding: "4px 10px", fontSize: "11px" }}>
          ⬅ الرئيسية
        </Link>
        <h1 className="font-playfair text-yellow-400"
          style={{ fontSize: "clamp(13px,3.8vw,22px)", textShadow: "0 0 18px rgba(245,197,24,0.6)", letterSpacing: "1px" }}>
          👑 BACCARAT ROYAL
        </h1>
        <div style={{ background: "rgba(0,0,0,0.5)", border: "1.5px solid #f5c518", borderRadius: "20px", padding: "4px 12px", textAlign: "center" }}>
          <div style={{ fontSize: "9px", color: "#aaa" }}>💰 رصيدك</div>
          <div className="font-black text-green-400" style={{ fontSize: "clamp(12px,3vw,17px)" }}>${balance.toLocaleString()}</div>
        </div>
      </div>

      {/* BET SIDES */}
      <div className="flex-shrink-0 flex gap-1.5 justify-center" style={{ padding: "6px 10px" }}>
        {[
          { s: "player" as Side, label: "🔵 Player", odds: "1:1", active: "linear-gradient(135deg,#1d4ed8,#1e3a8a)", border: "#3b82f6", color: "#93c5fd" },
          { s: "tie"    as Side, label: "🟢 Tie",    odds: "8:1", active: "linear-gradient(135deg,#166534,#14532d)", border: "#22c55e", color: "#86efac" },
          { s: "banker" as Side, label: "🔴 Banker", odds: "1:1", active: "linear-gradient(135deg,#991b1b,#7f1d1d)", border: "#ef4444", color: "#fca5a5" },
        ].map((btn) => (
          <button
            key={btn.s}
            onClick={() => setSide(btn.s)}
            className="flex-1 font-black border-2 rounded-xl relative overflow-hidden"
            style={{
              maxWidth: "140px",
              padding: "clamp(6px,1.8vw,10px) 6px",
              fontSize: "clamp(10px,2.5vw,14px)",
              cursor: "pointer",
              background: btn.active,
              borderColor: btn.border,
              color: btn.color,
              transform: side === btn.s ? "scale(1.07) translateY(-3px)" : "",
              boxShadow: side === btn.s ? "0 0 0 3px rgba(255,255,255,0.25)" : "",
              transition: "all .25s ease",
              fontFamily: "'Cairo',sans-serif",
            }}
          >
            {btn.label}
            <span className="block" style={{ fontSize: "clamp(8px,2vw,11px)", opacity: 0.75 }}>{btn.odds}</span>
          </button>
        ))}
      </div>

      {/* ARENA */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ gap: "4px", padding: "4px 10px" }}>
        {/* BANKER */}
        <div className="flex flex-col items-center gap-1">
          <div className="font-bold uppercase" style={{ fontSize: "clamp(10px,2.5vw,14px)", color: "#f87171", letterSpacing: "1px" }}>🔴 Banker</div>
          <BacCardRow hand={bankerHand} />
          <div className={`rounded-xl font-black text-center ${bankerNatural ? "animate-natural-glow" : ""}`}
            style={{ background: "rgba(0,0,0,0.7)", border: `1.5px solid ${bankerNatural ? "#4ade80" : "#f5c518"}`, padding: "2px 14px", fontSize: "clamp(12px,3.5vw,20px)", color: bankerNatural ? "#4ade80" : "white", minWidth: "60px" }}>
            {bankerScore}
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px dashed rgba(245,197,24,0.35)", margin: "0 16px" }} />

        {/* STATUS */}
        <div className="flex-shrink-0 text-center font-bold rounded-2xl mx-2"
          style={{
            fontSize: "clamp(11px,3vw,16px)", padding: "5px 14px",
            border: `1.5px solid ${ss.border}`, color: ss.color, background: ss.bg,
            animation: statusCls === "win" ? "winPulse .6s ease" : statusCls === "lose" ? "shakePulse .5s ease" : "none",
            transition: "all .3s",
          }}>
          {status}
        </div>

        {/* BET ROW */}
        <div className="flex-shrink-0 flex items-center justify-center gap-2" style={{ padding: "3px 10px" }}>
          <div>
            <div style={{ fontSize: "9px", color: "#888", textAlign: "center" }}>الرهان</div>
            <div className="flex items-center justify-center flex-wrap gap-1"
              style={{ minWidth: "80px", minHeight: "38px", background: "rgba(0,0,0,0.4)", border: "1.5px dashed rgba(245,197,24,0.45)", borderRadius: "12px", padding: "4px 10px" }}>
              {placedChips.map((c) => {
                const chipInfo = CHIPS.find((ch) => ch.cls === c.cls);
                return (
                  <Image
                    key={c.id}
                    src={chipInfo?.img || "/assets/5_chip.svg"}
                    alt={`$${c.val}`}
                    width={26}
                    height={26}
                    className="animate-chip-bounce-in"
                    style={{ width: "26px", height: "26px", flexShrink: 0 }}
                  />
                );
              })}
              <span className="font-black text-yellow-400" style={{ fontSize: "clamp(12px,3vw,17px)" }}>${bet}</span>
            </div>
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px dashed rgba(245,197,24,0.35)", margin: "0 16px" }} />

        {/* PLAYER */}
        <div className="flex flex-col items-center gap-1">
          <div className="font-bold uppercase" style={{ fontSize: "clamp(10px,2.5vw,14px)", color: "#93c5fd", letterSpacing: "1px" }}>🔵 Player</div>
          <BacCardRow hand={playerHand} />
          <div className={`rounded-xl font-black text-center ${playerNatural ? "animate-natural-glow" : ""}`}
            style={{ background: "rgba(0,0,0,0.7)", border: `1.5px solid ${playerNatural ? "#4ade80" : "#f5c518"}`, padding: "2px 14px", fontSize: "clamp(12px,3.5vw,20px)", color: playerNatural ? "#4ade80" : "white", minWidth: "60px" }}>
            {playerScore}
          </div>
        </div>
      </div>

      {/* HISTORY */}
      <div className="flex-shrink-0 flex justify-center flex-wrap gap-1" style={{ padding: "2px 10px" }}>
        {history.map((h, i) => (
          <div key={i} className="rounded-full flex items-center justify-center font-black animate-dot-pop"
            style={{
              width: "clamp(10px,2.8vw,16px)", height: "clamp(10px,2.8vw,16px)", fontSize: "7px",
              background: h === "p" ? "#1d4ed8" : h === "b" ? "#b91c1c" : "#166534",
            }}>
            {h.toUpperCase()}
          </div>
        ))}
      </div>

      {/* CHIP TRAY */}
      <div className="flex-shrink-0 flex justify-center" style={{ gap: "clamp(8px,2.5vw,18px)", padding: "4px 8px" }}>
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

      {/* ACTIONS */}
      <div className="flex-shrink-0 flex justify-center flex-wrap" style={{ gap: "clamp(5px,2vw,10px)", padding: "4px 6px" }}>
        <BacBtn onClick={dealRound} grad="linear-gradient(135deg,#22c55e,#15803d)" disabled={busy}>🃏 ابدأ الجولة</BacBtn>
        <BacBtn onClick={clearBet} grad="linear-gradient(135deg,#ef4444,#991b1b)" disabled={busy}>🗑 مسح</BacBtn>
        <BacBtn onClick={resetGame} grad="linear-gradient(135deg,#64748b,#334155)">🔄 جديد</BacBtn>
      </div>

      {/* STATS */}
      <div className="flex-shrink-0 flex justify-center gap-2" style={{ padding: "3px 8px", fontSize: "clamp(9px,2.2vw,12px)" }}>
        {[
          { icon: "🔵", val: pwins, color: "#4ade80" },
          { icon: "🔴", val: bwins, color: "#f87171" },
          { icon: "🟢", val: ties,  color: "#f5c518" },
          { icon: "🎮", val: `${rounds} جولة`, color: "white" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl" style={{ background: "rgba(0,0,0,.5)", padding: "2px 10px", border: "1px solid rgba(255,255,255,.1)" }}>
            {s.icon} <span className="font-bold" style={{ color: s.color }}>{s.val}</span>
          </div>
        ))}
      </div>

      <div className="flex-shrink-0 text-center border-t" style={{ padding: "3px", borderColor: "rgba(255,255,255,.06)" }}>
        <Link href="/" className="no-underline" style={{ fontSize: "9px", color: "#444" }}>Casino Games Pro © 2026</Link>
      </div>

      {/* WIN OVERLAY */}
      {winOverlay && (
        <div className="fixed inset-0 flex justify-center items-center pointer-events-none z-50">
          <div className="font-playfair font-black text-center animate-win-explode"
            style={{ fontSize: "clamp(36px,12vw,80px)", color: winOverlay.color }}>
            {winOverlay.text}
          </div>
        </div>
      )}
    </div>
  );
}

function BacCardRow({ hand }: { hand: Card[] }) {
  return (
    <div className="flex justify-center items-center gap-1.5 flex-nowrap"
      style={{ minHeight: "clamp(62px,15vw,100px)" }}>
      {hand.map((card, i) => (
        <div key={i} className="rounded-lg overflow-hidden flex-shrink-0 animate-deal-card"
          style={{
            width: "clamp(42px,9.5vw,66px)", height: "clamp(59px,13.5vw,93px)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.15)",
            background: "white", animationDelay: `${i * 0.1}s`,
          }}>
          <Image src={card.img} alt={card.label} width={66} height={93}
            className="w-full h-full object-cover block"
            onError={(e) => {
              const t = e.currentTarget;
              t.src = "/assets/back.png";
              t.alt = "card back";
            }}
          />
        </div>
      ))}
    </div>
  );
}

function BacBtn({ onClick, grad, children, disabled = false }: {
  onClick: () => void; grad: string; children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="font-bold rounded-xl border-0 font-cairo"
      style={{
        padding: "clamp(7px,1.8vw,11px) clamp(10px,3vw,22px)",
        fontSize: "clamp(10px,2.5vw,14px)",
        background: grad, color: "white",
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        minWidth: "clamp(58px,15vw,88px)",
        transition: "all .2s",
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
    >
      {children}
    </button>
  );
}
