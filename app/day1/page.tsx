"use client";

import { useState } from "react";
import ClickableText from "@/components/ClickableText";
import SketchInput from "@/components/SketchInput";
import SketchButton from "@/components/SketchButton";
import SketchSelect from "@/components/SketchSelect";
import { useRouter } from "next/navigation";
import { useDay1Context, StoryStructure } from "./context";

interface StoryCardProps {
  story: StoryStructure;
}

const frameworkDescriptions: Record<string, string> = {
  "폴 조셉 줄리노 3막 8시퀀스":
    "3막을 8개의 시퀀스로 나누어 구조화. 설정 → 문제 발생 → 해결 시도 → 위기 → 결말의 고전적 구조.",
  "크리스토퍼 보글러 영웅의 여정":
    "신화학자 조셉 캠벨의 이론을 각색한 12단계 구조. 일상 → 모험 → 시련 → 귀환의 영웅 서사.",
  "블레이크 스나이더 15장":
    "할리우드 시나리오 작법의 정석. 15개의 장으로 세분화하여 리듬과 템포를 정교하게 조율.",
};

function StoryCard({ story }: StoryCardProps) {
  const description = frameworkDescriptions[story.metadata.framework] || "";

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 lg:p-8 bg-white/80 dark:bg-neutral-900/70 rounded-xl lg:rounded-2xl border-2 border-neutral-300 dark:border-neutral-700">
        {description && (
          <p className="text-xl lg:text-3xl text-neutral-600 dark:text-neutral-400 mb-4 lg:mb-6 text-center italic">
            {description}
          </p>
        )}
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

export default function Day() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { logline, setLogline, stories, setStories } = useDay1Context();
  const [genre, setGenre] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingStories, setIsGeneratingStories] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<
    "gulino" | "vogel" | "snider"
  >("gulino");

  const genreOptions = [
    "SF",
    "로맨스",
    "판타지",
    "무협",
    "스릴러",
    "일상",
    "대체역사",
  ];

  const handlePageChange = (newPage: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentPage(newPage);
      setIsTransitioning(false);
    }, 300);
  };

  const page1 = (
    <div>
      <p>만나서 반가워요!</p>
      <div className="flex mt-6 justify-center">
        <ClickableText onClick={() => handlePageChange(2)}>
          [다음]
        </ClickableText>
      </div>
    </div>
  );

  const page2 = (
    <div>
      <p>
        처음 이야기를 만들 생각을 하면, 그 이야기가 웹소설이든, 영화든 길고,
        복잡하고, 큰 무언가를 만들어야 한다는 생각에 벅찰 수 있어요.
      </p>
      <div className="flex mt-6 justify-center">
        <ClickableText onClick={() => handlePageChange(3)}>
          [다음]
        </ClickableText>
      </div>
    </div>
  );

  const page3 = (
    <div>
      <p>
        그래서 오늘, 자신만의 이야기를 만드는 5일 여정의 첫날에는 길고, 크고,
        복잡한 이야기를 만드는 과정을 쉽고 재밌게 만들어 줄 도구인{" "}
        <span className="font-bold">구조</span>에 대해 배워 볼 거예요!
      </p>
      <div className="flex mt-6 justify-center">
        <ClickableText onClick={() => handlePageChange(4)}>
          [직접 쓰는 건 내일부터! 오늘은 AI의 도움을 받아 볼까요?]
        </ClickableText>
      </div>
    </div>
  );

  const handleGenerateLogline = async () => {
    if (!genre) {
      alert("장르를 선택해주세요!");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promptName: "create_logline",
          variables: { genre },
          responseFormat: "text",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate logline");
      }

      const data = await response.json();
      // 앞뒤 따옴표 제거
      const cleanedLogline = data.result.replace(/^["']|["']$/g, "");
      setLogline(cleanedLogline);
    } catch (error) {
      console.error("Error:", error);
      alert("로그라인 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateStories = async () => {
    if (!logline.trim()) {
      alert("로그라인을 먼저 입력해주세요!");
      return;
    }

    setIsGeneratingStories(true);
    try {
      // 3개의 API 호출을 병렬로 실행
      const [gulinoRes, vogelRes, sniderRes] = await Promise.all([
        fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            promptName: "create_from_logline_w_gulino",
            variables: { logline },
            responseFormat: "json",
          }),
        }),
        fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            promptName: "create_from_logline_w_vogel",
            variables: { logline },
            responseFormat: "json",
          }),
        }),
        fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            promptName: "create_from_logline_w_snider",
            variables: { logline },
            responseFormat: "json",
          }),
        }),
      ]);

      if (!gulinoRes.ok || !vogelRes.ok || !sniderRes.ok) {
        throw new Error("Failed to generate stories");
      }

      const [gulinoData, vogelData, sniderData] = await Promise.all([
        gulinoRes.json(),
        vogelRes.json(),
        sniderRes.json(),
      ]);

      setStories({
        gulino: gulinoData.result,
        vogel: vogelData.result,
        snider: sniderData.result,
      });

      // 다음 페이지로 이동
      handlePageChange(5);
    } catch (error) {
      console.error("Error:", error);
      alert("이야기 구조 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsGeneratingStories(false);
    }
  };

  const page4 = (
    <div className="w-full px-4">
      <p className="mb-6 text-center">
        이야기의 핵심을 한 문장으로 표현하는 로그라인을 만들어봅시다!
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-xl mb-2">로그라인</label>
          <SketchInput
            value={logline}
            onChange={setLogline}
            placeholder="예: 한 젊은 농부가 은하계를 구하기 위해 제다이가 되는 여정을 떠난다."
            rows={4}
            seed={42}
          />
        </div>

        <div className="border-b-2 flex items-center flex-col lg:flex-row border-neutral-300 dark:border-neutral-700 pb-6">
          <p className="text-center mr-2">
            로그라인이 생각나지 않으면 AI의 도움을 받아
          </p>
          <div className="flex items-center flex-row text-2xl justify-center gap-4">
            <SketchSelect
              value={genre}
              onChange={setGenre}
              options={genreOptions}
              placeholder="장르"
              seed={43}
            />
            <p className="lg:text-3xl">장르의</p>
            <div className="flex  justify-center">
              <SketchButton
                onClick={handleGenerateLogline}
                loading={isGenerating}
                disabled={isGenerating}
                seed={44}
              >
                {isGenerating ? "생성 중..." : "로그라인 생성하기"}
              </SketchButton>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <SketchButton
            onClick={handleGenerateStories}
            loading={isGeneratingStories}
            disabled={isGeneratingStories || !logline.trim()}
            seed={45}
            className="w-fit"
          >
            {isGeneratingStories
              ? "이야기 만드는 중..."
              : logline.trim()
              ? "로그라인으로 이야기 만들기! (약 20초 소요)"
              : "로그라인을 먼저 입력해주세요"}
          </SketchButton>
        </div>
      </div>
    </div>
  );

  const page5 = (
    <div className="w-full max-w-6xl justify-center px-4 lg:px-4 h-screen flex flex-col py-4">
      <p className="text-center text-base lg:text-4xl mb-4">
        세 가지 <span className="font-bold">구조</span>로 만들어진 이야기들을
        살펴보세요!
      </p>

      {/* 로그라인 */}
      <div className="mb-4 pb-3 border-b-2 border-neutral-300 dark:border-neutral-700">
        <p className="text-xs lg:text-base font-medium text-neutral-500 dark:text-neutral-500 uppercase tracking-wider mb-1">
          로그라인
        </p>
        <div className="overflow-x-auto">
          <p className="text-sm lg:text-2xl leading-relaxed text-center whitespace-nowrap">
            {logline}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center gap-4 lg:gap-8 mb-4 flex-wrap">
        {stories.gulino && (
          <button
            onClick={() => setSelectedFramework("gulino")}
            className={`text-base lg:text-3xl pb-1 lg:pb-2 transition-all ${
              selectedFramework === "gulino"
                ? "border-b-2 lg:border-b-4 border-neutral-800 dark:border-neutral-200 font-semibold"
                : "opacity-60 hover:opacity-100"
            }`}
          >
            줄리노
          </button>
        )}
        {stories.vogel && (
          <button
            onClick={() => setSelectedFramework("vogel")}
            className={`text-base lg:text-3xl pb-1 lg:pb-2 transition-all ${
              selectedFramework === "vogel"
                ? "border-b-2 lg:border-b-4 border-neutral-800 dark:border-neutral-200 font-semibold"
                : "opacity-60 hover:opacity-100"
            }`}
          >
            보글러
          </button>
        )}
        {stories.snider && (
          <button
            onClick={() => setSelectedFramework("snider")}
            className={`text-base lg:text-3xl pb-1 lg:pb-2 transition-all ${
              selectedFramework === "snider"
                ? "border-b-2 lg:border-b-4 border-neutral-800 dark:border-neutral-200 font-semibold"
                : "opacity-60 hover:opacity-100"
            }`}
          >
            스나이더
          </button>
        )}
      </div>

      {/* Selected Framework Content with Fixed Height */}
      <div className="overflow-x-auto pb-16">
        {selectedFramework === "gulino" && stories.gulino && (
          <StoryCard story={stories.gulino} />
        )}
        {selectedFramework === "vogel" && stories.vogel && (
          <StoryCard story={stories.vogel} />
        )}
        {selectedFramework === "snider" && stories.snider && (
          <StoryCard story={stories.snider} />
        )}
      </div>
    </div>
  );

  const pages = [page1, page2, page3, page4, page5];

  return (
    <div className="flex-col flex items-center h-screen justify-center">
      <div
        className={`transition-opacity w-full duration-300 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        {pages[currentPage - 1]}
      </div>

      {currentPage > 1 && (
        <div className="fixed bottom-8 left-8">
          <ClickableText onClick={() => handlePageChange(currentPage - 1)}>
            ← 뒤로
          </ClickableText>
        </div>
      )}

      {currentPage === 1 && (
        <div className="fixed bottom-8 left-8">
          <ClickableText onClick={() => router.push("/")}>← 뒤로</ClickableText>
        </div>
      )}

      {currentPage < pages.length && (
        <div className="fixed bottom-8 right-8">
          <ClickableText onClick={() => handlePageChange(currentPage + 1)}>
            다음 →
          </ClickableText>
        </div>
      )}
    </div>
  );
}
