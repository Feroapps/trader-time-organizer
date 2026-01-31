package com.feroapps.tradertime;
import android.util.Log;
import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.view.KeyEvent;
import android.view.accessibility.AccessibilityEvent;

public class AlarmPowerAccessibilityService extends AccessibilityService {

    @Override
    protected boolean onKeyEvent(KeyEvent event) {
        Log.d("AlarmAcc", "key=" + event.getKeyCode() + " action=" + event.getAction());
        if (event.getAction() == KeyEvent.ACTION_DOWN &&
                (event.getKeyCode() == KeyEvent.KEYCODE_VOLUME_UP ||
                event.getKeyCode() == KeyEvent.KEYCODE_VOLUME_DOWN ||
                event.getKeyCode() == KeyEvent.KEYCODE_POWER)) {

            Intent i = new Intent(this, AlarmSoundService.class);
            i.setAction(AlarmSoundService.ACTION_STOP);
            startService(i);

            return true;
        }
        return super.onKeyEvent(event);
    }

    @Override public void onAccessibilityEvent(AccessibilityEvent event) {}
    @Override public void onInterrupt() {}
}

