package com.feroapps.tradertime;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;

import androidx.core.app.NotificationCompat;

public class FixedSessionNotifier {

    private static final String CHANNEL_ID = "fixed_sessions_v1";

    private static int notificationIdForSession(String sessionId) {
        return ("fixed_session_" + sessionId).hashCode();
    }

    public static void showSessionNotification(Context context, String sessionId) {
        ensureChannel(context);

        String title = sessionTitle(sessionId);
        String text = "UTC session alert";

        Intent openIntent = context.getPackageManager()
                .getLaunchIntentForPackage(context.getPackageName());
        if (openIntent == null) {
            openIntent = new Intent();
        }

        PendingIntent pi = PendingIntent.getActivity(
                context,
                0,
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Bitmap bigImage = BitmapFactory.decodeResource(
                context.getResources(),
                R.drawable.ic_notification_large
        );

        Bitmap bigLargeIcon = BitmapFactory.decodeResource(
                context.getResources(),
                R.drawable.ic_notification_large
        );

         NotificationCompat.BigPictureStyle style
                = new NotificationCompat.BigPictureStyle();
        style.bigPicture(bigImage);
        style.bigLargeIcon(bigImage);

        NotificationCompat.Builder b = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_notification)
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(style)
                .setAutoCancel(true)
                .setOngoing(false)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pi);

        NotificationManager nm =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        nm.notify(notificationIdForSession(sessionId), b.build());
    }

    private static void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager nm =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        NotificationChannel existing = nm.getNotificationChannel(CHANNEL_ID);
        if (existing != null) return;

        NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID,
                "Fixed Session Alerts",
                NotificationManager.IMPORTANCE_HIGH
        );
        nm.createNotificationChannel(ch);
    }

    private static String sessionTitle(String sessionId) {
        switch (sessionId) {
            case "SYDNEY_START": return "Start of Sydney session";
            case "TOKYO_SYDNEY_OVERLAP": return "Tokyo + Sydney overlap";
            case "SYDNEY_END": return "End of Sydney session";
            case "TOKYO_LONDON_FRANKFURT_OVERLAP": return "Tokyo + London + Frankfurt overlap";
            case "TOKYO_END": return "End of Tokyo session";
            case "NY_LONDON_FRANKFURT_OVERLAP": return "New York + London + Frankfurt overlap";
            case "LONDON_FRANKFURT_END": return "End of London + Frankfurt session";
            case "NY_CLOSE_SYDNEY_OPENS": return "New York close / Sydney opens";
            case "END_OF_WEEK_NY_CLOSE": return "End of week - New York close";
            default: return "Session Alert";
        }
    }
}
