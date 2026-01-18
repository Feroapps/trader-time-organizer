import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { getAlarms, toggleAlarm, updateAlarm, deleteAlarm } from "@/storage/alarmsRepo";
import { AlertModal } from "@/components/AlertModal";
import { Pencil, Trash2 } from "lucide-react";
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

function formatDays(days: number[]): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (days.length === 7) {
    return 'Every day';
  }
  if (days.length === 5 && !days.includes(0) && !days.includes(6)) {
    return 'Mon-Fri';
  }
  if (days.length === 2 && days.includes(0) && days.includes(6)) {
    return 'Weekends';
  }
  if (days.length === 1 && days[0] === 0) {
    return 'Sun only';
  }
  return days.map(d => dayNames[d]).join(', ');
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
  onToggle, 
  onEdit, 
  onDelete 
}: { 
  alarm: Alarm; 
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between p-3 bg-muted rounded-md gap-2"
      data-testid={`user-alert-row-${alarm.id}`}
    >
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${!alarm.isEnabled ? 'text-muted-foreground' : ''}`}>
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
        <Switch
          checked={alarm.isEnabled}
          onCheckedChange={onToggle}
          data-testid={`switch-user-alert-${alarm.id}`}
        />
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

  async function handleUserToggle(alarmId: string, enabled: boolean) {
    await toggleAlarm(alarmId, enabled);
    await loadAllAlarms();
  }

  function handleEditClick(alarm: Alarm) {
    setEditingAlert(alarm);
    setEditModalOpen(true);
  }

  async function handleEditSave(alertData: CreateAlarmInput) {
    if (editingAlert) {
      const updatedAlarm: Alarm = {
        ...editingAlert,
        ...alertData,
      };
      await updateAlarm(updatedAlarm);
      await loadAllAlarms();
    }
    setEditingAlert(null);
  }

  async function handleDelete(alarmId: string) {
    await deleteAlarm(alarmId);
    await loadAllAlarms();
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold" data-testid="text-page-title">Settings</h1>
      <p className="text-muted-foreground mt-2" data-testid="text-page-description">
        Manage your preferences and alerts
      </p>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4" data-testid="text-my-alerts-title">My Alerts</h2>
          {userAlerts.length === 0 ? (
            <p className="text-muted-foreground text-sm" data-testid="text-no-alerts">
              No custom alerts yet. Add alerts from the Home screen.
            </p>
          ) : (
            <div className="space-y-2" data-testid="user-alerts-list">
              {userAlerts.map((alert) => (
                <UserAlertRow
                  key={alert.id}
                  alarm={alert}
                  onToggle={(enabled) => handleUserToggle(alert.id, enabled)}
                  onEdit={() => handleEditClick(alert)}
                  onDelete={() => handleDelete(alert.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <Dialog open={fixedDialogOpen} onOpenChange={setFixedDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-manage-alarms">
                Manage Fixed Alarms
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Fixed Alarms</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 mt-4">
                {fixedAlarms.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Loading alarms...</p>
                ) : (
                  fixedAlarms.map((alarm) => (
                    <FixedAlarmRow
                      key={alarm.id}
                      alarm={alarm}
                      onToggle={(enabled) => handleFixedToggle(alarm.id, enabled)}
                    />
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </section>
      </div>

      <AlertModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSave={handleEditSave}
        editingAlert={editingAlert}
      />
    </div>
  );
}
