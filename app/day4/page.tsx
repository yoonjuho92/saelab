"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ClickableText from "@/components/ClickableText";
import SketchInput from "@/components/SketchInput";
import SketchButton from "@/components/SketchButton";
import Image from "next/image";
import {
  useDay4Context,
  StoryStructure,
  Character,
  FirstActTreatment,
  TreatmentScene,
} from "./context";

interface StoryCardProps {
  story: StoryStructure;
}

function StoryCard({ story }: StoryCardProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 lg:p-8 bg-white/80 rounded-xl lg:rounded-2xl border-2 border-neutral-300">
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
                    className="border-l-2 lg:border-l-4 pl-2 lg:pl-4 border-neutral-800"
                  >
                    <p className="font-bold text-base lg:text-2xl text-neutral-400 mb-1 lg:mb-2">
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

interface CharacterCardProps {
  character: Character;
}

function CharacterCard({ character }: CharacterCardProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 lg:p-8 bg-white/80 rounded-xl lg:rounded-2xl border-2 border-neutral-300">
        <div className="space-y-4 lg:space-y-6">
          <div>
            <h4 className="text-base lg:text-xl font-bold text-neutral-600 mb-2 pb-2 border-b-2 border-neutral-300">
              이름
            </h4>
            <p className="text-sm lg:text-2xl mt-2">{character.이름}</p>
          </div>
          <div>
            <h4 className="text-base lg:text-xl font-bold text-neutral-600 mb-2 pb-2 border-b-2 border-neutral-300">
              나이
            </h4>
            <p className="text-sm lg:text-2xl mt-2">{character.나이}</p>
          </div>
          <div>
            <h4 className="text-base lg:text-xl font-bold text-neutral-600 mb-2 pb-2 border-b-2 border-neutral-300">
              외적 특징
            </h4>
            <p className="text-sm lg:text-2xl mt-2">{character.외적_특징}</p>
          </div>
          <div>
            <h4 className="text-base lg:text-xl font-bold text-neutral-600 mb-2 pb-2 border-b-2 border-neutral-300">
              외적 목표와 장애물
            </h4>
            <p className="text-sm lg:text-2xl mt-2">
              {character.외적_목표와_장애물}
            </p>
          </div>
          <div>
            <h4 className="text-base lg:text-xl font-bold text-neutral-600 mb-2 pb-2 border-b-2 border-neutral-300">
              내적 목표와 장애물
            </h4>
            <p className="text-sm lg:text-2xl mt-2">
              {character.내적_목표와_장애물}
            </p>
          </div>
          <div>
            <h4 className="text-base lg:text-xl font-bold text-neutral-600 mb-2 pb-2 border-b-2 border-neutral-300">
              결핍
            </h4>
            <p className="text-sm lg:text-2xl mt-2">{character.결핍}</p>
          </div>
          <div>
            <h4 className="text-base lg:text-xl font-bold text-neutral-600 mb-2 pb-2 border-b-2 border-neutral-300">
              욕망과 결핍의 관계
            </h4>
            <p className="text-sm lg:text-2xl mt-2">
              {character.욕망과_결핍의_관계}
            </p>
          </div>
          <div>
            <h4 className="text-base lg:text-xl font-bold text-neutral-600 mb-2 pb-2 border-b-2 border-neutral-300">
              다른 캐릭터들과의 관계
            </h4>
            <p className="text-sm lg:text-2xl mt-2 whitespace-pre-wrap">
              {typeof character.다른_캐릭터들과의_관계 === "object"
                ? JSON.stringify(character.다른_캐릭터들과의_관계, null, 2)
                : character.다른_캐릭터들과의_관계}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Day4Page() {
  const router = useRouter();
  const {
    logline,
    story,
    character,
    firstActTreatment,
    setFirstActTreatment,
    saveTreatmentToDB,
    isLoaded,
  } = useDay4Context();

  const [currentPage, setCurrentPage] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editableTreatment, setEditableTreatment] =
    useState<FirstActTreatment | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sceneCountSetup, setSceneCountSetup] = useState(3);
  const [sceneCountProblem, setSceneCountProblem] = useState(3);

  // Sync treatment to editableTreatment when entering page 10
  useEffect(() => {
    if (firstActTreatment && currentPage === 10) {
      setEditableTreatment(JSON.parse(JSON.stringify(firstActTreatment)));
    }
  }, [firstActTreatment, currentPage]);

  if (!isLoaded) {
    return null;
  }

  const handlePageChange = (newPage: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentPage(newPage);
      setIsTransitioning(false);
    }, 300);
  };

  const generateTreatment = async () => {
    if (!logline || !story || !character) {
      alert("로그라인, 구조, 캐릭터가 모두 필요합니다!");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptName: "create_first_act_treatment",
          variables: {
            logline,
            structure: JSON.stringify(story, null, 2),
            character: JSON.stringify(character, null, 2),
            scene_count_setup: sceneCountSetup,
            scene_count_problem: sceneCountProblem,
          },
          responseFormat: "json",
        }),
      });

      if (!response.ok) {
        throw new Error("트리트먼트 생성에 실패했습니다");
      }

      const data = await response.json();
      const treatment = data.result as FirstActTreatment;

      setFirstActTreatment(treatment);
      setEditableTreatment(JSON.parse(JSON.stringify(treatment)));

      // Auto-save to DB
      await saveTreatmentToDB(treatment);

      handlePageChange(10);
    } catch (error) {
      console.error("Error generating treatment:", error);
      alert("트리트먼트 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveTreatment = async () => {
    if (!editableTreatment) return;

    setIsSaving(true);
    try {
      await saveTreatmentToDB(editableTreatment);
      alert("저장되었습니다!");
    } catch (error) {
      console.error("Error saving treatment:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSceneField = (
    beatName: string,
    sceneIndex: number,
    field: keyof TreatmentScene,
    value: string | number
  ) => {
    if (!editableTreatment) return;

    const newTreatment = { ...editableTreatment };
    if (newTreatment[beatName]) {
      newTreatment[beatName][sceneIndex] = {
        ...newTreatment[beatName][sceneIndex],
        [field]: value,
      };
      setEditableTreatment(newTreatment);
    }
  };

  const hasTreatmentChanges = () => {
    return (
      JSON.stringify(editableTreatment) !== JSON.stringify(firstActTreatment)
    );
  };

  // Page 1
  const page1 = (
    <div className="w-full max-w-4xl px-4 text-center">
      <Image
        src="/짱룩말.gif"
        alt="짱룩말"
        width={150}
        height={150}
        className="mx-auto"
      />
      <p className="text-2xl lg:text-4xl leading-relaxed">
        벌써 세 번째 수업 시간이에요!
      </p>
      <div className="flex justify-center mt-8">
        <ClickableText onClick={() => handlePageChange(2)}>
          [ 그럼 오늘은... ]
        </ClickableText>
      </div>
    </div>
  );

  // Page 2
  const page2 = (
    <div className="w-full max-w-4xl px-4 text-center">
      <p className="text-2xl lg:text-4xl ㅅㄷㅌㅅ leading-relaxed">
        오늘은 그동안 만든 로그라인, 구조, 캐릭터를 활용해서
        <br />첫 막의 트리트먼트를 써 볼 거예요.
      </p>
      <div className="flex justify-center mt-8">
        <ClickableText onClick={() => handlePageChange(3)}>
          [ 다음 ]
        </ClickableText>
      </div>
    </div>
  );

  // Page 3
  const page3 = (
    <div className="w-full flex justify-center flex-col items-center max-w-4xl px-4">
      <Image src="/책.png" alt="책" width={50} height={50} />

      <div className="text-2xl lg:text-4xl leading-relaxed text-center">
        그 전에, 그동안 우리가 만든 이야기의 얼개를 한 번 살펴볼까요?
      </div>
      <div className="flex justify-center mt-8">
        <ClickableText onClick={() => handlePageChange(4)}>
          [ 우선 로그라인부터! ]
        </ClickableText>
      </div>
    </div>
  );

  // Page 4
  const page4 = (
    <div className="w-full max-w-4xl px-4">
      <div className="text-center flex justify-end flex-col mb-8">
        <Image
          src="/슬레이트.png"
          alt="슬레이트"
          width={50}
          height={50}
          className="mx-auto"
        />
        <p className="text-xl lg:text-3xl font-bold leading-relaxed">
          우리가 만든 이야기의 씨앗, 로그라인은 다음과 같았어요:
        </p>
      </div>
      <div className="bg-white/80 p-6 lg:p-8 rounded-xl border-2 border-neutral-300 mb-8">
        <p className="text-lg lg:text-2xl leading-relaxed text-center">
          {logline || "로그라인이 없습니다."}
        </p>
      </div>
      <div className="flex justify-center mt-8">
        <ClickableText onClick={() => handlePageChange(5)}>
          [ 다음은 구조! ]
        </ClickableText>
      </div>
    </div>
  );

  // Page 5
  const page5 = (
    <div
      className={`w-full max-w-6xl px-4 ${
        currentPage === 5 ? "h-full flex flex-col" : ""
      }`}
    >
      <div className="text-center mb-4">
        <Image
          src="/구조(열쇠).png"
          alt="구조"
          width={25}
          height={25}
          className="mx-auto"
        />
        <p className="text-xl lg:text-3xl font-bold leading-relaxed">
          이 로그라인으로 만든 이야기의 구조는 다음과 같았구요:
        </p>
      </div>
      <div className="flex-1 min-h-0">
        {story ? (
          <StoryCard story={story} />
        ) : (
          <p className="text-center">구조가 없습니다.</p>
        )}
      </div>
      <div className="flex justify-center mt-4">
        <ClickableText onClick={() => handlePageChange(6)}>
          [ 마지막으로 캐릭터! ]
        </ClickableText>
      </div>
    </div>
  );

  // Page 6
  const page6 = (
    <div
      className={`w-full max-w-6xl px-4 ${
        currentPage === 6 ? "h-full flex flex-col" : ""
      }`}
    >
      <div className="text-center mb-4">
        <Image
          src="/day1/glint.png"
          alt="캐릭터"
          width={80}
          height={80}
          className="mx-auto mb-4 transform scale-x-[-1]"
        />
        <p className="text-xl lg:text-3xl font-bold leading-relaxed">
          마지막으로 캐릭터에 대해서 생각해보고, 이렇게 정리했죠:
        </p>
      </div>
      <div className="flex-1 min-h-0">
        {character ? (
          <CharacterCard character={character} />
        ) : (
          <p className="text-center">캐릭터가 없습니다.</p>
        )}
      </div>
      <div className="flex justify-center mt-4">
        <ClickableText onClick={() => handlePageChange(7)}>
          [ 다음 ]
        </ClickableText>
      </div>
    </div>
  );

  // Page 7
  const page7 = (
    <div className="w-full max-w-4xl px-4 text-center">
      <Image
        src="/포스트잇.png"
        alt="포스트잇"
        width={50}
        height={50}
        className="mx-auto"
      />
      <p className="text-2xl lg:text-4xl leading-relaxed mb-8">
        이제 이야기를 만들 재료가 꽤 모였으니,
        <br />
        본격적으로 이야기 만들기를 시작해 보려고 해요.
      </p>
      <div className="flex justify-center">
        <ClickableText onClick={() => handlePageChange(8)}>
          [ 오늘은 이야기의 설계도라고 할 수 있는 트리트먼트를 써 볼 거예요 ]
        </ClickableText>
      </div>
    </div>
  );

  // Page 8
  const page8 = (
    <div className="w-full max-w-4xl px-4 text-center">
      <p className="text-xl lg:text-3xl leading-relaxed mb-8">
        우리가 만든 이야기의 구조를 시놉시스라고 부를 수 있는데요, 내가 쓰는
        이야기가 이러이러한 내용이다,를 정리한 컨셉이라고 볼 수 있어요. 하지만
        이 컨셉을 진짜 이야기로 만들기 위해서는 그 컨셉을 자세한 설계도로 만드는
        과정이 필요한데, 그 설계도를 트리트먼트라고 불러요.
      </p>
      <div className="flex justify-center">
        <ClickableText onClick={() => handlePageChange(9)}>
          [ 다음 ]
        </ClickableText>
      </div>
    </div>
  );

  // Page 9
  const page9 = (
    <div className="w-full max-w-4xl px-4">
      <p className="text-xl lg:text-3xl leading-relaxed mb-8 text-center">
        다른 측면에서 설명해 보자면, 시놉시스에 어떤 일이 벌어지는지가 적혀
        있다면, 트리트먼트에는 이야기에 구체적으로 어떤 장면이 어떤 순서로
        들어가는지도 정리되어 있어야 해요. &apos;장면화&apos;라고도 하는데,
        어렵게 생각할 필요 없이, 내 이야기에 어떤 장면이 들어갈지 미리
        생각해두는 과정이라고 보면 돼요!
      </p>

      <div className="mb-8 space-y-6">
        <div className="bg-white/80 p-6 rounded-xl border-2 border-neutral-300">
          <h3 className="text-xl lg:text-3xl font-bold mb-4">
            각 비트를 몇 개의 장면으로 나눌까요?
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-row">
              <label className="block text-xl lg:text-2xl font-bold text-neutral-600">
                &quot;설정&quot; 비트 장면 개수 (2-5개)
              </label>
              <select
                className="p-3 text-lg min-w-sm lg:text-xl border-2 border-neutral-300 rounded-lg bg-white"
                value={sceneCountSetup}
                onChange={(e) => setSceneCountSetup(Number(e.target.value))}
              >
                <option value={2}>2개</option>
                <option value={3}>3개</option>
                <option value={4}>4개</option>
                <option value={5}>5개</option>
              </select>
            </div>
            <div className="flex items-center justify-between flex-row">
              <label className="block text-xl lg:text-2xl font-bold text-neutral-600">
                &quot;문제 발생&quot; 비트 장면 개수 (2-5개)
              </label>
              <select
                className="p-3 text-lg min-w-sm lg:text-xl border-2 border-neutral-300 rounded-lg bg-white"
                value={sceneCountProblem}
                onChange={(e) => setSceneCountProblem(Number(e.target.value))}
              >
                <option value={2}>2개</option>
                <option value={3}>3개</option>
                <option value={4}>4개</option>
                <option value={5}>5개</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        {isGenerating ? (
          <div className="flex items-center gap-4">
            <p className="text-xl lg:text-2xl">트리트먼트 생성 중...</p>
            <Image src="/로딩_전구.gif" alt="로딩중" width={50} height={50} />
          </div>
        ) : (
          <ClickableText onClick={generateTreatment}>
            [ 그럼 매번 그랬던 것처럼, AI의 도움을 받아 우선 생성해 볼까요? ]
          </ClickableText>
        )}
      </div>
    </div>
  );

  // Beat descriptions for display
  const beatDescriptions: Record<string, string> = {
    설정: "세계관 소개, 주인공의 현재 상태 제시, 주인공이 가진 결핍 혹은 욕망 드러남",
    "문제 발생":
      "주요 긴장 축(적대자, 곤경)의 설정과 극적 의문 정리. 주요 갈등 설정",
  };

  // Page 10
  const page10 = editableTreatment && (
    <div className="w-full max-w-6xl px-4 h-full flex flex-col">
      <div className="text-center mb-4">
        <h2 className="text-2xl lg:text-4xl font-bold mb-4">1막 트리트먼트</h2>
        <div className="flex justify-end">
          <SketchButton
            className="text-xl lg:text-2xl"
            onClick={saveTreatment}
            disabled={!hasTreatmentChanges() || isSaving}
            loading={isSaving}
          >
            {isSaving
              ? "저장 중..."
              : hasTreatmentChanges()
              ? "저장하기"
              : "바뀐 내용이 없습니다"}
          </SketchButton>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-6 lg:p-8 bg-white/80 rounded-xl border-2 border-neutral-300">
          <div className="space-y-8">
            {Object.entries(editableTreatment).map(([beatName, scenes]) => (
              <div key={beatName}>
                <h3 className="text-xl lg:text-3xl font-bold mb-2 text-neutral-700">
                  {beatName}
                </h3>
                {beatDescriptions[beatName] && (
                  <p className="text-xl lg:text-2xl text-neutral-500 italic mb-4">
                    {beatDescriptions[beatName]}
                  </p>
                )}
                <div className="space-y-6">
                  {scenes.map((scene, idx) => (
                    <div
                      key={idx}
                      className="border-l-4 border-neutral-800 pl-4"
                    >
                      <div className="mb-3">
                        <label className="block text-sm lg:text-xl font-bold text-neutral-600 mb-2">
                          장면 {scene.장면_번호}:
                        </label>
                        <SketchInput
                          className="text-2xl"
                          value={scene.장면_제목}
                          onChange={(value) =>
                            updateSceneField(beatName, idx, "장면_제목", value)
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm lg:text-xl font-bold text-neutral-600 mb-2">
                          내용
                        </label>
                        <SketchInput
                          className="text-3xl"
                          multiline
                          value={scene.장면_내용}
                          onChange={(value) =>
                            updateSceneField(beatName, idx, "장면_내용", value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-4">
        <ClickableText onClick={() => handlePageChange(11)}>
          [ 정리 끝! ]
        </ClickableText>
      </div>
    </div>
  );

  // Page 11
  const page11 = (
    <div className="w-full max-w-4xl px-4 text-center">
      <Image
        src="/짱룩말.gif"
        alt="짱룩말"
        width={150}
        height={150}
        className="mx-auto mb-6"
      />
      <p className="text-xl lg:text-3xl leading-relaxed mb-8">
        여기까지 정리가 됐다면, 이제 이야기 쓰기의 80%는 끝냈다고 볼 수 있어요.
        다음 시간은 드디어 나만의 소설을 써 보는 시간입니다! 오늘 정리한 두 장의
        트리트먼트 중에 첫 번째 장을 5,000자의 이야기로 정리해 볼 거예요. 그럼
        다음 시간에 만나요!
      </p>
      <div className="flex justify-center">
        <ClickableText onClick={() => router.push("/dashboard")}>
          [ 대시보드로 돌아가기 ]
        </ClickableText>
      </div>
    </div>
  );

  return (
    <div
      className={`flex-col flex items-center justify-center relative ${
        currentPage === 5 || currentPage === 6 || currentPage === 10
          ? "h-screen overflow-hidden p-8"
          : "min-h-screen p-8"
      }`}
    >
      <div
        className={`transition-opacity items-center flex flex-col duration-300 w-full ${
          isTransitioning ? "opacity-0" : "opacity-100"
        } ${
          currentPage === 5 || currentPage === 6 || currentPage === 10
            ? "h-full flex flex-col max-w-6xl"
            : "max-w-4xl"
        }`}
      >
        {currentPage === 1 && page1}
        {currentPage === 2 && page2}
        {currentPage === 3 && page3}
        {currentPage === 4 && page4}
        {currentPage === 5 && page5}
        {currentPage === 6 && page6}
        {currentPage === 7 && page7}
        {currentPage === 8 && page8}
        {currentPage === 9 && page9}
        {currentPage === 10 && page10}
        {currentPage === 11 && page11}
      </div>

      {currentPage === 1 ? (
        <div className="fixed bottom-8 left-8">
          <ClickableText onClick={() => router.push("/dashboard")}>
            ← 대시보드
          </ClickableText>
        </div>
      ) : currentPage > 1 ? (
        <div className="fixed bottom-8 left-8">
          <ClickableText onClick={() => handlePageChange(currentPage - 1)}>
            ← 뒤로
          </ClickableText>
        </div>
      ) : null}

      {currentPage < 11 && (
        <div className="fixed bottom-8 right-8">
          <ClickableText onClick={() => handlePageChange(currentPage + 1)}>
            다음 →
          </ClickableText>
        </div>
      )}
    </div>
  );
}
