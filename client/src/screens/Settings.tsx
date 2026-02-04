import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { getAlarms, deleteAlarm, toggleAlarm } from "@/storage/alarmsRepo";
import { Trash2, ChevronRight, Shield, AlertTriangle, Volume2, Play, Square, Check, FileText, Settings2 } from "lucide-react";
import { alertSounds, getSelectedSoundId, setSelectedSoundId, playSound, stopSound, getSoundById, getCustomSoundName, getCustomSoundDescription } from "@/utils/soundLibrary";
import { isAndroidPlatform, openAndroidNotificationSettings, openAndroidBatteryOptimizationSettings, checkExactAlarmPermission, openExactAlarmSettings, openAndroidAlarmSoundSettings } from "@/utils/nativeNotifications";
import type { Alarm } from "@/types";

function formatUtcTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} UTC`;
}

function formatLocalTime(utcHour: number, utcMinute: number): string {
  const now = new Date();
  const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), utcHour, utcMinute));
  const localHours = utcDate.getHours();
  const localMinutes = utcDate.getMinutes();
  return `${localHours.toString().padStart(2, '0')}:${localMinutes.toString().padStart(2, '0')} Local`;
}

function formatDays(days: number[]): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  if (days.length === 7) {
    return 'Every day';
  }
  if (days.length === 5 && !days.includes(0) && !days.includes(6)) {
    return 'Mon–Fri';
  }
  if (days.length === 2 && days.includes(0) && days.includes(6)) {
    return 'Weekends';
  }
  if (days.length === 1) {
    return `Every ${dayNames[days[0]]}`;
  }
  
  const sortedDays = [...days].sort((a, b) => a - b);
  return sortedDays.map(d => dayNames[d]).join(', ');
}

function ExactAlarmPermissionButton() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  useEffect(() => {
    checkExactAlarmPermission().then(result => {
      setHasPermission(result.granted);
    });
  }, []);
  
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkExactAlarmPermission().then(result => {
          setHasPermission(result.granted);
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);
  
  if (hasPermission === null) {
    return null;
  }
  
  if (hasPermission) {
    return (
      <div className="flex items-center gap-2 mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-md">
        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
        <span className="text-sm text-green-700 dark:text-green-300">
          Exact alarm permission granted
        </span>
      </div>
    );
  }
  
  return (
    <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-md">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
          Exact alarm permission required
        </span>
      </div>
      <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
        Android 12+ requires this permission for user-created alarms to fire at exact times. Without it, alarms may be delayed.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => openExactAlarmSettings()}
        data-testid="button-open-exact-alarm-settings"
      >
        <Settings2 className="w-4 h-4 mr-2" />
        Grant Exact Alarm Permission
      </Button>
    </div>
  );
}

function FixedAlarmRow({ alarm, onToggle }: { alarm: Alarm; onToggle: (enabled: boolean) => void }) {
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
          {formatUtcTime(alarm.hourUTC, alarm.minuteUTC)} · {formatDays(alarm.repeatDays)}
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

function UserAlertRow({ 
  alarm, 
  onDelete 
}: { 
  alarm: Alarm; 
  onDelete: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between p-3 bg-muted rounded-md gap-2"
      data-testid={`user-alert-row-${alarm.id}`}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {alarm.label}
        </p>
        <div className="flex flex-wrap gap-x-3 text-sm text-muted-foreground font-mono">
          <span>{formatUtcTime(alarm.hourUTC, alarm.minuteUTC)}</span>
          <span className="text-gray-400">{formatLocalTime(alarm.hourUTC, alarm.minuteUTC)}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDays(alarm.repeatDays)}
        </p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={onDelete}
        data-testid={`button-delete-alert-${alarm.id}`}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function Settings() {
  const [fixedAlarms, setFixedAlarms] = useState<Alarm[]>([]);
  const [userAlerts, setUserAlerts] = useState<Alarm[]>([]);
  const [fixedDialogOpen, setFixedDialogOpen] = useState(false);
  const [soundDialogOpen, setSoundDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<Alarm | null>(null);
  const [selectedSound, setSelectedSound] = useState(getSelectedSoundId);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);

  const selectedSoundName = getSoundById(selectedSound)?.name || "Default";

  function handleSoundSelect(soundId: string) {
    stopSound();
    setSelectedSound(soundId);
    setSelectedSoundId(soundId);
    setPlayingPreview(null);
    setSoundDialogOpen(false);
  }

  function handleSoundDialogClose(open: boolean) {
    if (!open) {
      stopSound();
      setPlayingPreview(null);
    }
    setSoundDialogOpen(open);
  }

  useEffect(() => {
    loadAllAlarms();
  }, []);

  async function loadAllAlarms() {
    const allAlarms = await getAlarms();
    setFixedAlarms(allAlarms.filter(a => a.isFixed));
    setUserAlerts(allAlarms.filter(a => !a.isFixed));
  }

  async function handleFixedToggle(alarmId: string, enabled: boolean) {
    await toggleAlarm(alarmId, enabled);
    await loadAllAlarms();
  }

  function requestDelete(alarm: Alarm) {
    setAlertToDelete(alarm);
    setDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    if (alertToDelete) {
      await deleteAlarm(alertToDelete.id);
      await loadAllAlarms();
      setAlertToDelete(null);
    }
    setDeleteConfirmOpen(false);
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6" data-testid="text-settings-title">Settings</h1>

      <div className="space-y-6">
        <Dialog open={fixedDialogOpen} onOpenChange={setFixedDialogOpen}>
          <DialogTrigger asChild>
            <div
              className="flex items-center justify-between p-4 bg-muted rounded-md cursor-pointer hover-elevate"
              data-testid="button-fixed-alarms"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Session Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Built-in trading session notifications
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Session Alerts</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto py-2">
              {fixedAlarms.map((alarm) => (
                <FixedAlarmRow
                  key={alarm.id}
                  alarm={alarm}
                  onToggle={(enabled) => handleFixedToggle(alarm.id, enabled)}
                />
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <div className="p-4 bg-muted rounded-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Your Alerts</p>
              <p className="text-sm text-muted-foreground">
                Custom alerts you've created
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {userAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No custom alerts yet
              </p>
            ) : (
              userAlerts.map((alarm) => (
                <UserAlertRow
                  key={alarm.id}
                  alarm={alarm}
                  onDelete={() => requestDelete(alarm)}
                />
              ))
            )}
          </div>
        </div>

        <Dialog open={soundDialogOpen} onOpenChange={handleSoundDialogClose}>
          <DialogTrigger asChild>
            <div
              className="flex items-center justify-between p-4 bg-muted rounded-md cursor-pointer hover-elevate"
              data-testid="button-alert-sound"
            >
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Alert Sound</p>
                  <p className="text-sm text-muted-foreground">{selectedSoundName}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Choose Alert Sound</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-2">
              {alertSounds.map((sound) => (
                <div
                  key={sound.id}
                  className={`flex items-center justify-between p-3 rounded-md cursor-pointer hover-elevate ${
                    selectedSound === sound.id ? "bg-primary/10" : "bg-muted"
                  }`}
                  onClick={() => handleSoundSelect(sound.id)}
                  data-testid={`sound-option-${sound.id}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {selectedSound === sound.id ? (
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium">{sound.id === 'custom' ? getCustomSoundName() : sound.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {sound.id === 'custom' ? getCustomSoundDescription() : sound.description}
                      </p>
                    </div>
                  </div>
                  {sound.id !== 'custom' && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (playingPreview === sound.id) {
                          stopSound();
                          setPlayingPreview(null);
                        } else {
                          setPlayingPreview(sound.id);
                          playSound(sound.id).then(() => setPlayingPreview(null));
                        }
                      }}
                      data-testid={`button-preview-${sound.id}`}
                    >
                      {playingPreview === sound.id ? (
                        <Square className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
              <>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => {
                    if (isAndroidPlatform()) {
                      openAndroidAlarmSoundSettings();
                    }
                  }}
                  data-testid="button-open-android-settings"
                >
                  <Settings2 className="w-4 h-4 mr-2" />
                  Open Android Alarm Sound Settings
                </Button>
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => {
                    if (isAndroidPlatform()) {
                      openAndroidBatteryOptimizationSettings();
                    }
                  }}
                  data-testid="button-open-battery-settings"
                >
                  <Settings2 className="w-4 h-4 mr-2" />
                  Open Battery Optimization Settings
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Set Battery usage to Unrestricted / Not optimized to prevent delays.
                </p>
                <ExactAlarmPermissionButton />
              </>
            </div>
          </DialogContent>
        </Dialog>

        <div className="p-4 bg-muted rounded-md">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Legal</p>
              <p className="text-sm text-muted-foreground">
                Privacy, terms, and disclaimers
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Link href="/settings/privacy-policy">
              <div
                className="flex items-center justify-between p-3 bg-background rounded-md cursor-pointer hover-elevate"
                data-testid="link-privacy-policy"
              >
                <span className="font-medium">Privacy Policy</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/settings/terms-of-use">
              <div
                className="flex items-center justify-between p-3 bg-background rounded-md cursor-pointer hover-elevate"
                data-testid="link-terms-of-use"
              >
                <span className="font-medium">Terms of Use</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/settings/disclaimer">
              <div
                className="flex items-center justify-between p-3 bg-background rounded-md cursor-pointer hover-elevate"
                data-testid="link-disclaimer"
              >
                <span className="font-medium">Disclaimer</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
          </div>
        </div>

        <Link href="/">
          <Button variant="outline" className="w-full" data-testid="button-back-home">
            Back to Home
          </Button>
        </Link>
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the alert "{alertToDelete?.label}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} data-testid="button-confirm-delete">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
