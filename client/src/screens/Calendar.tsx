import { useState, useMemo, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNotes } from "@/storage/notesRepo";
import { getAlarms } from "@/storage/alarmsRepo";
import type { Note, Alarm } from "@/types";

interface UTCDate {
  year: number;
  month: number;
  day: number;
}

function getUTCToday(): UTCDate {
  const now = new Date();
  return {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth(),
    day: now.getUTCDate(),
  };
}

function formatDateUTC(date: UTCDate): string {
  return `${date.year}-${String(date.month + 1).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 1)).getUTCDay();
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface MonthGridProps {
  year: number;
  month: number;
  today: UTCDate;
  selectedDate: string | null;
  highlightedDates: Set<string>;
  onClickDate: (date: UTCDate) => void;
}

function MonthGrid({ year, month, today, selectedDate, highlightedDates, onClickDate }: MonthGridProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const isToday = (day: number) => 
    today.year === year && today.month === month && today.day === day;

  const isSelected = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return selectedDate === dateStr;
  };

  const isHighlighted = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return highlightedDates.has(dateStr);
  };

  return (
    <div className="border rounded-md p-2" data-testid={`month-grid-${month}`}>
      <h3 className="text-sm font-medium text-center mb-2" data-testid={`month-name-${month}`}>
        {MONTH_NAMES[month]}
      </h3>
      <div className="grid grid-cols-7 gap-0.5 text-[10px]">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-muted-foreground font-medium py-0.5">
            {d[0]}
          </div>
        ))}
        {days.map((day, idx) => (
          <div key={idx} className="aspect-square flex items-center justify-center">
            {day !== null && (
              <button
                onClick={() => onClickDate({ year, month, day })}
                className={`w-full h-full flex items-center justify-center rounded-sm text-[10px] transition-colors hover-elevate ${
                  isSelected(day)
                    ? "ring-2 ring-primary ring-offset-1"
                    : ""
                } ${
                  isToday(day)
                    ? "bg-blue-600 dark:bg-blue-500 text-white font-bold"
                    : isHighlighted(day)
                    ? "bg-slate-400 dark:bg-slate-500 text-white"
                    : "text-foreground"
                }`}
                data-testid={`day-${year}-${month}-${day}`}
              >
                {day}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Calendar() {
  const [, setLocation] = useLocation();
  const today = useMemo(() => getUTCToday(), []);
  const [viewYear, setViewYear] = useState(today.year);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  const loadData = useCallback(async () => {
    const [loadedNotes, loadedAlarms] = await Promise.all([getNotes(), getAlarms()]);
    setNotes(loadedNotes);
    setAlarms(loadedAlarms.filter((a) => !a.isFixed));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const highlightedDates = useMemo(() => {
    const dates = new Set<string>();
    
    notes.forEach((note) => {
      dates.add(note.dateUTC);
    });

    alarms.forEach((alarm) => {
      if (!alarm.dateUTC) return;
      const [year, month, day] = alarm.dateUTC.split("-").map(Number);
      const alarmDate = new Date(Date.UTC(year, month - 1, day));
      const alarmDow = alarmDate.getUTCDay();
      const alarmDayOfMonth = day;
      
      if (alarm.repeatWeekly) {
        for (let m = 0; m < 12; m++) {
          const daysInMonth = getDaysInMonth(viewYear, m);
          for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(Date.UTC(viewYear, m, d));
            if (date.getUTCDay() === alarmDow) {
              dates.add(formatDateUTC({ year: viewYear, month: m, day: d }));
            }
          }
        }
      } else if (alarm.repeatMonthly) {
        for (let m = 0; m < 12; m++) {
          const daysInMonth = getDaysInMonth(viewYear, m);
          if (alarmDayOfMonth <= daysInMonth) {
            dates.add(formatDateUTC({ year: viewYear, month: m, day: alarmDayOfMonth }));
          }
        }
      } else {
        if (year === viewYear) {
          dates.add(alarm.dateUTC);
        }
      }
    });

    return dates;
  }, [notes, alarms, viewYear]);

  const handleClickDate = (date: UTCDate) => {
    const dateStr = formatDateUTC(date);
    if (selectedDate === dateStr) {
      setLocation(`/calendar/day/${dateStr}`);
    } else {
      setSelectedDate(dateStr);
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">
          Calendar
        </h1>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => setViewYear(viewYear - 1)}
            data-testid="button-prev-year"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-mono text-lg font-semibold min-w-[60px] text-center" data-testid="text-current-year">
            {viewYear}
          </span>
          <Button
            size="icon"
            variant="outline"
            onClick={() => setViewYear(viewYear + 1)}
            data-testid="button-next-year"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-4" data-testid="text-utc-notice">
        All dates are in UTC+00:00. Click once to select, click again to open. <span className="inline-block w-3 h-3 bg-blue-600 dark:bg-blue-500 rounded-sm align-middle mx-1"></span> Today <span className="inline-block w-3 h-3 bg-slate-400 dark:bg-slate-500 rounded-sm align-middle mx-1"></span> Has notes/alerts
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3" data-testid="yearly-grid">
        {months.map((month) => (
          <MonthGrid
            key={month}
            year={viewYear}
            month={month}
            today={today}
            selectedDate={selectedDate}
            highlightedDates={highlightedDates}
            onClickDate={handleClickDate}
          />
        ))}
      </div>
    </div>
  );
}
