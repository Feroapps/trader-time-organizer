import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Bell, Clock, X } from "lucide-react";
import { getAlarms } from "@/storage/alarmsRepo";
import { stopCurrentAlarmNative, isAndroidNative, scheduleUserAlarmNative } from "@/utils/userAlarmPlugin";
import { scheduleAlarmNotification, cancelAlarmNotification } from "@/utils/nativeNotifications";
import { migrateSoundId } from "@/utils/soundLibrary";
import type { Alarm } from "@/types/Alarm";
import { DEFAULT_SNOOZE_MINUTES } from "@/types/Alarm";

export function AlarmRinging() {
  const [, setLocation] = useLocation();
  const [alarm, setAlarm] = useState<Alarm | null>(null);
  const [alarmId, setAlarmId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("alarmId");
    
    if (id) {
      setAlarmId(id);
      loadAlarm(id);
    }
  }, []);

  async function loadAlarm(id: string) {
    const alarms = await getAlarms();
    const found = alarms.find((a) => a.id === id);
    if (found) {
      setAlarm(found);
    }
  }

  async function handleStop() {
    if (alarmId) {
      await stopCurrentAlarmNative();
      
      if (alarm && !alarm.isFixed) {
        if (alarm.repeatWeekly || alarm.repeatMonthly) {
          await scheduleAlarmNotification(alarm);
        }
      }
    }
    setLocation("/");
  }

  async function handleSnooze() {
    if (!alarmId || !alarm) {
      setLocation("/");
      return;
    }

    await stopCurrentAlarmNative();

    const snoozeMs = (alarm.snoozeMinutes ?? DEFAULT_SNOOZE_MINUTES) * 60 * 1000;
    const nextTrigger = new Date(Date.now() + snoozeMs);
    const snoozeId = `${alarm.id}_snooze`;

    if (isAndroidNative()) {
      const soundId = migrateSoundId(alarm.soundId);
      await scheduleUserAlarmNative(
        snoozeId,
        alarm.label + " (Snoozed)",
        nextTrigger,
        alarm.snoozeMinutes ?? DEFAULT_SNOOZE_MINUTES,
        soundId
      );
    } else {
      const snoozeAlarm: Alarm = {
        ...alarm,
        id: snoozeId,
        dateUTC: nextTrigger.toISOString().split("T")[0],
        hourUTC: nextTrigger.getUTCHours(),
        minuteUTC: nextTrigger.getUTCMinutes(),
        repeatWeekly: false,
        repeatMonthly: false,
      };
      await scheduleAlarmNotification(snoozeAlarm);
    }
    
    if (alarm.repeatWeekly || alarm.repeatMonthly) {
      await scheduleAlarmNotification(alarm);
    }
    
    setLocation("/");
  }

  const snoozeMinutes = alarm?.snoozeMinutes ?? DEFAULT_SNOOZE_MINUTES;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
      <div className="flex flex-col items-center gap-8 max-w-sm w-full">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <Bell className="w-12 h-12 text-primary" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold" data-testid="text-alarm-label">
            {alarm?.label || "Alert"}
          </h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            {alarm ? `${alarm.hourUTC.toString().padStart(2, "0")}:${alarm.minuteUTC.toString().padStart(2, "0")} UTC` : ""}
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <Button
            size="lg"
            variant="destructive"
            className="w-full text-lg"
            onClick={handleStop}
            data-testid="button-stop-alarm"
          >
            <X className="w-5 h-5 mr-2" />
            Stop
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            className="w-full text-lg"
            onClick={handleSnooze}
            data-testid="button-snooze-alarm"
          >
            <Clock className="w-5 h-5 mr-2" />
            Snooze ({snoozeMinutes} min)
          </Button>
        </div>
      </div>
    </div>
  );
}
