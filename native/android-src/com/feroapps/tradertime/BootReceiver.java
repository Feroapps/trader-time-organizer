package com.feroapps.tradertime;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import org.json.JSONObject;
import org.json.JSONException;

import java.util.Set;

public class BootReceiver extends BroadcastReceiver {

    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Log.i(TAG, "BOOT_COMPLETED received - rescheduling alarms from SharedPreferences");
            rescheduleAllAlarms(context);
        }
    }

    private void rescheduleAllAlarms(Context context) {
        Set<String> storedAlarms = UserAlarmPlugin.getStoredAlarms(context);

        if (storedAlarms == null || storedAlarms.isEmpty()) {
            Log.i(TAG, "No stored alarms to reschedule");
            return;
        }

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        int rescheduledCount = 0;
        int skippedCount = 0;

        for (String alarmJson : storedAlarms) {
            try {
                JSONObject obj = new JSONObject(alarmJson);
                String alarmId = obj.getString("alarmId");
                String label = obj.optString("label", "Trader Time Alert");
                long triggerTimeMs = obj.getLong("triggerTimeMs");
                String soundId = obj.optString("soundId", "original");

                long now = System.currentTimeMillis();
                if (triggerTimeMs <= now) {
                    Log.w(TAG, "Skipping past alarm: " + alarmId + " (was scheduled for " + triggerTimeMs + ")");
                    skippedCount++;
                    continue;
                }

                Intent alarmIntent = new Intent(context, AlarmReceiver.class);
                alarmIntent.putExtra(AlarmReceiver.EXTRA_ALARM_ID, alarmId);
                alarmIntent.putExtra(AlarmReceiver.EXTRA_ALARM_LABEL, label);
                alarmIntent.putExtra(AlarmReceiver.EXTRA_SOUND_ID, soundId);

                int requestCode = alarmId.hashCode();
                PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context,
                    requestCode,
                    alarmIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    if (alarmManager.canScheduleExactAlarms()) {
                        alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent);
                    } else {
                        alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent);
                    }
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent);
                } else {
                    alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent);
                }

                rescheduledCount++;
                Log.i(TAG, "Rescheduled alarm: " + alarmId + " at " + triggerTimeMs);

            } catch (JSONException e) {
                Log.e(TAG, "Failed to parse stored alarm JSON", e);
            } catch (Exception e) {
                Log.e(TAG, "Failed to reschedule alarm", e);
            }
        }

        Log.i(TAG, "Boot reschedule complete: " + rescheduledCount + " rescheduled, " + skippedCount + " skipped (past)");
    }
}
