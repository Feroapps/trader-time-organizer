import { useEffect, useState } from "react";
import { UtcRuler, LocalTimeRuler, NoteModal, type AlertMarker } from "@/components";
import { getAlarms, seedFixedAlarms, clearAllAlarms, createAlarm } from "@/storage/alarmsRepo";
import { createNote } from "@/storage/notesRepo";
import { startScheduler, stopScheduler, setFixedAlarmCallback } from "@/utils/alarmScheduler";
import { getDailyNote, type DailyNote } from "@/data/dailyNotes";
import { getTradingContext, closedMessage, type TradingContext } from "@/data/tradingContext";
import { getMarketStatus } from "@/utils/marketHours";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, FileText, Plus, StickyNote, Eye } from "lucide-react";
import { AlertModal } from "@/components/AlertModal";
import { FixedAlarmModal } from "@/components/FixedAlarmModal";
import { AdRequiredModal } from "@/components/AdRequiredModal";
import { showInterstitialAd } from "@/utils/adService";
import { useToast } from "@/hooks/use-toast";
import type { Alarm, CreateAlarmInput, CreateNoteInput } from "@/types";

const RESEED_VERSION = 2; // Increment this to force reseed

function getUtcDayOfWeek(): number {
  return new Date().getUTCDay();
}

function getUtcHour(): number {
  return new Date().getUTCHours();
}

export function Home() {
  const { toast } = useToast();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [notesOpen, setNotesOpen] = useState(false);
  const [addAlertOpen, setAddAlertOpen] = useState(false);
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [fixedAlarmModalOpen, setFixedAlarmModalOpen] = useState(false);
  const [dailyNote, setDailyNote] = useState<DailyNote>(() => getDailyNote(getUtcDayOfWeek()));
  const [tradingContext, setTradingContext] = useState<TradingContext | null>(() => {
    const status = getMarketStatus();
    return getTradingContext(getUtcHour(), status.isOpen);
  });
  const [isMarketOpen, setIsMarketOpen] = useState(() => getMarketStatus().isOpen);
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [pendingAlertData, setPendingAlertData] = useState<CreateAlarmInput | null>(null);
  const [pairsAdModalOpen, setPairsAdModalOpen] = useState(false);
  const [pairsUnlocked, setPairsUnlocked] = useState(false);

  function handleAlertSaveRequest(alertData: CreateAlarmInput) {
    setPendingAlertData(alertData);
    setAdModalOpen(true);
  }

  function handleAdContinue() {
    if (!pendingAlertData) return;
    showInterstitialAd(async () => {
      await createAlarm(pendingAlertData);
      const allAlarms = await getAlarms();
      setAlarms(allAlarms);
      setPendingAlertData(null);
      toast({ title: "Alert saved" });
    });
  }

  function handleAdCancel() {
    setPendingAlertData(null);
  }

  function handleViewPairsRequest() {
    setPairsAdModalOpen(true);
  }

  function handlePairsAdContinue() {
    showInterstitialAd(() => {
      setPairsUnlocked(true);
    });
  }

  function handlePairsAdCancel() {
  }

  async function handleAddNote(noteData: CreateNoteInput) {
    await createNote(noteData);
    toast({ title: "Note saved", description: "Your note has been saved and will appear in the Calendar." });
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

    setFixedAlarmCallback(() => {
      setFixedAlarmModalOpen(true);
    });
    
    return () => {
      stopScheduler();
      setFixedAlarmCallback(null);
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

  const utcAlerts: AlertMarker[] = alarms
    .filter((alarm) => !alarm.isFixed)
    .map((alarm) => ({
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNotesOpen(!notesOpen)}
              className="gap-2 bg-[#166534] text-white dark:bg-[#166534] dark:text-white"
              data-testid="button-toggle-notes"
            >
              <FileText className="w-4 h-4" />
              Notes
              {notesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              onClick={() => setAddNoteOpen(true)}
              className="gap-2"
              data-testid="button-add-note"
            >
              <StickyNote className="w-4 h-4" />
              Add Note
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
              {pairsUnlocked ? (
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
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewPairsRequest}
                  className="gap-2"
                  data-testid="button-view-trading-pairs"
                >
                  <Eye className="w-4 h-4" />
                  View Trading Pairs
                </Button>
              )}
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
        onSave={handleAlertSaveRequest}
      />

      <NoteModal
        open={addNoteOpen}
        onOpenChange={setAddNoteOpen}
        onSave={handleAddNote}
      />

      <FixedAlarmModal
        open={fixedAlarmModalOpen}
        onOpenChange={setFixedAlarmModalOpen}
      />

      <AdRequiredModal
        open={adModalOpen}
        onOpenChange={setAdModalOpen}
        title="Ad Required"
        message="To keep Trader Time Organizer free, a short ad will be shown before saving this alert."
        onContinue={handleAdContinue}
        onCancel={handleAdCancel}
      />

      <AdRequiredModal
        open={pairsAdModalOpen}
        onOpenChange={setPairsAdModalOpen}
        title="Ad Required"
        message="Viewing session-based trading pairs is supported by a short ad."
        onContinue={handlePairsAdContinue}
        onCancel={handlePairsAdCancel}
      />
    </div>
  );
}
