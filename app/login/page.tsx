"use client";

import { useRouter } from "next/navigation";
import ClickableText from "@/components/ClickableText";

export default function Login() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex-col flex items-center justify-center relative">
      <div className="text-center">
        <p>아직 만드는 중이에요</p>
      </div>

      <div className="fixed bottom-8 left-8">
        <ClickableText onClick={() => router.push("/")}>← 뒤로</ClickableText>
      </div>
    </div>
  );
}
