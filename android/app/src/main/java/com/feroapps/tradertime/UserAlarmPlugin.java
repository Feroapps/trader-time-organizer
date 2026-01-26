package com.feroapps.tradertime;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "UserAlarm")
public class UserAlarmPlugin extends Plugin {

    private static final String TAG = "UserAlarmPlugin";

    @PluginMethod
    public void scheduleAlarm(PluginCall call) {
        String alarmId = call.getString("alarmId");
        String label = call.getString("label");
        Long triggerTimeMs = call.getLong("triggerTimeMs");
        String soundId = call.getString("soundId", "original");

        if (alarmId == null || triggerTimeMs == null) {
            Log.e(TAG, "scheduleAlarm: missing required parameters");
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "Missing alarmId or triggerTimeMs");
            call.resolve(result);
            return;
        }

        try {
            Context context = getContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

            Intent intent = new Intent(context, AlarmReceiver.class);
            intent.putExtra(AlarmReceiver.EXTRA_ALARM_ID, alarmId);
            intent.putExtra(AlarmReceiver.EXTRA_ALARM_LABEL, label);
            intent.putExtra(AlarmReceiver.EXTRA_SOUND_ID, soundId);

            int requestCode = alarmId.hashCode();
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (alarmManager.canScheduleExactAlarms()) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent);
                    Log.i(TAG, "Scheduled exact alarm: " + alarmId + " at " + triggerTimeMs);
                } else {
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent);
                    Log.w(TAG, "Scheduled inexact alarm (no permission): " + alarmId);
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent);
                Log.i(TAG, "Scheduled exact alarm: " + alarmId + " at " + triggerTimeMs);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent);
                Log.i(TAG, "Scheduled exact alarm (pre-M): " + alarmId);
            }

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("alarmId", alarmId);
            call.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "Failed to schedule alarm: " + alarmId, e);
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", e.getMessage());
            call.resolve(result);
        }
    }

    @PluginMethod
    public void cancelAlarm(PluginCall call) {
        String alarmId = call.getString("alarmId");

        if (alarmId == null) {
            Log.e(TAG, "cancelAlarm: missing alarmId");
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "Missing alarmId");
            call.resolve(result);
            return;
        }

        try {
            Context context = getContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

            Intent intent = new Intent(context, AlarmReceiver.class);
            int requestCode = alarmId.hashCode();
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
            );

            if (pendingIntent != null) {
                alarmManager.cancel(pendingIntent);
                pendingIntent.cancel();
                Log.i(TAG, "Cancelled alarm: " + alarmId);
            } else {
                Log.w(TAG, "No pending intent found for alarm: " + alarmId);
            }

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("alarmId", alarmId);
            call.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "Failed to cancel alarm: " + alarmId, e);
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", e.getMessage());
            call.resolve(result);
        }
    }

    @PluginMethod
    public void stopCurrentAlarm(PluginCall call) {
        try {
            Context context = getContext();
            Intent stopIntent = new Intent(context, AlarmSoundService.class);
            stopIntent.setAction(AlarmSoundService.ACTION_STOP);
            context.startService(stopIntent);

            Log.i(TAG, "Stop current alarm requested");

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "Failed to stop current alarm", e);
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", e.getMessage());
            call.resolve(result);
        }
    }

    @PluginMethod
    public void canScheduleExactAlarms(PluginCall call) {
        boolean canSchedule = true;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            Context context = getContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            canSchedule = alarmManager.canScheduleExactAlarms();
        }

        JSObject result = new JSObject();
        result.put("canSchedule", canSchedule);
        call.resolve(result);
    }
}
