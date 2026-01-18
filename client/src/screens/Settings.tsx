import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { getAlarms, toggleAlarm } from "@/storage/alarmsRepo";
import type { Alarm } from "@/types";

function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} UTC`;
}

function formatDays(days: number[]): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (days.length === 5 && !days.includes(0) && !days.includes(6)) {
    return 'Mon-Fri';
  }
  if (days.length === 1 && days[0] === 0) {
    return 'Sun only';
  }
  return days.map(d => dayNames[d]).join(', ');
}

function AlarmRow({ alarm, onToggle }: { alarm: Alarm; onToggle: (enabled: boolean) => void }) {
  return (
    <div
      className="flex items-center justify-between p-3 bg-muted rounded-md"
      data-testid={`alarm-row-${alarm.id}`}
    >
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${!alarm.isEnabled ? 'text-muted-foreground' : ''}`}>
          {alarm.label}
        </p>
        <p className="text-sm text-muted-foreground font-mono">
          {formatTime(alarm.hourUTC, alarm.minuteUTC)} · {formatDays(alarm.repeatDays)}
        </p>
      </div>
      <Switch
        checked={alarm.isEnabled}
        onCheckedChange={onToggle}
        data-testid={`switch-alarm-${alarm.id}`}
      />
    </div>
  );
}

export function Settings() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      loadAlarms();
    }
  }, [open]);

  async function loadAlarms() {
    const allAlarms = await getAlarms();
    setAlarms(allAlarms.filter(a => a.isFixed));
  }

  async function handleToggle(alarmId: string, enabled: boolean) {
    await toggleAlarm(alarmId, enabled);
    await loadAlarms();
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold" data-testid="text-page-title">Settings</h1>
      <p className="text-muted-foreground mt-2" data-testid="text-page-description">
        Manage your preferences
      </p>

      <div className="mt-8">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" data-testid="button-manage-alarms">
              Manage Fixed Alarms
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Fixed Alarms</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 mt-4">
              {alarms.length === 0 ? (
                <p className="text-muted-foreground text-sm">Loading alarms...</p>
              ) : (
                alarms.map((alarm) => (
                  <AlarmRow
                    key={alarm.id}
                    alarm={alarm}
                    onToggle={(enabled) => handleToggle(alarm.id, enabled)}
                  />
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
