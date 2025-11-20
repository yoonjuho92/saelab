"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ClickableText from "@/components/ClickableText";
import SketchInput from "@/components/SketchInput";
import SketchButton from "@/components/SketchButton";
import Image from "next/image";
import { useDay2Context, StoryStructure } from "./context";

interface StoryCardProps {
  story: StoryStructure;
  lockedBeats: Set<string>;
  onToggleLock: (actName: string, beatName: string) => void;
}

function StoryCard({ story, lockedBeats, onToggleLock }: StoryCardProps) {
  const getBeatKey = (actName: string, beatName: string) =>
    `${actName}:${beatName}`;

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
                {beats.map((beat, idx) => {
                  const beatKey = getBeatKey(actName, beat.이름);
                  const isLocked = lockedBeats.has(beatKey);
                  return (
                    <div
                      key={idx}
                      onClick={() => onToggleLock(actName, beat.이름)}
                      className={`border-l-2 lg:border-l-4 pl-2 lg:pl-4 cursor-pointer transition-all hover:bg-neutral-100/50 rounded-r-lg ${
                        isLocked
                          ? "border-amber-500 bg-amber-50/30"
                          : "border-neutral-800"
                      }`}
                    >
                      <p className="font-bold text-base lg:text-2xl text-neutral-400 mb-1 lg:mb-2 flex items-center gap-2">
                        {isLocked && <span className="text-amber-500">🔒</span>}
                        {beat.이름}
                      </p>
                      <p className="text-sm lg:text-2xl leading-relaxed">
                        {beat.내용}
                      </p>
                    </div>
                  );
                })}
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
  const [revisionDirection, setRevisionDirection] = useState("");
  const [lockedBeats, setLockedBeats] = useState<Set<string>>(new Set());
  const [editableStory, setEditableStory] = useState<StoryStructure | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [extractedStructure, setExtractedStructure] = useState<{
    처음: string;
    중간: string;
    끝: string;
  } | null>(null);
  const [isExtractingStructure, setIsExtractingStructure] = useState(false);
  const [initialLogline, setInitialLogline] = useState("");
  const [isSavingLogline, setIsSavingLogline] = useState(false);

  // story가 변경되면 editableStory 동기화
  useEffect(() => {
    if (story && currentPage === 7) {
      setEditableStory(JSON.parse(JSON.stringify(story)));
    }
  }, [story, currentPage]);

  // page3 진입 시 초기 로그라인 저장 (한 번만)
  useEffect(() => {
    if (currentPage === 3) {
      setInitialLogline(logline);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentPage(newPage);
      setIsTransitioning(false);
    }, 300);
  };

  const handleToggleLock = (actName: string, beatName: string) => {
    const beatKey = `${actName}:${beatName}`;
    setLockedBeats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(beatKey)) {
        newSet.delete(beatKey);
      } else {
        newSet.add(beatKey);
      }
      return newSet;
    });
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

  const hasChanges = () => {
    if (!story || !editableStory) return false;
    return JSON.stringify(story) !== JSON.stringify(editableStory);
  };

  const saveEditedStory = async () => {
    if (!editableStory) return;

    setIsSaving(true);
    try {
      setStory(editableStory);
      await saveStoryToDB(editableStory);
      alert("저장되었습니다!");
    } catch (error) {
      console.error("Error saving story:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasLoglineChanges = () => {
    return logline !== initialLogline && logline.trim() !== "";
  };

  const saveLoglineOnly = async () => {
    setIsSavingLogline(true);
    try {
      await saveStoryToDB(story);
      setInitialLogline(logline);
      alert("로그라인이 저장되었습니다!");
    } catch (error) {
      console.error("Error saving logline:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSavingLogline(false);
    }
  };

  const updateBeatContent = (
    actName: string,
    beatIndex: number,
    newContent: string
  ) => {
    if (!editableStory) return;

    const updatedStory = { ...editableStory };
    const act = updatedStory.막[actName as keyof typeof updatedStory.막];
    if (act && act[beatIndex]) {
      act[beatIndex] = { ...act[beatIndex], 내용: newContent };
      setEditableStory(updatedStory);
    }
  };

  const reviseStory = async () => {
    if (!revisionDirection.trim()) {
      alert("수정 방향을 입력해주세요!");
      return;
    }

    if (!story) {
      alert("먼저 이야기를 생성해주세요!");
      return;
    }

    setIsGeneratingStories(true);

    try {
      // 고정된 비트 정보 추출
      const lockedBeatsInfo: string[] = [];
      lockedBeats.forEach((beatKey) => {
        const [actName, beatName] = beatKey.split(":");
        const act = story.막[actName as keyof typeof story.막];
        if (act) {
          const beat = act.find((b) => b.이름 === beatName);
          if (beat) {
            lockedBeatsInfo.push(`${actName} - ${beatName}: ${beat.내용}`);
          }
        }
      });

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptName: "revise_story_structure",
          variables: {
            logline,
            previous_story: JSON.stringify(story, null, 2),
            revision_direction: revisionDirection,
            locked_beats:
              lockedBeatsInfo.length > 0 ? lockedBeatsInfo.join("\n") : "없음",
          },
          responseFormat: "json",
        }),
      });

      if (!response.ok) throw new Error("Failed to revise story");
      const data = await response.json();

      setStory(data.result);
      await saveStoryToDB(data.result);
      setRevisionDirection("");
      alert("이야기가 수정되었습니다!");
    } catch (error) {
      console.error("Error revising story:", error);
      alert("이야기 수정 중 오류가 발생했습니다.");
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
      <p>이제 드디어 나만의 이야기를 시작해 볼 거예요!</p>
      <div className="flex mt-6 justify-center">
        <ClickableText onClick={() => handlePageChange(2)}>
          [ 다음 ]
        </ClickableText>
      </div>
    </div>
  );

  const page2 = (
    <div className="flex justify-center items-center flex-col">
      <Image
        src="/짱룩말.gif"
        alt="Lookmal Logo"
        width={200}
        height={200}
        className="transform scale-x-[-1]"
      />
      <p>그럼, 시작해볼까요!</p>
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
      <p className="pb-5">
        지난 시간에 연습해 본 대로, 내가 만들고 싶은 이야기의 씨앗, 로그라인을
        입력해 주세요:
      </p>
      <div className="flex justify-end">
        <SketchButton
          className="text-lg"
          onClick={saveLoglineOnly}
          disabled={!hasLoglineChanges() || isSavingLogline}
          loading={isSavingLogline}
        >
          {isSavingLogline
            ? "저장 중..."
            : hasLoglineChanges()
            ? "로그라인 저장하기"
            : "바뀐 내용이 없습니다"}
        </SketchButton>
      </div>

      <div className="mt-6">
        <SketchInput
          value={logline}
          onChange={setLogline}
          placeholder="예: 꿈을 현실로 만드는 능력을 얻은 소년이, 그 힘의 대가로 현실과 꿈의 경계가 무너지면서 자신의 정체성을 지키려 분투한다."
        />
      </div>

      <div className="flex mt-6 justify-center gap-4">
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

  const page5 = (
    <div className="flex flex-col w-full">
      <Image
        src="/day1/glint.png"
        alt="Lookmal Logo"
        width={100}
        height={100}
        className="transform scale-x-[-1]"
      />
      <h3 className=" font-bold mb-4">로그라인이란?</h3>
      <p className=" leading-relaxed mb-4">
        로그라인은 이야기가 어떤 이야기인지를 한 문장으로 정리한, 이야기의
        씨앗이라고 할 수 있어요. 로그라인을 &ldquo;A가 B를 위해 C하는
        이야기&rdquo;라고도 하는데요.
      </p>
      <p className="leading-relaxed mb-4">
        &ldquo;<strong>A</strong>(주인공)이, <strong>B</strong>(목표)를 위해서,{" "}
        <strong>C</strong>(목표 달성을 위한 고군분투)하는 이야기&rdquo; 이 세
        요소가 로그라인에 담겨 있어야 한다는 뜻이에요!
      </p>
      <p className="leading-relaxed mb-4">
        당신의 로그라인에는 이 세 가지가 다 담겨있나요?
      </p>
      <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-200 mb-6">
        <p className="text-xl lg:text-2xl font-bold text-neutral-800">
          {logline}
        </p>
      </div>
      <div className="flex mt-6 justify-center">
        <ClickableText
          onClick={async () => {
            if (!story) {
              alert("먼저 이야기를 생성해주세요!");
              return;
            }
            setIsExtractingStructure(true);
            try {
              const storyText = JSON.stringify(story, null, 2);
              const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  promptName: "extract_structure",
                  variables: { story: storyText },
                  responseFormat: "json",
                }),
              });
              if (!response.ok) throw new Error("Failed to extract structure");
              const data = await response.json();
              setExtractedStructure(data.result);
              handlePageChange(6);
            } catch (error) {
              console.error("Error:", error);
              alert("구조 추출에 실패했습니다.");
            } finally {
              setIsExtractingStructure(false);
            }
          }}
        >
          {isExtractingStructure
            ? "[ 분석 중... ]"
            : "[ 이제 구조를 살펴 볼까요? ]"}
        </ClickableText>
      </div>
    </div>
  );

  const page6 = (
    <div className="flex flex-col w-full">
      {extractedStructure ? (
        <>
          <p className="text-center text-lg lg:text-2xl mb-8">
            저번 시간에 했던 것처럼, 이번에는 우리가 만든 이야기에서
            처음-중간-끝을 정리해 볼까요:
          </p>

          <div className="space-y-6 mb-8">
            <div className="p-6 bg-white/80 rounded-xl border-2 border-neutral-300">
              <h3 className="text-xl lg:text-3xl font-bold mb-3 text-center">
                처음 (Beginning)
              </h3>
              <p className="text-base lg:text-2xl leading-relaxed">
                {extractedStructure.처음}
              </p>
            </div>

            <div className="p-6 bg-white/80 rounded-xl border-2 border-neutral-300">
              <h3 className="text-xl lg:text-3xl font-bold mb-3 text-center">
                중간 (Middle)
              </h3>
              <p className="text-base lg:text-2xl leading-relaxed">
                {extractedStructure.중간}
              </p>
            </div>

            <div className="p-6 bg-white/80 rounded-xl border-2 border-neutral-300">
              <h3 className="text-xl lg:text-3xl font-bold mb-3 text-center">
                끝 (End)
              </h3>
              <p className="text-base lg:text-2xl leading-relaxed">
                {extractedStructure.끝}
              </p>
            </div>
          </div>

          <p className="text-center text-lg lg:text-2xl">
            당신이 생각한 이야기의 처음-중간-끝과 같을까요?
          </p>

          <div className="flex justify-center">
            <ClickableText onClick={() => handlePageChange(7)}>
              [ 이제 그럼, 마지막으로 직접 이야기의 구조를 수정하러 가 볼까요! ]
            </ClickableText>
          </div>
        </>
      ) : (
        <p className="text-center text-lg lg:text-2xl">분석 중...</p>
      )}
    </div>
  );

  const page7 = (
    <div className="flex flex-col w-full h-full">
      <div className="shrink-0 w-full flex flex-col items-start mb-4 space-y-4">
        <div className="flex flex-row space-x-1">
          <Image
            src="/책.png"
            alt="Lookmal Logo"
            width={25}
            height={25}
            className="transform scale-x-[-1]"
          />
          <Image
            src="/구조(열쇠).png"
            alt="Lookmal Logo"
            width={25}
            height={25}
            className="transform scale-x-[-1]"
          />
          <Image
            src="/포스트잇.png"
            alt="Lookmal Logo"
            width={25}
            height={25}
            className="transform scale-x-[-1]"
          />
        </div>
        {editableStory ? (
          <>
            <p className="text-xl lg:text-2xl font-bold text-neutral-600">
              로그라인: {logline}
            </p>
            <div className="flex gap-3 w-full flex-row justify-between items-center">
              <p className="text-xl lg:text-2xl">
                💡 각 비트의 내용을 직접 수정할 수 있어요!
              </p>
              <SketchButton
                className="text-2xl"
                onClick={saveEditedStory}
                disabled={!hasChanges() || isSaving}
                loading={isSaving}
              >
                {isSaving
                  ? "저장 중..."
                  : hasChanges()
                  ? "저장하기"
                  : "바뀐 내용이 없습니다"}
              </SketchButton>
            </div>
          </>
        ) : (
          <p className="mt-4">
            아직 생성된 이야기가 없어요. 3단계에서 이야기를 만들어주세요!
          </p>
        )}
      </div>

      <div className="flex-1 min-h-0 w-full">
        {editableStory && (
          <div className="h-full overflow-y-auto">
            <div className="p-3 lg:p-8 bg-white/80 rounded-xl lg:rounded-2xl border-2 border-neutral-300">
              <div className="space-y-6 lg:space-y-8">
                {Object.entries(editableStory.막).map(([actName, beats]) => (
                  <div key={actName}>
                    <h4 className="text-sm lg:text-2xl font-bold mb-3 lg:mb-4 uppercase tracking-wider">
                      {actName}
                    </h4>
                    <div className="space-y-3 lg:space-y-4 pl-1 lg:pl-2">
                      {beats.map((beat, idx) => (
                        <div
                          key={idx}
                          className="border-l-2 lg:border-l-4 border-neutral-800 pl-2 lg:pl-4"
                        >
                          <p className="font-bold text-base lg:text-2xl text-neutral-400 mb-1 lg:mb-2">
                            {beat.이름}
                          </p>
                          <textarea
                            value={beat.내용}
                            onChange={(e) =>
                              updateBeatContent(actName, idx, e.target.value)
                            }
                            className="w-full text-sm lg:text-2xl leading-relaxed bg-white/50 p-2 rounded border border-neutral-300 focus:border-amber-500 focus:outline-none resize-none overflow-hidden"
                            style={{
                              fontFamily: "inherit",
                              height: "auto",
                              minHeight: "100px",
                            }}
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = "auto";
                              target.style.height =
                                target.scrollHeight + 2 + "px";
                            }}
                            ref={(el) => {
                              if (el) {
                                el.style.height = "auto";
                                el.style.height = el.scrollHeight + "px";
                              }
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const page4 = (
    <div className="flex flex-col items-center h-full">
      <div className="shrink-0 w-full flex flex-col items-start mb-4 space-y-4">
        <div className="flex flex-row space-x-1">
          <Image
            src="/책.png"
            alt="Lookmal Logo"
            width={25}
            height={25}
            className="transform scale-x-[-1]"
          />
          <Image
            src="/구조(열쇠).png"
            alt="Lookmal Logo"
            width={25}
            height={25}
            className="transform scale-x-[-1]"
          />
          <Image
            src="/포스트잇.png"
            alt="Lookmal Logo"
            width={25}
            height={25}
            className="transform scale-x-[-1]"
          />
        </div>
        {story ? (
          <>
            <p className="text-xl lg:text-2xl font-bold text-neutral-600">
              로그라인: {logline}
            </p>
            <div className="w-full space-y-3">
              <div className="flex gap-3 w-full">
                <div className="flex-1">
                  <SketchInput
                    className="text-2xl"
                    value={revisionDirection}
                    onChange={setRevisionDirection}
                    placeholder="예: 주인공을 더 적극적으로 만들어주세요"
                  />
                </div>

                <SketchButton
                  className="text-2xl"
                  onClick={reviseStory}
                  disabled={isGeneratingStories || !revisionDirection.trim()}
                  loading={isGeneratingStories}
                >
                  {isGeneratingStories ? "수정 중..." : "이야기 수정하기"}
                </SketchButton>
              </div>
              <p className="text-lg lg:text-xl">
                💡 비트를 클릭하면 고정/해제할 수 있어요. 고정된 비트는 수정 시
                변경되지 않습니다.
              </p>
            </div>
          </>
        ) : (
          <p className="mt-4">
            아직 생성된 이야기가 없어요. 3단계에서 이야기를 만들어주세요!
          </p>
        )}
      </div>

      <div className="flex-1 min-h-0 w-full">
        {story && (
          <StoryCard
            story={story}
            lockedBeats={lockedBeats}
            onToggleLock={handleToggleLock}
          />
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`flex-col flex items-center justify-center relative ${
        currentPage === 4 || currentPage === 7
          ? "h-screen overflow-hidden p-8"
          : "min-h-screen p-8"
      }`}
    >
      <div
        className={`transition-opacity items-center flex flex-col duration-300 w-full max-w-6xl ${
          isTransitioning ? "opacity-0" : "opacity-100"
        } ${
          currentPage === 4 || currentPage === 7 ? "h-full flex flex-col" : ""
        }`}
      >
        {currentPage === 1 && page1}
        {currentPage === 2 && page2}
        {currentPage === 3 && page3}
        {currentPage === 4 && page4}
        {currentPage === 5 && page5}
        {currentPage === 6 && page6}
        {currentPage === 7 && page7}
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

      {currentPage < 7 && (
        <div className="fixed bottom-8 right-8">
          <ClickableText onClick={() => handlePageChange(currentPage + 1)}>
            다음 →
          </ClickableText>
        </div>
      )}
    </div>
  );
}
