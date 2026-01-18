export interface TradingSession {
  id: string;
  label: string;
  startHour: number;
  endHour: number;
  color: string;
  textColor: string;
}

export const tradingSessions: TradingSession[] = [
  {
    id: "sydney",
    label: "Sydney",
    startHour: 21,
    endHour: 6,
    color: "hsl(48 70% 75%)",
    textColor: "hsl(48 70% 25%)",
  },
  {
    id: "tokyo",
    label: "Tokyo",
    startHour: 0,
    endHour: 9,
    color: "hsl(38 70% 58%)",
    textColor: "hsl(38 70% 20%)",
  },
  {
    id: "london",
    label: "London",
    startHour: 8,
    endHour: 17,
    color: "hsl(210 50% 75%)",
    textColor: "hsl(210 50% 25%)",
  },
  {
    id: "new-york",
    label: "New York",
    startHour: 13,
    endHour: 22,
    color: "hsl(140 55% 65%)",
    textColor: "hsl(140 55% 25%)",
  },
];

export interface TimeSegment {
  startHour: number;
  endHour: number;
  sessions: string[];
  color: string;
  label: string;
}

export const timeSegments: TimeSegment[] = [
  {
    startHour: 0,
    endHour: 6,
    sessions: ["sydney", "tokyo"],
    color: "hsl(45 60% 50%)",
    label: "Sydney + Tokyo",
  },
  {
    startHour: 6,
    endHour: 8,
    sessions: ["tokyo"],
    color: "hsl(38 70% 58%)",
    label: "Tokyo",
  },
  {
    startHour: 8,
    endHour: 9,
    sessions: ["tokyo", "london"],
    color: "hsl(0 45% 35%)",
    label: "Tokyo + London",
  },
  {
    startHour: 9,
    endHour: 13,
    sessions: ["london"],
    color: "hsl(210 50% 75%)",
    label: "London",
  },
  {
    startHour: 13,
    endHour: 17,
    sessions: ["london", "new-york"],
    color: "hsl(150 45% 32%)",
    label: "London + New York",
  },
  {
    startHour: 17,
    endHour: 21,
    sessions: ["new-york"],
    color: "hsl(140 55% 65%)",
    label: "New York",
  },
  {
    startHour: 21,
    endHour: 22,
    sessions: ["sydney", "new-york"],
    color: "hsl(75 35% 40%)",
    label: "Sydney + New York",
  },
  {
    startHour: 22,
    endHour: 24,
    sessions: ["sydney"],
    color: "hsl(48 70% 75%)",
    label: "Sydney",
  },
];

export function getSessionsForHour(hour: number): TradingSession[] {
  return tradingSessions.filter((session) => {
    if (session.startHour < session.endHour) {
      return hour >= session.startHour && hour < session.endHour;
    } else {
      return hour >= session.startHour || hour < session.endHour;
    }
  });
}

export function getPrimarySessionForHour(hour: number): TradingSession | null {
  const sessions = getSessionsForHour(hour);
  return sessions.length > 0 ? sessions[0] : null;
}
