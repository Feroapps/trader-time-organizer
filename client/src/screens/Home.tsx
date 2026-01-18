import { useEffect, useState } from "react";
import { UtcRuler, LocalTimeRuler, type AlertMarker } from "@/components";
import { getAlarms, seedFixedAlarms, clearAllAlarms, toggleAlarm } from "@/storage/alarmsRepo";
import { startScheduler, stopScheduler } from "@/utils/alarmScheduler";
import { Switch } from "@/components/ui/switch";
import type { Alarm } from "@/types";

const RESEED_VERSION = 2; // Increment this to force reseed

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

export function Home() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  useEffect(() => {
    async function initializeAlarms() {
      const lastVersion = localStorage.getItem("alarms_seed_version");
      
      if (lastVersion !== String(RESEED_VERSION)) {
        await clearAllAlarms();
        localStorage.setItem("alarms_seed_version", String(RESEED_VERSION));
      }
      
      await seedFixedAlarms();
      const allAlarms = await getAlarms();
      setAlarms(allAlarms);
      
      startScheduler();
    }

    initializeAlarms();

    async function verifyAudioFile() {
      try {
        const testAudio = new Audio('/alarm.mp3');
        testAudio.load();
        testAudio.addEventListener('error', (e) => {
          console.error("[Audio] Load failed:", e);
        });
      } catch (err) {
        console.error("[Audio] Error:", err);
      }
    }
    
    verifyAudioFile();
    
    return () => {
      stopScheduler();
    };
  }, []);

  const utcAlerts: AlertMarker[] = alarms.map((alarm) => ({
    id: alarm.id,
    label: alarm.label,
    utcHour: alarm.hourUTC,
    utcMinute: alarm.minuteUTC,
    enabled: alarm.isEnabled,
  }));

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          Trader Time Organizer
        </h1>
        <p className="text-muted-foreground mt-2" data-testid="text-page-description">
          Manage your trading schedule across global time zones
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <LocalTimeRuler />
        </section>
        <section>
          <UtcRuler alerts={utcAlerts} />
        </section>
      </div>

      {alarms.length > 0 && (
        <div className="mt-8" data-testid="alarms-section">
          <h2 className="text-lg font-semibold mb-4">Fixed Alarms</h2>
          <div className="space-y-2">
            {alarms.filter(a => a.isFixed).map((alarm) => (
              <AlarmRow
                key={alarm.id}
                alarm={alarm}
                onToggle={async (enabled) => {
                  await toggleAlarm(alarm.id, enabled);
                  const updated = await getAlarms();
                  setAlarms(updated);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
