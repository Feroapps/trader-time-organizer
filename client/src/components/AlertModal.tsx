import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Alarm, CreateAlarmInput } from "@/types";

interface AlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (alert: CreateAlarmInput) => void;
  editingAlert?: Alarm | null;
}

function formatDateUTC(date: Date): string {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateUTC(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date;
}

function formatDisplayDate(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return `${days[date.getUTCDay()]}, ${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function AlertModal({ open, onOpenChange, onSave, editingAlert }: AlertModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatMonthly, setRepeatMonthly] = useState(false);
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (open) {
      if (editingAlert) {
        setSelectedDate(editingAlert.dateUTC ? parseDateUTC(editingAlert.dateUTC) : new Date());
        setHour(editingAlert.hourUTC);
        setMinute(editingAlert.minuteUTC);
        setRepeatWeekly(editingAlert.repeatWeekly ?? false);
        setRepeatMonthly(editingAlert.repeatMonthly ?? false);
        setLabel(editingAlert.label);
      } else {
        const now = new Date();
        setSelectedDate(now);
        setHour(now.getUTCHours());
        setMinute(now.getUTCMinutes());
        setRepeatWeekly(false);
        setRepeatMonthly(false);
        setLabel("");
      }
    }
  }, [open, editingAlert]);

  function handleSave() {
    const dateStr = formatDateUTC(selectedDate);
    const alertData: CreateAlarmInput = {
      dateUTC: dateStr,
      hourUTC: hour,
      minuteUTC: minute,
      repeatWeekly,
      repeatMonthly,
      repeatDays: [],
      isEnabled: true,
      label: label.trim() || `Alert ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} UTC`,
      isFixed: false,
      duration: 5,
    };
    onSave(alertData);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" data-testid="alert-modal">
        <DialogHeader>
          <DialogTitle data-testid="text-modal-title">
            {editingAlert ? "Edit Alert" : "Add Alert"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Label (optional)</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="My Alert"
              data-testid="input-alert-label"
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  data-testid="button-date-picker"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDisplayDate(selectedDate)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  data-testid="calendar-picker"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Time (UTC)</Label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="flex flex-col">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-8"
                    onClick={() => setHour((h) => (h >= 23 ? 0 : h + 1))}
                    data-testid="button-hour-up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-8"
                    onClick={() => setHour((h) => (h <= 0 ? 23 : h - 1))}
                    data-testid="button-hour-down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={hour.toString().padStart(2, "0")}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      setHour(Math.max(0, Math.min(23, val)));
                    } else if (e.target.value === "") {
                      setHour(0);
                    }
                  }}
                  className="w-14 font-mono text-center text-lg"
                  data-testid="input-alert-hour"
                />
              </div>
              <span className="text-xl font-mono">:</span>
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={minute.toString().padStart(2, "0")}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      setMinute(Math.max(0, Math.min(59, val)));
                    } else if (e.target.value === "") {
                      setMinute(0);
                    }
                  }}
                  className="w-14 font-mono text-center text-lg"
                  data-testid="input-alert-minute"
                />
                <div className="flex flex-col">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-8"
                    onClick={() => setMinute((m) => (m >= 59 ? 0 : m + 1))}
                    data-testid="button-minute-up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-8"
                    onClick={() => setMinute((m) => (m <= 0 ? 59 : m - 1))}
                    data-testid="button-minute-down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">UTC</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Repeat</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={repeatWeekly}
                  onCheckedChange={(checked) => setRepeatWeekly(checked === true)}
                  data-testid="checkbox-repeat-weekly"
                />
                <span className="text-sm">Repeat weekly (every {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][selectedDate.getUTCDay()]})</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={repeatMonthly}
                  onCheckedChange={(checked) => setRepeatMonthly(checked === true)}
                  data-testid="checkbox-repeat-monthly"
                />
                <span className="text-sm">Repeat monthly (every {selectedDate.getUTCDate()}{getOrdinalSuffix(selectedDate.getUTCDate())})</span>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-alert"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            data-testid="button-save-alert"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
