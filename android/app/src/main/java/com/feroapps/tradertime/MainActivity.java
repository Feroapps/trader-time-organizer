package com.feroapps.tradertime;

import android.app.AlarmManager;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(UserAlarmPlugin.class);
        registerPlugin(RewardedAdsPlugin.class);

        super.onCreate(savedInstanceState);

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

    private static boolean canScheduleExactAlarms(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            return am != null && am.canScheduleExactAlarms();
        }
        return true;
    }
}