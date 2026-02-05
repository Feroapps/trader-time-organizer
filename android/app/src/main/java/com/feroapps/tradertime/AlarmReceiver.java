package com.feroapps.tradertime;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

public class AlarmReceiver extends BroadcastReceiver {

    private static final String TAG = "AlarmReceiver";
    private static final String FALLBACK_CHANNEL_ID = "alarm_fallback";
    private static final int FALLBACK_NOTIFICATION_ID = 9999;

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

        Intent serviceIntent = new Intent(context, AlarmSoundService.class);
        serviceIntent.putExtra(AlarmSoundService.EXTRA_ALARM_ID, alarmId);
        serviceIntent.putExtra(AlarmSoundService.EXTRA_ALARM_LABEL, label);
        serviceIntent.putExtra(AlarmSoundService.EXTRA_SOUND_ID, soundId);

        Log.i(TAG, "Starting AlarmSoundService as foreground...");
        try {
            ContextCompat.startForegroundService(context, serviceIntent);
        } catch (Throwable t) {
            Log.e(TAG, "Failed to start AlarmSoundService foreground", t);
            Log.w(TAG, "Falling back to notification-only alert");
            showFallbackNotification(context, alarmId, label, soundId);
        }
        Log.i(TAG, "===== AlarmReceiver.onReceive COMPLETED =====");
    }

    private void showFallbackNotification(Context context, String alarmId, String label, String soundId) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) {
            Log.e(TAG, "NotificationManager is null, cannot show fallback notification");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel existing = nm.getNotificationChannel(FALLBACK_CHANNEL_ID);
            if (existing == null) {
                NotificationChannel channel = new NotificationChannel(
                        FALLBACK_CHANNEL_ID,
                        "Alarm Fallback",
                        NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Fallback notifications when alarm service cannot start");
                nm.createNotificationChannel(channel);
                Log.i(TAG, "Created fallback notification channel");
            }
        }

        Intent activityIntent = new Intent(context, AlarmActivity.class);
        activityIntent.putExtra(EXTRA_ALARM_ID, alarmId);
        activityIntent.putExtra(EXTRA_ALARM_LABEL, label);
        activityIntent.putExtra(EXTRA_SOUND_ID, soundId);
        activityIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                FALLBACK_NOTIFICATION_ID,
                activityIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        String notificationText = (label != null && !label.isEmpty()) ? label : "Alarm";

        Notification notification = new NotificationCompat.Builder(context, FALLBACK_CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_notification)
                .setContentTitle("Alarm")
                .setContentText(notificationText)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setFullScreenIntent(pendingIntent, true)
                .build();

        nm.notify(FALLBACK_NOTIFICATION_ID, notification);
        Log.i(TAG, "Fallback notification posted successfully");
    }
}

