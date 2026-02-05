package com.feroapps.tradertime;

import android.Manifest;
import android.app.AlarmManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  private static final int REQUEST_POST_NOTIFICATIONS = 1001;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    registerPlugin(UserAlarmPlugin.class);
    registerPlugin(RewardedAdsPlugin.class);

    super.onCreate(savedInstanceState);

    requestNotificationPermissionIfNeeded();

    try {
      if (canScheduleExactAlarms(this)) {
        FixedSessionScheduler.scheduleAllEnabledFixedSessions(this);
      } else {
        Log.w("MainActivity", "Exact alarms not permitted; fixed sessions not scheduled on launch");
      }
    } catch (Throwable t) {
      Log.e("MainActivity", "Crash prevented while scheduling fixed sessions", t);
    }
  }

  private void requestNotificationPermissionIfNeeded() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
              != PackageManager.PERMISSION_GRANTED) {
        ActivityCompat.requestPermissions(this,
                new String[]{Manifest.permission.POST_NOTIFICATIONS},
                REQUEST_POST_NOTIFICATIONS);
      }
    }
  }

  private static boolean canScheduleExactAlarms(Context context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
      return am != null && am.canScheduleExactAlarms();
    }
    return true;
  }
}
