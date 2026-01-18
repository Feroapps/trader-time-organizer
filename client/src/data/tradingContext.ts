export interface TradingContext {
  timeRange: string;
  liquidity?: string;
  behavior: string;
  majorPairs?: string[];
  minorPairs?: string[];
  reactivePairs?: string[];
  liquidPairs?: string[];
  additionalPairs?: string[];
}

export const tradingContexts: TradingContext[] = [
  {
    timeRange: "00:00 – 07:00",
    liquidity: "Low → Medium",
    behavior: "Oscillation / Range",
    majorPairs: ["USDJPY", "AUDJPY", "AUDUSD", "NZDUSD"],
    minorPairs: ["AUDCAD", "AUDNZD", "NZDJPY"],
  },
  {
    timeRange: "07:00 – 09:00",
    behavior: "Liquidity transition / Short sharp movement",
    reactivePairs: ["EURJPY", "GBPJPY", "USDJPY", "EURUSD"],
  },
  {
    timeRange: "09:00 – 13:00",
    behavior: "Range breakout / Start of trend",
    majorPairs: ["EURUSD", "GBPUSD", "EURGBP", "GBPJPY", "USDCHF"],
    minorPairs: ["EURJPY", "CHFJPY", "GBPCAD"],
  },
  {
    timeRange: "13:00 – 16:00",
    behavior: "Highest daily liquidity",
    liquidPairs: ["EURUSD", "GBPUSD", "USDJPY", "USDCAD"],
    additionalPairs: ["EURJPY", "GBPJPY"],
  },
  {
    timeRange: "16:00 – 21:00",
    behavior: "Continuation / Reversal / Profit taking",
    majorPairs: ["EURUSD", "GBPUSD", "USDJPY", "USDCAD"],
    minorPairs: ["CADJPY", "AUDUSD", "NZDUSD"],
  },
];

export const closedMessage = `Thank you for using Trader Time Organizer.
At these times, most trading pairs suffer from low liquidity.
We hope we have helped you organize trading times and make better decisions.
We wish you successful trading 💐`;

export function getTradingContext(utcHour: number, marketOpen: boolean): TradingContext | null {
  if (!marketOpen) {
    return null;
  }

  if (utcHour >= 0 && utcHour < 7) {
    return tradingContexts[0];
  } else if (utcHour >= 7 && utcHour < 9) {
    return tradingContexts[1];
  } else if (utcHour >= 9 && utcHour < 13) {
    return tradingContexts[2];
  } else if (utcHour >= 13 && utcHour < 16) {
    return tradingContexts[3];
  } else if (utcHour >= 16 && utcHour < 21) {
    return tradingContexts[4];
  }

  return null;
}
