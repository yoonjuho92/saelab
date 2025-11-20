"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

export interface StoryStructure {
  metadata: {
    framework: string;
    logline: string;
    lang: string;
  };
  막: Record<string, Array<{ 이름: string; 내용: string }>>;
}

export interface Character {
  이름: string;
  나이: string;
  외적_특징: string;
  외적_목표와_장애물: string;
  내적_목표와_장애물: string;
  결핍: string;
  욕망과_결핍의_관계: string;
  다른_캐릭터들과의_관계: string;
}

export interface TreatmentScene {
  장면_번호: number;
  장면_제목: string;
  장면_내용: string;
}

export interface FirstActTreatment {
  [key: string]: TreatmentScene[];
}

interface Day4ContextType {
  logline: string;
  setLogline: (value: string) => void;
  story: StoryStructure | null;
  setStory: (value: StoryStructure | null) => void;
  character: Character | null;
  setCharacter: (value: Character | null) => void;
  firstActTreatment: FirstActTreatment | null;
  setFirstActTreatment: (value: FirstActTreatment | null) => void;
  storyId: number | null;
  setStoryId: (value: number | null) => void;
  loadStoryFromDB: () => Promise<void>;
  saveTreatmentToDB: (
    treatmentToSave?: FirstActTreatment | null
  ) => Promise<void>;
  isLoaded: boolean;
}

const Day4Context = createContext<Day4ContextType | undefined>(undefined);

export function Day4Provider({ children }: { children: ReactNode }) {
  const [logline, setLoglineState] = useState("");
  const [story, setStoryState] = useState<StoryStructure | null>(null);
  const [character, setCharacterState] = useState<Character | null>(null);
  const [firstActTreatment, setFirstActTreatmentState] =
    useState<FirstActTreatment | null>(null);
  const [storyId, setStoryIdState] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from DB on mount
  useEffect(() => {
    const loadFromDB = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsLoaded(true);
          return;
        }

        // Get the latest story for this user
        const { data: story, error } = await supabase
          .from("story")
          .select("id, logline, structure, character, first_act_treatment")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        if (story) {
          setStoryIdState(story.id);
          setLoglineState(story.logline || "");
          if (story.structure) {
            setStoryState(story.structure as StoryStructure);
          }
          if (story.character) {
            setCharacterState(story.character as Character);
          }
          if (story.first_act_treatment) {
            setFirstActTreatmentState(
              story.first_act_treatment as FirstActTreatment
            );
          }
        }
      } catch (error) {
        console.error("Error loading story from DB:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadFromDB();
  }, []);

  const setLogline = (value: string) => {
    setLoglineState(value);
  };

  const setStory = (value: StoryStructure | null) => {
    setStoryState(value);
  };

  const setCharacter = (value: Character | null) => {
    setCharacterState(value);
  };

  const setFirstActTreatment = (value: FirstActTreatment | null) => {
    setFirstActTreatmentState(value);
  };

  const setStoryId = (value: number | null) => {
    setStoryIdState(value);
  };

  const loadStoryFromDB = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: story, error } = await supabase
        .from("story")
        .select("id, logline, structure, character, first_act_treatment")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (story) {
        setStoryIdState(story.id);
        setLoglineState(story.logline || "");
        if (story.structure) {
          setStoryState(story.structure as StoryStructure);
        }
        if (story.character) {
          setCharacterState(story.character as Character);
        }
        if (story.first_act_treatment) {
          setFirstActTreatmentState(
            story.first_act_treatment as FirstActTreatment
          );
        }
      }
    } catch (error) {
      console.error("Error loading story from DB:", error);
      throw error;
    }
  };

  const saveTreatmentToDB = async (
    treatmentToSave?: FirstActTreatment | null
  ) => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      if (!storyId) {
        throw new Error("No story ID found");
      }

      const treatmentData = {
        first_act_treatment:
          treatmentToSave !== undefined ? treatmentToSave : firstActTreatment,
      };

      // Update existing story
      const { error } = await supabase
        .from("story")
        .update(treatmentData)
        .eq("id", storyId);

      if (error) throw error;

      // Update local state
      if (treatmentToSave !== undefined) {
        setFirstActTreatmentState(treatmentToSave);
      }
    } catch (error) {
      console.error("Error saving treatment to DB:", error);
      throw error;
    }
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <Day4Context.Provider
      value={{
        logline,
        setLogline,
        story,
        setStory,
        character,
        setCharacter,
        firstActTreatment,
        setFirstActTreatment,
        storyId,
        setStoryId,
        loadStoryFromDB,
        saveTreatmentToDB,
        isLoaded,
      }}
    >
      {children}
    </Day4Context.Provider>
  );
}

export function useDay4Context() {
  const context = useContext(Day4Context);
  if (context === undefined) {
    throw new Error("useDay4Context must be used within a Day4Provider");
  }
  return context;
}
