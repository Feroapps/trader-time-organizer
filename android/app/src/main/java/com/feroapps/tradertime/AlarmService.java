package com.feroapps.tradertime;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;

public class AlarmService extends Service {
    private static final String TAG = "AlarmService";
    private static final String CHANNEL_ID = "alarm_service_channel";
    private static final int NOTIFICATION_ID = 1001;
    private static final int ALARM_TIMEOUT_MS = 120000;
    
    public static final String ACTION_START_ALARM = "com.feroapps.tradertime.START_ALARM";
    public static final String ACTION_STOP_ALARM = "com.feroapps.tradertime.STOP_ALARM";
    public static final String ACTION_SNOOZE_ALARM = "com.feroapps.tradertime.SNOOZE_ALARM";
    
    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;
    private Handler timeoutHandler;
    private Runnable timeoutRunnable;
    private String currentAlarmId;
    private int currentSnoozeMinutes;
    private String currentSoundId;
    private String currentAlarmLabel;
    
    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        timeoutHandler = new Handler(Looper.getMainLooper());
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }
        
        String action = intent.getAction();
        Log.d(TAG, "Service action: " + action);
        
        if (ACTION_START_ALARM.equals(action)) {
            startAlarm(intent);
        } else if (ACTION_STOP_ALARM.equals(action)) {
            stopAlarm();
        } else if (ACTION_SNOOZE_ALARM.equals(action)) {
            snoozeAlarm(intent);
        }
        
        return START_NOT_STICKY;
    }
    
    private void startAlarm(Intent intent) {
        currentAlarmId = intent.getStringExtra(AlarmReceiver.EXTRA_ALARM_ID);
        currentAlarmLabel = intent.getStringExtra(AlarmReceiver.EXTRA_ALARM_LABEL);
        currentSnoozeMinutes = intent.getIntExtra(AlarmReceiver.EXTRA_SNOOZE_MINUTES, 60);
        currentSoundId = intent.getStringExtra(AlarmReceiver.EXTRA_SOUND_ID);
        
        Notification notification = buildNotification();
        startForeground(NOTIFICATION_ID, notification);
        
        startSound();
        startVibration();
        startTimeout();
    }
    
    private void startSound() {
        try {
            if (mediaPlayer != null) {
                mediaPlayer.release();
            }
            
            Uri soundUri = getSoundUri(currentSoundId);
            
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build());
            mediaPlayer.setDataSource(this, soundUri);
            mediaPlayer.setLooping(true);
            mediaPlayer.prepare();
            mediaPlayer.start();
            
            Log.d(TAG, "Sound started");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start sound", e);
        }
    }
    
    private Uri getSoundUri(String soundId) {
        if (soundId == null || soundId.isEmpty() || "custom".equals(soundId)) {
            return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        }
        
        String soundFileName = "alert_" + soundId;
        int resId = getResources().getIdentifier(soundFileName, "raw", getPackageName());
        
        if (resId != 0) {
            return Uri.parse("android.resource://" + getPackageName() + "/" + resId);
        }
        
        return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
    }
    
    private void startVibration() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                VibratorManager vibratorManager = (VibratorManager) getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                vibrator = vibratorManager.getDefaultVibrator();
            } else {
                vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            }
            
            long[] pattern = {0, 1000, 500, 1000, 500};
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
            } else {
                vibrator.vibrate(pattern, 0);
            }
            
            Log.d(TAG, "Vibration started");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start vibration", e);
        }
    }
    
    private void startTimeout() {
        if (timeoutRunnable != null) {
            timeoutHandler.removeCallbacks(timeoutRunnable);
        }
        
        timeoutRunnable = () -> {
            Log.d(TAG, "Alarm timeout reached, stopping");
            stopAlarm();
        };
        
        timeoutHandler.postDelayed(timeoutRunnable, ALARM_TIMEOUT_MS);
    }
    
    private void stopAlarm() {
        Log.d(TAG, "Stopping alarm");
        
        if (timeoutRunnable != null) {
            timeoutHandler.removeCallbacks(timeoutRunnable);
            timeoutRunnable = null;
        }
        
        if (mediaPlayer != null) {
            try {
                mediaPlayer.stop();
                mediaPlayer.release();
            } catch (Exception e) {
                Log.e(TAG, "Error stopping media player", e);
            }
            mediaPlayer = null;
        }
        
        if (vibrator != null) {
            vibrator.cancel();
            vibrator = null;
        }
        
        stopForeground(true);
        stopSelf();
    }
    
    private void snoozeAlarm(Intent intent) {
        String alarmId = intent.getStringExtra(AlarmReceiver.EXTRA_ALARM_ID);
        int snoozeMinutes = intent.getIntExtra(AlarmReceiver.EXTRA_SNOOZE_MINUTES, 60);
        String soundId = intent.getStringExtra(AlarmReceiver.EXTRA_SOUND_ID);
        String alarmLabel = intent.getStringExtra(AlarmReceiver.EXTRA_ALARM_LABEL);
        
        Log.d(TAG, "Scheduling snooze for " + snoozeMinutes + " minutes");
        
        long snoozeTimeMs = System.currentTimeMillis() + (snoozeMinutes * 60 * 1000L);
        
        Intent alarmIntent = new Intent(this, AlarmReceiver.class);
        alarmIntent.setAction(AlarmReceiver.ACTION_ALARM_TRIGGER);
        alarmIntent.putExtra(AlarmReceiver.EXTRA_ALARM_ID, alarmId);
        alarmIntent.putExtra(AlarmReceiver.EXTRA_ALARM_LABEL, alarmLabel);
        alarmIntent.putExtra(AlarmReceiver.EXTRA_SNOOZE_MINUTES, snoozeMinutes);
        alarmIntent.putExtra(AlarmReceiver.EXTRA_SOUND_ID, soundId);
        
        int notificationId = getNotificationIdForAlarm(alarmId);
        
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                this,
                notificationId,
                alarmIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (alarmManager.canScheduleExactAlarms()) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, snoozeTimeMs, pendingIntent);
            } else {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, snoozeTimeMs, pendingIntent);
            }
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, snoozeTimeMs, pendingIntent);
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, snoozeTimeMs, pendingIntent);
        }
        
        stopAlarm();
    }
    
    private int getNotificationIdForAlarm(String alarmId) {
        return Math.abs(alarmId.hashCode()) % 2147483647;
    }
    
    private Notification buildNotification() {
        Intent stopIntent = new Intent(this, AlarmReceiver.class);
        stopIntent.setAction(AlarmReceiver.ACTION_ALARM_STOP);
        stopIntent.putExtra(AlarmReceiver.EXTRA_ALARM_ID, currentAlarmId);
        
        PendingIntent stopPendingIntent = PendingIntent.getBroadcast(
                this, 0, stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        Intent snoozeIntent = new Intent(this, AlarmReceiver.class);
        snoozeIntent.setAction(AlarmReceiver.ACTION_ALARM_SNOOZE);
        snoozeIntent.putExtra(AlarmReceiver.EXTRA_ALARM_ID, currentAlarmId);
        snoozeIntent.putExtra(AlarmReceiver.EXTRA_SNOOZE_MINUTES, currentSnoozeMinutes);
        snoozeIntent.putExtra(AlarmReceiver.EXTRA_SOUND_ID, currentSoundId);
        snoozeIntent.putExtra(AlarmReceiver.EXTRA_ALARM_LABEL, currentAlarmLabel);
        
        PendingIntent snoozePendingIntent = PendingIntent.getBroadcast(
                this, 1, snoozeIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        Intent openAppIntent = new Intent(Intent.ACTION_VIEW);
        openAppIntent.setData(android.net.Uri.parse("tradertime://alarm?alarmId=" + currentAlarmId));
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        
        PendingIntent openAppPendingIntent = PendingIntent.getActivity(
                this, 2, openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Trader Time Alert")
                .setContentText(currentAlarmLabel != null ? currentAlarmLabel : "Alert")
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setAutoCancel(false)
                .setContentIntent(openAppPendingIntent)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop", stopPendingIntent)
                .addAction(android.R.drawable.ic_popup_sync, "Snooze " + currentSnoozeMinutes + "m", snoozePendingIntent)
                .setFullScreenIntent(openAppPendingIntent, true)
                .build();
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Alarm Service",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Alarm notifications for user alerts");
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            channel.enableVibration(false);
            channel.setSound(null, null);
            
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    @Override
    public void onDestroy() {
        stopAlarm();
        super.onDestroy();
    }
}
