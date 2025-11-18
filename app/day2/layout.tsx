"use client";

import { Day2Provider } from "./context";

export default function Day2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Day2Provider>
      <div className="h-screen w-full overflow-y-auto">{children}</div>
    </Day2Provider>
  );
}
