"use client";

import { useEffect, useRef } from "react";
import rough from "roughjs";

interface SketchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  stroke?: string;
  strokeWidth?: number;
  roughness?: number;
  bowing?: number;
  inset?: number;
  seed?: number;
  radius?: number;
  multiline?: boolean;
  rows?: number;
  type?: string;
  required?: boolean;
}

export default function SketchInput({
  value,
  onChange,
  placeholder = "",
  className = "",
  stroke = "currentColor",
  strokeWidth = 2,
  roughness = 1,
  bowing = 1,
  inset = 0,
  seed,
  radius = 0,
  multiline = false,
  rows = 3,
  type = "text",
  required = false,
}: SketchInputProps) {
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
        fill: "transparent",
        seed,
        curveStepCount: 8,
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

    // Force redraw on mount/update
    const timeout = setTimeout(() => draw(), 50);

    return () => {
      ro.disconnect();
      clearTimeout(timeout);
    };
  }, [stroke, strokeWidth, roughness, bowing, inset, seed, radius]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (multiline && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
  }, [value, multiline]);

  if (multiline) {
    return (
      <div
        ref={hostRef}
        className="relative rounded-2xl px-4 py-2 bg-white/80 shadow-sm"
      >
        <svg
          ref={svgRef}
          aria-hidden
          className="pointer-events-none absolute inset-0"
          role="presentation"
        />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          required={required}
          className={`relative z-10 w-full bg-transparent border-none outline-none text-neutral-800 placeholder:text-neutral-400 placeholder:lg:text-2xl resize-none overflow-hidden ${className}`}
          style={{
            fontFamily: "inherit",
            height: "auto",
            minHeight: `${rows * 1.5}em`,
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = target.scrollHeight + "px";
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      className="relative rounded-2xl px-4 py-2 bg-white/80 shadow-sm"
    >
      <svg
        ref={svgRef}
        aria-hidden
        className="pointer-events-none absolute inset-0"
        role="presentation"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        required={required}
        className={`relative z-10 w-full bg-transparent border-none outline-none text-neutral-800 placeholder:text-neutral-400 placeholder:lg:text-2xl ${className}`}
        style={{ fontFamily: "inherit" }}
      />
    </div>
  );
}
