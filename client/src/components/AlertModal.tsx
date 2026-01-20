import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { Alarm, CreateAlarmInput } from "@/types";

interface AlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (alert: CreateAlarmInput) => void;
  editingAlert?: Alarm | null;
}

const DAY_LABELS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

export function AlertModal({ open, onOpenChange, onSave, editingAlert }: AlertModalProps) {
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);
  const [repeatDays, setRepeatDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [label, setLabel] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    if (open) {
      if (editingAlert) {
        setHour(editingAlert.hourUTC);
        setMinute(editingAlert.minuteUTC);
        setRepeatDays([...editingAlert.repeatDays]);
        setLabel(editingAlert.label);
        setIsEnabled(editingAlert.isEnabled);
      } else {
        setHour(0);
        setMinute(0);
        setRepeatDays([0, 1, 2, 3, 4, 5, 6]);
        setLabel("");
        setIsEnabled(true);
      }
    }
  }, [open, editingAlert]);

  function handleDayToggle(day: number) {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  function handleSave() {
    const alertData: CreateAlarmInput = {
      hourUTC: hour,
      minuteUTC: minute,
      repeatDays,
      label: label.trim() || `Alert ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} UTC`,
      isEnabled,
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

          <div className="space-y-2">
            <Label>Repeat Days</Label>
            <div className="flex flex-wrap gap-2">
              {DAY_LABELS.map(({ value, label: dayLabel }) => (
                <label
                  key={value}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <Checkbox
                    checked={repeatDays.includes(value)}
                    onCheckedChange={() => handleDayToggle(value)}
                    data-testid={`checkbox-day-${value}`}
                  />
                  <span className="text-sm">{dayLabel}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>Enabled</Label>
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              data-testid="switch-alert-enabled"
            />
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
            disabled={repeatDays.length === 0}
            data-testid="button-save-alert"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
