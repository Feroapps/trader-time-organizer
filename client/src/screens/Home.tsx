import { useEffect, useState } from "react";
import { UtcRuler, LocalTimeRuler, type AlertMarker } from "@/components";
import { getAlarms, seedFixedAlarms, clearAllAlarms } from "@/storage/alarmsRepo";
import { startScheduler, stopScheduler } from "@/utils/alarmScheduler";
import type { Alarm } from "@/types";

const RESEED_VERSION = 2; // Increment this to force reseed

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

    </div>
  );
}
