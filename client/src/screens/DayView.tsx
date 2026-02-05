import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, Link, useLocation } from "wouter";
import { ChevronLeft, ChevronRight, Plus, Bell, StickyNote, Trash2 } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getNotes, createNote, deleteNote } from "@/storage/notesRepo";
import { getAlarms, createAlarm, deleteAlarm } from "@/storage/alarmsRepo";
import { AlertModal } from "@/components/AlertModal";
import { AdRequiredModal } from "@/components/AdRequiredModal";
import { showRewardedAd } from "@/utils/adService";
import type { Note, Alarm, CreateAlarmInput } from "@/types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface UTCDate {
  year: number;
  month: number;
  day: number;
}

function parseRouteDate(dateStr: string): UTCDate | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, yearStr, monthStr, dayStr] = match;
  return {
    year: parseInt(yearStr, 10),
    month: parseInt(monthStr, 10) - 1,
    day: parseInt(dayStr, 10),
  };
}

function formatDateUTC(date: UTCDate): string {
  return `${date.year}-${String(date.month + 1).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

function getUTCDayOfWeek(date: UTCDate): number {
  return new Date(Date.UTC(date.year, date.month, date.day)).getUTCDay();
}

function getUTCTime(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  return {
    hours: now.getUTCHours(),
    minutes: now.getUTCMinutes(),
    seconds: now.getUTCSeconds(),
  };
}

function formatTime(h: number, m: number, s: number): string {
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function utcTimeToLocal(date: UTCDate, hourUTC: number, minuteUTC: number): string {
  const utcDate = new Date(Date.UTC(date.year, date.month, date.day, hourUTC, minuteUTC));
  return utcDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function parseTimeUTC(timeUTC: string): { hour: number; minute: number } {
  const [h, m] = timeUTC.split(":").map(Number);
  return { hour: h, minute: m };
}

function getPrevDay(date: UTCDate): UTCDate {
  const d = new Date(Date.UTC(date.year, date.month, date.day - 1));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    day: d.getUTCDate(),
  };
}

function getNextDay(date: UTCDate): UTCDate {
  const d = new Date(Date.UTC(date.year, date.month, date.day + 1));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    day: d.getUTCDate(),
  };
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
          <DialogDescription>Add a note for {dateStr} (UTC)</DialogDescription>
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


export function DayView() {
  const params = useParams<{ date: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [utcTime, setUtcTime] = useState(getUTCTime);
  const [notes, setNotes] = useState<Note[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  const date = useMemo(() => parseRouteDate(params.date || ""), [params.date]);

  const loadData = useCallback(async () => {
    const [loadedNotes, loadedAlarms] = await Promise.all([getNotes(), getAlarms()]);
    setNotes(loadedNotes);
    setAlarms(loadedAlarms.filter((a) => !a.isFixed));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setUtcTime(getUTCTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!date) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-8">
        <p className="text-destructive">Invalid date format</p>
        <Link href="/calendar">
          <Button variant="outline" className="mt-4">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Calendar
          </Button>
        </Link>
      </div>
    );
  }

  const dayOfWeek = getUTCDayOfWeek(date);
  const dateStr = formatDateUTC(date);
  const displayDate = `${MONTH_NAMES[date.month]} ${date.day}, ${date.year}`;

  const goToPrevDay = () => {
    const prev = getPrevDay(date);
    setLocation(`/calendar/day/${formatDateUTC(prev)}`);
  };

  const goToNextDay = () => {
    const next = getNextDay(date);
    setLocation(`/calendar/day/${formatDateUTC(next)}`);
  };

  const dayNotes = notes.filter((n) => n.dateUTC === dateStr);
  const dayAlarms = alarms.filter((a) => {
    const [year, month, day] = a.dateUTC.split("-").map(Number);
    const alarmDate = new Date(Date.UTC(year, month - 1, day));
    const alarmDow = alarmDate.getUTCDay();
    const alarmDayOfMonth = day;
    
    if (a.repeatWeekly && alarmDow === dayOfWeek) {
      return true;
    }
    if (a.repeatMonthly && alarmDayOfMonth === date.day) {
      return true;
    }
    if (!a.repeatWeekly && !a.repeatMonthly && a.dateUTC === dateStr) {
      return true;
    }
    return false;
  });

  const notesByHour: Record<number, Note[]> = {};
  dayNotes.forEach((note) => {
    const { hour } = parseTimeUTC(note.timeUTC);
    if (!notesByHour[hour]) notesByHour[hour] = [];
    notesByHour[hour].push(note);
  });

  const alarmsByHour: Record<number, Alarm[]> = {};
  dayAlarms.forEach((alarm) => {
    const hour = alarm.hourUTC;
    if (!alarmsByHour[hour]) alarmsByHour[hour] = [];
    alarmsByHour[hour].push(alarm);
  });

  const handleAddNote = async (text: string, timeUTC: string) => {
    const createdAt = new Date().toISOString();
    await createNote({ dateUTC: dateStr, timeUTC, text, createdAt });
    await loadData();
    toast({ title: "Note added" });
  };

  const handleAlertSave = async (data: CreateAlarmInput) => {
    await createAlarm(data);
    await loadData();
    toast({ title: "Alert saved" });
    setSupportModalOpen(true);
  };

  async function handleSupportContinue() {
    const rewarded = await showRewardedAd();
    if (rewarded) {
      toast({ title: "Thank you!", description: "Your support helps keep the app free." });
    }
  }

  function handleSupportCancel() {
  }

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id);
    await loadData();
    toast({ title: "Note deleted" });
  };

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [alarmToDelete, setAlarmToDelete] = useState<string | null>(null);

  const requestDeleteAlarm = (alarmId: string) => {
    setAlarmToDelete(alarmId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteAlarm = async () => {
    if (alarmToDelete) {
      await deleteAlarm(alarmToDelete);
      await loadData();
      toast({ title: "Alert deleted" });
      setAlarmToDelete(null);
    }
    setDeleteConfirmOpen(false);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8" data-testid="day-view">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <Link href="/calendar">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
              data-testid="button-back"
            >
              <ChevronLeft className="w-4 h-4" />
              Calendar
            </Button>
          </Link>
          <div className="font-mono text-lg sm:text-xl tabular-nums" data-testid="text-current-time">
            {formatTime(utcTime.hours, utcTime.minutes, utcTime.seconds)} UTC
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <Button variant="outline" size="icon" onClick={goToPrevDay} data-testid="button-prev-day">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center min-w-[180px] sm:min-w-[220px]">
            <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-date-title">
              {displayDate}
            </h1>
            <p className="text-sm text-muted-foreground" data-testid="text-day-name">
              {DAY_NAMES[dayOfWeek]} (UTC)
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={goToNextDay} data-testid="button-next-day">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <Button onClick={() => setShowAddNote(true)} data-testid="button-add-note">
          <StickyNote className="w-4 h-4 mr-2" />
          Add Note
        </Button>
        <Button onClick={() => setShowAddAlert(true)} data-testid="button-add-alert">
          <Plus className="w-4 h-4 mr-2" />
          Add Alert
        </Button>
      </div>

      <Card className="p-0 overflow-hidden" data-testid="hourly-timeline">
        {hours.map((hour) => {
          const hourNotes = notesByHour[hour] || [];
          const hourAlarms = alarmsByHour[hour] || [];
          const hasContent = hourNotes.length > 0 || hourAlarms.length > 0;

          return (
            <div
              key={hour}
              className={`flex border-b last:border-b-0 ${hasContent ? "bg-muted/30" : ""}`}
              data-testid={`hour-row-${hour}`}
            >
              <div className="w-16 sm:w-20 shrink-0 py-3 px-2 text-right font-mono text-sm text-muted-foreground border-r">
                {String(hour).padStart(2, "0")}:00
              </div>
              <div className="flex-1 py-2 px-3 min-h-[48px]">
                {hourNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start justify-between gap-2 py-1 px-2 mb-1 rounded bg-blue-100 dark:bg-blue-900/40 text-sm"
                    data-testid={`note-${note.id}`}
                  >
                    <div className="flex items-start gap-2">
                      <StickyNote className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <div>
                        <p className="whitespace-pre-wrap">{note.text}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {note.timeUTC} UTC / {utcTimeToLocal(date, parseTimeUTC(note.timeUTC).hour, parseTimeUTC(note.timeUTC).minute)} local
                        </p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0 h-7 w-7"
                      onClick={() => handleDeleteNote(note.id)}
                      data-testid={`button-delete-note-${note.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
                {hourAlarms.map((alarm) => (
                  <div
                    key={alarm.id}
                    className="flex items-center justify-between gap-2 py-1 px-2 mb-1 rounded bg-amber-100 dark:bg-amber-900/40 text-sm"
                    data-testid={`alarm-${alarm.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <span className="font-medium">{alarm.label || "Alert"}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {String(alarm.hourUTC).padStart(2, "0")}:{String(alarm.minuteUTC).padStart(2, "0")} UTC
                        </span>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0 h-7 w-7"
                      onClick={() => requestDeleteAlarm(alarm.id)}
                      data-testid={`button-delete-alarm-${alarm.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </Card>

      <AddNoteDialog
        open={showAddNote}
        date={date}
        onClose={() => setShowAddNote(false)}
        onSave={handleAddNote}
      />

      <AlertModal
        open={showAddAlert}
        onOpenChange={setShowAddAlert}
        onSave={handleAlertSave}
      />

      <AdRequiredModal
        open={supportModalOpen}
        onOpenChange={setSupportModalOpen}
        title="Alert saved successfully"
        message="If you'd like to support the development of Trader Time Organizer, you can watch a short ad. Watching the ad is optional and won't affect your alerts."
        onContinue={handleSupportContinue}
        onCancel={handleSupportCancel}
        continueLabel="Support & Watch"
        cancelLabel="Not now"
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this alert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-alarm">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAlarm} data-testid="button-confirm-delete-alarm">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
