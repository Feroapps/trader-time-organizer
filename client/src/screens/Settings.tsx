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
import { getAlarms, updateAlarm, deleteAlarm } from "@/storage/alarmsRepo";
import { AlertModal } from "@/components/AlertModal";
import { Pencil, Trash2, ChevronRight, Shield, AlertTriangle, Volume2, Play, Square } from "lucide-react";
import { alertSounds, getSelectedSoundId, setSelectedSoundId, playSound, stopSound } from "@/utils/soundLibrary";
import type { Alarm, CreateAlarmInput } from "@/types";

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

function formatRepeat(alarm: Alarm): string {
  const parts: string[] = [];
  if (alarm.repeatWeekly) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const [year, month, day] = alarm.dateUTC.split("-").map(Number);
    const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    parts.push(`Every ${dayNames[dow]}`);
  }
  if (alarm.repeatMonthly) {
    const day = parseInt(alarm.dateUTC.split("-")[2], 10);
    parts.push(`Monthly on ${day}${getOrdinalSuffix(day)}`);
  }
  if (parts.length === 0) {
    return `Once on ${alarm.dateUTC}`;
  }
  return parts.join(', ');
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function FixedAlarmRow({ alarm }: { alarm: Alarm }) {
  return (
    <div
      className="flex items-center justify-between p-3 bg-muted rounded-md"
      data-testid={`alarm-row-${alarm.id}`}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {alarm.label}
        </p>
        <p className="text-sm text-muted-foreground font-mono">
          {formatUtcTime(alarm.hourUTC, alarm.minuteUTC)} · Weekly
        </p>
      </div>
    </div>
  );
}

function UserAlertRow({ 
  alarm, 
  onEdit, 
  onDelete 
}: { 
  alarm: Alarm; 
  onEdit: () => void;
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
          {formatRepeat(alarm)}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={onEdit}
          data-testid={`button-edit-alert-${alarm.id}`}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onDelete}
          data-testid={`button-delete-alert-${alarm.id}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function Settings() {
  const [fixedAlarms, setFixedAlarms] = useState<Alarm[]>([]);
  const [userAlerts, setUserAlerts] = useState<Alarm[]>([]);
  const [fixedDialogOpen, setFixedDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alarm | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<Alarm | null>(null);
  const [selectedSound, setSelectedSound] = useState(getSelectedSoundId);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);

  useEffect(() => {
    loadAllAlarms();
  }, []);

  async function loadAllAlarms() {
    const allAlarms = await getAlarms();
    setFixedAlarms(allAlarms.filter(a => a.isFixed));
    setUserAlerts(allAlarms.filter(a => !a.isFixed));
  }

  function openEditModal(alarm: Alarm) {
    setEditingAlert(alarm);
    setEditModalOpen(true);
  }

  async function handleEditSave(alertData: CreateAlarmInput) {
    if (editingAlert) {
      await updateAlarm({ ...alertData, id: editingAlert.id });
      await loadAllAlarms();
    }
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
                  onEdit={() => openEditModal(alarm)}
                  onDelete={() => requestDelete(alarm)}
                />
              ))
            )}
          </div>
        </div>

        <div className="p-4 bg-muted rounded-md">
          <div className="flex items-center gap-3 mb-4">
            <Volume2 className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Alert Sound</p>
              <p className="text-sm text-muted-foreground">
                Choose your preferred alert sound
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {alertSounds.map((sound) => (
              <div
                key={sound.id}
                className={`flex items-center justify-between p-3 rounded-md cursor-pointer hover-elevate ${
                  selectedSound === sound.id ? "bg-primary/10 border border-primary" : "bg-background"
                }`}
                onClick={() => {
                  setSelectedSound(sound.id);
                  setSelectedSoundId(sound.id);
                }}
                data-testid={`sound-option-${sound.id}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{sound.name}</p>
                  <p className="text-sm text-muted-foreground">{sound.description}</p>
                </div>
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
              </div>
            ))}
          </div>
        </div>

        <Link href="/">
          <Button variant="outline" className="w-full" data-testid="button-back-home">
            Back to Home
          </Button>
        </Link>
      </div>

      <AlertModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSave={handleEditSave}
        editingAlert={editingAlert}
      />

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
