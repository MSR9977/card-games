"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

/* ══════════════════════════════════════════════
   CARD DATA & UTILITIES
══════════════════════════════════════════════ */
const SUITS = ["spades", "hearts", "clubs", "diamonds"] as const;
const RANKS = [
  ["2", 2], ["3", 3], ["4", 4], ["5", 5], ["6", 6],
  ["7", 7], ["8", 8], ["9", 9], ["10", 10],
  ["jack", 10], ["queen", 10], ["king", 10], ["ace", 11],
] as const;
const RANK_NAMES: Record<string, string> = {
  "2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9","10":"10",
  jack:"J",queen:"Q",king:"K",ace:"A",
};
const SUIT_SYMBOL: Record<string, string> = {
  spades:"♠",hearts:"♥",clubs:"♣",diamonds:"♦",
};

type Card = { img: string; val: number; label: string; rank: string; suit: string };
type StatusCls = "" | "win" | "lose" | "draw";
type Phase = "betting" | "playing" | "dealer" | "result";

const CHIPS = [
  { val: 5,   cls: "chip-5",   label: "$5",   img: "/assets/5_chip.svg" },
  { val: 10,  cls: "chip-10",  label: "$10",  img: "/assets/10_chip.svg" },
  { val: 25,  cls: "chip-25",  label: "$25",  img: "/assets/25_chip.svg" },
  { val: 50,  cls: "chip-50",  label: "$50",  img: "/assets/50_chip.svg" },
  { val: 100, cls: "chip-100", label: "$100", img: "/assets/100_chip.svg" },
];

function buildDeck(): Card[] {
  const deck: Card[] = [];
  SUITS.forEach((suit) =>
    RANKS.forEach(([rank, val]) => {
      deck.push({
        img: `/assets/${rank}_of_${suit}.png`,
        val: val as number,
        label: `${RANK_NAMES[rank]}${SUIT_SYMBOL[suit]}`,
        rank: rank as string,
        suit,
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

function buildFullDeck(): Card[] {
  const d: Card[] = [];
  for (let i = 0; i < 6; i++) d.push(...buildDeck()); // 6-deck shoe, like real casino
  return shuffle(d);
}

function calcScore(hand: Card[]): number {
  let score = 0, aces = 0;
  hand.forEach((c) => {
    score += c.val;
    if (c.rank === "ace") aces++;
  });
  while (score > 21 && aces-- > 0) score -= 10;
  return score;
}

function spawnConfetti(color: string) {
  const colors = [color, "#f5c518", "#4ade80", "#ffffff", color];
  for (let i = 0; i < 40; i++) {
    const el = document.createElement("div");
    el.style.cssText = `
      position:fixed;left:${Math.random()*100}vw;top:-12px;
      background:${colors[i % colors.length]};
      --dur:${0.9 + Math.random() * 1.4}s;
      animation:confettiFall var(--dur) linear forwards;
      animation-delay:${Math.random() * 0.5}s;
      width:${5 + Math.random() * 10}px;height:${5 + Math.random() * 10}px;
      border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
      pointer-events:none;z-index:9999;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function Blackjack() {
  const [deck, setDeck] = useState<Card[]>(buildFullDeck);
  const [balance, setBalance] = useState(2000);
  const [currentBet, setCurrentBet] = useState(0);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [phase, setPhase] = useState<Phase>("betting");
  const [hideDealer, setHideDealer] = useState(true);
  const [status, setStatus] = useState("اختر فيش لوضع الرهان");
  const [statusCls, setStatusCls] = useState<StatusCls>("");
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [draws, setDraws] = useState(0);
  const [hands, setHands] = useState(0);
  const [placedChips, setPlacedChips] = useState<{ cls: string; val: number; id: number; img: string }[]>([]);
  const [selectedChip, setSelectedChip] = useState("chip-100");
  const [winOverlay, setWinOverlay] = useState<{ text: string; color: string; sub?: string } | null>(null);
  const [bustAnim, setBustAnim] = useState(false);
  const [aiComment, setAiComment] = useState<string>("");
  const [aiThinking, setAiThinking] = useState(false);
  const [lastBet, setLastBet] = useState(0);
  const chipId = useRef(0);
  const roundRef = useRef(0);

  const dealCard = useCallback((d: Card[]): [Card, Card[]] => {
    if (d.length < 20) d = buildFullDeck();
    return [d[d.length - 1], d.slice(0, -1)];
  }, []);

  const setStatusMsg = (msg: string, cls: StatusCls = "") => {
    setStatus(msg);
    setStatusCls(cls);
  };

  /* ── BETTING ── */
  const selectAndBet = (val: number, cls: string, img: string) => {
    if (phase !== "betting" && phase !== "result") return;
    const isFromResult = phase === "result";
    setSelectedChip(cls);
    if (balance <= 0) { setStatusMsg("لا يوجد رصيد كافٍ!", "lose"); return; }
    const add = Math.min(val, balance);
    if (add <= 0) return;

    if (isFromResult) {
      setPlayerHand([]);
      setDealerHand([]);
      setAiComment("");
      setPhase("betting");
      setCurrentBet(add);
      setBalance((b) => b - add);
      const id = chipId.current++;
      setPlacedChips([{ cls, val: add, id, img }]);
      setStatusMsg(`الرهان: $${add} — اضغط ابدأ`);
    } else {
      setCurrentBet((b) => b + add);
      setBalance((b) => b - add);
      const id = chipId.current++;
      setPlacedChips((prev) => [...prev, { cls, val: add, id, img }]);
      setStatusMsg(`الرهان: $${currentBet + add} — اضغط ابدأ`);
    }
  };

  const clearBet = () => {
    if (phase !== "betting" || currentBet === 0) return;
    setBalance((b) => b + currentBet);
    setCurrentBet(0);
    setPlacedChips([]);
    setStatusMsg("اختر فيش لوضع الرهان");
  };

  const repeatBet = () => {
    if ((phase !== "betting" && phase !== "result") || lastBet === 0) return;
    const isFromResult = phase === "result";
    const add = Math.min(lastBet, balance);
    if (add <= 0) { setStatusMsg("الرصيد لا يكفي لتكرار الرهان", "lose"); return; }

    if (isFromResult) {
      setPlayerHand([]);
      setDealerHand([]);
      setAiComment("");
      setPhase("betting");
    }

    setBalance((b) => b - add);
    setCurrentBet(add);
    // Place a chip representing lastBet
    const chip = CHIPS.reduce((prev, curr) =>
      Math.abs(curr.val - add) < Math.abs(prev.val - add) ? curr : prev
    );
    setPlacedChips([{ cls: chip.cls, val: add, id: chipId.current++, img: chip.img }]);
    setStatusMsg(`الرهان: $${add} — اضغط ابدأ`);
  };

  /* ── START GAME ── */
  const startGame = () => {
    if (currentBet === 0) { setStatusMsg("ضع رهاناً أولاً!", "lose"); return; }
    setLastBet(currentBet);
    roundRef.current++;

    let d = deck;
    let ph: Card[] = [], dh: Card[] = [];
    let c: Card;
    [c, d] = dealCard(d); ph = [...ph, c];
    [c, d] = dealCard(d); ph = [...ph, c];
    [c, d] = dealCard(d); dh = [...dh, c];
    [c, d] = dealCard(d); dh = [...dh, c];

    setDeck(d);
    setPlayerHand(ph);
    setDealerHand(dh);
    setHideDealer(true);
    setPhase("playing");
    setAiComment("");
    setWinOverlay(null);
    setBustAnim(false);

    const pScore = calcScore(ph);
    if (pScore === 21) {
      setStatusMsg("🎰 BLACKJACK! نطالب...", "win");
      setTimeout(() => runDealer(ph, dh, d, currentBet, true), 500);
    } else {
      setStatusMsg("HIT للأخذ — STAND للوقوف");
    }
  };

  /* ── PLAYER HIT ── */
  const playerHit = () => {
    if (phase !== "playing") return;
    let d = deck;
    let card: Card;
    [card, d] = dealCard(d);
    const ph = [...playerHand, card];
    setDeck(d);
    setPlayerHand(ph);
    const score = calcScore(ph);
    if (score > 21) {
      setBustAnim(true);
      setTimeout(() => setBustAnim(false), 800);
      finishGame(ph, dealerHand, d, currentBet, false, true);
    } else if (score === 21) {
      setStatusMsg("21! ممتاز 🌟 — نطالب...");
      setTimeout(() => runDealer(ph, dealerHand, d, currentBet), 400);
    }
  };

  /* ── PLAYER STAND ── */
  const playerStand = () => {
    if (phase !== "playing") return;
    setPhase("dealer");
    setStatusMsg("الديلر يلعب...");
    runDealer(playerHand, dealerHand, deck, currentBet);
  };

  /* ── DOUBLE DOWN ── */
  const doubleDown = () => {
    if (phase !== "playing" || balance < currentBet || playerHand.length !== 2) return;
    const newBal = balance - currentBet;
    const newBet = currentBet * 2;
    setBalance(newBal);
    setCurrentBet(newBet);

    let d = deck;
    let card: Card;
    [card, d] = dealCard(d);
    const ph = [...playerHand, card];
    setDeck(d);
    setPlayerHand(ph);

    const score = calcScore(ph);
    if (score > 21) {
      setBustAnim(true);
      setTimeout(() => setBustAnim(false), 800);
      finishGame(ph, dealerHand, d, newBet, false, true);
    } else {
      setPhase("dealer");
      setStatusMsg("مضاعفة! الديلر يلعب...");
      setTimeout(() => runDealer(ph, dealerHand, d, newBet), 400);
    }
  };

  /* ── DEALER AI LOGIC ── */
  const runDealer = async (
    ph: Card[], dh: Card[], d: Card[], bet: number, playerBlackjack = false
  ) => {
    setPhase("dealer");
    setHideDealer(false);

    const runStep = async (curDh: Card[], curD: Card[]) => {
      const ds = calcScore(curDh);
      if (ds >= 17) {
        finishGame(ph, curDh, curD, bet, playerBlackjack);
        return;
      }

      // Ask AI
      setAiThinking(true);
      try {
        const res = await fetch("/api/dealer-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dealerScore: ds,
            playerScore: calcScore(ph),
            dealerCards: curDh.map((c) => c.label),
            playerCards: ph.map((c) => c.label),
            round: roundRef.current,
          }),
        });
        const aiData = await res.json();
        setAiComment(aiData.comment || "");
        setAiThinking(false);

        if (aiData.action === "stand") {
          finishGame(ph, curDh, curD, bet, playerBlackjack);
          return;
        }
      } catch {
        setAiThinking(false);
      }

      // Draw a card
      let card: Card;
      [card, curD] = dealCard(curD);
      const newDh = [...curDh, card];
      setDealerHand([...newDh]);
      setDeck([...curD]);

      setTimeout(() => runStep(newDh, curD), 550);
    };

    await new Promise<void>((r) => setTimeout(r, 300));
    setDealerHand([...dh]);
    runStep(dh, d);
  };

  /* ── FINISH GAME ── */
  const finishGame = (
    ph: Card[], dh: Card[], d: Card[], bet: number,
    playerBlackjack = false, playerBust = false
  ) => {
    setDeck(d);
    setPlayerHand(ph);
    setDealerHand(dh);
    setHideDealer(false);
    setPhase("result");

    const ps = calcScore(ph);
    const ds = calcScore(dh);

    let msg = "", cls: StatusCls = "", gain = 0;
    let newW = wins, newL = losses, newDr = draws;

    if (playerBust || ps > 21) {
      msg = "💥 BUST! خسرت الرهان!";
      cls = "lose";
      gain = 0;
      newL++;
      setWinOverlay({ text: "💥 BUST!", color: "#ef4444", sub: `خسرت $${bet}` });
      setTimeout(() => setWinOverlay(null), 1800);
    } else if (ds > 21) {
      msg = "🎉 الديلر طار! فزت!";
      cls = "win";
      gain = bet * 2;
      newW++;
      spawnConfetti("#4ade80");
      setWinOverlay({ text: "🎉 WIN!", color: "#4ade80", sub: `ربحت +$${bet}` });
      setTimeout(() => setWinOverlay(null), 2000);
    } else if (playerBlackjack && ps === 21 && ph.length === 2) {
      if (ds === 21 && dh.length === 2) {
        msg = "🤝 تعادل! Blackjack vs Blackjack";
        cls = "draw";
        gain = bet;
        newDr++;
        setWinOverlay({ text: "🤝 تعادل!", color: "#f5c518" });
        setTimeout(() => setWinOverlay(null), 1600);
      } else {
        msg = "🎰 BLACKJACK! فزت بـ 3:2!";
        cls = "win";
        gain = Math.floor(bet * 2.5);
        newW++;
        spawnConfetti("#f5c518");
        setWinOverlay({ text: "🎰 BLACKJACK!", color: "#f5c518", sub: `ربحت +$${Math.floor(bet * 1.5)}` });
        setTimeout(() => setWinOverlay(null), 2500);
      }
    } else if (ps > ds) {
      msg = `🎉 فزت! مجموعك ${ps} > ${ds}`;
      cls = "win";
      gain = bet * 2;
      newW++;
      spawnConfetti("#4ade80");
      setWinOverlay({ text: "🏆 WIN!", color: "#4ade80", sub: `ربحت +$${bet}` });
      setTimeout(() => setWinOverlay(null), 2000);
    } else if (ds > ps) {
      msg = `😢 خسرت! الديلر ${ds} > ${ps}`;
      cls = "lose";
      gain = 0;
      newL++;
      setWinOverlay({ text: "😔 خسرت", color: "#ef4444", sub: `خسرت $${bet}` });
      setTimeout(() => setWinOverlay(null), 1800);
    } else {
      msg = "🤝 تعادل! الرهان مُرتجَع";
      cls = "draw";
      gain = bet;
      newDr++;
      setWinOverlay({ text: "🤝 تعادل!", color: "#f5c518" });
      setTimeout(() => setWinOverlay(null), 1600);
    }

    setStatusMsg(msg, cls);
    setBalance((b) => b + gain);
    setCurrentBet(0);
    setPlacedChips([]);
    setWins(newW);
    setLosses(newL);
    setDraws(newDr);
    setHands((h) => h + 1);
  };

  /* ── RESET ── */
  const resetGame = () => {
    setDeck(buildFullDeck());
    setBalance(2000);
    setCurrentBet(0);
    setPlayerHand([]);
    setDealerHand([]);
    setPhase("betting");
    setHideDealer(true);
    setStatusMsg("اختر فيش لوضع الرهان");
    setPlacedChips([]);
    setWins(0);
    setLosses(0);
    setDraws(0);
    setHands(0);
    setAiComment("");
    setWinOverlay(null);
    setBustAnim(false);
    setLastBet(0);
    roundRef.current = 0;
  };

  /* ── COMPUTED ── */
  const winPct = hands > 0 ? Math.round((wins / hands) * 100) : 0;
  const dealerScore = hideDealer
    ? (dealerHand[0] ? calcScore([dealerHand[0]]) : 0)
    : calcScore(dealerHand);
  const playerScore = calcScore(playerHand);

  const isPlaying = phase === "playing";
  const isBetting = phase === "betting";
  const isResult  = phase === "result";

  const statusColors: Record<StatusCls, { color: string; bg: string; border: string; shadow: string }> = {
    "":    { color: "#93c5fd", bg: "rgba(96,165,250,0.08)",    border: "#334155",  shadow: "none" },
    win:   { color: "#4ade80", bg: "rgba(74,222,128,0.12)",    border: "#4ade80",  shadow: "0 0 20px rgba(74,222,128,0.3)" },
    lose:  { color: "#f87171", bg: "rgba(248,113,113,0.12)",   border: "#f87171",  shadow: "0 0 20px rgba(248,113,113,0.3)" },
    draw:  { color: "#f5c518", bg: "rgba(245,197,24,0.1)",     border: "#f5c518",  shadow: "0 0 20px rgba(245,197,24,0.25)" },
  };
  const sc = statusColors[statusCls];

  return (
    <div
      style={{
        height: "100dvh",
        background: "linear-gradient(160deg,#020d08 0%,#0a2218 40%,#061410 100%)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'Cairo', sans-serif",
      }}
    >
      {/* ══ HEADER ══ */}
      <header
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          background: "linear-gradient(90deg,#040e08,#0d2818,#040e08)",
          borderBottom: "2px solid #f5c518",
          boxShadow: "0 2px 20px rgba(245,197,24,0.15)",
        }}
      >
        <Link
          href="/"
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1.5px solid #444",
            borderRadius: "10px",
            padding: "6px 14px",
            color: "#aaa",
            fontSize: "13px",
            textDecoration: "none",
            fontFamily: "'Cairo', sans-serif",
          }}
        >
          ⬅ الرئيسية
        </Link>

        <div style={{ textAlign: "center" }}>
          <h1
            className="font-playfair"
            style={{
              fontSize: "clamp(16px,4vw,26px)",
              color: "#f5c518",
              textShadow: "0 0 20px rgba(245,197,24,0.7)",
              letterSpacing: "2px",
              margin: 0,
            }}
          >
            🎰 BLACKJACK PRO
          </h1>
          <div style={{ fontSize: "10px", color: "#555", letterSpacing: "1px" }}>
            AI DEALER • 6-DECK SHOE
          </div>
        </div>

        {/* Balance */}
        <div
          style={{
            background: "linear-gradient(135deg,rgba(0,0,0,0.7),rgba(20,50,30,0.7))",
            border: "1.5px solid #f5c518",
            borderRadius: "14px",
            padding: "6px 14px",
            textAlign: "center",
            minWidth: "100px",
          }}
        >
          <div style={{ fontSize: "9px", color: "#888", letterSpacing: "1px" }}>💰 رصيدك</div>
          <div
            className="font-playfair"
            style={{
              fontSize: "clamp(15px,3.5vw,22px)",
              color: "#4ade80",
              fontWeight: 900,
              lineHeight: 1,
              textShadow: "0 0 10px rgba(74,222,128,0.5)",
            }}
          >
            ${balance.toLocaleString()}
          </div>
        </div>
      </header>

      {/* ══ TABLE ══ */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          padding: "8px 16px",
          gap: "8px",
          minHeight: 0,
        }}
      >
        {/* DEALER ZONE */}
        <DealerZone
          hand={dealerHand}
          hideSecond={hideDealer}
          score={dealerScore}
          aiComment={aiComment}
          aiThinking={aiThinking}
          phase={phase}
        />

        {/* AI STATUS BANNER */}
        {aiComment && !aiThinking && (
          <div
            style={{
              textAlign: "center",
              fontSize: "clamp(11px,2.5vw,14px)",
              color: "#f5c518",
              background: "rgba(245,197,24,0.08)",
              border: "1px solid rgba(245,197,24,0.2)",
              borderRadius: "10px",
              padding: "5px 12px",
              fontFamily: "'Cairo', sans-serif",
              animation: "bannerPop 0.4s ease",
              flexShrink: 0,
            }}
          >
            🤖 الديلر: {aiComment}
          </div>
        )}

        {/* STATUS BAR */}
        <div
          style={{
            flexShrink: 0,
            textAlign: "center",
            fontWeight: 900,
            fontSize: "clamp(12px,3vw,18px)",
            padding: "8px 20px",
            borderRadius: "14px",
            border: `2px solid ${sc.border}`,
            color: sc.color,
            background: sc.bg,
            boxShadow: sc.shadow,
            transition: "all 0.3s ease",
            animation: statusCls ? "bannerPop 0.4s ease" : "none",
            fontFamily: "'Cairo', sans-serif",
          }}
        >
          {aiThinking ? "🤖 الديلر يفكر..." : status}
        </div>

        {/* BET AREA */}
        <BetArea
          placedChips={placedChips}
          currentBet={currentBet}
          phase={phase}
        />

        {/* PLAYER ZONE */}
        <PlayerZone
          hand={playerHand}
          score={playerScore}
          bustAnim={bustAnim}
          phase={phase}
        />
      </div>

      {/* ══ BOTTOM CONTROLS ══ */}
      <div style={{ flexShrink: 0, borderTop: "1px solid rgba(245,197,24,0.12)" }}>
        {/* CHIP TRAY */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "clamp(10px,3vw,22px)",
            padding: "10px 16px 6px",
          }}
        >
          {CHIPS.map((c) => (
            <button
              key={c.val}
              onClick={() => selectAndBet(c.val, c.cls, c.img)}
              disabled={phase !== "betting" && phase !== "result"}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: (phase === "betting" || phase === "result") ? "pointer" : "not-allowed",
                opacity: (phase !== "betting" && phase !== "result") ? 0.4 : 1,
                position: "relative",
              }}
              title={c.label}
            >
              <Image
                src={c.img}
                alt={c.label}
                width={64}
                height={64}
                className={`chip-img ${selectedChip === c.cls ? "selected" : ""}`}
                style={{
                  width: "clamp(44px,11vw,64px)",
                  height: "clamp(44px,11vw,64px)",
                  display: "block",
                }}
              />
            </button>
          ))}
        </div>

        {/* ACTION BUTTONS */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "clamp(6px,2vw,12px)",
            padding: "6px 16px 8px",
          }}
        >
          <ActionBtn
            onClick={startGame}
            grad="linear-gradient(135deg,#22c55e,#15803d)"
            disabled={phase !== "betting" || currentBet === 0}
            glow="rgba(34,197,94,0.4)"
          >
            🎲 ابدأ
          </ActionBtn>
          <ActionBtn
            onClick={repeatBet}
            grad="linear-gradient(135deg,#a855f7,#7e22ce)"
            disabled={(phase !== "betting" && phase !== "result") || lastBet === 0}
            glow="rgba(168,85,247,0.4)"
          >
            🔁 كرر
          </ActionBtn>
          <ActionBtn
            onClick={playerHit}
            grad="linear-gradient(135deg,#60a5fa,#1d4ed8)"
            disabled={!isPlaying}
            glow="rgba(96,165,250,0.4)"
          >
            🎯 HIT
          </ActionBtn>
          <ActionBtn
            onClick={playerStand}
            grad="linear-gradient(135deg,#f59e0b,#b45309)"
            disabled={!isPlaying}
            glow="rgba(245,158,11,0.4)"
          >
            ✋ STAND
          </ActionBtn>
          <ActionBtn
            onClick={doubleDown}
            grad="linear-gradient(135deg,#ec4899,#9d174d)"
            disabled={!isPlaying || playerHand.length !== 2 || balance < currentBet}
            glow="rgba(236,72,153,0.4)"
          >
            💰 ×2
          </ActionBtn>
          <ActionBtn
            onClick={clearBet}
            grad="linear-gradient(135deg,#ef4444,#991b1b)"
            disabled={phase !== "betting" || currentBet === 0}
            glow="rgba(239,68,68,0.4)"
          >
            🗑 مسح
          </ActionBtn>
          <ActionBtn
            onClick={resetGame}
            grad="linear-gradient(135deg,#64748b,#334155)"
            disabled={false}
          >
            🔄 جديد
          </ActionBtn>
        </div>

        {/* STATS */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            padding: "4px 16px 8px",
            fontSize: "clamp(10px,2.2vw,13px)",
          }}
        >
          {[
            { icon: "🏆", val: wins,   color: "#4ade80", label: "فوز" },
            { icon: "💔", val: losses, color: "#f87171", label: "خسارة" },
            { icon: "🤝", val: draws,  color: "#f5c518", label: "تعادل" },
            { icon: "📊", val: `${winPct}%`, color: "#93c5fd", label: "نسبة" },
            { icon: "🎮", val: hands, color: "#d4d4d8", label: "جولة" },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                padding: "3px 10px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {s.icon}{" "}
              <span style={{ color: s.color, fontWeight: 700 }}>{s.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ WIN OVERLAY ══ */}
      {winOverlay && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            pointerEvents: "none",
            zIndex: 50,
          }}
        >
          <div
            className="font-playfair animate-win-explode"
            style={{
              fontSize: "clamp(44px,14vw,100px)",
              color: winOverlay.color,
              fontWeight: 900,
              textShadow: `0 0 40px ${winOverlay.color}`,
              textAlign: "center",
            }}
          >
            {winOverlay.text}
          </div>
          {winOverlay.sub && (
            <div
              style={{
                fontSize: "clamp(18px,5vw,32px)",
                color: "white",
                fontWeight: 700,
                marginTop: "8px",
                fontFamily: "'Cairo', sans-serif",
              }}
            >
              {winOverlay.sub}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════ */

function DealerZone({
  hand, hideSecond, score, aiComment, aiThinking, phase,
}: {
  hand: Card[]; hideSecond: boolean; score: number;
  aiComment: string; aiThinking: boolean; phase: Phase;
}) {
  const isDealer = phase === "dealer" || phase === "result";

  return (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
      }}
    >
      {/* Label row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            fontSize: "clamp(11px,2.5vw,15px)",
            color: "#f87171",
            fontWeight: 700,
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          🎩 DEALER
        </div>
        {aiThinking && (
          <div
            style={{
              fontSize: "11px",
              color: "#f5c518",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              animation: "pulse 1s ease infinite",
            }}
          >
            <span>🤖</span>
            <span style={{ fontFamily: "'Cairo', sans-serif" }}>يفكر...</span>
          </div>
        )}
      </div>

      {/* Cards */}
      <CardRow hand={hand} hideSecond={hideSecond} bustAnim={false} size="lg" />

      {/* Score */}
      <div
        style={{
          background: "rgba(0,0,0,0.75)",
          border: `1.5px solid ${isDealer && !hideSecond ? "#f87171" : "#f5c518"}`,
          borderRadius: "20px",
          padding: "3px 18px",
          fontSize: "clamp(12px,3vw,17px)",
          color: "white",
          fontWeight: 900,
          minWidth: "70px",
          textAlign: "center",
          boxShadow: isDealer && !hideSecond ? "0 0 12px rgba(248,113,113,0.3)" : "none",
          transition: "all 0.3s",
        }}
      >
        {score > 0 ? score : "—"}
      </div>
    </div>
  );
}

function BetArea({
  placedChips, currentBet, phase,
}: {
  placedChips: { cls: string; val: number; id: number; img: string }[];
  currentBet: number;
  phase: Phase;
}) {
  return (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        padding: "4px 12px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "rgba(0,0,0,0.45)",
          border: "1.5px dashed rgba(245,197,24,0.4)",
          borderRadius: "14px",
          padding: "5px 14px",
          minHeight: "44px",
          minWidth: "100px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: "10px", color: "#666", fontFamily: "'Cairo', sans-serif" }}>الرهان:</span>
        {placedChips.map((c) => (
          <Image
            key={c.id}
            src={c.img}
            alt={`$${c.val}`}
            width={30}
            height={30}
            className="animate-chip-bounce-in"
            style={{ width: "30px", height: "30px", flexShrink: 0 }}
          />
        ))}
        <span
          className="font-playfair"
          style={{ fontSize: "clamp(14px,3vw,20px)", color: "#f5c518", fontWeight: 900 }}
        >
          ${currentBet}
        </span>
      </div>
    </div>
  );
}

function PlayerZone({
  hand, score, bustAnim, phase,
}: {
  hand: Card[]; score: number; bustAnim: boolean; phase: Phase;
}) {
  const isGood = score <= 21;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "6px",
        minHeight: 0,
      }}
    >
      {/* Score */}
      <div
        style={{
          background: "rgba(0,0,0,0.75)",
          border: `1.5px solid ${isGood ? "#4ade80" : "#ef4444"}`,
          borderRadius: "20px",
          padding: "3px 18px",
          fontSize: "clamp(12px,3vw,17px)",
          color: isGood ? "#4ade80" : "#ef4444",
          fontWeight: 900,
          minWidth: "70px",
          textAlign: "center",
          boxShadow: isGood
            ? "0 0 10px rgba(74,222,128,0.2)"
            : "0 0 14px rgba(239,68,68,0.5)",
          transition: "all 0.3s",
          animation: bustAnim ? "bust 0.8s ease" : score === 21 ? "naturalGlow 1s ease infinite alternate" : "none",
        }}
      >
        {score > 0 ? score : "—"}
      </div>

      {/* Cards */}
      <CardRow hand={hand} hideSecond={false} bustAnim={bustAnim} size="lg" />

      <div
        style={{
          fontSize: "clamp(11px,2.5vw,15px)",
          color: "#4ade80",
          fontWeight: 700,
          letterSpacing: "2px",
          textTransform: "uppercase",
        }}
      >
        🎮 PLAYER
      </div>
    </div>
  );
}

function CardRow({
  hand, hideSecond, bustAnim, size = "md",
}: {
  hand: Card[]; hideSecond: boolean; bustAnim: boolean; size?: "md" | "lg";
}) {
  const cardW = size === "lg" ? "clamp(68px,14vw,110px)" : "clamp(50px,10vw,72px)";
  const cardH = size === "lg" ? "clamp(96px,20vw,155px)" : "clamp(70px,14vw,102px)";

  return (
    <div
      className={bustAnim ? "animate-bust" : ""}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "clamp(4px,1.5vw,10px)",
        flexWrap: "wrap",
        minHeight: size === "lg" ? "clamp(96px,20vw,155px)" : "clamp(70px,14vw,102px)",
      }}
    >
      {hand.map((card, i) => (
        <div
          key={i}
          className="animate-deal-card"
          style={{
            width: cardW,
            height: cardH,
            borderRadius: "10px",
            overflow: "hidden",
            flexShrink: 0,
            animationDelay: `${i * 0.1}s`,
            boxShadow: "0 6px 20px rgba(0,0,0,0.8), 0 0 0 1.5px rgba(255,255,255,0.15)",
            background: "white",
            position: "relative",
            padding: hideSecond && i === 1 ? "0" : "clamp(4px, 0.8vw, 8px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {hideSecond && i === 1 ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 50%,#1e3a8a 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "clamp(24px,6vw,48px)",
              }}
            >
              🂠
            </div>
          ) : (
            <Image
              src={card.img}
              alt={card.label}
              width={110}
              height={155}
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              onError={(e) => {
                const t = e.currentTarget;
                t.style.display = "none";
                if (t.parentElement) {
                  t.parentElement.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:white;color:#111;font-size:clamp(14px,4vw,22px);font-weight:900">${card.label}</div>`;
                }
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function ActionBtn({
  onClick, grad, children, disabled = false, glow,
}: {
  onClick: () => void; grad: string; children: React.ReactNode;
  disabled?: boolean; glow?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "clamp(8px,2vw,13px) clamp(12px,3.5vw,26px)",
        fontSize: "clamp(11px,2.8vw,15px)",
        background: disabled ? "rgba(50,50,50,0.6)" : grad,
        color: disabled ? "#555" : "white",
        border: "none",
        borderRadius: "12px",
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        minWidth: "clamp(60px,14vw,90px)",
        transition: "all 0.2s ease",
        boxShadow: !disabled && glow ? `0 4px 15px ${glow}` : "none",
        fontFamily: "'Cairo', sans-serif",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = "translateY(-3px) scale(1.04)";
          if (glow) e.currentTarget.style.boxShadow = `0 8px 24px ${glow}`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = !disabled && glow ? `0 4px 15px ${glow}` : "none";
      }}
    >
      {children}
    </button>
  );
}
