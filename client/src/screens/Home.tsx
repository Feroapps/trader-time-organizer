import { useEffect, useState } from "react";
import { UtcRuler, LocalTimeRuler, type AlertMarker } from "@/components";
import { getAlarms, createAlarm, toggleAlarm } from "@/storage/alarmsRepo";
import type { Alarm } from "@/types";

export function Home() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  useEffect(() => {
    async function testAlarmsStorage() {
      let currentAlarms = await getAlarms();
      console.log("[Alarms] Initial alarms:", currentAlarms);

      if (currentAlarms.length === 0) {
        const newAlarm = await createAlarm({
          hourUTC: 14,
          minuteUTC: 30,
          repeatDays: [1, 2, 3, 4, 5],
          label: "Test Alarm",
          isEnabled: true,
          isFixed: false,
        });
        console.log("[Alarms] Created alarm:", newAlarm);

        currentAlarms = await getAlarms();
        console.log("[Alarms] After create:", currentAlarms);
      }

      if (currentAlarms.length > 0) {
        const toggled = await toggleAlarm(currentAlarms[0].id, !currentAlarms[0].isEnabled);
        console.log("[Alarms] Toggled alarm:", toggled);
      }

      const finalAlarms = await getAlarms();
      console.log("[Alarms] Final alarms:", finalAlarms);
      setAlarms(finalAlarms);
    }

    testAlarmsStorage();
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
          <p className="text-sm text-muted-foreground mb-2">
            Debug: {alarms.length} alarm(s) in storage (check console for CRUD logs)
          </p>
        </div>
      )}
    </div>
  );
}
