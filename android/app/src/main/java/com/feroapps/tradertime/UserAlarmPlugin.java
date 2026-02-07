package com.feroapps.tradertime;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;
import org.json.JSONException;

import java.util.HashSet;
import java.util.Set;

@CapacitorPlugin(name = "UserAlarm")
public class UserAlarmPlugin extends Plugin {

    private static final String TAG = "UserAlarmPlugin";
    private static final String PREFS_NAME = "TraderTimeAlarms";
    private static final String ALARMS_KEY = "scheduled_alarms";

    @PluginMethod
    public void scheduleAlarm(PluginCall call) {
        Log.i(TAG, "===== scheduleAlarm ENTERED =====");

        String alarmId = call.getString("alarmId");
        String label = call.getString("label");
        Long triggerTimeMs = call.getLong("triggerTimeMs");
        String soundId = call.getString("soundId", "original");

        long now = System.currentTimeMillis();

        Log.i(TAG, "alarmId: " + alarmId);
        Log.i(TAG, "label: " + label);
        Log.i(TAG, "triggerTimeMs: " + triggerTimeMs);
        Log.i(TAG, "now (ms): " + now);
        Log.i(TAG, "delta (sec): " + ((triggerTimeMs != null) ? (triggerTimeMs - now) / 1000 : "null"));
        Log.i(TAG, "soundId: " + soundId);
        Log.i(TAG, "Build.VERSION.SDK_INT: " + Build.VERSION.SDK_INT);

        if (alarmId == null || triggerTimeMs == null) {
            Log.e(TAG, "scheduleAlarm: missing required parameters");
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "Missing alarmId or triggerTimeMs");
            call.resolve(result);
            return;
        }

        if (triggerTimeMs <= now) {
            Log.e(TAG, "ERROR: triggerTimeMs is in the PAST! Not scheduling.");
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "Trigger time is in the past");
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
            Log.i(TAG, "requestCode (hashCode): " + requestCode);

            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                boolean canScheduleExact = alarmManager.canScheduleExactAlarms();
                Log.i(TAG, "canScheduleExactAlarms: " + canScheduleExact);

                if (canScheduleExact) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent);
                    Log.i(TAG, "SUCCESS: Scheduled EXACT alarm: " + alarmId + " at " + triggerTimeMs + " (in " + ((triggerTimeMs - now) / 1000) + " sec)");
                } else {
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent);
                    Log.w(TAG, "WARNING: Scheduled INEXACT alarm (no exact permission): " + alarmId);
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent);
                Log.i(TAG, "SUCCESS: Scheduled EXACT alarm (M+): " + alarmId + " at " + triggerTimeMs);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent);
                Log.i(TAG, "SUCCESS: Scheduled EXACT alarm (pre-M): " + alarmId);
            }

            saveAlarmToPrefs(context, alarmId, label, triggerTimeMs, soundId);
            Log.i(TAG, "Alarm saved to SharedPreferences");

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("alarmId", alarmId);
            call.resolve(result);

            Log.i(TAG, "===== scheduleAlarm COMPLETED SUCCESSFULLY =====");

        } catch (Exception e) {
            Log.e(TAG, "EXCEPTION in scheduleAlarm: " + alarmId, e);
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

            removeAlarmFromPrefs(context, alarmId);

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

            String ringingId = AlarmSoundService.getCurrentAlarmId();

            Intent stopIntent = new Intent(context, AlarmSoundService.class);
            stopIntent.setAction(AlarmSoundService.ACTION_STOP);
            context.startService(stopIntent);

            if (ringingId != null) {
                AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
                Intent intent = new Intent(context, AlarmReceiver.class);
                int requestCode = ringingId.hashCode();
                PendingIntent pi = PendingIntent.getBroadcast(
                    context,
                    requestCode,
                    intent,
                    PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
                );
                if (pi != null) {
                    alarmManager.cancel(pi);
                    pi.cancel();
                }
            }

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

    private void saveAlarmToPrefs(Context context, String alarmId, String label, long triggerTimeMs, String soundId) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            Set<String> alarmSet = new HashSet<>(prefs.getStringSet(ALARMS_KEY, new HashSet<>()));

            JSONObject alarmJson = new JSONObject();
            alarmJson.put("alarmId", alarmId);
            alarmJson.put("label", label != null ? label : "Trader Time Alert");
            alarmJson.put("triggerTimeMs", triggerTimeMs);
            alarmJson.put("soundId", soundId != null ? soundId : "original");

            alarmSet.removeIf(s -> {
                try {
                    JSONObject obj = new JSONObject(s);
                    return alarmId.equals(obj.getString("alarmId"));
                } catch (JSONException e) {
                    return false;
                }
            });

            alarmSet.add(alarmJson.toString());

            prefs.edit().putStringSet(ALARMS_KEY, alarmSet).apply();
            Log.i(TAG, "Saved alarm to prefs: " + alarmId);

        } catch (JSONException e) {
            Log.e(TAG, "Failed to save alarm to prefs", e);
        }
    }

    private void removeAlarmFromPrefs(Context context, String alarmId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        Set<String> alarmSet = new HashSet<>(prefs.getStringSet(ALARMS_KEY, new HashSet<>()));

        alarmSet.removeIf(s -> {
            try {
                JSONObject obj = new JSONObject(s);
                return alarmId.equals(obj.getString("alarmId"));
            } catch (JSONException e) {
                return false;
            }
        });

        prefs.edit().putStringSet(ALARMS_KEY, alarmSet).apply();
        Log.i(TAG, "Removed alarm from prefs: " + alarmId);
    }

    public static Set<String> getStoredAlarms(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getStringSet(ALARMS_KEY, new HashSet<>());
    }
}
