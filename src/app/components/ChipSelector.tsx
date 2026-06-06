"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Chip {
  value: number;
  image: string;
}

interface ChipSelectorProps {
  /** Fires whenever the selected chip changes */
  onSelect?: (value: number) => void;
  /** Currently selected chip value (controlled) */
  value?: number;
  /** Initially selected chip value (default: 25) */
  defaultValue?: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CHIPS: Chip[] = [
  
  { value: 100, image: "/roulette/100_chip.svg" },
  { value: 50, image: "/roulette/50_chip.svg" },
  { value: 25, image: "/roulette/25_chip.svg" },
  { value: 5, image: "/roulette/5_chip.svg" },
  { value: 2, image: "/roulette/2_chip.svg" },
  { value: 1, image: "/roulette/1_chip.svg" },
  
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

/** Returns Tailwind scale + opacity classes based on distance from center */
function chipVariant(dist: number): {
  scale: string;
  opacity: string;
  z: string;
  translateY: string;
} {
  if (dist === 0)
    return {
      scale: "scale-[1.32]",
      opacity: "opacity-100",
      z: "z-10",
      translateY: "-translate-y-1",
    };
  if (dist === 1)
    return {
      scale: "scale-[0.88]",
      opacity: "opacity-80",
      z: "z-[5]",
      translateY: "translate-y-0",
    };
  return {
    scale: "scale-[0.72]",
    opacity: "opacity-40",
    z: "z-[1]",
    translateY: "translate-y-0",
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ArrowButtonProps {
  direction: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}

function ArrowButton({ direction, disabled, onClick }: ArrowButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "left" ? "Previous chip" : "Next chip"}
      className={[
        // sizing – scales with viewport
        "flex items-center mt-4 sm:mt-12 md:mt-24 justify-center",
        "w-7 h-7 z-40 shadow-md sm:w-8 sm:h-8 md:w-9 md:h-9",
        "rounded-full flex-shrink-0",
        "transition-all duration-200 outline-none",
        "hover:bg-white/10 active:scale-90",
        disabled ? "opacity-20 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      <svg
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        // icon scales with the button
        className="w-3 h-3 sm:w-3.5 sm:h-3.5"
      >
        {direction === "left" ? (
          <path
            d="M9 2L4.5 7L9 12"
            stroke="rgba(200,215,255,0.85)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M5 2L9.5 7L5 12"
            stroke="rgba(200,215,255,0.85)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChipSelector({
  onSelect,
  value,
  defaultValue = 25,
}: ChipSelectorProps) {
  const defaultIndex = CHIPS.findIndex((c) => c.value === defaultValue);
  const [centerIndex, setCenterIndex] = useState(
    defaultIndex >= 0 ? defaultIndex : 2,
  );

  // Keep a stable ref to onSelect to prevent triggering dependency changes
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const [animating, setAnimating] = useState(false);
  const controlledIndex =
    value === undefined ? -1 : CHIPS.findIndex((c) => c.value === value);
  const activeCenterIndex =
    controlledIndex >= 0 ? controlledIndex : centerIndex;

  // Chip cell width drives the track offset.
  // We use CSS custom property set inline so Tailwind JIT doesn't have to know the value.
  // The cell width is purely for transform calculation; visual sizing comes from Tailwind.
  const CHIP_CELL_PX = 72; // base px used for translateX math only

  const navigate = useCallback(
    (direction: -1 | 1) => {
      if (animating) return;
      const next = clamp(activeCenterIndex + direction, 0, CHIPS.length - 1);
      if (next === activeCenterIndex) return;
      setAnimating(true);
      setCenterIndex(next);
      onSelectRef.current?.(CHIPS[next].value);
      setTimeout(() => setAnimating(false), 320);
    },
    [activeCenterIndex, animating],
  );

  const handleChipClick = (index: number) => {
    if (animating || index === activeCenterIndex) return;
    setAnimating(true);
    setCenterIndex(index);
    onSelectRef.current?.(CHIPS[index].value);
    setTimeout(() => setAnimating(false), 320);
  };

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") navigate(-1);
      if (e.key === "ArrowRight") navigate(1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  // 5 chips are visible; center chip sits in slot 2 (0-indexed)
  const HALF = 2;
  const trackOffsetPx = -(activeCenterIndex - HALF) * CHIP_CELL_PX;

  return (
    <div
      className="flex flex-col items-center mt-4 sm:mt-12 md:mt-24"
      dir="ltr"
      style={{ direction: "ltr" }}
    >
      {/* ── Pill container ── */}
      <div
        className={[
          "relative flex items-center",
          // horizontal padding scales up on larger screens
          "px-4 sm:px-2 md:px-3",
          // gap between arrows and strip
          "gap-2",
          "rounded-[60px]",
          // background & border
          "border border-white/10",
          // shadow
          "shadow-[inset_0_1px_0_rgba(255,255,255,.08),inset_0_-1px_0_rgba(0,0,0,.4),0_4px_32px_rgba(0,0,0,.7)]",
          // select none
          "select-none",
        ].join(" ")}
        style={{
          background: "linear-gradient(180deg, #363636ff 0%, #575757ff 100%)",
          height: "calc(var(--chip-size) + 10px)",
        }}
      >
        {/* ── Left arrow ── */}
        <ArrowButton
          direction="left"
        disabled={activeCenterIndex === 0 || animating}
          onClick={() => navigate(-1)}
        />

        {/* ── Chip viewport ── */}
        {/*
          Width = 5 chips × cell.
          On mobile we show 5 chips at 56px each; on sm 64px; on md+ 72px.
          The CSS variable --cell drives the track translation.
        */}
        <div
          className="relative overflow-hidden"
          style={
            {
              
              // responsive viewport width: 5 cells
            width: "calc(5.7 * var(--chip-cell))",
              height: "calc(1.6* var(--chip-size))",
            } as React.CSSProperties
          }
        >
          {/* Left / right fade masks */}
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              background:
                "linear-gradient(90deg, #000000ff 0%, transparent 20%, transparent 80%, #000000ff 100%)",
            }}
          />

          {/* Scrolling track */}
          <div
            className={[
              "flex items-center",
              animating
                ? "transition-transform duration-[320ms] [transition-timing-function:cubic-bezier(0.34,1.4,0.64,1)]"
                : "",
            ].join(" ")}
          style={{
  gap: "var(--chip-gap)",
  transform: `translateX(${trackOffsetPx}px)`,
  height: "100%",
  paddingLeft: "15px",
}}
          >
            {CHIPS.map((chip, i) => {
              const dist = Math.abs(i - activeCenterIndex);
              const isCenter = dist === 0;
              const { scale, opacity, z, translateY } = chipVariant(dist);
              return (
                <div
                  key={chip.value}
                  onClick={() => handleChipClick(i)}
                  className={[
                    "relative flex-shrink-0 flex z-50 items-center justify-center",
                    // chip cell sizing – drives track math via CSS var
                    "w-[var(--chip-size)] h-[var(--chip-size)]",
                    scale,
                    opacity,
                    z,
                    translateY,
                    "transition-[transform,opacity] duration-300",
                    "[transition-timing-function:cubic-bezier(0.34,1.4,0.64,1)]",
                    isCenter ? "cursor-default" : "cursor-pointer",
                  ].join(" ")}
                  style={{
                    zIndex: isCenter ? 30 : undefined,
                  }}
                >
                  {/* Glow ring – only on selected chip */}
                  {isCenter && (
                    <span
                      className="absolute inset-[5px] bg-transparent rounded-full pointer-events-none animate-[glowPulse_3.2s_ease-in-out_infinite]"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(38, 212, 255, 0.18) 0%, transparent 70%)",
                        boxShadow:
                          "0 0 3px 5px rgba(75, 249, 255, 0.75), 0 0 4px 2px rgba(150, 150, 150, 0.48)",
                      }}
                    />
                  )}

                  <img
                    src={chip.image}
                    alt={`${chip.value} chip`}
                    draggable={false}
                    className="w-full h-full z-[100] object-contain block"
                    style={{
                      filter: isCenter
                        ? "drop-shadow(0 6px 14px rgba(10, 10, 10, 0.12))"
                        : "drop-shadow(0 2px 4px rgba(0,0,0,.5))",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right arrow ── */}
        <ArrowButton
          direction="right"
          disabled={activeCenterIndex === CHIPS.length - 1 || animating}
          onClick={() => navigate(1)}
        />

        {/* ── Selection triangle ── */}
        {/* <span
          className="absolute -bottom-[10px] left-[55%] -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: "7px solid transparent",
            borderRight: "7px solid transparent",
            borderBottom: "10px solid rgba(200,215,255,0.5)",
            filter: "drop-shadow(0 1px 3px rgba(130,180,255,.4))",
          }}
        /> */}
      </div>

      {/*
        ── CSS custom properties + keyframe ──
        These responsive values feed both the track-offset math (via JS) and
        the Tailwind arbitrary-value classes above.
        
        Default (mobile-first): 56 px chips, 6 px gap → cell = 62 px
        sm (≥640 px):           64 px chips, 7 px gap → cell = 71 px
        md (≥768 px):           72 px chips, 8 px gap → cell = 80 px

        NOTE: The JS track offset uses the fixed 72px value from the constant
        above which is fine for the bounce animation; the visual cell width is
        driven by CSS vars for pixel-perfect responsive rendering.
      */}
      <style>{`
        :root {
          --chip-size: 56px;
          --chip-gap:  6px;
          --chip-cell: 42px;
        }
        @media (min-width: 640px) {
          :root {
            --chip-size: 54px;
            --chip-gap:  8px;
            --chip-cell: 55px;
          }
        }
        @media (min-width: 768px) {
          :root {
            --chip-size: 95px;
            --chip-gap:  11px;
            --chip-cell: 85px;
          }
        }
        @keyframes glowPulse {
          0%,100% { opacity: .75; transform: scale(1);    }
          50%      { opacity: 1;   transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
}
