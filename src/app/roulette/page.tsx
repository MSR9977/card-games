"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

/* ══════════════════════════════════════════════
   ROULETTE DATA & TYPES
   ══════════════════════════════════════════════ */

interface RawArea {
  id: string;
  name: string;
  coords: [number, number, number, number];
  type: 'number' | 'color' | 'half' | 'parity' | 'dozen' | 'column' | 'zero';
}

// Bounding box coordinates from roulette_table_map.html (based on 640x282 dimensions)
const RAW_AREAS: RawArea[] = [
  { id: "1", name: "1", coords: [305, 167, 278, 128], type: "number" },
  { id: "2", name: "2", coords: [305, 128, 278, 89], type: "number" },
  { id: "3", name: "3", coords: [278, 52, 306, 90], type: "number" },
  { id: "4", name: "4", coords: [306, 167, 331, 127], type: "number" },
  { id: "5", name: "5", coords: [305, 129, 330, 89], type: "number" },
  { id: "6", name: "6", coords: [331, 90, 305, 52], type: "number" },
  { id: "7", name: "7", coords: [331, 167, 356, 128], type: "number" },
  { id: "8", name: "8", coords: [331, 89, 356, 129], type: "number" },
  { id: "9", name: "9", coords: [332, 53, 356, 90], type: "number" },
  { id: "10", name: "10", coords: [355, 168, 382, 128], type: "number" },
  { id: "11", name: "11", coords: [355, 89, 382, 129], type: "number" },
  { id: "12", name: "12", coords: [357, 52, 382, 91], type: "number" },
  { id: "13", name: "13", coords: [381, 127, 409, 168], type: "number" },
  { id: "14", name: "14", coords: [381, 89, 408, 131], type: "number" },
  { id: "15", name: "15", coords: [382, 53, 408, 91], type: "number" },
  { id: "16", name: "16", coords: [408, 168, 433, 128], type: "number" },
  { id: "17", name: "17", coords: [406, 89, 433, 129], type: "number" },
  { id: "18", name: "18", coords: [406, 52, 434, 91], type: "number" },
  { id: "19", name: "19", coords: [432, 128, 459, 168], type: "number" },
  { id: "20", name: "20", coords: [432, 89, 460, 129], type: "number" },
  { id: "21", name: "21", coords: [433, 52, 458, 91], type: "number" },
  { id: "22", name: "22", coords: [458, 168, 485, 127], type: "number" },
  { id: "23", name: "23", coords: [458, 88, 484, 129], type: "number" },
  { id: "24", name: "24", coords: [458, 52, 485, 90], type: "number" },
  { id: "25", name: "25", coords: [483, 128, 511, 167], type: "number" },
  { id: "26", name: "26", coords: [483, 88, 510, 129], type: "number" },
  { id: "27", name: "27", coords: [485, 53, 509, 90], type: "number" },
  { id: "28", name: "28", coords: [508, 127, 535, 167], type: "number" },
  { id: "29", name: "29", coords: [507, 89, 536, 129], type: "number" },
  { id: "30", name: "30", coords: [507, 52, 536, 91], type: "number" },
  { id: "31", name: "31", coords: [534, 128, 561, 169], type: "number" },
  { id: "32", name: "32", coords: [534, 89, 562, 131], type: "number" },
  { id: "33", name: "33", coords: [534, 52, 562, 92], type: "number" },
  { id: "34", name: "34", coords: [559, 127, 587, 168], type: "number" },
  { id: "35", name: "35", coords: [560, 89, 588, 131], type: "number" },
  { id: "36", name: "36", coords: [560, 52, 588, 92], type: "number" },
  { id: "red", name: "Red", coords: [383, 195, 430, 216], type: "color" },
  { id: "black", name: "Black", coords: [435, 194, 482, 216], type: "color" },
  { id: "1-18", name: "1 - 18", coords: [281, 194, 328, 216], type: "half" },
  { id: "even", name: "Even", coords: [332, 194, 379, 216], type: "parity" },
  { id: "odd", name: "Odd", coords: [485, 194, 534, 217], type: "parity" },
  { id: "19-36", name: "19 - 36", coords: [537, 195, 583, 216], type: "half" },
  { id: "1st12", name: "1st 12", coords: [277, 165, 380, 191], type: "dozen" },
  { id: "2nd12", name: "2nd 12", coords: [381, 165, 484, 191], type: "dozen" },
  { id: "3rd12", name: "3rd 12", coords: [485, 165, 585, 191], type: "dozen" },
  { id: "col1", name: "2 to 1", coords: [584, 129, 610, 166], type: "column" },
  { id: "col2", name: "2 to 1", coords: [583, 91, 611, 127], type: "column" },
  { id: "col3", name: "2 to 1", coords: [585, 52, 611, 90], type: "column" },
  { id: "0", name: "0", coords: [245, 51, 279, 168], type: "zero" },
];

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
]);

const getNumberColor = (num: number): "red" | "black" | "green" => {
  if (num === 0) return "green";
  return RED_NUMBERS.has(num) ? "red" : "black";
};

// European Roulette clockwise wheel order
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const WHEEL_IMAGE_SIZE = 2000;
const WHEEL_BOX = { x: 10, y: 31, size: 220 };
const WHEEL_CONTAINER_WIDTH = WHEEL_BOX.size;
const WHEEL_IMAGE_SCALE = WHEEL_BOX.size / WHEEL_IMAGE_SIZE;
const WHEEL_AREA = { x: 1000, y: 1000, r: 698 };
const WHEEL_CENTER = {
  x: WHEEL_BOX.x + (WHEEL_AREA.x * WHEEL_IMAGE_SCALE),
  y: WHEEL_BOX.y + (WHEEL_AREA.y * WHEEL_IMAGE_SCALE),
};
const WHEEL_RADIUS = WHEEL_AREA.r * WHEEL_IMAGE_SCALE;
const WHEEL_DISC_CLIP_PERCENT = `${((WHEEL_AREA.r / WHEEL_IMAGE_SIZE) * 100).toFixed(2)}%`;
const WHEEL_ORBIT_SIZE_PERCENT = `${(((WHEEL_RADIUS * 2) / WHEEL_CONTAINER_WIDTH) * 100).toFixed(2)}%`;
const WHEEL_BOX_STYLE = {
  left: `${((WHEEL_BOX.x / 640) * 100).toFixed(2)}%`,
  top: `${((WHEEL_BOX.y / 282) * 100).toFixed(2)}%`,
  width: `${((WHEEL_BOX.size / 640) * 100).toFixed(2)}%`,
  height: `${((WHEEL_BOX.size / 282) * 100).toFixed(2)}%`,
};
const SPIN_DURATION_MS = 4200;
const AUTO_SPIN_SECONDS = 10;

const RAW_WHEEL_POCKETS: Record<number, { x: number; y: number; r: number }> = {
  0: { x: 1000, y: 300, r: 37 },
  32: { x: 1120, y: 320, r: 37 },
  15: { x: 1230, y: 365, r: 37 },
  19: { x: 1330, y: 435, r: 37 },
  4: { x: 1415, y: 525, r: 37 },
  21: { x: 1480, y: 635, r: 37 },
  2: { x: 1520, y: 755, r: 37 },
  25: { x: 1540, y: 875, r: 37 },
  17: { x: 1525, y: 995, r: 37 },
  34: { x: 1485, y: 1115, r: 37 },
  6: { x: 1420, y: 1225, r: 37 },
  27: { x: 1335, y: 1315, r: 37 },
  13: { x: 1235, y: 1385, r: 37 },
  36: { x: 1125, y: 1430, r: 37 },
  11: { x: 1005, y: 1450, r: 37 },
  30: { x: 885, y: 1430, r: 37 },
  8: { x: 775, y: 1385, r: 37 },
  23: { x: 675, y: 1315, r: 37 },
  10: { x: 590, y: 1225, r: 37 },
  5: { x: 525, y: 1115, r: 37 },
  24: { x: 485, y: 995, r: 37 },
  16: { x: 470, y: 875, r: 37 },
  33: { x: 490, y: 755, r: 37 },
  1: { x: 530, y: 635, r: 37 },
  20: { x: 595, y: 525, r: 37 },
  14: { x: 680, y: 435, r: 37 },
  31: { x: 780, y: 365, r: 37 },
  9: { x: 890, y: 320, r: 37 },
  22: { x: 835, y: 390, r: 37 },
  18: { x: 735, y: 455, r: 37 },
  29: { x: 650, y: 545, r: 37 },
  7: { x: 590, y: 650, r: 37 },
  28: { x: 555, y: 770, r: 37 },
  12: { x: 550, y: 890, r: 37 },
  35: { x: 575, y: 1010, r: 37 },
  3: { x: 630, y: 1120, r: 37 },
  26: { x: 710, y: 1215, r: 37 },
};

const mapWheelPointToTable = ({ x, y, r }: { x: number; y: number; r: number }) => ({
  x: WHEEL_BOX.x + (x * WHEEL_IMAGE_SCALE),
  y: WHEEL_BOX.y + (y * WHEEL_IMAGE_SCALE),
  r: r * WHEEL_IMAGE_SCALE,
});

const WHEEL_POCKETS = Object.fromEntries(
  Object.entries(RAW_WHEEL_POCKETS).map(([num, point]) => [Number(num), mapWheelPointToTable(point)])
) as Record<number, { x: number; y: number; r: number }>;
// wheel_map.html coordinates are accurate, but the rendered wheel.svg art is rotated:
// the map point titled 21 visually sits on 30, so we compensate by 10 pockets.
const WHEEL_VISUAL_POCKET_OFFSET = 10;

const getVisualPocketNumber = (num: number) => {
  const idx = WHEEL_NUMBERS.indexOf(num);
  if (idx === -1) return 0;
  return WHEEL_NUMBERS[(idx - WHEEL_VISUAL_POCKET_OFFSET + WHEEL_NUMBERS.length) % WHEEL_NUMBERS.length];
};

// Smallest chip starts on the right in RTL, then grows toward the left.
const CHIP_TRAY = [
  { val: 1,  img: "/roulette/1_chip.svg",  cls: "chip-1" },
  { val: 2,  img: "/roulette/2_chip.svg",  cls: "chip-2" },
  { val: 5,  img: "/roulette/5_chip.svg",  cls: "chip-5" },
  { val: 25, img: "/roulette/25_chip.svg", cls: "chip-25" },
  { val: 50, img: "/roulette/50_chip.svg", cls: "chip-50" },
];

interface Bet {
  id: number;
  key: string;
  type: 'straight' | 'split' | 'corner' | 'sixline' | 'dozen' | 'column' | 'color' | 'parity' | 'half' | 'zero' | 'street';
  numbers: number[];
  value: number;
  chipImg: string;
  left: number;
  top: number;
  label: string;
}

type ResultStatus = "idle" | "win" | "lose";
type BetDraft = Omit<Bet, 'id' | 'value' | 'chipImg' | 'left' | 'top'>;

/* ─── Confetti ─── */
function spawnConfetti(primaryColor: string) {
  const colors = [primaryColor, "#f5c518", "#ffffff", "#4ade80", primaryColor];
  for (let i = 0; i < 45; i++) {
    const el = document.createElement("div");
    el.className = "confetti";
    el.style.cssText = `
      position:fixed;left:${Math.random()*100}vw;top:-10px;
      background:${colors[i%colors.length]};
      --dur:${0.9+Math.random()*1.3}s;
      animation:confettiFall var(--dur) linear forwards;
      animation-delay:${Math.random()*0.3}s;
      width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;
      border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
      pointer-events:none;z-index:9999;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */

export default function Roulette() {
  const [balance, setBalance] = useState(2000);
  const [bets, setBets] = useState<Bet[]>([]);
  const [selectedChip, setSelectedChip] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [spinTargetNumber, setSpinTargetNumber] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [winOverlay, setWinOverlay] = useState<{ text: string; color: string; sub?: string } | null>(null);
  const [resultMsg, setResultMsg] = useState("ضع رهاناتك واضغط Spin للبدء!");
  const [resultCls, setResultCls] = useState<ResultStatus>("idle");
  const [lastBets, setLastBets] = useState<Bet[]>([]);
  const [spinCountdown, setSpinCountdown] = useState<number | null>(null);
  
  // Interactive Speech bubble for Gemini 2.5 Live Dealer
  const [dealerComment, setDealerComment] = useState("أهلاً بكم في طاولة الروليت الملكية! ضعوا رهاناتكم وابدأوا الدوران.");

  // Hover Outline highlight coordinates
  const [hoveredBet, setHoveredBet] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    label: string;
  } | null>(null);

  const betId = useRef(0);
  const spinNowRef = useRef<() => void>(() => {});

  const getChipImg = (val: number) => {
    const item = CHIP_TRAY.find(c => c.val === val) ??
      CHIP_TRAY.reduce((best, chip) => (chip.val <= val && chip.val > best.val ? chip : best), CHIP_TRAY[0]);
    return item ? item.img : "/roulette/50_chip.svg";
  };

  /* ─── API Live AI Dealer Fetch Trigger ─── */
  const fetchDealerComment = async (
    event: "placed_bet" | "spinning" | "result",
    currentBets = bets,
    rolledNum: number | null = null,
    winAmt = 0
  ) => {
    try {
      const betsSummary = currentBets.map(b => `${b.label} بقيمة $${b.value}`).join("، ");
      const totalBetAmount = currentBets.reduce((sum, b) => sum + b.value, 0);

      const res = await fetch("/api/dealer-ai/roulette", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event,
          betsSummary,
          rolled: rolledNum,
          totalWin: winAmt,
          totalBet: totalBetAmount
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.comment) {
          setDealerComment(data.comment);
        }
      }
    } catch (err) {
      console.error("AI Dealer comment error:", err);
    }
  };

  /* ─── Numbers Bounding Box Logic ─── */
  const getNumbersBoundingBox = (numbers: number[]) => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    
    for (const num of numbers) {
      const area = RAW_AREAS.find(a => a.id === num.toString());
      if (area) {
        const x1 = area.coords[0];
        const y1 = area.coords[1];
        const x2 = area.coords[2];
        const y2 = area.coords[3];
        
        minX = Math.min(minX, x1, x2);
        maxX = Math.max(maxX, x1, x2);
        minY = Math.min(minY, y1, y2);
        maxY = Math.max(maxY, y1, y2);
      }
    }
    
    if (minX === Infinity) return null;
    
    return {
      left: (minX / 640) * 100,
      top: (minY / 282) * 100,
      width: ((maxX - minX) / 640) * 100,
      height: ((maxY - minY) / 282) * 100
    };
  };

  /* ─── Unified Area Bounding Box Retriever ─── */
  const getAreaBoundingBox = (betType: string, id: string, numbers: number[]) => {
    if (betType === 'street' || betType === 'sixline' || betType === 'corner' || betType === 'split' || betType === 'straight' || betType === 'zero') {
      return getNumbersBoundingBox(numbers);
    }

    // Outer areas
    const area = RAW_AREAS.find(a => a.id === id);
    if (!area) return null;
    const x1 = area.coords[0];
    const y1 = area.coords[1];
    const x2 = area.coords[2];
    const y2 = area.coords[3];
    const left = Math.min(x1, x2);
    const right = Math.max(x1, x2);
    const top = Math.min(y1, y2);
    const bottom = Math.max(y1, y2);
    return {
      left: (left / 640) * 100,
      top: (top / 282) * 100,
      width: ((right - left) / 640) * 100,
      height: ((bottom - top) / 282) * 100
    };
  };

  const getChipPosition = (betKey: string, betType: string, numbers: number[], bbox: { left: number; top: number; width: number; height: number }) => {
    const insideBets = new Set(["straight", "split", "corner", "sixline", "street", "zero"]);
    if (!insideBets.has(betType)) {
      return {
        left: bbox.left + bbox.width / 2,
        top: bbox.top + bbox.height / 2,
      };
    }

    if (betKey.startsWith("split-0-")) {
      const pairedNumber = numbers.find(num => num !== 0);
      const pairedArea = RAW_AREAS.find(area => area.id === pairedNumber?.toString());
      if (pairedArea) {
        const yCenter = ((Math.min(pairedArea.coords[1], pairedArea.coords[3]) + Math.max(pairedArea.coords[1], pairedArea.coords[3])) / 2 / 282) * 100;
        return {
          left: (278 / 640) * 100,
          top: yCenter,
        };
      }
    }

    const numbersBbox = getNumbersBoundingBox(numbers);
    if (!numbersBbox) {
      return {
        left: bbox.left + bbox.width / 2,
        top: bbox.top + bbox.height / 2,
      };
    }

    if (betType === "street" || betType === "sixline") {
      return {
        left: numbersBbox.left + numbersBbox.width / 2,
        top: (168 / 282) * 100,
      };
    }

    return {
      left: numbersBbox.left + numbersBbox.width / 2,
      top: numbersBbox.top + numbersBbox.height / 2,
    };
  };

  /* ─── Find Outer Area by Rect Collision ─── */
  const findOuterArea = (x: number, y: number) => {
    for (const area of RAW_AREAS) {
      if (area.type === 'number' || area.type === 'zero') continue;
      const x1 = area.coords[0];
      const y1 = area.coords[1];
      const x2 = area.coords[2];
      const y2 = area.coords[3];
      const left = Math.min(x1, x2);
      const right = Math.max(x1, x2);
      const top = Math.min(y1, y2);
      const bottom = Math.max(y1, y2);
      
      if (x >= left && x <= right && y >= top && y <= bottom) {
        return area;
      }
    }
    return null;
  };

  /* ─── Get exact numbers covered by outer keys ─── */
  const getOuterAreaNumbers = (id: string): number[] => {
    switch (id) {
      case "red": return Array.from(RED_NUMBERS);
      case "black": return [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
      case "1-18": return Array.from({length: 18}, (_, i) => i + 1);
      case "19-36": return Array.from({length: 18}, (_, i) => i + 19);
      case "even": return Array.from({length: 18}, (_, i) => (i + 1) * 2);
      case "odd": return Array.from({length: 18}, (_, i) => i * 2 + 1);
      case "1st12": return Array.from({length: 12}, (_, i) => i + 1);
      case "2nd12": return Array.from({length: 12}, (_, i) => i + 13);
      case "3rd12": return Array.from({length: 12}, (_, i) => i + 25);
      case "col1": return [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];
      case "col2": return [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
      case "col3": return [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];
      default: return [];
    }
  };

  /* ─── Interactive Board Click Matching ─── */
  const getBetFromCoordinates = (clickX: number, clickY: number): BetDraft | null => {
    // 1. Check if inside zero area X: 245 to 278, Y: 52 to 168
    if (clickX >= 245 && clickX <= 278 && clickY >= 52 && clickY <= 168) {
      if (278 - clickX < 9) { // border splitting zero and column 1
        if (clickY >= 52 && clickY < 90) {
          return { key: "split-0-3", type: "split", numbers: [0, 3], label: "تقسيم 0 و 3" };
        } else if (clickY >= 90 && clickY < 128) {
          return { key: "split-0-2", type: "split", numbers: [0, 2], label: "تقسيم 0 و 2" };
        } else {
          return { key: "split-0-1", type: "split", numbers: [0, 1], label: "تقسيم 0 و 1" };
        }
      } else {
        return { key: "zero-0", type: "zero", numbers: [0], label: "رقم 0" };
      }
    }

    // 2. Check if inside numbers grid X: 278 to 588, Y: 52 to 168
    if (clickX >= 278 && clickX <= 588) {
      const colX = [278, 305, 331, 356, 381, 408, 433, 458, 484, 509, 535, 560, 588];
      const rowY = [52, 90, 128, 168];
      const LINE_SNAP = 7;
      const STREET_LANE_TOP = 158;
      const STREET_LANE_BOTTOM = 184;
      const numGrid = [
        [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34], // bottom row
        [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35], // middle row
        [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36], // top row
      ];

      // A: Detect Street (3 numbers) or Six-Line (6 numbers) bets in the lower street lane.
      if (clickY >= STREET_LANE_TOP && clickY <= STREET_LANE_BOTTOM) {
        let nearColIdx = -1;
        for (let c = 1; c <= 11; c++) {
          if (Math.abs(clickX - colX[c]) <= LINE_SNAP + 2) {
            nearColIdx = c;
            break;
          }
        }

        if (nearColIdx !== -1) {
          // Double Street / Six-line bet (6 numbers)
          const c = nearColIdx;
          const numbers = [
            numGrid[0][c-1], numGrid[1][c-1], numGrid[2][c-1],
            numGrid[0][c], numGrid[1][c], numGrid[2][c]
          ].sort((a, b) => a - b);
          return {
            key: `sixline-${numbers.join("-")}`,
            type: "sixline",
            numbers,
            label: `سطرين متجاورين (${numbers.join("-")})`
          };
        } else {
          // Single Street bet (3 numbers)
          let colIdx = 0;
          for (let c = 0; c < 12; c++) {
            if (clickX >= colX[c] && clickX < colX[c+1]) {
              colIdx = c;
              break;
            }
          }
          const numbers = [
            numGrid[0][colIdx], numGrid[1][colIdx], numGrid[2][colIdx]
          ].sort((a, b) => a - b);
          return {
            key: `street-${numbers.join("-")}`,
            type: "street",
            numbers,
            label: `سطر أرقام (${numbers.join("-")})`
          };
        }
      }

      // B: Standard Grid checks (Inside numbers grid borders)
      if (clickY > 52 && clickY < 168) {
        // Check vertical lines distance
        let nearColIdx = -1;
        for (let c = 1; c <= 11; c++) {
          if (Math.abs(clickX - colX[c]) <= LINE_SNAP) {
            nearColIdx = c;
            break;
          }
        }

        // Check horizontal lines distance
        let nearRowIdx = -1;
        for (let r = 1; r <= 2; r++) {
          if (Math.abs(clickY - rowY[r]) <= LINE_SNAP) {
            nearRowIdx = r;
            break;
          }
        }

        // Case A: Corner Bet (both vertical & horizontal intersection are close)
        if (nearColIdx !== -1 && nearRowIdx !== -1) {
          const c = nearColIdx;
          const r = nearRowIdx;
          const numbers = [
            numGrid[3 - r][c - 1],
            numGrid[2 - r][c - 1],
            numGrid[3 - r][c],
            numGrid[2 - r][c]
          ].sort((a, b) => a - b);
          return {
            key: `corner-${numbers.join("-")}`,
            type: "corner",
            numbers,
            label: `زاوية ${numbers.join("-")}`
          };
        }

        // Case B: Horizontal Split (only vertical boundary close)
        if (nearColIdx !== -1) {
          const c = nearColIdx;
          let rowIdx = 0;
          if (clickY >= 52 && clickY < 90) rowIdx = 2;
          else if (clickY >= 90 && clickY < 128) rowIdx = 1;
          const numbers = [numGrid[rowIdx][c - 1], numGrid[rowIdx][c]].sort((a, b) => a - b);
          return {
            key: `split-${numbers.join("-")}`,
            type: "split",
            numbers,
            label: `تقسيم ${numbers.join("-")}`
          };
        }

        // Case C: Vertical Split (only horizontal boundary close)
        if (nearRowIdx !== -1) {
          const r = nearRowIdx;
          let colIdx = 0;
          for (let c = 0; c < 12; c++) {
            if (clickX >= colX[c] && clickX < colX[c+1]) {
              colIdx = c;
              break;
            }
          }
          const numbers = [numGrid[2 - r][colIdx], numGrid[3 - r][colIdx]].sort((a, b) => a - b);
          return {
            key: `split-${numbers.join("-")}`,
            type: "split",
            numbers,
            label: `تقسيم ${numbers.join("-")}`
          };
        }

        // Case D: Straight Up Bet
        let colIdx = 0;
        for (let c = 0; c < 12; c++) {
          if (clickX >= colX[c] && clickX < colX[c+1]) {
            colIdx = c;
            break;
          }
        }
        let rowIdx = 0;
        if (clickY >= 52 && clickY < 90) rowIdx = 2;
        else if (clickY >= 90 && clickY < 128) rowIdx = 1;

        const num = numGrid[rowIdx][colIdx];
        return {
          key: `straight-${num}`,
          type: "straight",
          numbers: [num],
          label: `رقم ${num}`
        };
      }
    }

    // 3. Check if inside outer areas
    const outerArea = findOuterArea(clickX, clickY);
    if (outerArea) {
      if (outerArea.type === "number") return null;
      const numbers = getOuterAreaNumbers(outerArea.id);
      return {
        key: outerArea.id,
        type: outerArea.type,
        numbers,
        label: outerArea.name
      };
    }

    return null;
  };

  /* ─── Mouse Hover Highlights handler ─── */
  const handleTableMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSpinning) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    const clickX = (offsetX / rect.width) * 640;
    const clickY = (offsetY / rect.height) * 282;

    const betInfo = getBetFromCoordinates(clickX, clickY);
    if (betInfo) {
      const bbox = getAreaBoundingBox(betInfo.type, betInfo.key, betInfo.numbers);
      if (bbox) {
        setHoveredBet({
          ...bbox,
          label: betInfo.label
        });
        return;
      }
    }
    setHoveredBet(null);
  };

  const handleTableMouseLeave = () => {
    setHoveredBet(null);
  };

  /* ─── Table Click - Bet Placement Handler ─── */
  const handleTableClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSpinning) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    const clickX = (offsetX / rect.width) * 640;
    const clickY = (offsetY / rect.height) * 282;

    const betInfo = getBetFromCoordinates(clickX, clickY);
    if (!betInfo) return;
    
    // Check balance
    if (balance < selectedChip) {
      setResultMsg("عذراً، الرصيد غير كافٍ!");
      setResultCls("lose");
      return;
    }

    setBalance(prev => prev - selectedChip);
    
    const bbox = getAreaBoundingBox(betInfo.type, betInfo.key, betInfo.numbers);
    if (!bbox) return;

    const chipPosition = getChipPosition(betInfo.key, betInfo.type, betInfo.numbers, bbox);

    let updatedBets: Bet[] = [];

    setBets(prev => {
      // If same key exists, stack it
      const existingIdx = prev.findIndex(b => b.key === betInfo.key);
      if (existingIdx > -1) {
        const updated = [...prev];
        const newVal = updated[existingIdx].value + selectedChip;
        updated[existingIdx] = {
          ...updated[existingIdx],
          value: newVal,
          chipImg: getChipImg(Math.max(newVal, selectedChip))
        };
        updatedBets = updated;
        return updated;
      } else {
        const newBet: Bet = {
          id: betId.current++,
          key: betInfo.key,
          type: betInfo.type,
          numbers: betInfo.numbers,
          value: selectedChip,
          chipImg: getChipImg(selectedChip),
          left: chipPosition.left,
          top: chipPosition.top,
          label: betInfo.label
        };
        updatedBets = [...prev, newBet];
        return updatedBets;
      }
    });

    setResultMsg(`تم وضع $${selectedChip} على ${betInfo.label}`);
    setResultCls("idle");
    setSpinCountdown(AUTO_SPIN_SECONDS);

    // Asynchronously update Gemini live dealer commentary
    setTimeout(() => {
      fetchDealerComment("placed_bet", updatedBets);
    }, 50);
  };

  /* ─── Clear All Bets ─── */
  const handleClearBets = () => {
    if (isSpinning) return;
    
    // Refund placed bets
    const totalRefund = bets.reduce((sum, b) => sum + b.value, 0);
    setBalance(prev => prev + totalRefund);
    setBets([]);
    setSpinCountdown(null);
    setResultMsg("تم مسح جميع الرهانات وإرجاع الرصيد.");
    setResultCls("idle");
    setDealerComment("تم مسح جميع الرهانات وإرجاع الرصيد. ضعوا رهانات جديدة للبدء!");
  };

  /* ─── Repeat Last Bets ─── */
  const handleRepeatBets = () => {
    if (isSpinning || lastBets.length === 0) return;

    // Calculate total required balance
    const totalCost = lastBets.reduce((sum, b) => sum + b.value, 0);
    if (balance < totalCost) {
      setResultMsg("لا يوجد رصيد كافٍ لتكرار جميع الرهانات!");
      setResultCls("lose");
      return;
    }

    // Clear current bets first and refund them
    const currentRefund = bets.reduce((sum, b) => sum + b.value, 0);
    
    // Apply refund and cost
    setBalance(prev => prev + currentRefund - totalCost);
    
    const repeated = lastBets.map(b => ({
      ...b,
      id: betId.current++
    }));

    // Apply last bets
    setBets(repeated);
    setSpinCountdown(AUTO_SPIN_SECONDS);

    setResultMsg("تمت إعادة تطبيق رهانات الجولة السابقة.");
    setResultCls("idle");

    setTimeout(() => {
      fetchDealerComment("placed_bet", repeated);
    }, 50);
  };

  /* ─── Precise Ball Landing Angle Calculator ─── */
  const getBallAngle = (num: number) => {
    const pocket = WHEEL_POCKETS[getVisualPocketNumber(num)] ?? WHEEL_POCKETS[0];
    return Math.atan2(pocket.y - WHEEL_CENTER.y, pocket.x - WHEEL_CENTER.x) * 180 / Math.PI;
  };

  const getBallOrbitRotation = (num: number) => {
    return 360 * 6 + getBallAngle(num);
  };

  const getBallPosition = (num: number) => {
    const pocket = WHEEL_POCKETS[getVisualPocketNumber(num)] ?? WHEEL_POCKETS[0];
    
    return {
      left: (pocket.x / 640) * 100,
      top: (pocket.y / 282) * 100,
      width: ((pocket.r * 2) / 640) * 100,
      height: ((pocket.r * 2) / 282) * 100,
    };
  };

  /* ─── Spin the Wheel ─── */
  const handleSpin = () => {
    if (isSpinning) return;
    if (bets.length === 0) {
      setResultMsg("يرجى وضع رهان واحد على الأقل للبدء!");
      setResultCls("lose");
      return;
    }

    setIsSpinning(true);
    setSpinCountdown(null);
    setWinningNumber(null);
    setWinOverlay(null);
    setResultMsg("عجلة الروليت تدور... بالتوفيق!");
    setResultCls("idle");

    // Shouting 'No More Bets' instantly
    setDealerComment("⚠️ لا مزيد من الرهانات! (No More Bets) تدور العجلة الآن!");
    fetchDealerComment("spinning", bets);

    // Keep active bets reference for payouts
    const activeBets = bets;

    // Choose random number (0-36)
    const luckyIndex = Math.floor(Math.random() * WHEEL_NUMBERS.length);
    const rolled = WHEEL_NUMBERS[luckyIndex];
    setSpinTargetNumber(rolled);

    setTimeout(() => {
      setIsSpinning(false);
      setSpinTargetNumber(null);
      setWinningNumber(rolled);
      
      // Save bets for Rebet option
      setLastBets(activeBets);

      // Judge bets
      let totalWin = 0;
      const rollColor = getNumberColor(rolled);

      activeBets.forEach((bet) => {
        const isWin = bet.numbers.includes(rolled);
        if (isWin) {
          let multiplier = 0;
          switch (bet.type) {
            case "zero":
            case "straight":
              multiplier = 35;
              break;
            case "split":
              multiplier = 17;
              break;
            case "street":
              multiplier = 11;
              break;
            case "sixline":
              multiplier = 5;
              break;
            case "corner":
              multiplier = 8;
              break;
            case "dozen":
            case "column":
              multiplier = 2;
              break;
            case "color":
            case "parity":
            case "half":
              multiplier = 1;
              break;
          }
          totalWin += bet.value + (bet.value * multiplier);
        }
      });

      // Update history
      setHistory(prev => [rolled, ...prev].slice(0, 10));

      const totalBetAmount = activeBets.reduce((sum, b) => sum + b.value, 0);
      
      // Calculate net earnings
      if (totalWin > 0) {
        setBalance(prev => prev + totalWin);
        setResultMsg(`🎉 الرقم الفائز: ${rolled} (${rollColor === "red" ? "أحمر" : rollColor === "black" ? "أسود" : "أخضر"}). ربحت $${totalWin}! 🎉`);
        setResultCls("win");
        
        const winColor = rollColor === "red" ? "#f87171" : rollColor === "black" ? "#94a3b8" : "#4ade80";
        setWinOverlay({
          text: `🎰 ${rolled}`,
          color: winColor,
          sub: `ربحت +$${totalWin - totalBetAmount}`
        });

        spawnConfetti(winColor);
        setTimeout(() => setWinOverlay(null), 2500);
      } else {
        setResultMsg(`الرقم الفائز: ${rolled} (${rollColor === "red" ? "أحمر" : rollColor === "black" ? "أسود" : "أخضر"}). حظاً أوفر في الجولة القادمة!`);
        setResultCls("lose");
        
        setWinOverlay({
          text: `💔 ${rolled}`,
          color: "#f87171",
          sub: `خسرت -$${totalBetAmount}`
        });
        setTimeout(() => setWinOverlay(null), 1800);
      }

      // Clear bets for the next round
      setBets([]);

      // Fetch live AI dealer comment on rolled results
      fetchDealerComment("result", activeBets, rolled, totalWin);

    }, SPIN_DURATION_MS);
  };

  /* ─── Reset Game ─── */
  const handleReset = () => {
    if (isSpinning) return;
    setBalance(2000);
    setBets([]);
    setHistory([]);
    setWinningNumber(null);
    setSpinTargetNumber(null);
    setSpinCountdown(null);
    setWinOverlay(null);
    setLastBets([]);
    setResultMsg("تمت إعادة تهيئة اللعبة ورصيدك $2000.");
    setResultCls("idle");
    setDealerComment("أهلاً بكم مجدداً! تم إعادة تهيئة رصيدكم إلى $2,000. ضعوا رهاناتكم للبدء.");
  };

  const totalBet = bets.reduce((sum, b) => sum + b.value, 0);

  useEffect(() => {
    spinNowRef.current = handleSpin;
  });

  useEffect(() => {
    if (isSpinning || bets.length === 0 || spinCountdown === null) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSpinCountdown((current) => {
        if (current === null) return null;
        if (current <= 1) {
          spinNowRef.current();
          return null;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [bets.length, isSpinning, spinCountdown]);

  const statusColors: Record<ResultStatus, { color: string; bg: string; border: string; shadow: string }> = {
    idle: { color: "#93c5fd", bg: "rgba(96,165,250,0.08)", border: "#334155", shadow: "none" },
    win:  { color: "#4ade80", bg: "rgba(74,222,128,0.12)", border: "#4ade80", shadow: "0 0 20px rgba(74,222,128,0.3)" },
    lose: { color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "#f87171", shadow: "0 0 20px rgba(248,113,113,0.3)" },
  };
  const sc = statusColors[resultCls];

  return (
    <div
      className="roulette-page"
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(160deg,#020d08 0%,#0a2218 40%,#061410 100%)",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
        overflowY: "auto",
        fontFamily: "'Cairo', sans-serif",
      }}
    >
      {/* ═══ HEADER ═══ */}
      <header
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
          padding: "clamp(7px,1.8vw,12px) clamp(10px,2vw,18px)",
          background: "linear-gradient(90deg,#040e08,#0d2818,#040e08)",
          borderBottom: "2px solid #f5c518",
          boxShadow: "0 2px 20px rgba(245,197,24,0.15)",
          zIndex: 30,
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
              letterSpacing: 0,
              margin: 0,
            }}
          >
            🎡 ROULETTE PRO
          </h1>
          <div style={{ fontSize: "10px", color: "#555", letterSpacing: 0 }}>
            EUROPEAN SINGLE-ZERO WHEEL
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
          <div style={{ fontSize: "9px", color: "#888", letterSpacing: 0 }}>💰 رصيدك</div>
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

      {/* ═══ STATS & RECENT WINS ═══ */}
      <div
        className="flex-shrink-0 flex items-center justify-between border-b roulette-stats"
        style={{
          padding: "6px 16px",
          background: "rgba(0,0,0,0.3)",
          borderColor: "rgba(245,197,24,0.15)"
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500" style={{ fontSize: "11px" }}>آخر 10 نتائج:</span>
          <div className="flex gap-1">
            {history.length > 0 ? (
              history.map((num, i) => {
                const col = getNumberColor(num);
                const bg = col === "red" ? "#ef4444" : col === "black" ? "#1e293b" : "#22c55e";
                return (
                  <span
                    key={i}
                    className="flex items-center justify-center font-bold font-playfair animate-dot-pop"
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      fontSize: "11px",
                      background: bg,
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.25)",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.5)"
                    }}
                  >
                    {num}
                  </span>
                );
              })
            ) : (
              <span className="text-gray-600 text-xs">— لا يوجد جولات بعد —</span>
            )}
          </div>
        </div>
        
        {winningNumber !== null && (
          <div className="flex items-center gap-1">
            <span className="text-gray-500 text-xs">آخر رقم:</span>
            <span
              className="font-black px-3 py-0.5 rounded-full text-xs text-white"
              style={{
                background: getNumberColor(winningNumber) === "red" ? "#ef4444" : getNumberColor(winningNumber) === "black" ? "#1e293b" : "#22c55e",
                border: "1px solid rgba(255,255,255,0.3)"
              }}
            >
              {winningNumber}
            </span>
          </div>
        )}
      </div>

      {/* ═══ LIVE AI DEALER CHAT BUBBLE ═══ */}
      <div
        className="flex-shrink-0 flex items-center justify-center gap-3 px-4 py-2 roulette-dealer-bubble"
        style={{
          background: "rgba(0,0,0,0.5)",
          border: "1.5px solid rgba(245,197,24,0.35)",
          borderRadius: "20px",
          margin: "8px 16px 0 16px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.6)",
          position: "relative",
          zIndex: 35,
        }}
      >
        <div
          className="flex items-center justify-center font-bold"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "linear-gradient(135deg,#f5c518,#b45309)",
            border: "1.5px solid white",
            fontSize: "20px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.5)"
          }}
        >
          🤵
        </div>
        <div className="flex-1 text-right">
          <div style={{ fontSize: "9px", color: "#f5c518", fontWeight: 900 }}>🤵 الديلر الذكي (Gemini 2.5)</div>
          <div
            style={{
              fontSize: "clamp(12px, 3.2vw, 15px)",
              color: "white",
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            {dealerComment}
          </div>
        </div>
      </div>

      {/* ═══ ARENA (WHEEL & TABLE MAP) ═══ */}
      <div
        className="flex-1 flex flex-col justify-center items-center min-h-0 roulette-arena-scroll"
        style={{ padding: "clamp(8px,2vw,18px) clamp(8px,1.6vw,14px)", gap: "10px" }}
      >
        {/* Table wrapper - large responsive stage, coordinates stay based on the original 640x282 map */}
        <div
          className="w-full relative select-none overflow-hidden shadow-2xl roulette-table-shell"
          style={{
            width: "min(96vw, 1480px)",
            maxWidth: "1480px",
            aspectRatio: "640/282",
            border: "clamp(3px,0.45vw,6px) solid #f5c518",
            borderRadius: "12px",
            boxShadow: "0 15px 50px rgba(0,0,0,0.9), 0 0 35px rgba(245,197,24,0.25)",
            background: "linear-gradient(135deg,#062412,#031108)"
          }}
        >
          {/* Static Table SVG */}
          <Image
            src="/roulette/table.svg"
            alt="Roulette Table Grid"
            width={640}
            height={282}
            className="w-full h-full block pointer-events-none"
            style={{ objectFit: "cover", zIndex: 0 }}
            priority
          />

          <div
            className="absolute pointer-events-none overflow-hidden"
            style={{
              ...WHEEL_BOX_STYLE,
              zIndex: 1,
            }}
          >
            <Image
              src="/roulette/wheel.svg"
              alt="Roulette wheel bowl"
              width={245}
              height={282}
              className="w-full h-full object-cover roulette-wheel-base"
              style={{
                "--wheel-disc-clip": WHEEL_DISC_CLIP_PERCENT,
              } as React.CSSProperties}
              unoptimized
              priority
            />

            {isSpinning && winningNumber === null && (
              <Image
                src="/roulette/wheel.svg"
                alt=""
                width={245}
                height={282}
                className="w-full h-full object-cover roulette-wheel-disc is-spinning"
                style={{
                  "--spin-duration": `${SPIN_DURATION_MS}ms`,
                  "--wheel-disc-clip": WHEEL_DISC_CLIP_PERCENT,
                } as React.CSSProperties}
                unoptimized
              />
            )}

            {isSpinning && winningNumber === null && (
              <div
                className="roulette-ball-orbit-track"
                aria-hidden="true"
                style={{
                  "--ball-final-rotation": `${getBallOrbitRotation(spinTargetNumber ?? 0)}deg`,
                  "--spin-duration": `${SPIN_DURATION_MS}ms`,
                  "--wheel-orbit-size": WHEEL_ORBIT_SIZE_PERCENT,
                } as React.CSSProperties}
              >
                <Image
                  src="/roulette/roulette_ball.svg"
                  alt=""
                  width={34}
                  height={34}
                  className="roulette-ball-orbit"
                />
              </div>
            )}
          </div>

          {/* Winning Ball Pocket Indicator above wheel */}
          {winningNumber !== null && !isSpinning && (
            <div
              className="absolute flex items-center justify-center animate-chip-bounce-in"
              style={{
                left: `${getBallPosition(winningNumber).left}%`,
                top: `${getBallPosition(winningNumber).top}%`,
                transform: "translate(-50%, -50%)",
                width: `${getBallPosition(winningNumber).width}%`,
                height: `${getBallPosition(winningNumber).height}%`,
                zIndex: 25,
              }}
            >
              <Image
                src="/roulette/roulette_ball.svg"
                alt="Roulette Ball"
                width={30}
                height={30}
                className="roulette-settled-ball filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
              />
            </div>
          )}

          {/* Placed Chips & Hover Highlights Absolute Overlay Container */}
          <div
            className="absolute inset-0 z-10"
            style={{ pointerEvents: isSpinning ? "none" : "auto", cursor: "pointer" }}
            onClick={handleTableClick}
            onMouseMove={handleTableMouseMove}
            onMouseLeave={handleTableMouseLeave}
          >
            {/* Placed Chips */}
            {bets.map((bet) => (
              <div
                key={bet.id}
                className="absolute flex items-center justify-center animate-chip-bounce-in pointer-events-none"
                style={{
                  left: `${bet.left}%`,
                  top: `${bet.top}%`,
                  transform: "translate(-50%, -50%)",
                  width: "30px",
                  height: "30px",
                  zIndex: 20,
                }}
              >
                <Image
                  src={bet.chipImg}
                  alt={`Bet: $${bet.value}`}
                  width={30}
                  height={30}
                  className="animate-chip-float filter drop-shadow-[0_3px_5px_rgba(0,0,0,0.85)]"
                  style={{
                    width: "clamp(18px, 2.15vw, 30px)",
                    height: "clamp(18px, 2.15vw, 30px)",
                  }}
                />
                
                {/* Total Value Badge */}
                <span
                  className="absolute font-black text-center text-black bg-yellow-400 rounded-full flex items-center justify-center border border-white"
                  style={{
                    fontSize: "8px",
                    width: "15px",
                    height: "15px",
                    bottom: "-3px",
                    right: "-3px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.6)",
                  }}
                >
                  {bet.value}
                </span>
              </div>
            ))}

            {/* Glowing Golden Hover Bounding Box */}
            {hoveredBet && (
              <div
                className="absolute pointer-events-none transition-all duration-75 roulette-hover-outline"
                style={{
                  left: `${hoveredBet.left}%`,
                  top: `${hoveredBet.top}%`,
                  width: `${hoveredBet.width}%`,
                  height: `${hoveredBet.height}%`,
                  border: "2.5px solid rgba(245,197,24,0.95)",
                  background: "rgba(245,197,24,0.18)",
                  boxShadow: "0 0 15px rgba(245,197,24,0.7), inset 0 0 10px rgba(245,197,24,0.5)",
                  borderRadius: "4px",
                  zIndex: 15,
                }}
              />
            )}
          </div>

          {isSpinning && (
            <div className="roulette-lock-overlay pointer-events-none">
              <span>No More Bets</span>
            </div>
          )}

          {/* Nested Coin selection tray inside the green table felt at the bottom center */}
          <div
            className="absolute flex justify-center items-center pointer-events-auto roulette-chip-tray"
            style={{
              bottom: "4%",
              left: "50%",
              transform: "translateX(-50%)",
              gap: "clamp(10px, 1.8vw, 18px)",
              zIndex: 30,
              background: "rgba(0,0,0,0.45)",
              padding: "6px 16px",
              borderRadius: "20px",
              border: "1.5px solid rgba(245,197,24,0.35)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            }}
          >
            {CHIP_TRAY.map((c) => (
              <button
                key={c.val}
                onClick={(e) => {
                  e.stopPropagation(); // Stop trigger bet click on grid!
                  setSelectedChip(c.val);
                }}
                disabled={isSpinning}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: isSpinning ? "not-allowed" : "pointer",
                  opacity: isSpinning ? 0.4 : 1,
                }}
              >
                <Image
                  src={c.img}
                  alt={`Chip $${c.val}`}
                  width={46}
                  height={46}
                  className={`chip-img ${selectedChip === c.val ? "selected" : ""}`}
                  style={{
                    width: "clamp(34px, 3.4vw, 46px)",
                    height: "clamp(34px, 3.4vw, 46px)",
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ RESULT BANNER ═══ */}
      <div
        className="flex-shrink-0 text-center font-black flex items-center justify-center rounded-2xl mx-4 animate-banner-pop roulette-result-banner"
        style={{
          fontSize: "clamp(12px,3.5vw,17px)",
          padding: "6px 20px",
          minHeight: "36px",
          border: `2px solid ${sc.border}`,
          color: sc.color,
          background: sc.bg,
          boxShadow: sc.shadow,
          transition: "all 0.3s ease",
        }}
      >
        {isSpinning ? "🎰 تدور العجلة والكرة تبحث عن الجيب..." : bets.length > 0 && spinCountdown !== null ? `يغلق الديلر الرهانات خلال ${spinCountdown} ثواني` : resultMsg}
      </div>

      {/* ═══ BET AMOUNT STATE ═══ */}
      <div
        className="flex-shrink-0 flex items-center justify-center gap-2"
        style={{ minHeight: "26px", padding: "4px 12px" }}
      >
        <div
          className="flex items-center gap-1.5 rounded-2xl"
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1.5px dashed rgba(245,197,24,0.4)",
            padding: "3px 14px",
          }}
        >
          <span className="text-gray-500" style={{ fontSize: "10px" }}>مجموع الرهان الحالي:</span>
          <span className="font-black text-yellow-400" style={{ fontSize: "14px" }}>
            ${totalBet}
          </span>
        </div>
      </div>

      {/* ═══ ACTIONS ═══ */}
      <div
        className="flex-shrink-0 flex justify-center flex-wrap roulette-actions"
        style={{ gap: "clamp(5px,2vw,12px)", padding: "8px 12px" }}
      >
        <CasinoBtn
          onClick={handleSpin}
          grad="linear-gradient(135deg,#22c55e,#15803d)"
          disabled={isSpinning || bets.length === 0}
        >
          🎡 Spin
        </CasinoBtn>
        <CasinoBtn
          onClick={handleRepeatBets}
          grad="linear-gradient(135deg,#a855f7,#7e22ce)"
          disabled={isSpinning || lastBets.length === 0}
        >
          🔄 تكرار
        </CasinoBtn>
        <CasinoBtn
          onClick={handleClearBets}
          grad="linear-gradient(135deg,#ef4444,#991b1b)"
          disabled={isSpinning || bets.length === 0}
        >
          🗑 مسح الرهانات
        </CasinoBtn>
        <CasinoBtn
          onClick={handleReset}
          grad="linear-gradient(135deg,#64748b,#334155)"
          disabled={isSpinning}
        >
          🔄 جديد
        </CasinoBtn>
      </div>

      {/* ═══ FOOTER ═══ */}
      <div
        className="flex-shrink-0 text-center border-t"
        style={{ padding: "4px 8px", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <Link href="/" className="no-underline text-gray-700" style={{ fontSize: "9px" }}>
          Casino Games Pro © 2026
        </Link>
      </div>

      {/* ═══ WIN OVERLAY ═══ */}
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
              fontSize: "clamp(46px,14vw,100px)",
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
              className="animate-banner-pop"
              style={{
                fontSize: "clamp(16px,5vw,28px)",
                color: "white",
                fontWeight: 700,
                marginTop: "8px",
                background: "rgba(0,0,0,0.6)",
                padding: "4px 18px",
                borderRadius: "12px",
                border: "1.5px solid rgba(255,255,255,0.25)"
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

/* ─── Casino Action Button Sub-component ─── */
function CasinoBtn({
  onClick, grad, children, disabled = false,
}: {
  onClick: () => void; grad: string; children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={Boolean(disabled)}
      suppressHydrationWarning
      className="font-bold rounded-xl cursor-pointer border-0 font-cairo shadow-lg"
      style={{
        padding: "clamp(6px,2vw,10px) clamp(16px,4.5vw,24px)",
        fontSize: "clamp(11px,2.8vw,14px)",
        background: grad,
        color: "white",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s ease",
        boxShadow: disabled ? "none" : "0 4px 12px rgba(0,0,0,0.4)"
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
    >
      {children}
    </button>
  );
}
