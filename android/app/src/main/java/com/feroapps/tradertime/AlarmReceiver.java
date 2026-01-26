package com.feroapps.tradertime;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class AlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "AlarmReceiver";
    
    public static final String ACTION_ALARM_TRIGGER = "com.feroapps.tradertime.ALARM_TRIGGER";
    public static final String ACTION_ALARM_STOP = "com.feroapps.tradertime.ALARM_STOP";
    public static final String ACTION_ALARM_SNOOZE = "com.feroapps.tradertime.ALARM_SNOOZE";
    
    public static final String EXTRA_ALARM_ID = "alarm_id";
    public static final String EXTRA_ALARM_LABEL = "alarm_label";
    public static final String EXTRA_SNOOZE_MINUTES = "snooze_minutes";
    public static final String EXTRA_SOUND_ID = "sound_id";
    
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Log.d(TAG, "Received action: " + action);
        
        if (ACTION_ALARM_TRIGGER.equals(action)) {
            handleAlarmTrigger(context, intent);
        } else if (ACTION_ALARM_STOP.equals(action)) {
            handleAlarmStop(context, intent);
        } else if (ACTION_ALARM_SNOOZE.equals(action)) {
            handleAlarmSnooze(context, intent);
        }
    }
    
    private void handleAlarmTrigger(Context context, Intent intent) {
        String alarmId = intent.getStringExtra(EXTRA_ALARM_ID);
        String alarmLabel = intent.getStringExtra(EXTRA_ALARM_LABEL);
        int snoozeMinutes = intent.getIntExtra(EXTRA_SNOOZE_MINUTES, 60);
        String soundId = intent.getStringExtra(EXTRA_SOUND_ID);
        
        Log.d(TAG, "Alarm triggered: " + alarmId + " - " + alarmLabel);
        
        Intent serviceIntent = new Intent(context, AlarmService.class);
        serviceIntent.setAction(AlarmService.ACTION_START_ALARM);
        serviceIntent.putExtra(EXTRA_ALARM_ID, alarmId);
        serviceIntent.putExtra(EXTRA_ALARM_LABEL, alarmLabel);
        serviceIntent.putExtra(EXTRA_SNOOZE_MINUTES, snoozeMinutes);
        serviceIntent.putExtra(EXTRA_SOUND_ID, soundId);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }
    
    private void handleAlarmStop(Context context, Intent intent) {
        String alarmId = intent.getStringExtra(EXTRA_ALARM_ID);
        Log.d(TAG, "Stopping alarm: " + alarmId);
        
        Intent serviceIntent = new Intent(context, AlarmService.class);
        serviceIntent.setAction(AlarmService.ACTION_STOP_ALARM);
        serviceIntent.putExtra(EXTRA_ALARM_ID, alarmId);
        context.startService(serviceIntent);
    }
    
    private void handleAlarmSnooze(Context context, Intent intent) {
        String alarmId = intent.getStringExtra(EXTRA_ALARM_ID);
        int snoozeMinutes = intent.getIntExtra(EXTRA_SNOOZE_MINUTES, 60);
        String soundId = intent.getStringExtra(EXTRA_SOUND_ID);
        String alarmLabel = intent.getStringExtra(EXTRA_ALARM_LABEL);
        
        Log.d(TAG, "Snoozing alarm: " + alarmId + " for " + snoozeMinutes + " minutes");
        
        Intent serviceIntent = new Intent(context, AlarmService.class);
        serviceIntent.setAction(AlarmService.ACTION_SNOOZE_ALARM);
        serviceIntent.putExtra(EXTRA_ALARM_ID, alarmId);
        serviceIntent.putExtra(EXTRA_SNOOZE_MINUTES, snoozeMinutes);
        serviceIntent.putExtra(EXTRA_SOUND_ID, soundId);
        serviceIntent.putExtra(EXTRA_ALARM_LABEL, alarmLabel);
        context.startService(serviceIntent);
    }
}
