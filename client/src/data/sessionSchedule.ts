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
    color: "hsl(280 65% 45%)",
    textColor: "hsl(280 65% 95%)",
  },
  {
    id: "tokyo",
    label: "Tokyo",
    startHour: 0,
    endHour: 9,
    color: "hsl(340 75% 45%)",
    textColor: "hsl(340 75% 95%)",
  },
  {
    id: "london",
    label: "London",
    startHour: 8,
    endHour: 17,
    color: "hsl(217 91% 45%)",
    textColor: "hsl(217 91% 95%)",
  },
  {
    id: "new-york",
    label: "New York",
    startHour: 13,
    endHour: 22,
    color: "hsl(43 74% 45%)",
    textColor: "hsl(43 74% 95%)",
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
