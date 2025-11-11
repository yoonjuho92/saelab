"use client";

import { createContext, useContext, useState, ReactNode } from "react";

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

export function Day1Provider({ children }: { children: ReactNode }) {
  const [logline, setLogline] = useState("");
  const [stories, setStories] = useState<Stories>({
    gulino: null,
    vogel: null,
    snider: null,
  });
  const [plotPoints, setPlotPoints] = useState<string[]>([]);

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
