package com.feroapps.tradertime;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;
import androidx.core.app.NotificationCompat;

public class AlarmSoundService extends Service {

    private static final String TAG = "AlarmSoundService";

    public static final String ACTION_STOP = "com.feroapps.tradertime.ACTION_STOP";

    public static final String EXTRA_ALARM_ID = "alarm_id";
    public static final String EXTRA_ALARM_LABEL = "alarm_label";
    public static final String EXTRA_SOUND_ID = "sound_id";

    private static final String CHANNEL_ID = "alarm_sound_channel";
    private static final int NOTIFICATION_ID = 2001;
    private static final long ALARM_TIMEOUT_MS = 120000;

    private MediaPlayer mediaPlayer;
    private Handler timeoutHandler;
    private Runnable timeoutRunnable;

    private String currentAlarmId;
    private String currentLabel;
    private String currentSoundId;

    @Override
    public void onCreate() {
        super.onCreate();
        timeoutHandler = new Handler(Looper.getMainLooper());
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(TAG, "===== AlarmSoundService.onStartCommand ENTERED =====");
        Log.i(TAG, "Current time (ms): " + System.currentTimeMillis());
        
        if (intent == null) {
            Log.w(TAG, "Intent is null - stopping self");
            stopSelf();
            return START_NOT_STICKY;
        }

        String action = intent.getAction();
        Log.i(TAG, "Action: " + action);
        
        if (ACTION_STOP.equals(action)) {
            Log.i(TAG, "STOP action received - stopping alarm");
            stopAlarm();
            return START_NOT_STICKY;
        }

        currentAlarmId = intent.getStringExtra(EXTRA_ALARM_ID);
        currentLabel = intent.getStringExtra(EXTRA_ALARM_LABEL);
        currentSoundId = intent.getStringExtra(EXTRA_SOUND_ID);

        Log.i(TAG, "alarmId: " + currentAlarmId);
        Log.i(TAG, "label: " + currentLabel);
        Log.i(TAG, "soundId: " + currentSoundId);

        if (currentLabel == null) {
            currentLabel = "Trader Time Alert";
        }
        if (currentSoundId == null) {
            currentSoundId = "original";
        }

        Log.i(TAG, "Building notification...");
        Notification notification = buildNotification();
        
        Log.i(TAG, "Starting foreground service...");
        startForeground(NOTIFICATION_ID, notification);

        Log.i(TAG, "Playing alarm sound...");
        playAlarmSound();
        
        Log.i(TAG, "Scheduling 120s timeout...");
        scheduleTimeout();

        Log.i(TAG, "===== AlarmSoundService.onStartCommand COMPLETED =====");
        return START_NOT_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopAlarmSound();
        cancelTimeout();
        Log.i(TAG, "Service destroyed");
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Alarm Sound",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Ongoing alarm sound notification");
            channel.setSound(null, null);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildNotification() {
        Intent stopIntent = new Intent(this, AlarmSoundService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPendingIntent = PendingIntent.getService(
            this,
            0,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openPendingIntent = PendingIntent.getActivity(
            this,
            1,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Trader Time Alert")
            .setContentText(currentLabel)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setContentIntent(openPendingIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "STOP", stopPendingIntent)
            .build();
    }

    private void playAlarmSound() {
        stopAlarmSound();

        int soundRes = getSoundResource(currentSoundId);
        if (soundRes == 0) {
            soundRes = getSoundResource("original");
        }
        if (soundRes == 0) {
            Log.e(TAG, "No sound resource found, using system default");
            return;
        }

        try {
            mediaPlayer = MediaPlayer.create(this, soundRes);
            if (mediaPlayer != null) {
                mediaPlayer.setLooping(true);
                AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
                mediaPlayer.setAudioAttributes(attrs);
                mediaPlayer.start();
                Log.i(TAG, "Alarm sound started: " + currentSoundId);
            } else {
                Log.e(TAG, "MediaPlayer.create returned null for soundId: " + currentSoundId);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to play alarm sound", e);
        }
    }

    private void stopAlarmSound() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.release();
            } catch (Exception e) {
                Log.e(TAG, "Error stopping MediaPlayer", e);
            }
            mediaPlayer = null;
        }
    }

    private void stopAlarm() {
        stopAlarmSound();
        cancelTimeout();
        stopForeground(true);
        stopSelf();
        Log.i(TAG, "Alarm stopped");
    }

    private void scheduleTimeout() {
        cancelTimeout();
        timeoutRunnable = () -> {
            Log.w(TAG, "Alarm auto-stopped after 120 seconds");
            stopAlarm();
        };
        timeoutHandler.postDelayed(timeoutRunnable, ALARM_TIMEOUT_MS);
    }

    private void cancelTimeout() {
        if (timeoutHandler != null && timeoutRunnable != null) {
            timeoutHandler.removeCallbacks(timeoutRunnable);
            timeoutRunnable = null;
        }
    }

    private int getSoundResource(String soundId) {
        if (soundId == null) {
            return 0;
        }
        switch (soundId) {
            case "original":
                return getResId("alert_original");
            case "classic":
                return getResId("alert_classic");
            case "chime":
                return getResId("alert_chime");
            case "bell":
                return getResId("alert_bell");
            case "ping":
                return getResId("alert_ping");
            case "tone":
                return getResId("alert_tone");
            default:
                return getResId("alert_original");
        }
    }

    private int getResId(String resName) {
        return getResources().getIdentifier(resName, "raw", getPackageName());
    }
}
