"use client";

import { useState } from "react";

interface ClickableTextProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export default function ClickableText({
  children,
  onClick,
  className = "",
  disabled = false,
}: ClickableTextProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
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
        opacity: disabled ? 0.3 : isHovered ? 0.7 : 1,
      }}
    >
      {children}
    </button>
  );
}
