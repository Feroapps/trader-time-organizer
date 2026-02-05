package com.feroapps.tradertime;
import android.view.KeyEvent;
import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.WindowManager;
import android.os.PowerManager;
import android.app.KeyguardManager;
public class AlarmActivity extends Activity {
    private static final String TAG = "AlarmActivity";

    private final BroadcastReceiver finishReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (AlarmSoundService.ACTION_FINISH_ALARM_ACTIVITY.equals(intent.getAction())) {
                finish();
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_alarm);

        String label = getIntent().getStringExtra(AlarmSoundService.EXTRA_ALARM_LABEL);
        if (label == null) label = "Trader Time Alert";

        ((android.widget.TextView) findViewById(R.id.tvAlarmLabel)).setText(label);

        findViewById(R.id.btnStop).setOnClickListener(v -> {
            android.content.Intent i = new android.content.Intent(this, AlarmSoundService.class);
            i.setAction(AlarmSoundService.ACTION_STOP);
            startService(i);
            finish();
        });
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        } else {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                            | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                            | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                            | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            );
        }
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm != null) {
            PowerManager.WakeLock wl = pm.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK
                            | PowerManager.ACQUIRE_CAUSES_WAKEUP
                            | PowerManager.ON_AFTER_RELEASE,
                    "tradertime:alarm_wake");
            wl.acquire(30_000);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

            KeyguardManager km = (KeyguardManager) getSystemService(KEYGUARD_SERVICE);
            if (km != null) {
                km.requestDismissKeyguard(this, null);
            }
        }

        registerReceiver(finishReceiver, new IntentFilter(AlarmSoundService.ACTION_FINISH_ALARM_ACTIVITY));
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        try {
            unregisterReceiver(finishReceiver);
        } catch (IllegalArgumentException e) {
            Log.w(TAG, "finishReceiver already unregistered", e);
        }
    }

    private boolean stopSent = false;
    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int keyCode = event.getKeyCode();
        if (!stopSent
                && event.getAction() == KeyEvent.ACTION_DOWN
                && (keyCode == KeyEvent.KEYCODE_VOLUME_UP || keyCode == KeyEvent.KEYCODE_VOLUME_DOWN)) {
            stopSent = true;
            Intent stopIntent = new Intent(this, AlarmSoundService.class);
            stopIntent.setAction(AlarmSoundService.ACTION_STOP);
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(stopIntent);
                } else {
                    startService(stopIntent);
                }
            } catch (Throwable t) {
                Log.e(TAG, "startForegroundService failed, falling back to startService", t);
                try {
                    startService(stopIntent);
                } catch (Throwable t2) {
                    Log.e(TAG, "startService fallback also failed", t2);
                }
            }
            finish();
            return true;
        }
        return super.dispatchKeyEvent(event);
    }
}