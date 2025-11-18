"use client";

import { useEffect, useRef } from "react";
import rough from "roughjs";

interface SketchCardProps {
  children: React.ReactNode;
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
  onClick?: () => void;
}

export default function SketchCard({
  children,
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
  onClick,
}: SketchCardProps) {
  const hostRef = useRef<HTMLDivElement>(null);
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
        strokeWidth,
        roughness,
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

      // If radius > 0, clip to a rounded-rect so the sketch lines don't spill past corners visually
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
      // Batch with rAF to avoid resize thrash
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
    <div
      ref={hostRef}
      onClick={onClick}
      className={`relative rounded-2xl p-6 bg-white/80 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] active:shadow-md ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {/* The SVG overlay that paints the sketch border */}
      <svg
        ref={svgRef}
        aria-hidden
        className="pointer-events-none absolute inset-0"
        role="presentation"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
