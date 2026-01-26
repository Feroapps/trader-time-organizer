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
        String label = call.getString("label", "Alert");
        Long triggerTimeMs = call.getLong("triggerTimeMs");
        Integer snoozeMinutes = call.getInt("snoozeMinutes", 60);
        String soundId = call.getString("soundId", "original");
        
        if (alarmId == null || triggerTimeMs == null) {
            call.reject("Missing required parameters: alarmId and triggerTimeMs");
            return;
        }
        
        Log.d(TAG, "Scheduling alarm: " + alarmId + " at " + triggerTimeMs);
        
        try {
            Context context = getContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            
            Intent intent = new Intent(context, AlarmReceiver.class);
            intent.setAction(AlarmReceiver.ACTION_ALARM_TRIGGER);
            intent.putExtra(AlarmReceiver.EXTRA_ALARM_ID, alarmId);
            intent.putExtra(AlarmReceiver.EXTRA_ALARM_LABEL, label);
            intent.putExtra(AlarmReceiver.EXTRA_SNOOZE_MINUTES, snoozeMinutes);
            intent.putExtra(AlarmReceiver.EXTRA_SOUND_ID, soundId);
            
            int notificationId = getNotificationIdForAlarm(alarmId);
            
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context,
                    notificationId,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (alarmManager.canScheduleExactAlarms()) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent);
                } else {
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent);
                    Log.w(TAG, "Cannot schedule exact alarms, using inexact alarm");
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent);
            }
            
            Log.d(TAG, "Alarm scheduled successfully: " + alarmId);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("alarmId", alarmId);
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to schedule alarm", e);
            call.reject("Failed to schedule alarm: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void cancelAlarm(PluginCall call) {
        String alarmId = call.getString("alarmId");
        
        if (alarmId == null) {
            call.reject("Missing required parameter: alarmId");
            return;
        }
        
        Log.d(TAG, "Cancelling alarm: " + alarmId);
        
        try {
            Context context = getContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            
            Intent intent = new Intent(context, AlarmReceiver.class);
            intent.setAction(AlarmReceiver.ACTION_ALARM_TRIGGER);
            
            int notificationId = getNotificationIdForAlarm(alarmId);
            
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context,
                    notificationId,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            
            alarmManager.cancel(pendingIntent);
            pendingIntent.cancel();
            
            Log.d(TAG, "Alarm cancelled successfully: " + alarmId);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("alarmId", alarmId);
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to cancel alarm", e);
            call.reject("Failed to cancel alarm: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void stopCurrentAlarm(PluginCall call) {
        Log.d(TAG, "Stopping current alarm");
        
        try {
            Context context = getContext();
            Intent serviceIntent = new Intent(context, AlarmService.class);
            serviceIntent.setAction(AlarmService.ACTION_STOP_ALARM);
            context.startService(serviceIntent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop alarm", e);
            call.reject("Failed to stop alarm: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void canScheduleExactAlarms(PluginCall call) {
        boolean canSchedule = true;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager alarmManager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
            canSchedule = alarmManager.canScheduleExactAlarms();
        }
        
        JSObject result = new JSObject();
        result.put("canSchedule", canSchedule);
        call.resolve(result);
    }
    
    private int getNotificationIdForAlarm(String alarmId) {
        return Math.abs(alarmId.hashCode()) % 2147483647;
    }
}
