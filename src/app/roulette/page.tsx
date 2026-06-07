"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import NextImage from "next/image";
import ChipSelector from "../components/ChipSelector";
import { useFirebaseUser } from "../components/FirebaseProvider";

function AdminBalanceButtons({
  gameKey,
  adjustBalance,
  onLocalChange,
}: {
  gameKey: "roulette" | "cards";
  adjustBalance: (game: "roulette" | "cards", diff: number) => Promise<void>;
  onLocalChange: (diff: number) => void;
}) {
  const timeoutRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  const doRepeat = (diff: number, delay: number) => {
    if (!runningRef.current) return;
    onLocalChange(diff);
    adjustBalance(gameKey, diff).catch(() => {});
    const nextDelay = Math.max(50, delay - 30);
    timeoutRef.current = window.setTimeout(() => doRepeat(diff, nextDelay), nextDelay) as unknown as number;
  };

  const start = (diff: number) => {
    runningRef.current = true;
    onLocalChange(diff);
    adjustBalance(gameKey, diff).catch(() => {});
    timeoutRef.current = window.setTimeout(() => doRepeat(diff, 300), 300) as unknown as number;
  };

  const stop = () => {
    runningRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const btnBase: React.CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontFamily: "'Orbitron', monospace",
    fontSize: "1.15rem",
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.1s, box-shadow 0.1s, filter 0.1s",
    userSelect: "none" as const,
    flexShrink: 0,
  };

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <button
        onMouseDown={() => start(100)}
        onMouseUp={stop}
        onMouseLeave={(e) => { stop(); (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; (e.currentTarget as HTMLButtonElement).style.filter = "none"; }}
        onTouchStart={() => start(100)}
        onTouchEnd={stop}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.12)"; (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.2)"; }}
        style={{
          ...btnBase,
          background: "linear-gradient(135deg, #22c55e, #16a34a)",
          color: "#fff",
          boxShadow: "0 2px 10px rgba(34,197,94,0.45)",
        }}
      >
        +
      </button>
      <button
        onMouseDown={() => start(-100)}
        onMouseUp={stop}
        onMouseLeave={(e) => { stop(); (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; (e.currentTarget as HTMLButtonElement).style.filter = "none"; }}
        onTouchStart={() => start(-100)}
        onTouchEnd={stop}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.12)"; (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.2)"; }}
        style={{
          ...btnBase,
          background: "linear-gradient(135deg, #ef4444, #b91c1c)",
          color: "#fff",
          boxShadow: "0 2px 10px rgba(239,68,68,0.45)",
        }}
      >
        −
      </button>
    </div>
  );
}

// ─── Constants ─────────────────────────────────────────────────────────────

const RED_NUMS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const NUM_SEGS = WHEEL_ORDER.length;
const SEG_ANGLE = (2 * Math.PI) / NUM_SEGS;
const POINTER_ANGLE = -Math.PI / 2;

const TABLE_ROWS: number[][] = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];

const CHIP_DEFS = [
  { value: 1, label: "1", cls: "c1", svgPath: "/roulette/1_chip.svg" },
  { value: 2, label: "2", cls: "c2", svgPath: "/roulette/2_chip.svg" },
  { value: 5, label: "5", cls: "c5", svgPath: "/roulette/5_chip.svg" },
  { value: 25, label: "25", cls: "c25", svgPath: "/roulette/25_chip.svg" },
  { value: 50, label: "50", cls: "c50", svgPath: "/roulette/50_chip.svg" },
  { value: 100, label: "100", cls: "c100", svgPath: "/roulette/100_chip.svg" },
];

const CHIP_COLORS: Record<string, string> = {
  c1: "#1b5e20",
  c2: "#b71c1c",
  c5: "#e65100",
  c25: "#00838f",
  c50: "#bf360c",
  c100: "#f57f17",
};

const SVG_W = 768;
const SVG_H = 424.5;

const RAW_AREAS: Record<string, [number, number, number, number]> = {
  "0": [441, 122, 489, 328],
  "1": [482, 256, 524, 328],
  "2": [482, 189, 526, 260],
  "3": [482, 121, 526, 194],
  "4": [520, 256, 565, 328],
  "5": [520, 188, 564, 260],
  "6": [520, 122, 565, 194],
  "7": [559, 254, 607, 330],
  "8": [561, 188, 605, 262],
  "9": [561, 122, 603, 194],
  "10": [601, 252, 644, 328],
  "11": [602, 188, 646, 262],
  "12": [598, 122, 646, 194],
  "13": [638, 256, 683, 328],
  "14": [635, 188, 683, 266],
  "15": [638, 122, 683, 195],
  "16": [677, 254, 725, 330],
  "17": [677, 188, 723, 260],
  "18": [679, 122, 723, 195],
  "19": [720, 254, 762, 330],
  "20": [716, 188, 762, 262],
  "21": [718, 124, 764, 195],
  "22": [760, 256, 803, 330],
  "23": [757, 188, 805, 264],
  "24": [758, 120, 803, 192],
  "25": [793, 253, 841, 330],
  "26": [799, 186, 839, 262],
  "27": [795, 122, 841, 192],
  "28": [836, 254, 880, 330],
  "29": [836, 188, 878, 264],
  "30": [834, 120, 882, 192],
  "31": [875, 254, 919, 330],
  "32": [871, 188, 919, 265],
  "33": [876, 120, 917, 193],
  "34": [913, 254, 958, 330],
  "35": [913, 188, 956, 262],
  "36": [911, 122, 958, 195],
  black: [718, 361, 797, 398],
  red: [640, 360, 718, 398],
  "1to18": [489, 363, 559, 395],
  "19to36": [878, 363, 950, 395],
  even: [563, 361, 638, 396],
  odd: [799, 361, 875, 396],
  "doz-1": [483, 330, 640, 360],
  "doz-2": [642, 330, 797, 361],
  "doz-3": [799, 330, 952, 360],
  "col-0": [958, 129, 991, 184],
  "col-1": [959, 195, 991, 254],
  "col-2": [959, 262, 987, 319],
};

const LAST10_RAW: [number, number, number, number][] = [
  [591, 41, 624, 70],
  [621, 40, 651, 71],
  [647, 42, 677, 70],
  [674, 43, 704, 70],
  [698, 43, 731, 70],
  [727, 42, 754, 70],
  [750, 43, 782, 70],
  [776, 42, 807, 70],
  [805, 42, 833, 70],
  [827, 43, 861, 70],
];

const LAST10_SLOTS = LAST10_RAW
  .map((coords, idx) => {
    const x1 = Math.min(coords[0], coords[2]);
    const x2 = Math.max(coords[0], coords[2]);
    return {
      index: idx,
      coords,
      centerX: (x1 + x2) / 2,
    };
  })
  .sort((a, b) => a.centerX - b.centerX);

const SCALE_X = SVG_W / 1024;
const SCALE_Y = SVG_H / 566;

function areaCenter(key: string): { x: number; y: number } | null {
  const r = RAW_AREAS[key];
  if (!r) return null;
  return {
    x: ((r[0] + r[2]) / 2) * SCALE_X,
    y: ((r[1] + r[3]) / 2) * SCALE_Y,
  };
}

function areaRect(
  key: string,
): { x1: number; y1: number; x2: number; y2: number } | null {
  const r = RAW_AREAS[key];
  if (!r) return null;
  return {
    x1: Math.min(r[0], r[2]) * SCALE_X,
    y1: Math.min(r[1], r[3]) * SCALE_Y,
    x2: Math.max(r[0], r[2]) * SCALE_X,
    y2: Math.max(r[1], r[3]) * SCALE_Y,
  };
}

function getChipPos(key: string): { x: number; y: number } | null {
  const c = areaCenter(key);
  if (c) return c;

  if (key.startsWith("split-")) {
    const nums = key.slice(6).split("-").map(Number);
    let sx = 0, sy = 0, count = 0;
    nums.forEach((n) => {
      const cc = areaCenter(String(n));
      if (cc) { sx += cc.x; sy += cc.y; count++; }
    });
    return count > 0 ? { x: sx / count, y: sy / count } : null;
  }

  if (key.startsWith("corner-")) {
    const nums = key.slice(7).split("-").map(Number);
    let sx = 0, sy = 0, count = 0;
    nums.forEach((n) => {
      const cc = areaCenter(String(n));
      if (cc) { sx += cc.x; sy += cc.y; count++; }
    });
    return count > 0 ? { x: sx / count, y: sy / count } : null;
  }

  if (key.startsWith("street-")) {
    const nums = key.slice(7).split("-").map(Number);
    if (nums.includes(0)) {
      let sx = 0, sy = 0, count = 0;
      nums.forEach((n) => {
        const cc = areaCenter(String(n));
        if (cc) { sx += cc.x; sy += cc.y; count++; }
      });
      return count > 0 ? { x: sx / count, y: sy / count } : null;
    } else {
      const bottomNum = nums.find((n) => TABLE_ROWS[2].includes(n));
      if (bottomNum !== undefined) {
        const r = areaRect(String(bottomNum));
        if (r) return { x: (r.x1 + r.x2) / 2, y: r.y2 };
      }
    }
  }

  if (key.startsWith("sixline-")) {
    const nums = key.slice(8).split("-").map(Number);
    const bottomNums = nums
      .filter((n) => TABLE_ROWS[2].includes(n))
      .sort((a, b) => a - b);
    if (bottomNums.length === 2) {
      const r1 = areaRect(String(bottomNums[0]));
      const r2 = areaRect(String(bottomNums[1]));
      if (r1 && r2) {
        return { x: (r1.x2 + r2.x1) / 2, y: (r1.y2 + r2.y2) / 2 };
      }
    }
  }

  const parts = key.split("-");
  const nums = parts.slice(1).map(Number);
  let sx = 0, sy = 0, count = 0;
  nums.forEach((n) => {
    const cc = areaCenter(String(n));
    if (cc) { sx += cc.x; sy += cc.y; count++; }
  });
  return count > 0 ? { x: sx / count, y: sy / count } : null;
}

// ─── Types ──────────────────────────────────────────────────────────────────
interface BetEntry {
  amount: number;
  chipCls: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const cloneBets = (source: Record<string, BetEntry>) =>
  Object.fromEntries(
    Object.entries(source).map(([key, bet]) => [key, { ...bet }]),
  ) as Record<string, BetEntry>;

const sumBets = (source: Record<string, BetEntry>) =>
  Object.values(source).reduce((sum, bet) => sum + bet.amount, 0);

function numColor(n: number | string): string {
  if (n === 0 || n === "0") return "#0e4a22";
  return RED_NUMS.has(Number(n)) ? "#8b1010" : "#141c28";
}

function lighten(hex: string, amt: number): string {
  const rv = Math.min(255, parseInt(hex.slice(1, 3), 16) + amt);
  const gv = Math.min(255, parseInt(hex.slice(3, 5), 16) + amt);
  const bv = Math.min(255, parseInt(hex.slice(5, 7), 16) + amt);
  return `rgb(${rv},${gv},${bv})`;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Roulette() {
  const { user, updateBalance, adjustBalance } = useFirebaseUser();
  const [balance, setBalance] = useState(20000);
  const initialRouletteSync = useRef(false);
  const [betVal, setBetVal] = useState(100);
  const [chipValue, setChipValue] = useState(1);
  const [chipCls, setChipCls] = useState("c1");
  const [bets, setBets] = useState<Record<string, BetEntry>>({});
  const [lastBets, setLastBets] = useState<Record<string, BetEntry>>({});
  const [totalBet, setTotalBet] = useState(0);
  const [betActive, setBetActive] = useState(false);
  const [prevResults, setPrevResults] = useState<number[]>([]);
  const [editMode, setEditMode] = useState(false);

  const [spinning, setSpinning] = useState(false);
  const [wheelExpanded, setWheelExpanded] = useState(false);
  const [sidePanelCollapsed, setSidePanelCollapsed] = useState(false);
  const [resultNum, setResultNum] = useState<number | null>(null);
  const [resultLabel, setResultLabel] = useState("PLACE YOUR BET");
  const [hoverTarget, setHoverTarget] = useState<
    | { key: string; rect: { left: number; top: number; width: number; height: number } }
    | null
  >(null);
  const [notif, setNotif] = useState<{ msg: string; type: string } | null>(null);

  const wheelCanvasRef = useRef<HTMLCanvasElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const chipCanvasRef = useRef<HTMLCanvasElement>(null);
  const tableWrapRef = useRef<HTMLDivElement>(null);
  const chipImagesRef = useRef<Record<string, HTMLImageElement>>({});
  const prevResultsRef = useRef<number[]>(prevResults);

  const wheelAngleRef = useRef(0);
  const ballAngleRef = useRef(POINTER_ANGLE);
  const betsRef = useRef(bets);
  const lastBetsRef = useRef(lastBets);
  const chipValueRef = useRef(chipValue);
  const chipClsRef = useRef(chipCls);
  const betActiveRef = useRef(betActive);
  const balanceRef = useRef(balance);
  const totalBetRef = useRef(totalBet);
  const spinningRef = useRef(false);
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { betsRef.current = bets; }, [bets]);
  useEffect(() => { lastBetsRef.current = lastBets; }, [lastBets]);
  useEffect(() => { chipValueRef.current = chipValue; }, [chipValue]);
  useEffect(() => { chipClsRef.current = chipCls; }, [chipCls]);
  useEffect(() => { betActiveRef.current = betActive; }, [betActive]);
  useEffect(() => { balanceRef.current = balance; }, [balance]);
  useEffect(() => { totalBetRef.current = totalBet; }, [totalBet]);
  useEffect(() => { prevResultsRef.current = prevResults; }, [prevResults]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("roulette-balance", String(balance));
  }, [balance]);

  useEffect(() => {
    if (initialRouletteSync.current) return;
    let nextBalance = 20000;
    const stored = window.localStorage.getItem("roulette-balance");
    const parsed = stored ? Number(stored) : NaN;
    if (Number.isFinite(parsed)) nextBalance = parsed;
    if (user && typeof user.balances?.roulette === "number") {
      nextBalance = user.balances.roulette;
    }
    setBalance(nextBalance);
    balanceRef.current = nextBalance;
    initialRouletteSync.current = true;
  }, [user]);

  useEffect(() => {
    if (!user || !initialRouletteSync.current) return;
    if (typeof user.balances?.roulette !== "number") return;
    if (user.balances.roulette !== balance) {
      updateBalance("roulette", balance);
    }
  }, [balance, user, updateBalance]);

  const editModeRef = useRef(editMode);
  useEffect(() => { editModeRef.current = editMode; }, [editMode]);

  const showNotif = useCallback((msg: string, type: string) => {
    setNotif({ msg, type });
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    notifTimerRef.current = setTimeout(() => setNotif(null), 3500);
  }, []);

  const syncWheelCanvas = useCallback(() => {
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
  }, []);

  const drawWheel = useCallback((angle: number) => {
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const CW = canvas.width;
    const CH = canvas.height;
    const size = Math.min(CW, CH);
    const CX = size / 2;
    const CY = size / 2;
    const R = size / 2 - 5;
    ctx.clearRect(0, 0, CW, CH);

    const rimGrad = ctx.createRadialGradient(CX - R * 0.12, CY - R * 0.12, R - R * 0.09, CX, CY, R + R * 0.02);
    rimGrad.addColorStop(0, "#5a5a5a");
    rimGrad.addColorStop(0.4, "#2a2a2a");
    rimGrad.addColorStop(1, "#080808");
    ctx.beginPath();
    ctx.arc(CX, CY, R + 4, 0, 2 * Math.PI);
    ctx.fillStyle = rimGrad;
    ctx.fill();

    const BO = R - 2, BI = R - Math.round(R * 0.206);
    for (let i = 0; i < NUM_SEGS; i++) {
      const s = angle + i * SEG_ANGLE - Math.PI / 2, e = s + SEG_ANGLE, num = WHEEL_ORDER[i];
      ctx.beginPath();
      ctx.moveTo(CX + BI * Math.cos(s), CY + BI * Math.sin(s));
      ctx.arc(CX, CY, BO, s, e);
      ctx.arc(CX, CY, BI, e, s, true);
      ctx.closePath();
      const midA = s + SEG_ANGLE / 2, shade = 0.82 + 0.18 * Math.cos(midA), base = numColor(num);
      const rv = parseInt(base.slice(1, 3), 16), gv = parseInt(base.slice(3, 5), 16), bv = parseInt(base.slice(5, 7), 16);
      ctx.fillStyle = `rgb(${Math.round(rv * shade)},${Math.round(gv * shade)},${Math.round(bv * shade)})`;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(CX + BI * Math.cos(s), CY + BI * Math.sin(s));
      ctx.lineTo(CX + BO * Math.cos(s), CY + BO * Math.sin(s));
      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      ctx.lineWidth = 1;
      ctx.stroke();
      const mid = s + SEG_ANGLE / 2, lR = BI + (BO - BI) / 2;
      ctx.save();
      ctx.translate(CX + lR * Math.cos(mid), CY + lR * Math.sin(mid));
      ctx.rotate(mid + Math.PI / 2);
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.max(10, Math.round(R * 0.055))}px "Orbitron",monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = Math.max(2, Math.round(R * 0.02));
      ctx.fillText(String(num), 0, 0);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    const TR = BI - 2;
    ctx.beginPath();
    ctx.arc(CX, CY, TR, 0, 2 * Math.PI);
    const tG = ctx.createRadialGradient(CX, CY, TR - 30, CX, CY, TR);
    tG.addColorStop(0, "#1a1a1a");
    tG.addColorStop(1, "#2e2e2e");
    ctx.fillStyle = tG;
    ctx.fill();
    ctx.strokeStyle = "#3a3a3a";
    ctx.lineWidth = 2;
    ctx.stroke();
    for (let i = 0; i < NUM_SEGS; i++) {
      const a = angle + i * SEG_ANGLE - Math.PI / 2;
      const fx = CX + (TR - 2) * Math.cos(a), fy = CY + (TR - 2) * Math.sin(a);
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(a);
      ctx.fillStyle = "#888";
      ctx.beginPath();
      ctx.moveTo(0, -3);
      ctx.lineTo(2, 0);
      ctx.lineTo(0, 3);
      ctx.lineTo(-2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    const CR = TR - 20;
    ctx.beginPath();
    ctx.arc(CX, CY, CR, 0, 2 * Math.PI);
    const cG = ctx.createRadialGradient(CX - R * 0.06, CY - R * 0.06, R * 0.03, CX, CY, CR);
    cG.addColorStop(0, "#2a2a2a");
    cG.addColorStop(0.6, "#141414");
    cG.addColorStop(1, "#0a0a0a");
    ctx.fillStyle = cG;
    ctx.fill();
    for (let i = 0; i < 8; i++) {
      const a = angle + i * (Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.lineTo(CX + (CR - 2) * Math.cos(a), CY + (CR - 2) * Math.sin(a));
      ctx.strokeStyle = "rgba(60,60,60,0.6)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    const hubG = ctx.createRadialGradient(CX - R * 0.047, CY - R * 0.047, R * 0.012, CX, CY, R * 0.154);
    hubG.addColorStop(0, "#444");
    hubG.addColorStop(0.5, "#1a1a1a");
    hubG.addColorStop(1, "#080808");
    ctx.beginPath();
    ctx.arc(CX, CY, R * 0.16, 0, 2 * Math.PI);
    ctx.fillStyle = hubG;
    ctx.fill();
    ctx.strokeStyle = "#3a3a3a";
    ctx.lineWidth = Math.max(1.5, R * 0.01);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(CX, CY, R * 0.085, 0, 2 * Math.PI);
    ctx.strokeStyle = "#2a2a2a";
    ctx.lineWidth = Math.max(1, R * 0.0075);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(CX - R * 0.047, CY - R * 0.047, R * 0.047, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fill();
  }, []);

  const setBallPosition = useCallback((angle: number, radius: number) => {
    const canvas = wheelCanvasRef.current;
    const ball = ballRef.current;
    if (!canvas || !ball) return;
    const rect = canvas.getBoundingClientRect();
    const wheelSize = Math.min(rect.width, rect.height);
    const wheelCenter = wheelSize / 2;
    const x = wheelCenter + Math.cos(angle) * radius;
    const y = wheelCenter + Math.sin(angle) * radius;
    ball.style.left = `${x}px`;
    ball.style.top = `${y}px`;
    ball.style.transform = "translate(-50%, -50%)";
  }, []);

  useEffect(() => {
    syncWheelCanvas();
    drawWheel(0);
    const rect = wheelCanvasRef.current?.getBoundingClientRect();
    if (rect) {
      const wheelCenter = Math.min(rect.width, rect.height) / 2;
      const BALL_INNER = wheelCenter - 18;
      const BALL_FINAL = BALL_INNER - 6;
      setBallPosition(POINTER_ANGLE, BALL_FINAL);
    }
  }, [drawWheel, syncWheelCanvas, setBallPosition]);

  useEffect(() => {
    syncWheelCanvas();
    drawWheel(wheelAngleRef.current);
    const rect = wheelCanvasRef.current?.getBoundingClientRect();
    if (rect) {
      const wheelCenter = Math.min(rect.width, rect.height) / 2;
      const BALL_INNER = wheelCenter - 18;
      const BALL_FINAL = BALL_INNER - 6;
      setBallPosition(POINTER_ANGLE, BALL_FINAL);
    }
  }, [wheelExpanded, syncWheelCanvas, drawWheel, setBallPosition]);

  const renderChips = useCallback(
    (currentBets: Record<string, BetEntry>, last10: number[]) => {
      const canvas = chipCanvasRef.current;
      const wrap = tableWrapRef.current;
      if (!canvas || !wrap) return;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const displayW = wrap.clientWidth;
      const displayH = wrap.clientHeight;
      const scaleX = displayW / SVG_W;
      const scaleY = displayH / SVG_H;

      const slotSizes = LAST10_SLOTS.slice(0, 10)
        .map((slot) => {
          if (!slot) return null;
          const x1 = Math.min(slot.coords[0], slot.coords[2]) * SCALE_X * scaleX;
          const y1 = Math.min(slot.coords[1], slot.coords[3]) * SCALE_Y * scaleY;
          const x2 = Math.max(slot.coords[0], slot.coords[2]) * SCALE_X * scaleX;
          const y2 = Math.max(slot.coords[1], slot.coords[3]) * SCALE_Y * scaleY;
          return { w: x2 - x1, h: y2 - y1 };
        })
        .filter((s): s is { w: number; h: number } => Boolean(s));
      const fixedW = Math.max(18, Math.min(...slotSizes.map((s) => s.w)) * 0.88);
      const fixedH = Math.max(18, Math.min(...slotSizes.map((s) => s.h)) * 0.88);

      last10.slice(0, 10).forEach((n, i) => {
        const raw = LAST10_SLOTS[i]?.coords;
        if (!raw) return;
        const x1 = Math.min(raw[0], raw[2]) * SCALE_X * scaleX;
        const y1 = Math.min(raw[1], raw[3]) * SCALE_Y * scaleY;
        const x2 = Math.max(raw[0], raw[2]) * SCALE_X * scaleX;
        const y2 = Math.max(raw[1], raw[3]) * SCALE_Y * scaleY;
        const cx = x1 + (x2 - x1) / 2;
        const cy = y1 + (y2 - y1) / 2;
        const bw = fixedW;
        const bh = fixedH;
        const px = cx - bw / 2;
        const py = cy - bh / 2;

        const bgCol = n === 0 ? "#1a6b35" : RED_NUMS.has(n) ? "#8b1010" : "#141c28";
        ctx.fillStyle = bgCol;
        ctx.beginPath();
        ctx.roundRect(px, py, bw, bh, 3);
        ctx.fill();

        ctx.strokeStyle = i === 0 ? "#7ce5cc" : "#838383";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(px, py, bw, bh, 3);
        ctx.stroke();

        const fontSize = Math.max(7, Math.min(11, bh * 0.52));
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${fontSize}px "Orbitron",monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(n), cx, cy);
      });

      const drawChipAt = (svgX: number, svgY: number, amount: number, cls: string) => {
        const cx = svgX * scaleX;
        const cy = svgY * scaleY;
        const img = chipImagesRef.current[cls];
        const rad = 19;

        if (img && img.complete && img.naturalWidth !== 0) {
          ctx.beginPath();
          ctx.arc(cx, cy + 2, rad, 0, 2 * Math.PI);
          ctx.fillStyle = "rgba(0,0,0,0.4)";
          ctx.fill();
          ctx.drawImage(img, cx - rad, cy - rad, rad * 2, rad * 2);
        } else {
          const col = CHIP_COLORS[cls] || "#555";
          ctx.beginPath();
          ctx.arc(cx, cy + 2, rad, 0, 2 * Math.PI);
          ctx.fillStyle = "rgba(0,0,0,0.4)";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cx, cy, rad, 0, 2 * Math.PI);
          const g = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, rad);
          g.addColorStop(0, lighten(col, 50));
          g.addColorStop(1, col);
          ctx.fillStyle = g;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cx, cy, rad - 4, 0, 2 * Math.PI);
          ctx.strokeStyle = "rgba(255,255,255,0.25)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        const lbl = amount >= 1000 ? (amount / 1000).toFixed(0) + "K" : String(amount);
        ctx.fillStyle = "#fff";
        ctx.font = 'bold 11px "Orbitron",monospace';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "rgba(39, 39, 39, 0.35)";
        ctx.lineWidth = 5;
        ctx.strokeText(lbl, cx, cy);
        ctx.fillText(lbl, cx, cy);
      };

      for (const [key, bet] of Object.entries(currentBets)) {
        const pos = getChipPos(key);
        if (pos) drawChipAt(pos.x, pos.y, bet.amount, bet.chipCls);
      }
    },
    [],
  );

  const syncCanvas = useCallback(() => {
    const canvas = chipCanvasRef.current;
    const wrap = tableWrapRef.current;
    if (!canvas || !wrap) return;
    canvas.width = wrap.clientWidth;
    canvas.height = wrap.clientHeight;
    canvas.style.width = wrap.clientWidth + "px";
    canvas.style.height = wrap.clientHeight + "px";
  }, []);

  useEffect(() => {
    const urls: Record<string, string> = {
      c1: "/roulette/1_chip.svg",
      c2: "/roulette/2_chip.svg",
      c5: "/roulette/5_chip.svg",
      c25: "/roulette/25_chip.svg",
      c50: "/roulette/50_chip.svg",
      c100: "/roulette/100_chip.svg",
    };
    const images: Record<string, HTMLImageElement> = {};
    Object.entries(urls).forEach(([cls, url]) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        if (tableWrapRef.current) renderChips(betsRef.current, prevResultsRef.current);
      };
      images[cls] = img;
    });
    chipImagesRef.current = images;
  }, [renderChips]);

  useEffect(() => {
    const t = setTimeout(() => {
      syncCanvas();
      syncWheelCanvas();
      drawWheel(wheelAngleRef.current);
      renderChips(betsRef.current, prevResultsRef.current);
    }, 120);
    const onResize = () =>
      setTimeout(() => {
        syncCanvas();
        syncWheelCanvas();
        drawWheel(wheelAngleRef.current);
        renderChips(betsRef.current, prevResultsRef.current);
      }, 120);
    window.addEventListener("resize", onResize);
    return () => { clearTimeout(t); window.removeEventListener("resize", onResize); };
  }, [syncCanvas, syncWheelCanvas, drawWheel, renderChips]);

  useEffect(() => {
    const t = setTimeout(() => renderChips(bets, prevResultsRef.current), 30);
    return () => clearTimeout(t);
  }, [bets, renderChips]);

  useEffect(() => {
    const t = setTimeout(() => {
      syncCanvas();
      renderChips(betsRef.current, prevResultsRef.current);
    }, 260);
    return () => clearTimeout(t);
  }, [sidePanelCollapsed, syncCanvas, renderChips]);

  useEffect(() => {
    if (prevResults.length > 0) {
      const t = setTimeout(() => renderChips(betsRef.current, prevResults), 30);
      return () => clearTimeout(t);
    }
  }, [prevResults, renderChips]);

  // ── Add bet ───────────────────────────────────────────────────────────────
  const addBet = useCallback((key: string) => {
    const amount = chipValueRef.current;
    const currentBet = betsRef.current[key];

    if (currentBet) {
      if (!editModeRef.current) {
        if (balanceRef.current < amount) {
          showNotif("Insufficient balance!", "lose");
          return;
        }
        const next = cloneBets(betsRef.current);
        next[key] = { amount: next[key].amount + amount, chipCls: chipClsRef.current };
        const nextBalance = balanceRef.current - amount;
        const nextTotal = totalBetRef.current + amount;
        betsRef.current = next;
        balanceRef.current = nextBalance;
        totalBetRef.current = nextTotal;
        betActiveRef.current = true;
        setBets(next);
        setBalance(nextBalance);
        setTotalBet(nextTotal);
        setBetActive(true);
        showNotif("Added more chips to this bet.", "win");
        return;
      }

      const next = cloneBets(betsRef.current);
      const removeAmount = Math.min(amount, next[key].amount);
      const updatedAmount = next[key].amount - removeAmount;
      if (updatedAmount <= 0) {
        delete next[key];
      } else {
        next[key] = { amount: updatedAmount, chipCls: next[key].chipCls };
      }
      const nextBalance = balanceRef.current + removeAmount;
      const nextTotal = Math.max(0, totalBetRef.current - removeAmount);
      betsRef.current = next;
      balanceRef.current = nextBalance;
      totalBetRef.current = nextTotal;
      betActiveRef.current = Object.keys(next).length > 0;
      setBets(next);
      setBalance(nextBalance);
      setTotalBet(nextTotal);
      setBetActive(Object.keys(next).length > 0);
      showNotif("Removed bet in edit mode.", "");
      return;
    }

    if (balanceRef.current < amount) {
      showNotif("Insufficient balance!", "lose");
      return;
    }
    const next = cloneBets(betsRef.current);
    next[key] = { amount, chipCls: chipClsRef.current };
    const nextBalance = balanceRef.current - amount;
    const nextTotal = totalBetRef.current + amount;
    betsRef.current = next;
    balanceRef.current = nextBalance;
    totalBetRef.current = nextTotal;
    betActiveRef.current = true;
    setBets(next);
    setBalance(nextBalance);
    setTotalBet(nextTotal);
    setBetActive(true);
  }, [showNotif]);

  const clearBets = useCallback(() => {
    const currentTotal = totalBetRef.current;
    if (currentTotal > 0 && !spinningRef.current) {
      const snapshot = cloneBets(betsRef.current);
      if (Object.keys(snapshot).length > 0) {
        lastBetsRef.current = snapshot;
        setLastBets(snapshot);
      }
      const nextBalance = balanceRef.current + currentTotal;
      balanceRef.current = nextBalance;
      setBalance(nextBalance);
    }
    betsRef.current = {};
    totalBetRef.current = 0;
    betActiveRef.current = false;
    setBets({});
    setTotalBet(0);
    setBetActive(false);
  }, []);

  const repeatBets = useCallback(() => {
    const repeat = cloneBets(lastBetsRef.current);
    const repeatTotal = sumBets(repeat);
    if (repeatTotal <= 0) {
      showNotif("No previous bets to repeat.", "");
      return;
    }
    if (balanceRef.current < repeatTotal) {
      showNotif("Insufficient balance!", "lose");
      return;
    }
    const next = cloneBets(betsRef.current);
    Object.entries(repeat).forEach(([key, bet]) => {
      if (!next[key]) next[key] = { amount: 0, chipCls: bet.chipCls };
      next[key] = { amount: next[key].amount + bet.amount, chipCls: bet.chipCls };
    });
    const nextBalance = balanceRef.current - repeatTotal;
    const nextTotal = totalBetRef.current + repeatTotal;
    betsRef.current = next;
    balanceRef.current = nextBalance;
    totalBetRef.current = nextTotal;
    betActiveRef.current = true;
    setBets(next);
    setBalance(nextBalance);
    setTotalBet(nextTotal);
    setBetActive(true);
    showNotif("Repeated bets: " + fmt(repeatTotal), "win");
  }, [showNotif]);

  const BORDER_T = 9;

  const rectUnion = (rects: { x1: number; y1: number; x2: number; y2: number }[]) => {
    if (!rects.length) return null;
    return {
      x1: Math.min(...rects.map((r) => r.x1)),
      y1: Math.min(...rects.map((r) => r.y1)),
      x2: Math.max(...rects.map((r) => r.x2)),
      y2: Math.max(...rects.map((r) => r.y2)),
    };
  };

  const getBetRect = useCallback((key: string) => {
    const direct = areaRect(key);
    if (direct) return direct;
    for (const prefix of ["split-", "street-", "corner-", "sixline-"]) {
      if (!key.startsWith(prefix)) continue;
      const nums = key.slice(prefix.length).split("-").map(Number);
      const rects = nums
        .map((n) => areaRect(String(n)))
        .filter((r): r is { x1: number; y1: number; x2: number; y2: number } => Boolean(r));
      return rectUnion(rects);
    }
    return null;
  }, []);

  const computeHitArea = useCallback((mx: number, my: number) => {
    for (const key of Object.keys(RAW_AREAS)) {
      const r = areaRect(key);
      if (!r) continue;
      if (mx >= r.x1 && mx <= r.x2 && my >= r.y1 && my <= r.y2) {
        return { key, rect: r };
      }
    }
    return null;
  }, []);

  const resolveTableBet = useCallback(
    (hitKey: string, hitR: { x1: number; y1: number; x2: number; y2: number }, mx: number, my: number) => {
      if (!/^\d+$/.test(hitKey)) return { key: hitKey, rect: hitR };

      const num = parseInt(hitKey, 10);
      if (num === 0) {
        const relX = mx - hitR.x1;
        const cellW = hitR.x2 - hitR.x1;
        const atRight = relX > cellW - BORDER_T;
        if (atRight) {
          const target = my < 194 ? "split-0-3" : my < 260 ? "split-0-2" : "split-0-1";
          const targetRect = getBetRect(target) ?? hitR;
          return { key: target, rect: targetRect };
        }
        return { key: "0", rect: hitR };
      }

      const relX = mx - hitR.x1;
      const relY = my - hitR.y1;
      const cellW = hitR.x2 - hitR.x1;
      const cellH = hitR.y2 - hitR.y1;
      const atLeft = relX < BORDER_T;
      const atRight = relX > cellW - BORDER_T;
      const atTop = relY < BORDER_T;
      const atBottom = relY > cellH - BORDER_T;

      const rowIdx = TABLE_ROWS.findIndex((row) => row.includes(num));
      const colIdx = rowIdx >= 0 ? TABLE_ROWS[rowIdx].indexOf(num) : -1;
      if (rowIdx < 0 || colIdx < 0) return { key: hitKey, rect: hitR };

      if ((atLeft || atRight) && (atTop || atBottom)) {
        const adjRow = atTop ? rowIdx - 1 : rowIdx + 1;
        const adjCol = atLeft ? colIdx - 1 : colIdx + 1;

        if (adjRow >= 0 && adjRow < 3 && adjCol >= 0 && adjCol < 12) {
          const n2 = TABLE_ROWS[rowIdx][adjCol];
          const n3 = TABLE_ROWS[adjRow][colIdx];
          const n4 = TABLE_ROWS[adjRow][adjCol];
          const nums = [num, n2, n3, n4].sort((a, b) => a - b);
          const target = "corner-" + nums.join("-");
          return { key: target, rect: getBetRect(target) ?? hitR };
        }
        if (adjCol === -1 && adjRow >= 0 && adjRow < 3) {
          const n2 = TABLE_ROWS[adjRow][colIdx];
          const nums = [0, num, n2].sort((a, b) => a - b);
          const target = "street-" + nums.join("-");
          return { key: target, rect: getBetRect(target) ?? hitR };
        }
        if ((adjRow === -1 || adjRow === 3) && adjCol >= 0 && adjCol < 12) {
          const nums1 = [TABLE_ROWS[0][colIdx], TABLE_ROWS[1][colIdx], TABLE_ROWS[2][colIdx]];
          const nums2 = [TABLE_ROWS[0][adjCol], TABLE_ROWS[1][adjCol], TABLE_ROWS[2][adjCol]];
          const allNums = [...nums1, ...nums2].sort((a, b) => a - b);
          const target = "sixline-" + allNums.join("-");
          return { key: target, rect: getBetRect(target) ?? hitR };
        }
        if (adjCol === -1) {
          const target = "split-0-" + num;
          return { key: target, rect: getBetRect(target) ?? hitR };
        }
      }

      if (atTop || atBottom) {
        const adjRow = atTop ? rowIdx - 1 : rowIdx + 1;
        if (adjRow >= 0 && adjRow < 3) {
          const nb = TABLE_ROWS[adjRow][colIdx];
          const target = "split-" + Math.min(num, nb) + "-" + Math.max(num, nb);
          return { key: target, rect: getBetRect(target) ?? hitR };
        }
        const nums = [TABLE_ROWS[0][colIdx], TABLE_ROWS[1][colIdx], TABLE_ROWS[2][colIdx]].sort((a, b) => a - b);
        const target = "street-" + nums.join("-");
        return { key: target, rect: getBetRect(target) ?? hitR };
      }

      if (atLeft || atRight) {
        const adjCol = atLeft ? colIdx - 1 : colIdx + 1;
        if (adjCol >= 0 && adjCol < 12) {
          const nb = TABLE_ROWS[rowIdx][adjCol];
          const target = "split-" + Math.min(num, nb) + "-" + Math.max(num, nb);
          return { key: target, rect: getBetRect(target) ?? hitR };
        }
        if (adjCol === -1) {
          const target = "split-0-" + num;
          return { key: target, rect: getBetRect(target) ?? hitR };
        }
      }

      return { key: hitKey, rect: hitR };
    },
    [getBetRect],
  );

  const onTableClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (spinningRef.current) {
        showNotif("No more bets while spinning.", "");
        return;
      }
      const wrap = tableWrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const displayW = wrap.clientWidth;
      const displayH = wrap.clientHeight;
      const mx = ((e.clientX - rect.left) / displayW) * SVG_W;
      const my = ((e.clientY - rect.top) / displayH) * SVG_H;
      const hit = computeHitArea(mx, my);
      if (!hit) return;
      const resolved = resolveTableBet(hit.key, hit.rect, mx, my);
      if (!resolved) return;
      addBet(resolved.key);
    },
    [addBet, computeHitArea, resolveTableBet, showNotif],
  );

  const onTableHover = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const wrap = tableWrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const displayW = wrap.clientWidth;
      const displayH = wrap.clientHeight;
      const mx = ((e.clientX - rect.left) / displayW) * SVG_W;
      const my = ((e.clientY - rect.top) / displayH) * SVG_H;
      const hit = computeHitArea(mx, my);
      if (!hit) { setHoverTarget(null); return; }
      const resolved = resolveTableBet(hit.key, hit.rect, mx, my);
      if (!resolved) { setHoverTarget(null); return; }
      const scaleX = displayW / SVG_W;
      const scaleY = displayH / SVG_H;
      setHoverTarget({
        key: resolved.key,
        rect: {
          left: resolved.rect.x1 * scaleX,
          top: resolved.rect.y1 * scaleY,
          width: (resolved.rect.x2 - resolved.rect.x1) * scaleX,
          height: (resolved.rect.y2 - resolved.rect.y1) * scaleY,
        },
      });
    },
    [computeHitArea, resolveTableBet],
  );

  const calcWin = useCallback((key: string, winNum: number): number => {
    if (key === String(winNum)) return 35;
    if (key.startsWith("split-")) return key.slice(6).split("-").map(Number).includes(winNum) ? 17 : 0;
    if (key.startsWith("street-")) return key.slice(7).split("-").map(Number).includes(winNum) ? 11 : 0;
    if (key.startsWith("corner-")) return key.slice(7).split("-").map(Number).includes(winNum) ? 8 : 0;
    if (key.startsWith("sixline-")) return key.slice(8).split("-").map(Number).includes(winNum) ? 5 : 0;
    if (key.startsWith("col-")) {
      const ri = parseInt(key.slice(4));
      return winNum > 0 && TABLE_ROWS[ri]?.includes(winNum) ? 2 : 0;
    }
    if (key === "doz-1" && winNum >= 1 && winNum <= 12) return 2;
    if (key === "doz-2" && winNum >= 13 && winNum <= 24) return 2;
    if (key === "doz-3" && winNum >= 25 && winNum <= 36) return 2;
    if (key === "1to18" && winNum >= 1 && winNum <= 18) return 1;
    if (key === "19to36" && winNum >= 19 && winNum <= 36) return 1;
    if (key === "even" && winNum > 0 && winNum % 2 === 0) return 1;
    if (key === "odd" && winNum > 0 && winNum % 2 !== 0) return 1;
    if (key === "red" && RED_NUMS.has(winNum)) return 1;
    if (key === "black" && winNum > 0 && !RED_NUMS.has(winNum)) return 1;
    return 0;
  }, []);

  const spin = useCallback(() => {
    if (spinningRef.current) return;
    if (!betActiveRef.current) {
      showNotif("Place a bet first!", "");
      return;
    }
    spinningRef.current = true;
    setSpinning(true);
    setWheelExpanded(true);
    setResultNum(null);
    setResultLabel("SPINNING…");
    const spinBets = cloneBets(betsRef.current);
    lastBetsRef.current = spinBets;
    setLastBets(spinBets);

    const winSegIdx = Math.floor(Math.random() * NUM_SEGS);
    const chosenWinNum = WHEEL_ORDER[winSegIdx];

    const normalizeAngle = (a: number) => {
      const full = 2 * Math.PI;
      return ((a % full) + full) % full;
    };
    const pointerIndexFromAngle = (wheelAngle: number) => {
      const norm = normalizeAngle(wheelAngle);
      const raw = -(norm + SEG_ANGLE / 2) / SEG_ANGLE;
      const rounded = Math.round(raw);
      return ((rounded % NUM_SEGS) + NUM_SEGS) % NUM_SEGS;
    };

    const curWA = wheelAngleRef.current;
    const extraWheelSpins = (6 + Math.floor(Math.random() * 4)) * 2 * Math.PI;
    const targetWA = -(winSegIdx * SEG_ANGLE + SEG_ANGLE / 2);
    const delta = normalizeAngle(targetWA - curWA);
    let finalWA = curWA + extraWheelSpins + delta;

    const finalTargetIndex = pointerIndexFromAngle(finalWA);
    if (finalTargetIndex !== winSegIdx) {
      finalWA += (winSegIdx - finalTargetIndex) * SEG_ANGLE;
    }

    const initBA = ballAngleRef.current;
    const extraBallSpins = (12 + Math.floor(Math.random() * 6)) * 2 * Math.PI;

    const rect = wheelCanvasRef.current?.getBoundingClientRect();
    const wheelSize = rect ? Math.min(rect.width, rect.height) : 340;
    const wheelCenter = wheelSize / 2;
    const BALL_OUTER = wheelCenter - 7;
    const BALL_INNER = wheelCenter - 18;
    const BALL_FINAL = BALL_INNER - 6;

    const duration = 6000 + Math.random() * 2000;
    const startWA = curWA;
    let startTime: number | null = null;

    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed = Math.min(ts - startTime, duration);
      const prog = elapsed / duration;

      const eW = 1 - Math.pow(1 - prog, 4);
      const wAngle = startWA + eW * (finalWA - startWA);
      wheelAngleRef.current = wAngle;
      drawWheel(wAngle);

      const tBall = Math.min(prog / 0.88, 1);
      const eB = 1 - Math.pow(1 - tBall, 3);
      const bAngle = initBA - eB * extraBallSpins;
      ballAngleRef.current = bAngle;

      const inward = Math.max(0, (prog - 0.65) / 0.35);
      const bRad = BALL_OUTER - inward * (BALL_OUTER - BALL_INNER);

      const ball = ballRef.current;
      if (ball) setBallPosition(bAngle, bRad);

      if (prog < 1) {
        requestAnimationFrame(animate);
      } else {
        const ball2 = ballRef.current;
        if (ball2) {
          setBallPosition(POINTER_ANGLE, BALL_FINAL);
          ballAngleRef.current = POINTER_ANGLE;
        }

        wheelAngleRef.current = finalWA;
        drawWheel(finalWA);
        const winNum = chosenWinNum;
        spinningRef.current = false;
        setSpinning(false);
        setResultNum(winNum);
        setResultLabel(winNum === 0 ? "GREEN" : RED_NUMS.has(winNum) ? "RED" : "BLACK");
        setTimeout(() => {
          let winAmt = 0;
          for (const [key, bet] of Object.entries(betsRef.current)) {
            const m = calcWin(key, winNum);
            if (m > 0) winAmt += bet.amount * (m + 1);
          }
          if (winAmt > 0) {
            setBalance((prev) => {
              const n = prev + winAmt;
              balanceRef.current = n;
              return n;
            });
            showNotif("🎉 You won " + fmt(winAmt) + "!", "win");
          } else {
            showNotif("No win. Number: " + winNum, "lose");
          }
          setPrevResults((prev) => {
            const next = [winNum, ...prev].slice(0, 10);
            prevResultsRef.current = next;
            setTimeout(() => renderChips(betsRef.current, next), 50);
            return next;
          });
          setBetActive(false);
          betsRef.current = {};
          totalBetRef.current = 0;
          betActiveRef.current = false;
          setBets({});
          setTotalBet(0);
          setTimeout(() => setWheelExpanded(false), 2500);
        }, 600);
      }
    };
    requestAnimationFrame(animate);
  }, [drawWheel, showNotif, calcWin, renderChips, setBallPosition]);

  const resultColor =
    resultNum === null
      ? "#d8dde5"
      : resultNum === 0
        ? "#27c76b"
        : RED_NUMS.has(resultNum)
          ? "#e74c3c"
          : "#9aa3b0";

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      suppressHydrationWarning
      style={{
        background: "#080c10",
        color: "#d8dde5",
        fontFamily: "Cinzel, serif",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Montserrat:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0b0e14; }
        ::-webkit-scrollbar-thumb { background: #1e2530; border-radius: 3px; }

        .notif {
          position: fixed; top: 14px; left: 50%;
          transform: translateX(-50%) translateY(-10px);
          background: #13181f; border: 1px solid #252d3a;
          border-radius: 10px; padding: 10px 24px;
          font-family: "Montserrat", sans-serif; font-size: 0.9rem;
          font-weight: 700; color: #fff; z-index: 9999;
          opacity: 0; transition: opacity .25s, transform .25s;
          pointer-events: none; white-space: nowrap;
        }
        .notif.show { opacity: 1; transform: translateX(-50%) translateY(0); }
        .notif.win  { border-color: #1db954; color: #27c76b; }
        .notif.lose { border-color: #c0392b; color: #e74c3c; }

        .mobile-header    { display: none; }
        .desktop-only-balance { display: flex; }

        .game-layout {
          display: flex;
          flex-direction: row;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        .side-panel {
          width: 260px;
          min-width: 200px;
          min-height: 0;
          max-height: 100vh;
          flex-shrink: 0;
          background: rgba(15,19,24,0.96);
          border-right: 1px solid rgba(30,37,48,0.9);
          box-shadow: inset 2px 0 30px rgba(255,255,255,0.02);
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow-y: auto;
          transition: width .18s ease, min-width .18s ease, padding .18s ease, background .18s ease, box-shadow .18s ease;
          font-size: 0.95rem;
        }

        .side-panel-toggle {
          width: 100%;
          min-height: 42px;
          border: 1px solid rgba(37,45,58,0.95);
          border-radius: 12px;
          background: linear-gradient(180deg, rgba(17,24,33,0.95) 0%, rgba(18,26,36,0.92) 100%);
          color: #d8dde5;
          cursor: pointer;
          font-family: "Montserrat", sans-serif;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: transform .18s ease, background .18s ease, box-shadow .18s ease;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
        }

        .side-panel-toggle:hover {
          background: linear-gradient(180deg, rgba(31,39,51,0.98) 0%, rgba(22,30,40,0.96) 100%);
          transform: translateY(-1px);
        }

        .side-panel-toggle img {
          transition: transform .18s ease, filter .18s ease, opacity .18s ease;
        }

        .side-panel-body {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow: visible;
          max-height: none;
          opacity: 1;
          transform: translateX(0);
          transition: max-height .22s ease, opacity .18s ease, transform .18s ease;
        }

        .table-total-bet {
          position: absolute;
          top: 4.5%;
          right: 5.5%;
          z-index: 30;
          display: inline-flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
          padding: 10px 14px;
          background: rgba(11, 14, 20, 0.96);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.35);
          min-width: 130px;
        }
        .table-total-bet .total-bet-label {
          font-size: 0.65rem;
          font-family: 'Orbitron', monospace;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #96a0b8;
        }
        .table-total-bet .total-bet-value {
          font-size: 1rem;
          font-family: 'Orbitron', monospace;
          color: #f5c842;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .side-panel.side-panel-collapsed {
          width: 50px;
          min-width: 50px;
          padding: 10px 6px;
          overflow: visible;
        }

        .side-panel.side-panel-collapsed .side-panel-body {
          max-height: 0;
          opacity: 0;
          transform: translateX(-16px);
          pointer-events: none;
        }

        .side-panel.side-panel-collapsed .side-panel-toggle {
          width: 36px;
          aspect-ratio: 1;
          min-height: 36px;
          padding: 0;
        }

        .main-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 12px 18px;
          overflow-y: auto;
          min-width: 0;
        }

        .game-container {
          position: relative;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 1450px;
          margin: 0 auto;
        }

        .table-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 0;
          width: 100%;
        }

        .svg-wrap {
          position: relative;
          width: 100%;
        }
        .svg-wrap > img { width: 100%; height: auto; display: block; user-select: none; }

        .table-inner-wrap {
          position: relative;
          width: 100%;
        }

        .wheel-section {
          position: absolute;
          left: 4.5%;
          top: 50%;
          transform: translateY(-50%);
          z-index: 20;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          width: fit-content;
        }

        .wheel-wrap {
          position: relative;
          width: clamp(320px, 34vw, 520px);
          height: clamp(320px, 34vw, 520px);
          flex-shrink: 0;
        }
        .wheel-wrap canvas { width: 100% !important; height: 100% !important; border-radius: 50%; display: block; }

        .result-number { font-family: "Cinzel",serif; letter-spacing: 2px; font-size: 46px; font-weight: 900; line-height: 1; }
        .result-label  { font-family: "Cinzel",serif; font-size: 15px; font-weight: 700; letter-spacing: 3px; }
        .spin-btn      { width: 260px; margin-top: 10px; }

        .chip-canvas {
          position: absolute; top: 0; left: 0;
          pointer-events: none; z-index: 10;
        }
        .hover-highlight {
          position: absolute;
          pointer-events: none;
          border-radius: 10px;
          background: rgba(124, 229, 204, 0.14);
          box-shadow: inset 0 0 0 1px rgba(124, 229, 204, 0.65),
            0 0 18px rgba(124, 229, 204, 0.16);
          z-index: 12;
          transition: left 0.08s ease, top 0.08s ease, width 0.08s ease,
            height 0.08s ease, opacity 0.12s ease;
        }
        .click-overlay {
          position: absolute; top: 0; left: 0;
          width: 100%; height: 100%;
          cursor: crosshair; z-index: 13;
        }

        .table-chip-selector {
          position: absolute;
          bottom: 8.5%; left: 69.5%;
          transform: translateX(-50%) scale(1);
          transform-origin: bottom center;
          z-index: 25;
          transition: transform .2s ease;
        }
        .table-edit-toggle {
          position: absolute;
          top: 4.5%;
          left: 5.5%;
          z-index: 31;
        }
        .table-edit-toggle button {
          min-width: 90px;
          border-radius: 12px;
          border: 1px solid rgba(245,200,66,0.45);
          padding: 8px 10px;
          font-size: 0.78rem;
          letter-spacing: 0.8px;
          font-family: 'Orbitron', monospace;
          color: #abb3c9;
          background: #0a0d12;
          cursor: pointer;
          transition: background .2s, color .2s, transform .2s;
        }
        .table-edit-toggle button.active,
        .table-edit-toggle button:hover {
          background: rgba(245,200,66,0.18);
          color: #f5c842;
          transform: translateY(-1px);
        }
        @media (min-width: 1100px) and (max-width: 1300px) {
          .table-chip-selector { transform: translateX(-50%) scale(0.85); bottom: 7%; }
        }

        @media (min-width: 680px) and (max-width: 1099px) {
          .game-layout     { flex-direction: column; overflow-y: auto; overflow-x: hidden; }
          .mobile-header   { display: none; }
          .desktop-only-balance{ display: flex !important; }

          .side-panel {
            width: 100%;
            min-width: unset;
            border-right: none;
            border-bottom: 1px solid #1e2530;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 8px 14px;
            padding: 10px 16px;
            overflow-y: visible;
            overflow-x: auto;
            align-items: flex-start;
          }
          .side-panel-toggle { flex: 0 0 42px; width: 42px; min-height: 42px; }
          .side-panel-body {
            flex: 1 1 auto;
            min-width: 0;
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 8px 14px;
            overflow: visible;
            max-height: none;
            opacity: 1;
            transform: translateX(0);
            transition: max-height .32s ease, opacity .22s ease, transform .22s ease;
          }
          .side-panel-body > div  { flex: 1 1 160px; min-width: 140px; }
          .side-panel-body > button { flex: 1 1 140px; min-width: 120px; }
          .side-panel.side-panel-collapsed {
            width: 100%;
            min-width: unset;
            min-height: 54px;
            padding: 8px 16px;
          }
          .side-panel.side-panel-collapsed .side-panel-body {
            max-height: 0;
            opacity: 0;
            transform: translateX(-16px);
            pointer-events: none;
          }

          .main-area   { padding: 10px 12px; }

          .game-container {
            flex-direction: column;
            gap: 0;
            align-items: flex-start;
            max-width: none;
          }
          .table-section  { width: 100%; align-items: flex-start; }

          .svg-wrap {
            display: block;
            position: relative;
            width: min(1320px, 148vw);
            max-width: none;
          }

          .wheel-section {
            position: absolute;
            left: 4.25%;
            top: 50%;
            transform: translateY(-50%);
            width: fit-content;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 0;
            z-index: 20;
            transition: transform 0.5s cubic-bezier(0.34,1.2,0.64,1);
          }

          .wheel-section.expanded {
            position: absolute;
            left: 0; top: 0;
            width: 100%;
            height: 100%;
            background: rgba(8,12,16,0.92);
            backdrop-filter: blur(4px);
            z-index: 50;
            justify-content: center;
            padding: 16px;
            gap: 14px;
          }

          .wheel-wrap {
            width: clamp(150px, 25vw, 260px);
            height: clamp(150px, 25vw, 260px);
            transition: width 0.5s cubic-bezier(0.34,1.2,0.64,1),
                        height 0.5s cubic-bezier(0.34,1.2,0.64,1);
          }
          .wheel-section.expanded .wheel-wrap {
            width: min(55vw, 340px);
            height: min(55vw, 340px);
          }

          .result-number { font-size: 36px; }
          .spin-btn { width: 200px; }

          .table-inner-wrap { width: 100%; min-width: 0; }

          .table-chip-selector {
            transform: translateX(-50%) scale(0.58);
            bottom: 6.5%; left: 68%;
          }
        }

        @media (max-width: 679px) {
          .mobile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 9px 14px;
            background: #0a0d12;
            border-bottom: 1px solid #1e2530;
            position: sticky;
            top: 0;
            z-index: 100;
          }
          .mobile-header-balance { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
          .mobile-header-balance .lbl { font-size: 0.5rem; color: #7a8494; text-transform: uppercase; letter-spacing: 1.5px; }
          .mobile-header-balance .val { font-family: 'Orbitron',monospace; font-size: 0.95rem; font-weight: 700; color: #f5c842; }

          .desktop-only-balance { display: none !important; }

          .game-layout { flex-direction: column; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; }

          .side-panel {
            width: 100%;
            min-width: unset;
            border-right: none;
            border-bottom: 1px solid #1e2530;
            flex-direction: column;
            padding: 12px 14px;
            gap: 10px;
            overflow: visible;
          }
          .side-panel-toggle { width: 100%; }
          .side-panel-body { flex: none; width: 100%; overflow: visible; max-height: none; }
          .side-panel-body > div  { flex: none; width: 100%; }
          .side-panel-body > button { width: 100%; }
          .side-panel.side-panel-collapsed {
            width: 100%;
            min-width: unset;
            padding: 8px 14px;
          }

          .main-area { padding: 8px 8px 20px; }

          .game-container { flex-direction: column; gap: 10px; }

          .wheel-section {
            position: static;
            transform: none;
            width: 100%;
            align-items: center;
            margin: 0 auto;
          }
          .wheel-wrap {
            width: clamp(180px, 68vw, 280px);
            height: clamp(180px, 68vw, 280px);
          }
          .result-number { font-size: 36px; }
          .spin-btn { width: 100%; max-width: 260px; }

          .svg-wrap { display: block; }

          .table-chip-selector {
            transform: translateX(-50%) scale(0.45);
            bottom: 5%; left: 68%;
          }
        }

        @keyframes glowPulse {
          0%,100% { opacity: .75; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.06); }
        }
      `}</style>

      <div className={`notif${notif ? " show" + (notif.type ? " " + notif.type : "") : ""}`}>
        {notif?.msg}
      </div>

      {/* ── MOBILE STICKY HEADER ── */}
      <div className="mobile-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "1.3rem" }}>🎰</span>
          <span style={{ fontFamily: "'Cinzel',serif", fontSize: "0.9rem", fontWeight: 700, color: "#f5c842", letterSpacing: 1 }}>ROULETTE</span>
        </div>
        <div className="mobile-header-balance">
          <span className="lbl">Balance</span>
          <span className="val">{fmt(balance)}</span>
        </div>
      </div>

      <div className="game-layout">
        {/* ── SIDE PANEL ── */}
        <div className={`side-panel${sidePanelCollapsed ? " side-panel-collapsed" : ""}`}>
          <button
            className="side-panel-toggle"
            type="button"
            onClick={() => setSidePanelCollapsed((v) => !v)}
            aria-label={sidePanelCollapsed ? "Show controls" : "Hide controls"}
            title={sidePanelCollapsed ? "Show controls" : "Hide controls"}
          >
            <img
              src="/roulette/panel-left-toggle.svg"
              alt={sidePanelCollapsed ? "Open panel" : "Close panel"}
              style={{
                width: 20,
                height: 20,
                display: "block",
                transform: sidePanelCollapsed ? "rotate(180deg)" : "none",
              }}
            />
          </button>
          <div className="side-panel-body">
            {/* ── FIX: user block is self-contained, link is inside it ── */}
            {user ? (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "14px 12px",
                    marginBottom: 14,
                    borderRadius: 14,
                    background: "rgba(15, 20, 28, 0.95)",
                    border: "1px solid rgba(56,189,248,0.2)",
                  }}
                >
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid rgba(56,189,248,0.5)",
                      flexShrink: 0,
                      background: "#111",
                    }}
                  >
                    <NextImage
                      src={user.photoURL || "/assets/back.png"}
                      alt={user.displayName || "User"}
                      width={50}
                      height={50}
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: 4 }}>
                      مرحباً بك
                    </div>
                    <div
                      style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "#f8fafc",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {user.displayName}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  <a href="/" style={{ textDecoration: "none", color: "#93c5fd", fontSize: "0.85rem" }}>الرئيسية</a>
                </div>
              </>
            ) : null}

            {/* Balance - desktop only */}
            <div
              className="desktop-only-balance"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#0a0d12",
                border: "1px solid #1e2530",
                borderRadius: 8,
                padding: "8px 10px",
                width: "100%",
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>🎰</span>
              <div>
                <div style={{ fontSize: "0.72rem", color: "#7a8494", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Balance
                </div>
                <div style={{ fontFamily: "'Orbitron',monospace", fontSize: "1rem", fontWeight: 700, color: "#f5c842" }}>
                  {fmt(balance)}
                </div>
              </div>
              {user?.isAdmin ? (
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <AdminBalanceButtons
                    gameKey="roulette"
                    adjustBalance={adjustBalance}
                    onLocalChange={(diff) => {
                      setBalance((prev) => {
                        const next = Math.max(0, prev + diff);
                        balanceRef.current = next;
                        return next;
                      });
                    }}
                  />
                </div>
              ) : null}
            </div>

            {/* Bet Amount */}
            <div style={{ width: "100%" }}>
              <div style={{ fontSize: "0.75rem", color: "#7a8494", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 4 }}>
                Bet Amount
              </div>
              <div
                style={{
                  background: "#0a0d12",
                  border: "1px solid #1e2530",
                  borderRadius: 8,
                  padding: "7px 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 4,
                }}
              >
                <span style={{ fontFamily: "'Orbitron',monospace", fontSize: "0.85rem", fontWeight: 700, color: "#27c76b" }}>
                  {fmt(betVal)}
                </span>
                <div style={{ display: "flex", gap: 3 }}>
                  {(
                    [
                      ["Min", () => setBetVal(5)],
                      ["½", () => setBetVal((v) => Math.max(5, v / 2))],
                      ["2×", () => setBetVal((v) => Math.min(10000, v * 2))],
                      ["Max", () => setBetVal(10000)],
                    ] as [string, () => void][]
                  ).map(([l, fn]) => (
                    <button
                      key={l}
                      onClick={fn}
                      style={{
                        background: "#151c26",
                        border: "1px solid #252d3a",
                        borderRadius: 4,
                        color: "#7a8494",
                        fontSize: "0.75rem",
                        padding: "3px 5px",
                        cursor: "pointer",
                        fontFamily: "'Rajdhani',sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chip Value */}
            <div style={{ width: "100%" }}>
              <div style={{ fontSize: "0.75rem", color: "#7a8494", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 6 }}>
                Chip Value
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px 8px" }}>
                {CHIP_DEFS.map((cd) => (
                  <div
                    key={cd.cls}
                    onClick={() => {
                      setChipValue(cd.value);
                      setChipCls(cd.cls);
                      chipValueRef.current = cd.value;
                      chipClsRef.current = cd.cls;
                    }}
                    style={{
                      aspectRatio: "1",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      border: chipCls === cd.cls ? "3px solid #f5c842" : "3px solid transparent",
                      boxShadow: chipCls === cd.cls
                        ? "0 0 0 3px #f5c842,0 4px 16px rgba(245,200,66,0.3)"
                        : "0 3px 10px rgba(0,0,0,0.5)",
                      transform: chipCls === cd.cls ? "scale(1.15)" : "scale(1)",
                      transition: "transform 0.15s,box-shadow 0.15s",
                      userSelect: "none",
                      background: "rgba(255,255,255,0.03)",
                      padding: 2,
                    }}
                  >
                    <img
                      src={cd.svgPath}
                      alt={cd.label}
                      draggable={false}
                      style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "50%" }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Payout */}
            <div style={{ width: "100%" }}>
              <div style={{ fontSize: "0.75rem", color: "#7a8494", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 4 }}>
                Payout Rules
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[
                  ["Straight (1#)", "35:1"],
                  ["Split (2#)", "17:1"],
                  ["Street (3#)", "11:1"],
                  ["Corner (4#)", "8:1"],
                  ["Six Line (6#)", "5:1"],
                  ["Column/Dozen", "2:1"],
                  ["Red/Black/Etc", "1:1"],
                ].map(([n, p]) => (
                  <div
                    key={n}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "3px 6px",
                      borderRadius: 4,
                      background: "#0a0d12",
                      border: "1px solid #1a2030",
                      fontSize: "0.75rem",
                    }}
                  >
                    <span style={{ color: "#7a8494" }}>{n}</span>
                    <span style={{ color: "#f5c842", fontWeight: 700, fontFamily: "'Orbitron',monospace", fontSize: "0.72rem" }}>
                      {p}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div
              style={{
                background: "#0a0d12",
                border: "1px solid #1e2530",
                borderRadius: 8,
                padding: "6px 10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "0.82rem",
                width: "100%",
              }}
            >
              <span>Total Bet</span>
              <span style={{ fontFamily: "'Orbitron',monospace", color: "#f5c842", fontWeight: 700 }}>
                {fmt(totalBet)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setEditMode((v) => !v)}
              style={{
                background: editMode ? "rgba(245,200,66,0.18)" : "#101418",
                border: "1px solid rgba(245,200,66,0.45)",
                borderRadius: 8,
                color: editMode ? "#f5c842" : "#abb3c9",
                padding: "10px",
                fontSize: "0.92rem",
                fontWeight: 700,
                cursor: "pointer",
                width: "100%",
                marginTop: 8,
              }}
            >
              {editMode ? "Done Editing" : "Edit"}
            </button>

            <button
              onClick={repeatBets}
              disabled={spinning}
              style={{
                background: "linear-gradient(135deg,#ff9f1c,#f97316)",
                color: "#fff",
                border: "none",
                borderRadius: 9,
                padding: "10px",
                fontSize: "1.2rem",
                fontWeight: 700,
                letterSpacing: 1,
                fontFamily: "'Orbitron',monospace",
                cursor: spinning ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px rgba(249,115,22,0.34)",
                opacity: spinning ? 0.55 : 1,
                width: "100%",
              }}
            >
              Repeat
            </button>

            <div
              onClick={clearBets}
              style={{
                background: "#101418",
                border: "1px solid #1e2530",
                borderRadius: 8,
                color: "#7a8494",
                padding: 6,
                fontSize: "0.82rem",
                cursor: "pointer",
                textAlign: "center",
                fontWeight: 600,
                width: "100%",
              }}
            >
              ✕ Clear Bets
            </div>

            <div
              style={{
                width: "100%",
                background: "#0a0d12",
                border: "1px solid #1e2530",
                borderRadius: 8,
                padding: "6px 10px",
                textAlign: "center",
              }}
            >
            
            </div>
          </div>
        </div>

        {/* ── MAIN AREA ── */}
        <div className="main-area">
          <div className="game-container">
            <div className="table-section">
              <div
                style={{
                  fontSize: "0.62rem",
                  color: "#7a8494",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 6,
                  textAlign: "center",
                }}
              >
                Click center = Straight • Near edge = Split • Corner = Corner bet
              </div>
              <div className="svg-wrap">
                <div className={`wheel-section${wheelExpanded ? " expanded" : ""}`}>
                  <div className="wheel-wrap">
                    <div
                      style={{
                        position: "absolute",
                        left: 0, top: 0,
                        width: "100%", height: "100%",
                        borderRadius: "50%",
                        border: "5px solid #c0392b",
                        boxShadow: "0 0 18px #c0392b,0 0 40px rgba(192,57,43,0.4),inset 0 0 20px rgba(192,57,43,0.1)",
                        pointerEvents: "none",
                        zIndex: 5,
                      }}
                    />
                    <canvas ref={wheelCanvasRef} width={340} height={340} />
                    <div
                      style={{
                        position: "absolute",
                        left: 0, top: 0,
                        width: "100%", height: "100%",
                        pointerEvents: "none",
                        zIndex: 6,
                      }}
                    >
                      <div
                        ref={ballRef}
                        style={{
                          position: "absolute",
                          width: 13, height: 13,
                          background: "radial-gradient(circle at 32% 28%,#ffffff,#ddd 45%,#999)",
                          borderRadius: "50%",
                          boxShadow: "0 3px 10px rgba(0,0,0,0.8),inset 0 1px 4px rgba(255,255,255,0.95)",
                          top: "0px", left: "0px",
                          transform: "translate(-50%, -50%)",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        top: "-2px", left: "50%",
                        transform: "translateX(-50%)",
                        width: 0, height: 0,
                        borderLeft: "9px solid transparent",
                        borderRight: "9px solid transparent",
                        borderTop: "20px solid #00d4ff",
                        filter: "drop-shadow(0 0 5px #00d4ff) drop-shadow(0 0 14px rgba(0,212,255,0.7))",
                        zIndex: 10,
                        pointerEvents: "none",
                      }}
                    />
                  </div>

                  {/* Result */}
                  <div style={{ textAlign: "center", marginTop: 12 }}>
                    <div
                      style={{
                        fontFamily: "'Orbitron',monospace",
                        fontSize: "clamp(1.6rem,4vw,2.4rem)",
                        fontWeight: 900,
                        minHeight: 44,
                        letterSpacing: 3,
                        color: resultColor,
                        transition: "color 0.3s",
                      }}
                    >
                      {resultNum !== null ? resultNum : "—"}
                    </div>
                    <div style={{ fontSize: "1.2rem", color: "#7a8494", letterSpacing: 2, marginTop: 2 }}>
                      {resultLabel}
                    </div>
                  </div>

                  <button
                    onClick={spin}
                    disabled={spinning}
                    style={{
                      background: "linear-gradient(135deg,#f5c842,#e6a020)",
                      color: "#000",
                      border: "none",
                      borderRadius: 28,
                      padding: "12px 50px",
                      fontSize: "1.1rem",
                      fontWeight: 900,
                      fontFamily: "'Orbitron',monospace",
                      cursor: spinning ? "not-allowed" : "pointer",
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      boxShadow: "0 4px 24px rgba(245,200,66,0.4)",
                      opacity: spinning ? 0.45 : 1,
                      transition: "transform 0.12s,box-shadow 0.12s",
                      marginTop: 16,
                      width: "100%",
                      maxWidth: 280,
                    }}
                  >
                    SPIN
                  </button>
                </div>

                {/* Table image wrapper */}
                <div ref={tableWrapRef} className="table-inner-wrap">
                  <img
                    src="/roulette/roulette-table.svg"
                    alt="Roulette Table"
                    draggable={false}
                    style={{ width: "100%", height: "auto", display: "block", userSelect: "none" }}
                  />
                  <canvas ref={chipCanvasRef} className="chip-canvas" />
                  {hoverTarget ? (
                    <div
                      className="hover-highlight"
                      style={{
                        left: Math.max(0, hoverTarget.rect.left - 2),
                        top: hoverTarget.rect.top,
                        width: hoverTarget.rect.width,
                        height: hoverTarget.rect.height,
                      }}
                    />
                  ) : null}
                  <div
                    className="click-overlay"
                    onClick={onTableClick}
                    onMouseMove={onTableHover}
                    onMouseLeave={() => setHoverTarget(null)}
                  />
                  <div className="table-total-bet">
                    <div className="total-bet-label">TOTAL BET</div>
                    <div className="total-bet-value">{fmt(totalBet)}</div>
                  </div>
                  <div className="table-edit-toggle">
                    <button
                      type="button"
                      onClick={() => setEditMode((v) => !v)}
                      className={editMode ? "active" : ""}
                    >
                      {editMode ? "Done" : "Edit"}
                    </button>
                  </div>
                  <div className="table-chip-selector">
                    <ChipSelector
                      value={chipValue}
                      defaultValue={1}
                      onSelect={(val) => {
                        const cd = CHIP_DEFS.find((c) => c.value === val);
                        if (!cd) return;
                        setChipValue(cd.value);
                        setChipCls(cd.cls);
                        chipValueRef.current = cd.value;
                        chipClsRef.current = cd.cls;
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}