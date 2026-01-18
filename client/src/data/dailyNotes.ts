export interface DailyNote {
  dayOfWeek: number;
  title: string;
  subtitle: string;
  bullets: string[];
}

export const dailyNotes: DailyNote[] = [
  {
    dayOfWeek: 0,
    title: "Sunday",
    subtitle: "Market Closed",
    bullets: [
      "Market closed with anticipation of the start of the Asia session.",
    ],
  },
  {
    dayOfWeek: 1,
    title: "Monday",
    subtitle: "Preparation Day",
    bullets: [
      "Low liquidity and the market is often in a range.",
      "Focus on preparation rather than profit.",
      "Determine the week's High / Low.",
      "Draw supports and resistances.",
      "Read the general market trend.",
      "Avoid swing trades.",
      "Light scalping only when necessary.",
    ],
  },
  {
    dayOfWeek: 2,
    title: "Tuesday",
    subtitle: "Expansion Day",
    bullets: [
      "Liquidity starts to rise.",
      "Often the real movement of the week begins.",
      "Pay attention to inflation news (CPI) when present.",
      "Entering with the breakout is more appropriate than oscillation.",
      "Avoid entering before important news.",
    ],
  },
  {
    dayOfWeek: 3,
    title: "Wednesday",
    subtitle: "Trend Day",
    bullets: [
      "Highest liquidity during the week.",
      "The trend often continues.",
      "The best day for overall performance.",
      "Reinforce winning trades only.",
      "Avoid trading against the trend.",
      "Pay attention to interest rate decisions if present.",
    ],
  },
  {
    dayOfWeek: 4,
    title: "Thursday",
    subtitle: "Retracement Day",
    bullets: [
      "Medium liquidity.",
      "Corrections and profit taking occur.",
      "Opportunities are with the main trend.",
      "Possible short reversals from strong levels.",
      "Avoid overtrading.",
    ],
  },
  {
    dayOfWeek: 5,
    title: "Friday",
    subtitle: "Liquidity Day",
    bullets: [
      "Liquidity is irregular.",
      "Spread of false breakouts.",
      "Liquidity grabs and stop-hunts.",
      "Fast scalping only.",
      "Early exit is better.",
      "Avoid trading at the end of the day.",
    ],
  },
  {
    dayOfWeek: 6,
    title: "Saturday",
    subtitle: "Market Closed",
    bullets: [
      "Market closed.",
    ],
  },
];

export function getDailyNote(utcDayOfWeek: number): DailyNote {
  return dailyNotes.find(note => note.dayOfWeek === utcDayOfWeek) || dailyNotes[0];
}
