import type { CreateAlarmInput } from '@/types/Alarm';

// Days of week: Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6

export const fixedAlarms: CreateAlarmInput[] = [
  {
    hourUTC: 21,
    minuteUTC: 0,
    repeatDays: [0], // Sunday
    label: "Start of Sydney session",
    isFixed: true,
    isEnabled: true,
    duration: 10,
  },
  {
    hourUTC: 0,
    minuteUTC: 0,
    repeatDays: [1, 2, 3, 4, 5], // Monday-Friday
    label: "Overlap of Tokyo + Sydney session",
    isFixed: true,
    isEnabled: true,
    duration: 10,
  },
  {
    hourUTC: 6,
    minuteUTC: 0,
    repeatDays: [1, 2, 3, 4, 5], // Monday-Friday
    label: "End of Sydney session",
    isFixed: true,
    isEnabled: true,
    duration: 10,
  },
  {
    hourUTC: 7,
    minuteUTC: 0,
    repeatDays: [1, 2, 3, 4, 5], // Monday-Friday
    label: "Overlap Tokyo + London + Frankfurt",
    isFixed: true,
    isEnabled: true,
    duration: 10,
  },
  {
    hourUTC: 9,
    minuteUTC: 0,
    repeatDays: [1, 2, 3, 4, 5], // Monday-Friday
    label: "End of Tokyo session",
    isFixed: true,
    isEnabled: true,
    duration: 10,
  },
  {
    hourUTC: 13,
    minuteUTC: 0,
    repeatDays: [1, 2, 3, 4, 5], // Monday-Friday
    label: "New York overlap + London + Frankfurt",
    isFixed: true,
    isEnabled: true,
    duration: 10,
  },
  {
    hourUTC: 15,
    minuteUTC: 0,
    repeatDays: [1, 2, 3, 4, 5], // Monday-Friday
    label: "End of Frankfurt session",
    isFixed: true,
    isEnabled: true,
    duration: 10,
  },
  {
    hourUTC: 16,
    minuteUTC: 0,
    repeatDays: [1, 2, 3, 4, 5], // Monday-Friday
    label: "End of London session",
    isFixed: true,
    isEnabled: true,
    duration: 10,
  },
  {
    hourUTC: 21,
    minuteUTC: 0,
    repeatDays: [1, 2, 3, 4], // Monday-Thursday
    label: "End of New York session and start of Sydney session",
    isFixed: true,
    isEnabled: true,
    duration: 10,
  },
  {
    hourUTC: 21,
    minuteUTC: 0,
    repeatDays: [5], // Friday
    label: "End of New York session",
    isFixed: true,
    isEnabled: true,
    duration: 10,
  },
];
