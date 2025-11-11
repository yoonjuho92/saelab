"use client";

import { Day1Provider } from "./context";

export default function Day1Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Day1Provider>{children}</Day1Provider>;
}
