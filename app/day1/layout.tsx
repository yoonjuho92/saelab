"use client";

import { Day1Provider } from "./context";

export default function Day1Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Day1Provider>
      <div className="h-full overflow-y-auto w-full">{children}</div>
    </Day1Provider>
  );
}
