"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCircularProgressBarProps {
  gaugePrimaryColor: string;
  gaugeSecondaryColor: string;
  className?: string;
  gifSrc?: string;
  gifAlt?: string;
  size?: number;
  /** مدة اللفة الكاملة بالميلي ثانية (default 3000ms = 3s) */
  duration?: number;
  /** يُستدعى بعد انتهاء اللفة الكاملة */
  onComplete?: () => void;
}

export function AnimatedCircularProgressBar({
  gaugePrimaryColor,
  gaugeSecondaryColor,
  className,
  gifSrc = "/wheel.gif",
  gifAlt = "progress animation",
  size = 160,
  duration = 3000,
  onComplete,
}: AnimatedCircularProgressBarProps) {
  const circumference = 2 * Math.PI * 45;

  // نستخدم CSS animation مباشرة بدل state لضمان سلاسة اللفة
  const circleRef = useRef<SVGCircleElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // نبدأ الـ animation بعد frame واحد حتى يكون المكوّن mounted
    const rafId = requestAnimationFrame(() => {
      const startTime = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const filled = progress * circumference;

        if (circleRef.current) {
          circleRef.current.style.strokeDasharray = `${filled} ${circumference}`;
        }
        if (glowRef.current) {
          glowRef.current.style.strokeDasharray = `${filled} ${circumference}`;
        }

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          setDone(true);
          onComplete?.();
        }
      };

      requestAnimationFrame(tick);
    });

    return () => cancelAnimationFrame(rafId);
  }, [circumference, duration, onComplete]);

  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
    >
      <svg
        fill="none"
        className="size-full"
        viewBox="0 0 100 100"
      >
        {/* Track (background ring) */}
        <circle
          cx="50"
          cy="50"
          r="45"
          strokeWidth="6"
          stroke={gaugeSecondaryColor}
          opacity="0.25"
          fill="none"
        />

        {/* Glow layer */}
        <circle
          ref={glowRef}
          cx="50"
          cy="50"
          r="45"
          strokeWidth="8"
          strokeLinecap="round"
          stroke={gaugePrimaryColor}
          fill="none"
          style={{
            strokeDasharray: `0 ${circumference}`,
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
            opacity: 0.3,
            filter: `drop-shadow(0 0 6px ${gaugePrimaryColor})`,
          }}
        />

        {/* Main progress arc */}
        <circle
          ref={circleRef}
          cx="50"
          cy="50"
          r="45"
          strokeWidth="6"
          strokeLinecap="round"
          stroke={gaugePrimaryColor}
          fill="none"
          style={{
            strokeDasharray: `0 ${circumference}`,
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
          }}
        />
      </svg>

      {/* GIF in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={gifSrc}
          alt={gifAlt}
          className="rounded-full object-cover"
          style={{
            width: size * 0.78,
            height: size * 0.78,
          }}
        />
      </div>
    </div>
  );
}
