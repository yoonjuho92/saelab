"use client";

import { useRouter } from "next/navigation";
import ClickableText from "@/components/ClickableText";
import Image from "next/image";

export default function Day3Page() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex-col flex items-center justify-center relative">
      <div className="text-center">
        <Image
          src="/day1/glint.png"
          alt="Lookmal Logo"
          width={100}
          height={100}
          className="transform scale-x-[-1] mx-auto mb-6"
        />
        <p>아직 만드는 중이에요!</p>
      </div>

      <div className="fixed bottom-8 left-8">
        <ClickableText onClick={() => router.push("/dashboard")}>
          ← 뒤로
        </ClickableText>
      </div>
    </div>
  );
}
