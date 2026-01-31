package com.feroapps.tradertime;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class FixedSessionBootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (action == null) return;

        if (Intent.ACTION_BOOT_COMPLETED.equals(action)
                || "android.intent.action.QUICKBOOT_POWERON".equals(action)
                || "com.htc.intent.action.QUICKBOOT_POWERON".equals(action)) {
            FixedSessionScheduler.scheduleAllEnabledFixedSessions(context);
        }
    }
}
