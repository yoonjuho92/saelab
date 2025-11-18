"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface StoryStructure {
  metadata: {
    framework: string;
    logline: string;
    lang: string;
  };
  막: Record<string, Array<{ 이름: string; 내용: string }>>;
}

interface Stories {
  gulino: StoryStructure | null;
  vogel: StoryStructure | null;
  snider: StoryStructure | null;
}

export interface ExtractedStructure {
  처음: string;
  중간: string;
  끝: string;
}

interface Day1ContextType {
  logline: string;
  setLogline: (value: string) => void;
  stories: Stories;
  setStories: (value: Stories) => void;
  plotPoints: string[];
  setPlotPoints: (value: string[]) => void;
  extractedStructure: ExtractedStructure | null;
  setExtractedStructure: (value: ExtractedStructure | null) => void;
}

const Day1Context = createContext<Day1ContextType | undefined>(undefined);

const STORAGE_KEYS = {
  LOGLINE: "day1_logline",
  STORIES: "day1_stories",
  PLOT_POINTS: "day1_plotPoints",
  EXTRACTED_STRUCTURE: "day1_extractedStructure",
};

export function Day1Provider({ children }: { children: ReactNode }) {
  const [logline, setLoglineState] = useState("");
  const [stories, setStoriesState] = useState<Stories>({
    gulino: null,
    vogel: null,
    snider: null,
  });
  const [plotPoints, setPlotPointsState] = useState<string[]>([]);
  const [extractedStructure, setExtractedStructureState] =
    useState<ExtractedStructure | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedLogline = localStorage.getItem(STORAGE_KEYS.LOGLINE);
      const savedStories = localStorage.getItem(STORAGE_KEYS.STORIES);
      const savedPlotPoints = localStorage.getItem(STORAGE_KEYS.PLOT_POINTS);
      const savedExtractedStructure = localStorage.getItem(
        STORAGE_KEYS.EXTRACTED_STRUCTURE
      );

      if (savedLogline) {
        setLoglineState(savedLogline);
      }
      if (savedStories) {
        setStoriesState(JSON.parse(savedStories));
      }
      if (savedPlotPoints) {
        setPlotPointsState(JSON.parse(savedPlotPoints));
      }
      if (savedExtractedStructure) {
        setExtractedStructureState(JSON.parse(savedExtractedStructure));
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Wrapper functions to save to localStorage
  const setLogline = (value: string) => {
    setLoglineState(value);
    try {
      localStorage.setItem(STORAGE_KEYS.LOGLINE, value);
    } catch (error) {
      console.error("Error saving logline to localStorage:", error);
    }
  };

  const setStories = (value: Stories) => {
    setStoriesState(value);
    try {
      localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(value));
    } catch (error) {
      console.error("Error saving stories to localStorage:", error);
    }
  };

  const setPlotPoints = (value: string[]) => {
    setPlotPointsState(value);
    try {
      localStorage.setItem(STORAGE_KEYS.PLOT_POINTS, JSON.stringify(value));
    } catch (error) {
      console.error("Error saving plotPoints to localStorage:", error);
    }
  };

  const setExtractedStructure = (value: ExtractedStructure | null) => {
    setExtractedStructureState(value);
    try {
      if (value === null) {
        localStorage.removeItem(STORAGE_KEYS.EXTRACTED_STRUCTURE);
      } else {
        localStorage.setItem(
          STORAGE_KEYS.EXTRACTED_STRUCTURE,
          JSON.stringify(value)
        );
      }
    } catch (error) {
      console.error("Error saving extractedStructure to localStorage:", error);
    }
  };

  // Don't render until data is loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <Day1Context.Provider
      value={{
        logline,
        setLogline,
        stories,
        setStories,
        plotPoints,
        setPlotPoints,
        extractedStructure,
        setExtractedStructure,
      }}
    >
      {children}
    </Day1Context.Provider>
  );
}

export function useDay1Context() {
  const context = useContext(Day1Context);
  if (context === undefined) {
    throw new Error("useDay1Context must be used within a Day1Provider");
  }
  return context;
}
