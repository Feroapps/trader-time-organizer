import { useEffect, useState } from "react";
import { UtcRuler, LocalTimeRuler, type AlertMarker } from "@/components";
import { getAlarms, seedFixedAlarms } from "@/storage/alarmsRepo";
import type { Alarm } from "@/types";

export function Home() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  useEffect(() => {
    async function initializeAlarms() {
      await seedFixedAlarms();
      const allAlarms = await getAlarms();
      console.log("[Alarms] Loaded alarms:", allAlarms);
      setAlarms(allAlarms);
    }

    initializeAlarms();
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
        <div className="mt-8 p-4 bg-muted rounded-md" data-testid="alarms-debug">
          <p className="text-sm text-muted-foreground">
            {alarms.length} alarm(s) loaded ({alarms.filter(a => a.isFixed).length} fixed)
          </p>
        </div>
      )}
    </div>
  );
}
