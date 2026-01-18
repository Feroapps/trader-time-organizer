import { useState, useMemo, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getNotes, createNote, deleteNote } from "@/storage/notesRepo";
import { getAlarms, updateAlarm, deleteAlarm } from "@/storage/alarmsRepo";
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

function getUTCDayOfWeek(date: UTCDate): number {
  return new Date(Date.UTC(date.year, date.month, date.day)).getUTCDay();
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 1)).getUTCDay();
}

function utcTimeToLocal(date: UTCDate, hourUTC: number, minuteUTC: number): string {
  const utcDate = new Date(Date.UTC(
    date.year,
    date.month,
    date.day,
    hourUTC,
    minuteUTC
  ));
  return utcDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function parseTimeUTC(timeUTC: string): { hour: number; minute: number } {
  const [h, m] = timeUTC.split(":").map(Number);
  return { hour: h, minute: m };
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
  selectedDate: UTCDate | null;
  highlightedDates: Set<string>;
  onSelectDate: (date: UTCDate) => void;
}

function MonthGrid({ year, month, today, selectedDate, highlightedDates, onSelectDate }: MonthGridProps) {
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

  const isSelected = (day: number) =>
    selectedDate?.year === year && selectedDate?.month === month && selectedDate?.day === day;

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
                onClick={() => onSelectDate({ year, month, day })}
                className={`w-full h-full flex items-center justify-center rounded-sm text-[10px] transition-colors hover-elevate ${
                  isToday(day)
                    ? "bg-blue-500 text-white font-bold"
                    : isSelected(day)
                    ? "bg-accent text-accent-foreground ring-2 ring-primary"
                    : isHighlighted(day)
                    ? "bg-gray-200 dark:bg-gray-700 text-foreground"
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

interface DayPanelProps {
  date: UTCDate;
  notes: Note[];
  alarmOccurrences: { alarm: Alarm; dayOfWeek: number }[];
  onDeleteNote: (id: string) => void;
  onDeleteAlarmOccurrence: (alarmId: string, dayOfWeek: number) => void;
  onAddNote: () => void;
  onClose: () => void;
}

function DayPanel({ date, notes, alarmOccurrences, onDeleteNote, onDeleteAlarmOccurrence, onAddNote, onClose }: DayPanelProps) {
  const dateStr = `${MONTH_NAMES[date.month]} ${date.day}, ${date.year}`;
  const dayOfWeek = getUTCDayOfWeek(date);
  const dayName = DAY_NAMES[dayOfWeek];

  return (
    <Card className="p-4" data-testid="day-panel">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold" data-testid="panel-date">
            {dateStr} (UTC)
          </h3>
          <p className="text-sm text-muted-foreground">{dayName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onAddNote} data-testid="button-add-note">
            <Plus className="w-4 h-4 mr-1" />
            Add Note
          </Button>
          <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-panel">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {notes.length === 0 && alarmOccurrences.length === 0 && (
        <p className="text-muted-foreground text-sm" data-testid="panel-empty">
          No notes or alarms for this day.
        </p>
      )}

      {notes.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">Notes</h4>
          <div className="space-y-2">
            {notes.map((note) => {
              const { hour, minute } = parseTimeUTC(note.timeUTC);
              const localTime = utcTimeToLocal(date, hour, minute);
              return (
                <div
                  key={note.id}
                  className="p-3 bg-muted rounded-md"
                  data-testid={`note-${note.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{note.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {note.timeUTC} UTC / {localTime} local
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0"
                      onClick={() => onDeleteNote(note.id)}
                      data-testid={`button-delete-note-${note.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {alarmOccurrences.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">Alarms</h4>
          <div className="space-y-2">
            {alarmOccurrences.map(({ alarm, dayOfWeek: dow }) => {
              const timeUTC = `${String(alarm.hourUTC).padStart(2, "0")}:${String(alarm.minuteUTC).padStart(2, "0")}`;
              const localTime = utcTimeToLocal(date, alarm.hourUTC, alarm.minuteUTC);
              return (
                <div
                  key={`${alarm.id}-${dow}`}
                  className="p-3 bg-muted rounded-md flex items-center justify-between gap-2"
                  data-testid={`alarm-occurrence-${alarm.id}`}
                >
                  <div>
                    <p className="text-sm font-medium">{alarm.label || "Alarm"}</p>
                    <p className="text-xs text-muted-foreground">
                      {timeUTC} UTC / {localTime} local
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDeleteAlarmOccurrence(alarm.id, dow)}
                    data-testid={`button-delete-alarm-${alarm.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

interface AddNoteDialogProps {
  open: boolean;
  date: UTCDate;
  onClose: () => void;
  onSave: (text: string, timeUTC: string) => void;
}

function AddNoteDialog({ open, date, onClose, onSave }: AddNoteDialogProps) {
  const [text, setText] = useState("");
  const [time, setTime] = useState("12:00");

  const handleSave = () => {
    if (text.trim()) {
      onSave(text.trim(), time);
      setText("");
      setTime("12:00");
      onClose();
    }
  };

  const dateStr = `${MONTH_NAMES[date.month]} ${date.day}, ${date.year}`;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
          <DialogDescription>
            Add a note for {dateStr} (UTC)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="note-time">Time (UTC)</Label>
            <Input
              id="note-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              data-testid="input-note-time"
            />
          </div>
          <div>
            <Label htmlFor="note-text">Note</Label>
            <Textarea
              id="note-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your note..."
              rows={4}
              data-testid="input-note-text"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} data-testid="button-cancel-note">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!text.trim()} data-testid="button-save-note">
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Calendar() {
  const { toast } = useToast();
  const today = useMemo(() => getUTCToday(), []);
  const [viewYear, setViewYear] = useState(today.year);
  const [selectedDate, setSelectedDate] = useState<UTCDate | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);

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
      if (!alarm.isEnabled) return;
      
      alarm.repeatDays.forEach((dow) => {
        for (let m = 0; m < 12; m++) {
          const daysInMonth = getDaysInMonth(viewYear, m);
          for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(Date.UTC(viewYear, m, d));
            if (date.getUTCDay() === dow) {
              dates.add(formatDateUTC({ year: viewYear, month: m, day: d }));
            }
          }
        }
      });
    });

    return dates;
  }, [notes, alarms, viewYear]);

  const selectedDateNotes = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = formatDateUTC(selectedDate);
    return notes.filter((n) => n.dateUTC === dateStr);
  }, [notes, selectedDate]);

  const selectedDateAlarms = useMemo(() => {
    if (!selectedDate) return [];
    const dow = getUTCDayOfWeek(selectedDate);
    return alarms
      .filter((a) => a.isEnabled && a.repeatDays.includes(dow))
      .map((a) => ({ alarm: a, dayOfWeek: dow }));
  }, [alarms, selectedDate]);

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id);
    await loadData();
    toast({ title: "Note deleted" });
  };

  const handleDeleteAlarmOccurrence = async (alarmId: string, dayOfWeek: number) => {
    const alarm = alarms.find((a) => a.id === alarmId);
    if (!alarm) return;

    const newRepeatDays = alarm.repeatDays.filter((d) => d !== dayOfWeek);
    
    if (newRepeatDays.length === 0) {
      await deleteAlarm(alarmId);
      toast({ title: "Alarm deleted", description: "No remaining days, alarm removed." });
    } else {
      await updateAlarm({ ...alarm, repeatDays: newRepeatDays });
      toast({ title: "Alarm updated", description: `Removed ${DAY_NAMES[dayOfWeek]} from alarm.` });
    }
    
    await loadData();
  };

  const handleAddNote = async (text: string, timeUTC: string) => {
    if (!selectedDate) return;
    const dateUTC = formatDateUTC(selectedDate);
    const createdAt = new Date().toISOString();
    await createNote({ dateUTC, timeUTC, text, createdAt });
    await loadData();
    toast({ title: "Note added" });
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
        All dates are in UTC+00:00. <span className="inline-block w-3 h-3 bg-blue-500 rounded-sm align-middle mx-1"></span> Today <span className="inline-block w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-sm align-middle mx-1"></span> Has notes/alarms
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6" data-testid="yearly-grid">
        {months.map((month) => (
          <MonthGrid
            key={month}
            year={viewYear}
            month={month}
            today={today}
            selectedDate={selectedDate}
            highlightedDates={highlightedDates}
            onSelectDate={setSelectedDate}
          />
        ))}
      </div>

      {selectedDate && (
        <div className="mt-6">
          <DayPanel
            date={selectedDate}
            notes={selectedDateNotes}
            alarmOccurrences={selectedDateAlarms}
            onDeleteNote={handleDeleteNote}
            onDeleteAlarmOccurrence={handleDeleteAlarmOccurrence}
            onAddNote={() => setShowAddNote(true)}
            onClose={() => setSelectedDate(null)}
          />
        </div>
      )}

      {selectedDate && (
        <AddNoteDialog
          open={showAddNote}
          date={selectedDate}
          onClose={() => setShowAddNote(false)}
          onSave={handleAddNote}
        />
      )}
    </div>
  );
}
