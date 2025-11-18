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

interface Day2ContextType {
  logline: string;
  setLogline: (value: string) => void;
  story: StoryStructure | null;
  setStory: (value: StoryStructure | null) => void;
  storyId: number | null;
  setStoryId: (value: number | null) => void;
  loadStoryFromDB: () => Promise<void>;
  saveStoryToDB: (storyToSave?: StoryStructure | null) => Promise<void>;
}

const Day2Context = createContext<Day2ContextType | undefined>(undefined);

export function Day2Provider({ children }: { children: ReactNode }) {
  const [logline, setLoglineState] = useState("");
  const [story, setStoryState] = useState<StoryStructure | null>(null);
  const [storyId, setStoryIdState] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const supabase = createClient();

  // Load from DB on mount
  useEffect(() => {
    const loadFromDB = async () => {
      try {
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
          .select("id, logline, structure")
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
        }
      } catch (error) {
        console.error("Error loading from DB:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadFromDB();
  }, [supabase]);

  const setLogline = (value: string) => {
    setLoglineState(value);
  };

  const setStory = (value: StoryStructure | null) => {
    setStoryState(value);
  };

  const setStoryId = (value: number | null) => {
    setStoryIdState(value);
  };

  const loadStoryFromDB = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: story, error } = await supabase
        .from("story")
        .select("id, logline, structure")
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
      }
    } catch (error) {
      console.error("Error loading story from DB:", error);
      throw error;
    }
  };

  const saveStoryToDB = async (storyToSave?: StoryStructure | null) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const storyData = {
        user_id: user.id,
        logline,
        structure: storyToSave !== undefined ? storyToSave : story,
      };

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
    <Day2Context.Provider
      value={{
        logline,
        setLogline,
        story,
        setStory,
        storyId,
        setStoryId,
        loadStoryFromDB,
        saveStoryToDB,
      }}
    >
      {children}
    </Day2Context.Provider>
  );
}

export function useDay2Context() {
  const context = useContext(Day2Context);
  if (context === undefined) {
    throw new Error("useDay2Context must be used within a Day2Provider");
  }
  return context;
}
