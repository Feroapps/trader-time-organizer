import type { CreateAlarmInput } from '@/types/Alarm';

export const fixedAlarms: CreateAlarmInput[] = [
  {
    hourUTC: 22,
    minuteUTC: 0,
    repeatDays: [0, 1, 2, 3, 4],
    label: "Sydney Open",
    isFixed: true,
    isEnabled: true,
  },
  {
    hourUTC: 0,
    minuteUTC: 0,
    repeatDays: [0, 1, 2, 3, 4],
    label: "Tokyo Open",
    isFixed: true,
    isEnabled: true,
  },
  {
    hourUTC: 7,
    minuteUTC: 0,
    repeatDays: [1, 2, 3, 4, 5],
    label: "London Open",
    isFixed: true,
    isEnabled: true,
  },
  {
    hourUTC: 12,
    minuteUTC: 0,
    repeatDays: [1, 2, 3, 4, 5],
    label: "New York Open",
    isFixed: true,
    isEnabled: true,
  },
  {
    hourUTC: 13,
    minuteUTC: 30,
    repeatDays: [1, 2, 3, 4, 5],
    label: "US Market Open",
    isFixed: true,
    isEnabled: true,
  },
  {
    hourUTC: 20,
    minuteUTC: 0,
    repeatDays: [1, 2, 3, 4, 5],
    label: "US Market Close",
    isFixed: true,
    isEnabled: true,
  },
];
