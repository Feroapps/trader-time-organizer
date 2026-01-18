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
        console.log("[Alarms] New seed version detected, clearing storage...");
        await clearAllAlarms();
        localStorage.setItem("alarms_seed_version", String(RESEED_VERSION));
      }
      
      await seedFixedAlarms();
      const allAlarms = await getAlarms();
      console.log("[Alarms] Final fixed alarms:", allAlarms);
      setAlarms(allAlarms);
      
      startScheduler();
    }

    initializeAlarms();

    async function verifyAudioFile() {
      const audioUrl = `${window.location.origin}/alarm.mp3`;
      console.log("=== AUDIO DIAGNOSTIC REPORT ===");
      console.log("[Audio] URL:", audioUrl);
      
      try {
        const response = await fetch('/alarm.mp3', { method: 'HEAD' });
        console.log("[Audio] HTTP Status:", response.status);
        console.log("[Audio] Content-Type:", response.headers.get('Content-Type'));
        console.log("[Audio] Content-Length:", response.headers.get('Content-Length'));
        
        if (response.headers.get('Content-Type')?.includes('audio')) {
          console.log("[Audio] File verification: PASSED (audio MIME type confirmed)");
        } else {
          console.error("[Audio] File verification: FAILED (unexpected Content-Type)");
        }
      } catch (err) {
        console.error("[Audio] Fetch failed:", err);
      }
      
      const testAudio = new Audio('/alarm.mp3');
      testAudio.load();
      testAudio.addEventListener('canplaythrough', () => {
        console.log("[Audio] Load test: SUCCESS - audio file loaded correctly");
        console.log("ALARM AUDIO READY AT /alarm.mp3");
        console.log("=== END DIAGNOSTIC REPORT ===");
      });
      testAudio.addEventListener('error', (e) => {
        console.error("[Audio] Load test: FAILED", e);
        console.log("=== END DIAGNOSTIC REPORT ===");
      });
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
        <div className="mt-8 p-4 bg-muted rounded-md" data-testid="alarms-debug">
          <p className="text-sm text-muted-foreground">
            {alarms.length} alarm(s) loaded ({alarms.filter(a => a.isFixed).length} fixed)
          </p>
        </div>
      )}
    </div>
  );
}
