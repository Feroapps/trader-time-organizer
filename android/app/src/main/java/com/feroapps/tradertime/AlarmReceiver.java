package com.feroapps.tradertime;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import androidx.core.content.ContextCompat;

public class AlarmReceiver extends BroadcastReceiver {

    private static final String TAG = "AlarmReceiver";

    public static final String EXTRA_ALARM_ID = "alarm_id";
    public static final String EXTRA_ALARM_LABEL = "alarm_label";
    public static final String EXTRA_SOUND_ID = "sound_id";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.i(TAG, "===== AlarmReceiver.onReceive ENTERED =====");
        Log.i(TAG, "Current time (ms): " + System.currentTimeMillis());

        String alarmId = intent.getStringExtra(EXTRA_ALARM_ID);
        String label = intent.getStringExtra(EXTRA_ALARM_LABEL);
        String soundId = intent.getStringExtra(EXTRA_SOUND_ID);

        Log.i(TAG, "alarmId: " + alarmId);
        Log.i(TAG, "label: " + label);
        Log.i(TAG, "soundId: " + soundId);

        // Start AlarmActivity to wake screen and open app
        Intent alarmActivityIntent = new Intent(context, AlarmActivity.class);
        alarmActivityIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        alarmActivityIntent.putExtra(AlarmSoundService.EXTRA_ALARM_LABEL, label);
        context.startActivity(alarmActivityIntent);

        Intent serviceIntent = new Intent(context, AlarmSoundService.class);
        serviceIntent.putExtra(AlarmSoundService.EXTRA_ALARM_ID, alarmId);
        serviceIntent.putExtra(AlarmSoundService.EXTRA_ALARM_LABEL, label);
        serviceIntent.putExtra(AlarmSoundService.EXTRA_SOUND_ID, soundId);

        Log.i(TAG, "Starting AlarmSoundService as foreground...");
        ContextCompat.startForegroundService(context, serviceIntent);
        Log.i(TAG, "===== AlarmReceiver.onReceive COMPLETED =====");
    }
}
