"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ClickableText from "@/components/ClickableText";
import SketchInput from "@/components/SketchInput";
import SketchButton from "@/components/SketchButton";
import Image from "next/image";
import { useDay2Context, StoryStructure } from "./context";

interface StoryCardProps {
  story: StoryStructure;
}

function StoryCard({ story }: StoryCardProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 lg:p-8 bg-white/80 dark:bg-neutral-900/70 rounded-xl lg:rounded-2xl border-2 border-neutral-300 dark:border-neutral-700">
        <div className="space-y-6 lg:space-y-8">
          {Object.entries(story.막).map(([actName, beats]) => (
            <div key={actName}>
              <h4 className="text-sm lg:text-2xl font-bold mb-3 lg:mb-4 uppercase tracking-wider">
                {actName}
              </h4>
              <div className="space-y-3 lg:space-y-4 pl-1 lg:pl-2">
                {beats.map((beat, idx) => (
                  <div
                    key={idx}
                    className="border-l-2 lg:border-l-4 border-neutral-800 dark:border-neutral-300 pl-2 lg:pl-4"
                  >
                    <p className="font-bold text-base lg:text-2xl text-neutral-400 dark:text-neutral-500 mb-1 lg:mb-2">
                      {beat.이름}
                    </p>
                    <p className="text-sm lg:text-2xl leading-relaxed">
                      {beat.내용}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Day2Page() {
  const router = useRouter();
  const { logline, setLogline, story, setStory, saveStoryToDB } =
    useDay2Context();
  const [currentPage, setCurrentPage] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isGeneratingStories, setIsGeneratingStories] = useState(false);

  const handlePageChange = (newPage: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentPage(newPage);
      setIsTransitioning(false);
    }, 300);
  };

  const generateStories = async () => {
    if (!logline.trim()) {
      alert("로그라인을 입력해주세요!");
      return;
    }

    setIsGeneratingStories(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptName: "create_from_logline",
          variables: { logline },
          responseFormat: "json",
        }),
      });

      if (!response.ok) throw new Error("Failed to generate story");
      const data = await response.json();

      setStory(data.result);

      // Save to database with the generated story
      await saveStoryToDB(data.result);

      handlePageChange(4);
    } catch (error) {
      console.error("Error generating stories:", error);
      alert("이야기 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingStories(false);
    }
  };

  const page1 = (
    <div className="flex flex-col">
      <Image
        src="/생각룩말말풍선.gif"
        alt="Lookmal Logo"
        width={150}
        height={10}
        className="transform scale-x-[-1]"
      />
      <p>오늘은 드디어 나만의 이야기를 시작해 볼 거예요!</p>
      <div className="flex mt-6 justify-center">
        <ClickableText onClick={() => handlePageChange(2)}>
          [ 다음 ]
        </ClickableText>
      </div>
    </div>
  );

  const page2 = (
    <div className="flex flex-col">
      <Image
        src="/포스트잇.png"
        alt="Lookmal Logo"
        width={50}
        height={100}
        className="transform scale-x-[-1]"
      />
      <p>
        오늘은 나의 로그라인을 가지고, 지난주에 했던 이야기 구조 짜기를 해 볼
        거예요.
      </p>
      <div className="flex mt-6 justify-center">
        <ClickableText onClick={() => handlePageChange(3)}>
          [ 다음 ]
        </ClickableText>
      </div>
    </div>
  );

  const page3 = (
    <div className="flex flex-col">
      <Image
        src="/day1/glint.png"
        alt="Lookmal Logo"
        width={100}
        height={100}
        className="transform scale-x-[-1]"
      />
      <p>
        그럼, 지난 시간에 연습해 본 대로, 내가 만들고 싶은 이야기의 씨앗,
        로그라인을 입력해 볼까요?
      </p>

      <div className="mt-6">
        <SketchInput
          value={logline}
          onChange={setLogline}
          placeholder="예: 꿈을 현실로 만드는 능력을 얻은 소년이, 그 힘의 대가로 현실과 꿈의 경계가 무너지면서 자신의 정체성을 지키려 분투한다."
        />
      </div>

      <div className="flex mt-6 justify-center">
        <SketchButton
          onClick={generateStories}
          disabled={isGeneratingStories || !logline.trim()}
          loading={isGeneratingStories}
        >
          {isGeneratingStories
            ? "이야기 만드는 중..."
            : "내 로그라인으로 이야기 만들기"}
        </SketchButton>
      </div>
    </div>
  );

  const page4 = (
    <div className="flex flex-col h-full">
      <div className="shrink-0 mb-4">
        <Image
          src="/day1/glint.png"
          alt="Lookmal Logo"
          width={100}
          height={100}
          className="transform scale-x-[-1]"
        />
        {story ? (
          <>
            <p className="mt-2 text-xl lg:text-2xl text-neutral-600 dark:text-neutral-400">
              로그라인: {logline}
            </p>
          </>
        ) : (
          <p className="mt-4">
            아직 생성된 이야기가 없어요. 3단계에서 이야기를 만들어주세요!
          </p>
        )}
      </div>

      <div className="flex-1 min-h-0">
        {story && <StoryCard story={story} />}
      </div>
    </div>
  );

  return (
    <div
      className={`flex-col flex items-center justify-center relative ${
        currentPage === 4 ? "h-screen overflow-hidden p-8" : "min-h-screen p-8"
      }`}
    >
      <div
        className={`transition-opacity items-center flex flex-col duration-300 w-full max-w-6xl ${
          isTransitioning ? "opacity-0" : "opacity-100"
        } ${currentPage === 4 ? "h-full flex flex-col" : ""}`}
      >
        {currentPage === 1 && page1}
        {currentPage === 2 && page2}
        {currentPage === 3 && page3}
        {currentPage === 4 && page4}
      </div>

      {currentPage > 1 && (
        <div className="fixed bottom-8 left-8">
          <ClickableText onClick={() => handlePageChange(currentPage - 1)}>
            ← 뒤로
          </ClickableText>
        </div>
      )}

      {currentPage < 4 && (
        <div className="fixed bottom-8 right-8">
          <ClickableText onClick={() => handlePageChange(currentPage + 1)}>
            다음 →
          </ClickableText>
        </div>
      )}
    </div>
  );
}
