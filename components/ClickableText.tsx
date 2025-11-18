"use client";

import { useState } from "react";

interface ClickableTextProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function ClickableText({
  children,
  onClick,
  className = "",
}: ClickableTextProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative inline-block px-4 py-2 text-2xl lg:text-4xl
        transition-all duration-300
        bg-transparent border-none
        text-neutral-800
        ${className}
      `}
      style={{
        fontFamily: "inherit",
        cursor: "default",
        opacity: isHovered ? 0.7 : 1,
      }}
    >
      {children}
    </button>
  );
}
