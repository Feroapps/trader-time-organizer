package com.feroapps.tradertime;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * BootReceiver - BroadcastReceiver for device boot completion
 * 
 * This receiver is triggered when the device finishes booting.
 * Its purpose is to reschedule all user-created alarms that were lost
 * when the device was powered off.
 * 
 * Note: Session Alerts (isFixed === true) are NOT rescheduled here.
 * They are managed separately via LocalNotifications.
 * 
 * Required AndroidManifest.xml entries:
 * - <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
 * - <receiver android:name=".BootReceiver" android:exported="true">
 *       <intent-filter>
 *           <action android:name="android.intent.action.BOOT_COMPLETED" />
 *       </intent-filter>
 *   </receiver>
 * 
 * TODO: Implement the following:
 * 1. Receive BOOT_COMPLETED broadcast
 * 2. Read stored alarms from SharedPreferences or trigger WebView reload
 * 3. Reschedule only user-created alarms (isFixed === false)
 * 4. Use AlarmManager to reschedule each alarm
 * 
 * Note: Since alarm data is stored in WebView's localforage (IndexedDB),
 * the most reliable approach is to:
 * - Store alarm data redundantly in SharedPreferences when scheduling
 * - Read from SharedPreferences on boot
 * - Reschedule via AlarmManager
 * 
 * Alternatively, the app can trigger rescheduleAllAlarms() on next app launch
 * via capacitorInit.ts, which is already implemented.
 */
public class BootReceiver extends BroadcastReceiver {
    
    private static final String TAG = "BootReceiver";
    private static final String PREFS_NAME = "TraderTimeAlarms";
    private static final String KEY_ALARMS_JSON = "scheduled_alarms";
    
    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            // TODO: Implement boot-time alarm rescheduling
            //
            // Option 1: Read alarms from SharedPreferences and reschedule
            //
            // SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            // String alarmsJson = prefs.getString(KEY_ALARMS_JSON, "[]");
            //
            // try {
            //     JSONArray alarms = new JSONArray(alarmsJson);
            //     for (int i = 0; i < alarms.length(); i++) {
            //         JSONObject alarm = alarms.getJSONObject(i);
            //         
            //         // Skip Session Alerts (isFixed === true)
            //         if (alarm.optBoolean("isFixed", false)) {
            //             continue;
            //         }
            //         
            //         // Skip disabled alarms
            //         if (!alarm.optBoolean("isEnabled", true)) {
            //             continue;
            //         }
            //         
            //         // Reschedule via AlarmManager
            //         scheduleAlarm(
            //             context,
            //             alarm.getString("id"),
            //             alarm.getString("label"),
            //             alarm.getLong("triggerTimeMs"),
            //             alarm.getInt("snoozeMinutes"),
            //             alarm.getString("soundId")
            //         );
            //     }
            // } catch (JSONException e) {
            //     Log.e(TAG, "Failed to parse alarms JSON", e);
            // }
            //
            // Option 2: Simply log and rely on capacitorInit.ts on next app launch
            // Log.i(TAG, "Boot completed - alarms will be rescheduled on next app launch");
        }
    }
    
    private void scheduleAlarm(
        Context context,
        String alarmId,
        String label,
        long triggerTimeMs,
        int snoozeMinutes,
        String soundId
    ) {
        // TODO: Implement AlarmManager scheduling (same logic as UserAlarmPlugin)
        //
        // AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        //
        // Intent intent = new Intent(context, AlarmReceiver.class);
        // intent.putExtra(AlarmReceiver.EXTRA_ALARM_ID, alarmId);
        // intent.putExtra(AlarmReceiver.EXTRA_ALARM_LABEL, label);
        // intent.putExtra(AlarmReceiver.EXTRA_SNOOZE_MINUTES, snoozeMinutes);
        // intent.putExtra(AlarmReceiver.EXTRA_SOUND_ID, soundId);
        //
        // int requestCode = alarmId.hashCode();
        // PendingIntent pendingIntent = PendingIntent.getBroadcast(
        //     context,
        //     requestCode,
        //     intent,
        //     PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        // );
        //
        // // Only schedule if trigger time is in the future
        // if (triggerTimeMs > System.currentTimeMillis()) {
        //     if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        //         AlarmManager.AlarmClockInfo alarmClockInfo = new AlarmManager.AlarmClockInfo(
        //             triggerTimeMs,
        //             pendingIntent
        //         );
        //         alarmManager.setAlarmClock(alarmClockInfo, pendingIntent);
        //     } else {
        //         alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent);
        //     }
        //     Log.i(TAG, "Rescheduled alarm: " + alarmId);
        // }
    }
    
    /**
     * Helper method to save alarm data to SharedPreferences.
     * Call this from UserAlarmPlugin.scheduleAlarm() to persist alarm data
     * for boot-time rescheduling.
     */
    public static void saveAlarmToPrefs(Context context, String alarmId, String alarmJson) {
        // TODO: Add alarm to SharedPreferences JSON array
        //
        // SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        // String existingJson = prefs.getString(KEY_ALARMS_JSON, "[]");
        //
        // try {
        //     JSONArray alarms = new JSONArray(existingJson);
        //     
        //     // Remove existing entry with same ID
        //     for (int i = alarms.length() - 1; i >= 0; i--) {
        //         if (alarms.getJSONObject(i).getString("id").equals(alarmId)) {
        //             alarms.remove(i);
        //         }
        //     }
        //     
        //     // Add new entry
        //     alarms.put(new JSONObject(alarmJson));
        //     
        //     prefs.edit().putString(KEY_ALARMS_JSON, alarms.toString()).apply();
        // } catch (JSONException e) {
        //     Log.e(TAG, "Failed to save alarm to prefs", e);
        // }
    }
    
    /**
     * Helper method to remove alarm data from SharedPreferences.
     * Call this from UserAlarmPlugin.cancelAlarm() to remove persisted alarm data.
     */
    public static void removeAlarmFromPrefs(Context context, String alarmId) {
        // TODO: Remove alarm from SharedPreferences JSON array
        //
        // SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        // String existingJson = prefs.getString(KEY_ALARMS_JSON, "[]");
        //
        // try {
        //     JSONArray alarms = new JSONArray(existingJson);
        //     
        //     for (int i = alarms.length() - 1; i >= 0; i--) {
        //         if (alarms.getJSONObject(i).getString("id").equals(alarmId)) {
        //             alarms.remove(i);
        //         }
        //     }
        //     
        //     prefs.edit().putString(KEY_ALARMS_JSON, alarms.toString()).apply();
        // } catch (JSONException e) {
        //     Log.e(TAG, "Failed to remove alarm from prefs", e);
        // }
    }
}
