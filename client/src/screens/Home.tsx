import { useEffect, useState } from "react";
import { UtcRuler, LocalTimeRuler, type AlertMarker } from "@/components";
import { getAlarms, seedFixedAlarms, clearAllAlarms } from "@/storage/alarmsRepo";
import { startScheduler, stopScheduler } from "@/utils/alarmScheduler";
import { getDailyNote, type DailyNote } from "@/data/dailyNotes";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import type { Alarm } from "@/types";

const RESEED_VERSION = 2; // Increment this to force reseed

function getUtcDayOfWeek(): number {
  return new Date().getUTCDay();
}

export function Home() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [notesOpen, setNotesOpen] = useState(false);
  const [dailyNote, setDailyNote] = useState<DailyNote>(() => getDailyNote(getUtcDayOfWeek()));

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

  useEffect(() => {
    const interval = setInterval(() => {
      const currentDay = getUtcDayOfWeek();
      if (currentDay !== dailyNote.dayOfWeek) {
        setDailyNote(getDailyNote(currentDay));
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [dailyNote.dayOfWeek]);

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

      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setNotesOpen(!notesOpen)}
          className="gap-2"
          data-testid="button-toggle-notes"
        >
          <FileText className="w-4 h-4" />
          Notes
          {notesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {notesOpen && (
          <div
            className="mt-3 p-4 bg-muted rounded-md border"
            data-testid="daily-notes-section"
          >
            <h3 className="font-semibold text-lg" data-testid="text-note-title">
              {dailyNote.title} — {dailyNote.subtitle}
            </h3>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {dailyNote.bullets.map((bullet, index) => (
                <li key={index} className="flex gap-2" data-testid={`text-note-bullet-${index}`}>
                  <span className="text-foreground">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
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
