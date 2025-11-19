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

interface Day3ContextType {
  logline: string;
  setLogline: (value: string) => void;
  story: StoryStructure | null;
  setStory: (value: StoryStructure | null) => void;
  character: Character | null;
  setCharacter: (value: Character | null) => void;
  storyId: number | null;
  setStoryId: (value: number | null) => void;
  loadStoryFromDB: () => Promise<void>;
  saveStoryToDB: (
    storyToSave?: StoryStructure | null,
    characterToSave?: Character | null
  ) => Promise<void>;
  isLoaded: boolean;
}

const Day3Context = createContext<Day3ContextType | undefined>(undefined);

export function Day3Provider({ children }: { children: ReactNode }) {
  const [logline, setLoglineState] = useState("");
  const [story, setStoryState] = useState<StoryStructure | null>(null);
  const [character, setCharacterState] = useState<Character | null>(null);
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
          .select("id, logline, structure, character")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 is "no rows returned"
          console.error("Error loading from DB:", error);
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
        }
      } catch (error) {
        console.error("Error loading from DB:", error);
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
        .select("id, logline, structure, character")
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
      }
    } catch (error) {
      console.error("Error loading story from DB:", error);
      throw error;
    }
  };

  const saveStoryToDB = async (
    storyToSave?: StoryStructure | null,
    characterToSave?: Character | null
  ) => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const storyData: {
        user_id: string;
        logline: string;
        structure: StoryStructure | null;
        character?: Character | null;
      } = {
        user_id: user.id,
        logline,
        structure: storyToSave !== undefined ? storyToSave : story,
      };

      // Only include character if it's provided
      if (characterToSave !== undefined) {
        storyData.character = characterToSave;
      } else if (character !== null) {
        storyData.character = character;
      }

      if (storyId) {
        // Update existing story
        const { error } = await supabase
          .from("story")
          .update(storyData)
          .eq("id", storyId);

        if (error) throw error;
      } else {
        // Insert new story
        const { data, error } = await supabase
          .from("story")
          .insert([storyData])
          .select("id")
          .single();

        if (error) throw error;
        if (data) {
          setStoryIdState(data.id);
        }
      }
    } catch (error) {
      console.error("Error saving story to DB:", error);
      throw error;
    }
  };

  // Don't render until data is loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <Day3Context.Provider
      value={{
        logline,
        setLogline,
        story,
        setStory,
        character,
        setCharacter,
        storyId,
        setStoryId,
        loadStoryFromDB,
        saveStoryToDB,
        isLoaded,
      }}
    >
      {children}
    </Day3Context.Provider>
  );
}

export function useDay3Context() {
  const context = useContext(Day3Context);
  if (context === undefined) {
    throw new Error("useDay3Context must be used within a Day3Provider");
  }
  return context;
}
