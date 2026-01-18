import { useState, useEffect } from "react";
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
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={23}
                value={hour}
                onChange={(e) => setHour(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                className="w-20 font-mono text-center"
                data-testid="input-alert-hour"
              />
              <span className="text-lg font-mono">:</span>
              <Input
                type="number"
                min={0}
                max={59}
                value={minute}
                onChange={(e) => setMinute(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                className="w-20 font-mono text-center"
                data-testid="input-alert-minute"
              />
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
