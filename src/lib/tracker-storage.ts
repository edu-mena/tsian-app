// Local storage utilities for Sá e Nata
export type Trigger =
  | "estresse"
  | "tedio"
  | "solidao"
  | "algoritmo"
  | "sono"
  | "outro";

export type Mood = "otimo" | "bem" | "neutro" | "mal" | "pessimo";

export interface Relapse {
  id: string;
  date: string; // ISO yyyy-mm-dd
  note?: string;
  trigger?: Trigger;
  mood?: Mood;
}

export interface AppState {
  startDate: string; // ISO yyyy-mm-dd — beginning of current streak
  relapses: Relapse[];
  createdAt: string;
}

const KEY = "sa-e-nata:state:v1";

const createMockState = (): AppState => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const createdAt = new Date(today);
  createdAt.setDate(createdAt.getDate() - 96);

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 19);

  const relapseOne = new Date(today);
  relapseOne.setDate(relapseOne.getDate() - 72);

  const relapseTwo = new Date(today);
  relapseTwo.setDate(relapseTwo.getDate() - 44);

  const relapseThree = new Date(today);
  relapseThree.setDate(relapseThree.getDate() - 17);

  return {
    startDate: toISO(startDate),
    createdAt: toISO(createdAt),
    relapses: [
      {
        id: "mock-relapse-1",
        date: toISO(relapseOne),
        trigger: "estresse",
        mood: "mal",
        note: "Semana intensa de trabalho e pouca atenção ao ritmo.",
      },
      {
        id: "mock-relapse-2",
        date: toISO(relapseTwo),
        trigger: "tedio",
        mood: "neutro",
        note: "Fiquei sem foco no fim da tarde e cedi por impulso.",
      },
      {
        id: "mock-relapse-3",
        date: toISO(relapseThree),
        trigger: "sono",
        mood: "bem",
        note: "Noite curta depois de viajar e acabei compensando.",
      },
    ],
  };
};

export const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return toISO(d);
};

export const toISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const fromISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const daysBetween = (a: string, b: string) => {
  const da = fromISO(a).getTime();
  const db = fromISO(b).getTime();
  return Math.round((db - da) / 86400000);
};

export const loadState = (): AppState => {
  if (typeof window === "undefined") {
    return { startDate: todayISO(), relapses: [], createdAt: todayISO() };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const initial = createMockState();
      localStorage.setItem(KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as AppState;
  } catch {
    return { startDate: todayISO(), relapses: [], createdAt: todayISO() };
  }
};

export const saveState = (s: AppState) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
};

export const MILESTONES = [7, 14, 30, 60, 90, 180, 365, 730];

export const nextMilestone = (days: number) =>
  MILESTONES.find((m) => m > days) ?? days + 365;

export const isMilestone = (days: number) => MILESTONES.includes(days);

// Compute historical streak lengths from relapses
export const computeStreaks = (state: AppState) => {
  const relapsesSorted = [...state.relapses].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const streaks: { start: string; end: string; days: number }[] = [];
  let cursor = state.createdAt;
  for (const r of relapsesSorted) {
    streaks.push({ start: cursor, end: r.date, days: daysBetween(cursor, r.date) });
    // next streak starts the day after the relapse
    const next = fromISO(r.date);
    next.setDate(next.getDate() + 1);
    cursor = toISO(next);
  }
  const currentDays = daysBetween(state.startDate, todayISO());
  return { history: streaks, currentDays, currentStart: state.startDate };
};
