package com.feroapps.tradertime;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import java.util.Calendar;
import java.util.TimeZone;

public class FixedSessionScheduler {

    // Session IDs (stable keys)
    public static final String SYDNEY_START = "SYDNEY_START";
    public static final String TOKYO_SYDNEY_OVERLAP = "TOKYO_SYDNEY_OVERLAP";
    public static final String SYDNEY_END = "SYDNEY_END";
    public static final String TOKYO_LONDON_FRANKFURT_OVERLAP = "TOKYO_LONDON_FRANKFURT_OVERLAP";
    public static final String TOKYO_END = "TOKYO_END";
    public static final String NY_LONDON_FRANKFURT_OVERLAP = "NY_LONDON_FRANKFURT_OVERLAP";
    public static final String LONDON_FRANKFURT_END = "LONDON_FRANKFURT_END";
    public static final String NY_CLOSE_SYDNEY_OPENS = "NY_CLOSE_SYDNEY_OPENS";
    public static final String END_OF_WEEK_NY_CLOSE = "END_OF_WEEK_NY_CLOSE";

    // Hardcoded fixed sessions (UTC day-of-week: 0=Sun..6=Sat)
    private static final FixedSession[] SESSIONS = new FixedSession[] {
            new FixedSession(SYDNEY_START, 21, 0, new int[]{0}),
            new FixedSession(TOKYO_SYDNEY_OVERLAP, 0, 0, new int[]{1,2,3,4,5}),
            new FixedSession(SYDNEY_END, 6, 0, new int[]{1,2,3,4,5}),
            new FixedSession(TOKYO_LONDON_FRANKFURT_OVERLAP, 7, 0, new int[]{1,2,3,4,5}),
            new FixedSession(TOKYO_END, 9, 0, new int[]{1,2,3,4,5}),
            new FixedSession(NY_LONDON_FRANKFURT_OVERLAP, 13, 0, new int[]{1,2,3,4,5}),
            new FixedSession(LONDON_FRANKFURT_END, 16, 0, new int[]{1,2,3,4,5}),
            new FixedSession(NY_CLOSE_SYDNEY_OPENS, 21, 0, new int[]{1,2,3,4}),
            new FixedSession(END_OF_WEEK_NY_CLOSE, 22, 0, new int[]{5})
    };

    // Schedules the next occurrence for ALL fixed sessions
    public static void scheduleAllEnabledFixedSessions(Context context) {
        for (FixedSession s : SESSIONS) {
            scheduleNextForOneSession(context, s.sessionId);
        }
    }

    // Cancels ALL fixed session alarms
    public static void cancelAllFixedSessions(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        for (FixedSession s : SESSIONS) {
            PendingIntent pi = buildPendingIntent(context, s.sessionId, PendingIntent.FLAG_NO_CREATE);
            if (pi != null) {
                am.cancel(pi);
                pi.cancel();
            }
        }
    }

    // Schedules the next occurrence for one sessionId
    public static void scheduleNextForOneSession(Context context, String sessionId) {
        FixedSession s = findSession(sessionId);
        if (s == null) return;

        long triggerTimeMs = computeNextUtcTriggerTimeMs(s.utcHour, s.utcMinute, s.repeatDaysUtc);

        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

        PendingIntent pi = buildPendingIntent(context, s.sessionId, 0);

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTimeMs, pi);
            } else {
                am.setExact(AlarmManager.RTC_WAKEUP, triggerTimeMs, pi);
            }
        } catch (SecurityException e) {
            android.util.Log.w("FixedSessionScheduler", "SecurityException scheduling exact alarm for " + sessionId, e);
        }
    }

    private static PendingIntent buildPendingIntent(Context context, String sessionId, int extraFlags) {
        Intent i = new Intent(context, FixedSessionAlarmReceiver.class);
        i.putExtra(FixedSessionAlarmReceiver.EXTRA_SESSION_ID, sessionId);

        int requestCode = ("fixed_session_" + sessionId).hashCode();

        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        if (extraFlags != 0) flags = extraFlags | PendingIntent.FLAG_IMMUTABLE;

        return PendingIntent.getBroadcast(context, requestCode, i, flags);
    }

    private static FixedSession findSession(String sessionId) {
        for (FixedSession s : SESSIONS) {
            if (s.sessionId.equals(sessionId)) return s;
        }
        return null;
    }

    // Compute next occurrence in UTC matching repeat days + HH:MM
    private static long computeNextUtcTriggerTimeMs(int utcHour, int utcMinute, int[] repeatDaysUtc) {
        Calendar now = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
        int nowDow = now.get(Calendar.DAY_OF_WEEK); // 1=Sun..7=Sat
        int nowHour = now.get(Calendar.HOUR_OF_DAY);
        int nowMin = now.get(Calendar.MINUTE);

        for (int daysAhead = 0; daysAhead < 7; daysAhead++) {
            Calendar target = (Calendar) now.clone();
            target.add(Calendar.DAY_OF_YEAR, daysAhead);

            int targetDow = target.get(Calendar.DAY_OF_WEEK); // 1=Sun..7=Sat
            int targetUtcDow = targetDow - 1; // 0=Sun..6=Sat

            if (!contains(repeatDaysUtc, targetUtcDow)) continue;

            target.set(Calendar.HOUR_OF_DAY, utcHour);
            target.set(Calendar.MINUTE, utcMinute);
            target.set(Calendar.SECOND, 0);
            target.set(Calendar.MILLISECOND, 0);

            if (daysAhead == 0) {
                // if today, ensure it's in the future
                if (nowHour > utcHour || (nowHour == utcHour && nowMin >= utcMinute)) {
                    continue;
                }
            }

            return target.getTimeInMillis();
        }

        // fallback: schedule 7 days later at same time
        Calendar fallback = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
        fallback.add(Calendar.DAY_OF_YEAR, 7);
        fallback.set(Calendar.HOUR_OF_DAY, utcHour);
        fallback.set(Calendar.MINUTE, utcMinute);
        fallback.set(Calendar.SECOND, 0);
        fallback.set(Calendar.MILLISECOND, 0);
        return fallback.getTimeInMillis();
    }

    private static boolean contains(int[] arr, int v) {
        for (int x : arr) {
            if (x == v) return true;
        }
        return false;
    }

    private static class FixedSession {
        final String sessionId;
        final int utcHour;
        final int utcMinute;
        final int[] repeatDaysUtc;

        FixedSession(String sessionId, int utcHour, int utcMinute, int[] repeatDaysUtc) {
            this.sessionId = sessionId;
            this.utcHour = utcHour;
            this.utcMinute = utcMinute;
            this.repeatDaysUtc = repeatDaysUtc;
        }
    }
}
