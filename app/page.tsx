"use client";

import { useState } from "react";
import SketchCard from "@/components/SketchCard";
import ClickableText from "@/components/ClickableText";
import Image from "next/image";

export default function Home() {
  const [currentPage, setCurrentPage] = useState(1);

  const page1 = (
    <div className="flex flex-col">
      <Image
        src="/day1/glint.png"
        alt="Lookmal Logo"
        width={100}
        height={100}
        className="transform scale-x-[-1]"
      />
      <p>
        안녕하세요. 저는 당신이 당신만의 이야기를 만드는 걸 도와줄 룩말이라고
        해요!
      </p>
      <div className="flex mt-6 justify-center">
        <ClickableText onClick={() => setCurrentPage(2)}>
          [ 시작하기 ]
        </ClickableText>
      </div>
    </div>
  );

  const page2 = (
    <div>
      <p>당신은...</p>
      <div className="flex flex-col gap-4 mt-4">
        <SketchCard className="py-2 w-fit">오늘 처음 왔어요!</SketchCard>
        <SketchCard className="py-2">
          저번에 시작했던 걸 이어서 하고 싶어요!
        </SketchCard>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex-col flex items-center justify-center relative">
      {currentPage === 1 ? page1 : page2}

      {currentPage > 1 && (
        <div className="fixed bottom-8 right-8">
          <ClickableText onClick={() => setCurrentPage(currentPage - 1)}>
            ← 뒤로
          </ClickableText>
        </div>
      )}
    </div>
  );
}
