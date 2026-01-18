import { useEffect, useState } from "react";
import { UtcRuler, LocalTimeRuler, type AlertMarker } from "@/components";
import { getAlarms, seedFixedAlarms, clearAllAlarms, createAlarm } from "@/storage/alarmsRepo";
import { startScheduler, stopScheduler } from "@/utils/alarmScheduler";
import { getDailyNote, type DailyNote } from "@/data/dailyNotes";
import { getTradingContext, closedMessage, type TradingContext } from "@/data/tradingContext";
import { getMarketStatus } from "@/utils/marketHours";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, FileText, Plus } from "lucide-react";
import { AlertModal } from "@/components/AlertModal";
import type { Alarm, CreateAlarmInput } from "@/types";

const RESEED_VERSION = 2; // Increment this to force reseed

function getUtcDayOfWeek(): number {
  return new Date().getUTCDay();
}

function getUtcHour(): number {
  return new Date().getUTCHours();
}

export function Home() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [notesOpen, setNotesOpen] = useState(false);
  const [addAlertOpen, setAddAlertOpen] = useState(false);
  const [dailyNote, setDailyNote] = useState<DailyNote>(() => getDailyNote(getUtcDayOfWeek()));
  const [tradingContext, setTradingContext] = useState<TradingContext | null>(() => {
    const status = getMarketStatus();
    return getTradingContext(getUtcHour(), status.isOpen);
  });
  const [isMarketOpen, setIsMarketOpen] = useState(() => getMarketStatus().isOpen);

  async function handleAddAlert(alertData: CreateAlarmInput) {
    await createAlarm(alertData);
    const allAlarms = await getAlarms();
    setAlarms(allAlarms);
  }

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

  useEffect(() => {
    const interval = setInterval(() => {
      const status = getMarketStatus();
      setIsMarketOpen(status.isOpen);
      setTradingContext(getTradingContext(getUtcHour(), status.isOpen));
    }, 60000);
    return () => clearInterval(interval);
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

      <div className="mb-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
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

          <Button
            size="sm"
            onClick={() => setAddAlertOpen(true)}
            className="gap-2"
            data-testid="button-add-alert"
          >
            <Plus className="w-4 h-4" />
            Add Alert
          </Button>
        </div>

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
          <LocalTimeRuler alerts={utcAlerts} />
        </section>
        <section>
          <UtcRuler alerts={utcAlerts} />
        </section>
        <section
          className="p-4 bg-muted rounded-md border"
          data-testid="trading-context-frame"
        >
          {tradingContext ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-semibold" data-testid="text-context-time-range">
                  {tradingContext.timeRange} UTC
                </span>
                {tradingContext.liquidity && (
                  <span className="text-sm text-muted-foreground" data-testid="text-context-liquidity">
                    Liquidity: {tradingContext.liquidity}
                  </span>
                )}
              </div>
              <div className="text-sm" data-testid="text-context-behavior">
                <span className="text-muted-foreground">Behavior: </span>
                <span className="font-medium">{tradingContext.behavior}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                {tradingContext.majorPairs && (
                  <div data-testid="context-major-pairs">
                    <span className="text-muted-foreground">Major pairs: </span>
                    <span className="font-mono">{tradingContext.majorPairs.join(", ")}</span>
                  </div>
                )}
                {tradingContext.minorPairs && (
                  <div data-testid="context-minor-pairs">
                    <span className="text-muted-foreground">Minor pairs: </span>
                    <span className="font-mono">{tradingContext.minorPairs.join(", ")}</span>
                  </div>
                )}
                {tradingContext.reactivePairs && (
                  <div data-testid="context-reactive-pairs">
                    <span className="text-muted-foreground">Most reactive pairs: </span>
                    <span className="font-mono">{tradingContext.reactivePairs.join(", ")}</span>
                  </div>
                )}
                {tradingContext.liquidPairs && (
                  <div data-testid="context-liquid-pairs">
                    <span className="text-muted-foreground">Most liquid pairs: </span>
                    <span className="font-mono">{tradingContext.liquidPairs.join(", ")}</span>
                  </div>
                )}
                {tradingContext.additionalPairs && (
                  <div data-testid="context-additional-pairs">
                    <span className="text-muted-foreground">Additional active pairs: </span>
                    <span className="font-mono">{tradingContext.additionalPairs.join(", ")}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4" data-testid="context-closed-message">
              <p className="whitespace-pre-line text-muted-foreground">
                {closedMessage}
              </p>
            </div>
          )}
        </section>
      </div>

      <AlertModal
        open={addAlertOpen}
        onOpenChange={setAddAlertOpen}
        onSave={handleAddAlert}
      />
    </div>
  );
}
