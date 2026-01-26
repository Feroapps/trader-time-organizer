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
        String alarmId = intent.getStringExtra(EXTRA_ALARM_ID);
        String label = intent.getStringExtra(EXTRA_ALARM_LABEL);
        String soundId = intent.getStringExtra(EXTRA_SOUND_ID);

        Log.i(TAG, "Alarm triggered: " + alarmId + " - " + label);

        Intent serviceIntent = new Intent(context, AlarmSoundService.class);
        serviceIntent.putExtra(AlarmSoundService.EXTRA_ALARM_ID, alarmId);
        serviceIntent.putExtra(AlarmSoundService.EXTRA_ALARM_LABEL, label);
        serviceIntent.putExtra(AlarmSoundService.EXTRA_SOUND_ID, soundId);

        ContextCompat.startForegroundService(context, serviceIntent);
    }
}
