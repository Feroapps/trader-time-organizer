package com.feroapps.tradertime;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class FixedSessionAlarmReceiver extends BroadcastReceiver {

    public static final String EXTRA_SESSION_ID = "session_id";

    @Override
    public void onReceive(Context context, Intent intent) {
        String sessionId = intent.getStringExtra(EXTRA_SESSION_ID);
        if (sessionId == null) sessionId = "";

        // Delegate to notifier (will be created later)
        FixedSessionNotifier.showSessionNotification(context, sessionId);

        // Reschedule next occurrence (scheduler will be created later)
        FixedSessionScheduler.scheduleNextForOneSession(context, sessionId);
    }
}
