export type StageKey = "main" | "schoolofrock" | "opencall";

export type Performer = {
  id: string;
  name: string;
  stage: StageKey;
  startTime: string; // "12:00"
  endTime: string;
  category:
    | "music"
    | "drag"
    | "dance"
    | "choir"
    | "comedy"
    | "dj"
    | "theater"
    | "kids"
    | "other";
  description?: string;
  isHeadliner?: boolean;
  isFavorited?: boolean;
};

export type Stage = {
  id: StageKey;
  name: string;
  fullName: string;
  location: string;
  color: string;
  emcees: string[];
};

export type YearEvent = {
  id: string;
  title: string;
  date: string;
  time?: string;
  location: string;
  description: string;
  category: "community" | "fundraiser" | "social" | "pride" | "education";
  link?: string;
};
