"use client";

import { Day3Provider } from "./context";

export default function Day3Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Day3Provider>
      <div className="h-screen w-full overflow-y-auto">{children}</div>
    </Day3Provider>
  );
}
