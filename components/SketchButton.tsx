"use client";

import { useEffect, useRef } from "react";
import rough from "roughjs";

interface SketchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  stroke?: string;
  strokeWidth?: number;
  roughness?: number;
  bowing?: number;
  fill?: string;
  fillStyle?: string;
  fillWeight?: number;
  hachureGap?: number;
  inset?: number;
  seed?: number;
  radius?: number;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
}

export default function SketchButton({
  children,
  onClick,
  className = "",
  stroke = "currentColor",
  strokeWidth = 2,
  roughness = 1,
  bowing = 1,
  fill = "transparent",
  fillStyle = "hachure",
  fillWeight = 1,
  hachureGap = 4,
  inset = 0,
  seed,
  radius = 0,
  disabled = false,
  loading = false,
  type = "button",
}: SketchButtonProps) {
  const hostRef = useRef<HTMLButtonElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const drawRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    const svg = svgRef.current;
    if (!host || !svg) return;

    const draw = () => {
      const rc = rough.svg(svg);
      while (svg.firstChild) svg.removeChild(svg.firstChild);

      const rect = host.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      svg.setAttribute("width", String(w));
      svg.setAttribute("height", String(h));

      const left = inset;
      const top = inset;
      const right = w - inset * 2;
      const bottom = h - inset * 2;

      const node = rc.rectangle(left, top, right, bottom, {
        stroke,
        strokeWidth: strokeWidth + 1, // 버튼은 더 굵은 선
        roughness: roughness + 0.5, // 버튼은 더 거친 느낌
        bowing,
        fill,
        fillStyle,
        fillWeight,
        hachureGap,
        seed,
        curveStepCount: 8,
        fillLineDash: undefined,
        fillLineDashOffset: 0,
      });

      if (radius > 0) {
        const clipId = `clip-${seed ?? 0}-${Math.round(Math.random() * 1e6)}`;
        const clip = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "clipPath"
        );
        clip.setAttribute("id", clipId);
        const rrect = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        rrect.setAttribute("x", String(left));
        rrect.setAttribute("y", String(top));
        rrect.setAttribute("width", String(Math.max(0, right)));
        rrect.setAttribute("height", String(Math.max(0, bottom)));
        rrect.setAttribute("rx", String(radius));
        rrect.setAttribute("ry", String(radius));
        clip.appendChild(rrect);
        svg.appendChild(clip);
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("clip-path", `url(#${clipId})`);
        g.appendChild(node);
        svg.appendChild(g);
      } else {
        svg.appendChild(node);
      }
    };

    drawRef.current = draw;
    draw();

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => drawRef.current && drawRef.current());
    });
    if (hostRef.current) {
      ro.observe(hostRef.current);
    }
    return () => ro.disconnect();
  }, [
    stroke,
    strokeWidth,
    roughness,
    bowing,
    fill,
    fillStyle,
    fillWeight,
    hachureGap,
    inset,
    seed,
    radius,
  ]);

  return (
    <button
      ref={hostRef}
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
      className={`relative rounded-2xl px-4 py-2 lg:px-6 lg:py-3 bg-neutral-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 ${className}`}
      style={{ cursor: disabled || loading ? "not-allowed" : "pointer" }}
    >
      <svg
        ref={svgRef}
        aria-hidden
        className="pointer-events-none absolute inset-0"
        role="presentation"
      />
      <div className="relative z-10 flex items-center justify-center gap-2 leading-tight">
        {loading && (
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </div>
    </button>
  );
}
