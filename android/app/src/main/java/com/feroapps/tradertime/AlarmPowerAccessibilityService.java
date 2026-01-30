package com.feroapps.tradertime;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.view.KeyEvent;
import android.view.accessibility.AccessibilityEvent;

public class AlarmPowerAccessibilityService extends AccessibilityService {

    @Override
    protected boolean onKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_DOWN
                && event.getKeyCode() == KeyEvent.KEYCODE_POWER) {

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
