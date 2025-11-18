"use client";

import { useRouter } from "next/navigation";
import SketchCard from "@/components/SketchCard";
import ClickableText from "@/components/ClickableText";
import Image from "next/image";

interface DayCardProps {
  day: number;
  description: string;
  onClick: () => void;
}

function DayCard({ day, description, onClick }: DayCardProps) {
  return (
    <SketchCard
      className="py-4 px-6 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="text-xl lg:text-2xl font-bold mb-2 text-neutral-600 dark:text-neutral-400">
        Day {day}
      </div>
      <div className="text-xl lg:text-2xl">{description}</div>
    </SketchCard>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const days = [
    {
      day: 2,
      description: "나만의 로그라인으로 이야기 구조 만들기",
      route: "/day2",
    },
    {
      day: 3,
      description: "인물 만들기",
      route: "/day3",
    },
    {
      day: 4,
      description: "1막 트리트먼트 만들기",
      route: "/day4",
    },
    {
      day: 5,
      description: "드디어 1화, 소설 쓰기!",
      route: "/day5",
    },
  ];

  return (
    <div className="min-h-screen flex-col flex items-center justify-center relative">
      <div className="w-full max-w-4xl px-4">
        <div className="flex items-center justify-between">
          <Image
            src="/day1/glint.png"
            alt="Lookmal Logo"
            width={100}
            height={100}
            className="transform scale-x-[-1]"
          />
        </div>

        <p className="mb-6">오늘이 몇 번째 방문인가요?</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {days.map((dayInfo) => (
            <DayCard
              key={dayInfo.day}
              day={dayInfo.day}
              description={dayInfo.description}
              onClick={() => router.push(dayInfo.route)}
            />
          ))}
        </div>
      </div>

      <div className="fixed bottom-8 left-8">
        <ClickableText onClick={() => router.push("/")}>← 뒤로</ClickableText>
      </div>
    </div>
  );
}
