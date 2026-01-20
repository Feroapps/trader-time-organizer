import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, Link } from "wouter";
import { ChevronLeft, Plus, Bell, StickyNote, Trash2 } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getNotes, createNote, deleteNote } from "@/storage/notesRepo";
import { getAlarms, createAlarm, updateAlarm, deleteAlarm } from "@/storage/alarmsRepo";
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

interface AddAlertDialogProps {
  open: boolean;
  date: UTCDate;
  dayOfWeek: number;
  onClose: () => void;
  onSave: (data: CreateAlarmInput) => void;
}

function AddAlertDialog({ open, date, dayOfWeek, onClose, onSave }: AddAlertDialogProps) {
  const [label, setLabel] = useState("");
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");

  const handleSave = () => {
    const alertData: CreateAlarmInput = {
      label: label.trim() || "Alert",
      hourUTC: parseInt(hour, 10),
      minuteUTC: parseInt(minute, 10),
      repeatDays: [dayOfWeek],
      isEnabled: true,
      isFixed: false,
      duration: 10,
    };
    onSave(alertData);
    setLabel("");
    setHour("12");
    setMinute("00");
    onClose();
  };

  const dateStr = `${MONTH_NAMES[date.month]} ${date.day}, ${date.year}`;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Alert</DialogTitle>
          <DialogDescription>
            Add an alert for {DAY_NAMES[dayOfWeek]}s at a specific time (UTC)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="alert-label">Label (optional)</Label>
            <Input
              id="alert-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Alert name..."
              data-testid="input-alert-label"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="alert-hour">Hour (UTC)</Label>
              <Select value={hour} onValueChange={setHour}>
                <SelectTrigger data-testid="select-alert-hour">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {String(i).padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="alert-minute">Minute</Label>
              <Select value={minute} onValueChange={setMinute}>
                <SelectTrigger data-testid="select-alert-minute">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["00", "15", "30", "45"].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} data-testid="button-cancel-alert">
              Cancel
            </Button>
            <Button onClick={handleSave} data-testid="button-save-alert">
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
  const { toast } = useToast();
  const [utcTime, setUtcTime] = useState(getUTCTime);
  const [notes, setNotes] = useState<Note[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showAddAlert, setShowAddAlert] = useState(false);

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

  const dayNotes = notes.filter((n) => n.dateUTC === dateStr);
  const dayAlarms = alarms.filter((a) => a.isEnabled && a.repeatDays.includes(dayOfWeek));

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

  const handleAddAlert = async (data: CreateAlarmInput) => {
    await createAlarm(data);
    await loadData();
    toast({ title: "Alert added" });
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id);
    await loadData();
    toast({ title: "Note deleted" });
  };

  const handleDeleteAlarm = async (alarmId: string) => {
    const alarm = alarms.find((a) => a.id === alarmId);
    if (!alarm) return;

    const newRepeatDays = alarm.repeatDays.filter((d) => d !== dayOfWeek);
    if (newRepeatDays.length === 0) {
      await deleteAlarm(alarmId);
      toast({ title: "Alert deleted" });
    } else {
      await updateAlarm({ ...alarm, repeatDays: newRepeatDays });
      toast({ title: "Alert updated", description: `Removed ${DAY_NAMES[dayOfWeek]} from alert.` });
    }
    await loadData();
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8" data-testid="day-view">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/calendar">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-date-title">
              {displayDate}
            </h1>
            <p className="text-sm text-muted-foreground" data-testid="text-day-name">
              {DAY_NAMES[dayOfWeek]} (UTC)
            </p>
          </div>
        </div>
        <div className="font-mono text-xl tabular-nums" data-testid="text-current-time">
          {formatTime(utcTime.hours, utcTime.minutes, utcTime.seconds)} UTC
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <Button onClick={() => setShowAddNote(true)} data-testid="button-add-note">
          <StickyNote className="w-4 h-4 mr-2" />
          Add Note
        </Button>
        <Button variant="outline" onClick={() => setShowAddAlert(true)} data-testid="button-add-alert">
          <Bell className="w-4 h-4 mr-2" />
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
                      onClick={() => handleDeleteAlarm(alarm.id)}
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

      <AddAlertDialog
        open={showAddAlert}
        date={date}
        dayOfWeek={dayOfWeek}
        onClose={() => setShowAddAlert(false)}
        onSave={handleAddAlert}
      />
    </div>
  );
}
