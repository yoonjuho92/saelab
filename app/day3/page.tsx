"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ClickableText from "@/components/ClickableText";
import SketchInput from "@/components/SketchInput";
import SketchButton from "@/components/SketchButton";
import Image from "next/image";
import { useDay3Context, Character, StoryStructure } from "./context";

interface EditableCharacter {
  이름: string;
  나이: string;
  외적_특징: string;
  외적_목표와_장애물: string;
  내적_목표와_장애물: string;
  결핍: string;
  욕망과_결핍의_관계: string;
  다른_캐릭터들과의_관계: string;
}

export default function Day3Page() {
  const router = useRouter();
  const {
    logline,
    story,
    character,
    setCharacter,
    setStory,
    saveStoryToDB,
    isLoaded,
  } = useDay3Context();

  const [currentPage, setCurrentPage] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editableCharacter, setEditableCharacter] =
    useState<EditableCharacter | null>(null);
  const [editableStory, setEditableStory] = useState<StoryStructure | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  // Sync story to editableStory when entering page 6
  useEffect(() => {
    if (story && currentPage === 6) {
      setEditableStory(JSON.parse(JSON.stringify(story)));
    }
  }, [story, currentPage]);

  // Load character from context when it becomes available
  useEffect(() => {
    if (character && !editableCharacter) {
      // Handle the case where relationships might be an object
      const relationshipsString =
        typeof character.다른_캐릭터들과의_관계 === "object"
          ? JSON.stringify(character.다른_캐릭터들과의_관계, null, 2)
          : character.다른_캐릭터들과의_관계;

      setEditableCharacter({
        ...character,
        다른_캐릭터들과의_관계: relationshipsString,
      });
    }
  }, [character, editableCharacter]);

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

  const extractCharacter = async () => {
    if (!logline || !story) {
      alert("로그라인과 이야기 구조가 필요합니다!");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptName: "extract_character",
          variables: {
            logline,
            structure: JSON.stringify(story),
          },
          responseFormat: "json",
        }),
      });

      if (!response.ok) throw new Error("Failed to extract character");
      const data = await response.json();

      const relationshipsData =
        data.result.다른_캐릭터들과의_관계 ||
        data.result["다른 캐릭터들과의 관계"];

      // Convert object to string if needed
      const relationshipsString =
        typeof relationshipsData === "object"
          ? JSON.stringify(relationshipsData, null, 2)
          : relationshipsData;

      const extractedCharacter: Character = {
        이름: data.result.이름,
        나이: data.result.나이,
        외적_특징: data.result.외적_특징 || data.result["외적 특징"],
        외적_목표와_장애물:
          data.result.외적_목표와_장애물 || data.result["외적 목표와 장애물"],
        내적_목표와_장애물:
          data.result.내적_목표와_장애물 || data.result["내적 목표와 장애물"],
        결핍: data.result.결핍,
        욕망과_결핍의_관계:
          data.result.욕망과_결핍의_관계 || data.result["욕망과 결핍의 관계"],
        다른_캐릭터들과의_관계: relationshipsString,
      };

      setCharacter(extractedCharacter);
      setEditableCharacter(extractedCharacter);

      // Save to DB
      await saveStoryToDB(undefined, extractedCharacter);

      handlePageChange(4);
    } catch (error) {
      console.error("Error extracting character:", error);
      alert("주인공 특징 추출 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const hasCharacterChanges = () => {
    if (!character || !editableCharacter) return false;
    return JSON.stringify(character) !== JSON.stringify(editableCharacter);
  };

  const saveCharacter = async () => {
    if (!editableCharacter) return;

    setIsSaving(true);
    try {
      // Try to parse relationships field if it's JSON string
      const characterToSave = { ...editableCharacter };
      try {
        const parsed = JSON.parse(editableCharacter.다른_캐릭터들과의_관계);
        if (typeof parsed === "object") {
          characterToSave.다른_캐릭터들과의_관계 = parsed;
        }
      } catch {
        // Keep as string if it's not valid JSON
      }

      setCharacter(characterToSave);
      await saveStoryToDB(undefined, characterToSave);
      alert("저장되었습니다!");
    } catch (error) {
      console.error("Error saving character:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const reviseStoryWithCharacter = async () => {
    if (!logline || !story || !character) {
      alert("로그라인, 이야기 구조, 인물 정보가 필요합니다!");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptName: "revise_story_with_character",
          variables: {
            logline,
            structure: JSON.stringify(story),
            character: JSON.stringify(character),
          },
          responseFormat: "json",
        }),
      });

      if (!response.ok) throw new Error("Failed to revise story");
      const data = await response.json();

      setStory(data.result);
      setEditableStory(data.result);

      // Save to DB
      await saveStoryToDB(data.result, undefined);

      handlePageChange(6);
    } catch (error) {
      console.error("Error revising story:", error);
      alert("이야기 수정 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const hasStoryChanges = () => {
    if (!story || !editableStory) return false;
    return JSON.stringify(story) !== JSON.stringify(editableStory);
  };

  const saveStory = async () => {
    if (!editableStory) return;

    setIsSaving(true);
    try {
      setStory(editableStory);
      await saveStoryToDB(editableStory, undefined);
      alert("저장되었습니다!");
    } catch (error) {
      console.error("Error saving story:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateCharacterField = (
    field: keyof EditableCharacter,
    value: string
  ) => {
    if (!editableCharacter) return;
    setEditableCharacter({
      ...editableCharacter,
      [field]: value,
    });
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

  return (
    <div
      className={`min-h-screen flex-col flex items-center justify-center relative transition-opacity duration-300 ${
        isTransitioning ? "opacity-0" : "opacity-100"
      }`}
    >
      {currentPage === 1 && (
        <div className="w-full max-w-4xl px-4">
          <div className="flex justify-center mb-8">
            <Image
              src="/생각룩말말풍선.gif"
              alt="생각하는 룩말"
              width={200}
              height={200}
            />
          </div>

          <p className="text-center">
            오늘은 우리 이야기의 주인공에 대해 좀 더 자세히 알아볼 거예요.
          </p>

          <div className="flex justify-center">
            <ClickableText onClick={() => handlePageChange(2)}>
              [ 다음 ]
            </ClickableText>
          </div>
        </div>
      )}

      {currentPage === 2 && (
        <div className="w-full max-w-4xl px-4">
          <div className="flex justify-center mb-8"></div>

          <p className="text-center">
            주인공은 사람일 수도, 동물일 수도, 생명체가 아닐 수도 있죠. 하지만
            어떤 경우든 주인공에 대해서 잘 알아야 더 좋은 이야기를 만들 수
            있어요.
          </p>

          <div className="flex justify-center">
            <ClickableText onClick={() => handlePageChange(3)}>
              [ 다음 ]
            </ClickableText>
          </div>
        </div>
      )}

      {currentPage === 3 && (
        <div className="w-full max-w-4xl px-4">
          <div className="flex flex-row">
            <Image
              src="/구조(열쇠).png"
              alt="신난 룩말"
              width={25}
              height={25}
            />
            <Image
              src="/구조(열쇠).png"
              alt="신난 룩말"
              width={25}
              height={25}
            />
            <Image
              src="/구조(열쇠).png"
              alt="신난 룩말"
              width={25}
              height={25}
            />
          </div>

          <p className="text-center leading-relaxed">
            우선 AI의 도움을 받아 저번 시간에 만든 이야기에서 주인공의 특징을
            뽑아 보고, 그 내용을 직접 수정한 다음, 수정된 내용을 바탕으로 인물의
            특성을 고려해 이야기를 수정해 볼 거예요.
          </p>

          <div className="flex justify-center">
            {isGenerating ? (
              <>
                <p className="text-center">주인공 특징 추출 중...</p>
                <Image
                  src="/로딩_전구.gif"
                  alt="로딩중"
                  width={50}
                  height={50}
                />
              </>
            ) : (
              <ClickableText onClick={extractCharacter}>
                [ 그럼 AI의 도움을 받아 주인공의 특징을 뽑아 볼까요? ]
              </ClickableText>
            )}
          </div>
        </div>
      )}

      {currentPage === 4 && editableCharacter && (
        <div className="w-full max-w-4xl px-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="mt-8 text-center flex-1">주인공 특징</h2>
          </div>
          <div className="items-end flex flex-row justify-end">
            <SketchButton
              className="text-2xl"
              onClick={saveCharacter}
              disabled={!hasCharacterChanges() || isSaving}
              loading={isSaving}
            >
              {isSaving
                ? "저장 중..."
                : hasCharacterChanges()
                ? "저장하기"
                : "바뀐 내용이 없습니다"}
            </SketchButton>
          </div>

          <div className="space-y-6 text-3xl mb-8">
            <div>
              <label className="block mb-2 text-xl lg:text-2xl font-bold">
                이름
              </label>
              <SketchInput
                value={editableCharacter.이름}
                onChange={(value) => updateCharacterField("이름", value)}
              />
            </div>

            <div>
              <label className="block mb-2 text-xl lg:text-2xl font-bold">
                나이
              </label>
              <SketchInput
                value={editableCharacter.나이}
                onChange={(value) => updateCharacterField("나이", value)}
              />
            </div>

            <div>
              <label className="block mb-2 text-xl lg:text-2xl font-bold">
                외적 특징
              </label>
              <SketchInput
                multiline
                rows={3}
                value={editableCharacter.외적_특징}
                onChange={(value) => updateCharacterField("외적_특징", value)}
              />
            </div>

            <div>
              <label className="block mb-2 text-xl lg:text-2xl font-bold">
                외적 목표와 장애물
              </label>
              <SketchInput
                multiline
                rows={3}
                value={editableCharacter.외적_목표와_장애물}
                onChange={(value) =>
                  updateCharacterField("외적_목표와_장애물", value)
                }
              />
            </div>

            <div>
              <label className="block mb-2 text-xl lg:text-2xl font-bold">
                내적 목표와 장애물
              </label>
              <SketchInput
                multiline
                rows={3}
                value={editableCharacter.내적_목표와_장애물}
                onChange={(value) =>
                  updateCharacterField("내적_목표와_장애물", value)
                }
              />
            </div>

            <div>
              <label className="block mb-2 text-xl lg:text-2xl font-bold">
                결핍
              </label>
              <SketchInput
                multiline
                rows={3}
                value={editableCharacter.결핍}
                onChange={(value) => updateCharacterField("결핍", value)}
              />
            </div>

            <div>
              <label className="block mb-2 text-xl lg:text-2xl font-bold">
                욕망과 결핍의 관계
              </label>
              <SketchInput
                multiline
                rows={3}
                value={editableCharacter.욕망과_결핍의_관계}
                onChange={(value) =>
                  updateCharacterField("욕망과_결핍의_관계", value)
                }
              />
            </div>

            <div>
              <label className="block mb-2 text-xl lg:text-2xl font-bold">
                다른 캐릭터들과의 관계
              </label>
              <SketchInput
                multiline
                value={editableCharacter.다른_캐릭터들과의_관계}
                onChange={(value) =>
                  updateCharacterField("다른_캐릭터들과의_관계", value)
                }
              />
            </div>
          </div>
        </div>
      )}

      {currentPage === 5 && (
        <div className="w-full max-w-4xl px-4">
          <p className="mb-12 text-center leading-relaxed">
            주인공을 설정하는 이유는, 물론 이야기를 더 깊이 있게 만들기
            위해서죠. 그럼 지금까지 한 인물 설정을 바탕으로 이야기를 다시 써
            볼까요?
          </p>

          <div className="flex justify-center gap-8">
            {isGenerating ? (
              <>
                <p className="text-center">이야기 다시 쓰는 중...</p>
                <Image
                  src="/로딩_전구.gif"
                  alt="로딩중"
                  width={50}
                  height={50}
                />
              </>
            ) : (
              <>
                <ClickableText onClick={reviseStoryWithCharacter}>
                  [ AI의 도움을 받아 다시 쓰기 ]
                </ClickableText>
                <ClickableText
                  onClick={() => {
                    setEditableStory(story);
                    handlePageChange(6);
                  }}
                >
                  [ 직접 다시 쓰기 ]
                </ClickableText>
              </>
            )}
          </div>
        </div>
      )}

      {currentPage === 6 && (
        <div className="flex flex-col items-center h-full w-full py-8 px-4">
          <div className="shrink-0 w-full flex flex-col items-start mb-4 space-y-4">
            <div className="flex flex-row space-x-1">
              <Image
                src="/구조(열쇠).png"
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
                    onClick={saveStory}
                    disabled={!hasStoryChanges() || isSaving}
                    loading={isSaving}
                  >
                    {isSaving
                      ? "저장 중..."
                      : hasStoryChanges()
                      ? "저장하기"
                      : "바뀐 내용이 없습니다"}
                  </SketchButton>
                </div>
              </>
            ) : (
              <p className="mt-4">
                아직 생성된 이야기가 없어요. 먼저 이야기를 생성해주세요!
              </p>
            )}
          </div>

          <div className="flex-1 min-h-0 w-full">
            {editableStory && (
              <div className="h-full overflow-y-auto">
                <div className="p-3 lg:p-8 bg-white/80 rounded-xl lg:rounded-2xl border-2 border-neutral-300">
                  <div className="space-y-6 lg:space-y-8">
                    {Object.entries(editableStory.막).map(
                      ([actName, beats]) => (
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
                                    updateBeatContent(
                                      actName,
                                      idx,
                                      e.target.value
                                    )
                                  }
                                  className="w-full text-sm lg:text-2xl leading-relaxed bg-white/50 p-2 rounded border border-neutral-300 focus:border-amber-500 focus:outline-none resize-none overflow-hidden"
                                  style={{
                                    fontFamily: "inherit",
                                    height: "auto",
                                    minHeight: "100px",
                                  }}
                                  onInput={(e) => {
                                    const target =
                                      e.target as HTMLTextAreaElement;
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
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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

      {currentPage < 6 && (
        <div className="fixed bottom-8 right-8">
          <ClickableText onClick={() => handlePageChange(currentPage + 1)}>
            다음 →
          </ClickableText>
        </div>
      )}
    </div>
  );
}
