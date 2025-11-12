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

interface Day1ContextType {
  logline: string;
  setLogline: (value: string) => void;
  stories: Stories;
  setStories: (value: Stories) => void;
  plotPoints: string[];
  setPlotPoints: (value: string[]) => void;
}

const Day1Context = createContext<Day1ContextType | undefined>(undefined);

const STORAGE_KEYS = {
  LOGLINE: "day1_logline",
  STORIES: "day1_stories",
  PLOT_POINTS: "day1_plotPoints",
};

export function Day1Provider({ children }: { children: ReactNode }) {
  const [logline, setLoglineState] = useState("");
  const [stories, setStoriesState] = useState<Stories>({
    gulino: null,
    vogel: null,
    snider: null,
  });
  const [plotPoints, setPlotPointsState] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedLogline = localStorage.getItem(STORAGE_KEYS.LOGLINE);
      const savedStories = localStorage.getItem(STORAGE_KEYS.STORIES);
      const savedPlotPoints = localStorage.getItem(STORAGE_KEYS.PLOT_POINTS);

      if (savedLogline) {
        setLoglineState(savedLogline);
      }
      if (savedStories) {
        setStoriesState(JSON.parse(savedStories));
      }
      if (savedPlotPoints) {
        setPlotPointsState(JSON.parse(savedPlotPoints));
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
